import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
  ValidationPipe,
} from "@nestjs/common";
import { RolesGuard } from "@auth/guards/role.guard";
import { CurrentUser, Public, Roles } from "@common/decorators";
import { Role } from "@prisma/client";

import { ReviewsService } from "./reviews.service";
import type { JwtPayload } from "@auth/interfaces";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { MovieReviewResponse } from "../responses";

import { CreateReviewDto, EditReviewDto } from "./dto";

@ApiTags("Отзывы")
@Controller("movies")
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Public()
  @ApiOperation({
    summary: "Получение отзывов фильма",
    description: "Получить все отзывы к фильму по его id" + "\n\n" + "**Roles: PUBLIC**",
  })
  @ApiParam({
    name: "movieId",
    description: "Идентификатор фильма",
    example: "1",
  })
  @ApiOkResponse({
    status: 200,
    type: [MovieReviewResponse],
  })
  @ApiResponse({ status: 404, description: "Фильм не найден" })
  @Get(":movieId/reviews")
  async get(@Param("movieId") movieId: string) {
    return await this.reviewsService.getMovieReviews(+movieId);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(Role.USER)
  @ApiOperation({
    summary: "Создание отзыва к фильму",
    description: "Создание отзыва к фильму" + "\n\n" + "**Roles: USER, ADMIN, SUPER_ADMIN**",
  })
  @ApiParam({
    name: "movieId",
    description: "Идентификатор фильма",
    example: 1,
    type: Number,
  })
  @ApiOkResponse({
    status: 200,
    type: [MovieReviewResponse],
  })
  @ApiResponse({ status: 404, description: "Фильм не найден" })
  @ApiResponse({ status: 409, description: "Вы уже оставляли отзыв к этому фильму" })
  @Post(":movieId/reviews")
  async create(
    @CurrentUser() user: JwtPayload,
    @Param("movieId") movieId: string,
    @Body(new ValidationPipe()) dto: CreateReviewDto,
  ) {
    return await this.reviewsService.create(user, +movieId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(Role.USER)
  @ApiOperation({
    summary: "Редактирование отзыва к фильму",
    description:
      "Редактирование отзыва к фильму" +
      "\n\n" +
      "Пользователь может редактировать только свои отзывы" +
      "\n\n" +
      "**Roles: USER, ADMIN, SUPER_ADMIN**",
  })
  @ApiParam({
    name: "movieId",
    description: "Идентификатор фильма",
    example: 1,
    type: Number,
  })
  @ApiBody({
    type: CreateReviewDto,
  })
  @ApiOkResponse({
    status: 200,
    type: MovieReviewResponse,
  })
  @ApiResponse({ status: 404, description: "Отзыв не найден" })
  @Put(":movieId/reviews")
  async edit(
    @CurrentUser() user: JwtPayload,
    @Param("movieId") movieId: string,
    @Body(new ValidationPipe()) dto: EditReviewDto,
  ) {
    return await this.reviewsService.edit(user, +movieId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(Role.USER)
  @ApiOperation({
    summary: "Удаление отзыва к фильму",
    description:
      "Удаление отзыва к фильму" +
      "\n\n" +
      "Если роль пользователя **USER**, то удаляет только свои отзывы" +
      "\n\n" +
      "**Roles: USER, ADMIN, SUPER_ADMIN**",
  })
  @ApiParam({
    name: "movieId",
    description: "Идентификатор фильма",
    example: 1,
    type: Number,
  })
  @ApiParam({
    name: "userId",
    description: "Идентификатор пользователя",
    example: "67723995-bae2-42a4-971b-14fe801c77a5",
    required: false,
  })
  @ApiOkResponse({
    status: 200,
    type: MovieReviewResponse,
  })
  @ApiResponse({ status: 404, description: "Отзыв не найден" })
  @Delete(":movieId/reviews")
  async delete(
    @CurrentUser() user: JwtPayload,
    @Param("movieId") movieId: string,
    @Query("userId") userId: string,
  ) {
    return await this.reviewsService.delete(user, +movieId, userId);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: "Скрытие отзыва к фильму",
    description: "Скрытие отзыва к фильму" + "\n\n" + "**Roles: ADMIN, SUPER_ADMIN**",
  })
  @ApiParam({
    name: "movieId",
    description: "Идентификатор фильма",
    example: 1,
    type: Number,
  })
  @ApiParam({
    name: "userId",
    description: "Идентификатор пользователя",
    example: "67723995-bae2-42a4-971b-14fe801c77a5",
  })
  @ApiOkResponse({
    status: 200,
    type: MovieReviewResponse,
  })
  @ApiResponse({ status: 404, description: "Отзыв не найден" })
  @Patch(":movieId/reviews/hide/:userId")
  async hide(@Param("movieId") movieId: string, @Param("userId") userId: string) {
    return await this.reviewsService.showOrHide(+movieId, userId, true);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: "Показ отзыва к фильму",
    description: "Показ отзыва к фильму" + "\n\n" + "**Roles: ADMIN, SUPER_ADMIN**",
  })
  @ApiParam({
    name: "movieId",
    description: "Идентификатор фильма",
    example: 1,
    type: Number,
  })
  @ApiParam({
    name: "userId",
    description: "Идентификатор пользователя",
    example: "67723995-bae2-42a4-971b-14fe801c77a5",
  })
  @ApiOkResponse({
    status: 200,
    type: MovieReviewResponse,
  })
  @ApiResponse({ status: 404, description: "Отзыв не найден" })
  @Patch(":movieId/reviews/show/:userId")
  async show(@Param("movieId") movieId: string, @Param("userId") userId: string) {
    return await this.reviewsService.showOrHide(+movieId, userId, false);
  }
}
