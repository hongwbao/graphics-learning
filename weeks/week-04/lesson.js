'use strict';
window.Lesson={
 week:4,title:'相机与投影',subtitle:'相机只是一组规则：它怎样把三维点变成二维坐标？',intro:'两个同样大的立方体，一个近，一个远。透视投影里它们看起来不同大；换成正交投影，尺寸差异消失。你将跟着一个点走过观察、裁剪、透视除法与视口，而不是把一切都归因于“相机矩阵”。',time:'7–9 小时',
 goals:['区分V、P、裁剪、透视除法与视口映射，解释每一步的输入输出。','用相似三角形预测距离/FOV对成像的影响，区分移动相机与改变视场角。','核对OpenGL的相机朝向、NDC范围与近远面，诊断被裁剪或投影颠倒。'],
 sections:[
 {title:'先把“从哪里看”和“怎样成像”拆开',html:'<p>世界中点的位置不依赖相机，但它相对相机的坐标依赖相机。观察变换V负责把世界坐标表达成相机坐标；投影P才决定近大远小或平行投影。实验相机只平移，朝向固定为−Z，+Y向上，没有偷偷重新看向原点。</p><div class="formula">p_view = V p_world<br>p_clip = P p_view</div><p>重建外参常表示world→camera，这与V的映射方向相近，但仍需核对轴约定、手性和矩阵布局。仅凭变量名叫pose不能判断可直接使用，camera→world位姿需要取逆。</p>'},
 {title:'透视关系来自相似三角形',html:'<p>设相机向−Z看，一个前方点的观察坐标z_view&lt;0。令d=−z_view&gt;0为前向距离，竖直视场角为φ，f=1/tan(φ/2)。当宽高比为a时：</p><div class="formula">x_ndc = (f/a) x_view / d<br>y_ndc = f y_view / d</div><p>同样的物体距离加倍，投影大小约减半。增大φ会减小f，视野变宽，固定位置的物体变小。FOV变化不会改变物体间的透视距离比；移动相机会改变各物体的距离比，所以“后退”和“放大视野”通常不等价。</p>'},
 {title:'为什么先输出四维坐标？',html:'<p>透视矩阵令w_clip=−z_view，将除法推迟。顶点着色器写出的gl_Position是(x_clip,y_clip,z_clip,w_clip)，不是像素位置。GPU先按齐次条件裁剪几何，再除以w得到NDC。</p><div class="formula">−w_clip ≤ x_clip,y_clip,z_clip ≤ w_clip<br>p_ndc = (x_clip,y_clip,z_clip) / w_clip</div><p>本课使用OpenGL/WebGL约定，NDC三个轴都在[−1,1]。跨过裁剪面的线段会产生新端点，不是简单地“只要任一顶点在外面就扔掉整个物体”。本实验确实在四维空间切线段，再做除法。</p>'},
 {title:'正交投影与视口，各自做什么？',html:'<p>正交投影保留平行关系，屏幕尺寸不随深度改变。它适合技术视图或某些地图，但同样需要观察变换、裁剪和深度测试。本课正交模式固定竖直范围[−3,3]，因此FOV滑块只影响透视模式。</p><div class="formula">x_pixel = (x_ndc + 1) W/2<br>y_window = (y_ndc + 1) H/2</div><p>W、H为视口宽高。这是OpenGL窗口坐标的左下原点写法；Canvas绘图以左上为原点，所以本图显式翻转Y。若把两种坐标混用，画面可能上下翻转。视口映射不负责产生近大远小。</p><details><summary>延伸：FOV与相机内参怎样联系？</summary><p>在对称针孔模型且主点位于图像中心时，f_y(pixel)=H/[2 tan(φ/2)]。一般重建相机的主点、非对称视锥、图像缩放与畸变还需单独处理；本实验没有镜头畸变。</p></details>'}
 ],
 lab:{title:'双视图：观察空间与真正裁剪后的投影',description:'左侧把观察空间的前向距离画成剖面，右侧显示经四维裁剪后的线框。两个立方体边长相同，后一个更远。比较投影方式、距离、FOV和近远面。',
 controls:[{id:'mode',label:'投影方式',type:'select',options:[{value:'perspective',label:'透视投影'},{value:'orthographic',label:'正交投影（固定高度6）'}],value:'perspective'},{id:'distance',label:'相机Z位置',type:'range',min:1.2,max:10,step:.1,value:5},{id:'cameraX',label:'相机X位置（朝向固定）',type:'range',min:-2,max:2,step:.1,value:0},{id:'fov',label:'竖直FOV（度，仅透视）',type:'range',min:25,max:100,step:1,value:50},{id:'near',label:'近裁剪面 n',type:'range',min:.1,max:4,step:.1,value:.5},{id:'far',label:'远裁剪面 f',type:'range',min:8,max:30,step:1,value:15}],
 prelude:`const clipSegment=(a,b)=>{
  let lo=0,hi=1;
  for(const plane of [p=>p[3]+p[0],p=>p[3]-p[0],p=>p[3]+p[1],p=>p[3]-p[1],p=>p[3]+p[2],p=>p[3]-p[2]]){
    const da=plane(a),db=plane(b); if(da<0&&db<0)return null;
    if((da<0)!==(db<0)){const t=da/(da-db);if(da<0)lo=Math.max(lo,t);else hi=Math.min(hi,t);}
  }
  if(lo>hi)return null;
  return [lo,hi].map(t=>a.map((v,i)=>v+t*(b[i]-v)));
};
const edges=[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
const corners=[[-1,-1,-1,1],[1,-1,-1,1],[1,1,-1,1],[-1,1,-1,1],[-1,-1,1,1],[1,-1,1,1],[1,1,1,1],[-1,1,1,1]];
`,
 code:`const n=input.near, f=input.far;
const P=input.mode==='perspective'
  ? perspective4(input.fov*Math.PI/180,1,n,f)
  : [1/3,0,0,0, 0,1/3,0,0, 0,0,-2/(f-n),0, 0,0,-(f+n)/(f-n),1];
const V=translate4(-input.cameraX,0,-input.distance);
const cubes=[[-1.3,0,0],[1.3,0,-3]].map(center=>{
  const view=corners.map(p=>transform4(V,[p[0]*.7+center[0],p[1]*.7,p[2]*.7+center[2],1]));
  const clip=view.map(p=>transform4(P,p));
  const segments=edges.map(([i,j])=>clipSegment(clip[i],clip[j])).filter(Boolean)
    .map(pair=>pair.map(p=>p.slice(0,3).map(x=>x/p[3])));
  return {view,segments,sample:clip[6]};
});
return {cubes};`,
 codeHelp:'V只做相机平移的逆；P负责投影。clipSegment对六个齐次平面切线段。将最后的x/p[3]改为x，观察忘记透视除法时结果如何失真；只对可见线段做除法，避免相机后方点的数值误用。',
 paint(canvas,r,s){canvas.width=900;canvas.height=560;const c=canvas.getContext('2d');c.fillStyle='#f8faf4';c.fillRect(0,0,900,560);c.font='20px sans-serif';c.fillStyle='#233c35';c.fillText('观察空间剖面：横向X / 向下为前向距离d',20,35);c.fillText('投影结果：NDC → 视口',490,35);const x=v=>205+65*v, y=d=>85+28*d;const plotMax=14;c.fillStyle='#e1ead8';c.fillRect(25,y(s.near),370,Math.max(0,Math.min(475,y(s.far))-y(s.near)));c.strokeStyle='#8c9f88';c.strokeRect(25,65,370,410);for(const [d,name]of [[s.near,'near'],[s.far,'far']])if(d<plotMax){c.strokeStyle='#b7654f';c.beginPath();c.moveTo(25,y(d));c.lineTo(395,y(d));c.stroke();c.fillStyle='#9a4c35';c.font='16px sans-serif';c.fillText(name+' '+d,30,y(d)-6);}c.fillStyle='#233c35';c.beginPath();c.arc(x(0),75,5,0,Math.PI*2);c.fill();c.fillText('相机',x(0)+12,80);const edges=[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];r.cubes.forEach((cube,i)=>{c.strokeStyle=i?'#b7654f':'#28765d';c.lineWidth=2;for(const[a,b]of edges){c.beginPath();c.moveTo(x(cube.view[a][0]),y(-cube.view[a][2]));c.lineTo(x(cube.view[b][0]),y(-cube.view[b][2]));c.stroke();}c.font='17px sans-serif';c.fillStyle=c.strokeStyle;c.fillText(i?'后方B':'前方A',x(cube.view[6][0])+5,y(-cube.view[6][2]));});const vp={x:475,y:70,w:390};c.strokeStyle='#728771';c.strokeRect(vp.x,vp.y,vp.w,vp.w);c.save();c.beginPath();c.rect(vp.x,vp.y,vp.w,vp.w);c.clip();for(let i=1;i>=0;i--){c.strokeStyle=i?'#b7654f':'#28765d';c.lineWidth=3;for(const[a,b]of r.cubes[i].segments){c.beginPath();c.moveTo(vp.x+(a[0]+1)*vp.w/2,vp.y+(1-a[1])*vp.w/2);c.lineTo(vp.x+(b[0]+1)*vp.w/2,vp.y+(1-b[1])*vp.w/2);c.stroke();}}c.restore();c.fillStyle='#233c35';c.font='16px monospace';const q=r.cubes[0].sample;c.fillText('A角点 clip: '+q.map(v=>v.toFixed(2)).join(', '),20,516);c.fillText('w = '+q[3].toFixed(2)+'；可见线段 A/B = '+r.cubes.map(c=>c.segments.length).join(' / '),20,541);},
 verify:(r,s)=>'A/B保留下来的线段数：'+r.cubes.map(c=>c.segments.length).join(' / ')+'。线框经过几何裁剪，不代表完成隐藏面消除；正交模式的FOV不参与计算。',
 presets:[{label:'比较近大远小',values:{distance:5,fov:50,near:.5,far:15,mode:'perspective'}},{label:'近面切入模型',values:{distance:2,near:2.2,far:15,mode:'perspective'}},{label:'正交：改变距离不改大小',values:{mode:'orthographic',distance:7,near:.5,far:20}}],
 takeaway:'把相机运动、投影方式、可见性与屏幕映射分开查，先看观察空间坐标和w，再解释最终图。',limitation:'CPU线段投影和齐次裁剪的教学实验，未做面光栅化、遮挡、畸变或完整lookAt旋转；左侧剖面省略Y，超出显示深度范围的far线不绘制。'},
 tasks:[{title:'距离翻倍，大小是否真的减半？',prompt:'保持透视FOV不变，选两个相机距离，分别计算A/B中心的前向距离和预测尺寸比；再对照图形。注意相机Z位置翻倍不等于每个物体的距离都翻倍。',hint:'B在世界Z=−3，距离应是相机Z+3。'},{title:'用裁剪平面解释“模型缺了一部分”',prompt:'运行近面切入预设，画出剖面中near与立方体的相对位置；解释为何不能只用任意一个顶点的可见性判断整个模型。',hint:'一个边的两端可分处平面两侧，需要产生交点。'},{title:'连接重建内参',prompt:'假设图像高1080像素、竖直FOV60°、主点在中心，求f_y；再说明若图像缩放到540像素高，内参应如何更新。',hint:'角度不变，像素焦距随图像高度同比缩放。'}],
 quiz:[
 {question:'观察变换V主要做什么？',options:['决定材质颜色','把世界位置表达为相机坐标','直接把三角形变成像素'],answer:1,explanation:'V负责坐标表达；投影、光栅化和着色是其他步骤。'},
 {question:'相机向−Z看，前方点通常满足什么？',options:['z_view<0，透视w=−z_view>0','z_view>0且w必为1','z_view永远等于深度缓冲值'],answer:0,explanation:'这是本课OpenGL右手观察空间约定，不是所有引擎的统一轴约定。'},
 {question:'FOV增大而其他条件固定，物体通常怎样？',options:['变大','变小，视野变宽','位置与大小完全不变'],answer:1,explanation:'f=1/tan(FOV/2)减小，投影尺度随之减小。'},
 {question:'裁剪与透视除法的概念顺序是？',options:['先除以w，再按像素裁剪','先在齐次空间裁剪，再除以w','两者可任意交换且不需前提'],answer:1,explanation:'本实验先执行−w≤x,y,z≤w，再对保留的几何除w。'},
 {question:'正交模式里相机后退，未触发裁剪时模型尺寸怎样？',options:['一定减半','保持不变','随深度二次增长'],answer:1,explanation:'固定正交范围下没有1/d的透视尺度项。'},
 {question:'OpenGL/WebGL默认约定下的NDC深度范围是？',options:['[0,1]','[−1,1]','任意正实数'],answer:1,explanation:'NDC z在[−1,1]，默认窗口深度随后映射到[0,1]。'}],
 misconceptions:['把后退相机等同于改变FOV：多深度物体的相对尺度可区分两者。','把gl_Position直接当屏幕像素：中间还有裁剪、除w与视口。','以为near只是画面上的一条线：它会切除几何，且影响下一周讨论的深度精度。'],next:'下一阶段从连续的三角形进入离散像素。先确认自己能解释坐标阶段，再学习覆盖规则和插值。',
 sources:[{title:'LearnOpenGL · Coordinate Systems',url:'https://learnopengl.com/Getting-started/Coordinate-Systems',why:'观察、投影、裁剪与透视除法。'},{title:'LearnOpenGL · Camera',url:'https://learnopengl.com/Getting-started/Camera',why:'相机方向与观察坐标的补充。'}]
};
