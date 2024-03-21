import { ApiProperty } from "@nestjs/swagger";
import { Location } from "@prisma/client";
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, IsUrl, Min } from "class-validator";

export class EditMovieDto {
  @ApiProperty({
    required: false,
    default: "Movie name",
  })
  @IsOptional()
  @IsString({ message: "Поле name должно быть строкой" })
  readonly name: string;

  @ApiProperty({
    required: false,
    default: "Movie description",
  })
  @IsOptional()
  @IsString({ message: "Поле description должно быть строкой" })
  readonly description: string;

  @ApiProperty({
    required: false,
    default: 100,
  })
  @IsOptional()
  @IsNumber({}, { message: "Поле price должно быть числом" })
  @Min(1)
  readonly price: number;

  @ApiProperty({
    required: false,
    enum: Location,
    default: Location.SPB,
  })
  @IsOptional()
  @IsString({ message: "Поле location должно быть строкой" })
  @IsEnum(Location)
  readonly location: Location;

  @ApiProperty({
    required: false,
    default: "https://image.url",
  })
  @IsOptional()
  @IsString({ message: "Поле imageUrl должно быть строкой" })
  @IsUrl()
  readonly imageUrl: string;

  @ApiProperty({
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: "Поле published должно быть булевым значением" })
  readonly published: boolean;

  @ApiProperty({
    required: false,
    default: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: "Поле genreId должно быть числом" })
  @Min(1)
  readonly genreId: number;
}
