'use strict';
window.Lesson={
 week:3,title:'矩阵与变换',subtitle:'同样的旋转和平移，为什么画出了两条不同的轨迹？',
 intro:'把一个小物体放到世界原点右侧，再让它转动。你要的是物体原地转向，还是绕世界原点公转？这两种动作可以使用相同的 T 与 R，却得到不同的矩阵乘积。',time:'7–9 小时',
 goals:['用列向量约定判断乘积的实际执行顺序，并手算一个非零旋转案例。','从局部原点的轨迹区分自转与公转，定位把 T·R 写成 R·T 的错误。','解释矩阵的列、齐次 w 与行/列主序存储的区别；构造不交换与恰好交换的反例。'],
 sections:[
 {title:'先观察物体中心，别只盯住轮廓',html:'<p>想象路口上一个方向箭头：它已经被放在路口位置，旋转时应保持中心不动。如果先把箭头沿世界 X 移开，再绕世界原点旋转，箭头中心会沿圆弧运动。画面看起来都“转了”，但含义完全不同。</p><p>本周用同一局部三角形做两次变换：青色为 T·R，砖红为 R·T。虚线轨迹标出局部原点的世界位置。先预测当角度从 0° 变到 90° 时，哪个中心会移动，再运行实验。</p>'},
 {title:'固定约定，才能讨论顺序',html:'<p>采用右手坐标系、<strong>列向量</strong>，点写作 p=(x,y,z,1)ᵀ。矩阵乘法从右向左作用。R 是绕世界 Z 轴的旋转；T 把位置沿 X 轴移动 t 个单位。为突出顺序，实验把模型放在 z=0 的平面。</p><div class="formula">p₁ = T·R·p　（先 R，后 T）<br>p₂ = R·T·p　（先 T，后 R）</div><p>乘法顺序不是“读起来顺手”的书写习惯。CPU 中先调用 translate 再 rotate，也不能仅凭函数调用的先后猜结果；要看库是在左乘还是右乘。列主序描述的是数组存储顺序，不自动决定你使用列向量还是行向量。</p>'},
 {title:'把矩阵展开成可以手算的几何',html:'<div class="formula">R_z(θ)(x,y) = (x cosθ − y sinθ, x sinθ + y cosθ)<br>T(x,y) = (x+t,y)</div><p>θ 为逆时针正角，cosθ 与 sinθ 给出旋转后基向量的分量。于是 T·R 的结果在旋转后加 (t,0)；R·T 则连同平移向量一起旋转。对局部原点 p=(0,0,0,1)：前者中心始终是 (t,0)，后者中心是 (t cosθ,t sinθ)。</p><p>手算：t=2，θ=90°，p=(1,0,0,1)。T·R·p=(2,1,0,1)，R·T·p=(0,3,0,1)。中心与一个非中心顶点都要查；只看某一个特殊点可能遗漏错误。</p>'},
 {title:'矩阵的列，是变换后的基与原点',html:'<p>对仿射矩阵 M=[eₓ eᵧ e_z o; 0 0 0 1]，前三列描述原坐标基向量变换后的方向，最后一列是局部原点的世界位置。点的 w=1 会带入 o，方向 w=0 不会。这正好连接第 2 周的基底展开。</p><p>重建中相机 pose 的旋转和平移也不能随意交换。给定 world→camera 的 R、t 时，camera→world 需要求整个变换的逆；不能只把平移符号改掉。第 4 周会把 V 作为观察变换使用。</p><details><summary>延伸：如何绕任意支点 c 旋转？</summary><p>先把 c 移到原点，再旋转，再移回去：M=T(c)R T(−c)。对 p=c，代入即可验证支点固定。不要靠背乘积，先写动作，再按约定翻译。</p></details>'}
 ],
 lab:{title:'自转还是公转：同时对照 T·R 与 R·T',description:'两组结果都由实际4×4矩阵乘法产生。改变角度和平移，查看中心与同一顶点坐标；可以改核心代码制造错误，并用中心轨迹解释。',
 controls:[{id:'angle',label:'绕 Z 轴角度 θ（度）',type:'range',min:-180,max:180,step:1,value:40},{id:'tx',label:'沿世界 X 平移 t',type:'range',min:0,max:2.8,step:.1,value:2},{id:'size',label:'模型局部大小',type:'range',min:.3,max:1.1,step:.1,value:.7}],
 code:`const R = rotateZ4(input.angle * Math.PI / 180);
const T = translate4(input.tx, 0, 0);
const TR = mul4(T, R); // 列向量：先旋转，再平移
const RT = mul4(R, T); // 列向量：先平移，再旋转
const local = [[-.55,-.35,0,1],[.75,0,0,1],[-.55,.35,0,1]]
  .map(p => [p[0]*input.size,p[1]*input.size,0,1]);
return {tr:local.map(p=>transform4(TR,p)),rt:local.map(p=>transform4(RT,p)),
  centerTR:transform4(TR,[0,0,0,1]),centerRT:transform4(RT,[0,0,0,1]), TR,RT};`,
 codeHelp:'R、T 分别是旋转/平移矩阵；mul4(A,B) 返回 A·B。将 RT 改为 mul4(T,R) 后，两种图形会重合；先预测再改。修改局部顶点时，w=1 的点编码不要丢掉。',
 paint(canvas,r,s){const c=canvas.getContext('2d');canvas.width=900;canvas.height=560;c.fillStyle='#f8faf4';c.fillRect(0,0,900,560);const p=v=>[450+80*v[0],290-80*v[1]];c.strokeStyle='#d5dfcf';c.lineWidth=1;for(let i=-5;i<=5;i++){c.beginPath();c.moveTo(...p([i,-3]));c.lineTo(...p([i,3]));c.moveTo(...p([-5,i]));c.lineTo(...p([5,i]));c.stroke();}c.strokeStyle='#667d6c';c.beginPath();c.moveTo(35,290);c.lineTo(865,290);c.moveTo(450,35);c.lineTo(450,535);c.stroke();c.setLineDash([6,8]);c.strokeStyle='#b7654f';c.beginPath();c.arc(450,290,80*s.tx,0,Math.PI*2);c.stroke();c.setLineDash([]);for(const [verts,color,name,center]of [[r.rt,'#b7654f','R·T',r.centerRT],[r.tr,'#28765d','T·R',r.centerTR]]){c.beginPath();verts.forEach((v,i)=>i?c.lineTo(...p(v)):c.moveTo(...p(v)));c.closePath();c.fillStyle=color+'55';c.fill();c.strokeStyle=color;c.lineWidth=3;c.stroke();c.fillStyle=color;c.beginPath();c.arc(...p(center),5,0,Math.PI*2);c.fill();c.font='20px sans-serif';c.fillText(name,p(center)[0]+12,p(center)[1]-18);}c.fillStyle='#233c35';c.font='20px sans-serif';c.fillText('世界原点 O',455,315);c.fillText('X',865,280);c.fillText('Y',461,33);c.font='18px monospace';const f=v=>v.slice(0,2).map(x=>x.toFixed(3)).join(', ');c.fillText('T·R 中心 = ('+f(r.centerTR)+')',24,32);c.fillText('R·T 中心 = ('+f(r.centerRT)+')',24,60);c.fillText('同一局部顶点：TR ('+f(r.tr[1])+') / RT ('+f(r.rt[1])+')',24,535);},
 verify:r=>'中心间距 = '+Math.hypot(r.centerTR[0]-r.centerRT[0],r.centerTR[1]-r.centerRT[1]).toFixed(4)+'。注意：角度为0或平移为0时即使顺序写错也可能看不出差异。',
 presets:[{label:'手算核验：90° / t=2',values:{angle:90,tx:2,size:1}},{label:'会掩盖错误的零旋转',values:{angle:0,tx:2}},{label:'会掩盖错误的零平移',values:{angle:70,tx:0}}],
 takeaway:'验证顺序时选非零角度、非零平移与至少两个顶点；中心的轨迹直接揭示平移是否被旋转。',limitation:'用CPU对4×4齐次矩阵做真实乘法，再作二维正交绘图；不是GPU帧捕获。仅绕Z旋转、沿X平移，不处理层级场景或透视。'},
 tasks:[{title:'先预测两种中心，再运行',prompt:'设 θ=90°、t=2，先写出局部原点及 p=(1,0,0,1) 经 T·R 与 R·T 的四组坐标；再运行预设，解释中心与顶点的区别。',hint:'先在纸上画坐标轴，分开写R(p)和T(p)，最后再合成。'},{title:'制造一个“测试通过但代码仍错”的案例',prompt:'把RT乘积故意改成TR。找一组参数让错误藏起来，再找一组让它暴露。记录为什么单个截图不足以证明顺序正确。',hint:'零旋转和零平移是特殊情况；不要只测特殊情况。'},{title:'延伸：实现任意支点',prompt:'在核心代码中加支点c，使用T(c) R T(−c)。提交一个支点固定、非支点运动的数值验证；不要求修改绘图框架。',hint:'用 transform4 对 p=c 与另一个点各计算一次。'}],
 quiz:[
 {question:'列向量约定下，T·R·p 的动作顺序是什么？',options:['先T后R','先R后T','两者始终相同'],answer:1,explanation:'最右侧矩阵最先作用。书写顺序与动作顺序要分开。'},
 {question:'t=2，θ=90°，局部原点经R·T后在哪里？',options:['(2,0)','(0,2)','(0,0)'],answer:1,explanation:'先移到(2,0)，再绕原点逆时针转90°，得到(0,2)。'},
 {question:'只在θ=0°时比较TR与RT一致，能否证明实现正确？',options:['可以','不可以，此时R是单位矩阵','只要画面没有报错就可以'],answer:1,explanation:'单位变换会掩盖顺序错误，需要使用非零角度、平移及多个点。'},
 {question:'“列主序数组”是否足以说明使用了列向量数学约定？',options:['是','否，存储布局与数学约定需要分别声明','只有OpenGL中是'],answer:1,explanation:'数组布局描述数据如何排在内存，不能代替对乘法与向量表示的约定。'},
 {question:'绕世界点c旋转且让c固定，列向量矩阵应为？',options:['T(−c) R T(c)','T(c) R T(−c)','R T(c)'],answer:1,explanation:'先把支点移到原点，再旋转，最后移回。代入p=c即可自检。'},
 {question:'仿射矩阵作用于w=0的方向时，平移列会怎样？',options:['参与计算','不参与计算','把方向自动归一化'],answer:1,explanation:'平移列乘以w=0，因此不改变方向；矩阵并不会自动归一化向量。'}],
 misconceptions:['把函数调用先后等同于几何作用顺序：先查左乘/右乘约定。','把存储布局和向量表示混为一谈：分别声明列主序与列向量。','只比较零角度或模型中心：用一般参数和多个点验证。'],next:'第4周把模型变换接到观察与投影。若顺序仍不清楚，先手算中心轨迹，再看矩阵元素。',
 sources:[{title:'LearnOpenGL · Transformations',url:'https://learnopengl.com/Getting-started/Transformations',why:'向量、齐次变换与矩阵组合。'},{title:'PBRT 4 · Transformations',url:'https://pbr-book.org/4ed/Geometry_and_Transformations/Transformations',why:'深入核对点、向量与变换的约定。'}]
};
