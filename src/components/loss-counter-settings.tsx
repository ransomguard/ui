import {SettingsHelp} from "@/components/settings-help";
import {useState} from "react";
import {Card,CardHeader,CardTitle,CardContent} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
export function LossCounterSettings(){
 const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");
 async function reset(){setBusy(true);setMessage("수집기에 초기화 기준을 적용하고 있습니다…");try{
  const result=await window.electronAPI.resetLossCounter();
  setMessage(`초기화 적용 완료 · 이후 유실 ${result.sinceReset.toLocaleString()}건. 이전 누적 ${result.baseline.toLocaleString()}건은 기록에 보존했습니다.`);
 }catch(e){setMessage(String(e));}finally{setBusy(false);}}
 return <Card><CardHeader><CardTitle>유실 이벤트 카운터</CardTitle></CardHeader><CardContent className="space-y-4">
 <p>표시 기준만 초기화합니다. 과거 기록은 삭제하지 않으며 새 유실은 다시 표시됩니다.</p><SettingsHelp title="카운터 초기화 안내"><p>현재 유실 카드와 유실로 인한 경고를 초기화 시점부터 다시 집계합니다. 다른 원인의 경고는 유지됩니다.</p></SettingsHelp>
 <Button disabled={busy} onClick={reset}>{busy ? "초기화 중…" : "유실 이벤트 카운터 초기화"}</Button>
 <p role="status">{message}</p>
 </CardContent></Card>;
}
