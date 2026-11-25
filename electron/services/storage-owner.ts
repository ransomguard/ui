import path from "node:path";
import { spawn } from "node:child_process";

export function requestStorageOperation<T>(operation: string, args: unknown = {}): Promise<T> {
 const python = path.resolve(path.dirname(process.execPath), "..", "python", "python.exe");
 return new Promise((resolve, reject) => {
  const child = spawn(python, ["-I", "-B", "-m", "ransomguard.service_operations", operation],
   { stdio: ["pipe", "pipe", "ignore"], windowsHide: true });
  let data = "";
  child.on("error", reject);
  child.stdout.setEncoding("utf8");
  child.stdout.on("data", chunk => {
   if (data.length <= 16 * 1024 * 1024) data += chunk;
  });
  child.on("close", code => {
   try {
    const result = JSON.parse(data);
    if (code !== 0) throw new Error(result.error || "서비스 요청 실패");
    resolve(result as T);
   } catch (error) { reject(error); }
  });
  child.stdin.on("error", reject);
  child.stdin.end(JSON.stringify(args), "utf8");
 });
}
