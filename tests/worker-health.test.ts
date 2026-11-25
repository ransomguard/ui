import { expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readWorkerHealth } from "../electron/main/worker-health";

test("distinguishes the latest collector failure, a fresh heartbeat and an unreadable status", async () => {
	const dir = await mkdtemp(join(tmpdir(), "ransom0-ui-health-"));
	const file = join(dir, "observer-ready.json");
	try {
		expect(await readWorkerHealth()).toBe("unmanaged");
		expect(await readWorkerHealth(dir)).toBe("unknown");
		await writeFile(file, "{");
		expect(await readWorkerHealth(dir)).toBe("unknown");
		await writeFile(file, JSON.stringify({ worker_state: "failed" }));
		expect(await readWorkerHealth(dir)).toBe("failed");
		const now = Date.now() / 1000;
		const heartbeat = { worker_state: "running", driver_registered: true, observed_at: now };
		await writeFile(file, JSON.stringify(heartbeat));
		expect(await readWorkerHealth(dir)).toBe("running");
		for (const change of [{ observed_at: now - 16 }, { observed_at: now + 60 }, { driver_registered: false }, { observed_at: String(now) }]) {
			await writeFile(file, JSON.stringify({ ...heartbeat, ...change }));
			expect(await readWorkerHealth(dir)).toBe("unknown");
		}
	} finally {
		await rm(dir, { recursive: true, force: true });
	}
});
