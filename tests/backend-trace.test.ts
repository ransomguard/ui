import { test, expect } from "bun:test";
import {classifyTrace,formatTrace,redactTrace} from "../electron/services/backend-trace";
test("separate real decision and response stages",()=>{
 expect(classifyTrace("automatic_jev_evidence")).toEqual(["decision"]);
 expect(classifyTrace("track_b_deferred")).toEqual(["decision"]);
 expect(classifyTrace("jev_responded")).toEqual(["decision"]);
 expect(classifyTrace("restore_verified")).toEqual(["response"]);
 expect(classifyTrace("kernel_event")).toEqual(["kernel"]);
});
test("unknown evidence stays unknown, history isn't live",()=>{
 const row={sequence:1,occurred_at:"2026-11-19",kind:"jev_responded",payload:"{\"score\":0.5}",incident_id:"incident-1"};
 expect(formatTrace(row,true)).toContain("[기존 기록] [UNKNOWN]");
 expect(formatTrace({...row,payload:"{\"evidence_mode\":\"test\"}"},false)).toContain("[새 기록] [TEST]");
 expect(formatTrace(row,false)).toContain("incident-1");
});
test("redact nested credentials",()=>{
 expect(JSON.stringify(redactTrace({authorization:"secret-value",nested:{api_key:"secret-value"},value:"apikey_abc123"}))).not.toContain("secret-value");
 expect(JSON.stringify(redactTrace({value:"apikey_abc123"}))).not.toContain("apikey_");
});

