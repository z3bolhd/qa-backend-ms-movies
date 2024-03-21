import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";

export class LoginDto {
  @ApiProperty({
    type: String,
    example: "test@email.com",
  })
  @IsString({ message: "Поле email должно быть строкой" })
  @IsEmail({}, { message: "Поле email не соответствует" })
  email: string;

  @ApiProperty({
    type: String,
    example: "12345678Aa",
  })
  @IsString({ message: "Поле password должно быть строкой" })
  password: string;
}
