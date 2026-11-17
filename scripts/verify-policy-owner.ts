import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { withPolicyOwner } from "../electron/services/firewall-tool/policy-owner";

async function main() {
const folder = fs.mkdtempSync(path.join(os.tmpdir(), "ransom0-policy-test-"));
const file = path.join(folder, "holds.sqlite3");
const db = new Database(file, { timeout: 0 });
db.exec("CREATE TABLE firewall_holds(incident_id TEXT PRIMARY KEY, state TEXT)");
let sends = 0;
const send = async () => { sends++; return { success: true, action: "set", active: false } as const; };
try {
	assert.equal((await withPolicyOwner({ action: "set" }, send, file)).success, true);
	db.exec("INSERT INTO firewall_holds VALUES('incident', 'review_required')");
	assert.equal((await withPolicyOwner({ action: "set" }, send, file)).success, false);
	assert.equal((await withPolicyOwner({ action: "refresh" }, send, file)).success, false);
	assert.equal(sends, 1);
	assert.equal((await withPolicyOwner({ action: "get" }, send, file)).success, true);
	db.exec("DELETE FROM firewall_holds");
	await withPolicyOwner({ action: "set" }, async () => {
		assert.throws(() => db.exec("BEGIN IMMEDIATE"), /locked/);
		return send();
	}, file);
	db.exec("BEGIN IMMEDIATE");
	assert.equal((await withPolicyOwner({ action: "set" }, send, file)).success, false);
	db.exec("ROLLBACK");
	assert.equal((await withPolicyOwner({ action: "set" }, send, file + ".missing")).success, false);
	console.log("PASS: holds, review, read-only status, shared lock, missing DB; sends=" + sends);
} finally {
	db.close();
	fs.rmSync(folder, { recursive: true });
}

}
main().catch(error => { console.error(error); process.exitCode = 1; });

