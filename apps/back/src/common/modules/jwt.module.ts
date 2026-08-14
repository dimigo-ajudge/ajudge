import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtModule, JwtModuleAsyncOptions } from "@nestjs/jwt";

import { CustomConfigModule } from "$/modules/config.module";

export const JWTOptions: JwtModuleAsyncOptions = {
  imports: [CustomConfigModule],
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => ({
    publicKey: configService.get<string>("jwt.publicKey"),
    privateKey: configService.get<string>("jwt.privateKey"),
    global: true,
    signOptions: {
      algorithm: "RS256",
    },
  }),
};

@Global()
@Module({
  imports: [JwtModule.registerAsync(JWTOptions)],
  exports: [JwtModule],
})
export class CustomJWTModule {}
