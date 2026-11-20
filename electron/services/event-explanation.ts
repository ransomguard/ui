import { evidenceMode } from "./outcome-metrics";

type RecordValue = Record<string, unknown>;
const record = (value: unknown): RecordValue => value !== null && typeof value === "object" && !Array.isArray(value) ? value as RecordValue : {};
const text = (value: unknown): string | undefined => typeof value === "string" && value.length > 0 ? value : undefined;
const number = (value: unknown): number | undefined => typeof value === "number" && Number.isFinite(value) ? value : undefined;
export function parseEvent(raw: string): RecordValue {
	try { return record(JSON.parse(raw)); } catch { return {}; }
}
export function eventDisplayId(raw: string): string {
	const m = parseEvent(raw), d = record(m.data);
	return text(d.eventId) ?? (number(m.sequenceNumber) !== undefined ? `${m.type} / #${m.sequenceNumber}` : `${text(m.type) ?? "EVENT"} / ${number(m.timestamp) ?? "-"}`);
}

export function kernelRuleLabel(id: number, language = "ko"): string {
 const ko = language.startsWith("ko");
 return id === 1001 ? (ko ? "Track A · #1001 VSS 스냅샷 삭제 시도" : "Track A · #1001 VSS shadow deletion attempt") : `Rule #${id}`;
}

