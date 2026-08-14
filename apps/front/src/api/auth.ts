import { getInstance } from "./client";

const client = getInstance();

export async function ping(): Promise<"퐁"> {
  return (await client.get("/auth/ping")).data;
}

export async function getPermission(): Promise<{ permissions: string[] }> {
  return (await client.get("/auth/permission")).data;
}

export async function getGoogleLoginURL(): Promise<string> {
  return (await client.get("/auth/login/google", {
    params: { redirect_uri: `${location.protocol}//${location.host}/login/callback`}
  })).data;
}

export async function googleLogin(
  code: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  return (
    await client.post("/auth/login/google/callback", {
      code,
      redirect_uri: `${location.protocol}//${location.host}/login/callback`,
    })
  ).data;
}
