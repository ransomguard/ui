import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import type { WhitelistItem } from "./types";

export function isManagedJevValue(value: string) {
 return /^(?:https?:\/\/)?api\.typesafe\.ai(?::443)?\/?$/i.test(value.trim());
}
let cached: { until:number; item:WhitelistItem } | undefined;
export async function managedJevItem():Promise<WhitelistItem> {
 if(cached && cached.until>Date.now()) return cached.item;
 let status="Windows 방화벽 규칙 확인 실패";
 let ips:string[]=[];
 try {
  const script="$ErrorActionPreference='Stop'; $r=Get-NetFirewallRule -PolicyStore ActiveStore -Name 'RansomGuard-JEV-Only-HTTPS' -ErrorAction Stop; $a=$r|Get-NetFirewallApplicationFilter; $p=$r|Get-NetFirewallPortFilter; $i=$r|Get-NetFirewallAddressFilter; @{enabled=([string]$r.Enabled);action=([string]$r.Action);direction=([string]$r.Direction);program=$a.Program;port=$p.RemotePort;protocol=([string]$p.Protocol);ips=@($i.RemoteAddress)}|ConvertTo-Json -Compress";
  const exe=path.join(process.env.SystemRoot || "C:\\Windows","System32","WindowsPowerShell","v1.0","powershell.exe");
  const {stdout}=await promisify(execFile)(exe,["-NoProfile","-NonInteractive","-Command",script],{windowsHide:true,timeout:12000,maxBuffer:32768});
  const r=JSON.parse(stdout.replace(/^\uFEFF/,""));
  ips=Array.isArray(r.ips)?r.ips.filter((v:unknown)=>typeof v==="string"):[];
  const valid=r.enabled==="True" && r.action==="Allow" && r.direction==="Outbound" && String(r.port)==="443" && ["TCP","6"].includes(r.protocol) && /\\RansomGuard\.JevBridge\.exe$/i.test(r.program);
  status=valid?"Windows 방화벽 활성 확인 · JEV Bridge 전용 TCP 443":"Windows 방화벽 설정 확인 필요";
 } catch { /* Never claim that a missing/unreadable rule is active. */ }
 const item:WhitelistItem={type:"domain",value:"api.typesafe.ai:443",systemManaged:true,managedDescription:`JEV (TypeSafe) · 시스템 관리 · ${status} · WFP 일반 예외와 별도`,data:{domain:"api.typesafe.ai",port:443,ipv4:ips.filter(v=>!v.includes(":")),ipv6:ips.filter(v=>v.includes(":"))}};
 cached={until:Date.now()+30000,item};return item;
}
