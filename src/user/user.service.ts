import { Injectable } from "@nestjs/common";

import { PrismaService } from "@prismadb/prisma.service";
import { ConfigService } from "@nestjs/config";
import { PinoLogger } from "nestjs-pino";

@Injectable()
export class UserService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(UserService.name);
  }

  async findOne(idOrEmail: string) {
    this.logger.info({ user: { idOrEmail } }, "Find user");
    const user = await this.prismaService.user.findFirst({
      where: {
        OR: [{ id: idOrEmail }, { email: idOrEmail }],
      },
    });
    return user;
  }
}
