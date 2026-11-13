const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const lesson={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../lesson.js'),'utf8'),lesson);const L=lesson.window.Lesson;
const V=`const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),scale=(a,s)=>a.map(v=>v*s),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],unit=a=>{const n=Math.hypot(...a);return n?a.map(v=>v/n):null;};`;
const api=new Function(V+L.lab.prelude+';return {randomGenerator,cosineDirection};')(),rng=api.randomGenerator(17),normal=[0,1,0];let sum=0;
for(let i=0;i<20000;i++){const d=api.cosineDirection(normal,rng),cos=d[1];assert.ok(cos>=-1e-12);assert.ok(Math.abs(Math.hypot(...d)-1)<1e-12);sum+=cos;if(cos>1e-10){const rho=.63,weight=(rho/Math.PI)*cos/(cos/Math.PI);assert.ok(Math.abs(weight-rho)<1e-12);}}
assert.ok(Math.abs(sum/20000-2/3)<.01,'cosine-weighted hemisphere E[cos] should be 2/3');
const run=new Function('input',V+L.lab.prelude+'\n'+L.lab.code),input={samples:'1',depth:3,seed:7,indirect:'on',exposure:1};
const a=run(input),b=run(input);assert.deepEqual(a.pixels,b.pixels);assert.equal(a.meanLinear,b.meanLinear);assert.ok(a.rays>96*64);
const exposed=run({...input,exposure:2});assert.equal(a.meanLinear,exposed.meanLinear);assert.notDeepEqual(a.pixels,exposed.pixels);
const more=run({...input,samples:'4'});assert.ok(more.rays>a.rays);assert.notDeepEqual(more.pixels,a.pixels);
const direct=run({...input,indirect:'off'});assert.notEqual(direct.meanLinear,a.meanLinear);
console.log('PASS: cosine distribution E[cos]≈'+(sum/20000).toFixed(4)+' / Lambert f*cos/pdf=albedo / seeded image reproducibility / exposure separation / true sample paths / indirect contribution.');
