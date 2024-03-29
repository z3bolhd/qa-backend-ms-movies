import { IsNumber, IsString } from "class-validator";

export class EditReviewDto {
  @IsNumber({}, { message: "Поле rating должно быть числом" })
  readonly rating: number;

  @IsString({ message: "Поле text должно быть строкой" })
  readonly text: string;
}
