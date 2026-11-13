'use strict';
window.Lesson={
 week:7,title:'纹理与采样',subtitle:'远处的棋盘为什么会闪烁，而不是自然变成灰色？',intro:'一张纹理有固定数量的texel，屏幕像素却可能同时覆盖它的许多格。你将把UV、纹理采样与足迹大小分开，比较最近邻、双线性与真正构建的mipmap，解释模糊和闪烁各自来自哪里。',time:'8–10 小时',
 goals:['区分texel、UV与屏幕像素，说明放大/缩小时过滤器看到的采样足迹。','实现重复寻址、双线性插值、2×2均值mipmap与相邻层混合。','用小幅UV位移比较采样稳定性，指出mipmap与各向异性过滤各自解决什么问题。'],
 sections:[
 {title:'UV不是像素坐标，纹理也不是模型本身',html:'<p>UV把模型表面位置映射到二维图像参数。u、v在[0,1]内通常覆盖纹理的一份范围，但重复寻址允许超出这个区间。texel是纹理中的离散元素，屏幕像素是输出图像中的离散位置，两者不是一一对应。</p><p>若一个屏幕像素只跨过0.5个texel，是纹理放大；若跨过8个texel，是缩小。一次最近邻采样仍然只选一个texel，所以在缩小时很可能错过其他texel所包含的变化。</p>'},
 {title:'最近邻与双线性，都是局部重建规则',html:'<p>最近邻直接取最近texel的值，边界会突然跳变。双线性在纹理二维网格的四个邻居之间插值；设小数偏移为α、β：</p><div class="formula">q = (1−β)[(1−α)q₀₀ + αq₁₀]<br>+ β[(1−α)q₀₁ + αq₁₁]</div><p>α、β是相对相邻texel中心的位置。本实验使用x=uN−0.5的中心约定，N为该层纹理宽度。双线性能平滑放大时的块状边界，但缩小时仍只取基础层的局部四点，并不自动平均一个大足迹。</p>'},
 {title:'mipmap是预先缩小的一组纹理',html:'<p>从64×64基础图开始，每层对2×2区域取均值，生成32×32、16×16，直到1×1。这些是实际计算出来的层，不是给最终画面套模糊滤镜。</p><div class="formula">λ ≈ log₂ ρ<br>q = (1−t) sample(level⌊λ⌋) + t sample(level⌊λ⌋+1)</div><p>ρ为每个屏幕像素覆盖的texel数量的线性尺度，λ是层级，t为λ的小数部分。本课足迹是等比例、无旋转的正方形，因此用一个ρ即可。每层内部再做双线性，相邻层间插值通常称三线性过滤。</p><p>越远的纹理需要舍弃无法由输出像素可靠表达的高频细节。mipmap提高稳定性不是恢复细节；如果误选过粗的层，近处也会过度模糊。</p>'},
 {title:'从“看起来闪”变成可验证的采样问题',html:'<p>固定纹理和缩放，只让UV有极小偏移。如果输出颜色大幅改变，可提出“采样不足、基础层过滤不匹配足迹”的假设。实验同时显示三种过滤，避免用不同图像或不同参数比较。</p><p>本课还计算一小步Δu=1/256前后采样值的平均绝对变化，作为条件性的数值对照。它不等价于人眼感知的全部闪烁指标，也不能证明某个设置对所有纹理都更好。</p><details><summary>延伸：斜着看地面为何仍模糊？</summary><p>斜面足迹通常是细长形状，单一方形mip层可能沿一轴过度模糊、另一轴仍采样不足。各向异性过滤沿主要方向增加合适的采样。本实验只做各向同性足迹，不能用它评估真实斜视纹理质量。</p></details>'}
 ],
 lab:{title:'同一张纹理，三种采样规则并排',description:'三个输出始终使用相同UV、纹理与采样足迹。调大ρ进入缩小，再轻推UV相位；最近邻/双线性/三线性mipmap结果来自各自真实采样函数。',
 controls:[{id:'footprint',label:'每像素覆盖的texel尺度 ρ',type:'range',min:.25,max:16,step:.25,value:5.25},{id:'offset',label:'UV的u偏移（重复寻址）',type:'range',min:0,max:1,step:.00390625,value:.125},{id:'frequency',label:'64×64棋盘的格数',type:'range',min:2,max:32,step:2,value:16}],
 prelude:`// 采样脚手架：纹理层、重复寻址和固定输出采样网格。
const wrap=(i,n)=>((i%n)+n)%n;
function buildTexture(cells){const data=new Float64Array(64*64);for(let y=0;y<64;y++)for(let x=0;x<64;x++)data[y*64+x]=(Math.floor(x*cells/64)+Math.floor(y*cells/64))%2?.12:.9;return {n:64,data};}
function buildMips(base){const levels=[base];while(levels.at(-1).n>1){const prev=levels.at(-1),n=prev.n/2,data=new Float64Array(n*n);for(let y=0;y<n;y++)for(let x=0;x<n;x++)data[y*n+x]=(prev.data[(2*y)*prev.n+2*x]+prev.data[(2*y)*prev.n+2*x+1]+prev.data[(2*y+1)*prev.n+2*x]+prev.data[(2*y+1)*prev.n+2*x+1])/4;levels.push({n,data});}return levels;}
const at=(tex,x,y)=>tex.data[wrap(y,tex.n)*tex.n+wrap(x,tex.n)];
const nearest=(tex,u,v)=>at(tex,Math.floor(u*tex.n),Math.floor(v*tex.n));
function bilinear(tex,u,v){const x=u*tex.n-.5,y=v*tex.n-.5,x0=Math.floor(x),y0=Math.floor(y),a=x-x0,b=y-y0;return (1-b)*((1-a)*at(tex,x0,y0)+a*at(tex,x0+1,y0))+b*((1-a)*at(tex,x0,y0+1)+a*at(tex,x0+1,y0+1));}
function image(sample){const width=180,height=160,pixels=new Uint8ClampedArray(width*height*4);let change=0;for(let y=0;y<height;y++)for(let x=0;x<width;x++){const u=.5+(x+.5-width/2)*input.footprint/64+input.offset,v=.5+(y+.5-height/2)*input.footprint/64;const value=sample(u,v);change+=Math.abs(sample(u+1/256,v)-value);const i=(y*width+x)*4;pixels[i]=pixels[i+1]=pixels[i+2]=Math.round(Math.max(0,Math.min(1,value))*255);pixels[i+3]=255;}return {width,height,pixels,change:change/(width*height)};}`,
 code:`const levels=buildMips(buildTexture(input.frequency));
const lod=Math.max(0,Math.min(levels.length-1,Math.log2(input.footprint)));
const low=Math.floor(lod),high=Math.min(low+1,levels.length-1),t=lod-low;
const trilinear=(u,v)=>(1-t)*bilinear(levels[low],u,v)+t*bilinear(levels[high],u,v);
return {lod,low,high,t,levels:levels.map(tex=>({n:tex.n,data:Array.from(tex.data)})),
  panels:[image((u,v)=>nearest(levels[0],u,v)),
          image((u,v)=>bilinear(levels[0],u,v)),image(trilinear)]};`,
 codeHelp:'核心可直接改层级选择与混合：把lod改为0会禁用mipmap选择；加1会偏向更粗层。先预测稳定性与模糊的取舍。脚手架中展示双线性和2×2均值构层，下载代码后可进一步修改。',
 paint(canvas,r,s){canvas.width=900;canvas.height=560;const c=canvas.getContext('2d');c.fillStyle='#f8faf4';c.fillRect(0,0,900,560);const names=['最近邻 / 基础层','双线性 / 基础层','双线性层内 + 层间混合'];r.panels.forEach((p,i)=>{const x=20+i*300;c.fillStyle='#233c35';c.font='18px sans-serif';c.fillText(names[i],x,32);const off=document.createElement('canvas');off.width=p.width;off.height=p.height;off.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(p.pixels),p.width,p.height),0,0);c.imageSmoothingEnabled=false;c.drawImage(off,x,55,280,249);c.strokeStyle='#90a489';c.strokeRect(x,55,280,249);c.font='17px monospace';c.fillText('小步变化 '+p.change.toFixed(5),x,334);});c.fillStyle='#233c35';c.font='19px sans-serif';c.fillText('实际mip层：λ='+r.lod.toFixed(3)+'，在 '+r.low+' 与 '+r.high+' 层混合',20,375);for(const[index,x]of [[0,30],[r.low,330],[r.high,610]]){const tex=r.levels[index],off=document.createElement('canvas');off.width=off.height=tex.n;const ctx=off.getContext('2d'),image=ctx.createImageData(tex.n,tex.n);for(let i=0;i<tex.data.length;i++){const v=Math.round(tex.data[i]*255);image.data.set([v,v,v,255],i*4);}ctx.putImageData(image,0,0);c.imageSmoothingEnabled=false;c.drawImage(off,x,400,115,115);c.fillStyle='#233c35';c.font='17px sans-serif';c.fillText('L'+index+' / '+tex.n+'×'+tex.n,x+130,456);}c.fillStyle='#526950';c.font='16px sans-serif';c.fillText('上方三个输出均为180×160个采样；纹理灰度数据只用于采样示意。',20,546);},
 verify:r=>'λ='+r.lod.toFixed(3)+'；使用层'+r.low+'与'+r.high+'，混合系数t='+r.t.toFixed(3)+'。相同参数下比较输出，不能把某一小步变化指标当成完整质量评分。',
 presets:[{label:'纹理放大：看局部插值',values:{footprint:.5,frequency:16,offset:.125}},{label:'纹理缩小：观察闪烁',values:{footprint:5.25,frequency:32,offset:.125}},{label:'整数足迹可能掩盖/加重别名',values:{footprint:8,frequency:16,offset:0}},{label:'稍改相位作反例',values:{footprint:8,frequency:16,offset:.00390625}}],
 takeaway:'过滤规则需要匹配屏幕足迹。最近邻与双线性并不自动解决缩小混叠；mipmap用预过滤牺牲不可表达细节，提高稳定性。',limitation:'CPU灰度标量纹理采样器，使用等比例正方形足迹与周期棋盘；mip链真实2×2均值构建。未模拟GPU导数、各向异性、透视UV插值、运动时间采样和颜色空间；不是GPU过滤质量或性能实测。'},
 tasks:[{title:'把纹理坐标与屏幕采样分开说清楚',prompt:'保持UV相位不变，把ρ从0.5改到8。先计算每个输出像素大约覆盖多少个基础texel面积，再解释为何基础层双线性只取四点可能不足。',hint:'正方形足迹面积约ρ²；四点局部插值不是对整个大面积的积分。'},{title:'构造最近邻采样的反例',prompt:'使用整数足迹预设，再切换小相位预设。先预测图像会保持棋盘、变成条纹还是接近单色，并说明为什么单个“看起来平滑”的相位不能证明没有混叠。',hint:'周期纹理与规则采样可以锁相，输出可能错误地稳定。'},{title:'修改核心LOD，说明代价',prompt:'把lod固定为0，再改为默认值+1并夹紧范围。比较远处稳定性和近处细节，并记录一种你不愿接受的过度模糊案例。',hint:'更粗层不是无条件更好，先说明你要表达的输出分辨率和足迹。'}],
 quiz:[
 {question:'UV与屏幕像素是什么关系？',options:['固定一一对应','UV是表面参数，需经过采样映射到texel','UV就是GPU深度'],answer:1,explanation:'同一个屏幕像素可能覆盖多个texel，或一个texel跨过多个屏幕像素。'},
 {question:'双线性过滤在单层纹理通常使用多少个邻近texel？',options:['1个','4个','整张纹理'],answer:1,explanation:'在二维网格四邻点做两方向线性插值，不等于对任意大足迹完整积分。'},
 {question:'ρ=8 texel/像素，理想各向同性LOD约为多少？',options:['3','8','64'],answer:0,explanation:'log₂8=3；实际GPU还会根据导数、偏置、限制等规则决定层级。'},
 {question:'三线性过滤在本实验指什么？',options:['三种颜色直接相加','每层双线性，再在相邻mip层间线性混合','直接做三维体纹理'],answer:1,explanation:'它减少离散mip层切换的突变，不自动解决各向异性足迹。'},
 {question:'mipmap解决缩小问题的主要代价是什么？',options:['可以无损恢复所有细节','存储预过滤层，并丢弃输出无法可靠表达的高频细节','让所有UV变为0'],answer:1,explanation:'预过滤提高稳定性，过粗层也可能导致不必要的模糊。'},
 {question:'斜视地面形成细长采样足迹，单一正方形mip层可能有什么问题？',options:['总能完全匹配','一轴过度模糊、另一轴仍不足，需研究各向异性','与过滤完全无关'],answer:1,explanation:'各向异性过滤针对不同方向上的足迹尺度差异。'}],
 misconceptions:['把texel和像素当成同一种离散单位：先问映射尺度。','认为双线性足以解决一切缩小闪烁：检查采样足迹。','认为越模糊越正确：过滤必须匹配目标足迹，不能抹去仍可表达的细节。'],next:'第8周把相机、变换、纹理和深度组装成完整小场景，并完成一次有记录的排错。',
 sources:[{title:'LearnOpenGL · Textures',url:'https://learnopengl.com/Getting-started/Textures',why:'UV、寻址、过滤和mipmap。'},{title:'PBRT 4 · Image Texture',url:'https://pbr-book.org/4ed/Textures_and_Materials/Image_Texture',why:'深入阅读纹理过滤与采样足迹。'}]
};
