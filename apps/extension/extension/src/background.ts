import {
  handleExtensionMessage,
  isExtensionMessage,
  type ExtensionResponse,
} from "./messages";
import { ExtensionPlatform } from "./platform";

ExtensionPlatform.api.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!isExtensionMessage(message)) return false;

  handleExtensionMessage(message)
    .then((data) => {
      sendResponse({ ok: true, data } satisfies ExtensionResponse<typeof data>);
    })
    .catch((error: Error) => {
      sendResponse({ ok: false, error: error.message } satisfies ExtensionResponse<never>);
    });

  return true;
});
