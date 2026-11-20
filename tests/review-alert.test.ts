import {test, expect} from "bun:test";
import {isValidIPCMessage} from "../electron/services/ipc-receiver/guard";
import {takeOutcomes} from "../electron/services/outcome-metrics";
import {explainEvent} from "../electron/services/event-explanation";

test("ambiguous JEV review is accepted without claiming termination or restoration", () => {
 const message = {type:"ALERT", timestamp:1700000000000, evidence:{mode:"test", source:"response"}, data:{
  processId:5712, processName:"PID_5712", processGeneration:"134396762608093206", eventId:"review-incident",
  action:"REVIEW_REQUIRED", threatScore:50, ruleName:"TRACK_B_JEV_DEMO_UNCALIBRATED", terminationConfirmed:false,
  decision:{schemaVersion:1, track:"B", state:"REVIEW_REQUIRED", reason:"jev_ambiguous_demo_threshold", jevScore:0.5, jevClassification:"ambiguous", firewallHoldRetained:true}
 }};
 expect(isValidIPCMessage(message)).toBe(true);
 expect(takeOutcomes(message,new Set())).toEqual({blocked:0,terminated:0,recovered:0});
 expect(JSON.stringify(explainEvent(JSON.stringify(message)))).toContain("불확실 · 검토 필요");
 const failed = {...message,data:{...message.data,threatScore:null,decision:{...message.data.decision,jevScore:null,jevClassification:null,reason:"jev_query_or_validation_failed"}}};
 expect(isValidIPCMessage(failed)).toBe(true);
 expect(takeOutcomes(failed,new Set())).toEqual({blocked:0,terminated:0,recovered:0});
 expect(JSON.stringify(explainEvent(JSON.stringify(failed)))).not.toContain("0 / 1");
 expect(isValidIPCMessage({...failed,data:{...failed.data,action:"BLOCKED"}})).toBe(false);
});
