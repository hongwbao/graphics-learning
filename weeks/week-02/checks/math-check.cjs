const assert=require('node:assert/strict');
const V=require('../math.js');
const close=(a,b,eps=1e-9)=>{if(Array.isArray(a)){assert.equal(a.length,b.length);a.forEach((x,i)=>close(x,b[i],eps));}else assert.ok(Math.abs(a-b)<eps,`${a} != ${b}`);};
close(V.toWorld([1,2,0],[2,0,-1],90),[2,2,-2]);close(V.toWorld([1,0,0],[2,0,-1],90,0),[0,0,-1]);
close(V.projection([2,1,0],[1,2,0]),[.8,1.6,0]);assert.equal(V.unit([0,0,0]),null);assert.equal(V.angle([0,0,0],[1,0,0]),null);assert.equal(V.projection([1,2,3],[0,0,0]),null);close(V.projection([0,0,0],[1,2,0]),[0,0,0]);
close(V.cross([1,0,0],[0,1,0]),[0,0,1]);close(V.cross([1,0,0],[2,0,0]),[0,0,0]);
// 不变量测试：刚体逆变换、长度保持、投影轴缩放不变、残差正交、叉积反交换。
for(let i=1;i<=80;i++){
 const a=[Math.sin(i),Math.cos(i*.3),i/31],b=[1+i/50,Math.sin(i*.7),Math.cos(i*.6)],t=[i/7,-i/9,i/11],yaw=i*7;
 close(V.toLocal(V.toWorld(a,t,yaw),t,yaw),a);close(V.length(V.rotate(a,yaw)),V.length(a));
 close(V.sub(V.toWorld(a,t,yaw),V.toWorld(b,t,yaw)),V.toWorld(V.sub(a,b),t,yaw,0));
 close(V.projection(a,V.scale(b,-3)),V.projection(a,b));close(V.dot(V.sub(a,V.projection(a,b)),b),0);
 const n=V.cross(a,b);close(V.dot(n,a),0);close(V.dot(n,b),0);close(V.cross(b,a),V.scale(n,-1));
}
console.log('PASS: 手算已知值、零向量/退化与 80 组几何不变量。');
