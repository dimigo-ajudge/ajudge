import { Global, Inject, Module, OnApplicationShutdown } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SQL } from "bun";
import { drizzle } from "drizzle-orm/bun-sql";
import { relations } from "#/db";
import { CustomConfigModule } from "$/modules/config.module";

export const DRIZZLE = Symbol("DRIZZLE");
const DB_CLIENT = Symbol("DB_CLIENT");

export type DrizzleDB = ReturnType<typeof drizzle<typeof relations>>;

@Global()
@Module({
  imports: [CustomConfigModule],
  providers: [
    {
      provide: DB_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const poolMax = configService.get<number>("db.poolMax") ?? 5;

        return new SQL({
          username: configService.getOrThrow<string>("db.user"),
          password: configService.getOrThrow<string>("db.password"),
          host: configService.getOrThrow<string>("db.host"),
          port: configService.getOrThrow<string>("db.port"),
          database: configService.getOrThrow<string>("db.name"),
          max: Number.isFinite(poolMax) && poolMax > 0 ? poolMax : 5,
          idleTimeout: 30,
        });
      },
    },
    {
      provide: DRIZZLE,
      inject: [DB_CLIENT, ConfigService],
      useFactory: (client: SQL, configService: ConfigService) =>
        drizzle({
          client,
          relations,
          logger: configService.getOrThrow<string>("app.nodeEnv") !== "prod",
        }),
    },
  ],
  exports: [DRIZZLE],
})
export class DrizzleModule implements OnApplicationShutdown {
  constructor(@Inject(DB_CLIENT) private readonly client: SQL) {}

  async onApplicationShutdown() {
    await this.client.end();
  }
}
