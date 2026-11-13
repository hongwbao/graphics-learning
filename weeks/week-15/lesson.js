'use strict';
window.Lesson={
  "week": 15,
  "title": "路径追踪与全局光照",
  "subtitle": "噪声不是模糊：它来自一次次不确定的路径",
  "intro": "镜面只有一个理想方向，漫反射却要接收半球上许多方向的光。不能枚举所有方向，就用随机路径估计。本周的像素是真实随机射线样本的平均，不是给干净图叠噪声。",
  "time": "8–11 小时",
  "goals": [
    "解释渲染积分、PDF与样本平均的职责",
    "区分直接光、间接散射、有限反弹偏差与随机噪声",
    "固定条件比较样本数、噪声与CPU成本，并理解4倍样本的意义"
  ],
  "sections": [
    {
      "title": "为什么直接照明还不够？",
      "html": "<p>红色物体附近的白地面可能染上一点红，物体背光面也可能收到环境和其他表面反射的光。这些现象来自光在表面之间传播；只算 n·L 的单次照明无法表达完整路径。</p><p>本实验显式计算一个方向光的可见性作为直接项，再从漫反射表面随机发射新射线，逐次乘上表面反射率。关闭间接散射只保留这个方向光项与相机直接看到的环境，不等于把所有光都关掉。</p>"
    },
    {
      "title": "把许多方向的贡献写成积分",
      "html": "<div class=\"formula\">L_o(p,ω_o)=L_e(p,ω_o)+∫ f_r(p,ω_i,ω_o)L_i(p,ω_i)|n·ω_i| dω_i</div><p>L_o 是离开表面的辐亮度，L_e 是表面自发光，L_i 是入射辐亮度；f_r 是 BRDF，ω_i/ω_o 是入射与出射方向，n 是单位法线，积分在可见入射半球上进行。积分中的量不能只挑一个“漂亮方向”代替。</p><p>本页使用 Lambert 漫反射 f_r=ρ/π，其中 ρ 为三个颜色通道的反射率；没有金属或高光 BRDF。方向光直接项用单独的阴影射线评估。实现中的 1.4 是把教学光强与 1/π 合并后的照明系数，不宣称它是经过物理标定的入射辐亮度。</p>"
    },
    {
      "title": "随机估计为什么还要除以概率密度？",
      "html": "<div class=\"formula\">I ≈ (1/N) Σ [g(ω_k)/p(ω_k)]</div><p>N 是样本数，ω_k 是按概率密度 p 产生的方向；g 包含需要积分的 BRDF、入射光和余弦。采到某方向的频率与它的积分权重不同，必须用 PDF 补偿。</p><p>本实验在局部半球作余弦加权采样，p(ω)=cosθ/π，与 Lambert 的 ρ/π 和积分的 cosθ 配合后，路径吞吐量只需再乘 ρ。若此时又乘一次 cosθ，就改变了估计量，会让画面产生系统性变暗，而不是仅改变噪声。</p>"
    },
    {
      "title": "噪声、偏差和运行时间是三件事",
      "html": "<p>理想独立同分布、有限方差条件下，均值估计的标准误差约按 1/√N 缩小，所以标准差减半通常要约4倍样本。不是说一张图中每个像素的误差都精确减半。</p><p>增加样本降低随机波动；增加最大反弹次数减少本例截断路径造成的一类偏差。二者不能互相替代。固定曝光、场景、分辨率与反弹上限，换几个种子观察，再谈“更少噪声”。本页保留原始低分辨率结果，只做显示编码和色调映射，不做降噪。</p>"
    }
  ],
  "lab": {
    "title": "真正的漫反射随机路径实验",
    "description": "每个像素发射带抖动的相机射线，命中后以余弦分布散射；以固定种子复现实验。请先比较1与16样本，再比较直接项和间接散射。",
    "timeoutMs": 8000,
    "controls": [
      {
        "id": "samples",
        "label": "每像素样本数 spp",
        "type": "select",
        "options": [
          {
            "value": "1",
            "label": "1 spp"
          },
          {
            "value": "4",
            "label": "4 spp"
          },
          {
            "value": "8",
            "label": "8 spp"
          },
          {
            "value": "16",
            "label": "16 spp"
          },
          {
            "value": "32",
            "label": "32 spp"
          }
        ],
        "value": "8"
      },
      {
        "id": "depth",
        "label": "最大命中次数",
        "type": "range",
        "min": 1,
        "max": 6,
        "step": 1,
        "value": 4
      },
      {
        "id": "seed",
        "label": "伪随机种子",
        "type": "range",
        "min": 1,
        "max": 99,
        "step": 1,
        "value": 7
      },
      {
        "id": "indirect",
        "label": "漫反射间接散射",
        "type": "select",
        "options": [
          {
            "value": "on",
            "label": "开启"
          },
          {
            "value": "off",
            "label": "关闭，仅保留直接项"
          }
        ],
        "value": "on"
      },
      {
        "id": "exposure",
        "label": "显示曝光（不改变线性估计）",
        "type": "range",
        "min": 0.3,
        "max": 2,
        "step": 0.1,
        "value": 1
      }
    ],
    "code": "const scene=[\n {id:'红球',p:[-.55,-.05,-2.4],r:.65,c:[.72,.18,.08]},\n {id:'蓝球',p:[.85,-.15,-3.0],r:.55,c:[.1,.32,.72]},\n {id:'地面',p:[0,-100.7,-3],r:100,c:[.72,.72,.72]},\n {id:'发光球',p:[0,2.2,-2.7],r:.5,c:[0,0,0],e:[6,5.5,4.5]}\n];\n// 余弦采样必须与 Lambert 权重配对；可在脚手架中核查 PDF 抵消。\nfunction sample(n,rng){ return cosineDirection(n,rng); }\nreturn renderPath({scene,sample,samples:Number(input.samples),depth:Number(input.depth),\n seed:Number(input.seed),indirect:input.indirect==='on',exposure:Number(input.exposure)});",
    "codeHelp": "scene 的 c 是线性漫反射率，e 是自发光；sample() 真正决定二次射线方向。先把红球反射率减半，预测周围地面颜色的变化。若要换成均匀半球采样，必须同时在脚手架 trace() 中改吞吐量为 f*cos/pdf，不能只替换随机方向。exposure 只作用于平均后的显示，不改变线性估计均值。",
    "paint": function(canvas,r){
 const D=window.LessonDraw,c=D.setup(canvas,'#102923'),image=new ImageData(new Uint8ClampedArray(r.pixels),r.w,r.h),tmp=document.createElement('canvas');tmp.width=r.w;tmp.height=r.h;tmp.getContext('2d').putImageData(image,0,0);c.imageSmoothingEnabled=false;c.drawImage(tmp,25,70,640,400);
 D.text(c,window.Lesson.week===15?'真实随机路径采样 · 固定种子可复现':'真实射线求交 · CPU 渲染',25,40,'#edf3dc',24);
 const lines=window.Lesson.week===15?[`每像素 ${r.samples} 样本`,`最大 ${r.depth} 次命中`,`seed = ${r.seed}`,`路径段 ${r.rays.toLocaleString()}`,'不含阴影射线',`内核 ${r.elapsed.toFixed(1)} ms`,`线性均值 ${r.meanLinear.toFixed(3)}`,r.indirect?'间接散射：开启':'间接散射：关闭']:[`主/反射射线 ${r.rayCount.toLocaleString()}`,`内核 ${r.elapsed.toFixed(1)} ms`,'探针：图像中线',r.probe?`命中 ${r.probe.id}`:'未命中',r.probe?`t = ${r.probe.t.toFixed(3)}`:'显示天空',r.probe?`正面 = ${r.probe.front}`:'',`模式 ${r.mode}`];
 lines.forEach((text,i)=>D.text(c,text,690,100+i*43,'#d9e6d8',19));
 D.text(c,'左图为低分辨率原始结果的最近邻放大，不做降噪。',25,510,'#c4d5c7',18);
 D.text(c,'计时仅为本次 Worker CPU 内核，不含 UI 与 GPU。',25,542,'#c4d5c7',18);
},
    "verify": r=>`${r.samples} spp，seed=${r.seed}，路径段${r.rays}（不含阴影射线），线性亮度均值${r.meanLinear.toFixed(4)}。比较噪声时固定曝光与场景，不把一次低噪声区域当作全图结论。`,
    "presets": [
      {
        "label": "1 样本基线",
        "values": {
          "samples": "1",
          "seed": 7
        }
      },
      {
        "label": "16 样本对照",
        "values": {
          "samples": "16",
          "seed": 7
        }
      },
      {
        "label": "关闭间接散射",
        "values": {
          "indirect": "off"
        }
      },
      {
        "label": "只允许首次命中",
        "values": {
          "depth": 1
        }
      }
    ],
    "takeaway": "样本是实际射线路径，不是噪声滤镜。更多样本减少方差；更多反弹改变截断偏差；曝光只改变显示。",
    "limitation": "固定96×64分辨率、解析球/球形地面、Lambert漫反射、方向光直接项及有限深度随机散射。无重要性采样混合/MIS、面积光显式采样、俄罗斯轮盘赌、玻璃、生产级随机序列或降噪；有限反弹会产生偏差。",
    "prelude": "function hitSphere(ro,rd,s,lo,hi,farRoot=false){\n const oc=sub(ro,s.p),a=dot(rd,rd),h=dot(oc,rd),c=dot(oc,oc)-s.r*s.r,disc=h*h-a*c;\n if(!(a>0)||disc<0)return null;\n const q=Math.sqrt(disc),roots=[(-h-q)/a,(-h+q)/a];if(farRoot)roots.reverse();\n for(const t of roots)if(t>lo&&t<hi){const p=add(ro,scale(rd,t));let n=scale(sub(p,s.p),1/s.r);const front=dot(rd,n)<0;if(!front)n=scale(n,-1);return {t,p,n,front,s};}\n return null;\n}\nfunction nearest(ro,rd,scene,lo=.001,hi=1e30,farRoot=false){let best=null;for(const s of scene){const h=hitSphere(ro,rd,s,lo,best?best.t:hi,farRoot);if(h)best=h;}return best;}\nfunction sky(d){const t=.5*(d[1]+1);return [1-.48*t,1-.34*t,1-.08*t];}\nfunction encode(v){v=Math.max(0,Math.min(1,v));return v<=.0031308?12.92*v:1.055*Math.pow(v,1/2.4)-.055;}\nfunction renderRay(config){\n const w=160,h=100,pixels=new Uint8ClampedArray(w*h*4);let rayCount=0;const start=performance.now(),sun=unit([-.6,1,.6]);\n function trace(ro,rd,depth){rayCount++;const hit=nearest(ro,rd,config.scene,.001,1e30,config.farRoot);if(!hit)return sky(rd);\n  if(config.mode==='normals')return hit.n.map(x=>x*.5+.5);\n  if(config.mode==='depth'){const z=Math.exp(-hit.t*.28);return [z,z,z];}\n  const blocked=config.shadow&&nearest(add(hit.p,scale(hit.n,.002)),sun,config.scene);\n  const light=.15+(blocked?0:.85*Math.max(0,dot(hit.n,sun))),base=hit.s.c.map(x=>x*light);\n  const reflectivity=config.mode==='mirror'?(hit.s.m||0):0;\n  if(depth<=0||reflectivity<=0)return base;\n  const reflected=unit(config.reflector(rd,hit.n));if(!reflected)return base;\n  const bounce=trace(add(hit.p,scale(hit.n,.002)),reflected,depth-1);\n  return base.map((x,i)=>(1-reflectivity)*x+reflectivity*bounce[i]);\n }\n for(let y=0;y<h;y++)for(let x=0;x<w;x++){\n  const rd=config.direction((2*(x+.5)/w-1),(1-2*(y+.5)/h));const color=trace(config.origin,rd,config.depth);\n  for(let k=0;k<3;k++)pixels[(y*w+x)*4+k]=Math.round(encode(color[k])*255);pixels[(y*w+x)*4+3]=255;\n }\n const probeDirection=config.direction(config.probeX||0,0),probe=nearest(config.origin,probeDirection,config.scene,.001,1e30,config.farRoot);\n return {w,h,pixels,rayCount,elapsed:performance.now()-start,probe:probe?{t:probe.t,p:probe.p,n:probe.n,id:probe.s.id,front:probe.front}:null,origin:config.origin,direction:probeDirection,mode:config.mode};\n}\nfunction randomGenerator(seed){let state=(Number(seed)>>>0)||1;return ()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return state/4294967296;};}\nfunction cosineDirection(n,rng){const r=Math.sqrt(rng()),phi=2*Math.PI*rng(),axis=Math.abs(n[0])>.9?[0,1,0]:[1,0,0],u=unit(cross(axis,n)),v=cross(n,u);return unit(add(add(scale(u,r*Math.cos(phi)),scale(v,r*Math.sin(phi))),scale(n,Math.sqrt(Math.max(0,1-r*r)))));}\nfunction renderPath(config){\n const w=96,h=64,pixels=new Uint8ClampedArray(w*h*4),rng=randomGenerator(config.seed),start=performance.now();let rays=0,sumL=0;\n const sun=unit([-.5,1,.5]);\n function trace(ro,rd){let throughput=[1,1,1],radiance=[0,0,0];\n  for(let bounce=0;bounce<config.depth;bounce++){\n   rays++;const hit=nearest(ro,rd,config.scene);if(!hit){const environment=[.35,.45,.7];radiance=radiance.map((v,k)=>v+throughput[k]*environment[k]);break;}\n   if(hit.s.e){radiance=radiance.map((v,k)=>v+throughput[k]*hit.s.e[k]);break;}\n   const offset=add(hit.p,scale(hit.n,.002)),blocked=nearest(offset,sun,config.scene),cosine=blocked?0:Math.max(0,dot(hit.n,sun));\n   // 1.4 合并教学光强与 Lambert 的 1/pi，并非物理标定的 radiance。\n   radiance=radiance.map((v,k)=>v+throughput[k]*hit.s.c[k]*cosine*1.4);\n   if(!config.indirect)break;\n   const next=config.sample(hit.n,rng);\n   if(!next)break;\n   // cosine-weighted Lambert: f*cos/pdf = albedo；不额外再乘 cos。\n   throughput=throughput.map((v,k)=>v*hit.s.c[k]);\n   ro=offset;rd=next;\n  }\n  return radiance;\n }\n for(let y=0;y<h;y++)for(let x=0;x<w;x++){\n  let color=[0,0,0];for(let s=0;s<config.samples;s++){const u=(2*(x+rng())/w-1)*1.5*.6,v=(1-2*(y+rng())/h)*.6;const value=trace([0,.2,.5],unit([u,v,-1]));color=color.map((a,k)=>a+value[k]/config.samples);}\n  sumL+=.2126*color[0]+.7152*color[1]+.0722*color[2];\n  for(let k=0;k<3;k++){const exposed=color[k]*config.exposure,tone=exposed/(1+exposed);pixels[(y*w+x)*4+k]=Math.round(encode(tone)*255);}pixels[(y*w+x)*4+3]=255;\n }\n return {w,h,pixels,rays,elapsed:performance.now()-start,samples:config.samples,depth:config.depth,seed:config.seed,meanLinear:sumL/(w*h),indirect:config.indirect};\n}"
  },
  "tasks": [
    {
      "title": "多样本，还是只是更模糊？",
      "prompt": "固定scene、depth、seed和exposure，分别运行1、4、16、32 spp。保存图像和CPU耗时，描述边缘、暗处与间接区域的噪声。为什么“4倍样本误差减半”不能用单张图中一个像素直接证明？",
      "hint": "需要参考真值、重复种子或误差统计；小区域恰好采到亮路径会有很大波动。"
    },
    {
      "title": "分离截断偏差与方差",
      "prompt": "固定32 spp，对比depth=1与depth=6；再固定depth=4对比1与32 spp。说明两组实验改变的是哪种误差，不要把更深路径等同于更多相机样本。",
      "hint": "每像素样本数控制平均，反弹上限改变每条路径可走多远。"
    },
    {
      "title": "追查系统性变暗的错误",
      "prompt": "读脚手架中 throughput*=albedo 的注释。假设在余弦采样下再乘一次 cosθ，先预测图像会怎样，再在 lesson.js 的 lab.prelude 中临时修改该权重并刷新页面，对比多个种子；说明为什么这不是“多加样本就能修好”的问题。",
      "hint": "它改变了估计量的期望，而非仅改变随机误差。"
    }
  ],
  "quiz": [
    {
      "question": "在常见有限方差独立采样模型下，样本数增加4倍，标准误差大致怎样？",
      "options": [
        "减为一半",
        "减为四分之一",
        "必然变为零"
      ],
      "answer": 0,
      "explanation": "标准误差通常按1/√N缩小；是统计尺度，不保证每个像素这次都精确减半。"
    },
    {
      "question": "为什么一般Monte Carlo估计要除以PDF？",
      "options": [
        "使图像总是更亮",
        "补偿按某分布采样的频率，恢复积分权重",
        "为了隐藏噪声"
      ],
      "answer": 1,
      "explanation": "采样频率不是贡献本身；g/p 才对应积分的无偏样本权重，前提包括覆盖所需支持域。"
    },
    {
      "question": "Lambert加余弦半球采样时，散射吞吐量常简化成什么？",
      "options": [
        "反射率ρ",
        "再乘两次cosθ",
        "固定白色1"
      ],
      "answer": 0,
      "explanation": "(ρ/π)*cosθ / (cosθ/π) = ρ。换采样分布后必须重新检查这项。"
    },
    {
      "question": "增加spp能消除有限反弹截断偏差吗？",
      "options": [
        "一定能",
        "不能，它只能更准确估计那个被截断的模型",
        "只要固定种子就能"
      ],
      "answer": 1,
      "explanation": "反弹上限改变积分近似的模型；更多样本不自动补回被丢掉的路径。"
    },
    {
      "question": "改变曝光是否改变本页记录的线性估计均值？",
      "options": [
        "会，曝光就是更多光线",
        "不会，它在路径平均之后用于显示",
        "会改变随机数种子"
      ],
      "answer": 1,
      "explanation": "本页将曝光和色调映射放在显示阶段，平均前的线性辐射估计不变。"
    }
  ],
  "misconceptions": [
    "路径追踪不是“干净图加噪声”或模糊滤镜。",
    "固定种子保证同一参数可复现，不代表单个种子的结果等于真值。",
    "增加反弹和增加样本不是同一种操作。",
    "更亮不一定更准确；显示曝光、错误权重和真实能量变化必须分开。"
  ],
  "next": "最后一周把相机、材质、光照、可见性与测量组合成一个可解释、可复现的项目。",
  "sources": [
    {
      "title": "Ray Tracing in One Weekend · 原作者教材",
      "url": "https://raytracing.github.io/books/RayTracingInOneWeekend.html",
      "why": "漫反射路径、采样和多次反弹的入门实现。"
    },
    {
      "title": "PBRT 4 · Monte Carlo Integration",
      "url": "https://pbr-book.org/4ed/Monte_Carlo_Integration",
      "why": "估计量、方差与随机采样基础。"
    },
    {
      "title": "PBRT 4 · A Better Path Tracer",
      "url": "https://pbr-book.org/4ed/Light_Transport_I_Surface_Reflection/A_Better_Path_Tracer",
      "why": "理解生产级路径追踪还需显式光采样、MIS等，本页没有实现这些内容。"
    }
  ]
};
