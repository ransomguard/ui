import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {createContext, useContext, useState, type ReactNode} from "react";
import {createColumnHelper} from "@tanstack/react-table";
import {DataTable, type DataTableFeatures} from "@/components/data-table";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter} from "@/components/ui/dialog";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import type {useProgramAllowlist} from "@/hooks/use-program-allowlist";
type Props = {state: ReturnType<typeof useProgramAllowlist>};
export function ProgramAllowlistRegistration({state}: Props) {
 const {busy,error,load,change}=state;
 return <Card>
  <CardHeader><CardTitle>프로그램 화이트리스트 · 자동 대응 예외</CardTitle></CardHeader>
  <CardContent className="flex flex-col gap-4 min-w-0">
   <p>전체 경로와 SHA-256이 모두 일치하는 프로그램만 자동 격리·강제 종료·복구에서 제외합니다. 이벤트 수집·로그와 커널 자기보호·직접 차단은 유지합니다.</p>
   <p className="text-sm text-muted-foreground">자식 프로세스에는 적용되지 않습니다. 프로그램 업데이트로 파일이 바뀌면 다시 등록해야 합니다. 등록·삭제는 다음 대응 판단부터 적용되며 이미 진행 중인 대응이나 보류를 해제하지 않습니다.</p>
   <div className="flex gap-2"><Button disabled={busy} onClick={()=>void change()}>프로그램 등록</Button><Button variant="outline" disabled={busy} onClick={()=>void load()}>목록 새로고침</Button></div>
   {error && <p role="alert" className="text-destructive">{error}</p>}
  </CardContent>
 </Card>;
}
type Entry = Props["state"]["entries"][number];
const columnHelper=createColumnHelper<DataTableFeatures,Entry>();
const ProgramState=createContext<Props["state"] | null>(null);
function ProgramCell({entry}:{entry:Entry}) {
 const state=useContext(ProgramState);
 return state ? <ProgramEntry key={entry.id+":"+(entry.name ?? "")} entry={entry} state={state}/> : null;
}
const columns=columnHelper.columns([{accessorKey:"path",header:"프로그램",filterFn:(row,_id,value)=>`${row.original.name ?? ""} ${row.original.path}`.toLowerCase().includes(String(value).toLowerCase()),cell:({row})=><ProgramCell entry={row.original}/>}]);
export function ProgramAllowlistEntries({state,toolbar}: Props & {toolbar:ReactNode}) {
 const {entries,error}=state;
 return <ProgramState.Provider value={state}><div className="space-y-4 min-w-0">
   <DataTable heading="등록된 프로그램" columns={columns} data={entries} enableSearch filterColumnKey="path" filterPlaceholder="프로그램 이름, 경로 검색...">{toolbar}</DataTable>
   {error && <p role="alert" className="text-destructive">{error}</p>}
 </div></ProgramState.Provider>;
}
function ProgramEntry({entry,state}: Props & {entry: Props["state"]["entries"][number]}) {
 const [name,setName]=useState(entry.name ?? "");
 const [open,setOpen]=useState(false);
 const {busy,error,change,rename}=state;
 return <div className="flex items-center gap-3 min-w-0">
  <div className="flex-1 min-w-0 whitespace-normal">{entry.name && <p className="font-medium break-all">{entry.name}</p>}<p className="break-all">{entry.path}</p><p className="text-xs break-all text-muted-foreground">SHA-256: {entry.sha256}</p></div>
  <div className="flex gap-2 shrink-0">
   <Button variant="outline" disabled={busy} onClick={()=>{setName(entry.name ?? "");setOpen(true);}}>이름</Button>
   <Button variant="outline" disabled={busy} onClick={()=>void change(entry.id)}>삭제</Button>
  </div>
  <Dialog open={open} onOpenChange={value=>{if(!busy)setOpen(value);}}>
   <DialogContent className="sm:max-w-md">
    <DialogHeader><DialogTitle>프로그램 이름</DialogTitle><DialogDescription>목록에 표시할 이름을 입력하세요. 비우면 이름을 지웁니다.</DialogDescription></DialogHeader>
    <form className="space-y-4" onSubmit={async event=>{event.preventDefault();if(await rename(entry.id,name))setOpen(false);}}>
     <Input aria-label="프로그램 이름" autoFocus placeholder="프로그램 이름 입력" maxLength={80} value={name} disabled={busy} onChange={event=>setName(event.target.value)}/>
     {error && <p role="alert" className="text-destructive">{error}</p>}
     <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={()=>setOpen(false)}>취소</Button><Button type="submit" disabled={busy}>저장</Button></DialogFooter>
    </form>
   </DialogContent>
  </Dialog>
 </div>;
}
