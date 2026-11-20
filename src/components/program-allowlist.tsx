import {useCallback, useEffect, useState} from "react";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";

type Entry = Awaited<ReturnType<Window["electronAPI"]["getProgramAllowlist"]>>["entries"][number];

export function ProgramAllowlist() {
 const [entries,setEntries]=useState<Entry[]>([]);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const load=useCallback(async()=>{
  try{setEntries((await window.electronAPI.getProgramAllowlist()).entries);setError("");}
  catch(e){setError(e instanceof Error ? e.message : "프로그램 예외를 읽지 못했습니다.");}
 },[]);
 useEffect(()=>{const timer=setTimeout(()=>void load(),0);return ()=>clearTimeout(timer);},[load]);
 async function change(id?:string){
  setBusy(true);setError("");
  try{
   const result=id ? await window.electronAPI.removeProgramAllowlist(id) : await window.electronAPI.addProgramAllowlist();
   if(result)setEntries(result.entries);
  }catch(e){setError(e instanceof Error ? e.message : "프로그램 예외 변경 실패");}
  finally{setBusy(false);}
 }
 return <Card>
  <CardHeader><CardTitle>프로그램 화이트리스트 · 자동 대응 예외</CardTitle></CardHeader>
  <CardContent className="flex flex-col gap-4 min-w-0">
   <p>전체 경로와 SHA-256이 모두 일치하는 프로그램만 자동 격리·강제 종료·복구에서 제외합니다. 이벤트 수집·로그와 커널 자기보호·직접 차단은 유지합니다.</p>
   <p className="text-sm text-muted-foreground">자식 프로세스에는 적용되지 않습니다. 프로그램 업데이트로 파일이 바뀌면 다시 등록해야 합니다. 등록·삭제는 다음 대응 판단부터 적용되며 이미 진행 중인 대응이나 보류를 해제하지 않습니다.</p>
   <div className="flex gap-2"><Button disabled={busy} onClick={()=>void change()}>프로그램 등록</Button><Button variant="outline" disabled={busy} onClick={()=>void load()}>목록 새로고침</Button></div>
   {error && <p role="alert" className="text-destructive">{error}</p>}
   {entries.length===0 ? <p className="text-sm text-muted-foreground">등록된 프로그램 예외가 없습니다.</p> : entries.map(entry=><div key={entry.id} className="flex items-start gap-3 border rounded-md p-3 min-w-0">
    <div className="flex-1 min-w-0"><p className="break-all">{entry.path}</p><p className="text-xs break-all text-muted-foreground">SHA-256: {entry.sha256}</p></div>
    <Button variant="outline" disabled={busy} onClick={()=>void change(entry.id)}>삭제</Button>
   </div>)}
  </CardContent>
 </Card>;
}
