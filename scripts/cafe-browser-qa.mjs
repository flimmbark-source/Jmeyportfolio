/**
 * Browser-based check of the café route. Runs against Astro preview, not a mock.
 * Usage: CAFE_BASE_URL=http://127.0.0.1:4321 node scripts/cafe-browser-qa.mjs
 */
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const url = process.env.CAFE_BASE_URL || 'http://127.0.0.1:4321';
const out = 'artifacts/cafe-qa';
await fs.mkdir(out,{recursive:true});
const browser = await chromium.launch({headless:true});
const errors=[], findings=[], metrics={}, steps=[];
const assert = (test,message) => {if(!test){findings.push('FAIL: '+message);throw new Error(message);}findings.push('PASS: '+message);};
async function screenshot(page,name){
  await page.screenshot({path:path.join(out,name+'.png'),animations:'disabled',fullPage:false});
  steps.push(name);
}
async function loadPage(page){
  page.on('pageerror',err=>errors.push(err.message));
  const response=await page.goto(url+'/cafe/',{waitUntil:'networkidle',timeout:60000});
  assert(response?.status()===200,'The /cafe route returns HTTP 200');
  assert(await page.locator('#cafe-world').isVisible(),'Café scene loads');
}
async function inspectObjects(page,key){
  const names=['menu','coffee','glasses'];
  const rects={};
  for(const name of names){
    const el=page.locator('[data-object="'+name+'"]');
    const box=await el.boundingBox();
    rects[name]=box;
    assert(Boolean(box && box.width>28 && box.height>28),'Visible '+name+' hit target at '+key+' viewport');
  }
  metrics[key] = {objects:rects,viewport:page.viewportSize()};
}
const desktop=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1,reducedMotion:'reduce'});
try {
 await loadPage(desktop);
 await inspectObjects(desktop,'desktop');
 await screenshot(desktop,'01-desktop-scene');
 await desktop.getByRole('button',{name:'Open the portfolio Menu'}).click();
 await desktop.getByRole('heading',{name:'The Menu'}).waitFor();
 assert(new URL(desktop.url()).searchParams.get('view')==='menu','Menu state reflected in URL');
 await screenshot(desktop,'02-desktop-menu');
 assert(await desktop.getByRole('button',{name:/Preview Get to the Café/}).isVisible(),'Featured project present');
 await desktop.getByRole('button',{name:/Preview Get to the Café/}).click();
 await desktop.locator('#cafe-preview-title').waitFor();
 assert(await desktop.locator('#cafe-preview').isVisible(),'Contextual project preview opens');
 await screenshot(desktop,'03-desktop-preview');
 await desktop.getByRole('button',{name:'Read overview'}).click();
 assert(await desktop.locator('#cafe-focus').isVisible(),'Expanded reading opens');
 await screenshot(desktop,'04-desktop-focused-reading');
 await desktop.keyboard.press('Escape');
 assert(await desktop.locator('#cafe-preview').isVisible(),'Escape returns from focused reading to preview');
 await desktop.getByRole('button',{name:'Go back'}).click();
 assert(await desktop.locator('#cafe-book').isVisible(),'Back returns to Menu');
 await desktop.getByRole('button',{name:'Research',exact:true}).last().click();
 assert(await desktop.locator('#cafe-category-title').innerText()==='Research','Research category loads');
 await screenshot(desktop,'05-desktop-research-menu');
 await desktop.getByRole('button',{name:'Go back'}).click();
 assert(await desktop.locator('#cafe-overlay').isHidden(),'Menu closes to café');
 const direct=desktop.getByRole('navigation',{name:'Direct portfolio navigation'});
 await direct.getByRole('button',{name:'Work'}).click();
 assert(await desktop.locator('#cafe-book').isVisible(),'Direct Work control opens Menu');
 await desktop.keyboard.press('Escape');
 assert(await desktop.locator('#cafe-overlay').isHidden(),'Escape closes Menu');
 // Coffee entry must retain the existing homepage route
 await desktop.getByRole('button',{name:/Enter the interactive Playground through the coffee/}).click();
 await desktop.waitForURL(u=>u.pathname==='/',{timeout:15000});
 assert(new URL(desktop.url()).pathname==='/', 'Coffee transitions to original Playground route');
 await screenshot(desktop,'06-desktop-playground');
} catch(err) {
 errors.push('desktop flow: '+err.message);
 await screenshot(desktop,'99-desktop-failure');
}

const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true,reducedMotion:'reduce'});
try{
 await loadPage(mobile);
 await inspectObjects(mobile,'mobile');
 await screenshot(mobile,'07-mobile-scene');
 await mobile.getByRole('button',{name:'Open the portfolio Menu'}).tap();
 assert(await mobile.locator('#cafe-book').isVisible(),'Tap opens Menu on mobile');
 await screenshot(mobile,'08-mobile-menu');
 const menus=mobile.locator('#cafe-categories button');
 assert(await menus.count()>=5,'Category controls available on mobile');
 await mobile.locator('[data-category="ux"]').click();
 assert(await mobile.locator('#cafe-category-title').innerText()==='UX Work','UX category works on mobile');
 await screenshot(mobile,'09-mobile-ux-menu');
 await mobile.getByRole('button',{name:/Preview IDL: improving a SolidWorks workflow/}).click();
 assert(await mobile.locator('#cafe-preview').isVisible(),'UX project preview opens on mobile');
 await screenshot(mobile,'10-mobile-preview');
 await mobile.getByRole('button',{name:'Read overview'}).click();
 assert(await mobile.locator('#cafe-focus').isVisible(),'Focused case study opens on mobile');
 await screenshot(mobile,'11-mobile-focused-reading');
 const m=await mobile.evaluate(()=>({docWidth:document.documentElement.scrollWidth,viewport:innerWidth}));
 metrics.mobileOverflow=m;
 assert(m.docWidth <= m.viewport+2,'No horizontal document overflow on mobile');
} catch(err){
 errors.push('mobile flow: '+err.message);
 await screenshot(mobile,'99-mobile-failure');
}
await browser.close();
const report={date:new Date().toISOString(),url,steps,findings,errors,metrics,passed:errors.length===0};
await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));
console.log('CAFÉ_BROWSER_QA '+JSON.stringify({passed:report.passed,steps,findings,errors,metrics}));
if(!report.passed)process.exitCode=1;
