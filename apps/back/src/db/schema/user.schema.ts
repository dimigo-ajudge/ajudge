import {
  pgTable,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: uuid().primaryKey().defaultRandom(),
  email: varchar().notNull().unique(),
  name: varchar().notNull(),
  picture: varchar().notNull(),
  permission: varchar().notNull().default("0"),
});

