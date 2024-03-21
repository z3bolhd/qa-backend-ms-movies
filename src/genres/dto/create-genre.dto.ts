import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class CreateGenreDto {
  @ApiProperty({
    type: String,
    example: "Название жанра",
  })
  @IsString({ message: "Поле name должно быть строкой" })
  readonly name: string;
}
