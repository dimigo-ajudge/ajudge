type CallbackStyleFunction<T> = (...args: unknown[]) => Promise<T> | void;

const detectedRuntimeApi =
  typeof browser !== "undefined" ? browser : typeof chrome !== "undefined" ? chrome : undefined;

if (!detectedRuntimeApi) {
  throw new Error("No WebExtension runtime API is available.");
}

const runtimeApi: RuntimeApi = detectedRuntimeApi;

function callbackOrPromise<T>(fn: CallbackStyleFunction<T>, ...args: unknown[]): Promise<T> {
  const maybePromise = fn(...args);
  if (maybePromise && typeof maybePromise.then === "function") {
    return maybePromise;
  }

  return new Promise((resolve, reject) => {
    fn(...args, (result: T) => {
      const lastError = runtimeApi.runtime.lastError;
      if (lastError) {
        reject(new Error(lastError.message || "Extension API call failed."));
        return;
      }
      resolve(result);
    });
  });
}

export const ExtensionPlatform = {
  api: runtimeApi,
  storageGet(key: string): Promise<Record<string, unknown>> {
    return callbackOrPromise<Record<string, unknown>>(
      runtimeApi.storage.local.get.bind(runtimeApi.storage.local) as CallbackStyleFunction<
        Record<string, unknown>
      >,
      key,
    );
  },
  storageSet(value: Record<string, unknown>): Promise<void> {
    return callbackOrPromise<void>(
      runtimeApi.storage.local.set.bind(runtimeApi.storage.local) as CallbackStyleFunction<void>,
      value,
    );
  },
  storageRemove(key: string): Promise<void> {
    return callbackOrPromise<void>(
      runtimeApi.storage.local.remove.bind(runtimeApi.storage.local) as CallbackStyleFunction<void>,
      key,
    );
  },
  sendMessage<T = unknown>(message: unknown): Promise<T> {
    return callbackOrPromise<T>(
      runtimeApi.runtime.sendMessage.bind(runtimeApi.runtime) as CallbackStyleFunction<T>,
      message,
    );
  },
  getRedirectURL(path: string): string {
    if (!runtimeApi.identity) {
      throw new Error("The browser identity API is unavailable.");
    }
    return runtimeApi.identity.getRedirectURL(path);
  },
  launchWebAuthFlow(url: string): Promise<string | undefined> {
    if (!runtimeApi.identity) {
      throw new Error("The browser identity API is unavailable.");
    }
    return callbackOrPromise<string | undefined>(
      runtimeApi.identity.launchWebAuthFlow.bind(runtimeApi.identity) as CallbackStyleFunction<
        string | undefined
      >,
      { url, interactive: true },
    );
  },
};
