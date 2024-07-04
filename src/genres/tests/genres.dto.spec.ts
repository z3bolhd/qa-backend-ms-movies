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

  it("should not validate empty CreateGenreDto", async () => {
    await expect(target.transform({}, { type: "body", metatype: CreateGenreDto })).rejects.toThrow(
      BadRequestException,
    );
  });

  it("should validate CreateGenreDto", async () => {
    const dto: CreateGenreDto = omit(genreDto, "id");
    expect(await target.transform(dto, { type: "body", metatype: CreateGenreDto })).toEqual(dto);
  });
});
