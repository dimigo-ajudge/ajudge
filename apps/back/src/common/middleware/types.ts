import { IncomingMessage } from "node:http";

export type RequestWithUser = IncomingMessage & {
  user?: Record<string, unknown> | "failed";
};
