import { MiddlewareConsumer, Module, NestModule, RequestMethod } from "@nestjs/common";
import { APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";
import { AppService } from "#/app/app.service";
import { HealthController } from "#/app/health.controller";
import { AuthModule } from "#/auth";
import * as routes from "#/routes";
import { ApiExceptionFilter } from "$/filters";
import { BodyLoggerInterceptor, ResponseWrapperInterceptor } from "$/interceptors";
import { CustomLoggerMiddleware, JwtDecoderMiddleware } from "$/middleware";
import { CustomEssentialModules } from "$/modules";

@Module({
  imports: [...CustomEssentialModules, AuthModule, ...Object.values(routes)],
  controllers: [HealthController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: ApiExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: BodyLoggerInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseWrapperInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(JwtDecoderMiddleware, CustomLoggerMiddleware)
      .forRoutes({ path: "*", method: RequestMethod.ALL });
  }
}
