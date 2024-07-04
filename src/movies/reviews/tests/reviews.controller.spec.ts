import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { ReviewsController } from "../reviews.controller";
import { ReviewsService } from "../reviews.service";
import { Test } from "@nestjs/testing";
import { LoggerModule } from "nestjs-pino";
import { PrismaService } from "@prismadb/prisma.service";
import { MovieReviewResponse } from "src/movies/responses";
import { JwtPayload } from "@auth/interfaces";
import { Review } from "@prisma/client";

const prismaMock = {
  review: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    aggregate: jest.fn(),
  },
  movie: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

const movie = {
  id: 1,
  name: "test",
  description: "test",
  genreId: 1,
  imageUrl: "test",
  price: 1,
  rating: 1,
  location: "MSK",
  published: true,
  createdAt: new Date(),
};

const review: Review & { user: { fullName: string } } = {
  userId: "67723995-bae2-42a4-971b-14fe801c77a5",
  text: "test",
  rating: 5,
  hidden: false,
  createdAt: new Date(),
  movieId: 1,
  user: {
    fullName: "test",
  },
};

const user: JwtPayload = {
  id: "67723995-bae2-42a4-971b-14fe801c77a5",
  email: "test",
  verified: true,
  roles: ["USER"],
};

describe("ReviewsController", () => {
  let reviewsController: ReviewsController;
  let reviewsService: ReviewsService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [LoggerModule.forRoot()],
      controllers: [ReviewsController],
      providers: [
        ReviewsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    reviewsService = moduleRef.get<ReviewsService>(ReviewsService);
    reviewsController = moduleRef.get<ReviewsController>(ReviewsController);

    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(reviewsController).toBeDefined();
    expect(reviewsService).toBeDefined();
  });

  it("should get movie reviews", async () => {
    const result: MovieReviewResponse[] = [review];

    prismaMock.movie.findUnique.mockResolvedValue(movie);
    prismaMock.review.findMany.mockResolvedValue([result]);

    expect(await reviewsController.get("1")).toEqual([result]);
    expect(prismaMock.movie.findUnique).toHaveBeenCalled();
    expect(prismaMock.review.findMany).toHaveBeenCalled();
  });

  it("should not get movie reviews", async () => {
    prismaMock.movie.findUnique.mockRejectedValue(null);

    await expect(reviewsController.get("1")).rejects.toThrow(NotFoundException);
    expect(prismaMock.movie.findUnique).toHaveBeenCalled();
  });

  it("should create review", async () => {
    const result = {
      userId: "67723995-bae2-42a4-971b-14fe801c77a5",
      text: "test",
      rating: 5,
      createdAt: new Date(),
      hidden: false,
      user: {
        fullName: "test",
      },
    };

    prismaMock.review.findUnique.mockRejectedValue(null);
    prismaMock.review.create.mockResolvedValue(result);
    prismaMock.movie.update.mockResolvedValue(movie);
    prismaMock.movie.findUnique.mockResolvedValue(movie);

    expect(await reviewsController.create(user, "1", { text: "test", rating: 5 })).toEqual(result);

    expect(prismaMock.review.findUnique).toHaveBeenCalled();
    expect(prismaMock.movie.update).toHaveBeenCalled();
    expect(prismaMock.review.create).toHaveBeenCalled();
  });

  it("should not create review with already existing review", async () => {
    prismaMock.review.findUnique.mockResolvedValue(review);
    prismaMock.movie.update.mockRejectedValue(movie);
    prismaMock.movie.findUnique.mockResolvedValue(movie);

    await expect(reviewsController.create(user, "1", { text: "test", rating: 5 })).rejects.toThrow(
      ConflictException,
    );

    expect(prismaMock.movie.findUnique).toHaveBeenCalled();
    expect(prismaMock.review.findUnique).toHaveBeenCalled();
    expect(prismaMock.movie.update).not.toHaveBeenCalled();
    expect(prismaMock.review.create).not.toHaveBeenCalled();
  });

  it("should not create review with wrong movie id", async () => {
    prismaMock.movie.findUnique.mockRejectedValue(null);

    await expect(reviewsController.create(user, "2", { text: "test", rating: 5 })).rejects.toThrow(
      NotFoundException,
    );

    expect(prismaMock.movie.findUnique).toHaveBeenCalled();
    expect(prismaMock.review.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.movie.update).not.toHaveBeenCalled();
    expect(prismaMock.review.create).not.toHaveBeenCalled();
  });

  it("should not create review with wrong data", async () => {
    prismaMock.movie.findUnique.mockResolvedValue(movie);
    prismaMock.review.findUnique.mockRejectedValue(null);
    prismaMock.review.create.mockRejectedValue(null);

    await expect(reviewsController.create(user, "1", { text: "test", rating: 5 })).rejects.toThrow(
      BadRequestException,
    );

    expect(prismaMock.movie.findUnique).toHaveBeenCalled();
    expect(prismaMock.review.findUnique).toHaveBeenCalled();
    expect(prismaMock.movie.update).not.toHaveBeenCalled();
  });

  it("should edit review", async () => {
    prismaMock.movie.findUnique.mockResolvedValue(movie);
    prismaMock.movie.update.mockResolvedValue(movie);
    prismaMock.review.findUnique.mockResolvedValue(review);
    prismaMock.review.update.mockResolvedValue(review);

    expect(await reviewsController.edit(user, "1", { text: "test", rating: 5 })).toEqual(review);
    expect(prismaMock.movie.findUnique).toHaveBeenCalled();
    expect(prismaMock.movie.update).toHaveBeenCalled();
    expect(prismaMock.review.findUnique).toHaveBeenCalled();
    expect(prismaMock.review.update).toHaveBeenCalled();
  });

  it("should not edit review with wrong movieId", async () => {
    prismaMock.movie.findUnique.mockRejectedValue(null);

    await expect(reviewsController.edit(user, "2", { text: "test", rating: 5 })).rejects.toThrow(
      NotFoundException,
    );

    expect(prismaMock.movie.findUnique).toHaveBeenCalled();
    expect(prismaMock.review.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.movie.update).not.toHaveBeenCalled();
    expect(prismaMock.review.update).not.toHaveBeenCalled();
  });

  it("should not edit review with not existing review", async () => {
    prismaMock.movie.findUnique.mockResolvedValue(movie);
    prismaMock.review.findUnique.mockRejectedValue(null);

    await expect(reviewsController.edit(user, "1", { text: "test", rating: 5 })).rejects.toThrow(
      NotFoundException,
    );

    expect(prismaMock.movie.findUnique).toHaveBeenCalled();
    expect(prismaMock.review.findUnique).toHaveBeenCalled();
    expect(prismaMock.movie.update).not.toHaveBeenCalled();
    expect(prismaMock.review.update).not.toHaveBeenCalled();
  });

  it("should not edit review with wrong data", async () => {
    prismaMock.movie.findUnique.mockResolvedValue(movie);
    prismaMock.review.findUnique.mockResolvedValue(review);
    prismaMock.review.update.mockRejectedValue(null);

    await expect(reviewsController.edit(user, "1", { text: "test", rating: 5 })).rejects.toThrow(
      BadRequestException,
    );

    expect(prismaMock.movie.findUnique).toHaveBeenCalled();
    expect(prismaMock.review.findUnique).toHaveBeenCalled();
    expect(prismaMock.movie.update).not.toHaveBeenCalled();
    expect(prismaMock.review.update).toHaveBeenCalled();
  });

  it("should delete review", async () => {
    prismaMock.movie.findUnique.mockResolvedValue(movie);
    prismaMock.movie.update.mockResolvedValue(movie);
    prismaMock.review.findUnique.mockResolvedValue(review);
    prismaMock.review.delete.mockResolvedValue(review);

    expect(await reviewsController.delete(user, "1", user.id)).toEqual(review);
    expect(prismaMock.movie.findUnique).toHaveBeenCalled();
    expect(prismaMock.movie.update).toHaveBeenCalled();
    expect(prismaMock.review.findUnique).toHaveBeenCalled();
    expect(prismaMock.review.delete).toHaveBeenCalled();
  });

  it("should not delete review with wrong movieId", async () => {
    prismaMock.movie.findUnique.mockRejectedValue(null);

    await expect(reviewsController.delete(user, "2", user.id)).rejects.toThrow(NotFoundException);

    expect(prismaMock.movie.findUnique).toHaveBeenCalled();
    expect(prismaMock.review.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.movie.update).not.toHaveBeenCalled();
    expect(prismaMock.review.delete).not.toHaveBeenCalled();
  });

  it("should not delete review with not existing review", async () => {
    prismaMock.movie.findUnique.mockResolvedValue(movie);
    prismaMock.review.findUnique.mockRejectedValue(null);

    await expect(reviewsController.delete(user, "1", user.id)).rejects.toThrow(NotFoundException);

    expect(prismaMock.movie.findUnique).toHaveBeenCalled();
    expect(prismaMock.review.findUnique).toHaveBeenCalled();
    expect(prismaMock.movie.update).not.toHaveBeenCalled();
    expect(prismaMock.review.delete).not.toHaveBeenCalled();
  });

  it("should not delete review with no user admin rights", async () => {
    prismaMock.movie.findUnique.mockResolvedValue(movie);
    prismaMock.review.findUnique.mockResolvedValue(review);

    await expect(reviewsController.delete(user, "1", "2")).rejects.toThrow(ForbiddenException);

    expect(prismaMock.movie.findUnique).toHaveBeenCalled();
    expect(prismaMock.review.findUnique).toHaveBeenCalled();
    expect(prismaMock.movie.update).not.toHaveBeenCalled();
    expect(prismaMock.review.delete).not.toHaveBeenCalled();
  });

  it("should delete review with user admin", async () => {
    prismaMock.movie.findUnique.mockResolvedValue(movie);
    prismaMock.review.findUnique.mockResolvedValue(review);
    prismaMock.review.delete.mockResolvedValue(review);

    expect(await reviewsController.delete({ ...user, roles: ["ADMIN"] }, "1", user.id)).toEqual(
      review,
    );

    expect(prismaMock.movie.findUnique).toHaveBeenCalled();
    expect(prismaMock.review.findUnique).toHaveBeenCalled();
    expect(prismaMock.movie.update).toHaveBeenCalled();
    expect(prismaMock.review.delete).toHaveBeenCalled();
  });

  it("should hide review", async () => {
    const notHiddenReview: MovieReviewResponse = { ...review, hidden: false };
    const hiddenReview: MovieReviewResponse = { ...review, hidden: true };

    prismaMock.movie.findUnique.mockResolvedValue(movie);
    prismaMock.movie.update.mockResolvedValue(movie);
    prismaMock.review.findUnique.mockResolvedValue(notHiddenReview);
    prismaMock.review.update.mockResolvedValue(hiddenReview);

    expect(await reviewsController.hide("1", user.id)).toEqual(hiddenReview);

    expect(prismaMock.movie.findUnique).toHaveBeenCalled();
    expect(prismaMock.movie.update).not.toHaveBeenCalled();
    expect(prismaMock.review.findUnique).toHaveBeenCalled();
    expect(prismaMock.review.update).toHaveBeenCalled();
  });

  it("should show review", async () => {
    const notHiddenReview: MovieReviewResponse = { ...review, hidden: false };
    const hiddenReview: MovieReviewResponse = { ...review, hidden: true };

    prismaMock.movie.findUnique.mockResolvedValue(movie);
    prismaMock.movie.update.mockResolvedValue(movie);
    prismaMock.review.findUnique.mockResolvedValue(hiddenReview);
    prismaMock.review.update.mockResolvedValue(notHiddenReview);

    expect(await reviewsController.hide("1", user.id)).toEqual(notHiddenReview);

    expect(prismaMock.movie.findUnique).toHaveBeenCalled();
    expect(prismaMock.movie.update).not.toHaveBeenCalled();
    expect(prismaMock.review.findUnique).toHaveBeenCalled();
    expect(prismaMock.review.update).toHaveBeenCalled();
  });

  it("should not hide review with wrong movieId", async () => {
    prismaMock.movie.findUnique.mockRejectedValue(null);

    await expect(reviewsController.hide("2", user.id)).rejects.toThrow(NotFoundException);

    expect(prismaMock.movie.findUnique).toHaveBeenCalled();
    expect(prismaMock.review.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.movie.update).not.toHaveBeenCalled();
    expect(prismaMock.review.update).not.toHaveBeenCalled();
  });

  it("should not hide review with not existing review", async () => {
    prismaMock.movie.findUnique.mockResolvedValue(movie);
    prismaMock.review.findUnique.mockRejectedValue(null);

    await expect(reviewsController.hide("1", user.id)).rejects.toThrow(NotFoundException);

    expect(prismaMock.movie.findUnique).toHaveBeenCalled();
    expect(prismaMock.review.findUnique).toHaveBeenCalled();
    expect(prismaMock.movie.update).not.toHaveBeenCalled();
    expect(prismaMock.review.update).not.toHaveBeenCalled();
  });
});
