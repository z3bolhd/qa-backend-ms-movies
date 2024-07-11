import { MoviesService } from "../movies.service";

import { FindAllMoviesResponse, MovieResponse } from "../responses";

import { CreateMovieDto, EditMovieDto, FindAllQueryDto } from "../dto";
import { PinoLogger } from "nestjs-pino";
import { PrismaService } from "@prismadb/prisma.service";
import { Location, Review } from "@prisma/client";
import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common";

const prismaMock = {
  movie: {
    findMany: jest.fn(),
    findOne: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    aggregate: jest.fn(),
  },
};

const movies: (MovieResponse & { reviews: Review[] })[] = [
  {
    id: 1,
    name: "test",
    description: "test",
    genreId: 1,
    imageUrl: "test",
    price: 1,
    rating: 1,
    location: Location.MSK,
    published: true,
    createdAt: new Date(),
    genre: { name: "test" },
    reviews: [
      {
        userId: "1",
        movieId: 1,
        text: "test",
        rating: 1,
        hidden: false,
        createdAt: new Date(),
      },
    ],
  },
];

const wrongMovieData = {
  id: 1,
  name: "test",
  location: Location.MSK,
  published: true,
  genreId: 1,
  imageUrl: "test",
  price: 1,
  rating: 1,
  description: "test",
};

describe("MoviesService", () => {
  let moviesService: MoviesService;

  beforeAll(async () => {
    moviesService = new MoviesService(prismaMock as unknown as PrismaService, new PinoLogger({}));
  });

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(moviesService).toBeDefined();
  });

  describe("findAll", () => {
    it("should find all movies", async () => {
      const result: FindAllMoviesResponse = {
        movies: [{ ...movies[0] }],
        count: 1,
        page: 1,
        pageSize: 10,
        pageCount: 1,
      };

      prismaMock.movie.findMany.mockResolvedValue(movies);
      prismaMock.movie.aggregate.mockResolvedValue({ _count: 1 });

      expect(await moviesService.findAll(new FindAllQueryDto())).toEqual(result);

      expect(prismaMock.movie.findMany).toHaveBeenCalledTimes(1);
      expect(prismaMock.movie.aggregate).toHaveBeenCalledTimes(1);
    });

    it("should find all movies with empty result", async () => {
      prismaMock.movie.findMany.mockResolvedValue([]);
      prismaMock.movie.aggregate.mockResolvedValue({ _count: 0 });

      const result: FindAllMoviesResponse = {
        movies: [],
        count: 0,
        page: 1,
        pageSize: 10,
        pageCount: 0,
      };

      expect(await moviesService.findAll(new FindAllQueryDto())).toEqual(result);
      expect(prismaMock.movie.findMany).toHaveBeenCalledTimes(1);
      expect(prismaMock.movie.aggregate).toHaveBeenCalledTimes(1);
    });
  });

  describe("findOne", () => {
    it("should find one movie", async () => {
      prismaMock.movie.findUnique.mockResolvedValue(movies[0]);

      expect(await moviesService.findOne(1)).toEqual(movies[0]);
      expect(prismaMock.movie.findUnique).toHaveBeenCalledTimes(1);
    });

    it("should not find one movie", async () => {
      prismaMock.movie.findUnique.mockResolvedValue(null);

      await expect(moviesService.findOne(1)).rejects.toThrow(NotFoundException);
      expect(prismaMock.movie.findUnique).toHaveBeenCalledTimes(1);
    });
  });

  describe("create", () => {
    it("should create movie", async () => {
      prismaMock.movie.create.mockResolvedValue(movies[0]);
      prismaMock.movie.findUnique.mockResolvedValue(null);
      expect(await moviesService.create(movies[0])).toEqual(movies[0]);
    });

    it("should not create movie with conflicting id", async () => {
      prismaMock.movie.findUnique.mockResolvedValue(movies[0]);

      await expect(moviesService.create(wrongMovieData)).rejects.toThrow(ConflictException);

      expect(prismaMock.movie.findUnique).toHaveBeenCalledTimes(1);
      expect(prismaMock.movie.create).not.toHaveBeenCalled();
    });

    it("should not create movie with wrong data", async () => {
      prismaMock.movie.create.mockRejectedValue(null);
      prismaMock.movie.findUnique.mockRejectedValue(null);

      await expect(moviesService.create({} as CreateMovieDto)).rejects.toThrow(BadRequestException);
      expect(prismaMock.movie.create).toHaveBeenCalledTimes(1);
      expect(prismaMock.movie.findUnique).toHaveBeenCalledTimes(1);
    });
  });

  describe("edit", () => {
    it("should edit movie", async () => {
      prismaMock.movie.update.mockResolvedValue(movies[0]);
      prismaMock.movie.findUnique.mockResolvedValue(movies[0]);

      expect(await moviesService.edit(1, movies[0])).toEqual(movies[0]);
      expect(prismaMock.movie.findUnique).toHaveBeenCalledTimes(1);
      expect(prismaMock.movie.update).toHaveBeenCalledTimes(1);
    });

    it("should not edit movie with wrong id", async () => {
      prismaMock.movie.update.mockResolvedValue(null);
      prismaMock.movie.findUnique.mockResolvedValue(null);

      await expect(moviesService.edit(0, wrongMovieData as EditMovieDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(prismaMock.movie.findUnique).toHaveBeenCalledTimes(1);
      expect(prismaMock.movie.update).toHaveBeenCalledTimes(0);
    });
  });

  describe("delete", () => {
    it("should delete movie", async () => {
      prismaMock.movie.delete.mockResolvedValue(movies[0]);
      prismaMock.movie.findUnique.mockResolvedValue(movies[0]);

      expect(await moviesService.delete(1)).toEqual(movies[0]);
      expect(prismaMock.movie.findUnique).toHaveBeenCalledTimes(1);
      expect(prismaMock.movie.delete).toHaveBeenCalledTimes(1);
    });

    it("should not delete movie with wrong id", async () => {
      prismaMock.movie.delete.mockRejectedValue(null);
      prismaMock.movie.findUnique.mockResolvedValue(null);
      await expect(moviesService.delete(1)).rejects.toThrow(NotFoundException);

      expect(prismaMock.movie.findUnique).toHaveBeenCalledTimes(1);
      expect(prismaMock.movie.delete).toHaveBeenCalledTimes(0);
    });
  });
});
