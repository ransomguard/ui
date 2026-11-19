import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
export type TraceKind = "kernel" | "decision" | "response";
const execute = promisify(execFile);
export function closeBackendTrace(kind: TraceKind) { throw new Error(`${kind}: 창의 X로 출력 콘솔을 닫아 주세요.`); }
export async function openBackendTrace(kind: TraceKind) {
 if (!["kernel", "decision", "response"].includes(kind)) throw new Error("Unknown console type");
 const runtime = process.env.RANSOMGUARD_RUNTIME_DIR || (process.env.RANSOM0_FIREWALL_STATE_DB ? path.dirname(process.env.RANSOM0_FIREWALL_STATE_DB) : undefined);
 if (!runtime) throw new Error("통합 실행 경로가 없습니다.");
 const config = JSON.parse(await fs.readFile(path.join(runtime, "installation.json"), "utf8"));
 if (typeof config.python !== "string" || typeof config.recovery_root !== "string" || !path.isAbsolute(config.python) || !path.isAbsolute(config.recovery_root)) throw new Error("설치된 백엔드 경로를 확인할 수 없습니다.");
 const script = path.join(config.recovery_root, "ransomguard", "console_stream.py");
 await fs.access(script);
 await execute(config.python, ["-u", script, "--runtime", runtime, "--channel", kind, "--launch"], {windowsHide: true, timeout: 10000});
}

