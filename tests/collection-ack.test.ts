import {expect,test} from "bun:test";
import {collectionAckMatches} from "../electron/services/collection-ack";

test("collection change succeeds without obsolete attached-console state",()=>{
	expect(collectionAckMatches({requestId:"current",pid:42,collectOwnDbEvents:true,error:null},"current",42,true)).toBe(true);
});
test("stale, wrong-owner, failed and unapplied acknowledgements are rejected",()=>{
	const ack={requestId:"current",pid:42,collectOwnDbEvents:true,error:null};
	expect(collectionAckMatches({...ack,requestId:"old"},"current",42,true)).toBe(false);
	expect(collectionAckMatches({...ack,pid:43},"current",42,true)).toBe(false);
	expect(collectionAckMatches({...ack,error:"identity mismatch"},"current",42,true)).toBe(false);
	expect(collectionAckMatches({...ack,collectOwnDbEvents:false},"current",42,true)).toBe(false);
});
