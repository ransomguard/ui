// Durable history stays in SQLite. Only the unsolicited live renderer cache is
// bounded; explicit history pages can still expand the user's current window.
export const LIVE_CACHE_LIMIT = 1000;
export const LIVE_VIEW_LIMIT = 200;
export const METRIC_CACHE_LIMIT = 128;

export function trimLiveCache<T extends { timestamp: number }>(items: T[], limit: number): T[] {
	return trimTimestampWindow(items, limit, item => item.timestamp);
}

export function trimTimestampWindow<T>(items: T[], limit: number, timestamp: (item: T) => number): T[] {
	if (items.length <= limit) return items;
	let end = limit;
	// Queries page by timestamp. Evict the whole boundary bucket so an older
	// query cannot skip records removed from the middle of that timestamp.
	while (end > 0 && timestamp(items[end - 1]!) === timestamp(items[end]!)) end--;
	// One exceptionally large timestamp bucket must remain intact until newer
	// timestamps arrive. Never discard a partial bucket silently.
	return end > 0 ? items.slice(0, end) : items;
}
