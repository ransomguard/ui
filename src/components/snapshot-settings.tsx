import {SettingsHelp} from "@/components/settings-help";
import { useEffect,useState } from "react";
import { Button } from "@/components/ui/button";
import { Card,CardHeader,CardTitle,CardContent } from "@/components/ui/card";
import { SnapshotInventory } from "@/components/snapshot-inventory";
export function SnapshotSettings(){
 const [minutes,setMinutes]=useState(60);const [saved,setSaved]=useState<number|null>(null);
 const [next,setNext]=useState("");const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");
 useEffect(()=>{let active=true;window.electronAPI.getSnapshotSettings().then(v=>{if(active){setMinutes(v.intervalMinutes);setSaved(v.intervalMinutes);setNext(v.task.nextRun||"");}}).catch(e=>{if(active)setMessage(String(e));});return ()=>{active=false;};},[]);
 async function apply(){setBusy(true);try{const v=await window.electronAPI.setSnapshotInterval(minutes);setSaved(v.intervalMinutes);setNext(v.task.nextRun||"");setMessage("예약 작업과 백엔드 생성 주기를 적용했습니다.");}catch(e){setMessage(String(e));}finally{setBusy(false);}}
 async function open(){try{await window.electronAPI.openSnapshotConsole();setMessage("스냅샷 확인 콘솔을 열었습니다. Enter로 새로 조회하고 X로 닫을 수 있습니다.");}catch(e){setMessage(String(e));}}
 return <Card><CardHeader><CardTitle>복구 스냅샷</CardTitle></CardHeader><CardContent className="space-y-4">
 <p>생성 주기: {saved===null ? "확인 중" : saved<60 ? `${saved}분` : `${saved/60}시간`}</p>
 <div className="flex gap-2" role="group" aria-label="스냅샷 생성 주기">{[15,30,60,120].map(n=><Button key={n} disabled={busy||saved===null} variant={minutes===n ? "default":"outline"} aria-pressed={minutes===n} onClick={()=>setMinutes(n)}>{n<60 ? `${n}분` : `${n/60}시간`}</Button>)}</div>
 <div className="flex gap-2"><Button disabled={busy||saved===null} onClick={apply}>{busy ? "적용 중…" : "주기 적용"}</Button><Button onClick={open}>스냅샷 확인 콘솔 열기</Button></div>
 {next && <p>다음 예약: {new Date(next).toLocaleString()}</p>}
 <p>생성 실패·용량 부족 시 예약되어 있어도 스냅샷이 생성되지 않을 수 있습니다.</p><SettingsHelp title="스냅샷 생성 안내"><p>보호·복구 폴더 설정 후 생성됩니다. 주기를 변경해도 기존 스냅샷과 복구·검토 중인 스냅샷은 삭제하지 않습니다.</p></SettingsHelp>
 <p role="status">{message}</p>
 <SnapshotInventory/>
 </CardContent></Card>;
}
