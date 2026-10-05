import { sqliteTable, index, integer, text } from "drizzle-orm/sqlite-core";

import { engineEventTypes } from "~/services/ipc-receiver";
import type { EngineEventType, IncomingIPCMessage } from "~/services/ipc-receiver";



// SYSTEM_STATUS는 실시간 상테 확인만을 위한 이벤트이므로 저장하지 않음

export type SecurityLogType = Exclude<EngineEventType, "SYSTEM_STATUS">;
export const securityLogTypes = engineEventTypes.filter(x => x !== "SYSTEM_STATUS") as [SecurityLogType, ...SecurityLogType[]];

export const securityLogs = sqliteTable(
	"security_logs",
	{
		id: integer().primaryKey({ autoIncrement: true }),
		sequenceNumber: integer(),
		type: text({ enum: securityLogTypes }).notNull(),
		timestamp: integer().notNull(),
		data: text({ mode: "json" }).$type<IncomingIPCMessage>().notNull(),
		isViewedAt: integer(),
	},
	(table) => [
		index("idx_type_timestamp").on(table.type, table.timestamp),
	],
);
