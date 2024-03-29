import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@prisma/prisma.service";

import { CreateMovieDto, EditMovieDto, FindAllQueryDto } from "./dto";
import { MovieResponse } from "./responses";

@Injectable()
export class MoviesService {
  constructor(private readonly prismaService: PrismaService) {}

  private readonly logger = new Logger(MoviesService.name);

  async findAll(dto: FindAllQueryDto) {
    this.logger.log(`Finding all movies with query: ${JSON.stringify(dto)}`);

    if (dto.minPrice >= dto.maxPrice) {
      this.logger.error("minPrice must be less than maxPrice");
      throw new BadRequestException("minPrice must be less than maxPrice");
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
        this.logger.error("Failed to find movies or wrong query");
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

    this.logger.log(`Found ${count} movies with query: ${JSON.stringify(dto)}`);

    return { movies, count, page: dto.page, pageSize: dto.pageSize, pageCount };
  }

  async findOne(id: number) {
    this.logger.log(`Finding movie with id: ${id}`);
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
      this.logger.error(`Movie with id: ${id} not found`);
      throw new NotFoundException();
    }

    this.logger.log(`Found movie with id: ${id}`);

    return movie;
  }

  async create(dto: CreateMovieDto) {
    this.logger.log(`Creating movie with name: ${dto.name}`);
    const _movie = await this.prismaService.movie.findUnique({
      where: {
        name: dto.name,
      },
    });

    if (_movie) {
      this.logger.error(`Movie with name: ${dto.name} already exists`);
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
        this.logger.error(`Failed to create movie. Wrong data: ${JSON.stringify(dto)}`);
        throw new BadRequestException();
      });

    this.logger.log(`Created movie with id: ${movie.id}`);
    this.logger.log(`Created movie with name: ${dto.name}`);

    return movie;
  }

  async delete(id: number) {
    this.logger.log(`Deleting movie with id: ${id}`);
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
        this.logger.error(`Movie with id: ${id} not found`);
        throw new NotFoundException();
      });

    this.logger.log(`Deleted movie with id: ${id}`);

    return movie;
  }

  async edit(movieId: number, dto: EditMovieDto) {
    this.logger.log(`Editing movie with id: ${movieId}`);

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
        this.logger.error(`Failed to edit movie with id: ${movieId}. Wrong data: ${JSON.stringify(dto)}`);
        throw new NotFoundException("Фильм не найден");
      });

    return movie;
  }
}
