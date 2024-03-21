import { Module } from "@nestjs/common";
import { GenreService } from "./genre.service";
import { GenresController } from "./genre.controller";

@Module({
  providers: [GenreService],
  controllers: [GenresController],
})
export class GenresModule {}
