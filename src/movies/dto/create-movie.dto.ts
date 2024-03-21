import { ApiProperty } from "@nestjs/swagger";
import { Location } from "@prisma/client";
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
} from "class-validator";

export class CreateMovieDto {
  @ApiProperty({
    required: true,
    default: "Название фильма",
  })
  @IsString({
    message: "Поле name должно быть строкой",
  })
  @IsNotEmpty()
  readonly name: string;

  @ApiProperty({
    required: false,
    default: "https://image.url",
  })
  @IsOptional()
  @IsString({
    message: "Поле imageUrl должно быть строкой",
  })
  @IsUrl({}, { message: "Неверная ссылка" })
  readonly imageUrl: string;

  @ApiProperty({
    required: true,
    default: 100,
  })
  @IsNumber(
    {},
    {
      message: "Поле price должно быть числом",
    },
  )
  readonly price: number;

  @ApiProperty({
    required: true,
    default: "Описание фильма",
  })
  @IsString({
    message: "Поле description должно быть строкой",
  })
  readonly description: string;

  @ApiProperty({
    required: true,
    enum: Location,
    default: Location.SPB,
  })
  @IsString({
    message: "Поле location должно быть строкой",
  })
  @IsEnum(Location, {
    message: "Поле location должно быть одним из: " + Object.values(Location).join(", "),
  })
  readonly location: Location;

  @ApiProperty({
    required: true,
    default: true,
  })
  @IsBoolean({
    message: "Поле published должно быть булевым значением",
  })
  readonly published: boolean;

  @ApiProperty({
    required: true,
    default: 1,
  })
  @IsNumber(
    {},
    {
      message: "Поле genreId должно быть числом",
    },
  )
  readonly genreId: number;
}
