import { Public, Roles } from "@common/decorators";
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { RolesGuard } from "@auth/guards/role.guard";

import { Role } from "@prisma/client";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

import { FindAllMoviesResponse, FindOneMovieResponse, MovieResponse } from "./responses";
import { CreateMovieDto, EditMovieDto, FindAllQueryDto } from "./dto";
import { MoviesService } from "./movies.service";

@ApiTags("Фильмы")
@Controller("movies")
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Public()
  @Get()
  @UsePipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  )
  @ApiOperation({
    summary: "Получение афиш фильмов",
    description: "Получение афиш фильмов\n\n" + "**Roles: PUBLIC**",
  })
  @ApiOkResponse({
    status: 200,
    type: FindAllMoviesResponse,
  })
  @ApiResponse({ status: 400, description: "Неверные параметры" })
  async findAll(
    @Query()
    query: FindAllQueryDto,
  ) {
    return this.moviesService.findAll(query);
  }

  @Public()
  @ApiOperation({
    summary: "Получение фильма",
    description: "Получение фильма" + "\n\n" + "**Roles: PUBLIC**",
  })
  @ApiParam({ name: "id", type: Number, example: 1, description: "Идентификатор фильма" })
  @ApiOkResponse({ status: 200, type: FindOneMovieResponse })
  @ApiResponse({ status: 404, description: "Фильм не найден" })
  @Get(":id")
  async findOne(@Param("id") id: string) {
    return await this.moviesService.findOne(+id);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({
    summary: "Создание фильма",
    description: "Создание фильма" + "\n\n" + "**Roles: SUPER_ADMIN**",
  })
  @ApiBody({ type: CreateMovieDto })
  @ApiResponse({ status: 201, type: MovieResponse })
  @ApiResponse({ status: 400, description: "Неверные параметры" })
  @ApiResponse({ status: 409, description: "Фильм с таким названием уже существует" })
  @Post()
  async create(@Body(new ValidationPipe()) dto: CreateMovieDto) {
    return await this.moviesService.create(dto);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({
    summary: "Удаление фильма",
    description: "Удаление фильма" + "\n\n" + "**Roles: SUPER_ADMIN**",
  })
  @ApiParam({ name: "id", type: Number, description: "Идентификатор фильма" })
  @ApiResponse({ status: 200, type: MovieResponse })
  @ApiResponse({ status: 404, description: "Фильм не найден" })
  @ApiResponse({ status: 400, description: "Неверные параметры" })
  @Delete(":id")
  async delete(@Param("id") id: string) {
    return await this.moviesService.delete(+id);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({
    summary: "Редактирование фильма",
    description: "Редактирование фильма" + "\n\n" + "**Roles: SUPER_ADMIN**",
  })
  @ApiBody({ type: EditMovieDto })
  @ApiParam({ name: "id", type: Number, example: 1, description: "Идентификатор фильма" })
  @ApiResponse({ status: 200, type: MovieResponse })
  @ApiResponse({ status: 404, description: "Фильм не найден" })
  @ApiResponse({ status: 400, description: "Неверные параметры" })
  @Patch(":id")
  async edit(@Param("id") id: string, @Body(new ValidationPipe()) dto: EditMovieDto) {
    return await this.moviesService.edit(+id, dto);
  }
}
