import { IsIn, IsString } from "class-validator";

export const deployment = ["prod", "stg", "dev", "test"] as const;
export type Deployment = (typeof deployment)[number];

export class ClusterDto {
  @IsString()
  name: string;

  @IsString()
  version: string;

  @IsString()
  description: string;

  @IsIn(deployment)
  mode: Deployment;

  @IsString()
  author: string;
}