/** Explain recorded facts only. Old records are never enriched with today's thresholds. */
export function explainEvent(raw: string, language = "ko") {
	const m = parseEvent(raw), d = record(m.data), decision = record(d.decision);
	const ko = language.startsWith("ko");
	const tr = (k: string, e: string) => ko ? k : e;
	const missing = tr("기록 없음 · 확인 불가", "Not recorded · unverified");
	const rows: { label: string; value: string }[] = [];
	const add = (k: string, e: string, value: unknown) => rows.push({ label: tr(k, e), value: text(value) ?? missing });
	const flag = (v: unknown) => v === true ? tr("확인됨", "Confirmed") : v === false ? tr("확인되지 않음", "Not confirmed") : missing;
	const mode = evidenceMode({ type: text(m.type) ?? "", timestamp: number(m.timestamp) ?? 0, data: d, evidence: record(m.evidence) as {mode: string} });
	add("기록 구분", "Evidence mode", mode === "test" ? tr("시험 기록 · 실제 위협 통계에서 제외", "Test record · excluded from live threat totals") : mode === "production" ? tr("운영 기록", "Production record") : tr("미분류 기록 · 실제 탐지로 단정할 수 없음", "Unclassified record · not proof of a live detection"));
	add("기록된 결과", "Recorded result", d.action ?? m.type);
	if (m.type === "ALERT") {
		const rule = text(d.ruleName) ?? "";
		const track = text(decision.track) ?? (rule.startsWith("TRACK_A_") ? "A" : rule.startsWith("TRACK_B_") ? "B" : undefined);
		add("판정 경로", "Decision path", track ? `Track ${track}` : undefined);
		if (track === "B") {
			const rawScore = number(decision.jevScore);
			const score = rawScore !== undefined ? rawScore : number(d.threatScore) !== undefined ? Number(d.threatScore) / 100 : undefined;
			const thresholds = record(decision.thresholds), benign = number(thresholds.benign), malicious = number(thresholds.malicious);
			const validThresholds = benign !== undefined && malicious !== undefined && benign >= 0 && benign < malicious && malicious <= 1;
			add("JEV 응답 점수", "JEV response score", score !== undefined && score >= 0 && score <= 1 ? `${score} / 1` : undefined);
			add("당시 적용 기준", "Thresholds at decision time", validThresholds ? tr(`정상 ≤ ${benign}, 악성 ≥ ${malicious}, 사이는 검토 보류`, `Benign ≤ ${benign}, malicious ≥ ${malicious}, between: review`) : undefined);
			const classification = text(decision.jevClassification);
			const classified = classification === "malicious" ? tr("악성", "Malicious") : classification === "benign" ? tr("정상", "Benign") : classification === "ambiguous" ? tr("불확실 · 검토 필요", "Ambiguous · review required") : undefined;
			add("JEV 점수 기반 판정", "Score-based classification", classified);
			const request = record(decision.jevRequestState), counts = record(request.counts);
            const evidence: string[] = [];
            const count = (key: string, korean: string, english: string) => {
                const value = number(counts[key]);
                if (value !== undefined && Number.isSafeInteger(value) && value >= 0)
                    evidence.push(tr(`${korean} ${value}회`, `${english}: ${value}`));
            };
            count("write_attempts", "파일 쓰기 시도", "File write attempts");
            count("write_operations", "파일 쓰기", "File writes");
            count("rename_attempts", "파일 이름 변경 시도", "File rename attempts");
            count("rename_operations", "파일 이름 변경", "File renames");
            count("extension_change_succeeded", "확장자 변경 성공(파일 시스템 응답)", "Extension change succeeded (filesystem response)");
            count("extension_change_failed", "확장자 변경 실패", "Extension change failed");
            count("extension_change_unknown", "확장자 변경 결과 미확인", "Extension change result unknown");
            count("extension_change_attempts", "확장자 변경 시도", "Extension-change attempts");
            count("extension_comparison_unknown", "확장자 비교 불가", "Extension comparison unavailable");
            count("extension_changes", "확장자 변경", "Extension changes");
            count("delete_operations", "파일 삭제", "File deletions");
            count("high_entropy_writes", "고엔트로피 쓰기", "High-entropy writes");
            if (number(counts.extension_changes) === undefined && number(counts.extension_change_attempts) === undefined)
                evidence.push(tr("확장자 변경 횟수: 기록 없음", "Extension-change count: not recorded"));
            const seconds = number(request.window_seconds);
            if (seconds !== undefined && seconds >= 0)
                evidence.unshift(tr(`관측 시간 ${seconds}초`, `Observation window: ${seconds}s`));
            const extensions = request.observed_file_extensions ?? record(request.evidence).observed_file_extensions;
            if (Array.isArray(extensions) && extensions.every(x => typeof x === "string"))
                evidence.push(tr(`관측 확장자: ${extensions.join(", ") || "없음"}`, `Observed extensions: ${extensions.join(", ") || "none"}`));
            add("판단 근거", "Decision evidence", Object.keys(request).length ? evidence.join(" · ") : missing);

			if (rule.includes("DEMO") || decision.thresholdPolicy === "uncalibrated_demo_only") add("기준 검증 상태", "Threshold validation", tr("미보정 시험 기준 · 운영 성능 검증 완료를 뜻하지 않음", "Uncalibrated demo thresholds · not validated production performance"));
			add("JEV 모델", "JEV model", decision.jevModel);
			add("JEV 요청 ID", "JEV request ID", decision.jevRequestId);
			add("모델의 상세 근거", "Model rationale", tr("현재 응답에는 특징별 기여도나 설명문이 기록되지 않습니다. 점수만으로 이유를 만들어 표시하지 않습니다.", "No feature contributions or model explanation are recorded. A rationale cannot be inferred from the score alone."));
		} else if (track === "A") {
			add("판단 근거", "Decision evidence", rule.includes("CORROBORATED") ? tr("동일 프로세스 세대의 쓰기 및 자식 생성 차단을 연결한 규칙 판정입니다. JEV 판정이 아닙니다.", "Rule decision correlating writes and child-creation blocking for the same process generation. This is not a JEV verdict.") : tr("명시적으로 승인된 Track A 대응입니다. JEV 판정이 아닙니다.", "Explicitly authorized Track A response. This is not a JEV verdict."));
			add("표시 점수의 의미", "Displayed score meaning", tr("규칙 대응 표시값 · JEV 점수나 악성 확률이 아님", "Rule-response indicator · not a JEV score or malware probability"));
		} else add("판단 근거", "Decision evidence", tr("알 수 없는 판정 경로입니다. 원본 규칙과 근거 기록을 확인해야 합니다.", "Unknown decision path. Inspect the original rule and evidence."));
		const termination = decision.schemaVersion === 1 ? decision.kernelTerminationAccepted === true && decision.exitConfirmed === true : d.terminationConfirmed;
		add("강제 종료 확인", "Forced termination confirmation", flag(termination));
		add("프로세스 생성 시각 식별값", "Process creation identity", d.processGeneration);
	} else if (m.type === "PROCESS_BLOCKED") {
        if (d.matchedRuleId === 1001) {
            add("탐지 분류", "Detection family", tr("Track A · 커널 예방 차단 규칙", "Track A · kernel prevention rule"));
            add("적용 규칙", "Applied rule", kernelRuleLabel(1001, language));
            add("규칙 설명", "Rule explanation", tr("vssadmin.exe 실행 이미지와 delete shadows 인수가 일치했습니다. 정상 관리자 작업도 해당할 수 있어 랜섬웨어 확정 판정은 아닙니다.", "The vssadmin.exe image and delete shadows arguments matched. Legitimate administration can match; this alone is not a confirmed ransomware verdict."));
            add("실제 대응 단계", "Recorded response stage", tr("자식 프로세스 생성 차단 확인", "Child process creation blocked"));
            add("부모 종료·격리·복구", "Parent termination, isolation and recovery", tr("이 이벤트에는 완료 증거 없음 · 연결된 대응 사건에서 별도 확인", "No completion evidence in this event; inspect the correlated response incident"));
            add("추가 대응 조건", "Additional response requirements", tr("동일 프로세스 세대·최근 고엔트로피 쓰기·부모/생성자 일치·이벤트 유실 여부 및 대응 예외를 검증합니다.", "Verify process generation, recent high-entropy writes, parent/creator identity, event-loss state and response exemptions."));
        }
		add("차단 이유", "Block reason", number(d.matchedRuleId) && Number(d.matchedRuleId) > 0 ? tr(`커널 생성 차단 이벤트에 규칙 ${d.matchedRuleId}가 기록되었습니다. 강제 종료와는 별개입니다.`, `Kernel creation-block event recorded rule ${d.matchedRuleId}. This is separate from forced termination.`) : missing);
		add("JEV 판정", "JEV verdict", tr("이 커널 이벤트에는 없음", "Not present in this kernel event"));
	} else if (m.type === "VSS_STATUS") {
		add("복구 결과 검증", "Recovery verification", d.action === "BACKUP_CREATED" ? tr("백업 생성 기록이며 파일 복구 건수가 아닙니다.", "Snapshot creation, not a file-recovery count.") : flag(d.recoveryVerified));
		if (d.action === "RESTORE_COMPLETED" && d.recoveryVerified === true) {
			const files = Array.isArray(d.recoveredFiles) ? d.recoveredFiles.filter((p): p is string => typeof p === "string" && p.length > 0) : undefined;
			add("검증된 복구 파일", "Verified recovered files", files ? String(new Set(files.map(p => p.toLowerCase())).size) : undefined);
		}
		add("복구 범위", "Recovery scope", tr("승인된 복구 목록만 검증 · 시스템 전체 정상 여부를 뜻하지 않음", "Only the approved recovery manifest · not proof of whole-system health"));
		add("스냅샷 ID", "Snapshot ID", d.snapshotId);
		add("복구 엔진 메시지", "Recovery engine message", d.message);
	} else if (m.type === "VSS_ATTEMPT") {
		add("의미", "Meaning", tr("VSS 관련 시도 관측입니다. 이 이벤트만으로 강제 종료나 복구 성공을 주장하지 않습니다.", "Observed VSS-related attempt. This event alone does not establish termination or recovery."));
	} else if (m.type === "PROCESS_TERMINATE") {
		add("의미", "Meaning", tr("프로세스 종료 통지입니다. 강제 종료 증거가 없으면 위협 대응 횟수에 포함하지 않습니다.", "Process exit notification. Without confirmed forced termination it is not a response count."));
	}
	if (decision.schemaVersion === 1) {
		add("대응 상태", "Response state", decision.state);
		const reasons: Record<string, [string, string]> = {
			exit_and_restore_verified: ["대상 프로세스 종료와 승인된 파일의 복구 검증이 완료되었습니다.", "Target exit and approved file recovery were verified."],
			exit_confirmed_recovery_not_required: ["대상 종료를 확인했고 이 대응에는 복구가 요구되지 않았습니다.", "Target exit confirmed; recovery was not required for this response."],
			restore_operation_failed: ["복구 작업이 실패했습니다. 성공으로 집계하지 않고 검토 보류를 유지합니다.", "Restore operation failed. Not counted as success; review hold retained."],
			restore_not_verified: ["복구 후 검증을 통과하지 못했습니다. 파일 복구 성공으로 확정하지 않습니다.", "Post-restore verification failed. File recovery is not confirmed."],
			jev_benign_demo_threshold: ["JEV 점수가 정상 기준 이하여서 이 사건의 차단 보류 해제를 요청했습니다.", "JEV score was at or below the benign threshold; release of this incident's hold was requested."],
			jev_ambiguous_demo_threshold: ["JEV 점수가 정상·악성 기준 사이여서 자동 종료 대신 검토를 기다립니다.", "JEV score fell between thresholds; awaiting review without automatic termination."],
			firewall_release_not_confirmed: ["방화벽 보류 해제를 확인하지 못해 검토 상태로 남았습니다.", "Firewall hold release was not confirmed; review is still required."],
			host_outbound_containment_unconfirmed: ["방화벽 정책 적용 응답을 확인하지 못했습니다.", "Firewall policy acknowledgement was not confirmed."],
		};
		const reason = text(decision.reason);
		add("대응 결과 설명", "Response explanation", reason && reasons[reason] ? tr(...reasons[reason]) : missing);
		add("결과 사유 코드", "Result reason code", decision.reason);
		add("해당 사건의 방화벽 보류", "This incident's firewall hold", decision.firewallHoldRetained === true ? tr("유지됨 · 검토 필요", "Retained · review required") : decision.firewallHoldRetained === false ? tr("이 사건의 hold 없음 · 다른 정책 및 격리는 별도", "No hold for this incident · other policies/isolation are separate") : undefined);
		add("방화벽 정책 응답", "Firewall policy acknowledgement", flag(decision.firewallPolicyAcknowledged));
		add("패킷 차단 검증", "Packet enforcement verification", flag(decision.packetEnforcementVerified));
	}
	return { title: tr("판단·대응 근거", "Decision and response evidence"), rows };
}
