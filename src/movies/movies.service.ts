import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@prisma/prisma.service";

import { CreateMovieDto, EditMovieDto, FindAllQueryDto } from "./dto";
import { MovieResponse } from "./responses";
import { PinoLogger } from "nestjs-pino";

@Injectable()
export class MoviesService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(MoviesService.name);
  }

  async findAll(dto: FindAllQueryDto) {
    this.logger.info({ query: dto }, "Find all movies");

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
      .catch((e) => {
        this.logger.debug(e, "Failed to find movies or wrong query");
        this.logger.error("Failed to find movies or wrong query");
        throw new BadRequestException("Некорректные данные");
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

    this.logger.info(
      { count, page: dto.page, pageSize: dto.pageSize, pageCount },
      "Found all movies",
    );

    return { movies, count, page: dto.page, pageSize: dto.pageSize, pageCount };
  }

  async findOne(id: number) {
    this.logger.info(
      {
        movie: {
          id,
        },
      },
      "Find movie",
    );
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
            hidden: true,
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
      this.logger.error({ movie: { id } }, "Movie not found");
      throw new NotFoundException("Фильм не найден");
    }

    this.logger.info({ movie }, "Found movie");

    return movie;
  }

  async create(dto: CreateMovieDto) {
    this.logger.info({ movie: dto }, "Create movie");
    const _movie = await this.prismaService.movie.findUnique({
      where: {
        name: dto.name,
      },
    });

    if (_movie) {
      this.logger.error({ name: dto.name }, "Movie already exists");
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
      .catch((e) => {
        this.logger.debug(e, "Failed to create movie");
        this.logger.error({ movie: dto }, "Failed to create movie");
        throw new BadRequestException("Некорректные данные");
      });

    this.logger.info({ movie }, "Created movie");

    return movie;
  }

  async delete(id: number) {
    this.logger.info({ movie: { id } }, "Delete movie");
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
      .catch((e) => {
        this.logger.debug(e, "Failed to delete movie");
        this.logger.error({ movie: { id } }, "Failed to delete movie");
        throw new NotFoundException("Фильм не найден");
      });

    this.logger.info({ movie }, "Deleted movie");

    return movie;
  }

  async edit(movieId: number, dto: EditMovieDto) {
    this.logger.info({ movie: { id: movieId, dto } }, "Edit movie");

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
      .catch((e) => {
        this.logger.debug(e, "Failed to edit movie");
        this.logger.error({ movie: { id: movieId, dto } }, "Failed to edit movie");
        throw new NotFoundException("Фильм не найден");
      });

    return movie;
  }
}
