import { Test } from "@nestjs/testing";
import { Genre } from "@prisma/client";
import { LoggerModule } from "nestjs-pino";
import { GenresService } from "../genres.service";
import { GenresController } from "../genres.controller";
import { PrismaService } from "@prismadb/prisma.service";
import { ConflictException, NotFoundException } from "@nestjs/common";

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

describe("GenresController", () => {
  let genresController: GenresController;
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
    genresController = moduleRef.get<GenresController>(GenresController);

    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(genresController).toBeDefined();
    expect(genresService).toBeDefined();
  });

  it("should get all genres", async () => {
    prismaMock.genre.findMany.mockResolvedValue(genres);
    expect(await genresController.findAll()).toEqual(genres);
  });

  it("should get genre by id", async () => {
    prismaMock.genre.findUnique.mockResolvedValue(genre);
    expect(await genresController.findOne("1")).toEqual(genre);
  });

  it("should create genre", async () => {
    prismaMock.genre.create.mockResolvedValue(genre);
    prismaMock.genre.findUnique.mockRejectedValue(null);

    expect(await genresController.create({ name: "test" })).toEqual(genre);
  });

  it("should not create genre if already exists", async () => {
    prismaMock.genre.findUnique.mockResolvedValue(genre);
    await expect(genresController.create({ name: "test" })).rejects.toThrow(ConflictException);

    expect(prismaMock.genre.findUnique).toHaveBeenCalled();
    expect(prismaMock.genre.create).not.toHaveBeenCalled();
  });

  it("should delete genre", async () => {
    prismaMock.genre.delete.mockResolvedValue(genre);
    prismaMock.genre.findUnique.mockResolvedValue(genre);
    expect(await genresController.delete("1")).toEqual(genre);

    expect(prismaMock.genre.findUnique).toHaveBeenCalled();
    expect(prismaMock.genre.delete).toHaveBeenCalled();
  });

  it("should not delete genre if not found", async () => {
    prismaMock.genre.findUnique.mockRejectedValue(null);

    await expect(genresController.delete("1")).rejects.toThrow(NotFoundException);
  });
});
