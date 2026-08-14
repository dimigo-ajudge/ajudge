import fastifyCompress from "@fastify/compress";
import fastifyCookie from "@fastify/cookie";
import fastifyMultipart from "@fastify/multipart";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";

import { AppModule } from "#/app";
import { ValidationService } from "$/modules/validation.module";
import { BootLogger } from "$/utils/boot-logger.util";

export async function bootstrap(isInit: boolean = true) {
  const bootLogger = new BootLogger(isInit);
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      bodyLimit: 50 * 1024 * 1024,
    }),
    { logger: bootLogger },
  );

  const configService = app.get(ConfigService);
  type NestFastifyPlugin = Parameters<NestFastifyApplication["register"]>[0];

  const protocol = Bun.env.NODE_ENV !== "dev" ? "https" : "http";
  app.enableCors({
    origin: configService
      .get<string>("app.allowedDomain")
      ?.split(",")
      .map((d) => `${protocol}://${d}`),
    credentials: true,
    methods: ["GET", "HEAD", "POST", "PUT", "DELETE", "PATCH"],
  });

  await app.register(fastifyCompress as unknown as NestFastifyPlugin, {
    encodings: ["zstd"],
  });
  await app.register(fastifyCookie as unknown as NestFastifyPlugin);
  await app.register(fastifyMultipart as unknown as NestFastifyPlugin, {
    limits: {
      fileSize: 20 * 1024 * 1024,
      files: 5,
    },
  });

  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  const port = configService.get<number>("app.port") ?? 3000;
  await app.listen(port, "0.0.0.0");

  if (isInit) {
    const validationService = app.get<ValidationService>(ValidationService);
    await validationService.validatePermissionEnum();
  }
}

if (import.meta.main) {
  bootstrap();
}
