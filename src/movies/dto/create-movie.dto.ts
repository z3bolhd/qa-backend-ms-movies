import { IsValueTrimmedConstraint } from "@common/decorators";
import { ApiProperty } from "@nestjs/swagger";
import { Location } from "@prisma/client";
import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  MinLength,
  Validate,
} from "class-validator";

export class CreateMovieDto {
  @ApiProperty({
    required: true,
    default: "Название фильма",
  })
  @IsNotEmpty({ message: "Поле name не может быть пустым" })
  @IsString({
    message: "Поле name должно быть строкой",
  })
  @Validate(IsValueTrimmedConstraint)
  @MinLength(3, { message: "Поле name должно содержать не менее 3 символов" })
  readonly name: string;

  @ApiProperty({
    required: false,
    default: "https://example.com/image.png",
  })
  @IsOptional()
  @IsString({
    message: "Поле imageUrl должно быть строкой",
  })
  @IsUrl({}, { message: "Неверная ссылка" })
  @Transform(({ value }) => value.trim())
  readonly imageUrl: string;

  @ApiProperty({
    required: true,
    default: 100,
  })
  @IsNotEmpty({ message: "Поле price не может быть пустым" })
  @IsNumber(
    {},
    {
      message: "Поле price должно быть числом",
    },
  )
  @Min(1, { message: "Поле price должно быть больше 0" })
  readonly price: number;

  @ApiProperty({
    required: true,
    default: "Описание фильма",
  })
  @IsNotEmpty({ message: "Поле description не может быть пустым" })
  @IsString({
    message: "Поле description должно быть строкой",
  })
  @Validate(IsValueTrimmedConstraint)
  @MinLength(5, { message: "Поле description должно содержать не менее 5 символов" })
  readonly description: string;

  @ApiProperty({
    required: true,
    enum: Location,
    default: Location.SPB,
  })
  @IsNotEmpty({ message: "Поле location не может быть пустым" })
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
  @IsNotEmpty({ message: "Поле published не может быть пустым" })
  @IsBoolean({
    message: "Поле published должно быть булевым значением",
  })
  readonly published: boolean;

  @ApiProperty({
    required: true,
    default: 1,
  })
  @IsNotEmpty({ message: "Поле genreId не может быть пустым" })
  @IsNumber(
    {},
    {
      message: "Поле genreId должно быть числом",
    },
  )
  @IsInt({ message: "Поле genreId должно быть целым числом" })
  @Min(1, { message: "Поле genreId должно быть больше 0" })
  readonly genreId: number;
}
