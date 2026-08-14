import { Module } from "@nestjs/common";
import { AuthController } from "#/auth/auth.controller";
import { AuthService } from "#/auth/auth.service";
import { CustomCacheModule } from "$/modules/cache.module";
import { CustomConfigModule } from "$/modules/config.module";
import { CustomJWTModule } from "$/modules/jwt.module";

@Module({
  imports: [CustomJWTModule, CustomConfigModule, CustomCacheModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
