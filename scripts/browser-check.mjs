// Optional local-only visual check. Start an isolated headless Chrome with CDP on 9333.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const pages=await (await fetch('http://127.0.0.1:9333/json/list')).json();
const tab=pages.find(p=>p.type==='page');
assert(tab,'No isolated Chrome page found');
const socket=new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
let next=0;const pending=new Map();
socket.onmessage=event=>{const message=JSON.parse(event.data);if(message.id){const p=pending.get(message.id);pending.delete(message.id);message.error?p.reject(new Error(JSON.stringify(message.error))):p.resolve(message.result);}};
const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++next;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
try {
 await call('Page.enable');
 for(const [width,height,mobile] of [[390,844,true],[1280,900,false]]){
  await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile});
  await call('Page.navigate',{url:'file://'+path.resolve('node_modules/.tmp/course-preview.html')});
  for(let i=0;i<40;i++){
   const r=await call('Runtime.evaluate',{expression:'document.readyState === "complete" && document.querySelectorAll(".katex-display").length > 0',returnByValue:true});
   if(r.result.value)break;
   await new Promise(resolve=>setTimeout(resolve,100));
  }
  await call('Runtime.evaluate',{expression:'document.fonts.ready',awaitPromise:true});
  const r=await call('Runtime.evaluate',{expression:`JSON.stringify({viewport:innerWidth,pageWidth:document.documentElement.scrollWidth,mathErrors:document.querySelectorAll('.katex-error').length,displayEquations:document.querySelectorAll('.katex-display').length,scrollingEquations:[...document.querySelectorAll('.katex-display')].filter(e=>e.scrollWidth>e.clientWidth+1).length})`,returnByValue:true});
  const metrics=JSON.parse(r.result.value);console.log(metrics);
  assert.equal(metrics.viewport,width);assert(metrics.pageWidth<=width,`Page overflow at ${width}px`);assert.equal(metrics.mathErrors,0);assert(metrics.displayEquations>0);
  await call('Runtime.evaluate',{expression:`([...document.querySelectorAll('.katex-display')].find(e=>e.scrollWidth>e.clientWidth+1)||document.querySelector('.katex-display')).scrollIntoView({block:'center'})`});
  const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  fs.writeFileSync(`/tmp/pg-coach-equations-${width}.png`,Buffer.from(shot.data,'base64'));
 }
} finally {
 await call('Browser.close');
 socket.close();
}
