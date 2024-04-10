import { JwtPayload } from "@auth/interfaces";
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Role } from "@prisma/client";
import { PrismaService } from "@prisma/prisma.service";
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

  async getMovieReviews(id: number) {
    this.logger.info({ movie: { id } }, "Find movie reviews");
    const movie = await this.prismaService.movie.findUnique({
      where: {
        id,
      },
    });

    if (!movie) {
      this.logger.error({ movie: { id } }, "Find movie reviews failed. Movie not found");
      throw new NotFoundException("Фильм не найден");
    }

    const reviews = await this.prismaService.review.findMany({
      where: {
        movieId: id,
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
    });

    this.logger.info({ movie: { id } }, "Found movie reviews");

    return reviews;
  }

  async create(user: JwtPayload, movieId: number, dto: CreateReviewDto) {
    this.logger.info({ user, movie: { id: movieId }, review: dto }, "Create review");
    const _review = await this.prismaService.review.findUnique({
      where: {
        userId_movieId: {
          userId: user.id,
          movieId,
        },
      },
    });

    if (_review) {
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
          "Create review failed. Movie not found",
        );
        throw new NotFoundException("Фильм не найден");
      });

    await this.updateMovieRating(movieId);

    this.logger.info({ user, movie: { id: movieId }, review: dto }, "Created review");

    return review;
  }

  async edit(user: JwtPayload, movieId: number, dto: EditReviewDto) {
    this.logger.info({ user, movie: { id: movieId }, review: dto }, "Edit review");
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
      })
      .catch((e) => {
        this.logger.debug(e, "Failed to edit review");
        this.logger.error({ user, movie: { id: movieId }, review: dto }, "Edit review failed");
        throw new NotFoundException("Отзыв не найден");
      });

    await this.updateMovieRating(movieId);

    this.logger.info({ user, movie: { id: movieId }, review: dto }, "Edited review");

    return review;
  }

  async delete(user: JwtPayload, movieId: number, userId: string) {
    this.logger.info({ user, movie: { id: movieId }, review: { userId } }, "Delete review");
    const isAdmin = user.roles.some((role) => role === Role.ADMIN || role === Role.SUPER_ADMIN);

    if (isAdmin && userId) {
      const review = await this.prismaService.review
        .delete({
          where: {
            userId_movieId: {
              userId,
              movieId,
            },
          },
        })
        .catch((e) => {
          this.logger.debug(e, "Failed to delete review");
          this.logger.error(
            { user, movie: { id: movieId }, review: { userId } },
            "Delete review failed",
          );
          throw new NotFoundException("Отзыв не найден");
        });

      await this.updateMovieRating(movieId);

      this.logger.info({ user, movie: { id: movieId }, review: { userId } }, "Deleted review");

      return review;
    }

    if (userId && user.id !== userId) {
      this.logger.error(
        { user, movie: { id: movieId }, review: { userId } },
        "Delete review failed. User does not own the review",
      );
      throw new ForbiddenException();
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

  async showOrHide(movieId: number, userId: string, isHidden: boolean) {
    if (isHidden) {
      this.logger.info({ user: { userId }, movie: { movieId } }, "Hiding review");
    } else {
      this.logger.info({ user: { userId }, movie: { movieId } }, "Showing review");
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
        throw new NotFoundException("Отзыв не найден");
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
        this.logger.debug(e, "Failed to update rating");
        this.logger.error({ movie: { id: movieId } }, "Failed to update rating");
        throw new NotFoundException("Фильм не найден");
      });
  }
}
