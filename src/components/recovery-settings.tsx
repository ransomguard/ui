import {SettingsHelp} from "@/components/settings-help";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

type Status=Awaited<ReturnType<Window["electronAPI"]["getRecoverySettings"]>>;
export function RecoverySettings() {
 const [state,setState]=useState<Status|null>(null);
 const [folder,setFolder]=useState("");const [budget,setBudget]=useState(8);
 const [consent,setConsent]=useState(false);const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");
 async function load(){try{const s=await window.electronAPI.getRecoverySettings();setState(s);setFolder(s.protectedRoot);setBudget(s.snapshotBudgetGiB);}catch(e){setMessage(String(e));}}
 useEffect(()=>{let active=true;window.electronAPI.getRecoverySettings().then(s=>{if(active){setState(s);setFolder(s.protectedRoot);setBudget(s.snapshotBudgetGiB);}}).catch(e=>{if(active)setMessage(String(e));});return ()=>{active=false;};},[]);
 async function choose(){try{const selected=await window.electronAPI.chooseRecoveryFolder();if(selected){setFolder(selected);setConsent(false);}}catch(e){setMessage(String(e));}}
 async function apply(){setBusy(true);setMessage("첫 복구 시점과 파일 목록을 준비하고 있습니다. 기존 기록은 유지됩니다.");try{
  const next=await window.electronAPI.setRecoverySettings({folder,acknowledgeFolderRevert:consent,snapshotBudgetGiB:budget});setState(next);setConsent(false);window.dispatchEvent(new Event("recovery-scope-changed"));
  setMessage(next.automaticResponse ? "복구 범위와 자동 대응 적용을 확인했습니다." : "복구 범위를 저장했습니다. JEV 키 준비가 필요해 자동 대응은 아직 활성화되지 않았습니다.");
 }catch(e){setMessage(String(e));}finally{setBusy(false);}}
 return <Card><CardHeader><CardTitle>보호·복구 범위</CardTitle></CardHeader><CardContent className="space-y-4">
 <p>현재 폴더: {state?.protectedRoot || "미설정 — 폴더를 선택해야 자동 복구를 준비할 수 있습니다."}</p>
 {state?.protectedRoot && <p>{state.ready ? `복구 기준 준비됨 · ${state.files}개 파일` : `복구 준비 안 됨: ${state.detail || state.reason}`}</p>}
 <div className="flex gap-2"><Input aria-label="선택한 보호·복구 폴더" value={folder} readOnly/><Button disabled={busy} onClick={choose}>폴더 선택</Button></div>
 <div className="flex items-center gap-3"><label htmlFor="snapshot-budget">스냅샷 용량 목표 (GiB)</label><Input id="snapshot-budget" className="w-24" type="number" min={4} max={32} value={budget} disabled={busy} onChange={e=>setBudget(Number(e.target.value))}/></div>
 <p>복구·검토 중인 스냅샷은 용량 목표를 넘어도 보존합니다.</p><SettingsHelp title="복구 목록 제한 안내"><p>최대 5,000개 파일, 파일당 512 MiB, 합계 2 GiB의 복구 목록을 준비합니다.</p></SettingsHelp>
 <div className="flex items-start gap-2"><Checkbox id="folder-revert" checked={consent} disabled={busy} onCheckedChange={v=>setConsent(v===true)}/><label htmlFor="folder-revert">사건 발생 시 선택 폴더의 기준 파일을 스냅샷 시점으로 복구하는 데 동의합니다. 이후의 정상 수정도 되돌아갈 수 있습니다.</label></div>
 {state?.blockedReason && <p role="status">{state.blockedReason}</p>}
 <div className="flex gap-2"><Button disabled={busy||!state||!folder||!consent||Boolean(state.blockedReason)} onClick={apply}>{busy ? "복구 기준 준비 중…" : "복구 범위 적용"}</Button><Button variant="outline" disabled={busy} onClick={load}>상태 새로고침</Button></div>
 {state && !state.protectedRoot && <p className="font-medium text-red-600 dark:text-red-400" role="alert">복구 범위가 지정되지 않았습니다.</p>}
 <p role="status">{message}</p>
 </CardContent></Card>;
}
