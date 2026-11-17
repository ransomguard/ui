import {test,expect} from "bun:test";
import {takeOutcomes,evidenceMode,isRealThreat} from "../electron/services/outcome-metrics";
import {useMetricStore} from "../src/store/use-metrics-store";
import type {IncomingIPCMessage} from "../electron/services/ipc-receiver";
const msg=(type:string,data:object,mode="production",source="response")=>({type,timestamp:Date.now(),evidence:{mode,source},data});
const kill=msg("ALERT",{processId:4,processGeneration:"133700000000000001",eventId:"a",action:"BLOCKED",terminationConfirmed:true});
test("normal exits, guesses, failed/start/backup and unclassified history never count",()=>{
 for(const m of [msg("PROCESS_TERMINATE",kill.data),msg("ALERT",{...kill.data,terminationConfirmed:false}),msg("ALERT",kill.data,"unclassified"),msg("ALERT",kill.data,"test"),...["RESTORE_FAILED","RESTORE_STARTED","BACKUP_CREATED"].map(action=>msg("VSS_STATUS",{action,recoveryVerified:true,eventId:"a",recoveredFiles:["C:\\lab\\a"]}))]) expect(takeOutcomes(m,new Set())).toEqual({blocked:0,terminated:0,recovered:0});
});
test("generation bound outcomes and file recovery are deduplicated separately",()=>{
 const seen=new Set<string>();
 expect(takeOutcomes(kill,seen).terminated).toBe(1);
 expect(takeOutcomes({...kill,timestamp:Date.now()+1000},seen).terminated).toBe(0);
 expect(takeOutcomes(msg("ALERT",{...kill.data,processGeneration:"133700000000000002"}),seen).terminated).toBe(1);
 const restore=msg("VSS_STATUS",{action:"RESTORE_COMPLETED",eventId:"a",recoveryVerified:true,recoveredFiles:["C:\\lab\\a","c:\\LAB\\A","C:\\lab\\b"]});
 expect(takeOutcomes(restore,seen).recovered).toBe(2);
 expect(takeOutcomes(restore,seen).recovered).toBe(0);
 expect(takeOutcomes(msg("PROCESS_BLOCKED",{processId:5,processGeneration:"133700000000000003",matchedRuleId:1001},"production","kernel"),seen).blocked).toBe(1);
});
test("legacy lab signature cannot be promoted to a real threat",()=>{
 const m=msg("ALERT",{...kill.data,ruleName:"TRACK_A_CORROBORATED_LAB"});
 expect(evidenceMode(m)).toBe("test");expect(isRealThreat(m)).toBe(false);expect(takeOutcomes(m,new Set()).terminated).toBe(0);
});
test("live store equals persisted seed and normal exits never increase forced count",()=>{
 useMetricStore.getState().initMetrics([],[],{threat:0,recovery:0,telemetry:0,blockedProcesses:0,accessControlLogs:0,outcomeKeys:[]});
 useMetricStore.getState().addMetrics([kill as IncomingIPCMessage]);
 const state=useMetricStore.getState();
 expect(state.dailyStats[0]?.processTerminated).toBe(1);
 useMetricStore.getState().initMetrics([],state.dailyStats,{...state.totalCounts});
 useMetricStore.getState().addMetrics([kill as IncomingIPCMessage,...Array.from({length:100},()=>msg("PROCESS_TERMINATE",{processId:1}) as IncomingIPCMessage)]);
 expect(useMetricStore.getState().dailyStats[0]?.processTerminated).toBe(1);
});
