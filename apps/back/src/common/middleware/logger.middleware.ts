import { ServerResponse } from "node:http";
import { Inject, Injectable, Logger, NestMiddleware } from "@nestjs/common";
import { requests } from "#/db/schema";
import { DRIZZLE, type DrizzleDB } from "$/modules/drizzle.module";
import { RequestWithUser } from "./types";

@Injectable()
export class CustomLoggerMiddleware implements NestMiddleware {
  private logger = new Logger(CustomLoggerMiddleware.name);

  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  use(req: RequestWithUser, res: ServerResponse, next: () => void): void {
    // TODO: CF-IP DOESN'T WORK!!
    const startTimestamp = Date.now();
    const reqMethod = req.method;
    const rawReq = req as RequestWithUser & { raw?: { url?: string }; originalUrl?: string };
    const originURL = rawReq.raw?.url ?? rawReq.originalUrl ?? req.url ?? "";
    const httpVersion = `HTTP/${req.httpVersion}`;
    const userAgent = req.headers["user-agent"];
    const ipAddress =
      (req.headers["cf-connecting-ip"] as string | undefined) ?? req.socket?.remoteAddress;
    const forwardedForHeader = req.headers["x-forwarded-for"];
    const forwardedFor = Array.isArray(forwardedForHeader)
      ? forwardedForHeader.join(" > ")
      : forwardedForHeader?.replace(/,/g, " > ");

    if (
      originURL === "/health" &&
      typeof userAgent === "string" &&
      typeof ipAddress === "string" &&
      !forwardedFor &&
      userAgent.startsWith("curl/") &&
      ipAddress === "127.0.0.1"
    ) {
      return next();
    }

    const { user } = req;
    let authorization: string;
    if (user && typeof user === "object") {
      authorization = `${user.id}(${user.name})`;
    } else if (user === "failed") {
      authorization = "failed";
    } else {
      authorization = "unknown";
    }

    res.on("finish", () => {
      const statusCode = res.statusCode;
      const duration_ms = Date.now() - startTimestamp;

      this.logger.log(
        `From ${
          forwardedFor ? `${forwardedFor} through ${ipAddress}` : (ipAddress ?? "unknown")
        } (${userAgent}) - Requested "${reqMethod} ${originURL} ${httpVersion}" | Responded with HTTP ${statusCode} by uid{${authorization}} +${duration_ms}ms `,
      );

      this.db
        .insert(requests)
        .values({
          ip: (ipAddress ?? "unknown").slice(0, 16),
          userAgent: userAgent ?? null,
          reqMethod,
          originURL,
          httpVersion,
          statusCode,
          authorization,
          duration_ms,
        })
        .catch((err) => this.logger.error("Failed to log request to DB", err));
    });

    next();
  }
}
