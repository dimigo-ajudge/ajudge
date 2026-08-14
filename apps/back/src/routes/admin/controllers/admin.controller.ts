import { Controller, UseGuards } from "@nestjs/common";
import { CustomJwtAuthGuard, PermissionGuard } from "#/auth/guards";
import { AdminUserPermission } from "#/common/mapper/permissions";

@Controller("/admin")
@UseGuards(CustomJwtAuthGuard, PermissionGuard(AdminUserPermission))
export class AdminController {
  constructor() {}
}
