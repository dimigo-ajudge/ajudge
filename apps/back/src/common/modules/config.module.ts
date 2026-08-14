import { Module } from "@nestjs/common";
import { ConfigModule, ConfigModuleOptions, registerAs } from "@nestjs/config";

const appConfig = registerAs("app", () => ({
  nodeEnv: process.env.NODE_ENV ?? "prod",
  port: parseInt(process.env.APPLICATION_PORT ?? "3000", 10),
  allowedDomain: process.env.ALLOWED_DOMAIN ?? "",
}));

const dbConfig = registerAs("db", () => ({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  name: process.env.DB_NAME,
  poolMax: parseInt(process.env.DB_POOL_MAX ?? "5", 10),
}));

const jwtConfig = registerAs("jwt", () => ({
  publicKey: process.env.JWT_PUBLIC,
  privateKey: process.env.JWT_PRIVATE,
}));

const gcpConfig = registerAs("gcp", () => ({
  oauthId: process.env.GCP_OAUTH_ID,
  oauthSecret: process.env.GCP_OAUTH_SECRET,
}));

const redisConfig = registerAs("redis", () => ({
  user: process.env.REDIS_USER,
  password: process.env.REDIS_PASSWORD,
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
}));

const dlsConfig = registerAs("dls", () => ({
  id: process.env.DLS_ID,
  password: process.env.DLS_PW,
}));

export const options: ConfigModuleOptions = {
  isGlobal: true,
  load: [appConfig, dbConfig, jwtConfig, gcpConfig, redisConfig, dlsConfig],
};

@Module({ imports: [ConfigModule.forRoot(options)] })
export class CustomConfigModule {}
