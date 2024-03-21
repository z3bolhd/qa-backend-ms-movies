import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@prisma/prisma.service";

import { CreateMovieDto, EditMovieDto, FindAllQueryDto } from "./dto";
import { MovieResponse } from "./responses";

@Injectable()
export class MoviesService {
  constructor(private readonly prismaService: PrismaService) {}

  async findAll(dto: FindAllQueryDto) {
    if (dto.minPrice >= dto.maxPrice) {
      throw new BadRequestException();
    }

    const movies: MovieResponse[] & { total?: number } = await this.prismaService.movie
      .findMany({
        where: {
          location: {
            in: dto.locations,
          },
          published: dto.published,
          genreId: dto.genreId,
          price: {
            gte: dto.minPrice,
            lte: dto.maxPrice,
          },
        },
        select: {
          id: true,
          name: true,
          description: true,
          genreId: true,
          imageUrl: true,
          price: true,
          rating: true,
          location: true,
          published: true,
          createdAt: true,
          genre: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: dto.createdAt,
        },
        skip: dto.page * dto.pageSize - dto.pageSize,
        take: dto.pageSize,
      })
      .catch(() => {
        throw new BadRequestException();
      });

    const count = await this.prismaService.movie
      .aggregate({
        _count: true,
        where: {
          location: {
            in: dto.locations,
          },
          published: dto.published,
          genreId: dto.genreId,
          price: {
            gte: dto.minPrice,
            lte: dto.maxPrice,
          },
        },
      })
      .then((res) => res._count)
      .catch(() => 0);

    const pageCount = Math.ceil(count / dto.pageSize);

    return { movies, count, page: dto.page, pageSize: dto.pageSize, pageCount };
  }

  async findOne(id: number) {
    const movie = await this.prismaService.movie.findUnique({
      where: {
        id,
      },
      include: {
        reviews: {
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
        },
        genre: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!movie) {
      throw new NotFoundException();
    }

    return movie;
  }

  async create(dto: CreateMovieDto) {
    const _movie = await this.prismaService.movie.findUnique({
      where: {
        name: dto.name,
      },
    });

    if (_movie) {
      throw new ConflictException("Фильм с таким названием уже существует");
    }

    const movie: MovieResponse = await this.prismaService.movie
      .create({
        data: {
          ...dto,
        },
        include: {
          genre: {
            select: {
              name: true,
            },
          },
        },
      })
      .catch(() => {
        throw new BadRequestException();
      });

    return movie;
  }

  async delete(id: number) {
    const movie = await this.prismaService.movie
      .delete({
        where: {
          id,
        },
        include: {
          reviews: {
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
          },
          genre: {
            select: {
              name: true,
            },
          },
        },
      })
      .catch(() => {
        throw new NotFoundException();
      });

    return movie;
  }

  async edit(movieId: number, dto: EditMovieDto) {
    const movie: MovieResponse = await this.prismaService.movie
      .update({
        where: {
          id: movieId,
        },
        data: {
          ...dto,
        },
        select: {
          id: true,
          name: true,
          description: true,
          genreId: true,
          imageUrl: true,
          price: true,
          rating: true,
          location: true,
          published: true,
          createdAt: true,
          genre: {
            select: {
              name: true,
            },
          },
        },
      })
      .catch(() => {
        throw new NotFoundException();
      });

    return movie;
  }
}
