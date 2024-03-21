import { JwtPayload } from "@auth/interfaces";
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Role } from "@repo/database";
import { PrismaService } from "@prisma/prisma.service";
import { CreateReviewDto, EditReviewDto } from "./dto";

@Injectable()
export class ReviewsService {
  constructor(private readonly prismaService: PrismaService) {}

  async getMovieReviews(id: number) {
    const movie = await this.prismaService.movie.findUnique({
      where: {
        id,
      },
    });

    if (!movie) {
      throw new NotFoundException();
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

    return reviews;
  }

  async create(user: JwtPayload, movieId: number, dto: CreateReviewDto) {
    const _review = await this.prismaService.review.findUnique({
      where: {
        userId_movieId: {
          userId: user.id,
          movieId,
        },
      },
    });

    if (_review) {
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
        throw new NotFoundException("Фильм не найден");
      });

    await this.updateMovieRating(movieId);

    return review;
  }

  async edit(user: JwtPayload, movieId: number, dto: EditReviewDto) {
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
      .catch(() => {
        throw new NotFoundException("Отзыв не найден");
      });

    await this.updateMovieRating(movieId);

    return review;
  }

  async delete(user: JwtPayload, movieId: number, userId: string) {
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
        .catch(() => {
          throw new NotFoundException("Отзыв не найден");
        });

      await this.updateMovieRating(movieId);

      return review;
    }

    if (userId && user.id !== userId) {
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
      .catch(() => {
        throw new NotFoundException("Отзыв не найден");
      });

    await this.updateMovieRating(movieId);

    return review;
  }

  async showOrHide(movieId: number, userId: string, isHidden: boolean) {
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
      .catch(() => {
        throw new NotFoundException("Отзыв не найден");
      });

    return review;
  }

  async updateMovieRating(movieId: number) {
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
      .catch(() => {
        throw new NotFoundException("Фильм не найден");
      });
  }
}
