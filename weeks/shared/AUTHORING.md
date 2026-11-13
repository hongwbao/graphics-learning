# 第 3–16 周并行实现约定

保留现有课程视觉，课程代码在各自 week-XX/ 下；共享文件、首页、courses.js 由主 agent 修改，组员不动。使用原生 HTML/JS，无第三方运行依赖。

每周最小文件 index.html、lesson.js、README.md。index.html 使用以下框架（按周填写 title 和 noscript）：

```html
<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>第 X 周 · 标题</title><link rel="icon" href="data:,"><link rel="stylesheet" href="../week-02/style.css"><link rel="stylesheet" href="../course.css"><link rel="stylesheet" href="../shared/lesson.css"><script defer src="lesson.js"></script><script defer src="../shared/runtime.js"></script><script defer src="../courses.js"></script><script defer src="../navigation.js"></script></head><body><div id="lesson-root"></div><noscript>本周完整交互需开启 JavaScript。课程文字与运行说明见同目录 README.md。</noscript></body></html>
```

lesson.js 设置 `window.Lesson`，每周实验必须贴题，内容不只重复计划。核心代码执行在 worker 中（超时会终止，不在主线程 eval）。格式：

```js
window.Lesson = {
 week:3,title:'矩阵与变换',subtitle:'具体问题',intro:'读者场景与问题',time:'7–9 小时',
 goals:['可检验目标1','目标2','目标3'],
 sections:[{title:'讲解标题',html:'<p>原创中文讲解，符号、前提、与 OpenGL/重建联系。</p><div class="formula">公式</div>'}],
 lab:{
  title:'实验名称', description:'如何预测和观察，简化点在哪',
  controls:[{id:'angle',label:'Y轴角度',type:'range',min:-180,max:180,step:1,value:35},
    {id:'mode',label:'选择',type:'select',options:[{value:'tr',label:'T·R'},{value:'rt',label:'R·T'}],value:'tr'}],
  code:`const x = input.angle * Math.PI/180;\nreturn {x:Math.cos(x)};`,
  codeHelp:'每行做什么，如何改，预期变化；input各分量意义。',
  // input() 可选。默认把 controls state 传给 worker；不得把函数传给 worker。
  input:state=>state,
  // paint 必须每次完整清屏；主图在离屏 Canvas2D 中绘制，成功后原子提交。
  // 需要真实 DOM/WebGL/帧测量请使用 lab.mount(host)。
  // 收到的离屏canvas实际900x560；不要依赖它的DOM尺寸，手机展示时等比缩放。
  paint(canvas,result,state){const ctx=canvas.getContext('2d'); /* 实际几何绘制 */},
  // verify 可选，运行结果后检查数学不变量并返回字符串。不当作任意代码正确性证明。
  verify:(result,state)=>'条件性观察与数值读数',
  presets:[{label:'退化/故障/对比案例',values:{angle:0}}],
  takeaway:'应该观察到什么，不能得出什么结论',
  limitation:'CPU教学示意/忽略哪些图形学细节，绝不将合成测量说成实际GPU结果'
 },
 tasks:[{title:'先预测再实验任务',prompt:'操作与需提交的推理',hint:'可按需展开的提示，不自动泄露答题答案'}],
 quiz:[{question:'理解或定量题',options:['A','B','C'],answer:1,explanation:'答后解析，至少4题，推荐6题'}],
 misconceptions:['误区和修正'],next:'下一周及未掌握时复习建议',
 sources:[{title:'一手/官方参考资料',url:'https://.../',why:'对应本周哪里'}]
};
```

Worker 可用普通 JavaScript/Math/performance；以及下列函数（主 agent 提供）：
- add/sub/scale/dot/cross/norm/unit（unit 零输入返回 null）
- identity4(), mul4(a,b), transform4(m,v), translate4(x,y,z), rotateY4(radians), rotateZ4(radians), scale4(x,y,z), perspective4(fovRadians,aspect,near,far)
均为列向量/列主序。可在 code 中写自己的小 helper。纯核心代码返回的 JSON/typed array 结果传回 paint；不要返回函数/DOM，避免超大数据。每次执行默认限时 3 秒（性能测量可标 lab.timeoutMs=8000，但须限制输入量）。

Runtime 提供：章节、目标、输入控件、核心代码编辑/编译运行/恢复/下载，预设案例，任务预测/解释/参数与代码记录，答后测验，周内 localStorage、Markdown/PNG 导出、导航。paint 后会传 state 和 result，供数值报告。每周保存键 graphics-learning-week-XX-v1。

可使用 `window.LessonDraw`（根 agent 实现，paint 时可用）：
- setup(canvas,bg='#f8faf4') 返回2d ctx，固定 canvas.width=900,height=560，清屏；不提供透视相机，自己实现投影。
- line(ctx,a,b,color,width=2), arrow(ctx,a,b,color,label?), text(ctx,text,x,y,color?,size=18), polygon(ctx,points,fill,stroke)
不依赖 helper 也可直接 Canvas API。请注意图中字体实际可读性，核心视觉尽量占满画布。

必须：每周原创完整递进讲解（至少4段概念/公式/图像问题，不是内容空壳）；至少1个真计算交互、少量可编辑核心代码、预测实验、有解析测验、误区和边界、一手来源。高阶实验可简化，必须明确。第13周不能把CPU/模拟量宣称GPU实测，第15周须真随机/伪随机采样与随采样数变化，不用单纯图像模糊冒充路径追踪。

不要 commit/push，不发送QQ。交付后向主 agent 报告实现范围、检查和重要限制。已有用户文档锁文件保持原状。

可选 `lab.mount(host)`：runtime在核心实验下方提供空div并调用一次。可创建需要DOM/WebGL/真实帧计时的第二实验。该hook只负责这块独立实验，不修改其他DOM；允许返回cleanup函数。所有实时计时应标清CPU/墙钟/GPU含义。

代码与实验记录：每轮存当时的核心代码、prelude/helpers、参数及小于30万字符的实际输入表达式。更大输入为避免localStorage暴涨不内嵌，必须同时下载完整程序。代码下载保留Infinity/NaN/typed array，不能用JSON悄悄将Infinity改成null。
