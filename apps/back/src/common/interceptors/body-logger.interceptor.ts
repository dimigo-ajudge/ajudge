import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { Observable } from "rxjs";

@Injectable()
export class BodyLoggerInterceptor implements NestInterceptor {
  private logger = new Logger(BodyLoggerInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<FastifyRequest>();
    const body = req.body;

    if (body && typeof body === "object" && Object.keys(body as object).length > 0) {
      try {
        const stringifiedBody = JSON.stringify(body);
        if (Buffer.byteLength(stringifiedBody, "utf8") < 1024 * 1024) {
          this.logger.log(`Request Body: ${stringifiedBody}`);
        } else {
          this.logger.log("Request Body: [Too large to log]");
        }
      } catch {
        this.logger.error("Could not stringify request body");
      }
    }

    return next.handle();
  }
}
