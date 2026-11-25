import { dialog } from "electron";
import {store} from "../store";
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { requestStorageOperation } from "../services/storage-owner";

function runtime() {
 const dir=process.env.RANSOMGUARD_RUNTIME_DIR || (process.env.RANSOM0_FIREWALL_STATE_DB ? path.dirname(process.env.RANSOM0_FIREWALL_STATE_DB) : undefined);
 if (!dir) throw new Error("통합 실행 경로를 확인할 수 없습니다.");
 return dir;
}
async function invoke(action: "status"|"change"|"launch"|"list"|"manual"|"protect"|"restore-preview"|"restore-execute"|"loss-reset"|"program-list"|"program-add"|"program-remove", request?: unknown, snapshot=false) {
 const dir=runtime();
 if (process.env.RANSOM0_STORAGE_OWNER === "scm" && action !== "launch") {
  if (action.startsWith("program-")) return requestStorageOperation("program." + action.slice(8), request);
  if (action === "loss-reset") return requestStorageOperation("loss.reset");
  return requestStorageOperation((snapshot ? "snapshot." : "scope.") + action, request);
 }
 const config=JSON.parse(await fs.readFile(path.join(dir,"installation.json"),"utf8"));
 if (typeof config.python!=="string" || typeof config.recovery_root!=="string" || !path.isAbsolute(config.python) || !path.isAbsolute(config.recovery_root)) throw new Error("설치 경로가 올바르지 않습니다.");
 return new Promise((resolve,reject)=>{
  const child=spawn(config.python,["-u","-m",action.startsWith("program-") ? "ransomguard.program_allowlist" : action==="loss-reset" ? "ransomguard.loss_settings" : snapshot ? "ransomguard.snapshot_settings" : "ransomguard.scope_settings","--runtime",dir,action],{
   cwd:config.recovery_root,windowsHide:true,env:{...process.env,PYTHONIOENCODING:"utf-8"},stdio:["pipe","pipe","pipe"]});
  let output="";let error="";
  child.stdout.on("data",chunk=>{output+=chunk.toString("utf8");});
  child.stderr.on("data",chunk=>{error+=chunk.toString("utf8");});
  child.on("error",reject);
  child.on("close",code=>{
   try {const result=JSON.parse(output.trim().split("\n").at(-1) || "{}");
    if(code!==0 || result.error) reject(new Error(result.error || error || "복구 설정 실행 실패"));else resolve(result);
   }catch{reject(new Error("복구 설정 응답을 읽지 못했습니다."));}
  });
  child.stdin.end(request ? JSON.stringify(request) : "");
 });
}
export async function chooseRecoveryFolder() {
 const result=await dialog.showOpenDialog({title:"보호·복구할 폴더 선택",properties:["openDirectory"]});
 return result.canceled ? null : result.filePaths[0];
}
export function getRecoverySettings(){return invoke("status");}
export function getSnapshotSettings(){return invoke("status",undefined,true);}
export function setSnapshotInterval(intervalMinutes:number){if(![15,30,60,120].includes(intervalMinutes)) throw new Error("잘못된 스냅샷 주기");return invoke("change",{intervalMinutes},true);}
export function openSnapshotConsole(){return invoke("launch",undefined,true);}
export function getSnapshotInventory(){return invoke("list",undefined,true);}
export function createManualSnapshot(requestId:string){if(typeof requestId!=="string" || requestId.length!==36)throw new Error("잘못된 생성 요청");return invoke("manual",{requestId},true);}
export function setSnapshotProtection(snapshotId:string,enabled:boolean){if(typeof snapshotId!=="string" || snapshotId.length!==38 || typeof enabled!=="boolean")throw new Error("잘못된 보호 요청");return invoke("protect",{snapshotId,enabled},true);}
let changing=false;
export async function setRecoverySettings(request: {folder:string;acknowledgeFolderRevert:boolean;snapshotBudgetGiB:number}) {
 if(changing) throw new Error("복구 설정을 적용 중입니다.");
 if(!request || typeof request.folder!=="string" || request.folder.length>32767 || request.acknowledgeFolderRevert!==true || !Number.isInteger(request.snapshotBudgetGiB)) throw new Error("복구 폴더와 동의 항목을 확인해 주세요.");
 changing=true;
 try{return await invoke("change",request);}finally{changing=false;}
}

export function previewSnapshotRestore(snapshotId:string){if(typeof snapshotId!=="string" || snapshotId.length!==38)throw new Error("잘못된 스냅샷");return invoke("restore-preview",{snapshotId},true);}
export function executeSnapshotRestore(token:string,confirmed:boolean){if(typeof token!=="string" || token.length!==36 || confirmed!==true)throw new Error("복구 확인이 필요합니다.");return invoke("restore-execute",{token,confirmed},true);}

