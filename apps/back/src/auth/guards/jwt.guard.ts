import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { FastifyRequest } from "fastify";
import { ACCESS_TOKEN_COOKIE } from "$/mapper/constants";

@Injectable()
export class CustomJwtAuthGuard implements CanActivate {
  private logger = new Logger(CustomJwtAuthGuard.name);

  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest & { user?: unknown }>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      request.user = payload;
    } catch (e) {
      this.logger.warn(`Failed to verify JWT: ${e}`);
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractToken(request: FastifyRequest): string | undefined {
    const [type, token] = request.headers.authorization?.split(" ") ?? [];
    if (type === "Bearer" && token) {
      return token;
    }

    if (request.cookies?.[ACCESS_TOKEN_COOKIE]) {
      return request.cookies[ACCESS_TOKEN_COOKIE];
    }

    return undefined;
  }
}
