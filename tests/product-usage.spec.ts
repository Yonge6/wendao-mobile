import {test,expect} from '@playwright/test';
test('consent controls the real UI transport and updated Buer link',async({page})=>{
 const events:any[]=[];
 await page.addInitScript(()=>Object.defineProperty(navigator,'webdriver',{get:()=>false}));
 await page.route('**/__usage/event',async route=>{events.push(route.request().postDataJSON());await route.fulfill({status:204});});
 await page.route('**/v1/events',route=>route.fulfill({json:{saved:true}}));
 await page.route('https://www.googletagmanager.com/**',route=>route.fulfill({body:''}));
 await page.goto('/?lang=zh');
 await page.getByRole('button',{name:'打开更多功能'}).click();
 await expect(page.getByRole('link',{name:/不二见己/})).toHaveAttribute('href','https://buer.wonderelian.com/');
 const toggle=page.getByRole('switch',{name:'分享匿名使用统计'});await expect(toggle).toHaveAttribute('aria-checked','false');
 await page.evaluate(()=>window.dispatchEvent(new CustomEvent('wendao:usage-ready',{detail:{production:true,surface:'h5',version:'test'}})));
 expect(events.length).toBe(0);await toggle.click();await expect.poll(()=>events.length).toBe(1);expect(events[0].event).toBe('visit');
 await page.evaluate(()=>window.dispatchEvent(new CustomEvent('wendao:usage',{detail:{event:'chat_error',error_code:'transport',question:'PRIVATE QUESTION'}})));
 await expect.poll(()=>events.length).toBe(2);expect(JSON.stringify(events)).not.toContain('PRIVATE');
 await toggle.click();await page.evaluate(()=>window.dispatchEvent(new CustomEvent('wendao:usage',{detail:{event:'chat_success'}})));expect(events.length).toBe(2);
 await page.reload();await page.getByRole('button',{name:'打开更多功能'}).click();await expect(toggle).toHaveAttribute('aria-checked','false');
});
