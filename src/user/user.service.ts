import {
  ConflictException,
  Injectable,
  Logger,
} from "@nestjs/common";
import { hashSync, genSaltSync } from "bcrypt";

import { Role, User } from "@prisma/client";
import { PrismaService } from "@prisma/prisma.service";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class UserService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  private readonly logger = new Logger(UserService.name);

  async create(user: Partial<User>) {
    const hashedPassword = this.hashPassword(user.password);
    const isDevelopment = this.configService.get("NODE_ENV") === "development";

    return await this.prismaService.user
      .create({
        data: {
          email: user.email,
          fullName: user.fullName,
          password: hashedPassword,
          verified: isDevelopment,
          roles: [Role.USER],
        },
        select: {
          email: true,
          fullName: true,
          verified: true,
          roles: true,
          createdAt: true,
        },
      })
      .catch(() => {
        throw new ConflictException("Пользователь с таким email уже зарегистрирован");
      });
  }

  async findOne(idOrEmail: string) {
    const user = await this.prismaService.user.findFirst({
      where: {
        OR: [{ id: idOrEmail }, { email: idOrEmail }],
      },
    });
    return user;
  }

  async getMe(id: string) {
    return await this.prismaService.user.findFirst({
      where: { id },
      select: {
        id: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        roles: true,
      },
    });
  }

  private hashPassword(password: string) {
    return hashSync(password, genSaltSync(10));
  }
}
