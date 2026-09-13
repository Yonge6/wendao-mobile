import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
const code = readFileSync(new URL('../public/growth/reading.js', import.meta.url), 'utf8');
const storage = () => { const data = new Map(); return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)}; };
function setup({ optedOut=false, existingSession=storage(), local=storage(), search='?ops_test=1' }={}) {
  let now=0; const calls=[], timers=[], listeners={};
  if(optedOut)local.setItem('wendao-growth-optout','1');
  const doc={body:{dataset:{page:'explaining'}},visibilityState:'visible',querySelectorAll:()=>[],addEventListener:(k,v)=>listeners[k]=v,getElementById:id=>id==='reading-body'?{getBoundingClientRect:()=>({top:100,bottom:900,height:800})}:null};
  vm.runInNewContext(code,{localStorage:local,sessionStorage:existingSession,crypto:{randomUUID},document:doc,navigator:{},location:{search,origin:'https://wendao.wonderelian.com',href:'https://wendao.wonderelian.com/situations/explaining/'+search},URL,URLSearchParams,Date,performance:{now:()=>now},innerHeight:900,setTimeout,setInterval:fn=>(timers.push(fn),1),clearInterval:()=>{},fetch:async(url,init)=>{calls.push(JSON.parse(init.body));return {ok:true};}});
  return {calls,doc,local,session:existingSession,tick(n){for(let i=0;i<n;i++){now+=1000;timers.forEach(fn=>fn());}},visible(v){doc.visibilityState=v?'visible':'hidden';listeners.visibilitychange?.();}};
}
test('engagement needs 45 visible seconds; hidden time does not qualify',async()=>{
  const s=setup();await Promise.resolve();s.tick(44);assert.equal(s.calls.filter(x=>x.event==='engaged').length,0);
  s.visible(false);s.tick(100);assert.equal(s.calls.filter(x=>x.event==='engaged').length,0);
  s.visible(true);s.tick(1);assert.equal(s.calls.filter(x=>x.event==='engaged').length,1);
  assert.ok(s.calls.every(x=>x.test===true));
});
test('refresh does not duplicate an acknowledged session milestone',async()=>{
  const s=setup();await new Promise(setImmediate);s.tick(45);await new Promise(setImmediate);
  const next=setup({existingSession:s.session,local:s.local});next.tick(45);await Promise.resolve();assert.equal(next.calls.length,0);
});
test('opted-out reader sends no first-party events',()=>{
  const s=setup({optedOut:true});s.tick(100);assert.equal(s.calls.length,0);
});
test('test session remains excluded when a navigation omits the query flag',()=>{
  const s=setup();
  const next=setup({existingSession:s.session,local:s.local,search:''});
  assert.equal(next.calls[0].test,true);
});
