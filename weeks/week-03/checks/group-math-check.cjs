/* 3–7周的已知数值与不变量检查；使用共享runtime实际提供的数学helper。 */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const base=path.resolve(__dirname,'../..');
const shared=fs.readFileSync(path.join(base,'shared/runtime.js'),'utf8');
const helperSource=shared.slice(shared.indexOf('const helpers=`')+'const helpers=`'.length,shared.indexOf('`;\nconst workerSource'));
function load(week){const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(base,`week-${String(week).padStart(2,'0')}/lesson.js`),'utf8'),context);return context.window.Lesson;}
function run(week,override={}){const l=load(week),input=Object.fromEntries(l.lab.controls.map(c=>[c.id,c.value]));Object.assign(input,override);return new Function('input',helperSource+'\n'+(l.lab.prelude||'')+'\n'+l.lab.code)(input);}
const close=(a,b,eps=1e-8)=>assert.ok(Math.abs(a-b)<eps,`${a} != ${b}`);
let r=run(3,{angle:90,tx:2,size:1});close(r.centerTR[0],2);close(r.centerTR[1],0);close(r.centerRT[0],0);close(r.centerRT[1],2);
r=run(3,{angle:0});r.tr.flat().forEach((x,i)=>close(x,r.rt.flat()[i]));
for(const mode of ['perspective','orthographic']){r=run(4,{mode});assert.ok(r.cubes.every(c=>c.segments.length>0));for(const cube of r.cubes)for(const segment of cube.segments)for(const p of segment)assert.ok(p.every(x=>Number.isFinite(x)&&Math.abs(x)<=1+1e-8));}
const orthoNear=run(4,{mode:'orthographic',distance:4}),orthoFar=run(4,{mode:'orthographic',distance:8});close(orthoNear.cubes[0].segments[0][0][0],orthoFar.cubes[0].segments[0][0][0]);
r=run(5);close(r.selected.weights.reduce((a,b)=>a+b,0),1);assert.ok(r.cells.length>0);r=run(5,{cy:.15});assert.equal(r.selected.weights,null);assert.equal(r.cells.length,0);
const affine=run(5,{wB:1,mode:'affine'}),perspective=run(5,{wB:1,mode:'perspective'});affine.selected.color.forEach((x,i)=>close(x,perspective.selected.color[i]));
r=run(6,{near:.1,far:500,distance:.1});close(r.z,0);r=run(6,{near:.1,far:500,distance:500});close(r.z,1);
const coarse=run(6,{bits:12}),fine=run(6,{bits:24});assert.ok(coarse.cells.filter(c=>c.tie).length>=fine.cells.filter(c=>c.tie).length);
const orderAB=run(6,{separation:0,slope:0,order:'ab'}),orderBA=run(6,{separation:0,slope:0,order:'ba'});assert.ok(orderAB.cells.every(c=>c.actual===1));assert.ok(orderBA.cells.every(c=>c.actual===2));
r=run(7,{footprint:1});assert.equal(r.levels.length,7);assert.equal(r.levels.at(-1).n,1);close(r.lod,0);assert.ok(r.panels.every(p=>p.pixels.length===p.width*p.height*4));
const tex=r.levels[0].data,avg=tex.reduce((a,b)=>a+b,0)/tex.length;close(r.levels.at(-1).data[0],avg);
r=run(7,{footprint:8});close(r.lod,3);assert.equal(r.low,3);assert.ok(r.panels.every(p=>Number.isFinite(p.change)&&p.change>=0));
console.log('PASS: 第3周矩阵已知值/交换特例；第4周裁剪范围/正交距离不变；第5周权重/退化/同w；第6周端点映射/位深/LESS平局；第7周mip守恒/LOD/像素数据。');
