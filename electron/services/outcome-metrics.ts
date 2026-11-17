/** Shared by persisted and live metrics. No inference from normal exits or global counters. */
type Message = { type: string; timestamp: number; sequenceNumber?: number | null; data: object; evidence?: {mode: string; source?: string; runId?: string} };
export function evidenceMode(m: Message): "production" | "test" | "unclassified" {
 const d = m.data as Record<string, unknown>;
 // Legacy lab signatures remain test even if an erroneous producer says production.
 if (/LAB|DEMO|OFFLINE_TEST/.test(String(d.ruleName ?? "")) || /Codex_AB_20261116/i.test(String(d.imagePath ?? ""))) return "test";
 return m.evidence?.mode === "test" ? "test" : m.evidence?.mode === "production" ? "production" : "unclassified";
}
export function evidenceLabel(m: Message): string {
 return evidenceMode(m) === "test" ? "[시험 / TEST] " : evidenceMode(m) === "unclassified" ? "[미분류 / UNCLASSIFIED] " : "[실제 / LIVE] ";
}
export function outcomeKeys(m: Message) {
 const d = m.data as Record<string, unknown>;
 const keys: {blocked: string[]; terminated: string[]; recovered: string[]} = {blocked: [], terminated: [], recovered: []};
 if (evidenceMode(m) !== "production") return keys;
 const generation = typeof d.processGeneration === "string" && /^\d+$/.test(d.processGeneration) && d.processGeneration !== "0" ? d.processGeneration : null;
 if (m.type === "PROCESS_BLOCKED" && m.evidence?.source === "kernel" && generation && Number.isSafeInteger(d.processId) && Number(d.matchedRuleId) > 0) keys.blocked.push(`block:${d.processId}:${generation}`);
 if (m.type === "ALERT" && m.evidence?.source === "response" && d.action === "BLOCKED" && d.terminationConfirmed === true && generation && Number.isSafeInteger(d.processId) && typeof d.eventId === "string" && d.eventId) keys.terminated.push(`kill:${d.processId}:${generation}`);
 if (m.type === "VSS_STATUS" && m.evidence?.source === "response" && d.action === "RESTORE_COMPLETED" && d.recoveryVerified === true && typeof d.eventId === "string" && d.eventId && Array.isArray(d.recoveredFiles)) {
  keys.recovered = [...new Set(d.recoveredFiles.filter((p): p is string => typeof p === "string" && /^(?:[A-Za-z]:\\|\\\\)/.test(p)).map(p => `restore:${d.eventId}:${p.toLowerCase()}`))];
 }
 return keys;
}
export function takeOutcomes(m: Message, seen: Set<string>) {
 const keys=outcomeKeys(m);
 const take=(items:string[]) => items.filter(key => {if(seen.has(key)) return false; seen.add(key); return true;}).length;
 return {blocked:take(keys.blocked), terminated:take(keys.terminated), recovered:take(keys.recovered)};
}
export function isRealThreat(m: Message) {
 return evidenceMode(m)==="production" && (m.type==="PROCESS_BLOCKED" || m.type==="VSS_ATTEMPT" || (m.type==="ALERT" && (m.data as Record<string,unknown>).action !== "ALLOWED"));
}
