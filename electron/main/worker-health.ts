import { open } from "node:fs/promises";
import { join } from "node:path";

export type WorkerHealth = "unmanaged" | "unknown" | "failed" | "running";

export async function readWorkerHealth(runtimeDirectory?: string): Promise<WorkerHealth> {
	if (!runtimeDirectory) return "unmanaged";
	try {
		const file = await open(join(runtimeDirectory, "observer-ready.json"), "r");
		try {
			const stat = await file.stat();
			if (!stat.isFile() || stat.size > 1024 * 1024) return "unknown";
			const ready = JSON.parse(await file.readFile("utf8"));
			if (ready?.worker_state === "failed") return "failed";
			if (ready?.worker_state !== "running" || ready.driver_registered !== true
				|| typeof ready.observed_at !== "number") return "unknown";
			const age = Date.now() / 1000 - ready.observed_at;
			return age >= 0 && age < 15 ? "running" : "unknown";
		} finally {
			await file.close();
		}
	} catch {
		return "unknown";
	}
}
