import { ExtensionPlatform } from "./platform";

const BACKEND_ORIGIN_KEY = "trustlayerBackendOrigin";
const AUTH_SESSION_KEY = "trustlayerAuthSession";
const DEFAULT_BACKEND_ORIGIN = "http://localhost:3000";

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
};

type ApiEnvelope<T> = {
  status?: number;
  data?: T;
  message?: string;
};

function normalizeBackendOrigin(origin: string): string {
  return origin.replace(/\/+$/, "");
}

function unwrapEnvelope<T>(value: ApiEnvelope<T> | T): T {
  if (value && typeof value === "object" && "data" in value) {
    return (value as ApiEnvelope<T>).data as T;
  }
  return value as T;
}

async function request<T>(
  path: string,
  options: RequestInit & { backendOrigin?: string } = {},
): Promise<T> {
  const { backendOrigin, headers, ...requestOptions } = options;
  const origin = backendOrigin || (await getBackendOrigin());
  const response = await fetch(`${origin}${path}`, {
    ...requestOptions,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });

  const body = (await response.json().catch(() => null)) as ApiEnvelope<T> | T | null;
  if (!response.ok) {
    const message = body && typeof body === "object" && "message" in body ? body.message : null;
    throw new Error(
      typeof message === "string" ? message : `Backend request failed with ${response.status}.`,
    );
  }
  if (body === null) throw new Error("Backend returned an invalid response.");
  return unwrapEnvelope<T>(body);
}

export async function getBackendOrigin(): Promise<string> {
  const stored = await ExtensionPlatform.storageGet(BACKEND_ORIGIN_KEY);
  const origin = stored[BACKEND_ORIGIN_KEY];
  return typeof origin === "string" && origin ? origin : DEFAULT_BACKEND_ORIGIN;
}

export async function setBackendOrigin(origin: string): Promise<void> {
  await ExtensionPlatform.storageSet({
    [BACKEND_ORIGIN_KEY]: normalizeBackendOrigin(origin),
  });
}

export async function getStoredSession(): Promise<AuthSession | null> {
  const stored = await ExtensionPlatform.storageGet(AUTH_SESSION_KEY);
  const session = stored[AUTH_SESSION_KEY];
  if (!session || typeof session !== "object") return null;

  const { accessToken, refreshToken } = session as Partial<AuthSession>;
  if (typeof accessToken !== "string" || typeof refreshToken !== "string") return null;
  return { accessToken, refreshToken };
}

export async function clearStoredSession(): Promise<void> {
  await ExtensionPlatform.storageRemove(AUTH_SESSION_KEY);
}

export async function logoutFromBackend(): Promise<void> {
  const session = await getStoredSession();
  try {
    if (session) {
      await request<unknown>("/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
    }
  } finally {
    await clearStoredSession();
  }
}

async function storeSession(session: AuthSession): Promise<void> {
  await ExtensionPlatform.storageSet({
    [AUTH_SESSION_KEY]: session,
  });
}

export async function ping(): Promise<void> {
  const session = await getStoredSession();
  if (!session) throw new Error("No login session is stored.");
  await request<unknown>("/auth/ping", {
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });
}

export async function loginWithBackend(): Promise<AuthSession> {
  const backendOrigin = await getBackendOrigin();
  const redirectUri = ExtensionPlatform.getRedirectURL("login/callback");
  const loginParams = new URLSearchParams({ redirect_uri: redirectUri });
  const loginUrl = await request<string>(`/auth/login/google?${loginParams.toString()}`, {
    backendOrigin,
    method: "GET",
    headers: {},
  });

  const redirectedTo = await ExtensionPlatform.launchWebAuthFlow(loginUrl);
  if (!redirectedTo) {
    throw new Error("Login did not return a redirect URL.");
  }

  const code = new URL(redirectedTo).searchParams.get("code");
  if (!code) {
    throw new Error("Login redirect did not include an authorization code.");
  }

  const session = await request<AuthSession>("/auth/login/google/callback", {
    backendOrigin,
    method: "POST",
    body: JSON.stringify({
      code,
      redirect_uri: redirectUri,
    }),
  });

  await storeSession(session);
  return session;
}
