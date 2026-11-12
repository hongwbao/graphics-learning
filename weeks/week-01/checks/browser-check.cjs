/* 仅开发验证需要 Playwright；网站运行不需要。PLAYWRIGHT_PATH 可指向现有安装。 */
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
(async()=>{
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(process.env.COURSE_URL||'http://127.0.0.1:8003/week-01/');await page.waitForFunction(()=>window.GraphicsLab?.available);
assert.equal(await page.evaluate(()=>GraphicsLab.check()),0);
await page.screenshot({path:path.join(__dirname,'desktop.png'),fullPage:true});
async function image(){return page.evaluate(()=>GraphicsLab.capture());}
async function range(id,value){await page.locator('#'+id).evaluate((el,v)=>{el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));},String(value));}
const initial=await image();await range('model-x',1);assert.notEqual(await image(),initial,'模型平移应改变图像');await page.click('#reset');assert.equal(await image(),initial);
await range('camera-x',1);assert.notEqual(await image(),initial,'相机平移应改变图像');await page.click('#reset');
await range('rotation',75);assert.notEqual(await image(),initial,'旋转应改变图像');await page.click('#reset');
await range('distance',9);assert.notEqual(await image(),initial,'距离应改变图像');await page.click('#reset');
await range('light',-80);assert.notEqual(await image(),initial,'光照应改变图像');await page.click('#reset');
await page.selectOption('#shading','solid');const solid=await image();await range('light',-80);assert.equal(await image(),solid,'固定色应不受光照影响');await page.selectOption('#shading','normals');assert.notEqual(await image(),solid);await page.selectOption('#shading','wire');assert.notEqual(await image(),solid);await page.click('#reset');
await page.click('#order');assert.equal(await image(),initial,'开启深度时绘制顺序不应改变不透明表面结果');await page.click('#order');await page.uncheck('#depth');const depthOff=await image();await page.click('#order');assert.notEqual(await image(),depthOff,'关闭深度时交换顺序应改变图像');await page.click('#reset');
for(let i=0;i<6;i++){await page.locator('#stages button').nth(i).click();assert.equal(await page.locator('#stages button[aria-pressed=true]').count(),1);assert.ok((await page.locator('#stage-detail').textContent()).length>100);}
assert.equal(await page.locator('#quiz-list .feedback:visible').count(),0,'未答前不显示解析');
await page.click('#run-trial');assert.match(await page.locator('#trial-status').textContent(),/先写/);
for(const kind of ['model','camera','color']){await page.selectOption('#trial',kind);await page.fill('#prediction','预测：只改变指定变量，观察位置或颜色。');await page.click('#run-trial');assert.equal(await page.locator('#before-image').isVisible(),true);assert.notEqual(await page.locator('#before-image').getAttribute('src'),await page.locator('#after-image').getAttribute('src'));await page.click('#save-trial');assert.match(await page.locator('#trial-status').textContent(),/先写自己的解释/);await page.fill('#explanation','相对坐标决定位置，片段颜色决定外观。');await page.click('#save-trial');assert.match(await page.locator('#trial-feedback').textContent(),/参考解释/);}
assert.match(await page.locator('#saved-trials').textContent(),/3 \/ 3/);
for(let i=0;i<6;i++){const card=page.locator('.quiz-item').nth(i);await card.locator('button').click();assert.match(await card.locator('.feedback').textContent(),/先选择/);await card.locator('input').nth([1,1,1,0,0,1][i]).check();await card.locator('button').click();assert.match(await card.locator('.feedback').textContent(),/回答正确/);}
assert.match(await page.locator('#quiz-score').textContent(),/答对 6 题/);
await page.fill('#reflection','我能解释两个着色器，仍需学习向量。');await page.reload();await page.waitForFunction(()=>GraphicsLab.available);assert.equal(await page.inputValue('#reflection'),'我能解释两个着色器，仍需学习向量。');assert.match(await page.locator('#saved-trials').textContent(),/3 \/ 3/);assert.match(await page.locator('#quiz-score').textContent(),/答对 6 题/);
const mdPromise=page.waitForEvent('download');await page.click('#export');const md=await mdPromise;await md.saveAs(path.join(__dirname,'sample-record.md'));const fs=require('node:fs');assert.match(fs.readFileSync(path.join(__dirname,'sample-record.md'),'utf8'),/cameraX/);
const pngPromise=page.waitForEvent('download');await page.click('#snapshot');const png=await pngPromise;assert.equal(png.suggestedFilename(),'week-01-scene.png');
await page.setViewportSize({width:390,height:844});await page.goto(process.env.COURSE_URL||'http://127.0.0.1:8003/week-01/');await page.waitForFunction(()=>GraphicsLab.available);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'手机不应出现横向页面溢出');await page.screenshot({path:path.join(__dirname,'mobile.png'),fullPage:true});await range('model-x',1.2);assert.match(await page.locator('#scene-readout').textContent(),/1.2/);
await page.setViewportSize({width:768,height:1024});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
const noGL=await browser.newPage();await noGL.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...rest){return type==='webgl'?null:original.call(this,type,...rest);};});await noGL.goto(process.env.COURSE_URL||'http://127.0.0.1:8003/week-01/');assert.equal(await noGL.locator('#webgl-error').isVisible(),true);assert.equal(await noGL.locator('#run-trial').isDisabled(),true);assert.equal(await noGL.locator('.quiz-item').count(),6);await noGL.close();
assert.deepEqual(errors,[]);await browser.close();console.log('PASS: WebGL、9 类场景参数/显示控制、深度顺序、6 段管线、3 轮任务、6 题测验、持久化、PNG/Markdown 下载、390/768px 布局、无 WebGL 降级；页面异常 0。');
})().catch(e=>{console.error(e);process.exit(1)});
