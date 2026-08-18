declare global {
  type ExtensionCallback<T> = (result: T) => void;

  type RuntimeApi = {
    identity?: {
      getRedirectURL(path?: string): string;
      launchWebAuthFlow(
        details: { url: string; interactive: boolean },
        callback?: ExtensionCallback<string | undefined>,
      ): Promise<string | undefined> | void;
    };
    runtime: {
      lastError?: { message?: string };
      sendMessage(message: unknown, callback?: ExtensionCallback<unknown>): Promise<unknown> | void;
      onMessage: {
        addListener(
          callback: (
            message: unknown,
            sender: unknown,
            sendResponse: ExtensionCallback<unknown>,
          ) => boolean | void,
        ): void;
      };
    };
    storage: {
      local: {
        get(
          key: string | string[] | Record<string, unknown> | null,
          callback?: ExtensionCallback<Record<string, unknown>>,
        ): Promise<Record<string, unknown>> | void;
        set(value: Record<string, unknown>, callback?: () => void): Promise<void> | void;
        remove(key: string | string[], callback?: () => void): Promise<void> | void;
      };
    };
  };

  var browser: RuntimeApi | undefined;
  var chrome: RuntimeApi | undefined;
}

export {};
