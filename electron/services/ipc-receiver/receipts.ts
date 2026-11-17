import { createHash } from "node:crypto";
import type Database from "better-sqlite3";

// Receipt and log commit together. A lost ACK can safely replay the same ID.
export function createReceiptWriter(db: Database.Database) {
	db.exec("CREATE TABLE IF NOT EXISTS ui_delivery_receipts(id TEXT PRIMARY KEY, digest TEXT NOT NULL)");
	const lookup = db.prepare("SELECT digest FROM ui_delivery_receipts WHERE id=?");
	const receipt = db.prepare("INSERT INTO ui_delivery_receipts VALUES(?,?)");
	const log = db.prepare("INSERT INTO security_logs(type,sequence_number,timestamp,data) VALUES(?,?,?,?)");
	return db.transaction((messages: IncomingIPCMessage[], ids: (string | undefined)[]) => {
		const fresh: IncomingIPCMessage[] = [];
		const ack: string[] = [];
		messages.forEach((message, index) => {
			const id = ids[index];
			const payload = JSON.stringify(message);
			const digest = createHash("sha256").update(payload).digest("hex");
			if (id) {
				const previous = lookup.get(id) as { digest: string } | undefined;
				if (previous) {
					if (previous.digest !== digest) throw new Error("Conflicting delivery ID");
					ack.push(id);
					return;
				}
				receipt.run(id, digest);
				ack.push(id);
			}
			if (message.type !== "SYSTEM_STATUS") {
				log.run(message.type, message.sequenceNumber ?? null, message.timestamp, payload);
			}
			fresh.push(message);
		});
		return { fresh, ack };
	});
}
