export interface TraceRow {sequence:number;occurred_at:string;kind:string;payload:string;incident_id:string|null;}
export function classifyTrace(kind:string): ("kernel"|"decision"|"response")[] {
 const result:("kernel"|"decision"|"response")[]=[];
 if(kind==="kernel_event")result.push("kernel");
 if(/^(triage_|track_a_|track_b_|jev_|detection_recorded|live_candidate_|automatic_(response|jev|file|evidence)_|local_ui_live_response)/.test(kind))result.push("decision");
 if(/^(host_outbound_|firewall_|incident_firewall_|termination_|kernel_termination_|process_exit_confirmed|restore_|release_|review_required|automatic_response_|local_ui_live_response|snapshot_)/.test(kind))result.push("response");
 return result;
}
export function redactTrace(value:unknown,depth=0):unknown {
 if(depth>10)return "[깊이 제한]";
 if(typeof value==="string")return value.replace(/apikey_[A-Za-z0-9_-]+/g,"[REDACTED]").slice(0,12000);
 if(Array.isArray(value))return value.slice(0,100).map(v=>redactTrace(v,depth+1));
 if(value&&typeof value==="object")return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,/api.?key|authorization|password|secret|access.?token|refresh.?token/i.test(k)?"[REDACTED]":redactTrace(v,depth+1)]));
 return value;
}
export function formatTrace(row:TraceRow,initial:boolean){
 let data:unknown;try{data=JSON.parse(row.payload);}catch{data={error:"원본 JSON 해석 실패"};}
 const value=data as Record<string,unknown>;
 const mode=value?.evidence_mode??(value?.evidence as Record<string,unknown>|undefined)?.mode??"UNKNOWN";
 const body=JSON.stringify(redactTrace(data),null,2);
 return `[${initial?"기존 기록":"새 기록"}] [${mode==="test"?"TEST":mode==="production"?"PRODUCTION":"UNKNOWN"}] ${row.occurred_at}\n사건 ${row.incident_id??"미부여"} · 순번 ${row.sequence} · ${row.kind}\n${body.length>20000?body.slice(0,20000)+"\n[표시 길이 제한 — 원본 전체 아님]":body}`;
}

