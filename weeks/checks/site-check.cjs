/* 检查统一入口、跨周导航及记录隔离；课程运行不需要 Playwright。 */
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const assert=require('node:assert/strict');const os=require('node:os');const path=require('node:path');
const base=process.env.SITE_URL||'http://127.0.0.1:8003/';
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],failed=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)failed.push(r.url());});
 await page.goto(base);await page.waitForFunction(()=>document.querySelectorAll('#course-list .course-row').length===16);
 assert.equal(await page.locator('#planned-list .planned-row').count(),0);assert.equal(await page.locator('#planned-list a').count(),0);
 await page.screenshot({path:path.join(os.tmpdir(),'graphics-course-home.png'),fullPage:true});
 await page.getByRole('link',{name:'第 1 周：从场景到屏幕',exact:true}).click();await page.waitForFunction(()=>GraphicsLab.available);
 assert.equal(await page.locator('#course-select').inputValue(),'week-01/index.html');assert.match(await page.locator('#stages').textContent(),/顶点处理/);
 await page.fill('#reflection','第一周独立复盘');await page.locator('#course-navigation').getByRole('link',{name:'下一周：第 2 周',exact:true}).click();await page.waitForFunction(()=>GraphicsLab.available);
 assert.equal(await page.locator('#course-select').inputValue(),'week-02/index.html');assert.equal(await page.evaluate(()=>VectorDiagrams.dotData().dot),4);assert.equal(await page.inputValue('#reflection'),'');
 await page.fill('#reflection','第二周独立复盘');await page.selectOption('#course-select','week-01/index.html');await page.waitForFunction(()=>GraphicsLab.available);assert.equal(await page.inputValue('#reflection'),'第一周独立复盘');
 await page.locator('#course-navigation').getByRole('link',{name:'课程首页',exact:true}).click();await page.waitForFunction(()=>!!document.querySelector('#course-list'));
 await page.getByRole('link',{name:'第 2 周：向量与坐标系',exact:true}).click();await page.waitForFunction(()=>GraphicsLab.available);assert.equal(await page.inputValue('#reflection'),'第二周独立复盘');
 await page.screenshot({path:path.join(os.tmpdir(),'graphics-week-navigation.png')});
 for(const width of [320,390,768]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.locator('#course-navigation').getByRole('link',{name:'课程首页',exact:true}).click();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);if(width===390)await page.screenshot({path:path.join(os.tmpdir(),'graphics-home-mobile.png'),fullPage:true});await page.getByRole('link',{name:'第 2 周：向量与坐标系',exact:true}).click();await page.waitForFunction(()=>GraphicsLab.available);}
 const noJS=await browser.newPage({javaScriptEnabled:false});await noJS.goto(base);const entry=noJS.locator('#course-list a').first();assert.equal(await entry.getAttribute('href'),'week-01/index.html');await entry.click();assert.ok((await noJS.title()).includes('第 1 周'));assert.equal(await noJS.locator('#course-navigation a').first().getAttribute('href'),'../index.html');await noJS.close();
 if(process.env.PREFIX_SITE_URL){await page.goto(process.env.PREFIX_SITE_URL);await page.getByRole('link',{name:'第 1 周：从场景到屏幕',exact:true}).click();await page.waitForSelector('#course-select');assert.ok((await page.locator('.course-home-link').getAttribute('href')).startsWith(process.env.PREFIX_SITE_URL));await page.selectOption('#course-select','week-02/index.html');await page.waitForFunction(()=>GraphicsLab.available);assert.ok(page.url().startsWith(process.env.PREFIX_SITE_URL));}
 await page.goto('file://'+path.resolve(__dirname,'../index.html'));await page.getByRole('link',{name:'第 1 周：从场景到屏幕',exact:true}).click();await page.waitForSelector('#course-select');assert.equal(await page.locator('#course-select option').count(),16);
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);console.log('PASS: 统一首页/可用与计划中课程、两周导航/选择/直达、独立学习记录、320/390/768布局、无JS回退、URL前缀及file入口；HTTP错误0、页面异常0。');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
