'use strict';
window.Lesson={
 week:6,title:'深度与遮挡',subtitle:'近的表面为什么有时会输给远的表面？',intro:'两个几乎共面的三角形可能交替盖住彼此，移动相机时出现斑纹。你将从“同一采样点谁最近”出发，亲手计算深度映射与量化，并用近裁剪面、位深和绘制顺序构造诊断实验。',time:'8–10 小时',
 goals:['解释深度缓冲、比较函数和每帧清除，区分提交顺序与几何可见性。','从观察距离计算OpenGL透视窗口深度，解释深度精度为何不均匀。','用可测的量化冲突判断z-fighting假设，比较调整near、位深及几何偏移的取舍。'],
 sections:[
 {title:'一个采样位置，可以收到多个候选',html:'<p>设A/B两个不透明表面都覆盖某个像素中心。片段着色器可以给两者都算出颜色，但最终通常只想看最近的一个。深度缓冲为每个位置保存当前胜出者的深度；开启LESS时，新深度更小才替换它。</p><p>本课使用默认窗口深度[0,1]，每帧清除为1，并启用深度写入。不同表面的深度可区分时，改变不透明物体的提交顺序不应改变遮挡。若量化后相等，严格LESS会保留先写入者。透明混合的顺序是另一类问题，不能据此推断。</p>'},
 {title:'透视深度，不是“距离除以far”',html:'<p>设前向距离d=−z_view&gt;0，近远面为n、f，满足0&lt;n&lt;f。OpenGL透视投影、透视除法与默认深度范围映射合起来，窗口深度为：</p><div class="formula">z(d) = f/(f−n) − fn/[(f−n)d]<br>z(n)=0，z(f)=1</div><p>z是深度缓冲使用的量，d是观察空间里的正距离。公式中的1/d意味着精度向近处集中。把near设得极小，会让远处的深度差被压缩；不是单纯“far越大就按同一比例损失所有地方的精度”。</p>'},
 {title:'连续深度，最终还要放进有限表示',html:'<div class="formula">q = round(z · (2ᵇ−1))<br>Δd ≈ [(f−n)d²] / [fn(2ᵇ−1)]</div><p>b是本实验的定点深度位数，q是整数格编号。Δd是局部一格对应的近似距离分辨率，来自对z(d)求导后取倒数；它随d²增长。两个不同的d可能落入同一q。真正的GPU还涉及具体深度格式、舍入、插值与浮点误差，本图只隔离这一种机制。</p><p>左图使用未量化的理论距离决定可见性，右图使用q和LESS。两张图不一致的格子，是这组几何与量化设置下的可见性误差，不是随机制造的噪声。</p>'},
 {title:'排查与修复，不要只调一个神秘偏移',html:'<p>先检查深度测试是否启用、比较函数是否正确、是否清除并允许深度写入，再验证near/far与表面的真实距离。如果确有共面重复几何，删除冗余表面常比硬加偏移更直接；需要贴花时可研究偏移方案，但它也可能导致悬浮或遮挡错误。</p><p>把near推远会改善标准透视定点深度的远处精度，但会裁掉更近内容；提高位深不是免费改变设备格式的滑块。本实验的b是教学参数，并未修改浏览器GPU深度缓冲。Reversed-Z与浮点深度是后续延伸，不能把此定点公式直接当成所有实现的结论。</p><details><summary>延伸：为什么只交换顺序不是最终修复？</summary><p>当两层落入同一量化深度格，交换顺序只改变谁在相等时先写入。它可以支持“深度无法区分”的假设，却不能恢复正确的几何距离信息。</p></details>'}
 ],
 lab:{title:'理想遮挡与量化遮挡，同时比较',description:'两张近共面斜面都覆盖网格。左边按真实距离选最近表面，右边先量化深度再执行LESS。青色A、砖红B，黄色边框标出同一深度格；改变提交顺序查看平局如何被打破。',
 controls:[{id:'near',label:'近面 n',type:'range',min:.01,max:2,step:.01,value:.1},{id:'far',label:'远面 f',type:'range',min:50,max:1000,step:10,value:500},{id:'distance',label:'表面中心距离 d',type:'range',min:3,max:180,step:1,value:60},{id:'separation',label:'B的距离偏移 Δ',type:'range',min:0,max:.1,step:.001,value:.012},{id:'slope',label:'两表面的微小斜率',type:'range',min:0,max:.2,step:.005,value:.04},{id:'bits',label:'教学定点位数 b',type:'range',min:8,max:24,step:1,value:16},{id:'order',label:'提交顺序',type:'select',options:[{value:'ab',label:'A → B'},{value:'ba',label:'B → A'}],value:'ab'}],
 prelude:`function renderPlanes(choose,depth,quantize,n,f,levels){
const cells=[],W=40,H=24;
for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  const a=input.distance+input.slope*(x/(W-1)-.5);
  const b=input.distance+input.separation+input.slope*(y/(H-1)-.5);
  cells.push({x,y,ideal:choose(a,b,false),actual:choose(a,b,true),tie:quantize(a)!==null&&quantize(a)===quantize(b)});
}
const d=input.distance;
return {cells,W,H,z:depth(d),q:quantize(d),levels,
  resolution:(f-n)*d*d/(f*n*levels),
  curve:Array.from({length:161},(_,i)=>{const d=n+(Math.min(f,180)-n)*i/160;return [d,depth(d)];})};
}`,
 code:`const n=input.near,f=input.far,levels=2**input.bits-1;
const depth=d=>f/(f-n)-f*n/((f-n)*d);
const quantize=d=>(d<n||d>f)?null:Math.round(depth(d)*levels);
const choose=(a,b,quantized)=>{
  let winner=0,best=quantized?levels:1;
  for(const id of input.order==='ab'?[1,2]:[2,1]){
    const d=id===1?a:b,z=quantized?quantize(d):(d<n||d>f?null:depth(d));
    if(z!==null&&z<best){best=z;winner=id;} // 严格LESS：平局不替换
  }return winner;
};
return renderPlanes(choose,depth,quantize,n,f,levels);`,
 codeHelp:'depth把观察距离映射为窗口深度；quantize把它落到定点格；choose才执行可见性比较。把LESS的“<”改成“<=”，先预测深度相等时由谁获胜。不要把位数参数解释成浏览器真实GPU格式。',
 paint(canvas,r,s){canvas.width=900;canvas.height=560;const c=canvas.getContext('2d');c.fillStyle='#f8faf4';c.fillRect(0,0,900,560);const panels=[{x:30,y:60,w:390,h:234,key:'ideal'},{x:480,y:60,w:390,h:234,key:'actual'}];c.font='20px sans-serif';c.fillStyle='#233c35';c.fillText('理想距离：最近表面',30,33);c.fillText('定点深度 + LESS',480,33);for(const b of panels){for(const cell of r.cells){c.fillStyle=['#e2e8dc','#368a73','#b7654f'][cell[b.key]];c.fillRect(b.x+cell.x*b.w/r.W,b.y+cell.y*b.h/r.H,b.w/r.W+.4,b.h/r.H+.4);if(b.key==='actual'&&cell.tie){c.strokeStyle='#e1bf58';c.lineWidth=.7;c.strokeRect(b.x+cell.x*b.w/r.W,b.y+cell.y*b.h/r.H,b.w/r.W,b.h/r.H);}}c.strokeStyle='#738970';c.lineWidth=1;c.strokeRect(b.x,b.y,b.w,b.h);}const tie=r.cells.filter(p=>p.tie).length,wrong=r.cells.filter(p=>p.ideal!==p.actual).length;c.fillStyle='#233c35';c.font='18px monospace';c.fillText('同格 '+tie+'/'+r.cells.length+'；与理想结果不同 '+wrong+' 格',30,330);c.fillText('中心 z='+r.z.toFixed(8)+'；q='+r.q+' / '+r.levels,30,359);c.fillText('该距离处一格约 Δd ≈ '+r.resolution.toPrecision(4),30,388);const box={x:80,y:425,w:755,h:90};c.strokeStyle='#b2c2ac';c.strokeRect(box.x,box.y,box.w,box.h);c.strokeStyle='#28765d';c.lineWidth=2;c.beginPath();const maxD=r.curve.at(-1)[0];r.curve.forEach((p,i)=>{const x=box.x+p[0]/maxD*box.w,y=box.y+(1-p[1])*box.h;i?c.lineTo(x,y):c.moveTo(x,y);});c.stroke();c.fillStyle='#233c35';c.font='16px sans-serif';c.fillText('z=1',25,436);c.fillText('z=0',25,515);c.fillText('d：线性距离轴，深度曲线很快靠近1',255,548);},
 verify:r=>'量化平局 '+r.cells.filter(p=>p.tie).length+' 格，可见性与理想距离不同 '+r.cells.filter(p=>p.ideal!==p.actual).length+' 格。远面外的表面会被裁剪，不属于z-fighting。',
 presets:[{label:'低精度，暴露提交顺序',values:{bits:12,near:.1,distance:60,separation:.012,slope:.04}},{label:'推远near对照',values:{near:2,bits:24,distance:60}},{label:'完全共面：没有唯一前后',values:{separation:0,slope:0}},{label:'观察近处',values:{distance:3,bits:16,near:.1}}],
 takeaway:'先区分真实几何距离、投影深度和存储量化。平局及顺序敏感可支持精度假设，但不是所有遮挡错误都来自z-fighting。',limitation:'CPU模拟标准透视深度的定点四舍五入和LESS，微斜面是按屏幕格定义的教学表面；不是实际GPU深度读回，也未包含浮点深度、MSAA、硬件插值误差或Reversed-Z。'},
 tasks:[{title:'近处与远处，谁更容易落同一格？',prompt:'保持near、far、b和两面偏移不变，比较d=3与d=60。先用Δd近似式预测精度比例，再检查量化平局数量。',hint:'近似分辨率随d²增长，但某一对值是否撞格还取决于格边界。'},{title:'只交换顺序，为什么不能证明修复？',prompt:'运行低精度预设，交换A/B提交顺序。解释变化来自LESS平局而非几何真的改变。再用推远near或提高教学位深作对照。',hint:'两层量化值相同，先写入的候选留下；顺序并没有补回丢失的深度信息。'},{title:'写出有代价的修复建议',prompt:'假设需要同时渲染0.05米近物和1000米道路，讨论推远near、分层渲染、去除重复几何、深度偏移分别会牺牲什么。区分本实验支持的结论与需要真实GPU测量的结论。',hint:'不要用单个视角里“斑纹没了”代替完整验证。'}],
 quiz:[
 {question:'标准LESS比较且深度完全相等时，后提交片段会怎样？',options:['替换先前片段','不通过比较，保留先前值','自动做透明混合'],answer:1,explanation:'LESS是严格小于，等于不会通过。LEQUAL才包含相等。'},
 {question:'本课标准透视映射的深度z(d)随距离是什么关系？',options:['d/f的线性关系','包含1/d的非线性关系','与near无关'],answer:1,explanation:'z=f/(f−n)−fn/((f−n)d)，近处获得更多可分辨区间。'},
 {question:'在其他条件固定时，d增为原来两倍，局部距离分辨率Δd约怎样？',options:['两倍','四倍，更难区分近共面表面','不变'],answer:1,explanation:'该定点标准透视近似中Δd与d²成正比。'},
 {question:'把near推远有什么代价？',options:['完全没有代价','会裁掉更近内容','让所有颜色变暗'],answer:1,explanation:'改善远处深度区分的同时缩小近处可见范围。'},
 {question:'本实验把b从16改到24意味着真实GPU格式被修改了吗？',options:['是','否，只改变CPU教学量化','等于开启Reversed-Z'],answer:1,explanation:'参数只改变模拟量化。设备深度缓冲格式需要通过真实图形API查询/创建。'},
 {question:'关闭深度后遮挡顺序变化，是否足以证明原问题一定是精度不足？',options:['足以','不足，还需检查状态、清除、几何与实际精度','只要加bias就行'],answer:1,explanation:'顺序敏感有多种来源，应设计对照实验而非直接断言。'}],
 misconceptions:['以为深度缓冲保存的是线性米数：核对投影与范围映射。','把交换顺序当作最终修复：它不能恢复丢失的精度。','把教学b滑块或斑纹图当成GPU实测：本实验明确只演示量化机制。'],next:'第7周把可见表面的属性连到纹理，研究空间采样、过滤和远处闪烁。',
 sources:[{title:'LearnOpenGL · Depth testing',url:'https://learnopengl.com/Advanced-OpenGL/Depth-testing',why:'深度测试、非线性深度和z-fighting。'},{title:'MDN · depthFunc',url:'https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/depthFunc',why:'核对LESS与LEQUAL等真实WebGL深度比较规则。'}]
};
