import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateGenreDto {
  @ApiProperty({
    type: String,
    example: "Название жанра",
  })
  @IsNotEmpty({ message: "Поле name не может быть пустым" })
  @IsString({ message: "Поле name должно быть строкой" })
  readonly name: string;
}
