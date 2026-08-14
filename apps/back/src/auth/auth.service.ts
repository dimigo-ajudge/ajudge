import { HttpException, HttpStatus, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Cron, CronExpression } from "@nestjs/schedule";
import { subMonths } from "date-fns";
import { eq, lt } from "drizzle-orm";
import { OAuth2Client, TokenPayload } from "google-auth-library";
import { StringValue } from "ms";
import { JWTResponse, RedirectUriDTO } from "#/auth/auth.dto";
import { login, session, user } from "#/db/schema";
import { ErrorMsg } from "$/mapper/error";
import { UserJWT } from "$/mapper/types";
import { DRIZZLE, type DrizzleDB } from "$/modules/drizzle.module";
import { andWhere } from "$/utils/where.util";

@Injectable()
export class AuthService {
  genURLOauthClient: OAuth2Client;
  googleOauthClient: OAuth2Client;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
  ) {
    this.genURLOauthClient = new OAuth2Client({
      clientId: configService.get<string>("gcp.oauthId"),
    });
    this.googleOauthClient = new OAuth2Client({
      clientId: configService.get<string>("gcp.oauthId"),
      clientSecret: configService.get<string>("gcp.oauthSecret"),
    });
  }

  async loginByIdPassword(id: string, password: string) {
    const loginRecord = await this.db.query.login.findFirst({
      where: {
        RAW: (t, { and, eq }) => andWhere(and, eq(t.identifier1, id), eq(t.type, "password")),
      },
      with: { user: true },
    });
    if (!loginRecord) {
      throw new HttpException(ErrorMsg.UserIdentifier_NotFound(), HttpStatus.UNAUTHORIZED);
    }
    if (!(await Bun.password.verify(password, loginRecord.identifier2 ?? ""))) {
      throw new HttpException(ErrorMsg.UserIdentifier_NotMatched(), HttpStatus.UNAUTHORIZED);
    }

    const loginUser = loginRecord.user;
    if (!loginUser) {
      throw new HttpException(ErrorMsg.UserIdentifier_NotFound(), HttpStatus.UNAUTHORIZED);
    }

    return await this.generateJWTKeyPair(loginUser, "30m");
  }

  private static readonly GOOGLE_SCOPES = [
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
  ];

  async getGoogleLoginUrl(data: RedirectUriDTO): Promise<string> {
    return this.genURLOauthClient.generateAuthUrl({
      response_type: "code",
      access_type: "online",
      prompt: "consent",
      scope: AuthService.GOOGLE_SCOPES,
      hd: "dimigo.hs.kr",
      ...(data.redirect_uri ? { redirect_uri: data.redirect_uri } : {}),
    });
  }

  async loginByGoogle(
    code: string | null,
    idToken: string | null,
    redirect_uri: string | null,
  ): Promise<JWTResponse> {
    if (!idToken && !code) {
      throw new HttpException(ErrorMsg.GoogleOauthCode_Invalid(), HttpStatus.BAD_REQUEST);
    }

    const ticketPayload = await this.verifyGoogleToken(code, idToken, redirect_uri);

    let loginUser: typeof user.$inferSelect;
    const loginRecord = await this.db.query.login.findFirst({
      where: {
        RAW: (t, { and, eq }) =>
          andWhere(and, eq(t.identifier1, ticketPayload.sub), eq(t.type, "google")),
      },
      with: { user: true },
    });
    const DEFAULT_PICTURE =
      "https://i.pinimg.com/236x/80/f6/ce/80f6ce7b8828349aa277cf3bcb19c477.jpg";
    const picture = ticketPayload.picture || DEFAULT_PICTURE;
    const name = `${ticketPayload.family_name || ""}${ticketPayload.given_name || ""}`;

    if (!loginRecord) {
      loginUser = await this.createUser({
        loginType: "google",
        identifier1: ticketPayload.sub,
        identifier2: null,
        email: ticketPayload.email ?? "",
        picture,
        name,
      });
    } else {
      const existingUser = loginRecord.user;
      if (!existingUser) {
        throw new HttpException(ErrorMsg.UserIdentifier_NotFound(), HttpStatus.UNAUTHORIZED);
      }

      const [updated] = await this.db
        .update(user)
        .set({ picture, name })
        .where(eq(user.id, existingUser.id))
        .returning();

      loginUser = updated ?? existingUser;
    }

    return await this.generateJWTKeyPair(loginUser, "30m");
  }

  async refresh(refreshToken: string) {
    const sessionRecord = await this.db.query.session.findFirst({
      where: { RAW: (t, { eq }) => eq(t.refreshToken, refreshToken || "") },
      with: { user: true },
    });
    if (!sessionRecord) {
      throw new HttpException(ErrorMsg.UserSession_NotFound(), HttpStatus.NOT_FOUND);
    }

    const userRecord = sessionRecord.user;
    if (!userRecord) {
      throw new NotFoundException("User not found");
    }

    return await this.generateJWTKeyPair(userRecord, "30m", sessionRecord);
  }

  async logout(userJwt: UserJWT) {
    const sessionRecord = await this.db.query.session.findFirst({
      where: { RAW: (t, { eq }) => eq(t.sessionIdentifier, userJwt.sessionIdentifier || "") },
    });
    if (!sessionRecord) {
      throw new HttpException("Cannot find valid session.", 404);
    }

    await this.db.delete(session).where(eq(session.id, sessionRecord.id));

    return sessionRecord;
  }

  async generateJWTKeyPair(
    userRecord: typeof user.$inferSelect,
    accessExpire: StringValue,
    old?: typeof session.$inferSelect,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const sessionIdentifier = Bun.randomUUIDv7();
    const accessTokenPayload = this.getAccessTokenPayload(userRecord, sessionIdentifier);

    const keyPair = {
      accessToken: await this.jwtService.signAsync(accessTokenPayload, {
        expiresIn: accessExpire || "10m",
      }),
      refreshToken: Bun.randomUUIDv7(),
    };

    if (old) {
      await this.db
        .update(session)
        .set({
          refreshToken: keyPair.refreshToken,
          sessionIdentifier,
          userId: userRecord.id,
        })
        .where(eq(session.id, old.id));
    } else {
      await this.db.insert(session).values({
        refreshToken: keyPair.refreshToken,
        sessionIdentifier,
        userId: userRecord.id,
      });
    }

    return keyPair;
  }

  private getAccessTokenPayload(userRecord: typeof user.$inferSelect, sessionIdentifier: string) {
    return {
      sessionIdentifier,
      id: userRecord.id,
      email: userRecord.email,
      name: userRecord.name,
      picture: userRecord.picture,
      permission: userRecord.permission,
    };
  }

  private async verifyGoogleToken(
    code: string | null,
    idToken: string | null,
    redirect_uri: string | null,
  ): Promise<TokenPayload> {
    const audience = this.configService.get<string>("gcp.oauthId");
    try {
      if (idToken) {
        const ticket = await this.googleOauthClient.verifyIdToken({ idToken, audience });
        const payload = ticket.getPayload();
        if (!payload) {
          throw new Error("Empty payload");
        }
        return payload;
      }
      const tokenRes = await this.googleOauthClient.getToken({
        code: code!,
        ...(redirect_uri ? { redirect_uri } : {}),
      });
      const ticket = await this.googleOauthClient.verifyIdToken({
        idToken: tokenRes.tokens.id_token ?? "",
        audience,
      });
      const payload = ticket.getPayload();
      if (!payload) {
        throw new Error("Empty payload");
      }
      return payload;
    } catch {
      throw new HttpException(ErrorMsg.GoogleOauthCode_Invalid(), HttpStatus.BAD_REQUEST);
    }
  }

  private async createUser(data: {
    loginType: "password" | "google";
    identifier1: string;
    identifier2: string | null;
    email: string;
    name: string;
    picture: string;
  }) {
    const [newUser] = await this.db
      .insert(user)
      .values({ email: data.email, name: data.name, picture: data.picture })
      .returning();

    if (!newUser) {
      throw new NotFoundException("Failed to create user");
    }

    await this.db.insert(login).values({
      type: data.loginType,
      identifier1: data.identifier1,
      identifier2: data.identifier2,
      userId: newUser.id,
    });

    return newUser;
  }

  @Cron(CronExpression.EVERY_HOUR)
  protected async expiredSessionClear() {
    await this.db.delete(session).where(lt(session.updated_at, subMonths(new Date(), 1)));
  }
}
