'use strict';
window.Lesson={
  "week": 16,
  "title": "期末项目",
  "subtitle": "解释并改进一张图：用证据完成你的渲染说明",
  "intro": "最后一周不再增加术语。你要选一张自己生成的图，把相机、几何、材质、光照和可见性连起来，提出一个错误或性能假设，再通过控制变量改进它。下面是可修改的项目起点，不是替你完成的作业。",
  "time": "10–14 小时，按项目范围调整",
  "goals": [
    "交付可复现的场景、截图、核心代码与技术说明",
    "为一个现象提出至少两个候选原因并设计反例",
    "区分视觉变化、质量改进与性能优化，报告条件和限制"
  ],
  "sections": [
    {
      "title": "从一张具体图提出问题",
      "html": "<p>不要把题目写成“学习PBR”。写成可以检验的问题，例如：“相机右移后，镜面中的参照球应向哪边移动？”或“关闭可见性查询后，球底阴影为什么消失？”问题越具体，越容易设计能推翻自己的实验。</p><p>项目可以沿用本页球体场景，也可以换成第8周的中期场景。未完成光线追踪分支的学习者可使用给定求交框架，重点解释相机、光照和一个诊断过程；不要求从零重写整个渲染器。</p>"
    },
    {
      "title": "把场景写成可复现的数据，而不是凭感觉调参",
      "html": "<p>至少记录相机位置与FOV、物体的位置和尺寸、线性基础色、镜面混合权重、光源方向、遮挡开关及核心代码。只有截图没有条件，别人无法判断你到底改了什么。</p><div class=\"formula\">图像 = 渲染器(场景，成像规则，数值设置)</div><p>这个函数式表达强调责任边界，不是一个可直接求导的完整物理公式。相机改变构图，几何改变命中与遮挡，材质改变响应，光源与可见性改变入射贡献。</p>"
    },
    {
      "title": "一份可验证的排错记录长什么样？",
      "html": "<p>先保留基线。对“球面看起来凹进去”提出候选原因：选了错误的求交根、法线方向错误、材质造成视觉误导。然后切到法线和距离调试图，再只改根选择。如果多个条件一起变好，就还不能把改善归因于某一项。</p><p>本页可故意启用远根优先。近/远根选择不是绘制顺序；简化距离图是 exp(−0.28t)，不是第6周的透视深度缓冲。请用探针数值 t 和 n 核对自己的解释。</p>"
    },
    {
      "title": "改进需要说明约束，不能只展示更漂亮的结果",
      "html": "<p>增大分辨率、增加样本、改灯光和改变材质都可能改善观感，但成本与物理含义不同。本页为固定160×100单样本CPU射线图，计时仅测内核。若要研究噪声与样本数，请回到第15周；若研究实时GPU性能，回到第13周真实WebGL实验。</p><p>最终说明至少包含：一张基线图、一张对照图、一段核心代码、一条定量或几何检验，以及一个仍未排除的限制。不要把本页参考场景运行成功当作自己的项目已经通过。</p>"
    }
  ],
  "lab": {
    "title": "可组合的期末小场景与故障工作台",
    "description": "选择相机、尺寸、材质、遮挡与调试方式；再直接修改场景和射线核心。先保存基线PNG，改变一项后保存对照；用右侧探针核对可见性。",
    "controls": [
      {
        "id": "cameraX",
        "label": "相机 X",
        "type": "range",
        "min": -1.4,
        "max": 1.4,
        "step": 0.1,
        "value": 0.35
      },
      {
        "id": "fov",
        "label": "垂直 FOV（度）",
        "type": "range",
        "min": 30,
        "max": 85,
        "step": 1,
        "value": 50
      },
      {
        "id": "radius",
        "label": "主球半径",
        "type": "range",
        "min": 0.3,
        "max": 0.95,
        "step": 0.05,
        "value": 0.65
      },
      {
        "id": "mirror",
        "label": "理想镜面混合权重",
        "type": "range",
        "min": 0,
        "max": 0.9,
        "step": 0.1,
        "value": 0.6
      },
      {
        "id": "shadow",
        "label": "方向光遮挡",
        "type": "select",
        "options": [
          {
            "value": "on",
            "label": "启用阴影射线"
          },
          {
            "value": "off",
            "label": "关闭遮挡（故障对照）"
          }
        ],
        "value": "on"
      },
      {
        "id": "mode",
        "label": "诊断视图",
        "type": "select",
        "options": [
          {
            "value": "mirror",
            "label": "混合材质结果"
          },
          {
            "value": "normals",
            "label": "法线调试色"
          },
          {
            "value": "depth",
            "label": "射线距离示意"
          },
          {
            "value": "shaded",
            "label": "只看直接漫反射"
          }
        ],
        "value": "mirror"
      },
      {
        "id": "root",
        "label": "表面选择",
        "type": "select",
        "options": [
          {
            "value": "near",
            "label": "有效最近根"
          },
          {
            "value": "far",
            "label": "有效区间内远根优先（故障）"
          }
        ],
        "value": "near"
      }
    ],
    "code": "const aspect=160/100, fov=Number(input.fov)*Math.PI/180;\nfunction direction(u,v){ return unit([u*Math.tan(fov/2)*aspect, v*Math.tan(fov/2), -1]); }\nfunction reflector(d,n){ return sub(d,scale(n,2*dot(d,n))); }\n// 修改位置/尺寸/颜色前，先写下你希望验证的单个问题。\nconst scene=[\n {id:'项目主球',p:[-.25,0,-2.6],r:Number(input.radius),c:[.15,.62,.5],m:Number(input.mirror)},\n {id:'参照球',p:[.95,-.15,-3.4],r:.55,c:[.78,.2,.07],m:.08},\n {id:'地面',p:[0,-100.7,-3],r:100,c:[.72,.7,.63],m:0}\n];\nreturn renderRay({scene,origin:[Number(input.cameraX),.2,.2],direction,reflector,depth:2,\n mode:input.mode,farRoot:input.root==='far',probeX:0,shadow:input.shadow==='on'});",
    "codeHelp": "p 是世界球心，r 是半径，c 是线性基础色，m 是理想镜面与简化漫反射的混合权重，不是PBR金属性或粗糙度。主球、参照球和地面都参与真正的最近求交、遮挡与反射。修改相机方向生成式时，先核对宽高比与Y翻转。",
    "paint": function(canvas,r){
 const D=window.LessonDraw,c=D.setup(canvas,'#102923'),image=new ImageData(new Uint8ClampedArray(r.pixels),r.w,r.h),tmp=document.createElement('canvas');tmp.width=r.w;tmp.height=r.h;tmp.getContext('2d').putImageData(image,0,0);c.imageSmoothingEnabled=false;c.drawImage(tmp,25,70,640,400);
 D.text(c,window.Lesson.week===15?'真实随机路径采样 · 固定种子可复现':'真实射线求交 · CPU 渲染',25,40,'#edf3dc',24);
 const lines=window.Lesson.week===15?[`每像素 ${r.samples} 样本`,`最大 ${r.depth} 次命中`,`seed = ${r.seed}`,`路径段 ${r.rays.toLocaleString()}`,'不含阴影射线',`内核 ${r.elapsed.toFixed(1)} ms`,`线性均值 ${r.meanLinear.toFixed(3)}`,r.indirect?'间接散射：开启':'间接散射：关闭']:[`主/反射射线 ${r.rayCount.toLocaleString()}`,`内核 ${r.elapsed.toFixed(1)} ms`,'探针：图像中线',r.probe?`命中 ${r.probe.id}`:'未命中',r.probe?`t = ${r.probe.t.toFixed(3)}`:'显示天空',r.probe?`正面 = ${r.probe.front}`:'',`模式 ${r.mode}`];
 lines.forEach((text,i)=>D.text(c,text,690,100+i*43,'#d9e6d8',19));
 D.text(c,'左图为低分辨率原始结果的最近邻放大，不做降噪。',25,510,'#c4d5c7',18);
 D.text(c,'计时仅为本次 Worker CPU 内核，不含 UI 与 GPU。',25,542,'#c4d5c7',18);
},
    "verify": r=>r.probe?`探针命中 ${r.probe.id}，t=${r.probe.t.toFixed(4)}；CPU内核 ${r.elapsed.toFixed(2)} ms。`:'探针未命中，检查射线方向、球位置和正根范围。',
    "presets": [
      {
        "label": "基线项目场景",
        "values": {
          "cameraX": 0.35,
          "fov": 50,
          "radius": 0.65,
          "mirror": 0.6,
          "shadow": "on",
          "mode": "mirror",
          "root": "near"
        }
      },
      {
        "label": "诊断：选错球面",
        "values": {
          "root": "far",
          "mode": "normals"
        }
      },
      {
        "label": "诊断：缺失遮挡",
        "values": {
          "shadow": "off",
          "mode": "shaded"
        }
      },
      {
        "label": "材质对照：纯直接项",
        "values": {
          "mirror": 0,
          "mode": "mirror",
          "root": "near"
        }
      }
    ],
    "takeaway": "把一张图解释为一条可复现计算路径；每次改变一个条件，用图像和数值共同排查。",
    "limitation": "解析球与简化方向光CPU渲染器；镜面混合并非完整PBR。固定低分辨率、两次反射，无真实网格、GPU性能计时、路径追踪噪声、透明折射、生产级阴影或颜色管理流程。",
    "prelude": "function hitSphere(ro,rd,s,lo,hi,farRoot=false){\n const oc=sub(ro,s.p),a=dot(rd,rd),h=dot(oc,rd),c=dot(oc,oc)-s.r*s.r,disc=h*h-a*c;\n if(!(a>0)||disc<0)return null;\n const q=Math.sqrt(disc),roots=[(-h-q)/a,(-h+q)/a];if(farRoot)roots.reverse();\n for(const t of roots)if(t>lo&&t<hi){const p=add(ro,scale(rd,t));let n=scale(sub(p,s.p),1/s.r);const front=dot(rd,n)<0;if(!front)n=scale(n,-1);return {t,p,n,front,s};}\n return null;\n}\nfunction nearest(ro,rd,scene,lo=.001,hi=1e30,farRoot=false){let best=null;for(const s of scene){const h=hitSphere(ro,rd,s,lo,best?best.t:hi,farRoot);if(h)best=h;}return best;}\nfunction sky(d){const t=.5*(d[1]+1);return [1-.48*t,1-.34*t,1-.08*t];}\nfunction encode(v){v=Math.max(0,Math.min(1,v));return v<=.0031308?12.92*v:1.055*Math.pow(v,1/2.4)-.055;}\nfunction renderRay(config){\n const w=160,h=100,pixels=new Uint8ClampedArray(w*h*4);let rayCount=0;const start=performance.now(),sun=unit([-.6,1,.6]);\n function trace(ro,rd,depth){rayCount++;const hit=nearest(ro,rd,config.scene,.001,1e30,config.farRoot);if(!hit)return sky(rd);\n  if(config.mode==='normals')return hit.n.map(x=>x*.5+.5);\n  if(config.mode==='depth'){const z=Math.exp(-hit.t*.28);return [z,z,z];}\n  const blocked=config.shadow&&nearest(add(hit.p,scale(hit.n,.002)),sun,config.scene);\n  const light=.15+(blocked?0:.85*Math.max(0,dot(hit.n,sun))),base=hit.s.c.map(x=>x*light);\n  const reflectivity=config.mode==='mirror'?(hit.s.m||0):0;\n  if(depth<=0||reflectivity<=0)return base;\n  const reflected=unit(config.reflector(rd,hit.n));if(!reflected)return base;\n  const bounce=trace(add(hit.p,scale(hit.n,.002)),reflected,depth-1);\n  return base.map((x,i)=>(1-reflectivity)*x+reflectivity*bounce[i]);\n }\n for(let y=0;y<h;y++)for(let x=0;x<w;x++){\n  const rd=config.direction((2*(x+.5)/w-1),(1-2*(y+.5)/h));const color=trace(config.origin,rd,config.depth);\n  for(let k=0;k<3;k++)pixels[(y*w+x)*4+k]=Math.round(encode(color[k])*255);pixels[(y*w+x)*4+3]=255;\n }\n const probeDirection=config.direction(config.probeX||0,0),probe=nearest(config.origin,probeDirection,config.scene,.001,1e30,config.farRoot);\n return {w,h,pixels,rayCount,elapsed:performance.now()-start,probe:probe?{t:probe.t,p:probe.p,n:probe.n,id:probe.s.id,front:probe.front}:null,origin:config.origin,direction:probeDirection,mode:config.mode};\n}"
  },
  "tasks": [
    {
      "title": "交付A：场景与图像形成说明",
      "prompt": "保存基线截图和所有参数，画出相机射线→最近命中→法线/材质→光源可见性→反射→显示编码的流程。若选择中期光栅化场景，画对应的顶点/片段/深度流程，不要混用两条管线。",
      "hint": "必须能指出你的核心代码在流程中处于哪一环。"
    },
    {
      "title": "交付B：一个真正的故障诊断",
      "prompt": "从远根、缺失遮挡或自己引入的相机/法线错误中选一个。先写至少两个候选原因，再用单变量对照排除其中一个。提交前后图、参数差异、probe读数与修复理由。",
      "hint": "“重新运行就好了”不是机制解释；保留能让错误再次出现的参数。"
    },
    {
      "title": "交付C：一次质量或性能改进",
      "prompt": "选定一个目标：轮廓清晰度、噪声、遮挡正确性或计算成本。说明质量约束，重复测量相同设置，报告收益和代价。不要拿改曝光当作能量模型修正。",
      "hint": "本页内核耗时是CPU；研究真实GPU性能必须转到第13周的对应测量边界。"
    },
    {
      "title": "自评与下一步",
      "prompt": "检查项目包是否包含：运行方式、两张图、核心代码、数据流图、一个数值检验、测量环境、一个未解决限制。再设计一个目前可能推翻你结论的输入，写进复盘。",
      "hint": "有限案例只支持有限结论。可复现和边界诚实比堆叠更多术语更重要。"
    }
  ],
  "quiz": [
    {
      "question": "最终图和基线同时改变了灯光、材质和相机，能把改善归因于某一项吗？",
      "options": [
        "能，看起来更好即可",
        "不能，需要控制变量与进一步对照",
        "只要参数写下来就一定能"
      ],
      "answer": 1,
      "explanation": "记录是前提，但同时变化仍存在混杂因素；需要隔离变量或明确联合改动的有限结论。"
    },
    {
      "question": "本页“镜面混合0.8”可以直接解释为PBR金属性0.8吗？",
      "options": [
        "可以，都是0到1",
        "不可以，参数模型不同",
        "只要颜色相同就可以"
      ],
      "answer": 1,
      "explanation": "本页在简化漫反射与理想反射间混合，没有完整金属/介质Fresnel与微表面BRDF。"
    },
    {
      "question": "阴影消失时，首先应检查哪类证据？",
      "options": [
        "光源可见性查询与偏移/遮挡设置",
        "只增大主球颜色值",
        "把所有法线取反"
      ],
      "answer": 0,
      "explanation": "阴影是可见性问题，应先检查光源方向射线是否被遮挡；亮度变化不自动修复可见性。"
    },
    {
      "question": "一张结果图加“CPU内核8ms”，足以说明实时GPU达到125FPS吗？",
      "options": [
        "足够",
        "不足，计时边界、显示、数据传输和GPU路径不同",
        "只要8ms小于16.7ms即可"
      ],
      "answer": 1,
      "explanation": "帧率是系统呈现的结果，不能把一个CPU内核倒数直接宣称为GPU帧率。"
    },
    {
      "question": "一个好的未解决限制应该是什么？",
      "options": [
        "没有任何问题",
        "明确尚未测试或尚未覆盖的条件及影响",
        "仅写“还可以更好看”"
      ],
      "answer": 1,
      "explanation": "限制使结论可评估，也帮助下一轮实验优先处理真正未知的条件。"
    }
  ],
  "misconceptions": [
    "课程网站或预制示例可运行，不代表学习者期末项目已经完成。",
    "同时调很多参数得到漂亮图，不能自动解释改进原因。",
    "不同渲染模型中的0到1参数不一定具有相同物理意义。",
    "一张截图不能证明数值鲁棒性或性能稳定，必须记录条件与反例。"
  ],
  "next": "继续方向由你的项目缺口决定：几何与坐标不稳就重做第2–6周，画质问题回到第7–12周，性能与采样问题回到第13–15周。之后再把同样的诊断方法迁移到实际引擎或重建系统。",
  "sources": [
    {
      "title": "LearnOpenGL · Review",
      "url": "https://learnopengl.com/Getting-started/Review",
      "why": "回顾基本管线、坐标与绘制职责。"
    },
    {
      "title": "Ray Tracing in One Weekend · 原作者教材",
      "url": "https://raytracing.github.io/books/RayTracingInOneWeekend.html",
      "why": "本项目解析球、相机射线、最近交点与反射的实现背景。"
    },
    {
      "title": "PBRT 4 · Introduction",
      "url": "https://pbr-book.org/4ed/Introduction",
      "why": "将图像形成看作完整系统，了解本页简化与完整物理渲染之间的距离。"
    }
  ]
};
