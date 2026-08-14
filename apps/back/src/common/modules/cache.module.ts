import { CACHE_MANAGER, Cache, CacheModule } from "@nestjs/cache-manager";
import { Inject, Injectable, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { RedisClient } from "bun";
import { CustomConfigModule } from "./config.module";

class BunRedisStore {
  constructor(private readonly client: RedisClient) {}

  async get(key: string) {
    return this.client.get(key);
  }

  async set(key: RedisClient.KeyLike, value: RedisClient.KeyLike, ttl?: number) {
    if (ttl) {
      await this.client.set(key, value, "PX", ttl);
    } else {
      await this.client.set(key, value);
    }
  }

  async delete(key: RedisClient.KeyLike) {
    return (await this.client.del(key)) > 0;
  }

  async clear() {
    return undefined;
  }
}

const cacheModule = CacheModule.registerAsync({
  isGlobal: true,
  imports: [CustomConfigModule],
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => {
    const url = new URL("redis://localhost");
    url.hostname = configService.getOrThrow<string>("redis.host");
    url.port = configService.getOrThrow<string>("redis.port");
    url.username = configService.getOrThrow<string>("redis.user");
    url.password = configService.getOrThrow<string>("redis.password");
    url.pathname = configService.getOrThrow<string>("DB_NAME");
    const client = new RedisClient(url.toString());
    await client.set("ok", "true");
    return {
      skipMemory: true,
      stores: [new BunRedisStore(client)],
    };
  },
});

@Injectable()
export class CacheService {
  private RATELIMIT_PREFIX = "ratelimit_";
  private NOTIFICATION_PREFIX = "notification_";
  private redis: RedisClient;

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly configService: ConfigService,
  ) {
    const url = new URL("redis://localhost");
    url.hostname = this.configService.getOrThrow<string>("redis.host");
    url.port = this.configService.getOrThrow<string>("redis.port");
    url.username = this.configService.getOrThrow<string>("redis.user");
    url.password = this.configService.getOrThrow<string>("redis.password");
    url.pathname = this.configService.getOrThrow<string>("DB_NAME");
    this.redis = new RedisClient(url.toString());
  }

  async rateLimit(key: string, windowMs: number): Promise<boolean> {
    const lastRequest = await this.cacheManager.get<number>(this.RATELIMIT_PREFIX + key);

    if (lastRequest === undefined || Date.now() - lastRequest > windowMs) {
      await this.cacheManager.set(this.RATELIMIT_PREFIX + key, Date.now());
      return true;
    }
    return false;
  }

  async get<T>(key: string): Promise<T | undefined> {
    return this.cacheManager.get<T>(key);
  }

  async set(key: string, value: unknown, ttlMs?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttlMs);
  }

  async ttl(key: string): Promise<number> {
    return this.redis.pttl(key);
  }

  async isNotificationAlreadySent(id: string): Promise<boolean> {
    const key = this.NOTIFICATION_PREFIX + id;

    const isThisCluster = Bun.randomUUIDv7();
    await this.redis.set(key, isThisCluster, "EX", "3600", "NX");
    return (await this.redis.get(key)) !== isThisCluster;
  }
}

@Module({
  imports: [cacheModule],
  providers: [CacheService],
  exports: [CacheService, cacheModule],
})
export class CustomCacheModule {}
