import { integer, pgTable, smallint, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const requests = pgTable("requests", {
  ip: varchar({ length: 16 }).notNull(),
  userAgent: text(),
  reqMethod: varchar({ length: 10 }),
  originURL: text().notNull(),
  httpVersion: text().notNull(),
  statusCode: smallint().notNull(),
  authorization: text().notNull(),
  created_at: timestamp("created_at", { mode: "date", precision: 6 }).defaultNow().notNull(),
  duration_ms: integer().notNull(),
});
