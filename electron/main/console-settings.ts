import { randomUUID } from "node:crypto";
import { app } from "electron";
import fs from "node:fs/promises";
import path from "node:path";

export interface ConsoleSettings { visible: boolean; collectOwnDbEvents: boolean; }
function runtime() {
 const dir = process.env.RANSOMGUARD_RUNTIME_DIR || (process.env.RANSOM0_FIREWALL_STATE_DB ? path.dirname(process.env.RANSOM0_FIREWALL_STATE_DB) : undefined);
 if (!dir) throw new Error("통합 실행기의 경로 설정이 없습니다. Ransom0 통합 실행으로 시작해 주세요.");
 return dir;
}
export async function getConsoleSettings(): Promise<ConsoleSettings> {
 try { const v = JSON.parse(await fs.readFile(path.join(runtime(), "console-display.json"), "utf8"));
 return { visible: v.visible === true, collectOwnDbEvents: v.collectOwnDbEvents === true }; }
 catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return {visible: false, collectOwnDbEvents: false}; throw error; }
}
export async function setConsoleSettings(value: ConsoleSettings) {
 if (!value || typeof value.visible !== "boolean" || typeof value.collectOwnDbEvents !== "boolean") throw new Error("잘못된 표시 설정");
 const dir = runtime();
 const ready = JSON.parse(await fs.readFile(path.join(dir,"observer-ready.json"),"utf8"));
 if (Date.now()/1000-ready.observed_at > 30 || ready.worker_state !== "running") throw new Error("수집기가 준비되지 않았습니다.");
 const dest = path.join(dir,"console-display.json");
 const requestId = randomUUID();
 const data = {...value, showOwnDbEvents:value.collectOwnDbEvents, requestId, uiPid: process.pid, uiDbPath: path.join(app.getPath("userData"),"db.sqlite")};
 await fs.writeFile(dest+".tmp",JSON.stringify(data),"utf8"); await fs.rename(dest+".tmp",dest);
 const deadline = Date.now()+7000;
 while (Date.now()<deadline) {
  try {
   const result=JSON.parse(await fs.readFile(path.join(dir,"console-display.status.json"),"utf8"));
   const admission=JSON.parse(await fs.readFile(path.join(dir,"internal-collection.status.json"),"utf8"));
   if (admission.requestId===requestId && admission.pid===ready.pid && admission.collectOwnDbEvents===value.collectOwnDbEvents && !admission.error && result.requestId===requestId && result.pid===ready.pid && result.visible===value.visible && result.showOwnDbEvents===value.collectOwnDbEvents) return value;
  } catch { /* Acknowledgement may be atomically replaced while reading. */ }
  await new Promise(resolve=>setTimeout(resolve,150));
 }
 throw new Error("수집기의 설정 적용 응답이 없습니다. 설정은 전달됐지만 적용을 확인하지 못했습니다.");
}
