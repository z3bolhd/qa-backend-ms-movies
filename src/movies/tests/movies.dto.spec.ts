import { BadRequestException, ValidationPipe } from "@nestjs/common";
import { CreateMovieDto, EditMovieDto, FindAllQueryDto } from "../dto";
import { Location, Movie } from "@prisma/client";
import { omit } from "@common/utils";

describe("MoviesDto", () => {
  const target: ValidationPipe = new ValidationPipe({ whitelist: true, transform: true });
  let movieDto: Movie;

  beforeEach(() => {
    movieDto = {
      id: 5,
      name: "test",
      description: "test description",
      genreId: 3,
      imageUrl: "test.ru",
      location: Location.MSK,
      price: 100,
      published: true,
      rating: 1,
      createdAt: new Date(),
    };
  });

  describe("CreateMovieDto", () => {
    it("should validate dto", async () => {
      const queryDto = {
        page: 1,
        pageSize: 10,
        minPrice: 0,
        maxPrice: 100,
        locations: [Location.SPB],
        createdAt: "desc",
        genreId: 5,
        published: true,
      } as FindAllQueryDto;

      expect(
        await target.transform(queryDto, { type: "query", metatype: FindAllQueryDto }),
      ).toEqual(queryDto);
    });

    it("should validate empty dto", async () => {
      await expect(
        await target.transform({}, { type: "query", metatype: FindAllQueryDto }),
      ).toEqual(new FindAllQueryDto());
    });

    it("should not validate findAllMoviesDto with negative page", async () => {
      const query = {
        page: -1,
      } as FindAllQueryDto;
      await expect(
        target.transform(query, { type: "query", metatype: FindAllQueryDto }),
      ).rejects.toThrow(BadRequestException);
    });

    it("should not validate findAllMoviesDto with negative pageSize", async () => {
      const query = {
        pageSize: -1,
      } as FindAllQueryDto;
      await expect(
        target.transform(query, { type: "query", metatype: FindAllQueryDto }),
      ).rejects.toThrow(BadRequestException);
    });

    it("should not validate findAllMoviesDto with wrong minPrice", async () => {
      const query = {
        minPrice: -1,
      } as FindAllQueryDto;
      await expect(
        target.transform(query, { type: "query", metatype: FindAllQueryDto }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  it("should validate createMovieDto", async () => {
    const dto: CreateMovieDto = omit(movieDto, "id", "createdAt", "rating");

    await expect(await target.transform(dto, { type: "body", metatype: CreateMovieDto })).toEqual(
      dto,
    );
  });

  it("should not validate createMovieDto with wrong imageUrl", async () => {
    const dto: CreateMovieDto = omit(
      { ...movieDto, imageUrl: "test" },
      "id",
      "createdAt",
      "rating",
    );

    expect(target.transform(dto, { type: "body", metatype: CreateMovieDto })).rejects.toThrow(
      BadRequestException,
    );
  });

  it("should not validate createMovieDto with wrong location", async () => {
    const dto: CreateMovieDto = omit(
      { ...movieDto, location: "test" as Location },
      "id",
      "createdAt",
      "rating",
    );
    await expect(target.transform(dto, { type: "body", metatype: CreateMovieDto })).rejects.toThrow(
      BadRequestException,
    );
  });

  it("should not validate createMovieDto with empty name", async () => {
    const dto: CreateMovieDto = omit({ ...movieDto, name: "" }, "id", "createdAt", "rating");

    await expect(target.transform(dto, { type: "body", metatype: CreateMovieDto })).rejects.toThrow(
      BadRequestException,
    );
  });

  it("should not validate createMovieDto with empty description", async () => {
    const dto: CreateMovieDto = omit({ ...movieDto, description: "" }, "id", "createdAt", "rating");

    await expect(target.transform(dto, { type: "body", metatype: CreateMovieDto })).rejects.toThrow(
      BadRequestException,
    );
  });

  it("should not validate createMovieDto with negative price", async () => {
    const dto: CreateMovieDto = omit({ ...movieDto, price: -100 }, "id", "createdAt", "rating");

    await expect(target.transform(dto, { type: "body", metatype: CreateMovieDto })).rejects.toThrow(
      BadRequestException,
    );
  });

  it("should not validate createMovieDto with negative price", async () => {
    const dto: CreateMovieDto = omit({ ...movieDto, price: -100 }, "id", "createdAt", "rating");

    await expect(target.transform(dto, { type: "body", metatype: CreateMovieDto })).rejects.toThrow(
      BadRequestException,
    );
  });

  it("should validate EditMovieDto", async () => {
    const dto: EditMovieDto = omit(movieDto, "id", "createdAt", "rating");
    expect(await target.transform(dto, { type: "body", metatype: EditMovieDto })).toEqual(dto);
  });

  it("should not validate EditMovieDto with wrong imageUrl", async () => {
    const dto: EditMovieDto = omit({ ...movieDto, imageUrl: "test" }, "id", "createdAt", "rating");
    await expect(target.transform(dto, { type: "body", metatype: EditMovieDto })).rejects.toThrow(
      BadRequestException,
    );
  });

  it("should not validate EditMovieDto with wrong location", async () => {
    const dto: EditMovieDto = omit(
      { ...movieDto, location: "test" as Location },
      "id",
      "createdAt",
      "rating",
    );
    await expect(target.transform(dto, { type: "body", metatype: EditMovieDto })).rejects.toThrow(
      BadRequestException,
    );
  });

  it("should not validate EditMovieDto with negative price", async () => {
    const dto: EditMovieDto = omit({ ...movieDto, price: -100 }, "id", "createdAt", "rating");

    await expect(target.transform(dto, { type: "body", metatype: EditMovieDto })).rejects.toThrow(
      BadRequestException,
    );
  });
});
