# 第 13 周：GPU 与性能

同一个场景，把分辨率减半就流畅了吗？如果没变，是不是说明 GPU 不忙？这一周把“感觉卡”变成带条件、可重复、能够证伪的测量。

完整学习建议：8–10 小时。

## 统一启动

```bash
cd /home/bhw/repos/graphics-learning/weeks
python3 -m http.server 8003 --bind 127.0.0.1
```

首页 http://127.0.0.1:8003/，本周 http://127.0.0.1:8003/week-13/。保留完整 weeks/ 目录，课程与记录系统共用零依赖运行框架。按 Ctrl+C 停止。正文和计算可离线使用，参考链接需联网。

## 学习目标

- 分别改变分辨率、几何量、绘制数并记录条件
- 区分 CPU 提交、帧间隔与 GPU 执行时间
- 用单变量实验和反例提出瓶颈假设

## 自主阅读

### 先把“慢”换成可以比较的量

60 FPS 对应约 16.7 ms/帧，30 FPS 约 33.3 ms/帧。帧率差不是线性时间差；比较优化前后时，先换成毫秒。平均值可能掩盖偶发长帧，所以本周同时看样本分布与中位数。

frame_ms = 1000 / FPS

这里 FPS 是每秒呈现帧数，frame_ms 是相邻呈现时间的平均尺度，不能据此分解 CPU、GPU 各花了多久。浏览器合成、垂直同步、系统调度与后台任务也会影响相邻帧的间隔。

### CPU 和 GPU 是协作的流水线

CPU 更新场景、准备数据和提交绘制；GPU 执行顶点、光栅化、片段和输出。它们通常有异步与重叠。把 drawArrays 前后的 performance.now() 相减，主要测到 CPU 提交路径和可能的等待，不是完整 GPU 执行时间。

CPU 提交时间 ≠ GPU 执行时间 ≠ 帧间隔

粗略 steady-state 模型可把一帧看成受较慢阶段、同步和呈现节奏共同限制，而不是简单将 CPU 与 GPU 时间相加。不要把这个近似当作所有引擎的精确时间线。

### 三组可检验的瓶颈假设

只降低分辨率，主要减少像素/片段工作；只增加三角形数，主要增加顶点与图元处理；把同样内容拆成更多绘制调用，会增加提交开销，同时也可能改变状态、覆盖与 GPU 工作。没有一种实验能单独证明唯一瓶颈。

下方真实 WebGL 实验把这些输入分开控制。分辨率 w×h 的每个轴缩为一半，像素数约缩为四分之一；三角形以网格铺满相同范围，避免直接把几何量变化混同为大幅覆盖变化。绘制数增大会重复覆盖，因此同时增加提交和片段工作，这个混杂因素必须记下来。

### 测量条件是结论的一部分

先暖机，再在同一设备、浏览器、窗口尺寸和场景下重复。屏幕刷新率会产生平台：GPU 即使更快，也可能仍显示约 16.7 ms。软件渲染、移动设备温度、节能模式与 DevTools 开关会改变结果。

本周 worker 实验测 CPU 算术，下面独立 WebGL 实验测真实绘制提交和 requestAnimationFrame 间隔。两种测量不可混写成 GPU 时间。若要单独测 GPU，可研究 EXT_disjoint_timer_query 并检查结果可用和 disjoint 状态；本页不伪造缺失的 GPU 计时。

## 交互实验

CPU 对照基准 + 真实 WebGL 工作量实验

先看 worker 中三个 CPU 工作阶段的时间，再使用下面的真实 WebGL 面板改变绘制工作量。它们使用不同执行路径，读数必须分开解释；通用学习记录保存 Worker 输入，真实 WebGL 的参数与原始样本请用该面板的 JSON 按钮另存。

### 修改核心计算

```js
const side=Number(input.resolution), vertices=Number(input.geometry), calls=Number(input.calls), work=Number(input.work);
function once(){
 let checksum=0; const t0=performance.now();
 for(let i=0;i<vertices*128;i++) checksum+=Math.sin(i*.001)*Math.cos(i*.002);
 const t1=performance.now();
 // 这是函数调用/算术的 CPU 代理，不是 draw call 或 GPU 时间。
 function submit(i){return Math.sqrt(i+1)*.001;}
 for(let i=0;i<calls*256;i++) checksum+=submit(i);
 const t2=performance.now();
 for(let y=0;y<side;y++) for(let x=0;x<side;x++) for(let k=0;k<work;k++) checksum+=Math.sin((x+y+k)*.03)*.0001;
 const t3=performance.now(); return {geometry:t1-t0,submit:t2-t1,pixels:t3-t2,total:t3-t0,checksum};
}
for(let i=0;i<3;i++) once(); // 暖机，不计入样本。
const samples=Array.from({length:9},once), sorted=samples.map(s=>s.total).sort((a,b)=>a-b);
return {samples,median:sorted[4],side,vertices,calls,work};
```

once() 划分几何准备、调用代理、像素算术三个 CPU 阶段。先预测 side 从128变64的像素阶段比例，再只改这个输入。可以改 work 的内层运算，但不同代码的时间不能无条件互比。performance.now() 的精度受浏览器限制。

