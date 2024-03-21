import { ApiProperty } from "@nestjs/swagger";
import { MovieResponse } from "./movie.response";

export class FindAllMoviesResponse {
  @ApiProperty({
    type: [MovieResponse],
  })
  readonly movies: MovieResponse[];

  @ApiProperty({
    type: Number,
    example: 13,
  })
  readonly count: number;

  @ApiProperty({
    type: Number,
    example: 1,
  })
  readonly page: number;

  @ApiProperty({
    type: Number,
    example: 10,
  })
  readonly pageSize: number;

  @ApiProperty({
    type: Number,
    example: 2,
  })
  readonly pageCount: number;
}
