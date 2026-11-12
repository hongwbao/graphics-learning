/* 列向量、右手系。纯数学模块同时供浏览器与 Node 验证使用。 */
(function(root){
  'use strict';
  const add=(a,b)=>a.map((x,i)=>x+b[i]);
  const sub=(a,b)=>a.map((x,i)=>x-b[i]);
  const scale=(v,s)=>v.map(x=>x*s);
  const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const length=v=>Math.hypot(...v);
  const unit=v=>length(v)>0?scale(v,1/length(v)):null;
  function basis(degrees){const r=degrees*Math.PI/180,c=Math.cos(r),s=Math.sin(r);return [[c,0,-s],[0,1,0],[s,0,c]];}
  function rotate(v,degrees){return basis(degrees).reduce((r,axis,i)=>add(r,scale(axis,v[i])),[0,0,0]);}
  const toWorld=(v,t,degrees,w=1)=>add(rotate(v,degrees),scale(t,w));
  const toLocal=(p,t,degrees,w=1)=>basis(degrees).map(axis=>dot(axis,sub(p,scale(t,w))));
  function projection(a,b){const ub=unit(b);return ub?scale(ub,dot(a,ub)):null;}
  function angle(a,b){const ua=unit(a),ub=unit(b);return ua&&ub?Math.acos(Math.max(-1,Math.min(1,dot(ua,ub))))*180/Math.PI:null;}
  const api={add,sub,scale,dot,cross,length,unit,basis,rotate,toWorld,toLocal,projection,angle};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vec=api;
})(typeof window==='undefined'?globalThis:window);
