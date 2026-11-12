'use strict';
(()=>{
  const $=s=>document.querySelector(s),V=window.Vec;
  const scalar=x=>x===0?'0':Math.abs(x)<.001?x.toExponential(3):x.toFixed(3);
  const fmt=v=>v===null?'未定义':Array.isArray(v)?'('+v.map(scalar).join(', ')+')':scalar(v);
  const state={a:[2,1,0],b:[1,2,0],u:[1,0,0],v:[0,1,0],view:35,unit:true};
  const colors={a:'#28765d',b:'#af5038',n:'#9a6b13',ink:'#233c35',grid:'#d5dfcf'};
  function context(id){const canvas=$(id),dpr=Math.min(devicePixelRatio||1,2);canvas.width=720*dpr;canvas.height=520*dpr;const c=canvas.getContext('2d');c.scale(dpr,dpr);c.fillStyle='#f8faf4';c.fillRect(0,0,720,520);c.font='18px "Noto Sans CJK SC",sans-serif';return c;}
  function label(c,text,p,color=colors.ink){c.fillStyle=color;c.fillText(text,...p);}
  function arrow(c,a,b,color,name){const length=Math.hypot(b[0]-a[0],b[1]-a[1]);c.strokeStyle=color;c.fillStyle=color;c.lineWidth=3;c.beginPath();c.moveTo(...a);c.lineTo(...b);c.stroke();if(length>2){const angle=Math.atan2(b[1]-a[1],b[0]-a[0]);c.beginPath();c.moveTo(...b);c.lineTo(b[0]-13*Math.cos(angle-.4),b[1]-13*Math.sin(angle-.4));c.lineTo(b[0]-13*Math.cos(angle+.4),b[1]-13*Math.sin(angle+.4));c.closePath();c.fill();}if(name)label(c,name,[b[0]+9,b[1]-9],color);}
  const xy=v=>[360+50*v[0],260-50*v[1]];
  function dotData(){const projection=V.projection(state.a,state.b),residual=projection?V.sub(state.a,projection):null;return {dot:V.dot(state.a,state.b),angle:V.angle(state.a,state.b),cos:V.angle(state.a,state.b)===null?null:V.dot(V.unit(state.a),V.unit(state.b)),projection,residual,signed:V.unit(state.b)?V.dot(state.a,V.unit(state.b)):null};}
  function renderDot(){const c=context('#dot-canvas'),{a,b}=state,data=dotData();c.strokeStyle=colors.grid;c.lineWidth=1;
    for(let i=-5;i<=5;i++){c.beginPath();c.moveTo(...xy([i,-5]));c.lineTo(...xy([i,5]));c.moveTo(...xy([-6,i]));c.lineTo(...xy([6,i]));c.stroke();}
    arrow(c,xy([-6,0]),xy([6,0]),'#7e9480','X');arrow(c,xy([0,-4.5]),xy([0,4.5]),'#7e9480','Y');
    if(data.projection){c.setLineDash([6,7]);c.strokeStyle=colors.n;c.beginPath();c.moveTo(...xy(a));c.lineTo(...xy(data.projection));c.stroke();c.setLineDash([]);arrow(c,xy([0,0]),xy(data.projection),colors.n);label(c,'proj',[xy(data.projection)[0]+14,xy(data.projection)[1]+25],colors.n);}
    arrow(c,xy([0,0]),xy(a),colors.a,'a');arrow(c,xy([0,0]),xy(b),colors.b,'b');label(c,'每格 = 1 单位；本图 z = 0',[24,490]);
    $('#dot-readout').innerHTML=`<p>a · b = <strong>${fmt(data.dot)}</strong><br>cos θ = ${fmt(data.cos)} · θ = ${fmt(data.angle)}${data.angle===null?'':'°'}</p><p>有符号投影长度 = ${fmt(data.signed)}<br>投影向量 = ${fmt(data.projection)}<br>残差 = ${fmt(data.residual)}<br>残差 · b = ${fmt(data.residual?V.dot(data.residual,b):null)}</p>`;
    const warning=$('#dot-warning');warning.hidden=data.angle!==null;warning.textContent=V.length(b)===0?'b = 0：投影方向不存在，分母为零。不能用零向量作投影轴。':'a = 0：夹角不存在，但在非零 b 上的投影仍是零向量。';
  }
  function crossData(){const raw=V.cross(state.u,state.v),area=V.length(raw),denom=V.length(state.u)*V.length(state.v);return {raw,area,normal:V.unit(raw),s:denom>0?V.length(V.cross(V.unit(state.u),V.unit(state.v))):null};}
  function renderCross(){const c=context('#cross-canvas'),data=crossData(),n=state.unit?data.normal:data.raw,all=[state.u,state.v,V.add(state.u,state.v),n||[0,0,0]],max=Math.max(1,...all.map(V.length)),scale=175/max,r=state.view*Math.PI/180,pitch=.48;
    const p=v=>{const x=Math.cos(r)*v[0]+Math.sin(r)*v[2],z=-Math.sin(r)*v[0]+Math.cos(r)*v[2];return [340+scale*x,290-scale*(Math.cos(pitch)*v[1]-Math.sin(pitch)*z)];};
    for(const [axis,name]of [[[1,0,0],'X'],[[0,1,0],'Y'],[[0,0,1],'Z']]){arrow(c,p([0,0,0]),p(axis),'#79947b');const q=p(axis);label(c,name,[q[0]-18,q[1]+23],'#65816c');}
    c.fillStyle='rgba(55,138,115,.15)';c.strokeStyle=colors.a;c.lineWidth=2;c.beginPath();[[0,0,0],state.u,V.add(state.u,state.v),state.v].forEach((v,i)=>i?c.lineTo(...p(v)):c.moveTo(...p(v)));c.closePath();c.fill();c.stroke();
    arrow(c,p([0,0,0]),p(state.u),colors.a,'u');arrow(c,p([0,0,0]),p(state.v),colors.b,'v');if(n)arrow(c,p([0,0,0]),p(n),colors.n,state.unit?'n（单位）':'u × v');label(c,'绘图区自动缩放；数值长度不随视角改变',[24,490]);
    $('#cross-readout').innerHTML=`<p>u × v = <strong>${fmt(data.raw)}</strong><br>平行四边形面积 = ${fmt(data.area)}<br>三角形面积 = ${fmt(data.area/2)}<br>单位法线 = ${fmt(data.normal)}<br>|sin θ| = ${data.s===null?'未定义':data.s.toExponential(3)}</p>`;
    const w=$('#cross-warning');w.hidden=data.s!==null&&data.s>=.01;w.textContent=data.s===null?'至少一条边为零，夹角与单位法线未定义。':data.normal===null?'非零平行边仍然退化：面积为零，单位法线未定义。':'两边近平行：很小的输入扰动可能显著改变单位法线。试将 v 的微小分量改符号。';
  }
  function controls(container,keys,count){for(const key of keys){const row=document.createElement('div');row.className='vector-input-row'+(count===2?' dot-row':'');const title=document.createElement('strong');title.textContent=key;row.append(title);for(let i=0;i<count;i++){const label=document.createElement('label'),name=document.createElement('span'),input=document.createElement('input');name.textContent=['X','Y','Z'][i];input.type='number';input.step='any';input.min=-4;input.max=4;input.value=state[key][i];input.id=key+'-'+i;input.setAttribute('aria-label',key+' 的 '+name.textContent+' 分量');input.addEventListener('input',()=>{const value=input.valueAsNumber;if(!Number.isFinite(value))return;state[key][i]=Math.max(-4,Math.min(4,value));if(state[key][i]!==value)input.value=state[key][i];count===2?renderDot():renderCross();});label.append(name,input);row.append(label);}$(container).append(row);}}
  function sync(){for(const key of ['a','b','u','v'])for(let i=0;i<(key==='a'||key==='b'?2:3);i++)$('#'+key+'-'+i).value=state[key][i];renderDot();renderCross();}
  controls('#dot-inputs',['a','b'],2);controls('#cross-inputs',['u','v'],3);
  $('#scale-b').addEventListener('click',()=>{state.b=V.scale(state.b,-1);sync();});$('#dot-reset').addEventListener('click',()=>{state.a=[2,1,0];state.b=[1,2,0];sync();});
  $('#swap-cross').addEventListener('click',()=>{[state.u,state.v]=[state.v,state.u];sync();});$('#parallel-cross').addEventListener('click',()=>{state.u=[1,0,0];state.v=[1,.001,0];sync();});
  $('#cross-view').addEventListener('input',e=>{state.view=Number(e.target.value);renderCross();});$('#unit-normal').addEventListener('change',e=>{state.unit=e.target.checked;renderCross();});
  let dragging=null;const canvas=$('#dot-canvas');
  const pointer=e=>{const r=canvas.getBoundingClientRect();return [(e.clientX-r.left)*720/r.width,(e.clientY-r.top)*520/r.height];};
  canvas.addEventListener('pointerdown',e=>{const q=pointer(e);for(const key of ['a','b']){const p=xy(state[key]);if(Math.hypot(q[0]-p[0],q[1]-p[1])<28){dragging=key;canvas.setPointerCapture(e.pointerId);break;}}});
  canvas.addEventListener('pointermove',e=>{if(!dragging)return;const q=pointer(e);state[dragging]=[Math.max(-4,Math.min(4,(q[0]-360)/50)),Math.max(-4,Math.min(4,(260-q[1])/50)),0].map(x=>Math.round(x*100)/100);sync();});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>dragging=null);
  window.VectorDiagrams={state,dotData,crossData,sync};sync();
})();
