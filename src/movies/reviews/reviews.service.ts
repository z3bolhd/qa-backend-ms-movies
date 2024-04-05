import { JwtPayload } from "@auth/interfaces";
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { Role } from "@prisma/client";
import { PrismaService } from "@prisma/prisma.service";
import { CreateReviewDto, EditReviewDto } from "./dto";

@Injectable()
export class ReviewsService {
  constructor(private readonly prismaService: PrismaService) {}

  private readonly logger = new Logger(ReviewsService.name);

  async getMovieReviews(id: number) {
    this.logger.log(`Finding reviews for movie with id: ${id}`);
    const movie = await this.prismaService.movie.findUnique({
      where: {
        id,
      },
    });

    if (!movie) {
      this.logger.error(`Failed to get reviews for movie with id: ${id}. Movie not found`);
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

    this.logger.log(`Found ${reviews.length} reviews for movie with id: ${id}`);

    return reviews;
  }

  async create(user: JwtPayload, movieId: number, dto: CreateReviewDto) {
    this.logger.log(`Creating review for movie with id: ${movieId}`);
    const _review = await this.prismaService.review.findUnique({
      where: {
        userId_movieId: {
          userId: user.id,
          movieId,
        },
      },
    });

    if (_review) {
      this.logger.error(`User with id: ${user.id} already reviewed movie with id: ${movieId}`);
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
      .catch(() => {
        this.logger.error(`Failed to create review for movie with id: ${movieId}`);
        throw new NotFoundException("Фильм не найден");
      });

    await this.updateMovieRating(movieId);

    this.logger.log(`Created review for movie with id: ${movieId}`);

    return review;
  }

  async edit(user: JwtPayload, movieId: number, dto: EditReviewDto) {
    this.logger.log(`Editing review for movie with id: ${movieId} and user with id: ${user.id}`);
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
        this.logger.error(e);
        this.logger.error(`Failed to edit review for movie with id: ${movieId} and user with id: ${user.id}`);
        throw new NotFoundException("Отзыв не найден");
      });

    await this.updateMovieRating(movieId);

    this.logger.log(`Edited review for movie with id: ${movieId} and user with id: ${user.id}`);

    return review;
  }

  async delete(user: JwtPayload, movieId: number, userId: string) {
    this.logger.log(`Deleting review for movie with id: ${movieId} and user with id: ${userId}`);
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
          this.logger.error(e);
          this.logger.error(`Failed to delete review for movie with id: ${movieId} and user with id: ${userId}`);
          throw new NotFoundException("Отзыв не найден");
        });

      await this.updateMovieRating(movieId);

      this.logger.log(`Deleted review for movie with id: ${movieId} and user with id: ${userId}`);

      return review;
    }

    if (userId && user.id !== userId) {
      this.logger.error(`Failed to delete review. User with id: ${user.id} is not owner of review with id: ${userId}`);
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
        this.logger.error(e);
        this.logger.error(`Failed to delete review for movie with id: ${movieId} and user with id: ${user.id}`);
        throw new NotFoundException("Отзыв не найден");
      });

    await this.updateMovieRating(movieId);

    return review;
  }

  async showOrHide(movieId: number, userId: string, isHidden: boolean) {

    if(isHidden){
      this.logger.log(`Hiding review for movie with id: ${movieId} and user with id: ${userId}`);
    }else{
      this.logger.log(`Showing review for movie with id: ${movieId} and user with id: ${userId}`);
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
        this.logger.error(e);
        this.logger.error(`Failed to ${isHidden ? 'hide' : 'show'} review for movie with id: ${movieId} and user with id: ${userId}`);
        throw new NotFoundException("Отзыв не найден");
      });

    return review;
  }

  async updateMovieRating(movieId: number) {
    this.logger.log(`Updating rating for movie with id: ${movieId}`);

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
        this.logger.error(e);
        this.logger.error(`Failed to update rating for movie with id: ${movieId}`);
        throw new NotFoundException("Фильм не найден");
      });
  }
}
