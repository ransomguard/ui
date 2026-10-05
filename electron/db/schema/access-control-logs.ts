import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";



const targets = [
	"block",
	"whitelist",
] as const;

const actions = [
	"add",
	"remove",
] as const;

export const accessControlLogs = sqliteTable(
	"access_control_logs",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		target: text({ enum: targets }).notNull(),
		action: text({ enum: actions }).notNull(),
		success: integer({ mode: "boolean" }).notNull(),
		ips: text({ mode: "json" }).$type<string[]>(),
		reason: text(),
		errorMessage: text(),
		performedAt: integer().notNull().default(sql`(unixepoch('subsecond') * 1000)`),
	},
);
