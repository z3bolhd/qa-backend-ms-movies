import { ApiProperty } from "@nestjs/swagger";
import { Location } from "@prisma/client";

export class MovieResponse {
  @ApiProperty({ example: 2 })
  readonly id: number;

  @ApiProperty({ example: "Название фильма" })
  readonly name: string;

  @ApiProperty({ example: 200 })
  readonly price: number;

  @ApiProperty({
    example: "Описание фильма",
  })
  readonly description: string;

  @ApiProperty({
    example: "https://image.url",
  })
  readonly imageUrl: string;

  @ApiProperty({ enum: Location, example: Location.MSK })
  readonly location: Location;

  @ApiProperty({ example: true })
  readonly published: boolean;

  @ApiProperty({ example: 1 })
  readonly genreId: number;

  @ApiProperty({ example: { name: "Драма" } })
  readonly genre: { name: string };

  @ApiProperty({ example: "2024-02-28T04:28:15.965Z" })
  readonly createdAt: Date;

  @ApiProperty({ type: Number, example: 5, minimum: 0, maximum: 5 })
  rating: number;
}
