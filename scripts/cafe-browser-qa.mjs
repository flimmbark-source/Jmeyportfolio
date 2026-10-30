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
  await page.waitForFunction(()=>document.querySelector('#cafe-canvas')?.classList.contains('is-ready'),null,{timeout:20000});
  assert(await page.locator('#cafe-canvas.is-ready').isVisible(),'Real 3D canvas is initialized');
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
 const glValid=await desktop.evaluate(()=>{const gl=document.querySelector('#cafe-canvas').getContext('webgl2')||document.querySelector('#cafe-canvas').getContext('webgl');return !!gl&&!gl.isContextLost();});
 assert(glValid,'WebGL context active on desktop');
 await screenshot(desktop,'01-desktop-scene');
 await desktop.getByRole('button',{name:'Open the portfolio Menu'}).click();
 await desktop.getByRole('heading',{name:/Selections/}).waitFor();
 assert(new URL(desktop.url()).searchParams.get('view')==='menu','Menu state reflected in URL');
 assert(await desktop.locator('body').evaluate(el=>el.classList.contains('is-dialog-open')),'Dialog-open state set');
 assert(await desktop.locator('.cafe-header').evaluate(el=>getComputedStyle(el).visibility==='hidden'),'Site header is hidden while the Menu is open');
 await screenshot(desktop,'02-desktop-menu');
 assert(await desktop.getByRole('button',{name:/Preview Get to the Café/}).isVisible(),'Featured project present');
 await desktop.getByRole('button',{name:/Preview Get to the Café/}).click();
 await desktop.locator('#cafe-preview-title').waitFor();
 assert(await desktop.locator('#cafe-preview').isVisible(),'Contextual project preview opens');
 assert(await desktop.getByRole('link',{name:/Play \/ open project/}).isVisible(),'Playable work is directly accessible from a short preview');
 assert(await desktop.getByRole('button',{name:'Read overview'}).count()===0,'Short game description does not create an empty long-form reading view');
 await screenshot(desktop,'03-desktop-preview');
 await desktop.getByRole('button',{name:'Go back'}).click();
 await desktop.getByRole('button',{name:'UX Work',exact:true}).click();
 await desktop.getByRole('button',{name:/Preview IDL: improving a SolidWorks workflow/}).click();
 await desktop.getByRole('button',{name:'Read overview'}).click();
 assert(await desktop.locator('#cafe-focus').isVisible(),'Substantive case study expands to focused reading');
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
 assert(await mobile.locator('.cafe-header').evaluate(el=>getComputedStyle(el).visibility==='hidden'),'Mobile header does not overlay the Menu');
 await screenshot(mobile,'08-mobile-menu');
 const menus=mobile.locator('#cafe-categories button');
 assert(await menus.count()>=5,'Category controls available on mobile');
 const visibleCategoryBoxes = await menus.evaluateAll(els=>els.map(el=>({left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right,bottom:el.getBoundingClientRect().bottom,visible:getComputedStyle(el).visibility==='visible'})));
 assert(visibleCategoryBoxes.every(b=>b.visible&&b.left>=0&&b.right<=390),'All five categories fit horizontally on mobile without hidden scrolling');
 await mobile.locator('[data-category="ux"]').click();
 assert(await mobile.locator('#cafe-category-title').innerText()==='UX Work','UX category works on mobile');
 await screenshot(mobile,'09-mobile-ux-menu');
 await mobile.getByRole('button',{name:/Preview IDL: improving a SolidWorks workflow/}).click();
 assert(await mobile.locator('#cafe-preview').isVisible(),'UX project preview opens on mobile');
 await screenshot(mobile,'10-mobile-preview');
 const previewHeight = await mobile.locator('#cafe-dialog').evaluate(el=>el.getBoundingClientRect().height);
 metrics.mobilePreviewHeight = previewHeight;
 assert(previewHeight<750,'Contextual preview is compact rather than a tall empty panel');
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
const small=await browser.newPage({viewport:{width:320,height:568},deviceScaleFactor:1,isMobile:true,hasTouch:true,reducedMotion:'reduce'});
try {
 await loadPage(small);
 await screenshot(small,'12-small-mobile-scene');
 await small.getByRole('button',{name:'Open the portfolio Menu'}).tap();
 assert(await small.locator('#cafe-book').isVisible(),'Narrow mobile Menu opens');
 await screenshot(small,'13-small-mobile-menu');
 const bounds=await small.locator('#cafe-categories button').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return{left:r.left,right:r.right}}));
 assert(bounds.every(r=>r.left>=0&&r.right<=320),'Category buttons remain inside a 320px mobile viewport');
} catch(err) {
 errors.push('small-mobile flow: '+err.message);
 await screenshot(small,'99-small-mobile-failure');
}
await browser.close();
const report={date:new Date().toISOString(),url,steps,findings,errors,metrics,passed:errors.length===0};
await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));
console.log('CAFÉ_BROWSER_QA '+JSON.stringify({passed:report.passed,steps,findings,errors,metrics}));
if(!report.passed)process.exitCode=1;
