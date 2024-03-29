import { ApiProperty } from "@nestjs/swagger";
import { Location } from "@prisma/client";
import { Transform, Type } from "class-transformer";
import { IsArray, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

enum Sort {
  ASC = "asc",
  DESC = "desc",
}

export class FindAllQueryDto {
  @ApiProperty({
    minimum: 1,
    maximum: 20,
    title: "pageSize",
    default: 10,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: "Поле pageSize должно быть числом" })
  @Min(1, { message: "Поле pageSize имеет минимальную величину 1" })
  @Max(20, { message: "Поле pageSize имеет максимальную величину 20" })
  readonly pageSize: number = 10;

  @ApiProperty({
    minimum: 1,
    title: "page",
    default: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: "Поле page должно быть числом" })
  @Min(1, { message: "Поле page имеет минимальную величину 1" })
  readonly page: number = 1;

  @ApiProperty({
    minimum: 1,
    title: "minPrice",
    default: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: "Поле minPrice должно быть числом" })
  @Min(1, { message: "Поле minPrice имеет минимальную величину 1" })
  readonly minPrice: number = 1;

  @ApiProperty({
    minimum: 1,
    title: "maxPrice",
    default: 1000,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: "Поле minPrice имеет минимальную величину 1" })
  readonly maxPrice: number = 1000;

  @ApiProperty({
    enum: Location,
    isArray: true,
    title: "locations",
    example: Object.keys(Location),
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Type(() => String)
  @Transform(({ value }) =>
    typeof value === "string" ? value.split(",") : Object.values(Location),
  )
  readonly locations: Location[] = Object.values(Location);

  @ApiProperty({
    title: "published",
    type: Boolean,
    default: true,
    required: false,
  })
  @IsOptional()
  @Transform(({ obj, key }) => {
    return !(obj[key] === "false");
  })
  readonly published: boolean = true;

  @ApiProperty({
    minimum: 1,
    title: "genreId",
    default: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: "Поле genreId должно быть числом" })
  @Min(1, { message: "Поле genreId имеет минимальную величину 1" })
  readonly genreId: number;

  @ApiProperty({
    type: String,
    title: "createdAt",
    default: "asc",
    required: false,
    enum: Sort,
  })
  @IsOptional()
  @IsString({
    message: "Поле createdAt должно быть строкой",
  })
  @Transform(({ value }) => (typeof value === "string" && value ? value : "asc"))
  readonly createdAt: "asc" | "desc" = "asc";
}
