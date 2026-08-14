import { ServerResponse } from "node:http";
import { Injectable, Logger, NestMiddleware } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ACCESS_TOKEN_COOKIE } from "../mapper/constants";
import { RequestWithUser } from "./types";

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) {
    return {};
  }
  return Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const eqIdx = c.indexOf("=");
      if (eqIdx === -1) {
        return [c.trim(), ""];
      }
      return [c.slice(0, eqIdx).trim(), decodeURIComponent(c.slice(eqIdx + 1).trim())];
    }),
  );
}

@Injectable()
export class JwtDecoderMiddleware implements NestMiddleware {
  private logger = new Logger(JwtDecoderMiddleware.name);

  constructor(private readonly jwtService: JwtService) {}

  async use(req: RequestWithUser, _res: ServerResponse, next: () => void): Promise<void> {
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies[ACCESS_TOKEN_COOKIE] || req.headers.authorization?.replace("Bearer ", "");

    if (token) {
      try {
        req.user = await this.jwtService.verifyAsync<Record<string, unknown>>(token);
      } catch {
        const decoded = this.jwtService.decode<Record<string, unknown>>(token);
        if (decoded) {
          this.logger.warn(`Invalid token for: ${JSON.stringify(decoded)}`);
        }
        req.user = "failed";
      }
    }
    // No token: req.user stays undefined → logger shows "unknown"

    next();
  }
}
