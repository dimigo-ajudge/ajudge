import { Module } from "@nestjs/common";
import { CustomCacheModule } from "$/modules/cache.module";
import { AdminController } from "./controllers";
import { AdminService } from "./providers";

@Module({
  imports: [CustomCacheModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
