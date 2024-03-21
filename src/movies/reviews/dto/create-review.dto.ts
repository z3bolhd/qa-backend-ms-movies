import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString } from "class-validator";

export class CreateReviewDto {
  @ApiProperty({ example: 4 })
  @IsNumber({}, { message: "Поле rating должно быть числом" })
  readonly rating: number;

  @ApiProperty({ example: "Хорошее кино" })
  @IsOptional()
  @IsString({ message: "Поле text должно быть строкой" })
  readonly text: string;
}
