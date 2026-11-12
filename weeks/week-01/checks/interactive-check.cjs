/* 核心代码编辑与管线图解的行为检查；仅开发验证需要 Playwright。 */
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  try {
    const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(process.env.COURSE_URL||'http://127.0.0.1:8003/week-01/');await page.waitForFunction(()=>GraphicsLab.available&&GraphicsPipeline);
    const image=()=>page.evaluate(()=>GraphicsLab.capture());
    const original=await image(),defaultFragment=await page.inputValue('#shader-code');
    await page.fill('#shader-code',defaultFragment.replace('ambient = 0.22','ambient = 0.60'));
    assert.equal(await image(),original,'编辑未运行时应保留旧帧');
    await page.click('#apply-code');assert.match(await page.textContent('#code-status'),/编译成功/);assert.notEqual(await image(),original,'修改底光应改变实际渲染结果');
    const bright=await image();await page.fill('#shader-code','THIS IS NOT GLSL;');await page.click('#apply-code');assert.equal(await page.locator('#code-errors').isVisible(),true);assert.equal(await image(),bright,'编译失败应保留成功程序');assert.ok((await page.textContent('#fragment-source')).includes('THIS IS NOT GLSL'));
    await page.reload();await page.waitForFunction(()=>GraphicsLab.available);assert.equal(await page.inputValue('#shader-code'),'THIS IS NOT GLSL;');assert.equal(await image(),bright,'重新加载使用上次成功程序，保留无效草稿');
    await page.click('#reset-code');assert.equal(await image(),original);assert.equal(await page.inputValue('#shader-code'),defaultFragment);
    // 自定义常量颜色会让法线不再被使用，优化掉的 attribute 不能导致 WebGL 错误。
    const custom='gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);';await page.fill('#shader-code',custom);await page.click('#apply-code');assert.notEqual(await image(),original);assert.equal(await page.evaluate(()=>GraphicsLab.check()),0);
    // 基础任务使用默认代码生成对照，随后恢复自定义程序。
    await page.fill('#prediction','模型向右，其他输入不变。');await page.click('#run-trial');assert.equal(await page.evaluate(()=>GraphicsLab.getSnippets().fragment),custom);assert.notEqual(await page.locator('#before-image').getAttribute('src'),await page.locator('#after-image').getAttribute('src'));
    await page.selectOption('#code-kind','vertex');const vertex=await page.inputValue('#shader-code');await page.fill('#shader-code',vertex.replace('aPosition, 1.0','aPosition + vec3(0.5, 0.0, 0.0), 1.0'));const beforeVertex=await image();await page.locator('#shader-code').press('Control+Enter');assert.notEqual(await image(),beforeVertex);
    const downloadPromise=page.waitForEvent('download');await page.click('#download-code');assert.equal((await downloadPromise).suggestedFilename(),'week-01-vertex.glsl');
    await page.click('#reset-code');await page.click('#reset');await page.locator('#code-workbench').screenshot({path:path.join(__dirname,'code-workbench.png')});
    // 每段都有不同的计算图解，并与步骤选择保持一致。
    const diagrams=[];
    for(let i=0;i<6;i++){await page.locator('#stages button').nth(i).click();assert.equal(await page.evaluate(()=>GraphicsPipeline.state.stage),i);diagrams.push(await page.locator('#pipeline-output').evaluate(c=>c.toDataURL()));assert.ok((await page.textContent('#pipeline-note')).length>25);}
    assert.equal(new Set(diagrams).size,6);
    let details=await page.evaluate(()=>GraphicsPipeline.inspect());assert.equal(details.candidates.length,2,'默认采样点应在重叠区');assert.equal(details.winner.id,'a');
    await page.selectOption('#pipeline-order','ba');assert.equal((await page.evaluate(()=>GraphicsPipeline.inspect())).winner.id,'a','开启深度与提交顺序无关');
    await page.selectOption('#pipeline-order','ab');await page.uncheck('#pipeline-depth');assert.equal((await page.evaluate(()=>GraphicsPipeline.inspect())).winner.id,'b','关闭测试后 B 后画覆盖');
    await page.selectOption('#pipeline-order','ba');assert.equal((await page.evaluate(()=>GraphicsPipeline.inspect())).winner.id,'a');
    await page.selectOption('#sample-row','0');await page.selectOption('#sample-column','0');assert.equal((await page.evaluate(()=>GraphicsPipeline.inspect())).candidates.length,0);assert.match(await page.textContent('#pipeline-sample'),/保留背景/);
    await page.selectOption('#sample-row','5');await page.selectOption('#sample-column','5');await page.check('#pipeline-depth');
    assert.equal((await page.evaluate(()=>GraphicsPipeline.inspect())).meshes[0].polygon.length,4,'越界三角形经裁剪生成四边形');
    await page.locator('#triangle-shift').evaluate(el=>{el.value='0';el.dispatchEvent(new Event('input',{bubbles:true}));});assert.equal((await page.evaluate(()=>GraphicsPipeline.inspect())).meshes[0].polygon.length,3);
    await page.locator('#triangle-shift').evaluate(el=>{el.value='0.45';el.dispatchEvent(new Event('input',{bubbles:true}));});
    await page.locator('#pipeline-output').click({position:{x:50,y:50}});assert.ok((await page.evaluate(()=>GraphicsPipeline.state.row))!==5,'点击格子应切换追踪位置');
    await page.locator('#pipeline-visual').screenshot({path:path.join(__dirname,'pipeline-depth.png')});
    await page.locator('#stages button').nth(2).click();await page.locator('#pipeline-visual').screenshot({path:path.join(__dirname,'pipeline-clip.png')});await page.click('#stage-next');assert.equal(await page.evaluate(()=>GraphicsPipeline.state.stage),3);await page.click('#stage-prev');assert.equal(await page.evaluate(()=>GraphicsPipeline.state.stage),2);
    for(const width of [390,768]){await page.setViewportSize({width,height:1000});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.locator('#pipeline-visual').screenshot({path:path.join(__dirname,`pipeline-${width}.png`)});}
    assert.deepEqual(errors,[]);assert.equal(await page.evaluate(()=>GraphicsLab.check()),0);
    console.log('PASS: GLSL 编辑/编译/错误保帧/草稿与应用版本恢复/优化属性/顶点修改/下载/基础任务隔离；六阶段独立图解/真实裁剪/覆盖查询/深度与顺序/点击追踪/手机平板；页面异常 0。');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
