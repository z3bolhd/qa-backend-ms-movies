import { Test } from "@nestjs/testing";
import { Genre } from "@prisma/client";
import { ConflictException, NotFoundException } from "@nestjs/common";
import { LoggerModule } from "nestjs-pino";

import { pick } from "@common/utils";
import { PrismaService } from "@prismadb/prisma.service";

import { GenresController } from "../genres.controller";
import { GenresService } from "../genres.service";

const prismaMock = {
  genre: {
    findMany: jest.fn(),
    findOne: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    aggregate: jest.fn(),
  },
};

const genre: Genre = {
  id: 1,
  name: "test",
};

const genres: Genre[] = [genre];

const genreDto = pick(genre, "name");

describe("GenresService", () => {
  let genresService: GenresService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [LoggerModule.forRoot()],
      controllers: [GenresController],
      providers: [
        GenresService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    genresService = moduleRef.get<GenresService>(GenresService);

    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(genresService).toBeDefined();
  });

  describe("findAll", () => {
    it("should find all genres", async () => {
      prismaMock.genre.findMany.mockResolvedValue(genres);
      expect(await genresService.findAll()).toEqual(genres);
    });
  });

  describe("findOne", () => {
    it("should find one genre by id", async () => {
      prismaMock.genre.findUnique.mockResolvedValue(genre);
      expect(await genresService.findOne(1)).toEqual(genre);
    });

    it("should not one genre if not found", async () => {
      prismaMock.genre.findUnique.mockRejectedValue(null);
      await expect(genresService.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe("create", () => {
    it("should create genre", async () => {
      prismaMock.genre.create.mockResolvedValue(genre);
      prismaMock.genre.findUnique.mockRejectedValue(null);

      expect(await genresService.create(genreDto)).toEqual(genre);
    });

    it("should not create genre if already exists", async () => {
      prismaMock.genre.findUnique.mockResolvedValue(genre);
      await expect(genresService.create(genreDto)).rejects.toThrow(ConflictException);

      expect(prismaMock.genre.findUnique).toHaveBeenCalled();
      expect(prismaMock.genre.create).not.toHaveBeenCalled();
    });
  });

  describe("delete", () => {
    it("should delete genre", async () => {
      prismaMock.genre.delete.mockResolvedValue(genre);
      prismaMock.genre.findUnique.mockResolvedValue(genre);
      expect(await genresService.delete(1)).toEqual(genre);

      expect(prismaMock.genre.findUnique).toHaveBeenCalled();
      expect(prismaMock.genre.delete).toHaveBeenCalled();
    });

    it("should not delete genre if not found", async () => {
      prismaMock.genre.findUnique.mockRejectedValue(null);

      await expect(genresService.delete(1)).rejects.toThrow(NotFoundException);
    });
  });
});
