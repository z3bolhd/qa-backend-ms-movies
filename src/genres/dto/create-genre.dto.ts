import { IsValueTrimmedConstraint } from "@common/decorators";
import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Matches, MinLength, Validate } from "class-validator";

export class CreateGenreDto {
  @ApiProperty({
    type: String,
    example: "Название жанра",
  })
  @IsString({ message: "Поле name должно быть строкой" })
  @IsNotEmpty({ message: "Поле name не может быть пустым" })
  @Matches(/^[a-zA-Zа-яА-Я\s]+$/, {
    message: "Поле name может содержать только буквы и пробелы",
  })
  @Validate(IsValueTrimmedConstraint)
  @MinLength(3, { message: "Поле name должно содержать не менее 3 символов" })
  readonly name: string;
}
