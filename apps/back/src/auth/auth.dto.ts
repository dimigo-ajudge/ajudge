import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class PasswordLoginDTO {
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class RedirectUriDTO {
  @IsString()
  @IsOptional()
  redirect_uri?: string;
}

export class GoogleWebLoginDTO {
  @IsString()
  @IsNotEmpty()
  code: string;

  redirect_uri: string;
}

export class GoogleAppLoginDTO {
  @IsString()
  @IsNotEmpty()
  idToken: string;
}

export class RefreshTokenDTO {
  @IsString()
  @IsOptional()
  refreshToken?: string;
}

export class JWTResponse {
  @IsString()
  accessToken: string;

  @IsString()
  refreshToken: string;
}
