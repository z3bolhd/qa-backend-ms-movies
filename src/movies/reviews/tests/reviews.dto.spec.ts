import { BadRequestException, ValidationPipe } from "@nestjs/common";
import { Review } from "@prisma/client";
import { CreateReviewDto, EditReviewDto } from "../dto";
import { pick } from "@common/utils";

describe("ReviewsDto", () => {
  const target: ValidationPipe = new ValidationPipe({ whitelist: true, transform: true });
  let reviewDto: Review;

  beforeEach(() => {
    reviewDto = {
      text: "test",
      rating: 5,
      createdAt: new Date(),
      hidden: false,
      movieId: 5,
      userId: "test",
    };
  });

  it("should validate CreateReviewDto", async () => {
    const review = pick(reviewDto, "text", "rating");

    expect(await target.transform(review, { type: "body", metatype: CreateReviewDto })).toEqual(
      review,
    );
  });

  it("should not validate CreateReviewDto with rating below 1", async () => {
    const review = pick(reviewDto, "rating", "text");
    await expect(
      target.transform({ ...review, rating: 0 }, { type: "body", metatype: CreateReviewDto }),
    ).rejects.toThrow(BadRequestException);
  });

  it("should not validate CreateReviewDto with empty text", async () => {
    const review = pick(reviewDto, "text");
    await expect(
      target.transform({ ...review, text: "" }, { type: "body", metatype: CreateReviewDto }),
    ).rejects.toThrow(BadRequestException);
  });

  it("should not validate CreateReviewDto with rating above 5", async () => {
    const review = pick(reviewDto, "rating", "text");
    await expect(
      target.transform({ ...review, rating: 6 }, { type: "body", metatype: CreateReviewDto }),
    ).rejects.toThrow(BadRequestException);
  });

  it("should validate EditReviewDto", async () => {
    const review = pick(reviewDto, "text", "rating");
    expect(await target.transform(review, { type: "body", metatype: EditReviewDto })).toEqual(
      review,
    );
  });

  it("should not validate EditReviewDto with rating below 1", async () => {
    const review = pick(reviewDto, "rating", "text");
    await expect(
      target.transform({ ...review, rating: 0 }, { type: "body", metatype: EditReviewDto }),
    ).rejects.toThrow(BadRequestException);
  });

  it("should not validate EditReviewDto with empty text", async () => {
    const review = pick(reviewDto, "text");
    await expect(
      target.transform({ ...review, text: "" }, { type: "body", metatype: EditReviewDto }),
    ).rejects.toThrow(BadRequestException);
  });

  it("should not validate EditReviewDto with rating above 5", async () => {
    const review = pick(reviewDto, "rating", "text");
    await expect(
      target.transform({ ...review, rating: 6 }, { type: "body", metatype: EditReviewDto }),
    ).rejects.toThrow(BadRequestException);
  });
});
