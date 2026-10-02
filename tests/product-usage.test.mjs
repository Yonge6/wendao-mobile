import {test} from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';import {randomUUID} from 'node:crypto';
const script=readFileSync(new URL('../public/product-usage.js',import.meta.url),'utf8');
function harness(search=''){
 const listeners={},storage=new Map(),sent=[];let now=0,timer;const doc={documentElement:{lang:'zh'},visibilityState:'visible',querySelector:()=>null,querySelectorAll:()=>[],addEventListener:(n,f)=>listeners['doc:'+n]=f};
 const ctx={location:{search},navigator:{webdriver:false},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},document:doc,performance:{now:()=>now},crypto:{randomUUID},URLSearchParams,fetch:(u,o)=>{sent.push({url:u,data:JSON.parse(o.body)});return Promise.resolve({});},setInterval:f=>timer=f,Element:class{},HTMLDetailsElement:class{},HTMLInputElement:class{},innerHeight:800};ctx.window={addEventListener:(n,f)=>listeners[n]=f};vm.runInNewContext(script,ctx);
 return {sent,storage,doc,emit:(n,detail)=>listeners[n]?.({detail}),tick:()=>{now+=5000;timer();}};
}
test('consent starts fresh; rejects private params; revoke stops collection and clears ID',()=>{
 const h=harness();h.emit('wendao:usage-ready',{production:true,surface:'h5',version:'web'});h.emit('wendao:usage',{event:'chat_request',question:'private'});assert.equal(h.sent.length,0);
 h.storage.set('wendao.usageConsent.v1','granted');h.emit('wendao:usage-consent');h.emit('wendao:usage',{event:'chat_error',email:'secret',value:'private text',error_code:'transport'});
 assert.equal(h.sent.length,2);assert.deepEqual(h.sent[1].data.metadata,{error_code:'transport'});assert.ok(!JSON.stringify(h.sent).includes('private'));
 h.storage.set('wendao.usageConsent.v1','denied');h.emit('wendao:usage-consent');h.emit('wendao:usage',{event:'chat_success'});assert.equal(h.sent.length,2);assert.equal(h.storage.has('wendao.usageVisitor.v1'),false);
});
test('QA URLs and nonproduction native produce no events',()=>{
 for(const query of ['?acceptance=1','?analytics=off','?preview=1']){const h=harness(query);h.storage.set('wendao.usageConsent.v1','granted');h.emit('wendao:usage-ready',{production:true,surface:'h5',version:'web'});assert.equal(h.sent.length,0);}
 const h=harness();h.storage.set('wendao.usageConsent.v1','granted');h.emit('wendao:usage-ready',{production:false,surface:'ios',version:'1.9.3'});assert.equal(h.sent.length,0);
});
test('foreground time excludes hidden/idle and uses increments',()=>{
 const h=harness();h.storage.set('wendao.usageConsent.v1','granted');h.emit('wendao:usage-ready',{production:true,surface:'ios',version:'1.9.3'});
 for(let i=0;i<6;i++)h.tick();assert.equal(h.sent[1].data.metadata.seconds,30);assert.match(h.sent[1].url,/^https:\/\/wendao/);
 h.doc.visibilityState='hidden';for(let i=0;i<12;i++)h.tick();assert.equal(h.sent.length,2);
 h.doc.visibilityState='visible';for(let i=0;i<12;i++)h.tick();assert.equal(h.sent.length,2);
});
