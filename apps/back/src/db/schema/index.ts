export * from "./auth.schema";
export * from "./requests.schema";
export * from "./user.schema";
export * from "./validation.schema";

import type { login, session } from "./auth.schema";
import type { requests } from "./requests.schema";
import type { user } from "./user.schema";
import type { permissionValidator } from "./validation.schema";

export type User = typeof user.$inferSelect;
export type Login = typeof login.$inferSelect;
export type Session = typeof session.$inferSelect;
export type PermissionValidator = typeof permissionValidator.$inferSelect;
export type Requests = typeof requests.$inferSelect;

