import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
// Capture the shared app UI, with native iOS navigation and no fabricated content.
const base=process.argv[2] || 'http://127.0.0.1:4197/';
const browser=await chromium.launch();
try {
for(const device of ['iphone','ipad'])for(const lang of ['zh','en']){
 const folder=path.resolve('docs/app-store/screenshots/life-1.9',device,lang==='zh'?'zh-Hans':'en-US');await mkdir(folder,{recursive:true});
 const context=await browser.newContext({viewport:device==='iphone'?{width:440,height:956}:{width:1032,height:1376},deviceScaleFactor:device==='iphone'?3:2,isMobile:true,hasTouch:true,locale:lang==='zh'?'zh-CN':'en-US'});
 const page=await context.newPage();
 await page.addInitScript(()=>{Object.assign(window,{CapacitorCustomPlatform:{name:'ios'},Capacitor:{Plugins:{},PluginHeaders:[],nativePromise:()=>Promise.resolve()}});localStorage.setItem('wendao-free-chapters-v1','[34]');});
 await page.goto(`${base}?lang=${lang}&chapter=34&acceptance=1`,{waitUntil:'networkidle'});
 await page.evaluate(()=>document.fonts.ready);
 const section=page.locator('.chapter-current .life-stories-section');await section.scrollIntoViewIfNeeded();
 await page.evaluate(()=>{const target=document.querySelector('.chapter-current .life-stories-section');const scroller=document.querySelector('[data-testid="mobile-scroll"]');if(scroller&&scroller.scrollHeight>scroller.clientHeight)scroller.scrollTop+=target.getBoundingClientRect().top-100;else window.scrollBy(0,target.getBoundingClientRect().top-100);});
 await page.waitForTimeout(500);
 await page.screenshot({path:path.join(folder,'08-everyday-essays.jpg'),type:'jpeg',quality:95,animations:'disabled'});
 await section.locator('.chapter-life-story').first().getByRole('button',{name:lang==='zh'?'分享这一层':'Share this layer',exact:true}).click();
 const share=page.getByRole('dialog',{name:lang==='zh'?'分享这篇文章':'Share this essay'});await share.locator('.share-card-preview img').waitFor({state:'visible'});await page.waitForTimeout(400);
 await page.screenshot({path:path.join(folder,'09-share-an-essay.jpg'),type:'jpeg',quality:95,animations:'disabled'});
 await page.keyboard.press('Escape');
 await page.getByRole('button',{name:lang==='zh'?'打开更多功能':'Open more'}).click();await page.getByRole('button',{name:/生活里的道|Tao in everyday life/}).click();await page.waitForTimeout(300);
 await page.screenshot({path:path.join(folder,'10-essay-library.jpg'),type:'jpeg',quality:95,animations:'disabled'});
 console.log(device,lang,'3 screenshots captured');await context.close();
}
}finally{await browser.close();}
