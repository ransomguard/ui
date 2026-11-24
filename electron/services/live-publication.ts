// Only renderer publication is batched. Persistence, receipt ACKs and native
// threat notifications must remain outside this queue and run immediately.
export function createLivePublication<T extends { type: string }>(
	send: (items: T[]) => void,
	options: { delayMs?: number; limit?: number } = {},
) {
	const delay = options.delayMs ?? 100;
	const limit = options.limit ?? 2048;
	if (!Number.isInteger(limit) || limit < 1 || !Number.isFinite(delay) || delay < 0) throw new Error("Invalid publication bound");
	const ordinary = new Set(["FILE_WRITE", "FILE_RENAME", "PROCESS_CREATE", "PROCESS_TERMINATE"]);
	let pending: T[] = [];
	let timer: ReturnType<typeof setTimeout> | undefined;
	const flush = () => {
		if (timer !== undefined) clearTimeout(timer);
		timer = undefined;
		if (!pending.length) return;
		const batch = pending;
		pending = [];
		send(batch);
	};
	return {
		push(items: T[]) {
			let urgent = false;
			for (const item of items) {
				pending.push(item);
				urgent ||= !ordinary.has(item.type);
				if (pending.length >= limit) flush();
			}
			// Flush earlier ordinary events as well to retain delivery order.
			if (urgent) flush();
			else if (pending.length && timer === undefined) timer = setTimeout(flush, delay);
		},
		flush,
	};
}
