import { ExtensionPlatform } from "./platform";
import type { AuthState, ExtensionMessage, ExtensionResponse } from "./messages";

const statusElement = document.querySelector<HTMLParagraphElement>("#status");
const messageElement = document.querySelector<HTMLParagraphElement>("#message");
const backendForm = document.querySelector<HTMLFormElement>("#backend-form");
const backendInput = document.querySelector<HTMLInputElement>("#backend-origin");
const loginButton = document.querySelector<HTMLButtonElement>("#login");
const logoutButton = document.querySelector<HTMLButtonElement>("#logout");

function requireElement<T extends Element>(element: T | null, name: string): T {
  if (!element) {
    throw new Error(`${name} element was not found.`);
  }
  return element;
}

const ui = {
  status: requireElement(statusElement, "status"),
  message: requireElement(messageElement, "message"),
  backendForm: requireElement(backendForm, "backend-form"),
  backendInput: requireElement(backendInput, "backend-origin"),
  loginButton: requireElement(loginButton, "login"),
  logoutButton: requireElement(logoutButton, "logout"),
};

function setBusy(isBusy: boolean): void {
  ui.loginButton.disabled = isBusy;
  ui.logoutButton.disabled = isBusy;
  ui.backendInput.disabled = isBusy;
}

function renderState(state: AuthState): void {
  ui.backendInput.value = state.backendOrigin;
  ui.status.textContent = state.isAuthenticated ? "Connected to backend" : "Not logged in";
  ui.loginButton.hidden = state.isAuthenticated;
  ui.logoutButton.hidden = !state.isAuthenticated;
}

async function sendMessage<T>(message: ExtensionMessage): Promise<T> {
  const response = await ExtensionPlatform.sendMessage<ExtensionResponse<T>>(message);
  if (!response.ok) {
    throw new Error(response.error);
  }
  return response.data;
}

async function refreshState(): Promise<void> {
  const state = await sendMessage<AuthState>({ type: "auth:get-state" });
  renderState(state);
}

ui.backendForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setBusy(true);
  ui.message.textContent = "";

  try {
    const state = await sendMessage<AuthState>({
      type: "auth:set-backend-origin",
      backendOrigin: ui.backendInput.value,
    });
    renderState(state);
    ui.message.textContent = "Backend saved.";
  } catch (error) {
    ui.message.textContent = error instanceof Error ? error.message : "Could not save backend.";
  } finally {
    setBusy(false);
  }
});

ui.loginButton.addEventListener("click", async () => {
  setBusy(true);
  ui.message.textContent = "Opening login...";

  try {
    await sendMessage({ type: "auth:login" });
    await refreshState();
    ui.message.textContent = "Login complete.";
  } catch (error) {
    ui.message.textContent = error instanceof Error ? error.message : "Login failed.";
  } finally {
    setBusy(false);
  }
});

ui.logoutButton.addEventListener("click", async () => {
  setBusy(true);
  ui.message.textContent = "";

  try {
    const state = await sendMessage<AuthState>({ type: "auth:logout" });
    renderState(state);
    ui.message.textContent = "Logged out.";
  } catch (error) {
    ui.message.textContent = error instanceof Error ? error.message : "Logout failed.";
  } finally {
    setBusy(false);
  }
});

refreshState().catch((error: Error) => {
  ui.status.textContent = "Not available";
  ui.message.textContent = error.message;
});
