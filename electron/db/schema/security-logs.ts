import { sqliteTable, index, integer, text } from "drizzle-orm/sqlite-core";

import { engineEventTypes } from "~/services/ipc-receiver";
import type { IncomingIPCMessage } from "~/services/ipc-receiver";



export const securityLogs = sqliteTable(
	"security_logs",
	{
		id: integer().primaryKey({ autoIncrement: true }),
		sequenceNumber: integer(),
		type: text({ enum: engineEventTypes }).notNull(),
		timestamp: integer().notNull(),
		data: text({ mode: "json" }).$type<IncomingIPCMessage>().notNull(),
		isViewedAt: integer(),
	},
	(table) => [
		index("idx_type_timestamp").on(table.type, table.timestamp),
	],
);
