import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
  ValidationPipe,
} from "@nestjs/common";
import { RolesGuard } from "@auth/guards/role.guard";

import { Public, Roles } from "@common/decorators";
import { Role } from "@prisma/client";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";

import { GenreResponse } from "./responses";
import { GenresService } from "./genres.service";
import { CreateGenreDto } from "./dto";

@ApiTags("Жанры")
@Controller("genres")
export class GenresController {
  constructor(private readonly genresService: GenresService) {}

  @Public()
  @ApiOperation({
    summary: "Получение жанров фильмов",
    description: "Получение жанров фильмов" + "\n\n" + "**Roles: PUBLIC**",
  })
  @ApiResponse({
    status: 200,
    type: [GenreResponse],
  })
  @Get()
  async findAll() {
    return await this.genresService.findAll();
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({
    summary: "Создание жанра",
    description: "Создание жанра" + "\n\n" + "**Roles: SUPER_ADMIN**",
  })
  @ApiResponse({
    status: 201,
    type: GenreResponse,
  })
  @ApiResponse({
    status: 400,
    description: "Неверные параметры",
  })
  @ApiResponse({
    status: 409,
    description: "Такой жанр уже существует",
  })
  @Post()
  async create(@Body(new ValidationPipe()) dto: CreateGenreDto) {
    return await this.genresService.create(dto);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({
    summary: "Удаление жанра",
    description: "Удаление жанра" + "\n\n" + "**Roles: SUPER_ADMIN**",
  })
  @ApiParam({
    name: "id",
    type: Number,
  })
  @ApiResponse({
    status: 200,
    type: GenreResponse,
  })
  @ApiResponse({
    status: 404,
    description: "Жанр не найден",
  })
  @Delete(":id")
  async delete(@Param("id") id: string) {
    return await this.genresService.delete(+id);
  }

  @Public()
  @ApiOperation({
    summary: "Получение жанра по ID",
    description: "Получение жанра по ID" + "\n\n" + "**Roles: PUBLIC**",
  })
  @ApiResponse({
    status: 200,
    type: GenreResponse,
  })
  @ApiResponse({
    status: 404,
    description: "Жанр не найден",
  })
  @ApiParam({
    name: "id",
    type: Number,
  })
  @Get(":id")
  async findOne(@Param("id") id: string) {
    return await this.genresService.findOne(+id);
  }
}
