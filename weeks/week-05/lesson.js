'use strict';
window.Lesson={
 week:5,title:'三角形与光栅化',subtitle:'连续的三角形，如何产生离散的候选片段？',intro:'三角形的边界连续变化，像素却一格一格地跳。你将自己判断像素中心是否被覆盖，再用同一套重心坐标插值颜色，并观察为什么三维属性不能总按屏幕坐标直接线性插值。',time:'8–10 小时',
 goals:['从有向面积求重心坐标，判定采样点是否在三角形内部。','区分像素、采样位置、候选片段与最终可见颜色，解释边界跳动。','用权重和为1、顶点复现与透视校正对照验证插值实现，识别退化三角形。'],
 sections:[
 {title:'先问覆盖，再问颜色',html:'<p>一个三角形投到屏幕后，光栅化器需要回答每个采样位置是否被覆盖。为建立直觉，本实验让每个像素只采样中心一次：中心在三角形内便产生候选片段，否则保持背景。像素与三角形有一点重叠，并不保证这个中心采样命中。</p><p>候选片段不等于最终像素：遮挡、深度测试、混合等步骤还可能改变结果。本周只研究覆盖与属性插值，下一周再决定哪个表面能留下。</p>'},
 {title:'用三块有向面积得到权重',html:'<div class="formula">P = λ_A A + λ_B B + λ_C C<br>λ_A + λ_B + λ_C = 1</div><p>A、B、C是屏幕中的三个顶点，P为待检查的采样点；λ_A、λ_B、λ_C为重心坐标。每个权重可由对边三角形的有向面积除以总有向面积求得。分母为零表示三个顶点共线，不能继续除。</p><p>对一致的顶点方向，内部权重都非负；外部通常至少有一个为负。在顶点A处权重应为(1,0,0)，在边AB上λ_C应为0。这些比“画面看着差不多”更可靠。本实验把数学Y向上转换成Canvas的Y向下时显式翻转。</p>'},
 {title:'同一组权重，可以插值很多属性',html:'<div class="formula">q(P) = λ_A q_A + λ_B q_B + λ_C q_C</div><p>q可以是颜色分量、UV坐标或其他顶点属性。将A/B/C分别设为红/绿/蓝，颜色就把权重可视化了：越接近某个顶点，其对应分量越大。三角形内部不需要为每个像素手写一份颜色。</p><p>注意本图直接在数值颜色分量上混合，用来查看权重；显示器的颜色编码与线性光意义会在第12周展开，不能把这张权重示意当成物理光照计算。</p>'},
 {title:'透视下，屏幕权重不一定就是原属性权重',html:'<div class="formula">q = [Σ_i (λ_i q_i / w_i)] / [Σ_i (λ_i / w_i)]</div><p>w_i是三个顶点的裁剪空间w，λ_i仍由投影后的屏幕位置计算。透视除法改变了参数化速度，所以通常需要先插值q/w与1/w，再相除。若所有w相等，公式退化为普通屏幕线性插值。</p><p>实验固定三角形屏幕位置，只改变B顶点的w来隔离插值现象。它模拟一组投影后位置相同、深度关系不同的三维三角形；不要把w滑块误认为在直接移动屏幕顶点。</p><details><summary>延伸：共享边为什么不能两边都随便包含？</summary><p>真实光栅化器使用一致的边界归属规则避免相邻三角形在共享边重复覆盖或漏缝。本图对边界采用含端点的简单判定；它不实现GPU的完整子像素精度、top-left规则或MSAA。</p></details>'}
 ],
 lab:{title:'把重心坐标放到像素格上',description:'左侧是连续三角形与采样格；右侧是实际中心覆盖和属性插值。拖动C的高度直到共线，比较分辨率与透视校正，并追踪一个采样点的三个权重。',
 controls:[{id:'resolution',label:'采样网格边长 N',type:'range',min:8,max:32,step:1,value:20},{id:'cy',label:'顶点C的Y',type:'range',min:.15,max:.95,step:.01,value:.85},{id:'sampleX',label:'检查位置X（转换为所在像素中心）',type:'range',min:.025,max:.975,step:.025,value:.425},{id:'sampleY',label:'检查位置Y',type:'range',min:.025,max:.975,step:.025,value:.425},{id:'wB',label:'B顶点裁剪w',type:'range',min:1,max:6,step:.25,value:3},{id:'mode',label:'属性插值方式',type:'select',options:[{value:'affine',label:'屏幕线性插值'},{value:'perspective',label:'透视校正插值'}],value:'affine'}],
 prelude:`const A=[.15,.15],B=[.85,.15],C=[.35,input.cy],N=input.resolution;
const area=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
function rasterize(bary,shade,total){
 const cells=[];
 for(let row=0;row<N;row++)for(let col=0;col<N;col++){
  const p=[(col+.5)/N,1-(row+.5)/N],weights=bary(p);
  if(weights&&weights.every(x=>x>=-1e-10))cells.push({row,col,color:shade(weights)});
 }
 const col=Math.min(N-1,Math.floor(input.sampleX*N));
 const row=Math.min(N-1,Math.floor((1-input.sampleY)*N));
 const p=[(col+.5)/N,1-(row+.5)/N],weights=bary(p);
 return {A,B,C,N,total,cells,selected:{row,col,p,weights,color:weights&&weights.every(x=>x>=-1e-10)?shade(weights):null}};
}`,
 code:`const total=area(A,B,C);
const bary=p=>Math.abs(total)<1e-12?null:
  [area(p,B,C),area(A,p,C),area(A,B,p)].map(x=>x/total);
const shade=weights=>{
  if(input.mode==='affine')return weights;
  const divided=weights.map((x,i)=>x/[1,input.wB,1][i]);
  const sum=divided.reduce((a,b)=>a+b,0);
  return divided.map(x=>x/sum);
};
return rasterize(bary,shade,total);`,
 codeHelp:'area是二维叉积给出的两倍有向面积，除以total得到λ。可故意去掉total归一化，检查权重和是否仍为1；也可把透视校正分母删掉，解释为何数值被错误缩放。颜色数组代表R/G/B三个基色的权重。',
 paint(canvas,r,s){canvas.width=900;canvas.height=560;const c=canvas.getContext('2d');c.fillStyle='#f8faf4';c.fillRect(0,0,900,560);const boxes=[{x:35,y:65,w:380},{x:485,y:65,w:380}],point=(p,b)=>[b.x+p[0]*b.w,b.y+(1-p[1])*b.w];for(const b of boxes){c.strokeStyle='#d2ddcc';c.lineWidth=1;for(let i=0;i<=r.N;i++){const v=i/r.N*b.w;c.beginPath();c.moveTo(b.x+v,b.y);c.lineTo(b.x+v,b.y+b.w);c.moveTo(b.x,b.y+v);c.lineTo(b.x+b.w,b.y+v);c.stroke();}}c.beginPath();[r.A,r.B,r.C].forEach((p,i)=>i?c.lineTo(...point(p,boxes[0])):c.moveTo(...point(p,boxes[0])));c.closePath();c.fillStyle='#368a7330';c.fill();c.strokeStyle='#28765d';c.lineWidth=3;c.stroke();c.font='20px sans-serif';for(const[p,name,color]of [[r.A,'A / R','#ac3f36'],[r.B,'B / G','#28765d'],[r.C,'C / B','#376aaa']]){const q=point(p,boxes[0]);c.fillStyle=color;c.beginPath();c.arc(...q,4,0,Math.PI*2);c.fill();c.fillText(name,q[0]+7,q[1]-12);}const b=boxes[1],cell=b.w/r.N;for(const pixel of r.cells){c.fillStyle='rgb('+pixel.color.map(v=>Math.round(Math.max(0,Math.min(1,v))*255)).join(',')+')';c.fillRect(b.x+pixel.col*cell+.5,b.y+pixel.row*cell+.5,cell-1,cell-1);}for(const b of boxes){const q=point(r.selected.p,b);c.strokeStyle='#a4641c';c.lineWidth=3;c.strokeRect(b.x+r.selected.col*b.w/r.N,b.y+r.selected.row*b.w/r.N,b.w/r.N,b.w/r.N);c.fillStyle='#fff3b2';c.beginPath();c.arc(...q,3,0,Math.PI*2);c.fill();}c.fillStyle='#233c35';c.font='20px sans-serif';c.fillText('连续三角形 / 中心采样',35,35);c.fillText('覆盖后的候选颜色',485,35);c.font='17px monospace';const f=v=>v?v.map(x=>x.toFixed(3)).join(', '):'undefined';c.fillText('P = ('+f(r.selected.p)+')； λ = ('+f(r.selected.weights)+')',25,490);c.fillText('插值RGB = ('+f(r.selected.color)+')；覆盖 '+r.cells.length+' / '+r.N*r.N,25,520);if(Math.abs(r.total)<1e-12){c.fillStyle='#943f2a';c.font='20px sans-serif';c.fillText('退化：三个顶点共线，重心坐标未定义',35,550);}},
 verify:r=>r.selected.weights?'所选采样权重和 = '+r.selected.weights.reduce((a,b)=>a+b,0).toFixed(8)+'；'+(r.selected.weights.every(w=>w>=-1e-10)?'在三角形内/边上':'在三角形外，不应生成本三角形候选片段'):'面积为零，停止除法。不要用任意颜色掩盖退化几何。',
 presets:[{label:'退化三角形',values:{cy:.15}},{label:'正常三角形',values:{cy:.85}},{label:'相同w时两种插值一致',values:{wB:1}},{label:'拉大透视差异',values:{wB:6,mode:'perspective'}}],
 takeaway:'覆盖是采样判定，插值是属性计算；权重和、顶点值与相同w对照是调试的三个抓手。',limitation:'CPU中心采样的三角形教学光栅器，省略GPU子像素/边归属规则、MSAA、深度和颜色管理；透视w独立于屏幕几何调节，以隔离插值差异。'},
 tasks:[{title:'推导并手算一个权重',prompt:'固定A=(0.15,0.15)、B=(0.85,0.15)、C=(0.35,0.85)，先算P=(0.35,0.35)的重心坐标。再找到附近的实际像素中心，说明为什么实验读数不必和手算点完全相同。',hint:'采样点先被映射到像素中心，P的输入滑块不是任意精度连续采样。'},{title:'让覆盖数量变化，却不改三角形',prompt:'固定几何，只修改N。先预测覆盖数量与覆盖面积的关系，再比较低/高分辨率；解释为什么像素数不是面积的精确连续值。',hint:'边缘是离散取样，不能期待任意N都严格乘N²比例。'},{title:'构造透视插值的失败案例',prompt:'先令wB=1确认两种模式相同，再令wB=6。选取一个内部采样点，手算校正公式并解释哪个权重变小；最后删除代码中的归一化分母来证伪。',hint:'固定屏幕权重时，B对应项先除以更大的w。'}],
 quiz:[
 {question:'每像素只采样中心一次时，三角形擦过像素角落就一定命中吗？',options:['一定','不一定，需要中心被覆盖','只由颜色决定'],answer:1,explanation:'覆盖取决于采样规则，不是只要像素方格与几何相交就命中中心采样。'},
 {question:'内部点的重心坐标在非退化三角形中满足什么？',options:['和为1且均非负','三个数必须相等','和等于三角形面积'],answer:0,explanation:'面积比归一化后和为1，内部非负；形心才具有三个相等权重。'},
 {question:'三点共线时应该怎样？',options:['继续除以0得到一种颜色','识别退化，避免求未定义权重','把三个权重都设为1'],answer:1,explanation:'总有向面积为0，不能用该分母求重心坐标。'},
 {question:'所有顶点w相同时，透视校正插值怎样？',options:['仍必定不同于线性插值','退化为屏幕线性插值','属性全部变为0'],answer:1,explanation:'公共1/w因子在分子分母中抵消。'},
 {question:'透视校正公式中先插值什么？',options:['q/w与1/w，再相除','只插值w','先把RGB做平方'],answer:0,explanation:'校正本质在于除法前后的参数化关系，而不是随意调色。'},
 {question:'一个候选片段有了颜色就一定成为最终像素吗？',options:['一定','不一定，还可能被深度等测试拒绝','只要最后画就一定'],answer:1,explanation:'颜色计算与可见性筛选不同，下一周用深度缓冲决定遮挡。'}],
 misconceptions:['把像素方格相交当作中心采样命中：先声明采样位置。','把重心坐标当成固定顶点标签：权重随采样位置而变化。','把屏幕插值直接用于所有三维属性：检查是否需要透视校正。'],next:'第6周让多个三角形竞争同一采样位置，理解深度缓冲和z-fighting。',
 sources:[{title:'PBRT 4 · Triangle Meshes',url:'https://pbr-book.org/4ed/Shapes/Triangle_Meshes',why:'三角形参数化与重心坐标。'},{title:'LearnOpenGL · Hello Triangle',url:'https://learnopengl.com/Getting-started/Hello-Triangle',why:'GPU光栅化阶段与顶点/片段属性的入口。'}]
};
