/* 共享课程运行时竞态回归。独立浏览器上下文，不修改日常学习记录。
 * 用真实 Worker、下载文件及可见 Canvas 验证，不以源码字符串代替行为。
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const root=process.env.SITE_URL||'http://127.0.0.1:8010/';
const url=new URL('week-03/',root).href;
const profileKey='graphics-learning-week-03-v1';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const failures=[];
 async function fresh(){const context=await browser.newContext({viewport:{width:1440,height:1000}});const page=await context.newPage();page.on('pageerror',e=>failures.push(e.message));await page.goto(url);await page.waitForFunction(()=>window.LessonRuntime?.ready&&!LessonRuntime.busy);return {context,page};}
 const results=[];
 async function check(name,fn){const {context,page}=await fresh();try{await fn(page);results.push(name);console.log('PASS:',name);}finally{await context.close();}}
 try{
  await check('重复运行忙时不保存旧 trial，完成后只保存新证据',async page=>{
   const code='const auditEnd=performance.now()+750;while(performance.now()<auditEnd){}\n'+await page.inputValue('#core-code');
   await page.fill('#core-code',code);await page.click('#apply-core');await page.waitForFunction(()=>!LessonRuntime.busy);
   await page.fill('#prediction','预测：同一矩阵输入产生同一几何；重跑仍需等待当前结果。');await page.fill('#explanation','按本次运行完成的证据保存。');
   await page.click('#run-experiment');await page.waitForFunction(()=>!LessonRuntime.busy);
   const busy=await page.evaluate(()=>{const start=Date.now();document.querySelector('#run-experiment').click();const status={start,busy:LessonRuntime.busy,disabled:document.querySelector('#save-experiment').disabled};document.querySelector('#save-experiment').click();status.records=JSON.parse(localStorage.getItem('graphics-learning-week-03-v1')).records.length;return status;});
   assert.equal(busy.busy,true);assert.equal(busy.disabled,true);assert.equal(busy.records,0);
   await page.waitForFunction(()=>!LessonRuntime.busy);await page.click('#save-experiment');
   const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).records,profileKey);
   assert.equal(saved.length,1);assert.ok(Date.parse(saved[0].date)>=busy.start);assert.equal(saved[0].code,code);assert.ok(saved[0].helpers.includes('const mul4='));assert.equal(typeof saved[0].inputSource,'string');
  });
  await check('执行代码 B 的记录与实际执行版本一致',async page=>{
   await page.fill('#prediction','预测：故意交换乘积后，TR中心应开始绕原点运动。');await page.fill('#explanation','记录执行版本，不能误写之前已应用的代码。');
   const result=await page.evaluate(async()=>{const before=LessonRuntime.getCode(),changed=Lesson.lab.code.replace('const TR = mul4(T, R);','const TR = mul4(R, T);');const ok=await LessonRuntime.run(changed,false,true);document.querySelector('#save-experiment').click();const record=JSON.parse(localStorage.getItem('graphics-learning-week-03-v1')).records.at(-1);return {ok,recordCode:record.code,changed,previous:before,applied:LessonRuntime.getCode(),center:LessonRuntime.getResult().centerTR,recordInput:record.inputSource,prelude:record.prelude,helpers:record.helpers};});
   assert.equal(result.ok,true);assert.notEqual(result.changed,result.previous);assert.equal(result.recordCode,result.changed);assert.equal(result.applied,result.previous);assert.ok(Math.abs(result.center[1])>.1);assert.match(result.recordInput,/"angle":40/);assert.equal(typeof result.prelude,'string');const replay=new Function(result.helpers+'\nfunction experiment(input){\n'+result.prelude+'\n'+result.recordCode+'\n}\nreturn experiment('+result.recordInput+');')();assert.deepEqual(replay.centerTR,result.center);
  });
  await check('取消的 run Promise 显式结束为 false',async page=>{
   const result=await page.evaluate(async()=>{const normal=Lesson.lab.code,slow='const end=performance.now()+1200;while(performance.now()<end){}\n'+normal;const old=LessonRuntime.run(slow,false,false);await new Promise(r=>setTimeout(r,40));const next=await LessonRuntime.run(normal,false,false);const previous=await Promise.race([old,new Promise(r=>setTimeout(()=>r('pending'),1700))]);return {previous,next};});
   assert.deepEqual(result,{previous:false,next:true});
  });
  await check('延迟旧 paint 不会覆盖最新可见帧',async page=>{
   const result=await page.evaluate(async()=>{const paint=Lesson.lab.paint,canvas=document.querySelector('#lesson-canvas');let entered;const painting=new Promise(resolve=>entered=resolve);Lesson.lab.paint=async(target,data,state)=>{if(state.angle===10)entered();await new Promise(r=>setTimeout(r,state.angle===10?750:5));paint(target,data,state);};LessonRuntime.state.angle=10;const old=LessonRuntime.run(Lesson.lab.code,false,false);await painting;LessonRuntime.state.angle=80;const next=await LessonRuntime.run(Lesson.lab.code,false,false),committed=canvas.toDataURL();await new Promise(r=>setTimeout(r,900));return {old:await old,next,angle:LessonRuntime.getRenderedState().angle,unchanged:committed===canvas.toDataURL()};});
   assert.deepEqual(result,{old:false,next:true,angle:80,unchanged:true});
  });
  await check('绘制与验证失败均不提交损坏图像或成功代码',async page=>{
   const result=await page.evaluate(async()=>{const canvas=document.querySelector('#lesson-canvas'),image=canvas.toDataURL(),code=LessonRuntime.getCode(),state=JSON.stringify(LessonRuntime.getRenderedState()),paint=Lesson.lab.paint,verify=Lesson.lab.verify;Lesson.lab.paint=target=>{target.width=900;target.height=560;const c=target.getContext('2d');c.fillStyle='#ff00ff';c.fillRect(0,0,900,560);throw Error('audit paint failure');};const painted=await LessonRuntime.run(Lesson.lab.code+'\n// new version',true);const paintPreserved=image===canvas.toDataURL()&&code===LessonRuntime.getCode();Lesson.lab.paint=paint;Lesson.lab.verify=()=>{throw Error('audit verification failure');};LessonRuntime.state.angle=100;const verified=await LessonRuntime.run(Lesson.lab.code,true);return {painted,paintPreserved,verified,verifyPreserved:image===canvas.toDataURL()&&state===JSON.stringify(LessonRuntime.getRenderedState()),error:document.querySelector('#run-error').textContent};});
   assert.equal(result.painted,false);assert.equal(result.paintPreserved,true);assert.equal(result.verified,false);assert.equal(result.verifyPreserved,true);assert.match(result.error,/audit verification failure/);
  });
  await check('Worker 错误/超时保帧，主页面持续响应',async page=>{
   const result=await page.evaluate(async()=>{const canvas=document.querySelector('#lesson-canvas'),image=canvas.toDataURL(),code=LessonRuntime.getCode();const syntax=await LessonRuntime.run('const = broken;',true),runtime=await LessonRuntime.run('throw Error("audit runtime failure")',true);Lesson.lab.timeoutMs=500;let heartbeats=0;const interval=setInterval(()=>heartbeats++,25);const timedout=await LessonRuntime.run('while(true){}',true);clearInterval(interval);return {syntax,runtime,timedout,heartbeats,preserved:image===canvas.toDataURL()&&code===LessonRuntime.getCode(),error:document.querySelector('#run-error').textContent,busy:LessonRuntime.busy};});
   assert.equal(result.syntax,false);assert.equal(result.runtime,false);assert.equal(result.timedout,false);assert.ok(result.heartbeats>=2,'主页面计时器应在 Worker 忙循环时继续运行');assert.equal(result.preserved,true);assert.equal(result.busy,false);assert.match(result.error,/超时/);
   const card=page.locator('.quiz-item').first();await card.locator('input').nth(1).check();await card.locator('button').click();assert.match(await card.locator('.feedback').textContent(),/回答正确/);
  });
  await check('下载 JS 保留实际输入 Infinity/NaN/typed arrays 且可运行',async page=>{
   await page.evaluate(()=>{Lesson.lab.input=state=>({...state,infinity:Infinity,negative:-Infinity,notANumber:NaN,typed:new Float64Array([Infinity,NaN,-0,4])});});
   const guard='if(input.infinity!==Infinity || input.negative!==-Infinity || !Number.isNaN(input.notANumber) || !(input.typed instanceof Float64Array) || input.typed[0]!==Infinity || !Number.isNaN(input.typed[1]) || !Object.is(input.typed[2],-0)) throw Error("input serialization changed");\n';
   await page.fill('#core-code',guard+await page.inputValue('#core-code'));const pending=page.waitForEvent('download');await page.click('#download-core');const download=await pending,tmp=fs.mkdtempSync(path.join(os.tmpdir(),'graphics-runtime-export-')),file=path.join(tmp,'core.js');
   try{await download.saveAs(file);const source=fs.readFileSync(file,'utf8');assert.match(source,/new Float64Array\(/);assert.match(source,/"infinity":Infinity/);const execution=spawnSync(process.execPath,[file],{encoding:'utf8',timeout:10000});assert.equal(execution.status,0,execution.stderr);assert.match(execution.stdout,/centerTR/);}finally{fs.rmSync(tmp,{recursive:true,force:true});}
  });
  assert.deepEqual(failures,[]);console.log(`PASS: ${results.length} 组运行时回归；页面异常 0。`);
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
