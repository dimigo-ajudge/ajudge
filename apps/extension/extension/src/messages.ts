import {
  getBackendOrigin,
  getStoredSession,
  loginWithBackend,
  logoutFromBackend,
  ping,
  setBackendOrigin,
  type AuthSession,
} from "./auth";

export type AuthState = {
  backendOrigin: string;
  isAuthenticated: boolean;
};

export type ExtensionMessage =
  | { type: "auth:get-state" }
  | { type: "auth:set-backend-origin"; backendOrigin: string }
  | { type: "auth:login" }
  | { type: "auth:logout" };

export type ExtensionResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export function isExtensionMessage(message: unknown): message is ExtensionMessage {
  if (!message || typeof message !== "object" || !("type" in message)) return false;
  const { type } = message as { type?: unknown };
  return (
    type === "auth:get-state" ||
    type === "auth:set-backend-origin" ||
    type === "auth:login" ||
    type === "auth:logout"
  );
}

export async function getAuthState(): Promise<AuthState> {
  const [backendOrigin, storedSession] = await Promise.all([getBackendOrigin(), getStoredSession()]);
  if (!storedSession) {
    return { backendOrigin, isAuthenticated: false };
  }

  try {
    await ping();
    return { backendOrigin, isAuthenticated: true };
  } catch {
    return { backendOrigin, isAuthenticated: false };
  }
}

export async function handleExtensionMessage(
  message: ExtensionMessage,
): Promise<AuthState | AuthSession> {
  if (message.type === "auth:get-state") {
    return getAuthState();
  }

  if (message.type === "auth:set-backend-origin") {
    await setBackendOrigin(message.backendOrigin);
    return getAuthState();
  }

  if (message.type === "auth:logout") {
    await logoutFromBackend();
    return getAuthState();
  }

  return loginWithBackend();
}
