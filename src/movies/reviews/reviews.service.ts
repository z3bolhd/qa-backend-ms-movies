import { JwtPayload } from "@auth/interfaces";
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Role } from "@prisma/client";
import { PrismaService } from "@prismadb/prisma.service";
import { PinoLogger } from "nestjs-pino";

import { CreateReviewDto, EditReviewDto } from "./dto";

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ReviewsService.name);
  }

  async findAll(movieId: number) {
    this.logger.info({ movie: { movieId } }, "Find movie reviews");

    if (!(await this.checkIsMovieExists(movieId))) {
      this.logger.error({ movie: { movieId } }, "Find movie reviews failed. Movie not found");
      throw new NotFoundException("Фильм не найден");
    }

    const reviews = await this.prismaService.review.findMany({
      where: {
        movieId: movieId,
      },
      select: {
        userId: true,
        text: true,
        rating: true,
        createdAt: true,
        hidden: true,
        user: {
          select: {
            fullName: true,
          },
        },
      },
    });

    this.logger.info({ movie: { movieId } }, "Found movie reviews");

    return reviews;
  }

  async create(user: JwtPayload, movieId: number, dto: CreateReviewDto) {
    this.logger.info(
      {
        user: { id: user.id, email: user.email, roles: user.roles },
        movie: { id: movieId },
        review: dto,
      },
      "Create review",
    );

    if (!(await this.checkIsMovieExists(movieId))) {
      this.logger.error(
        { user, movie: { id: movieId }, review: dto },
        "Create review failed. Movie not found",
      );
      throw new NotFoundException("Create review failed. Movie not found");
    }

    if (await this.checkIsReviewExists(user.id, movieId)) {
      this.logger.error(
        { user, movie: { id: movieId }, review: dto },
        "Create review failed. Review already exists",
      );
      throw new ConflictException("Вы уже оставляли отзыв к этому фильму");
    }

    const review = await this.prismaService.review
      .create({
        data: {
          movieId,
          userId: user.id,
          ...dto,
        },
        select: {
          userId: true,
          text: true,
          rating: true,
          hidden: true,
          createdAt: true,
          user: {
            select: {
              fullName: true,
            },
          },
        },
      })
      .catch((e) => {
        this.logger.debug(e, "Failed to create review");
        this.logger.error(
          { user, movie: { id: movieId }, review: dto },
          "Create review failed with wrong data",
        );
        throw new BadRequestException("Неверные данные");
      });

    await this.updateMovieRating(movieId);

    this.logger.info({ user, movie: { id: movieId }, review: dto }, "Created review");

    return review;
  }

  async edit(user: JwtPayload, movieId: number, dto: EditReviewDto) {
    this.logger.info({ user, movie: { id: movieId }, review: dto }, "Edit review");

    if (!(await this.checkIsMovieExists(movieId))) {
      this.logger.error({ movie: { movieId } }, "Find movie reviews failed. Movie not found");
      throw new NotFoundException("Фильм не найден");
    }

    if (!(await this.checkIsReviewExists(user.id, movieId))) {
      this.logger.error(
        { user, movie: { id: movieId }, review: dto },
        "Edit review failed. Review not found",
      );
      throw new NotFoundException("Отзыв не найден");
    }

    const review = await this.prismaService.review
      .update({
        where: {
          userId_movieId: {
            movieId,
            userId: user.id,
          },
        },
        data: {
          ...dto,
        },
        select: {
          userId: true,
          text: true,
          rating: true,
          hidden: true,
          createdAt: true,
          user: {
            select: {
              fullName: true,
            },
          },
        },
      })
      .catch((e) => {
        this.logger.debug(e, "Failed to edit review");
        this.logger.error(
          { user, movie: { id: movieId }, review: dto },
          "Edit review failed with wrong data",
        );
        throw new BadRequestException("Отзыв не найден");
      });

    await this.updateMovieRating(movieId);

    this.logger.info({ user, movie: { id: movieId }, review: dto }, "Edited review");

    return review;
  }

  async delete(user: JwtPayload, movieId: number, userId: string) {
    this.logger.info({ user, movie: { id: movieId }, review: { userId } }, "Delete review");

    const isAdmin = user.roles.some((role) => role === Role.ADMIN || role === Role.SUPER_ADMIN);

    if (!(await this.checkIsMovieExists(movieId))) {
      this.logger.error({ movie: { movieId } }, "Delete reviews failed. Movie not found");
      throw new NotFoundException("Фильм не найден");
    }

    if (!isAdmin && user.id !== userId) {
      this.logger.error(
        { user, movie: { id: movieId }, review: { userId } },
        "Delete review failed. User does not own the review",
      );
      throw new ForbiddenException();
    }

    const userIdReview = isAdmin && userId ? userId : user.id;

    if (!(await this.checkIsReviewExists(userIdReview, movieId))) {
      this.logger.error(
        { user, movie: { id: movieId }, review: { userId } },
        "Delete review failed. Review not found",
      );
      throw new NotFoundException("Отзыв не найден");
    }

    const review = await this.prismaService.review
      .delete({
        where: {
          userId_movieId: {
            userId: user.id,
            movieId,
          },
        },
        select: {
          userId: true,
          text: true,
          rating: true,
          createdAt: true,
          user: {
            select: {
              fullName: true,
            },
          },
        },
      })
      .catch((e) => {
        this.logger.debug(e, "Failed to delete review");
        this.logger.error(
          { user, movie: { id: movieId }, review: { userId } },
          "Delete review failed. Review not found",
        );
        throw new NotFoundException("Отзыв не найден");
      });

    await this.updateMovieRating(movieId);

    return review;
  }

  async hide(movieId: number, userId: string) {
    return this.showOrHide(movieId, userId, true);
  }

  async show(movieId: number, userId: string) {
    return this.showOrHide(movieId, userId, false);
  }

  private async showOrHide(movieId: number, userId: string, isHidden: boolean) {
    if (isHidden) {
      this.logger.info({ user: { userId }, movie: { movieId } }, "Hiding review");
    } else {
      this.logger.info({ user: { userId }, movie: { movieId } }, "Showing review");
    }

    if (!(await this.checkIsMovieExists(movieId))) {
      this.logger.error(
        { movie: { movieId } },
        `Failed to ${isHidden ? "hide" : "show"}. Movie not found`,
      );
      throw new NotFoundException("Фильм не найден");
    }

    if (!(await this.checkIsReviewExists(userId, movieId))) {
      this.logger.error(
        { user: { userId }, movie: { movieId } },
        `Failed to ${isHidden ? "hide" : "show"}. Review not found`,
      );
      throw new NotFoundException("Отзыв не найден");
    }

    const review = await this.prismaService.review
      .update({
        where: {
          userId_movieId: {
            userId,
            movieId,
          },
        },
        data: {
          hidden: isHidden,
        },
        select: {
          userId: true,
          text: true,
          rating: true,
          createdAt: true,
          hidden: true,
          user: {
            select: {
              fullName: true,
            },
          },
        },
      })
      .catch((e) => {
        this.logger.debug(e, "Failed to hide review");
        this.logger.error(
          { user: { userId }, movie: { movieId } },
          `Failed to ${isHidden ? "hide" : "show"} review`,
        );
        throw new NotFoundException("Неверные данные");
      });

    return review;
  }

  async updateMovieRating(movieId: number) {
    this.logger.info({ movie: { id: movieId } }, "Update movie rating");

    const reviews = await this.prismaService.review.findMany({
      where: {
        movieId,
      },
    });

    const ratingSum = reviews.reduce((acc, review) => acc + review.rating, 0);

    const rating = Math.round((ratingSum / reviews.length) * 10) / 10;

    await this.prismaService.movie
      .update({
        where: {
          id: movieId,
        },
        data: {
          rating: rating || 0,
        },
      })
      .catch((e) => {
        this.logger.debug(e, "Failed to update movie rating");
        this.logger.error({ movie: { id: movieId } }, "Failed to update movie rating");
        throw new NotFoundException("Фильм не найден");
      });
  }

  private async checkIsMovieExists(movieId: number): Promise<boolean> {
    if (!movieId) {
      this.logger.error({ movie: { id: movieId } }, "Movie not found");
      throw new NotFoundException("Фильм не найден");
    }

    const movie = await this.prismaService.movie
      .findUnique({
        where: {
          id: movieId,
        },
      })
      .catch(() => null);

    return movie !== null;
  }

  private async checkIsReviewExists(userId: string, movieId: number): Promise<boolean> {
    const review = await this.prismaService.review
      .findUnique({
        where: {
          userId_movieId: {
            userId,
            movieId,
          },
        },
      })
      .catch(() => null);

    return review !== null;
  }
}
