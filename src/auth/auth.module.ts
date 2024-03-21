import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { JwtModule } from "@nestjs/jwt";

import { UserModule } from "@user/user.module";

import { GUARDS } from "./guards";
import { STRATEGIES } from "./strategies";
import { options } from "./config";

@Module({
  providers: [...STRATEGIES, ...GUARDS],
  imports: [UserModule, PassportModule, JwtModule.registerAsync(options())],
})
export class AuthModule {}
