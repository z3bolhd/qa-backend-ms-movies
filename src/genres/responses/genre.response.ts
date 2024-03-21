import { ApiProperty } from "@nestjs/swagger";

export class GenreResponse {
  @ApiProperty({
    example: 1,
    type: Number,
    description: "Идентификатор жанра",
  })
  readonly id: number;

  @ApiProperty({
    example: "Название жанра",
    type: String,
  })
  readonly name: string;
}
