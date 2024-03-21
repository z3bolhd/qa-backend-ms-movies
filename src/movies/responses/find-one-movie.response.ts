import { ApiProperty } from "@nestjs/swagger";
import { MovieResponse } from ".";
import { MovieReviewResponse } from "./movie-review.response";

export class FindOneMovieResponse extends MovieResponse {
  @ApiProperty({
    type: [MovieReviewResponse],
  })
  readonly reviews: MovieReviewResponse[];
}
