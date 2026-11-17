import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { createReceiptWriter } from "../electron/services/ipc-receiver/receipts";

const db = new Database(":memory:");
db.exec("CREATE TABLE security_logs(type TEXT,sequence_number INTEGER,timestamp INTEGER,data TEXT)");
const persist = createReceiptWriter(db);
const message = { type: "PROCESS_TERMINATE", timestamp: 1234, sequenceNumber: 1, data: { processId: 123 } } as IncomingIPCMessage;
assert.equal(persist([message], ["stable-id"]).fresh.length, 1);
assert.equal(persist([message], ["stable-id"]).fresh.length, 0);
assert.deepEqual(persist([message], ["stable-id"]).ack, ["stable-id"]);
assert.throws(() => persist([{ ...message, timestamp: 999 }], ["stable-id"]), /Conflicting/);
assert.throws(() => persist([message, { ...message, timestamp: 999 }], ["rolled-back", "stable-id"]), /Conflicting/);
assert.equal(db.prepare("SELECT COUNT(*) AS n FROM security_logs").pluck().get(), 1);
assert.equal(db.prepare("SELECT COUNT(*) AS n FROM ui_delivery_receipts").pluck().get(), 1);
db.exec("CREATE TRIGGER deny_log BEFORE INSERT ON security_logs BEGIN SELECT RAISE(ABORT,'disk failure simulation'); END");
assert.throws(() => persist([message], ["not-committed"]), /disk failure/);
assert.equal(db.prepare("SELECT COUNT(*) AS n FROM ui_delivery_receipts").pluck().get(), 1);
db.close();
console.log("PASS: replay deduplication, conflicting IDs, atomic rollback, no receipt on failed storage");

