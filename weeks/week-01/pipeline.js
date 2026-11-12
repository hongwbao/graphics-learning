/* 教学图解：固定的透视相机、两个三角形、CPU 裁剪/覆盖/深度计算。
 * 独立于 WebGL 场景；不声称是 GPU 内部过程或实际片段执行顺序的读回。
 */
'use strict';
(() => {
  const $ = selector => document.querySelector(selector);
  const size = 10;
  const palette = {a:'#368a73', b:'#b7654f', ink:'#233c35', line:'#c6d3c2', paper:'#f8faf4', sample:'#9a541c'};
  const region = {x:85, y:24, w:280, h:280};
  const state = {stage:0, shift:.45, col:5, row:5, depth:true, order:'ab'};
  const positions = {
    a:[[-1.2,-1,-2],[1.1,-.8,-2.2],[-.3,1.1,-2.5]],
    b:[[-.6,-1,-3.4],[1.8,-.8,-3.7],[.8,1.5,-3.8]]
  };
  // 列向量，V=I，M 只做 X 平移，P 的 f=1.6、near=1、far=8。
  function project(point, tx) {
    const [x,y,z] = point, near=1, far=8;
    return [1.6*(x+tx),1.6*y,(far+near)/(near-far)*z+2*far*near/(near-far),-z];
  }
  function clipPolygon(points) {
    let polygon = points.map(p => [...p]);
    // WebGL 裁剪空间的六个平面：-w <= x,y,z <= w。
    for (const distance of [p=>p[3]+p[0],p=>p[3]-p[0],p=>p[3]+p[1],p=>p[3]-p[1],p=>p[3]+p[2],p=>p[3]-p[2]]) {
      const next=[];
      for(let i=0;i<polygon.length;i++) {
        const a=polygon[i],b=polygon[(i+1)%polygon.length],da=distance(a),db=distance(b);
        if(da>=0) next.push(a);
        if((da>=0)!==(db>=0)) {
          const t=da/(da-db);
          next.push(a.map((v,j)=>v+t*(b[j]-v)));
        }
      }
      polygon=next;
    }
    return polygon;
  }
  const divide = p => [p[0]/p[3],p[1]/p[3],p[2]/p[3]];
  function geometry() {
    return ['a','b'].map(id=>{
      const clip=positions[id].map(p=>project(p,id==='a'?state.shift:0));
      return {id,clip,raw:clip.map(divide),polygon:clipPolygon(clip).map(divide)};
    });
  }
  function barycentric(p,a,b,c) {
    const denominator=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);
    if(Math.abs(denominator)<1e-10) return null;
    const u=((b[1]-c[1])*(p[0]-c[0])+(c[0]-b[0])*(p[1]-c[1]))/denominator;
    const v=((c[1]-a[1])*(p[0]-c[0])+(a[0]-c[0])*(p[1]-c[1]))/denominator;
    return [u,v,1-u-v];
  }
  function candidates(col,row,meshes) {
    const p=[-1+(col+.5)*2/size,1-(row+.5)*2/size], fragments=[];
    for(const mesh of meshes) {
      // 裁剪后的多边形用扇形三角化；窗口深度 z/w 在屏幕上做线性插值。
      for(let i=1;i<mesh.polygon.length-1;i++) {
        const vertices=[mesh.polygon[0],mesh.polygon[i],mesh.polygon[i+1]];
        const weights=barycentric(p,...vertices);
        if(weights && weights.every(w=>w>=-1e-8)) {
          const depth=weights.reduce((total,w,j)=>total+w*vertices[j][2],0)*.5+.5;
          fragments.push({id:mesh.id,depth});
          break;
        }
      }
    }
    return fragments;
  }
  function winner(fragments) {
    const ordered=(state.order==='ab'?['a','b']:['b','a']).map(id=>fragments.find(f=>f.id===id)).filter(Boolean);
    let current=null;
    for(const fragment of ordered) if(!current || !state.depth || fragment.depth<current.depth) current=fragment;
    return current;
  }
  function context(id) {
    const canvas=$(id),dpr=Math.min(devicePixelRatio||1,2);
    canvas.width=480*dpr;canvas.height=350*dpr;
    const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);
    ctx.fillStyle=palette.paper;ctx.fillRect(0,0,480,350);
    ctx.font='14px "Noto Sans CJK SC", sans-serif';ctx.fillStyle=palette.ink;
    return ctx;
  }
  const point = p => [region.x+(p[0]+1)*region.w/2,region.y+(1-p[1])*region.h/2];
  function label(ctx,text,x,y,color=palette.ink) {ctx.fillStyle=color;ctx.fillText(text,x,y);}
  function arrow(ctx,a,b,color=palette.ink) {
    ctx.strokeStyle=color;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();
    const angle=Math.atan2(b[1]-a[1],b[0]-a[0]);ctx.beginPath();ctx.moveTo(...b);ctx.lineTo(b[0]-8*Math.cos(angle-.4),b[1]-8*Math.sin(angle-.4));ctx.moveTo(...b);ctx.lineTo(b[0]-8*Math.cos(angle+.4),b[1]-8*Math.sin(angle+.4));ctx.stroke();
  }
  function polygon(ctx,points,color,fill=true) {
    if(!points.length)return;
    ctx.beginPath();points.map(point).forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();
    ctx.strokeStyle=color;ctx.lineWidth=2;
    if(fill){ctx.globalAlpha=.18;ctx.fillStyle=color;ctx.fill();ctx.globalAlpha=1;}ctx.stroke();
  }
  function frame(ctx,grid=false) {
    ctx.strokeStyle=palette.line;ctx.lineWidth=1;
    if(grid)for(let i=1;i<size;i++) {const x=region.x+i*region.w/size,y=region.y+i*region.h/size;ctx.beginPath();ctx.moveTo(x,region.y);ctx.lineTo(x,region.y+region.h);ctx.moveTo(region.x,y);ctx.lineTo(region.x+region.w,y);ctx.stroke();}
    ctx.strokeStyle='#698472';ctx.strokeRect(region.x,region.y,region.w,region.h);
    label(ctx,'−1',region.x-8,325);label(ctx,'+1',region.x+region.w-14,325);label(ctx,'+Y',39,38);label(ctx,'+X',385,300);
  }
  function scene(ctx,meshes,applyModel=true) {
    const iso=p=>[235+70*(p[0]+.28*p[2]),150-60*(p[1]-.20*p[2])];
    for(const id of ['b','a']) {
      const verts=positions[id].map(p=>iso([p[0]+(id==='a'&&applyModel?state.shift:0),p[1],p[2]]));
      ctx.strokeStyle=palette[id];ctx.fillStyle=palette[id];ctx.globalAlpha=.16;ctx.beginPath();verts.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.fill();ctx.globalAlpha=1;ctx.stroke();
      verts.forEach((p,i)=>{ctx.beginPath();ctx.arc(...p,4,0,Math.PI*2);ctx.fill();label(ctx,id.toUpperCase()+i,p[0]+8,p[1]-8,palette[id]);});
    }
    arrow(ctx,[65,275],[135,275]);arrow(ctx,[65,275],[65,215]);arrow(ctx,[65,275],[105,305]);label(ctx,'X',140,280);label(ctx,'Y',59,205);label(ctx,'Z',110,315);
    label(ctx,applyModel?'位置 + 三角形连接 + 绘制参数':'局部顶点，尚未应用模型平移',95,339);
  }
  function bufferDiagram(ctx,meshes) {
    ctx.strokeStyle=palette.line;ctx.strokeRect(40,45,400,212);
    label(ctx,'顶点缓冲 · aPosition',58,73);ctx.font='13px monospace';
    positions.a.forEach((p,i)=>label(ctx,`A${i}   (${p.map(v=>v.toFixed(1)).join(', ')})`,58,112+i*35));
    ctx.font='14px "Noto Sans CJK SC", sans-serif';label(ctx,`uniform：模型平移 X = ${state.shift.toFixed(2)}`,58,238);
    arrow(ctx,[240,268],[240,292]);label(ctx,'drawArrays → 顶点处理',132,325);
  }
  function clipCoordinates(ctx,meshes) {
    label(ctx,'P · V · M：三维位置 → 四维位置',45,39);
    ctx.font='13px monospace';
    meshes[0].clip.forEach((p,i)=>{
      const y=95+i*75;
      ctx.fillStyle=palette.a;ctx.beginPath();ctx.arc(55,y-5,6,0,Math.PI*2);ctx.fill();label(ctx,`A${i}`,75,y,palette.a);
      arrow(ctx,[105,y-5],[140,y-5],palette.a);
      label(ctx,`(${p.map(v=>v.toFixed(2)).join(', ')})`,150,y);
    });
    ctx.font='14px "Noto Sans CJK SC", sans-serif';label(ctx,'分量是 x、y、z、w；还不是像素。',66,320);
  }
  function polygons(ctx,meshes,clipped,grid=false) {
    for(const mesh of [...meshes].reverse())polygon(ctx,clipped?mesh.polygon:mesh.raw,palette[mesh.id]);
    frame(ctx,grid);
    if(!clipped) {
      const p=point(meshes[0].raw[1]);ctx.fillStyle=palette.a;ctx.beginPath();ctx.arc(...p,4,0,Math.PI*2);ctx.fill();label(ctx,'A1',p[0]+5,p[1]-8,palette.a);
    } else {
      for(const p of meshes[0].polygon) {const q=point(p);ctx.fillStyle=palette.a;ctx.beginPath();ctx.arc(...q,3,0,Math.PI*2);ctx.fill();}
    }
  }
  function grid(ctx,meshes,mode) {
    const cell=region.w/size;
    for(let row=0;row<size;row++)for(let col=0;col<size;col++) {
      const f=candidates(col,row,meshes),x=region.x+col*cell,y=region.y+row*cell;
      if(!f.length)continue;
      if(mode==='coverage') {
        ctx.fillStyle=f.length>1?'#8caa97':'#cfddca';ctx.fillRect(x+1,y+1,cell-2,cell-2);
        ctx.fillStyle=palette.ink;ctx.font='12px sans-serif';ctx.fillText(String(f.length),x+10,y+18);
      } else if(mode==='candidates') {
        f.forEach((fragment,index)=>{ctx.fillStyle=palette[fragment.id];ctx.fillRect(x+1+index*(cell-2)/f.length,y+1,(cell-2)/f.length,cell-2);});
      } else {
        ctx.fillStyle=palette[winner(f).id];ctx.fillRect(x+1,y+1,cell-2,cell-2);
      }
    }
    frame(ctx,true);mark(ctx);
  }
  function mark(ctx) {
    const cell=region.w/size,x=region.x+(state.col+.5)*cell,y=region.y+(state.row+.5)*cell;
    ctx.strokeStyle=palette.sample;ctx.lineWidth=2;ctx.strokeRect(x-cell/2+1,y-cell/2+1,cell-2,cell-2);
    ctx.fillStyle='#fff9e9';ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fill();ctx.stroke();
  }
  const stageInfo=[
    ['三维场景与顶点','CPU 提交的数据','CPU 准备好位置、连接和参数，发出一次绘制。','左图是三维位置的轴测示意，不是相机输出；右图只列 A 的三条记录。B 同样需要提交。'],
    ['待处理的顶点','四维裁剪坐标','顶点处理改变坐标表达；还没有给三角形填像素。','本图相机 V=I，模型 M 只沿 X 平移。固定透视投影 f=1.6，near=1，far=8。w = −z_view；拖动滑块后对照 A1 的 x 与 w。'],
    ['裁剪前几何（辅助投影）','裁剪并除以 w 后','超出边界的部分被切掉，可能产生新的边界顶点。','左图为便于看边界，将裁剪前顶点也画到 x/w、y/w 平面；实际计算先执行 −w≤x,y,z≤w 的四维裁剪，再除以 w。点是几何顶点。'],
    ['连续三角形 + 采样网格','哪些中心被覆盖？','连续表面变成离散候选片段，数字是此处覆盖的表面数。','10×10 格子每格只取中心一个采样；1 表示一个候选，2 表示两个候选。此步还没有颜色与深度淘汰。边界规则与 MSAA 留待后续。'],
    ['候选片段（覆盖数）','每个候选的颜色','每个候选得到颜色；两个颜色都可能算出，但不会都留下。','同一格的左右两色仅表示两个候选的并列展示，不是像素里真实出现两块颜色。本图用固定色，专注区分“算出颜色”和“最终可见”。'],
    ['已算出颜色的候选','深度筛选后的图像','比较同一位置的深度，留下通过测试的颜色。','默认深度范围 [0,1]，清除值 1，比较函数 LESS。打开测试时较小深度胜出；关闭时最后提交者覆盖。GPU 可提前执行部分深度测试，图中顺序是概念数据流。']
  ];
  function render() {
    const meshes=geometry(),left=context('#pipeline-input'),right=context('#pipeline-output');
    const [inputTitle,outputTitle,caption,note]=stageInfo[state.stage];
    $('#pipeline-in-title').textContent='输入 · '+inputTitle;$('#pipeline-out-title').textContent='输出 · '+outputTitle;
    $('#stage-caption').textContent=`${state.stage+1} / 6 · ${caption}`;$('#pipeline-note').textContent=note;
    $('#pipeline-input').setAttribute('aria-label',inputTitle+'。'+caption);$('#pipeline-output').setAttribute('aria-label',outputTitle+'。'+note);
    $('#stage-prev').disabled=state.stage===0;$('#stage-next').disabled=state.stage===5;
    $('#triangle-shift-value').value=state.shift.toFixed(2);
    if(state.stage===0){scene(left,meshes);bufferDiagram(right,meshes);}
    if(state.stage===1){scene(left,meshes,false);clipCoordinates(right,meshes);}
    if(state.stage===2){polygons(left,meshes,false);polygons(right,meshes,true);}
    if(state.stage===3){polygons(left,meshes,true,true);mark(left);grid(right,meshes,'coverage');}
    if(state.stage===4){grid(left,meshes,'coverage');grid(right,meshes,'candidates');}
    if(state.stage===5){grid(left,meshes,'candidates');grid(right,meshes,'final');}
    const fragments=candidates(state.col,state.row,meshes),visible=winner(fragments),ndc=[-1+(state.col+.5)*.2,1-(state.row+.5)*.2];
    let text=`追踪第 ${state.row+1} 行、第 ${state.col+1} 列中心：NDC (${ndc.map(x=>x.toFixed(2)).join(', ')})。`;
    if(state.stage<3)text+=' 该位置将在光栅化之后参与覆盖判定；点“下一步”继续。';
    else if(!fragments.length)text+=' 无三角形覆盖 → 没有候选 → 保留背景。';
    else {
      text+=` ${fragments.length} 个候选：`+fragments.map(f=>`${f.id.toUpperCase()}，深度 ${f.depth.toFixed(3)}`).join('；')+'。';
      if(state.stage===3)text+=' 此时只生成覆盖，尚未着色与筛选。';
      if(state.stage===4)text+=' 它们各有颜色；继续看深度步骤。';
      if(state.stage===5)text+=` ${state.depth?'按 LESS 比较':'测试关闭，按提交顺序覆盖'} → 最终 ${visible.id.toUpperCase()}。`;
    }
    $('#pipeline-sample').textContent=text;
  }
  for(const id of ['sample-column','sample-row']) {
    for(let i=0;i<size;i++){const option=document.createElement('option');option.value=i;option.textContent=i+1;$( '#'+id).append(option);}
    $('#'+id).value=5;
    $('#'+id).addEventListener('change',e=>{state[id==='sample-column'?'col':'row']=Number(e.target.value);render();});
  }
  $('#triangle-shift').addEventListener('input',e=>{state.shift=Number(e.target.value);render();});
  $('#pipeline-depth').addEventListener('change',e=>{state.depth=e.target.checked;render();});
  $('#pipeline-order').addEventListener('change',e=>{state.order=e.target.value;render();});
  for(const id of ['pipeline-input','pipeline-output'])$('#'+id).addEventListener('click',e=>{
    if(state.stage<3)return;
    const rect=e.target.getBoundingClientRect(),x=(e.clientX-rect.left)*480/rect.width,y=(e.clientY-rect.top)*350/rect.height;
    if(x<region.x||x>=region.x+region.w||y<region.y||y>=region.y+region.h)return;
    state.col=Math.floor((x-region.x)/region.w*size);state.row=Math.floor((y-region.y)/region.h*size);
    $('#sample-column').value=state.col;$('#sample-row').value=state.row;render();
  });
  window.GraphicsPipeline={
    setStage(index){state.stage=Math.max(0,Math.min(5,index));render();},
    state,
    inspect(){const meshes=geometry(),f=candidates(state.col,state.row,meshes);return {meshes,candidates:f,winner:winner(f)};}
  };
  render();
})();
