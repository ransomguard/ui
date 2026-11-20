import {Link} from "react-router";
import {useEffect,useState} from "react";
import {Badge} from "@/components/ui/badge";
export function JevKeyBadge(){
 const [configured,setConfigured]=useState<boolean|null>(null);
 useEffect(()=>{
  let active=true;
  const refresh=()=>{window.electronAPI.getJevKeyStatus().then(s=>{if(active)setConfigured(s.configured);}).catch(()=>{if(active)setConfigured(null);});};
  refresh();window.addEventListener("jev-key-changed",refresh);
  return ()=>{active=false;window.removeEventListener("jev-key-changed",refresh);};
 },[]);
 return <Badge render={<Link to="/settings?tab=protection#jev-key"/>} variant="outline" className={configured===true ? "text-emerald-700 border-emerald-500/30 dark:text-emerald-400" : "text-red-600 border-red-500/30 dark:text-red-400"} title="키 저장 및 읽기 가능 여부입니다. 실제 JEV 서버 인증 성공 여부와는 별개입니다.">
 {configured===null ? "JEV API 키 확인 필요" : configured ? "JEV API 키 등록됨" : "JEV API 키 미등록"}
 </Badge>;
}
