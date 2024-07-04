import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@prismadb/prisma.service";
import { PinoLogger } from "nestjs-pino";

import { CreateGenreDto } from "./dto";

@Injectable()
export class GenresService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(GenresService.name);
  }

  async findAll() {
    this.logger.info("Find all genres");
    const genres = await this.prismaService.genre.findMany();

    this.logger.info("Found all genres");

    return genres;
  }

  async create(dto: CreateGenreDto) {
    this.logger.info({ genre: dto }, "Create genre");

    if (await this.checkIsGenreExists({ name: dto.name })) {
      this.logger.error({ name: dto.name }, "Failed to create genre. Genre already exists");
      throw new ConflictException("Такой жанр уже существует");
    }

    const genre = await this.prismaService.genre
      .create({
        data: {
          name: dto.name,
        },
      })
      .catch((e) => {
        this.logger.debug(e, "Failed to create genre");
        this.logger.error({ genre: dto }, "Failed to create genre. Genre already exists");
        throw new ConflictException("Такой жанр уже существует");
      });

    return genre;
  }

  async delete(id: number) {
    this.logger.info({ genre: { id } }, "Delete genre");

    if (!(await this.checkIsGenreExists({ id }))) {
      this.logger.error({ genre: { id } }, "Failed to delete genre. Genre not found");
      throw new NotFoundException("Жанр не найден");
    }

    const genre = await this.prismaService.genre
      .delete({
        where: {
          id,
        },
      })
      .catch((e) => {
        this.logger.debug(e, "Failed to delete genre");
        this.logger.error(`Failed to delete genre. Genre with id: ${id} not found`);
        throw new InternalServerErrorException("Произошла ошибка при удалении жанра");
      });

    this.logger.info({ genre }, "Deleted genre");

    return genre;
  }

  async findOne(id: number) {
    this.logger.info({ genre: { id } }, "Find genre");
    const genre = await this.prismaService.genre
      .findUnique({
        where: {
          id,
        },
      })
      .catch(() => null);

    if (!genre) {
      this.logger.error({ genre: { id } }, `Failed to find genre. Genre not found`);
      throw new NotFoundException("Жанр не найден");
    }

    this.logger.info({ genre }, "Found genre");

    return genre;
  }

  private async checkIsGenreExists({ id, name }: { id?: number; name?: string }) {
    const genre = await this.prismaService.genre
      .findUnique({
        where: {
          id,
          name,
        },
      })
      .catch(() => null);

    return genre !== null;
  }
}
