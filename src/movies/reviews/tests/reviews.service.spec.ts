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
import { CreateReviewDto } from "../dto";

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

const reviewDto: CreateReviewDto = {
  text: "test",
  rating: 5,
};

describe("ReviewsService", () => {
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

    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(reviewsService).toBeDefined();
  });

  describe("findAll", () => {
    it("should find all reviews", async () => {
      const result: MovieReviewResponse[] = [review];

      prismaMock.movie.findUnique.mockResolvedValue(movie);
      prismaMock.review.findMany.mockResolvedValue([result]);

      expect(await reviewsService.findAll(1)).toEqual([result]);
      expect(prismaMock.movie.findUnique).toHaveBeenCalled();
      expect(prismaMock.review.findMany).toHaveBeenCalled();
    });

    it("should not find all reviews", async () => {
      prismaMock.movie.findUnique.mockRejectedValue(null);

      await expect(reviewsService.findAll(1)).rejects.toThrow(NotFoundException);
      expect(prismaMock.movie.findUnique).toHaveBeenCalled();
    });
  });

  describe("create", () => {
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

      expect(await reviewsService.create(user, 1, reviewDto)).toEqual(result);

      expect(prismaMock.review.findUnique).toHaveBeenCalled();
      expect(prismaMock.movie.update).toHaveBeenCalled();
      expect(prismaMock.review.create).toHaveBeenCalled();
    });

    it("should not create review with already existing review", async () => {
      prismaMock.review.findUnique.mockResolvedValue(review);
      prismaMock.movie.update.mockRejectedValue(movie);
      prismaMock.movie.findUnique.mockResolvedValue(movie);

      await expect(reviewsService.create(user, 1, reviewDto)).rejects.toThrow(ConflictException);

      expect(prismaMock.movie.findUnique).toHaveBeenCalled();
      expect(prismaMock.review.findUnique).toHaveBeenCalled();
      expect(prismaMock.movie.update).not.toHaveBeenCalled();
      expect(prismaMock.review.create).not.toHaveBeenCalled();
    });

    it("should not create review with wrong movie id", async () => {
      prismaMock.movie.findUnique.mockRejectedValue(null);

      await expect(reviewsService.create(user, 2, reviewDto)).rejects.toThrow(NotFoundException);

      expect(prismaMock.movie.findUnique).toHaveBeenCalled();
      expect(prismaMock.review.findUnique).not.toHaveBeenCalled();
      expect(prismaMock.movie.update).not.toHaveBeenCalled();
      expect(prismaMock.review.create).not.toHaveBeenCalled();
    });

    it("should not create review with wrong data", async () => {
      prismaMock.movie.findUnique.mockResolvedValue(movie);
      prismaMock.review.findUnique.mockRejectedValue(null);
      prismaMock.review.create.mockRejectedValue(null);

      await expect(reviewsService.create(user, 1, reviewDto)).rejects.toThrow(BadRequestException);

      expect(prismaMock.movie.findUnique).toHaveBeenCalled();
      expect(prismaMock.review.findUnique).toHaveBeenCalled();
      expect(prismaMock.movie.update).not.toHaveBeenCalled();
    });
  });

  describe("edit", () => {
    it("should edit review", async () => {
      prismaMock.movie.findUnique.mockResolvedValue(movie);
      prismaMock.movie.update.mockResolvedValue(movie);
      prismaMock.review.findUnique.mockResolvedValue(review);
      prismaMock.review.update.mockResolvedValue(review);

      expect(await reviewsService.edit(user, 1, reviewDto)).toEqual(review);
      expect(prismaMock.movie.findUnique).toHaveBeenCalled();
      expect(prismaMock.movie.update).toHaveBeenCalled();
      expect(prismaMock.review.findUnique).toHaveBeenCalled();
      expect(prismaMock.review.update).toHaveBeenCalled();
    });

    it("should not edit review with wrong movieId", async () => {
      prismaMock.movie.findUnique.mockRejectedValue(null);

      await expect(reviewsService.edit(user, 2, reviewDto)).rejects.toThrow(NotFoundException);

      expect(prismaMock.movie.findUnique).toHaveBeenCalled();
      expect(prismaMock.review.findUnique).not.toHaveBeenCalled();
      expect(prismaMock.movie.update).not.toHaveBeenCalled();
      expect(prismaMock.review.update).not.toHaveBeenCalled();
    });

    it("should not edit review with not existing review", async () => {
      prismaMock.movie.findUnique.mockResolvedValue(movie);
      prismaMock.review.findUnique.mockRejectedValue(null);

      await expect(reviewsService.edit(user, 1, reviewDto)).rejects.toThrow(NotFoundException);

      expect(prismaMock.movie.findUnique).toHaveBeenCalled();
      expect(prismaMock.review.findUnique).toHaveBeenCalled();
      expect(prismaMock.movie.update).not.toHaveBeenCalled();
      expect(prismaMock.review.update).not.toHaveBeenCalled();
    });

    it("should not edit review with wrong data", async () => {
      prismaMock.movie.findUnique.mockResolvedValue(movie);
      prismaMock.review.findUnique.mockResolvedValue(review);
      prismaMock.review.update.mockRejectedValue(null);

      await expect(reviewsService.edit(user, 1, reviewDto)).rejects.toThrow(BadRequestException);

      expect(prismaMock.movie.findUnique).toHaveBeenCalled();
      expect(prismaMock.review.findUnique).toHaveBeenCalled();
      expect(prismaMock.movie.update).not.toHaveBeenCalled();
      expect(prismaMock.review.update).toHaveBeenCalled();
    });
  });

  describe("delete", () => {
    it("should delete review", async () => {
      prismaMock.movie.findUnique.mockResolvedValue(movie);
      prismaMock.movie.update.mockResolvedValue(movie);
      prismaMock.review.findUnique.mockResolvedValue(review);
      prismaMock.review.delete.mockResolvedValue(review);

      expect(await reviewsService.delete(user, 1, user.id)).toEqual(review);
      expect(prismaMock.movie.findUnique).toHaveBeenCalled();
      expect(prismaMock.movie.update).toHaveBeenCalled();
      expect(prismaMock.review.findUnique).toHaveBeenCalled();
      expect(prismaMock.review.delete).toHaveBeenCalled();
    });

    it("should not delete review with wrong movieId", async () => {
      prismaMock.movie.findUnique.mockRejectedValue(null);

      await expect(reviewsService.delete(user, 2, user.id)).rejects.toThrow(NotFoundException);

      expect(prismaMock.movie.findUnique).toHaveBeenCalled();
      expect(prismaMock.review.findUnique).not.toHaveBeenCalled();
      expect(prismaMock.movie.update).not.toHaveBeenCalled();
      expect(prismaMock.review.delete).not.toHaveBeenCalled();
    });

    it("should not delete review with not existing review", async () => {
      prismaMock.movie.findUnique.mockResolvedValue(movie);
      prismaMock.review.findUnique.mockRejectedValue(null);

      await expect(reviewsService.delete(user, 1, user.id)).rejects.toThrow(NotFoundException);

      expect(prismaMock.movie.findUnique).toHaveBeenCalled();
      expect(prismaMock.review.findUnique).toHaveBeenCalled();
      expect(prismaMock.movie.update).not.toHaveBeenCalled();
      expect(prismaMock.review.delete).not.toHaveBeenCalled();
    });

    it("should not delete review with no user admin rights", async () => {
      prismaMock.movie.findUnique.mockResolvedValue(movie);
      prismaMock.review.findUnique.mockResolvedValue(review);

      await expect(reviewsService.delete(user, 1, "2")).rejects.toThrow(ForbiddenException);

      expect(prismaMock.movie.findUnique).toHaveBeenCalled();
      expect(prismaMock.review.findUnique).not.toHaveBeenCalled();
      expect(prismaMock.movie.update).not.toHaveBeenCalled();
      expect(prismaMock.review.delete).not.toHaveBeenCalled();
    });

    it("should delete review with user admin", async () => {
      prismaMock.movie.findUnique.mockResolvedValue(movie);
      prismaMock.review.findUnique.mockResolvedValue(review);
      prismaMock.review.delete.mockResolvedValue(review);

      expect(await reviewsService.delete({ ...user, roles: ["ADMIN"] }, 1, user.id)).toEqual(
        review,
      );

      expect(prismaMock.movie.findUnique).toHaveBeenCalled();
      expect(prismaMock.review.findUnique).toHaveBeenCalled();
      expect(prismaMock.movie.update).toHaveBeenCalled();
      expect(prismaMock.review.delete).toHaveBeenCalled();
    });
  });

  describe("hide", () => {
    it("should hide review", async () => {
      const shownReview: MovieReviewResponse = { ...review, hidden: false };
      const hiddenReview: MovieReviewResponse = { ...review, hidden: true };

      prismaMock.movie.findUnique.mockResolvedValue(movie);
      prismaMock.movie.update.mockResolvedValue(movie);
      prismaMock.review.findUnique.mockResolvedValue(shownReview);
      prismaMock.review.update.mockResolvedValue(hiddenReview);

      expect(await reviewsService.hide(1, user.id)).toEqual(hiddenReview);

      expect(prismaMock.movie.findUnique).toHaveBeenCalled();
      expect(prismaMock.movie.update).not.toHaveBeenCalled();
      expect(prismaMock.review.findUnique).toHaveBeenCalled();
      expect(prismaMock.review.update).toHaveBeenCalled();
    });

    it("should not hide review with wrong movieId", async () => {
      prismaMock.movie.findUnique.mockRejectedValue(null);

      await expect(reviewsService.hide(2, user.id)).rejects.toThrow(NotFoundException);

      expect(prismaMock.movie.findUnique).toHaveBeenCalled();
      expect(prismaMock.review.findUnique).not.toHaveBeenCalled();
      expect(prismaMock.movie.update).not.toHaveBeenCalled();
      expect(prismaMock.review.update).not.toHaveBeenCalled();
    });

    it("should not hide review with not existing review", async () => {
      prismaMock.movie.findUnique.mockResolvedValue(movie);
      prismaMock.review.findUnique.mockRejectedValue(null);

      await expect(reviewsService.hide(1, user.id)).rejects.toThrow(NotFoundException);

      expect(prismaMock.movie.findUnique).toHaveBeenCalled();
      expect(prismaMock.review.findUnique).toHaveBeenCalled();
      expect(prismaMock.movie.update).not.toHaveBeenCalled();
      expect(prismaMock.review.update).not.toHaveBeenCalled();
    });
  });

  describe("show", () => {
    describe("hide", () => {
      it("should show review", async () => {
        const shownReview: MovieReviewResponse = { ...review, hidden: false };
        const hiddenReview: MovieReviewResponse = { ...review, hidden: true };

        prismaMock.movie.findUnique.mockResolvedValue(movie);
        prismaMock.movie.update.mockResolvedValue(movie);
        prismaMock.review.findUnique.mockResolvedValue(shownReview);
        prismaMock.review.update.mockResolvedValue(hiddenReview);

        expect(await reviewsService.show(1, user.id)).toEqual(hiddenReview);

        expect(prismaMock.movie.findUnique).toHaveBeenCalled();
        expect(prismaMock.movie.update).not.toHaveBeenCalled();
        expect(prismaMock.review.findUnique).toHaveBeenCalled();
        expect(prismaMock.review.update).toHaveBeenCalled();
      });

      it("should not show review with wrong movieId", async () => {
        prismaMock.movie.findUnique.mockRejectedValue(null);

        await expect(reviewsService.show(2, user.id)).rejects.toThrow(NotFoundException);

        expect(prismaMock.movie.findUnique).toHaveBeenCalled();
        expect(prismaMock.review.findUnique).not.toHaveBeenCalled();
        expect(prismaMock.movie.update).not.toHaveBeenCalled();
        expect(prismaMock.review.update).not.toHaveBeenCalled();
      });

      it("should not show review with not existing review", async () => {
        prismaMock.movie.findUnique.mockResolvedValue(movie);
        prismaMock.review.findUnique.mockRejectedValue(null);

        await expect(reviewsService.show(1, user.id)).rejects.toThrow(NotFoundException);

        expect(prismaMock.movie.findUnique).toHaveBeenCalled();
        expect(prismaMock.review.findUnique).toHaveBeenCalled();
        expect(prismaMock.movie.update).not.toHaveBeenCalled();
        expect(prismaMock.review.update).not.toHaveBeenCalled();
      });
    });
  });
});