本周 Worker 内核已完整显示在编辑区；附加真实 WebGL 面板的初始化、绘制和测量代码位于 lesson.js 的 lab.mount。修改在 Worker 中执行，错误或超时保留上次图像；不会自动改写磁盘文件。

### 实验边界

Worker 基准是 CPU 对照。独立 WebGL 面板是真实绘制，但只报告 CPU 提交耗时与 rAF 帧间隔，未单独测 GPU。

## 先预测、实验、解释

### 分辨率实验：能支持什么结论？

在真实 WebGL 面板固定512三角形、1次调用、work=2，比较256²与128²。先预测像素数与帧间隔变化，再重复3轮。若帧间隔都约16.7ms，列出至少两种解释。

<details><summary>提示（需要时再看）</summary>

刷新率上限、CPU/调度限制与工作负载太轻都可能形成平台；不能直接说“分辨率没有成本”。

</details>

### 几何与绘制调用的混杂因素

固定分辨率，分别只改三角形数和绘制数。记录CPU提交与rAF，解释为什么增加调用还会增加过度绘制。设计下一步将提交开销与片段开销更好分离。

<details><summary>提示（需要时再看）</summary>

考虑把几何分批而不是重复全屏覆盖，并测GPU timer；条件必须写进记录。

</details>

### 修改核心内核，检验一个优化

在Worker代码中把像素内层可预计算的项提出，保留checksum意义，重复暖机+采样。报告效果与反例：work很小时是否仍能看到可靠差异？

<details><summary>提示（需要时再看）</summary>

不要删掉真正工作后宣称等价优化；比较相同输入和输出约束。

</details>

## 理解检查

1. drawArrays 前后 performance.now() 的差值代表什么？
   A. 完整 GPU 执行时间
   B. CPU 调用路径耗时，可能包含等待
   C. 屏幕实际呈现时间

<details><summary>作答后查看解析</summary>

参考选项：B。绘制通常异步提交，短调用不代表GPU很快；需要区分测量边界。

</details>

2. 宽高都减半，像素数约变为？
   A. 一半
   B. 四分之一
   C. 不变

<details><summary>作答后查看解析</summary>

参考选项：B。像素数量是宽×高，两个轴各乘0.5得到0.25。其他成本未必同比例减少。

</details>

3. 优化前后 rAF 都约16.7ms，可以断言没有优化收益吗？
   A. 可以
   B. 不可以，可能被刷新率平台掩盖
   C. 只要平均值一致就可以

<details><summary>作答后查看解析</summary>

参考选项：B。呈现节奏与执行成本不同。重复测试并使用合适计时边界，必要时增加负载。

</details>

4. 更多绘制调用重复全屏图元，是纯 CPU 提交实验吗？
   A. 是
   B. 不是，也增加片段与输出工作
   C. 与GPU完全无关

<details><summary>作答后查看解析</summary>

参考选项：B。重复覆盖引入过度绘制，是必须写明的混杂因素。

</details>

5. 为什么暖机后仍要多个样本？
   A. 为了选最小值作宣传
   B. 观察波动，降低JIT/调度等因素的影响
   C. 因为每次必然完全相同

<details><summary>作答后查看解析</summary>

参考选项：B。重复与分布让结论可评估；中位数也不是误差分析的替代品。

</details>

## 常见误区

- CPU提交短不等于GPU时间短。
- 降低分辨率未改变FPS，不等于片段计算没有成本。
- 软件渲染、设备温度和窗口尺寸必须写入环境，不能跨设备直接比较小差异。
- Worker内核时间只描述那个CPU程序，不能给真实GPU工作排序。

## 记录与提交

网页使用独立 localStorage 键 graphics-learning-week-13-v1，保存参数、核心代码草稿/成功版本、预测、解释、答题与复盘。可导出 Markdown、完整 JavaScript 和 PNG。记录不上传、不自动写回仓库；换浏览器/主机/端口会使用另一份存储。

## 下一步

下一周从相机发射射线。带着本周习惯：同时记录图像质量、样本数与计算成本。

## 一手资料

- [MDN · performance.now()](https://developer.mozilla.org/en-US/docs/Web/API/Performance/now)：计时边界与时间精度。
- [MDN · EXT_disjoint_timer_query](https://developer.mozilla.org/en-US/docs/Web/API/EXT_disjoint_timer_query)：了解单独测GPU时间的扩展与disjoint条件。
- [WebGL Fundamentals · Drawing Multiple Things](https://webglfundamentals.org/webgl/lessons/webgl-drawing-multiple-things.html)：绘制调用和状态准备的实际代码。

## 真实 WebGL 附加面板

页面另有独立 canvas：可选内部边长128/256/384、三角形128/512/2048/8192、1/2/4/8次真实 drawArrays、1/2/4/8次片段算术。按钮执行5帧暖机、20帧采样后停止，报告 CPU 提交中位数和 rAF 间隔中位数。GPU 时间未单独测量；此限制不是用CPU数据推测GPU结果的许可。

WebGL不可用时会禁用该附加面板，Worker CPU对照仍可运行。CPU对照的几何、调用代理与像素算术只是具体内核工作，不等同于真实GPU阶段。
