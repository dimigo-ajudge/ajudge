import { UseGuards } from "@nestjs/common";

export function UseGuardWhenProduction(...guards: Parameters<typeof UseGuards>) {
  return Bun.env.NODE_ENV === "prod" ? UseGuards(...guards) : () => {};
}
