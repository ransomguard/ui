import {SettingsHelp} from "@/components/settings-help";
import {useEffect,useState} from "react";
import {Card,CardHeader,CardTitle,CardContent} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
export function JevKeySettings(){
 const [configured,setConfigured]=useState<boolean|null>(null);
 const [key,setKey]=useState("");const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");
 useEffect(()=>{let active=true;window.electronAPI.getJevKeyStatus().then(s=>{if(active)setConfigured(s.configured);}).catch(()=>{if(active)setMessage("JEV 키 저장소 상태를 확인하지 못했습니다.");});return ()=>{active=false;};},[]);
 async function save(){setBusy(true);setMessage("");try{const result=await window.electronAPI.setJevApiKey(key);setConfigured(result.configured);window.dispatchEvent(new Event("jev-key-changed"));setMessage("API 키를 암호화하여 저장했습니다. 자동 대응이 비활성화돼 있으면 복구 범위 적용을 진행해 주세요.");}catch{setMessage("키 저장에 실패했습니다. 키 형식, 관리자 권한 및 JEV 연결 설정을 확인해 주세요.");}finally{setKey("");setBusy(false);}}
 return <Card><CardHeader><CardTitle>JEV (TypeSafe) API 키</CardTitle></CardHeader><CardContent className="space-y-4">
 <label htmlFor="jev-api-key">API 키 {configured ? "변경" : "입력"}</label>
 <div className="flex gap-2"><Input id="jev-api-key" type="password" autoComplete="new-password" spellCheck={false} value={key} disabled={busy} maxLength={4096} onChange={e=>setKey(e.target.value)} placeholder="새 API 키 입력"/><Button disabled={busy||key.trim().length<16} onClick={save}>{busy ? "저장 중…" : "키 저장"}</Button></div>
 <SettingsHelp title="API 키 저장 안내"><p>키는 Windows 암호화 저장소에 저장하며 기존 키 값은 표시하지 않습니다. 저장 여부는 서버 인증 성공을 의미하지 않으며, 저장만으로 외부 요청을 보내지는 않습니다.</p></SettingsHelp>
 <p className={configured===false ? "font-medium text-red-600 dark:text-red-400" : undefined} role={configured===false ? "alert" : "status"}>{configured===null ? "키 상태 확인 중" : configured ? "API 키 저장됨" : "API키가 등록되지 않았습니다."}</p>
 <p role="status">{message}</p>
 </CardContent></Card>;
}
