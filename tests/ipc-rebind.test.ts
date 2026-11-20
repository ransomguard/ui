import {expect,test} from "bun:test";
import net from "node:net";
import {ExternalIPCReceiver} from "../electron/services/ipc-receiver";

test("replacement receiver retries after old pipe owner releases endpoint",async()=>{
 const pipe=process.platform==="win32" ? `\\\\.\\pipe\\Ransom0-rebind-test-${process.pid}` : `/tmp/ransom0-rebind-${process.pid}.sock`;
 const blocker=net.createServer();
 await new Promise<void>(resolve=>blocker.listen(pipe,resolve));
 const receiver=new ExternalIPCReceiver();
 let received=false;
 receiver.startConsumer(batch=>{received=batch.length===1;return [];},20);
 try{
  receiver.startListening(pipe);
  await new Promise(resolve=>setTimeout(resolve,150));
  await new Promise<void>(resolve=>blocker.close(()=>resolve()));
  await new Promise(resolve=>setTimeout(resolve,1200));
  await new Promise<void>((resolve,reject)=>{
   const socket=net.createConnection(pipe,()=>socket.end("{\"type\":\"rebind-test\"}\n"));
   socket.on("error",reject);socket.on("close",()=>resolve());
  });
  await new Promise(resolve=>setTimeout(resolve,80));
  expect(received).toBe(true);
 }finally{receiver.stopAll();if(blocker.listening)blocker.close();}
},5000);
