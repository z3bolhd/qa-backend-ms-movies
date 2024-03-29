import { Module } from "@nestjs/common";
import { MoviesController } from "./movies.controller";
import { MoviesService } from "./movies.service";
import { ReviewsModule } from "./reviews/reviews.module";

@Module({
  providers: [MoviesService],
  controllers: [MoviesController],
  imports: [ReviewsModule],
})
export class MoviesModule {}
