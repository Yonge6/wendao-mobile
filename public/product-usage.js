(function () {
  'use strict';
  const KEY='wendao.usageConsent.v1', ID='wendao.usageVisitor.v1';
  const query=new URLSearchParams(location.search);
  const excluded=query.has('acceptance')||query.has('preview')||query.get('analytics')==='off'||navigator.webdriver||navigator.globalPrivacyControl===true;
  let context=null, visitor='', session='', last=performance.now(), interacted=last, pending=0, reading=0, activeChapter=0;
  const seen=new Set();
  const consent=()=>{try{return localStorage.getItem(KEY)==='granted';}catch{return false;}};
  const enabled=()=>context?.production && !excluded && consent();
  const events=new Set('visit active_time reading_time chapter_view section_view directory_open directory_order_change chance_chapter free_chapter_kept companion_open language_change theme_change reading_size_change profile_saved chart_calculated daily_notification_change app_store_action contact_click related_product_click companion_answer_share comic_open comic_cache_clear reflection_open story_open story_filter share_request share_result save_request save_result copy_result link_result chat_request chat_success chat_error chat_cancel chat_latency paywall_view purchase_request purchase_result restore_result search'.split(' '));
  const values=new Set('initial directory search chance continuation daily_notification reading_composer drawer reading verse meaning inspiration manual stories received silk comic essay all chapter theme cleared monthly annual lifetime purchased pending cancelled failed shared saved downloaded preview copied unavailable permission-denied activation-required found empty download rate light dark small medium large zh en granted denied enabled disabled error transport quota auth other web ios contact human-design wonderelian yixiu xiazi style-atlas buer'.split(' '));
  const sources=new Set('initial daily directory search chance continuation link daily_notification reading_composer reading_access_gate drawer reading stories story_search story_filter directory_order cache_clear header header_search conversation web ios android contact'.split(' '));
  const targets={contact_click:new Set('wonderelian email red douyin x tiktok wechat_channels'.split(' ')),related_product_click:new Set('wonderelian yixiu xiazi buer style-atlas'.split(' ')),companion_open:new Set('subscription lifetime'.split(' '))};
  function ids(){try{visitor=localStorage.getItem(ID)||crypto.randomUUID();localStorage.setItem(ID,visitor);session=crypto.randomUUID();}catch{visitor=crypto.randomUUID();session=crypto.randomUUID();}}
  function chapter(){const el=[...document.querySelectorAll('.chapter[data-chapter-id]')].find(e=>{const r=e.getBoundingClientRect();return r.top<innerHeight*.5&&r.bottom>innerHeight*.25;});return Number(el?.dataset.chapterId)||0;}
  function targetChapter(el){return Number(el.closest('[data-chapter-id]')?.dataset.chapterId)||chapter();}
  function send(name, params={}) {
    if(!enabled()||!events.has(name))return;
    if(!visitor)ids();
    const safe={};
    for(const key of ['section','result','plan','value','action','error_code'])if(values.has(params[key]))safe[key]=params[key];
    if(sources.has(params.source))safe.source=params.source;
    if(targets[name]?.has(params.target))safe.target=params.target;
    if(['active_time','reading_time','chat_latency'].includes(name)&&Number.isFinite(params.seconds))safe.seconds=Math.min(600,Math.max(0,Math.round(params.seconds*100)/100));
    const ch=Number(params.chapter??chapter());
    const body=JSON.stringify({schema:1,event_id:crypto.randomUUID(),visitor,session,event:name,surface:context.surface,chapter:Number.isInteger(ch)&&ch>=1&&ch<=81?ch:0,language:document.documentElement.lang.startsWith('zh')?'zh':'en',version:/^[a-zA-Z0-9._-]{1,32}$/.test(context.version)?context.version:'unknown',metadata:safe,test:false});
    // No account cookies/authorization or automatic retries; event IDs are deduplicated server-side.
    const url=context.surface==='ios'?'https://wendao.wonderelian.com/__usage/event':'/__usage/event';
    void fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body,credentials:'omit',keepalive:true}).catch(()=>{});
  }
  function begin(){last=performance.now();interacted=last;pending=0;reading=0;activeChapter=chapter();seen.clear();if(enabled()){ids();send('visit');}}
  function flush(){if(pending>=1)send('active_time',{seconds:pending});if(reading>=1)send('reading_time',{seconds:reading,chapter:activeChapter});pending=0;reading=0;}
  function tick(){const now=performance.now();const delta=Math.max(0,Math.min(5,(now-last)/1000));last=now;if(!enabled()||document.visibilityState!=='visible'||now-interacted>60000)return;
    pending+=delta;const ch=chapter();if(ch!==activeChapter){flush();activeChapter=ch;}
    const obscured=document.querySelector('.side-drawer,.share-card-panel,.companion-conversation');
    if(ch&&!obscured){reading+=delta;const k=`chapter:${ch}`;if(!seen.has(k)){seen.add(k);send('chapter_view',{chapter:ch});}}
    for(const section of (obscured?[]:document.querySelectorAll(`.chapter[data-chapter-id="${ch}"] [data-share-section]`))){const r=section.getBoundingClientRect();const k=`${ch}:${section.dataset.shareSection}`;if(r.top<innerHeight*.75&&r.bottom>80&&!seen.has(k)){seen.add(k);send('section_view',{chapter:ch,section:section.dataset.shareSection});}}
    if(pending>=30)flush();
  }
  window.addEventListener('wendao:usage-ready',e=>{context=e.detail;begin();});
  window.addEventListener('wendao:usage',e=>{const {event,...params}=e.detail||{};if(event==='chapter_view')return;send(event,params);});
  window.addEventListener('wendao:usage-consent',()=>{if(!consent()){pending=0;reading=0;visitor='';session='';try{localStorage.removeItem(ID);}catch{}}else begin();});
  for(const name of ['pointerdown','keydown','scroll','touchstart'])document.addEventListener(name,()=>{interacted=performance.now();},{passive:true,capture:true});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flush();last=performance.now();});
  window.addEventListener('pagehide',flush);setInterval(tick,5000);
  document.addEventListener('click',e=>{const el=e.target instanceof Element?e.target:null;if(!el)return;
    if(el.closest('.life-story-comic-open'))send('comic_open',{chapter:targetChapter(el)});
    if(el.closest('.drawer-story-card'))send('story_open',{chapter:targetChapter(el)});
    if(el.closest('a[href*="apps.apple.com"],a[href^="/download.html"]'))send('app_store_action',{action:'download'});
  });
  document.addEventListener('toggle',e=>{if(e.target instanceof HTMLDetailsElement&&e.target.open&&e.target.matches('.life-story-text'))send('reflection_open',{chapter:targetChapter(e.target)});},true);
  let searchAt=-Infinity;document.addEventListener('input',e=>{if(e.target instanceof HTMLInputElement&&e.target.type==='search'&&performance.now()-searchAt>5000){searchAt=performance.now();const source=e.target.closest('.story-browse-controls')?'stories':e.target.closest('.directory-search')?'directory':undefined;send('search',source?{source}:{});}});
}());
