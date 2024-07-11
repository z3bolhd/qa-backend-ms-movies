import { IsValueTrimmedConstraint } from "@common/decorators";
import { ApiProperty } from "@nestjs/swagger";
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  Min,
  MinLength,
  Validate,
} from "class-validator";

export class CreateReviewDto {
  @ApiProperty({ example: 4 })
  @IsNotEmpty({ message: "Поле rating не может быть пустым" })
  @IsNumber({}, { message: "Поле rating должно быть числом" })
  @IsInt({ message: "Поле rating должно быть целым числом" })
  @Max(5, { message: "Поле rating должно быть меньше или равно 5" })
  @Min(1, { message: "Поле rating должно быть больше или равно 1" })
  readonly rating: number;

  @ApiProperty({ example: "Хорошее кино" })
  @IsNotEmpty({ message: "Поле text не может быть пустым" })
  @IsString({ message: "Поле text должно быть строкой" })
  @Validate(IsValueTrimmedConstraint)
  @MinLength(3, { message: "Поле text должно содержать не менее 3 символов" })
  readonly text: string;
}
