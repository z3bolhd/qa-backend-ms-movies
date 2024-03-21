import { ApiProperty } from "@nestjs/swagger";
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

export class CreateUserDto {
  @ApiProperty({
    type: String,
    default: "ФИО пользователя",
  })
  @IsString({ message: "Поле fullName должно быть строкой" })
  readonly fullName: string;

  @ApiProperty({
    type: String,
    example: "test@email.com",
  })
  @IsString({ message: "Поле email должно быть строкой" })
  @IsEmail({}, { message: "Поле email некорректно" })
  readonly email: string;

  @ApiProperty({
    type: String,
    example: "12345678Aa",
  })
  @Matches(/^(?=.*[a-zA-Zа-яА-Я])(?=.*\d)[a-zA-Zа-яА-Я\d?@#$%^&*_\-+()\[\]{}><\\/\\|"'.,:;]{8,20}$/)
  @IsString({ message: "Пароль должен быть строкой" })
  @MinLength(8, { message: "Минимальная длина пароля 8 символов" })
  @MaxLength(32, { message: "Максимальная длина пароля 32 символа" })
  readonly password: string;

  // @IsArray()
  // @IsString({ each: true })
  // @Type(() => String)
  // @Transform(({ value }) => (value ? value.split(",") : Object.values(Location)))
  // readonly roles: Role[];

  @ApiProperty({
    type: Boolean,
    default: true,
  })
  @IsBoolean({ message: "Поле verified должно быть булевым значением" })
  readonly verified: boolean;
}
