import { Module } from "@nestjs/common";

import { UserService } from "./user.service";
import { CacheModule } from "@nestjs/cache-manager";

@Module({
  exports: [UserService],
  providers: [UserService],
  imports: [CacheModule.register()],
})
export class UserModule {}
