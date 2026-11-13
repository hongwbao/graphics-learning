/* 检查第8–12周核心算法；只需Node，不依赖浏览器或npm。 */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const helpers={add:(a,b)=>a.map((x,i)=>x+b[i]),sub:(a,b)=>a.map((x,i)=>x-b[i]),scale:(v,s)=>v.map(x=>x*s),dot:(a,b)=>a.reduce((z,x,i)=>z+x*b[i],0),unit:v=>{const n=Math.hypot(...v);return n?v.map(x=>x/n):null;}};
const close=(a,b,eps=1e-9)=>assert.ok(Math.abs(a-b)<eps,`${a} != ${b}`);
function lesson(n){const context={window:{},Math,Number,Infinity};vm.createContext(context);vm.runInContext(fs.readFileSync(path.resolve(__dirname,`../../week-${String(n).padStart(2,'0')}/lesson.js`),'utf8'),context);return context.window.Lesson;}
function run(L,overrides={},code=L.lab.code){const state=Object.fromEntries(L.lab.controls.map(c=>[c.id,c.value]));Object.assign(state,overrides);const input=L.lab.input?L.lab.input(state):state;const fn=new Function('input',...Object.keys(helpers),(L.lab.prelude||'')+'\n'+code);return {state,input,result:fn(input,...Object.values(helpers))};}
const L8=lesson(8),a8=run(L8),b8=run(L8,{order:'reverse'});let changed=0;for(let i=0;i<a8.result.pixels.length;i++)if(a8.result.pixels[i]!==b8.result.pixels[i])changed++;
assert.ok(a8.result.passed>0&&a8.result.candidates>a8.result.passed);assert.ok(changed<30,`深度开启时大量顺序相关像素：${changed}`);
const c8=run(L8,{depth:'off'}),d8=run(L8,{depth:'off',order:'reverse'});assert.ok(c8.result.pixels.some((v,i)=>v!==d8.result.pixels[i]));
console.log('PASS 第8周：真实候选片段、遮挡与绘制顺序；共享边的微小差别已排除为整体遮挡结论。');
const L9=lesson(9),a9=run(L9,{sx:1,sz:1,normalMode:'correct'}),b9=run(L9,{sx:1,sz:1,normalMode:'wrong'});assert.equal(JSON.stringify(a9.result.colors),JSON.stringify(b9.result.colors));
const c9=run(L9,{sx:1.6,sz:.4,normalMode:'correct'}),d9=run(L9,{sx:1.6,sz:.4,normalMode:'wrong'});assert.notEqual(JSON.stringify(c9.result.colors),JSON.stringify(d9.result.colors));
const n=[Math.SQRT1_2,0,Math.SQRT1_2],t=[1.6,0,-.4],correct=[n[0]/1.6,0,n[2]/.4],wrong=[n[0]*1.6,0,n[2]*.4];close(helpers.dot(correct,t),0);assert.ok(Math.abs(helpers.dot(wrong,t))>1);
console.log('PASS 第9周：纯旋转/均匀比例的弱测试与非均匀缩放反例；逆转置保存垂直关系。');
const L10=lesson(10),a10=run(L10,{metal:0}),b10=run(L10,{metal:1});a10.result.F0.forEach(x=>close(x,.04));b10.result.F0.forEach((x,i)=>close(x,b10.input.base[i]));for(const s of [{roughness:.05,metal:1,view:70,light:-80},{roughness:1,metal:0,view:-70,light:80}]){const r=run(L10,s).result;assert.ok(r.colors.flat().every(x=>Number.isFinite(x)&&x>=0));}
const D=(nh,r)=>{const a=Math.max(.02,r*r),a2=a*a;return a2/(Math.PI*(nh*nh*(a2-1)+1)**2);};assert.ok(D(1,.2)>D(1,.8));
console.log('PASS 第10周：F0材质端点、GGX峰值变化及极端视角/粗糙度下有限非负输出。');
const L11=lesson(11),default11=run(L11);assert.ok(default11.result.shadowFraction>.01&&default11.result.shadowFraction<.2,'默认参考须有阴影与可见接收面');assert.ok(Math.max(...default11.input.map.filter(Number.isFinite))>1,'反量化必须恢复完整光源深度范围');const a11=run(L11,{bias:0,resolution:16,slope:.2}),b11=run(L11,{bias:.35,resolution:16,slope:.2}),c11=run(L11,{pcf:'1'});assert.ok(a11.input.map.some(Number.isFinite));assert.ok(a11.result.shadowFraction>b11.result.shadowFraction);assert.ok(c11.result.visibility.every(x=>x>=0&&x<=1));assert.ok(c11.result.visibility.some(x=>x>0&&x<1));for(const x of c11.result.visibility)close(x*9,Math.round(x*9));
console.log('PASS 第11周：实际三角形光源深度图、正bias减少遮挡的比较方向、3×3 PCF平均比较结果。');
const L12=lesson(12),a12=run(L12,{samples:'1'}),b12=run(L12,{samples:'4'});close(a12.result.linear,.5);close(a12.result.correct,.7353569830524495);close(a12.result.wrong,.5);assert.equal(JSON.stringify(a12.result.left),JSON.stringify(a12.result.right));assert.ok(b12.result.right.some(x=>x>0&&x<1));
const dec=C=>C<=.04045?C/12.92:((C+.055)/1.055)**2.4,enc=L=>L<=.0031308?12.92*L:1.055*L**(1/2.4)-.055;for(const x of [0,.001,.0031308,.01,.2,.5,1])close(dec(enc(x)),x,1e-7);const c12=run(L12,{dark:.1,bright:.9,mix:.25});close(c12.result.correct,enc(.75*dec(.1)+.25*dec(.9)));
console.log('PASS 第12周：sRGB分段函数/往返、黑白0.5线性中点、一般编码端点和规则网格SSAA覆盖。');
