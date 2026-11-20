import { test, expect } from "bun:test";
import { explainEvent, eventDisplayId } from "../electron/services/event-explanation";
const raw = (data: object, type = "ALERT") => JSON.stringify({type, timestamp: 1, data, evidence: {mode: "test", source: "response"}});
const values = (s: string) => explainEvent(s).rows.map(r => r.value).join("\n");


test("legacy scores never acquire invented thresholds, model, or a malware claim", () => {
	const s = raw({eventId: "incident-1", ruleName: "TRACK_B_JEV_DEMO_UNCALIBRATED", threatScore: 92, action: "BLOCKED", terminationConfirmed: true});
	expect(eventDisplayId(s)).toBe("incident-1");
	expect(values(s)).toContain("0.92 / 1");
	expect(values(s)).toContain("시험 기록");
	expect(values(s)).toContain("기록 없음");
	expect(values(s)).not.toContain("0.8");
	expect(values(s)).not.toContain("jev-1.");
});
test("recorded JEV thresholds, model and result are explained independently", () => {
	const s = raw({eventId:"x", ruleName:"TRACK_B_JEV_DEMO_UNCALIBRATED", action:"BLOCKED", decision:{schemaVersion:1, track:"B", jevScore:0.92, thresholds:{benign:0.2, malicious:0.8}, jevModel:"model-test", jevRequestId:"request-test", jevClassification:"malicious", kernelTerminationAccepted:true, exitConfirmed:false, firewallHoldRetained:true}});
	expect(values(s)).toContain("악성 ≥ 0.8");
	expect(values(s)).toContain("model-test");
	expect(values(s)).toContain("유지됨");
	expect(explainEvent(s).rows.find(r=>r.label==="강제 종료 확인")?.value).toBe("확인되지 않음");
});
test("rule markers, backups, failed restores and normal exits are not JEV or successful recovery", () => {
	expect(values(raw({ruleName:"TRACK_A_CORROBORATED_LAB",threatScore:100}))).toContain("JEV 판정이 아닙니다");
	expect(values(raw({action:"BACKUP_CREATED"},"VSS_STATUS"))).toContain("파일 복구 건수가 아닙니다");
	expect(values(raw({action:"RESTORE_FAILED",recoveryVerified:false,decision:{schemaVersion:1,reason:"restore_not_verified"}},"VSS_STATUS"))).toContain("복구 후 검증을 통과하지 못했습니다");
	expect(values(raw({},"PROCESS_TERMINATE"))).toContain("강제 종료 증거가 없으면");
});
test("malformed optional metadata is rendered as unknown, never trusted or executed", () => {
	expect(() => explainEvent(raw({decision:{jevModel:{key:"unexpected"},thresholds:[],jevScore:"0.92"}}))).not.toThrow();
	expect(eventDisplayId(raw({large:"x".repeat(4000)})).length).toBeLessThan(40);
	expect(explainEvent("not json", "en").title).toBe("Decision and response evidence");
});

test("decision evidence uses submitted counts and does not equate renames with extension changes", () => {
 const event = raw({decision:{track:"B",jevRequestState:{window_seconds:1,counts:{write_operations:3,rename_operations:0,delete_operations:0},observed_file_extensions:[".txt"]}}});
 const evidence = explainEvent(event).rows.find(r => r.label === "판단 근거")?.value;
 expect(evidence).toContain("파일 쓰기 3회");
 expect(evidence).toContain("파일 이름 변경 0회");
 expect(evidence).toContain("확장자 변경 횟수: 기록 없음");
 expect(evidence).not.toContain("응답 점수");
});
test("kernel 1001 is Track A family, not proof of full response or malware", () => {
 const s = raw({matchedRuleId:1001}, "PROCESS_BLOCKED");
 expect(values(s)).toContain("Track A");
 expect(values(s)).toContain("자식 프로세스 생성 차단 확인");
 expect(values(s)).toContain("완료 증거 없음");
 expect(values(s)).toContain("정상 관리자 작업");
 expect(values(s)).toContain("시험 기록");
 expect(values(JSON.stringify({type:"PROCESS_BLOCKED",data:{matchedRuleId:1001}}))).toContain("미분류 기록");
 expect(values(raw({matchedRuleId:9999},"PROCESS_BLOCKED"))).not.toContain("Track A");
});
