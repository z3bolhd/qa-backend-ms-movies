import { ConflictException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@prisma/prisma.service";
import { CreateGenreDto } from "./dto";

@Injectable()
export class GenreService {
  constructor(private readonly prismaService: PrismaService) {}
  private readonly logger = new Logger(GenreService.name);

  async findAll() {
    this.logger.log("Finding all genres");
    const genres = await this.prismaService.genre.findMany();

    this.logger.log(`Found ${genres.length} genres`);

    return genres;
  }

  async create(dto: CreateGenreDto) {
    this.logger.log(`Creating genre with name: ${dto.name}`);

    const genre = await this.prismaService.genre
      .create({
        data: {
          name: dto.name,
        },
      })
      .catch((e) => {
        this.logger.error(e);
        this.logger.error(`Failed to create genre. This genre already exists: ${dto.name}`);
        throw new ConflictException("Такой жанр уже существует");
      });

    return genre;
  }

  async delete(id: number) {
    this.logger.log(`Deleting genre with id: ${id}`);
    const genre = await this.prismaService.genre
      .delete({
        where: {
          id,
        },
      })
      .catch((e) => {
        this.logger.error(e);
        this.logger.error(`Failed to delete genre. Genre with id: ${id} not found`);
        throw new NotFoundException("Жанр не найден");
      });

    this.logger.log(`Deleted genre with id: ${id}`);

    return genre;
  }

  async findById(id: number) {
    this.logger.log(`Finding genre with id: ${id}`);
    const genre = await this.prismaService.genre
      .findFirst({
        where: {
          id,
        },
      })
      .catch((e) => {
        this.logger.error(e);
        this.logger.error(`Failed to find genre. Genre with id: ${id} not found`);
        throw new NotFoundException("Жанр не найден");
      });

    if (!genre) {
      this.logger.error(`Failed to find genre. Genre with id: ${id} not found`);
      throw new NotFoundException("Жанр не найден");
    }

    this.logger.log(`Found genre with id: ${id}`);

    return genre;
  }
}
