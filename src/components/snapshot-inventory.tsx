import {SettingsHelp} from "@/components/settings-help";
import { useEffect,useState } from "react";
import { Button } from "@/components/ui/button";
import { Table,TableHeader,TableRow,TableHead,TableBody,TableCell } from "@/components/ui/table";
type Inventory=Awaited<ReturnType<Window["electronAPI"]["getSnapshotInventory"]>>;
function RestoreScopeHelp(){
 return <div className="space-y-2">
 <p className="font-medium">수동 복구 범위 안내</p>
 <p>설정에서 지정한 보호·복구 폴더와 그 하위 폴더의 파일만 복구합니다. VM이나 Windows 전체를 과거 상태로 되돌리지 않으며, 다른 폴더·설치 프로그램·Windows 설정은 변경하지 않습니다.</p>
 <p>선택한 스냅샷에 있는 파일을 당시 내용으로 덮어쓰므로 이후 수정 내용은 사라집니다. 삭제된 파일도 스냅샷에 있으면 복구하며, 스냅샷 이후 새로 만든 파일은 삭제하지 않습니다.</p>
 <p>복구 버튼을 누른 뒤 대상 폴더와 파일 목록을 확인하고, 덮어쓰기에 동의해야 실행됩니다.</p>
 </div>;
}
export function SnapshotInventory(){
 const [preview,setPreview]=useState<Awaited<ReturnType<Window["electronAPI"]["previewSnapshotRestore"]>>|null>(null);const [consent,setConsent]=useState(false);
 const [data,setData]=useState<Inventory|null>(null);const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");
 const [page,setPage]=useState(1);
 const sortedSnapshots=[...(data?.snapshots ?? [])].sort((a,b)=>Number(b.userProtected)-Number(a.userProtected) || Date.parse(b.created_at)-Date.parse(a.created_at) || a.snapshot_id.localeCompare(b.snapshot_id));
 const pageCount=Math.max(1,Math.ceil(sortedSnapshots.length/5));
 const currentPage=Math.min(page,pageCount);
 const visibleSnapshots=sortedSnapshots.slice((currentPage-1)*5,currentPage*5);
 useEffect(()=>{let active=true;window.electronAPI.getSnapshotInventory().then(v=>{if(active)setData(v);}).catch(e=>{if(active)setMessage(String(e));});return ()=>{active=false;};},[]);
 async function reload(){setBusy(true);try{setData(await window.electronAPI.getSnapshotInventory());}catch(e){setMessage(String(e));}finally{setBusy(false);}}
 async function create(){setBusy(true);setMessage("수동 스냅샷 생성 중입니다. 완료 확인까지 기다려 주세요.");try{
  const result=await window.electronAPI.createManualSnapshot(crypto.randomUUID());
  setMessage(result.created ? `수동 스냅샷 생성 완료${result.schedule_warning ? " · 다음 예약 확인 필요: "+result.schedule_warning : ""}` : result.requires_reconciliation ? "생성 결과 확인이 필요합니다. 중복 생성하지 않고 기록을 보존했습니다." : `스냅샷을 생성하지 못했습니다: ${result.reason}`);
  setData(await window.electronAPI.getSnapshotInventory());
 }catch(e){setMessage(String(e));}finally{setBusy(false);}}
 async function protect(id:string,enabled:boolean){setBusy(true);try{setData(await window.electronAPI.setSnapshotProtection(id,enabled));setMessage(enabled ? "사용자 보호를 켰습니다. 자동 정리에서 제외됩니다." : "사용자 보호를 해제했습니다. 복구·검토 및 최소 보관 규칙은 계속 적용됩니다.");}catch(e){setMessage(String(e));}finally{setBusy(false);}}
 async function prepareRestore(id:string){setBusy(true);setPreview(null);setConsent(false);setMessage("스냅샷 파일 확인 중…");try{setPreview(await window.electronAPI.previewSnapshotRestore(id));setMessage("");}catch(e){setMessage(String(e));}finally{setBusy(false);}}
 async function restore(){if(!preview||!consent)return;setBusy(true);setMessage("수동 복구 중입니다. 완료될 때까지 기다려 주세요.");try{const v=await window.electronAPI.executeSnapshotRestore(preview.token,true);setMessage(v.verified ? `수동 복구 완료: ${v.filesVerified}개 파일 해시 확인. 자동 탐지·복구 기록과 별도입니다.` : `복구 확인 필요: 성공 ${v.filesVerified}개, 실패 ${v.filesFailed}개. 기록을 보존했습니다.`);setPreview(null);setConsent(false);}catch(e){setMessage(String(e));}finally{setBusy(false);}}
 return <section className="space-y-4" aria-label="Ransom0 스냅샷 목록">
 <div className="flex gap-2"><Button disabled={busy} onClick={create}>수동 스냅샷 생성</Button><Button variant="outline" disabled={busy} onClick={reload}>목록 새로고침</Button></div>
 <p>현재 남아 있는 Ransom0 스냅샷: {data ? `${data.snapshots.length}개` : "조회 중"}</p>
 {!preview && <><p>수동 복구는 지정한 폴더의 파일을 덮어씁니다. 이후 수정 내용은 사라집니다.</p><SettingsHelp title="수동 복구 범위 자세히 보기"><RestoreScopeHelp/></SettingsHelp></>}
 <Table><TableHeader><TableRow><TableHead>생성 시각 / ID</TableHead><TableHead>생성 종류</TableHead><TableHead>보호 상태</TableHead><TableHead>사용자 보호</TableHead><TableHead>수동 복구</TableHead></TableRow></TableHeader><TableBody>
 {visibleSnapshots.map(s=><TableRow key={s.snapshot_id}><TableCell><p>{new Date(s.created_at).toLocaleString()}</p><code title={`${s.snapshot_id}\n${s.volume_id}`}>{s.snapshot_id.slice(1,9)}…</code></TableCell><TableCell>{s.manual ? "수동" : "자동/초기"}</TableCell><TableCell>{[s.userProtected&&"사용자 보호",s.systemProtected&&"복구·검토·기준 보호",s.minimumKeep&&"최소 보관"].filter(Boolean).join(" · ") || "일반 보관"}</TableCell><TableCell><Button size="sm" variant={s.userProtected ? "default":"outline"} disabled={busy} aria-pressed={s.userProtected} onClick={()=>protect(s.snapshot_id,!s.userProtected)}>{s.userProtected ? "보호 해제":"보호"}</Button></TableCell><TableCell><Button size="sm" disabled={busy} onClick={()=>prepareRestore(s.snapshot_id)}>복구</Button></TableCell></TableRow>)}
 </TableBody></Table>
 <nav className="flex items-center gap-3" aria-label="스냅샷 페이지">
 <Button variant="outline" size="sm" disabled={busy||currentPage<=1} onClick={()=>setPage(currentPage-1)}>이전</Button>
 <span aria-live="polite">{currentPage} / {pageCount} 페이지 · 페이지당 5개</span>
 <Button variant="outline" size="sm" disabled={busy||currentPage>=pageCount} onClick={()=>setPage(currentPage+1)}>다음</Button>
 </nav>
 <p>사용자가 보호한 스냅샷을 먼저 표시하며, 각 그룹 안에서는 최신순으로 표시합니다.</p>
 {data?.snapshots.length===0 && <p>현재 확인된 Ransom0 스냅샷이 없습니다.</p>}
 {data?.errors.map(e=><p key={e.volume} role="alert">일부 볼륨 조회 실패: {e.error}</p>)}
 <p>보호한 스냅샷은 자동 정리에서 제외됩니다. 공간이 부족하면 새 생성이 제한될 수 있습니다.</p><SettingsHelp title="스냅샷 보관·수동 생성 안내"><p>이 보호는 Ransom0의 자동 정리에 적용되며 Windows나 다른 프로그램의 삭제까지 막지는 않습니다.</p>
 <p>수동 생성은 기존 사건의 복구 기준을 덮어쓰지 않습니다. 생성 시점에 이미 손상된 파일까지 정상으로 되돌리는 기능은 아닙니다.</p></SettingsHelp>
 {preview && <section className="space-y-3 rounded-lg border p-4" aria-label="수동 복구 확인">
 <RestoreScopeHelp/>
 <p>복구 시점: {new Date(preview.createdAt).toLocaleString()}</p><p className="break-all">대상 폴더: {preview.folder}</p>
 <p>{preview.files.length}개 파일 · {preview.bytes.toLocaleString()}바이트</p>
 <div className="max-h-40 overflow-auto"><ul>{preview.files.map(f=><li className="break-all" key={f}>{f}</li>)}</ul></div>
 <p>위 파일을 선택한 시점의 내용으로 덮어씁니다. 이후 수정 내용은 사라집니다. 목록에 없는 새 파일은 삭제하지 않습니다. 악성 프로세스를 제거하거나 방화벽을 해제하는 기능은 아닙니다.</p>
 <label className="flex items-start gap-2"><input type="checkbox" checked={consent} disabled={busy} onChange={e=>setConsent(e.target.checked)}/>해당 파일을 사용하는 프로그램을 닫았으며, 위 파일을 덮어쓰는 데 동의합니다.</label>
 <div className="flex gap-2"><Button disabled={busy||!consent} onClick={restore}>확인 후 수동 복구</Button><Button variant="outline" disabled={busy} onClick={()=>{setPreview(null);setConsent(false);}}>취소</Button></div>
 </section>}
 <p role="status">{message}</p>
 </section>;
}
