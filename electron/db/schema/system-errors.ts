import { sqliteTable, index, integer, text } from "drizzle-orm/sqlite-core";



const sources = [
	"DB_INSERT",
	"IPC_RECEIVER",
] as const;

export const systemErrors = sqliteTable(
	"system_errors",
	{
		id: integer().primaryKey({ autoIncrement: true }),
		source: text({ enum: sources }).notNull(),
		timestamp: integer().notNull(),
		data: text().notNull(),
		reason: text(),
		isViewedAt: integer(),
		resolvedAt: integer(),
	},
	(table) => [
		index("idx_source_timestamp").on(table.source, table.timestamp),
	],
);
