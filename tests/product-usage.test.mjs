import {test} from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';import {randomUUID} from 'node:crypto';import {spawnSync} from 'node:child_process';import {fileURLToPath} from 'node:url';import { usageEventDetail } from '../src/productUsageMetadata.ts';
const script=readFileSync(new URL('../public/product-usage.js',import.meta.url),'utf8');
function harness(search=''){
 const listeners={},storage=new Map(),sent=[];let now=0,timer;const doc={documentElement:{lang:'zh'},visibilityState:'visible',querySelector:()=>null,querySelectorAll:()=>[],addEventListener:(n,f)=>listeners['doc:'+n]=f};
 const ctx={location:{search},navigator:{webdriver:false},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},document:doc,performance:{now:()=>now},crypto:{randomUUID},URLSearchParams,fetch:(u,o)=>{sent.push({url:u,data:JSON.parse(o.body)});return Promise.resolve({});},setInterval:f=>timer=f,Element:class{},HTMLDetailsElement:class{},HTMLInputElement:class{},innerHeight:800};ctx.window={addEventListener:(n,f)=>listeners[n]=f};vm.runInNewContext(script,ctx);
 return {sent,storage,doc,emit:(n,detail)=>listeners[n]?.({detail}),tick:()=>{now+=5000;timer();},search:(source)=>{const target=new ctx.HTMLInputElement();Object.assign(target,{type:'search',value:'PRIVATE SEARCH',closest:selector=>selector===(source==='stories'?'.story-browse-controls':'.directory-search')?{}:null});listeners['doc:input']({target});}};
}
function usageBridge(h){
 return {usageEvent:(event,metadata)=>h.emit('wendao:usage',usageEventDetail(event,metadata))};
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
test('bilingual contact labels and related works become fixed targets before transport',()=>{
 const h=harness();const bridge=usageBridge(h);h.storage.set('wendao.usageConsent.v1','granted');h.emit('wendao:usage-ready',{production:true,surface:'h5',version:'web'});
 for(const [label,target] of [['WonderElian','wonderelian'],['邮箱','email'],['Email','email'],['小红书','red'],['RED','red'],['抖音','douyin'],['Douyin','douyin'],['X','x'],['TikTok','tiktok'],['视频号','wechat_channels'],['WeChat Channels','wechat_channels']]){
  bridge.usageEvent('contact_click',{target:label});assert.equal(h.sent.at(-1).data.metadata.target,target);
 }
 bridge.usageEvent('related_product_click',{target:'human-design'});assert.equal(h.sent.at(-1).data.metadata.target,'buer');
 for(const event of ['contact_click','related_product_click','companion_open'])for(const target of ['person@example.com','https://buer.wonderelian.com/','@account','__proto__']){
  bridge.usageEvent(event,{target});assert.deepEqual(h.sent.at(-1).data.metadata,{});
 }
 assert.ok(!JSON.stringify(h.sent).includes('person@example.com'));
});
test('entry sources and targets survive client/server validation and reject wrong-field values',()=>{
 const h=harness();const bridge=usageBridge(h);h.storage.set('wendao.usageConsent.v1','granted');h.emit('wendao:usage-ready',{production:true,surface:'ios',version:'1.9.7'});
 for(const source of ['initial','daily','directory','search','chance','continuation','link','daily_notification','reading_composer','reading_access_gate','drawer','reading','stories','story_search','story_filter','directory_order','cache_clear','header','header_search','conversation','web','ios','android','contact']){
  h.emit('wendao:usage',{event:'directory_open',source});assert.equal(h.sent.at(-1).data.metadata.source,source);
 }
 for(const target of ['wonderelian','yixiu','xiazi','buer','style-atlas'])bridge.usageEvent('related_product_click',{target});
 for(const target of ['subscription','lifetime'])bridge.usageEvent('companion_open',{target,source:'reading_access_gate',plan:'lifetime'});
 h.emit('wendao:usage',{event:'related_product_click',target:'email',source:'monthly',seconds:5,question:'private',href:'https://example.com'});assert.deepEqual(h.sent.at(-1).data.metadata,{});
 h.emit('wendao:usage',{event:'restore_result',result:'found'});
 for(const result of ['permission-denied','activation-required']){h.emit('wendao:usage',{event:'save_result',result});assert.equal(h.sent.at(-1).data.metadata.result,result);}
 for(const value of ['received','silk'])h.emit('wendao:usage',{event:'directory_order_change',value});
 for(const value of ['comic','essay','all','chapter','theme'])h.emit('wendao:usage',{event:'story_filter',source:'stories',value});
 for(const result of ['cleared','failed'])h.emit('wendao:usage',{event:'comic_cache_clear',result});
 const backend=spawnSync('python3',['-c','import json,sys,usage\nfor item in json.load(sys.stdin): usage.validate(item)\nprint("VALIDATED")'],{cwd:fileURLToPath(new URL('../growth/',import.meta.url)),input:JSON.stringify(h.sent.map(item=>item.data)),encoding:'utf8'});
 assert.equal(backend.status,0,backend.stderr);assert.match(backend.stdout,/VALIDATED/);
});
test('first search records only its location and later input remains throttled',()=>{
 const h=harness();h.storage.set('wendao.usageConsent.v1','granted');h.emit('wendao:usage-ready',{production:true,surface:'h5',version:'web'});
 h.search('stories');assert.deepEqual(h.sent.at(-1).data.metadata,{source:'stories'});const count=h.sent.length;
 h.search('stories');assert.equal(h.sent.length,count);h.tick();h.tick();h.search('directory');assert.deepEqual(h.sent.at(-1).data.metadata,{source:'directory'});
 assert.ok(!JSON.stringify(h.sent).includes('PRIVATE SEARCH'));
});