export async function getRecoveryScopeStatus() {
 try {
  const settings=JSON.parse(await fs.readFile(path.join(runtime(),"protection.json"),"utf8"));
  return {configured:typeof settings.protected_root==="string" && settings.protected_root.trim().length>0};
 } catch(error) {
  if((error as NodeJS.ErrnoException).code==="ENOENT") return {configured:false};
  throw new Error("복구 범위 상태를 확인하지 못했습니다.",{cause:error});
 }
}
async function jevBridge() {
 const config=JSON.parse(await fs.readFile(path.join(runtime(),"jev-transport.json"),"utf8"));
 if(typeof config.bridge!=="string" || !path.isAbsolute(config.bridge)) throw new Error("JEV 연결 설정을 찾지 못했습니다.");
 return config.bridge as string;
}
function runKeyBridge(exe:string, action:"--check-key"|"--import-key", key?:string):Promise<boolean> {
 return new Promise((resolve,reject)=>{
  const child=spawn(exe,[action],{windowsHide:true,stdio:["pipe","pipe","ignore"]});
  let output="";
  child.stdout.on("data",chunk=>{if(output.length<8192)output+=chunk.toString("utf8");});
  const timer=setTimeout(()=>{child.kill();reject(new Error("JEV 키 저장소 응답 시간이 초과됐습니다."));},20000);
  child.on("error",()=>{clearTimeout(timer);reject(new Error("JEV 키 저장 도구를 실행하지 못했습니다."));});
  child.on("close",code=>{clearTimeout(timer);
   if(code===0){resolve(true);return;}
   let category="";try{category=JSON.parse(output.replace(/^\uFEFF/,"")).category;}catch{ /* Ignore untrusted diagnostic text. */ }
   if(action==="--check-key" && !["FileNotFoundException","DirectoryNotFoundException"].includes(category)) {reject(new Error("JEV 키 저장소를 확인하지 못했습니다."));return;}
   resolve(false);
  });
  child.stdin.on("error",()=>{});
  child.stdin.end(key ?? "", "utf8");
 });
}
export async function getJevKeyStatus() {return {configured:await runKeyBridge(await jevBridge(),"--check-key")};}
export async function setJevApiKey(key:unknown) {
 if(typeof key!=="string" || !/^[\x21-\x7e]{16,4096}$/.test(key.trim())) throw new Error("API 키 형식을 확인해 주세요.");
 if(!await runKeyBridge(await jevBridge(),"--import-key",key.trim())) throw new Error("키를 저장하지 못했습니다. 관리자 권한과 JEV 저장소를 확인해 주세요.");
 const status=await getJevKeyStatus();
 if(!status.configured) throw new Error("저장한 키를 읽는 데 실패했습니다.");
 return status;
}

export function resetLossCounter(){return invoke("loss-reset");}

type ProgramList = {entries:{id:string;path:string;sha256:string;created:number;name?:string}[]};
function programNames(result:unknown):ProgramList {
 const list=result as ProgramList;
 const names=store.get("programDisplayNames") ?? {};
 return {...list,entries:list.entries.map(entry=>({...entry,name:names[entry.id] ?? ""}))};
}
export async function getProgramAllowlist(){return programNames(await invoke("program-list"));}
export async function renameProgramAllowlist(id:string,name:string) {
 if(typeof id!=="string" || !/^[0-9a-f-]{36}$/i.test(id) || typeof name!=="string" || name.length>80 || Array.from(name).some(char=>char.charCodeAt(0)<32 || char.charCodeAt(0)===127)) throw new Error("프로그램 이름은 80자 이내로 입력해 주세요.");
 const list=await invoke("program-list") as ProgramList;
 if(!list.entries.some(entry=>entry.id===id))throw new Error("등록된 프로그램을 찾지 못했습니다. 목록을 새로고침해 주세요.");
 // Display metadata only; keep exception path/hash policy unchanged.
 const names={...store.get("programDisplayNames")};
 if(name.trim())names[id]=name.trim();else delete names[id];
 store.set("programDisplayNames",names);
 return programNames(list);
}
export async function addProgramAllowlist(){
 const selected=await dialog.showOpenDialog({title:"자동 대응에서 제외할 실행 파일 선택",properties:["openFile"],filters:[{name:"Windows 실행 파일",extensions:["exe"]}]});
 if(selected.canceled) return null;
 const result=await dialog.showMessageBox({type:"warning",buttons:["취소","등록"],defaultId:0,cancelId:0,
 message:"이 프로그램의 자동 대응을 제외할까요?",detail:selected.filePaths[0]+"\n경로와 SHA-256이 일치할 때 자동 격리·종료·복구를 제외합니다. 로그와 커널 자기보호는 유지됩니다. 자식 프로세스에는 적용하지 않습니다."});
 return result.response===1 ? programNames(await invoke("program-add",{path:selected.filePaths[0]})) : null;
}
export async function removeProgramAllowlist(id:string){
 if(typeof id!=="string" || !/^[0-9a-f-]{36}$/i.test(id))throw new Error("잘못된 프로그램 예외 ID");
 const result=await invoke("program-remove",{id});
 const names={...store.get("programDisplayNames")};delete names[id];store.set("programDisplayNames",names);
 return programNames(result);
}
