import { BadRequestException, ValidationPipe } from "@nestjs/common";
import { Genre } from "@prisma/client";
import { CreateGenreDto } from "../dto";
import { omit } from "@common/utils";

describe("GenresDto", () => {
  const target: ValidationPipe = new ValidationPipe({ whitelist: true, transform: true });
  let genreDto: Genre;

  beforeEach(() => {
    genreDto = {
      id: 5,
      name: "test",
    };
  });

  describe("CreateGenreDto", () => {
    it("should validate dto", async () => {
      const dto: CreateGenreDto = omit(genreDto, "id");
      expect(await target.transform(dto, { type: "body", metatype: CreateGenreDto })).toEqual(dto);
    });

    it("should not validate dto with empty body", async () => {
      await expect(
        target.transform({}, { type: "body", metatype: CreateGenreDto }),
      ).rejects.toThrow(BadRequestException);
    });

    it("should validate dto with valid name", async () => {
      const correctNames = ["Название жанра", "НаЗеИмя жанра", "Имя", "Название"];

      for (const name of correctNames) {
        expect(
          await target.transform({ name }, { type: "body", metatype: CreateGenreDto }),
        ).toEqual({ name });
      }
    });

    it("should not validate dto with invalid name", async () => {
      const wrongNames = ["   a   ", "Им", "   Имя", "Название  ", "Название1"];

      for (const name of wrongNames) {
        expect(
          target.transform({ name }, { type: "body", metatype: CreateGenreDto }),
        ).rejects.toThrow(BadRequestException);
      }
    });
  });
});
