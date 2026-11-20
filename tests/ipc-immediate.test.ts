import { expect, test } from "bun:test";
import net from "node:net";
import { ExternalIPCReceiver } from "../electron/services/ipc-receiver";

test("new events drain on arrival without waiting for a legacy interval", async () => {
 const receiver = new ExternalIPCReceiver();
 const pipe = `\\\\.\\pipe\\Ransom0_Immediate_${process.pid}`;
 const seen: number[] = [];
 let complete!: () => void;
 const done = new Promise<void>(resolve => { complete = resolve; });
 receiver.startConsumer(batch => {
  seen.push(...batch.map(item => (item as { sequence: number }).sequence));
  if (seen.length === 1100) complete();
  return [];
 }, 60000);
 receiver.startListening(pipe);
 const socket = net.createConnection(pipe);
 try {
  await new Promise<void>((resolve, reject) => { socket.once("connect", resolve); socket.once("error", reject); });
  socket.write(Array.from({ length: 1100 }, (_, sequence) => JSON.stringify({ sequence }) + "\n").join(""));
  await done;
  expect(seen).toEqual(Array.from({ length: 1100 }, (_, i) => i));
 } finally { socket.destroy(); receiver.stopAll(); }
}, 3000);
