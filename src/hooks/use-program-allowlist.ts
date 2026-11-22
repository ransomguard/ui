import {useCallback, useEffect, useState} from "react";
type Entry = Awaited<ReturnType<Window["electronAPI"]["getProgramAllowlist"]>>["entries"][number];
export function useProgramAllowlist() {
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
 async function rename(id:string,name:string){
  setBusy(true);setError("");
  try{setEntries((await window.electronAPI.renameProgramAllowlist(id,name)).entries);return true;}
  catch(e){setError(e instanceof Error ? e.message : "이름 저장 실패");return false;}
  finally{setBusy(false);}
 }
 return {entries,busy,error,load,change,rename};
}
