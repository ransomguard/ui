import {useLocation,useSearchParams} from "react-router";
import {Tabs,TabsList,TabsTrigger,TabsContent} from "@/components/ui/tabs";
import {SettingsHelp} from "@/components/settings-help";
import {LossCounterSettings} from "@/components/loss-counter-settings";
import {JevKeySettings} from "@/components/jev-key-settings";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { RecoverySettings } from "@/components/recovery-settings";
import { SnapshotSettings } from "@/components/snapshot-settings";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
export default function SettingsPage() {
 const [params,setParams]=useSearchParams();
 const location=useLocation();
 const tab=["protection","snapshots","diagnostics"].includes(params.get("tab") || "") ? params.get("tab")! : "protection";
 useEffect(()=>{
  const target=location.hash==="#recovery-scope" ? "recovery-scope" : location.hash==="#jev-key" ? "jev-key" : null;
  if(tab!=="protection" || !target)return;
  let frame=0;let tries=0;
  const focus=()=>{
   const element=document.getElementById(target);
   if(element && !element.closest("[hidden],[inert]")){element.focus();return;}
   if(++tries<60)frame=window.setTimeout(focus,16);
  };
  frame=window.setTimeout(focus,0);
  return ()=>clearTimeout(frame);
 },[location.key,location.hash,tab]);
 const [value,setValue]=useState({visible:false,collectOwnDbEvents:false});
 const [busy,setBusy]=useState(true); const [message,setMessage]=useState("");
 useEffect(()=>{window.electronAPI.getConsoleSettings().then(setValue).catch(e=>setMessage(String(e))).finally(()=>setBusy(false));},[]);
 async function update(next: typeof value) { setBusy(true); try {setValue(await window.electronAPI.setConsoleSettings(next));setMessage("수집기에서 표시 설정 적용을 확인했습니다.");}catch(e){setMessage(String(e));}finally{setBusy(false);} }
 async function trace(kind: "kernel"|"decision"|"response") {try{await window.electronAPI.openBackendTrace(kind);setMessage("백엔드 원문 출력 콘솔을 열었습니다.");}catch(e){setMessage(String(e));}}
 return <Tabs value={tab} onValueChange={v=>{if(typeof v==="string")setParams({tab:v});}}>
 <TabsList aria-label="설정 분류"><TabsTrigger value="protection">보호 설정</TabsTrigger><TabsTrigger value="snapshots">스냅샷 관리</TabsTrigger><TabsTrigger value="diagnostics">진단 및 로그</TabsTrigger></TabsList>
 <TabsContent value="protection" hidden={tab!=="protection"} keepMounted className="space-y-6"><section id="recovery-scope" tabIndex={-1} aria-label="보호·복구 범위 설정"><RecoverySettings/></section><section id="jev-key" tabIndex={-1} aria-label="JEV API 키 설정"><JevKeySettings/></section></TabsContent>
 <TabsContent value="snapshots" hidden={tab!=="snapshots"} keepMounted><SnapshotSettings/></TabsContent>
 <TabsContent value="diagnostics" hidden={tab!=="diagnostics"} keepMounted className="space-y-6"><Card><CardHeader><CardTitle>백엔드 콘솔 설정</CardTitle></CardHeader><CardContent className="space-y-6">
 <p>백엔드 원문 출력을 Windows 콘솔로 바로 전달합니다. X로 닫아도 보호와 수집은 계속됩니다.</p>
 <div className="flex gap-2"><Button disabled={busy} onClick={()=>trace("kernel")}>커널 수집 콘솔 열기</Button><Button onClick={()=>trace("decision")}>탐지·판단 콘솔 열기</Button><Button onClick={()=>trace("response")}>대응·복구 콘솔 열기</Button></div>
 <SettingsHelp><p>DB 주기 조회 없이 새 출력을 전달합니다. 과거 기록은 재생하지 않으며, 새 출력이 없으면 창은 대기합니다.</p></SettingsHelp>
 <div className="flex items-center gap-3"><Button id="own-db" variant={value.collectOwnDbEvents ? "default" : "outline"} aria-pressed={value.collectOwnDbEvents} disabled={busy} onClick={()=>update({...value,collectOwnDbEvents:!value.collectOwnDbEvents})}>{value.collectOwnDbEvents ? "ON" : "OFF"}</Button><label htmlFor="own-db">Ransom0 내부 저장 이벤트 수집 (진단용)</label></div>
 <SettingsHelp title="내부 저장 이벤트 수집 안내"><p>OFF: 확인된 대시보드의 DB·저널 및 수집기 상태 파일 쓰기를 신규 저장·분석·UI 전달 전에 제외합니다. ON: 진단용으로 수집합니다. 다른 프로세스의 접근, 기존 기록, 탐지·차단·복구·오류·유실 기록은 유지합니다.</p>
 <p>커널 관찰 자체를 끄지는 않습니다. 무한 자기 기록 방지를 위해 원본 수집 DB의 기존 제외는 ON에서도 유지됩니다.</p></SettingsHelp>
 <p role="status">{message}</p>
 </CardContent></Card><LossCounterSettings/></TabsContent></Tabs>;
}

