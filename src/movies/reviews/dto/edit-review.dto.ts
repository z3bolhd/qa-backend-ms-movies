import { IsInt, IsNotEmpty, IsNumber, IsString, Max, Min } from "class-validator";

export class EditReviewDto {
  @IsNotEmpty({ message: "Поле rating не может быть пустым" })
  @IsNumber({}, { message: "Поле rating должно быть числом" })
  @IsInt({ message: "Поле rating должно быть целым числом" })
  @Min(1, { message: "Поле rating должно быть больше или равно 1" })
  @Max(5, { message: "Поле rating должно быть меньше или равно 5" })
  readonly rating: number;

  @IsNotEmpty({ message: "Поле text не может быть пустым" })
  @IsString({ message: "Поле text должно быть строкой" })
  readonly text: string;
}
