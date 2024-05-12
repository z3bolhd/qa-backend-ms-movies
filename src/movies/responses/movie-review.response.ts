import { ApiProperty } from "@nestjs/swagger";

export class MovieReviewResponse {
  @ApiProperty({ example: "67723995-bae2-42a4-971b-14fe801c77a5" })
  userId: string;

  @ApiProperty({ example: 5 })
  rating: number;

  @ApiProperty({ example: "Cool!" })
  text: string;

  @ApiProperty({ example: false })
  hidden: boolean;

  @ApiProperty({ example: "2024-02-29T06:48:38.551Z" })
  createdAt: Date;

  @ApiProperty({
    example: {
      fullName: "Артём",
    },
  })
  user: {
    fullName: string;
  };
}
