import { getInstance } from "./client";

const client = getInstance();

export type CurrentUser = {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
};

export async function ping(): Promise<"퐁"> {
  return (await client.get("/auth/ping")).data;
}

export async function getPermission(): Promise<{ permissions: string[] }> {
  return (await client.get("/auth/permission")).data;
}

export async function getGoogleLoginURL(): Promise<string> {
  return (
    await client.get("/auth/login/google", {
      params: { redirect_uri: `${location.origin}/login/callback` },
    })
  ).data;
}

export async function googleLogin(
  code: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  return (
    await client.post("/auth/login/google/callback", {
      code,
      redirect_uri: `${location.origin}/login/callback`,
    })
  ).data;
}

export async function getCurrentUser(): Promise<CurrentUser> {
  return (await client.get("/auth/me")).data;
}

export async function logout(): Promise<void> {
  await client.post("/auth/logout");
}
