import { Module } from "@nestjs/common";
import { ReviewsController } from "./reviews.controller";
import { ReviewsService } from "./reviews.service";

@Module({
  providers: [ReviewsService],
  controllers: [ReviewsController],
  imports: [],
})
export class ReviewsModule {}
