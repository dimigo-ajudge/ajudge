import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { FastifyReply, FastifyRequest } from "fastify";
import {
  GoogleAppLoginDTO,
  GoogleWebLoginDTO,
  PasswordLoginDTO,
  RedirectUriDTO,
  RefreshTokenDTO,
} from "#/auth/auth.dto";
import { AuthService } from "#/auth/auth.service";
import { CustomJwtAuthGuard } from "#/auth/guards";
import type { User } from "#/db/schema";
import { CurrentUser } from "$/decorators/user.decorator";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "$/mapper/constants";
import { parsePermission } from "$/utils/permission.util";

@Controller("/auth")
export class AuthController {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {}

  @Get("/ping")
  @UseGuards(CustomJwtAuthGuard)
  async ping() {
    return "퐁";
  }

  @HttpCode(HttpStatus.OK)
  @Get("/permission")
  @UseGuards(CustomJwtAuthGuard)
  async getPermission(@CurrentUser() user: User) {
    const permissions = parsePermission(user.permission).map((p) => p.toLowerCase());
    return { permissions };
  }

  @HttpCode(HttpStatus.OK)
  @Post("/login/password")
  async passwordLogin(
    @Res({ passthrough: true }) res: FastifyReply,
    @Body() data: PasswordLoginDTO,
  ) {
    const token = await this.authService.loginByIdPassword(data.email, data.password);
    this.generateCookie(res, token);
    return token;
  }

  @Get("/login/google")
  async googleLogin(@Query() data: RedirectUriDTO) {
    return await this.authService.getGoogleLoginUrl(data);
  }

  @Get("/login/google/callback")
  async googleWebLoginCallbackGet(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
    @Query("code") code: string,
  ) {
    const protocol = req.headers["x-forwarded-proto"] || req.protocol;
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const redirectUri = `${protocol}://${host}${req.url.split("?")[0]}`;
    const token = await this.authService.loginByGoogle(code, null, redirectUri);
    this.generateCookie(res, token);
    return token;
  }

  @HttpCode(HttpStatus.OK)
  @Post("/login/google/callback")
  async googleWebLoginCallback(
    @Res({ passthrough: true }) res: FastifyReply,
    @Body() data: GoogleWebLoginDTO,
  ) {
    const token = await this.authService.loginByGoogle(data.code, null, data.redirect_uri);
    this.generateCookie(res, token);
    return token;
  }

  @HttpCode(HttpStatus.OK)
  @Post("/login/google/callback/app")
  async googleAppLoginCallback(
    @Res({ passthrough: true }) res: FastifyReply,
    @Body() data: GoogleAppLoginDTO,
  ) {
    const token = await this.authService.loginByGoogle(null, data.idToken, null);
    this.generateCookie(res, token);
    return token;
  }

  @HttpCode(HttpStatus.OK)
  @Post("/refresh")
  async refreshToken(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
    @Body() data: RefreshTokenDTO,
  ) {
    if (data?.refreshToken) {
      return this.authService.refresh(data.refreshToken);
    }
    const token = await this.authService.refresh(req.cookies[REFRESH_TOKEN_COOKIE] ?? "");
    this.generateCookie(res, token);
    return token;
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(CustomJwtAuthGuard)
  @Get("/logout")
  async logout(@CurrentUser() user: User, @Res({ passthrough: true }) res: FastifyReply) {
    await this.authService.logout(user);

    res.header("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.header("Pragma", "no-cache");
    res.header("Expires", "0");

    this.clearAuthCookies(res);
    return { success: true };
  }

  private generateCookie(res: FastifyReply, token: { accessToken: string; refreshToken: string }) {
    // Clear legacy cookies that may have been set without a domain
    res.clearCookie(ACCESS_TOKEN_COOKIE);
    res.clearCookie(REFRESH_TOKEN_COOKIE);

    const { sameSite, domains, secure } = this.cookieMeta();

    for (const domain of domains) {
      res.setCookie(ACCESS_TOKEN_COOKIE, token.accessToken, {
        path: "/",
        maxAge: 60 * 30,
        httpOnly: true,
        secure,
        sameSite,
        domain,
      });
      res.setCookie(REFRESH_TOKEN_COOKIE, token.refreshToken, {
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
        httpOnly: true,
        secure,
        sameSite,
        domain,
      });
    }
  }

  private clearAuthCookies(res: FastifyReply) {
    const { sameSite, domains, secure } = this.cookieMeta();
    for (const domain of domains) {
      res.clearCookie(ACCESS_TOKEN_COOKIE, { path: "/", httpOnly: true, secure, sameSite, domain });
      res.clearCookie(REFRESH_TOKEN_COOKIE, {
        path: "/",
        httpOnly: true,
        secure,
        sameSite,
        domain,
      });
    }
  }

  private cookieMeta() {
    const isProd = Bun.env.NODE_ENV !== "dev";
    return {
      sameSite: (isProd ? "none" : "lax") as "none" | "lax",
      secure: isProd,
      domains: isProd
        ? (this.configService
            .get<string>("app.allowedDomain")
            ?.split(",")
            .map((d) => {
              try {
                return new URL(d).hostname;
              } catch {
                return d;
              }
            }) ?? [undefined])
        : [undefined],
    };
  }
}
