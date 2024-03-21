import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@prisma/prisma.service";
import { CreateGenreDto } from "./dto";

@Injectable()
export class GenreService {
  constructor(private readonly prismaService: PrismaService) {}

  async findAll() {
    const genres = await this.prismaService.genre.findMany();

    return genres;
  }

  async create(dto: CreateGenreDto) {
    const genre = await this.prismaService.genre
      .create({
        data: {
          name: dto.name,
        },
      })
      .catch(() => {
        throw new ConflictException("Такой жанр уже существует");
      });

    return genre;
  }

  async delete(id: number) {
    const genre = await this.prismaService.genre
      .delete({
        where: {
          id,
        },
      })
      .catch(() => {
        throw new NotFoundException("Жанр не найден");
      });

    return genre;
  }

  async findById(id: number) {
    const genre = await this.prismaService.genre
      .findFirst({
        where: {
          id,
        },
      })
      .catch(() => {
        throw new NotFoundException("Жанр не найден");
      });

    if (!genre) {
      throw new NotFoundException("Жанр не найден");
    }

    return genre;
  }
}
