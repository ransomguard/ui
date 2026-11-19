import {Link} from "react-router";
import {useEffect,useState} from "react";
import {Badge} from "@/components/ui/badge";
export function RecoveryScopeBadge(){
 const [configured,setConfigured]=useState<boolean|null>(null);
 useEffect(()=>{
  let active=true;
  const refresh=()=>{window.electronAPI.getRecoveryScopeStatus().then(s=>{if(active)setConfigured(s.configured);}).catch(()=>{if(active)setConfigured(null);});};
  refresh();const timer=setInterval(refresh,30000);
  window.addEventListener("recovery-scope-changed",refresh);
  return ()=>{active=false;clearInterval(timer);window.removeEventListener("recovery-scope-changed",refresh);};
 },[]);
 return <Badge render={<Link to="/settings?tab=protection#recovery-scope"/>} variant="outline" className={configured===true ? "text-emerald-700 border-emerald-500/30 dark:text-emerald-400" : "text-red-600 border-red-500/30 dark:text-red-400"} title="복구 폴더 지정 여부입니다. 스냅샷 준비와 엔진 보호 상태는 별도로 확인합니다.">
 {configured===null ? "복구 범위 확인 중" : configured ? "복구 범위 지정됨" : "복구 범위 미지정"}
 </Badge>;
}
