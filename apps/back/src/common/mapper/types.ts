import type { User } from "#/db/schema";

export const LoginTypeValues = ["password", "google"] as const;
export type LoginType = (typeof LoginTypeValues)[number];

export const PermissionValidationTypeValues = ["permission", "permission_group"] as const;
export type PermissionValidationType = (typeof PermissionValidationTypeValues)[number];

export type UserJWT = User & { sessionIdentifier?: string };
