'use strict';
(() => {
const $=s=>document.querySelector(s), lab=window.GraphicsLab;
const storageKey='graphics-learning-week-01-v1';
let saved={drafts:{},records:[],quiz:{},reflection:''},storageOK=true;
try{const value=JSON.parse(localStorage.getItem(storageKey)||'null');if(value&&typeof value==='object'){saved={...saved,...value};if(!Array.isArray(saved.records))saved.records=[];if(!saved.drafts||typeof saved.drafts!=='object')saved.drafts={};if(!saved.quiz||typeof saved.quiz!=='object')saved.quiz={};}}catch{storageOK=false;}
function persist(){try{localStorage.setItem(storageKey,JSON.stringify(saved));storageOK=true;}catch{storageOK=false;}$('#storage-status').textContent=storageOK?'已自动保存 · 建议导出留存':'浏览器存储不可用，记录仅在本页内；请导出后再关闭';}
if(!storageOK)$('#storage-status').textContent='无法读取浏览器存储；请导出学习记录留存';
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
const mapping={'model-x':['modelX',false],'rotation':['rotation',true],'camera-x':['cameraX',false],'distance':['distance',false],'light':['light',true]};
function syncControls(){if(!lab?.available)return;for(const [id,[key,degrees]] of Object.entries(mapping)){$('#'+id).value=lab.state[key];$('#'+id+'-value').value=degrees?lab.state[key]+'°':lab.state[key].toFixed(1);}$('#color').value=lab.state.color;$('#shading').value=lab.state.shading;$('#depth').checked=lab.state.depth;$('#order-status').textContent='当前：'+(lab.state.reversed?'后方参照物 → 主模型':'主模型 → 后方参照物');}
function observe(){if(!lab?.available)return;let text;if(!lab.state.depth)text='深度测试关闭：候选片段可能按绘制顺序覆盖。交换绘制顺序，查看重叠区域；同一立方体的前后表面也会受影响。';else if(lab.state.shading==='solid')text='固定颜色绕过光照计算。此时调整光线来向，不应改变主模型颜色；轮廓仍由几何与相机决定。';else if(lab.state.shading==='wire')text='线框显示三角形连接关系：一个四边形面由两个三角形构成。额外边线并不是新增的几何表面。';else if(lab.state.shading==='normals')text='颜色编码世界空间法线方向。旋转模型改变法线与颜色；改变基础色不影响该调试显示。';else text='位置由模型与相机共同决定，亮暗由法线和光源来向决定。试着保持模型不动，只移动光线。';$('#observation').textContent=text;}
if(lab?.available){for(const [id,[key]] of Object.entries(mapping))$('#'+id).addEventListener('input',e=>{lab.state[key]=Number(e.target.value);syncControls();lab.render();observe();});for(const id of ['color','shading','depth'])$('#'+id).addEventListener(id==='color'?'input':'change',e=>{lab.state[id]=id==='depth'?e.target.checked:e.target.value;syncControls();lab.render();observe();});$('#reset').addEventListener('click',()=>{lab.reset();syncControls();observe();});$('#order').addEventListener('click',()=>{lab.state.reversed=!lab.state.reversed;syncControls();lab.render();observe();});$('#snapshot').addEventListener('click',()=>{lab.render();$('#scene').toBlob(blob=>{if(blob)download(blob,'week-01-scene.png');else $('#render-state').textContent='截图失败，请重试';});});syncControls();}else{document.querySelectorAll('.controls input,.controls button,.controls select,#snapshot,#run-trial').forEach(el=>el.disabled=true);$('#trial-status').textContent='三维实验暂不可用。请按观察室的提示恢复 WebGL；其他学习功能仍可用。';}
// 核心代码编辑器：草稿与成功运行的版本分别保存，失败编译不替换旧程序。
const shaderKinds=['vertex','fragment'];
let codeKind='fragment';
const fallback={vertex:'gl_Position = uProjection * uView * uModel\n            * vec4(aPosition, 1.0);\nvNormal = mat3(uModel) * aNormal;',fragment:'vec3 n = normalize(vNormal);\nvec3 l = normalize(uLightDirection);\nfloat ambient = 0.22;\nfloat diffuse = 0.78;\nfloat brightness = ambient\n  + diffuse * max(dot(n, l), 0.0);\ngl_FragColor = vec4(uColor * brightness, 1.0);'};
const shaderDrafts={...(lab?.defaultSnippets||fallback)};
if(saved.shaderDrafts)for(const kind of shaderKinds)if(typeof saved.shaderDrafts[kind]==='string')shaderDrafts[kind]=saved.shaderDrafts[kind];
function showShaderSources(sources){for(const kind of shaderKinds)$('#'+kind+'-source').textContent=sources[kind].split('\n').map((line,i)=>String(i+1).padStart(2,' ')+'  '+line).join('\n');}
function shaderContext(){
  $('#code-context').textContent=codeKind==='fragment'?'可用输入：vNormal、uColor、uLightDirection；请写出 gl_FragColor。外围已提供精度与声明，自定义分支在“简化光照”模式运行。':'可用输入：aPosition、aNormal、uModel、uView、uProjection；需写出 gl_Position 与 vNormal。修改会同时作用于两个立方体和地面。';
}
function readShaderDraft(){shaderDrafts[codeKind]=$('#shader-code').value;saved.shaderDrafts={...shaderDrafts};persist();}
function runShader(){
  if(!lab?.available)return;
  readShaderDraft();
  const result=lab.applySnippets(shaderDrafts);
  showShaderSources(result.sources);
  $('#code-errors').hidden=result.ok;
  if(!result.ok){$('#code-errors').textContent=result.log;$('#code-status').textContent='编译未通过，保留上次成功的程序与画面。行号对应下方完整着色器；修正后可再次运行。';return;}
  saved.shaderApplied=lab.getSnippets();persist();
  lab.state.shading='lit';syncControls();lab.render();observe();
  $('#code-status').textContent='编译成功，已应用两个函数体并切换到简化光照。画面已更新，参数保持不变。';
}
$('#shader-code').value=shaderDrafts[codeKind];shaderContext();
$('#code-kind').addEventListener('change',()=>{readShaderDraft();codeKind=$('#code-kind').value;$('#shader-code').value=shaderDrafts[codeKind];shaderContext();});
$('#shader-code').addEventListener('input',()=>{readShaderDraft();$('#code-status').textContent='草稿已保存，尚未运行；画面仍使用上次成功的代码。';});
$('#shader-code').addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();runShader();}});
$('#apply-code').addEventListener('click',runShader);
$('#reset-code').addEventListener('click',()=>{if(!lab?.available)return;Object.assign(shaderDrafts,lab.defaultSnippets);$('#shader-code').value=shaderDrafts[codeKind];runShader();$('#code-status').textContent='已恢复并运行默认顶点/片段代码。场景参数保持不变。';});
$('#download-code').addEventListener('click',()=>{if(!lab?.available)return;readShaderDraft();download(new Blob([lab.sourcesFor(shaderDrafts)[codeKind]],{type:'text/plain;charset=utf-8'}),'week-01-'+codeKind+'.glsl');});
if(lab?.available){
  let restored=false;
  if(saved.shaderApplied&&shaderKinds.every(kind=>typeof saved.shaderApplied[kind]==='string')){const result=lab.applySnippets(saved.shaderApplied);restored=result.ok;if(!result.ok)$('#code-status').textContent='上次代码无法在此环境编译，当前保留课程默认程序。草稿仍可编辑。';}
  showShaderSources(lab.sourcesFor(shaderDrafts));lab.render();
  if(restored)$('#code-status').textContent='已恢复上次成功运行的代码。编辑区草稿若有不同，需要再次编译才会生效。';
}else{
  for(const id of ['apply-code','reset-code','download-code'])$('#'+id).disabled=true;
  $('#code-status').textContent='WebGL 不可用，核心代码仍可阅读与编辑；恢复 WebGL 后可编译运行。';
}
const stages=[
['CPU 准备','数据与调用','从场景描述到一次绘制请求','CPU 创建顶点与法线缓冲，编译连接着色器，每次改变参数时上传 uniform（统一参数），然后提交绘制调用。一次 drawArrays 会触发后续整条管线；它不是把 CPU 渲染好的图片交给 GPU。','输入：模型、相机、光照参数。输出：GPU 可读取的数据与命令。',`gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);\ngl.uniformMatrix4fv(uModel, false, modelMatrix);\ngl.drawArrays(gl.TRIANGLES, 0, 36);`],
['顶点处理','位置与属性','每条顶点记录，换一个观察角度','顶点着色器读取位置和法线。M、V、P 把局部位置变成四维裁剪坐标；法线等属性送往后续阶段。它不逐像素填色。本例不做几何细分。','输入：一条顶点记录及 uniform。输出：gl_Position 和待插值属性。',`gl_Position = uProjection * uView\n            * uModel * vec4(aPosition, 1.0);\nvNormal = mat3(uModel) * aNormal;`],
['裁剪与除法','可见范围','留下视野内的几何，映射到窗口','GPU 根据裁剪空间条件截掉视锥外的部分，再用 w 做透视除法，并通过视口映射到窗口。边界上的三角形可能被截成新的形状，不是只检查原顶点是否在屏幕内。','输入：裁剪空间几何。输出：落在可见范围并映射到窗口的几何。',`// 固定功能阶段：不是你手写的着色器\n// 裁剪 → 除以 w → 视口映射\ngl.viewport(0, 0, width, height);`],
['光栅化','覆盖与插值','三角形覆盖了哪些采样位置？','GPU 找出三角形覆盖的采样位置，产生候选片段，并插值顶点属性。一片三角形通常产生很多片段；一个像素也可能遇到多个不同表面的片段。这里先不展开覆盖规则。','输入：窗口中的三角形和顶点属性。输出：候选片段与插值后的属性。',`// 固定功能：覆盖判定和属性插值\n// 顶点输出 varying vNormal\n// 成为片段着色器的插值输入`],
['片段处理','候选颜色','给每个候选片段算一个颜色','本实验的片段着色器把基础色乘以亮度。切到固定色模式会绕开光照，但不改变顶点位置。片段着色器输出的颜色仍不是最终屏幕颜色。','输入：插值属性、材质和光源参数。输出：候选颜色。',`float brightness = 0.22 + 0.78\n  * max(dot(n, normalize(uLightDirection)), 0.0);\ngl_FragColor = vec4(uColor * brightness, 1.0);`],
['深度与输出','比较与写入','只有通过测试，才能留下来','本例开启 LESS 深度比较并清除每帧深度缓冲。对于重叠的不透明表面，较近的候选片段保留，较远的被拒绝。实际 GPU 可能提前拒绝不可见片段，教学顺序不等同于硬件时序。','输入：候选片段的深度与颜色。输出：更新的颜色/深度缓冲，浏览器呈现图像。',`gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);\ngl.enable(gl.DEPTH_TEST);\ngl.depthFunc(gl.LESS);`]
];
const stageButtons=stages.map((stage,i)=>{const b=document.createElement('button');b.type='button';b.innerHTML=`<span>${i+1} / ${stage[1]}</span>${stage[0]}`;b.setAttribute('aria-pressed','false');b.addEventListener('click',()=>selectStage(i));$('#stages').append(b);return b;});
function selectStage(index){window.GraphicsPipeline?.setStage(index);stageButtons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));const d=$('#stage-detail');d.replaceChildren();for(const [tag,text] of [['h3',stages[index][2]],['p',stages[index][3]],['p',stages[index][4]],['pre',stages[index][5]]]){const el=document.createElement(tag);el.textContent=text;d.append(el);}}selectStage(0);
$('#stage-prev').addEventListener('click',()=>selectStage(window.GraphicsPipeline.state.stage-1));
$('#stage-next').addEventListener('click',()=>selectStage(window.GraphicsPipeline.state.stage+1));
const trialTexts={model:'模型向世界 +X 平移，青色轮廓向右，红色参照物不变。改变的是 M；遮挡区域也可能变化。',camera:'相机和观察目标一起向 +X 平移，朝向不变，两个物体都向屏幕左侧移动。改变的是 V；世界坐标没有跟着变化。',color:'固定色模式绕过光照，只改变主模型片段颜色；主模型的轮廓、覆盖位置与红色参照物应保持不变。'};
let activeTrial=null,currentTrial='model';
function saveDraft(){saved.drafts[currentTrial]={prediction:$('#prediction').value,explanation:$('#explanation').value};persist();}
function loadDraft(){const draft=saved.drafts[currentTrial]||{};$('#prediction').value=draft.prediction||'';$('#explanation').value=draft.explanation||'';activeTrial=null;$('#before-image').hidden=true;$('#after-image').hidden=true;$('#trial-feedback').hidden=true;$('#trial-params').textContent='执行后，这里会并排显示本轮场景。';$('#trial-status').textContent='先写预测，再执行。每轮会重置观察室到固定基线。';}
$('#trial').addEventListener('change',()=>{saveDraft();currentTrial=$('#trial').value;loadDraft();});
for(const id of ['prediction','explanation'])$('#'+id).addEventListener('input',()=>{if(id==='prediction'&&activeTrial){activeTrial=null;$('#trial-status').textContent='预测已修改，请重新执行以绑定这份预测。';}saveDraft();});
function countTrials(){const count=new Set(saved.records.map(r=>r.kind)).size;$('#saved-trials').textContent=`已记录 ${count} / 3 类实验（共 ${saved.records.length} 轮）`;}countTrials();loadDraft();
$('#run-trial').addEventListener('click',()=>{if(!lab?.available){$('#trial-status').textContent='WebGL 当前不可用，请刷新后重试。';return;}if(!$('#prediction').value.trim()){$('#trial-status').textContent='请先写下你对方向、轮廓或颜色的预测与理由。';$('#prediction').focus();return;}const customCode=lab.getSnippets();lab.applySnippets(lab.defaultSnippets);lab.reset();if(currentTrial==='color')lab.state.shading='solid';const before={...lab.state};$('#before-image').src=lab.capture();$('#before-image').hidden=false;if(currentTrial==='model')lab.state.modelX=1.2;else if(currentTrial==='camera')lab.state.cameraX=1.2;else lab.state.color='#bb614d';const after={...lab.state};$('#after-image').src=lab.capture();$('#after-image').hidden=false;lab.applySnippets(customCode);lab.render();syncControls();observe();activeTrial={kind:currentTrial,prediction:$('#prediction').value,before,after,shader:{...lab.defaultSnippets},codeOffset:lab.offset,date:new Date().toISOString()};$('#trial-params').textContent=`唯一变化：${currentTrial==='model'?'modelX: 0 → 1.2':currentTrial==='camera'?'cameraX: 0 → 1.2':'color: #52b6a0 → #bb614d'}；代码偏移 ${lab.offset}。`;$('#trial-status').textContent='实验已执行；请对照两张图，写下自己的解释。';$('#trial-feedback').hidden=true;});
$('#save-trial').addEventListener('click',()=>{if(!activeTrial){$('#trial-status').textContent='请先写预测并执行本轮实验，再保存解释。';return;}if(!$('#explanation').value.trim()){$('#trial-status').textContent='请先写自己的解释，再查看参考。';$('#explanation').focus();return;}saved.records.push({...activeTrial,explanation:$('#explanation').value});activeTrial=null;saveDraft();countTrials();$('#trial-feedback').hidden=false;$('#trial-feedback').textContent='参考解释：'+trialTexts[currentTrial];$('#trial-status').textContent='本轮已记录。可以选择下一项，或修改预测重新实验。';});
const questions=[
{q:'模型的轮廓和位置正确，但想把它改成红色，应优先改什么？',a:['改变观察矩阵 V','改变片段着色器使用的基础色','改变投影的近裁剪面'],correct:1,why:'颜色属于着色计算。固定色模式下，修改 uColor 改变颜色而不改变几何覆盖；相机和投影可能改变位置或可见性。'},
{q:'片段着色器给一个候选片段算出了绿色，它一定会出现在屏幕上吗？',a:['一定，它已经有颜色了','不一定，它可能未通过深度测试','只要是最后画的就一定出现'],correct:1,why:'候选片段不等于最终像素。深度测试可拒绝被遮挡的片段；最终还可能受其他测试或混合影响，本例只关注深度。'},
{q:'保持物体不动，相机连同观察目标向世界 +X 平移，物体在图像中怎样移动？',a:['向右，因为相机向右','向左，因为相对相机的 X 减小','不动，因为模型矩阵没变'],correct:1,why:'本实验朝向保持固定，x_view = x_world − camera_x。相机向右，世界中的物体相对相机向左。若同时旋转相机重新对准物体，结论不能直接套用。'},
{q:'不透明近物体被远物体盖住，交换绘制顺序后结果改变，先验证什么？',a:['深度测试是否开启并正确清除缓冲','顶点数量一定不够','换更亮的材质'],correct:0,why:'顺序相关是深度状态异常的一条线索。先启用深度、核对比较函数并清除缓冲，再比较顺序。不是凭一个现象就断言唯一原因。'},
{q:'下面哪一条最接近本周的图像生成数据流？',a:['CPU 参数 → 顶点处理 → 裁剪/透视除法 → 光栅化 → 片段处理 → 深度与输出','CPU 参数 → 片段处理 → 三维重建 → 顶点处理 → 输出','顶点处理 → 输出，三角形由片段着色器直接填满'],correct:0,why:'顶点处理给出裁剪位置，裁剪与映射之后由光栅化产生候选片段，片段处理给出颜色，再经过测试与写入。硬件可优化部分测试的执行时机。'},
{q:'已重建出正确网格，重投影图像仍与照片不同，合理的下一步是？',a:['断言网格错误，立刻重建','分别核对相机、光照、材质与可见性，用单变量实验验证','认为渲染应该自动恢复照片'],correct:1,why:'渲染是从场景与成像规则生成图像。相机、几何、材质和照明都可能影响误差，正确网格也不保证恢复原照片。'}
];
function updateScore(){const entries=Object.entries(saved.quiz).filter(([i,a])=>questions[i]&&Number.isInteger(a)&&questions[i].a[a]);const right=entries.filter(([i,a])=>questions[i].correct===a).length;$('#quiz-score').textContent=entries.length?`已提交 ${entries.length} / ${questions.length} 题 · 当前答对 ${right} 题。请关注能否解释理由。`:'尚未提交答案。';}
questions.forEach((item,i)=>{const article=document.createElement('article');article.className='quiz-item';const fs=document.createElement('fieldset'),legend=document.createElement('legend');legend.textContent=`${i+1}. ${item.q}`;fs.append(legend);item.a.forEach((text,j)=>{const label=document.createElement('label'),input=document.createElement('input');input.type='radio';input.name='q'+i;input.value=j;input.checked=saved.quiz[i]===j;label.append(input,document.createTextNode(text));fs.append(label);});const button=document.createElement('button');button.type='button';button.className='button secondary';button.textContent='提交并查看解析';const feedback=document.createElement('p');feedback.className='feedback';feedback.setAttribute('role','status');feedback.hidden=true;function show(answer){feedback.hidden=false;feedback.textContent=(answer===item.correct?'回答正确。':'再想一想。')+item.why;}button.addEventListener('click',()=>{const answer=fs.querySelector('input:checked');if(!answer){feedback.hidden=false;feedback.textContent='先选择一个答案，再提交。';return;}saved.quiz[i]=Number(answer.value);show(saved.quiz[i]);persist();updateScore();});fs.addEventListener('change',()=>{feedback.hidden=true;});article.append(fs,button,feedback);$('#quiz-list').append(article);if(Number.isInteger(saved.quiz[i])&&item.a[saved.quiz[i]])show(saved.quiz[i]);});updateScore();
$('#reflection').value=typeof saved.reflection==='string'?saved.reflection:'';$('#reflection').addEventListener('input',()=>{saved.reflection=$('#reflection').value;persist();});
$('#export').addEventListener('click',()=>{saveDraft();const lines=['# 第 1 周：从场景到屏幕','',`- 导出时间：${new Date().toLocaleString('zh-CN')}`,'- 材料与代码：weeks/week-01/index.html、renderer.js、app.js','- 环境：'+navigator.userAgent,'- 学习目标：认出场景组成，画出绘制流程，解释两个着色器并提出排错实验。',''];for(const [i,r] of saved.records.entries())lines.push(`## 实验 ${i+1}：${r.kind}`,'',`- 时间：${r.date}`,`- 核心问题与预测：${r.prediction}`,`- 改变前：${JSON.stringify(r.before)}`,`- 改变后：${JSON.stringify(r.after)}`,`- 代码额外 X 偏移：${r.codeOffset}`,`- 着色器：${r.shader?'课程默认（独立于观察室自定义代码）':'初始课程版本'}`,`- 我的解释：${r.explanation}`,'- 截图：实验对照在网页中生成；需要长期保留时请在观察室另存 PNG。','');lines.push('## 当前核心代码草稿','');for(const kind of shaderKinds)lines.push('### '+kind,'```glsl',shaderDrafts[kind],'```','');lines.push('## 最近成功运行的代码','');for(const kind of shaderKinds)lines.push('### '+kind,'```glsl',lab?.available?lab.getSnippets()[kind]:(saved.shaderApplied?.[kind]||fallback[kind]),'```','');lines.push('## 尚未提交的草稿','');for(const [kind,draft] of Object.entries(saved.drafts))lines.push(`### ${kind}`,`预测：${draft.prediction||'未填写'}`,`解释：${draft.explanation||'未填写'}`,'');lines.push('## 理解检查','');questions.forEach((q,i)=>lines.push(`${i+1}. ${q.q}`,`我的答案：${q.a[saved.quiz[i]]||'未作答'}；${saved.quiz[i]===undefined?'未提交':saved.quiz[i]===q.correct?'正确':'需要复习'}`,''));lines.push('## 复盘：我的理解、疑问、AI 协助与核验','',saved.reflection||'待填写','', '## 下一步','向量与坐标系；若管线职责仍混淆，复做模型与颜色实验。');download(new Blob([lines.join('\n')],{type:'text/markdown;charset=utf-8'}),'week-01-learning-record.md');});
const links=[...document.querySelectorAll('nav a')];
const observer=new IntersectionObserver(entries=>{const visible=entries.filter(e=>e.isIntersecting);if(visible.length)links.forEach(a=>a.classList.toggle('active',a.hash==='#'+visible[0].target.id));},{rootMargin:'-10% 0px -60% 0px'});document.querySelectorAll('section[id]').forEach(s=>observer.observe(s));
})();
