import Database from "better-sqlite3";

import type { FirewallRequest, IncomingFWMessage } from "./types";

/** Share the response coordinator's SQLite write lock across policy changes.
 * The integrated launcher supplies the SAME DB as --response-state-db.
 * Standalone operation without that setting retains its existing behavior.
 */
export async function withPolicyOwner(
	request: FirewallRequest,
	send: () => Promise<IncomingFWMessage>,
	statePath = process.env.RANSOM0_FIREWALL_STATE_DB,
): Promise<IncomingFWMessage> {
	if (!statePath || request.action === "get") return send();
	let db: Database.Database | undefined;
	try {
		db = new Database(statePath, { fileMustExist: true, timeout: 0 });
		db.exec("BEGIN IMMEDIATE");
		const row = db.prepare("SELECT COUNT(*) AS count FROM firewall_holds").get() as { count: number };
		if (row.count > 0) {
			return { success: false, action: request.action,
				message: "자동 대응이 방화벽 정책을 유지 중입니다. 대응 또는 검토 완료 후 다시 시도하세요." };
		}
		return await send();
	} catch {
		return { success: false, action: request.action,
			message: "방화벽 정책 소유권을 확인할 수 없습니다. 엔진 상태를 확인하고 다시 시도하세요." };
	} finally {
		if (db?.inTransaction) db.exec("ROLLBACK");
		db?.close();
	}
}
