'use strict';
window.Lesson={
  "week": 14,
  "title": "光线追踪",
  "subtitle": "从一个像素出发，寻找第一个可见表面",
  "intro": "光栅化先问三角形覆盖哪些像素；光线追踪反过来，从像素沿相机射线去问“我首先碰到谁”。本周从一个球开始，让求交、遮挡和镜面反射都能被算出来。",
  "time": "8–10 小时",
  "goals": [
    "由相机和像素生成射线并解释参数 t",
    "推导球体求交并正确选择最近的有效正根",
    "用法线和反射方向诊断镜面与自相交问题"
  ],
  "sections": [
    {
      "title": "一个像素为什么对应一条射线？",
      "html": "<p>把相机当作针孔，像素中心位于它前方的虚拟成像平面。连接针孔与像素，得到射线方向。方向不是像素颜色；必须继续找它碰到的场景表面。本周相机朝世界 −Z，+Y 向上，图像从上到下遍历时 y 要翻转。</p><div class=\"formula\">r(t) = o + t d，t ≥ 0</div><p>o 是射线起点，d 是非零方向，t 是沿射线的参数。只有 d 的长度为 1 时，t 才等于从 o 到命中位置的欧氏距离。若忘了归一化，求交仍能成立，但不能继续把 t 无条件当作米或距离。</p>"
    },
    {
      "title": "把几何条件变成二次方程",
      "html": "<p>球心 c、半径 R 的球面满足 ‖p−c‖²=R²。将 p=o+td 代入，令 q=o−c，可得：</p><div class=\"formula\">a t² + 2 h t + k = 0<br>a=d·d，h=q·d，k=q·q−R²<br>Δ=h²−ak，t=(-h ± √Δ)/a</div><p>Δ&lt;0 表示没有实交点；Δ=0 是相切；Δ&gt;0 常有进入和离开球面的两个交点。不要把本周的半 b 形式 h 与教科书完整 b 形式混用，否则会多出或漏掉一个 2。</p>"
    },
    {
      "title": "最近的交点，必须处于有效区间",
      "html": "<p>从球外看，较小正根通常是入口；相机在球内时，小根可能为负，应该尝试另一个根。遍历多个物体时，保留 t_min&lt;t&lt;t_best 的最近命中。只返回“存在交点”的布尔值，不能决定遮挡。</p><p>本实验的“远根优先”会优先尝试每个球的较大根；若它不在当前 t_min 到 t_best 的有效区间内，会回退尝试小根。仍然比较不同物体的 t。这是一个可编译、可运行但通常错误的可见性策略，用法线调试图比看最终颜色更容易定位。</p>"
    },
    {
      "title": "反射是一条新射线，不是一张固定贴图",
      "html": "<p>在命中点求单位法线 n。入射方向 d 指向表面，理想反射方向为：</p><div class=\"formula\">d_reflect = d − 2(d·n)n</div><p>该式要求 n 为单位法线。沿新方向再次寻找最近命中，镜面中才会出现其他物体。新起点略沿表面法线偏移，避免浮点误差使射线立即击中自己；偏移过大又会漏掉近处细节。</p><p>联系 3D 重建：渲染器会把网格或体表示交给求交结构。本周只用解析球以隔离几何问题；球不代表真实重建场景，但“相机射线、最近命中、法线和可见性”的职责可以迁移。</p>"
    }
  ],
  "lab": {
    "title": "球体求交、最近根与反射观察室",
    "description": "左图是逐像素发射射线得到的真实 CPU 结果；右边追踪图像水平中线上一条探针射线。先用法线模式看命中表面，再看镜面中的反射。",
    "controls": [
      {
        "id": "cameraX",
        "label": "相机 X",
        "type": "range",
        "min": -1.5,
        "max": 1.5,
        "step": 0.1,
        "value": 0
      },
      {
        "id": "radius",
        "label": "主球半径 R",
        "type": "range",
        "min": 0.25,
        "max": 1.1,
        "step": 0.05,
        "value": 0.65
      },
      {
        "id": "mode",
        "label": "显示方式",
        "type": "select",
        "options": [
          {
            "value": "normals",
            "label": "法线编码"
          },
          {
            "value": "shaded",
            "label": "简化直接光照"
          },
          {
            "value": "mirror",
            "label": "镜面反射"
          },
          {
            "value": "depth",
            "label": "命中距离可视化"
          }
        ],
        "value": "mirror"
      },
      {
        "id": "depth",
        "label": "最大反射次数",
        "type": "range",
        "min": 0,
        "max": 3,
        "step": 1,
        "value": 1
      },
      {
        "id": "root",
        "label": "根选择（故障对比）",
        "type": "select",
        "options": [
          {
            "value": "near",
            "label": "有效最近根"
          },
          {
            "value": "far",
            "label": "有效区间内远根优先"
          }
        ],
        "value": "near"
      },
      {
        "id": "probeX",
        "label": "探针水平位置（NDC）",
        "type": "range",
        "min": -0.9,
        "max": 0.9,
        "step": 0.05,
        "value": 0
      }
    ],
    "code": "const fov = 50 * Math.PI / 180, aspect = 160/100;\nfunction direction(u,v){ return unit([u*Math.tan(fov/2)*aspect, v*Math.tan(fov/2), -1]); }\nfunction reflector(d,n){ return sub(d, scale(n, 2*dot(d,n))); }\nconst scene = [\n {id:'主球',p:[0,0,-2.5],r:Number(input.radius),c:[.2,.65,.48],m:.8},\n {id:'参照球',p:[1.05,-.1,-3.2],r:.55,c:[.75,.18,.08],m:.05},\n {id:'地面',p:[0,-100.7,-3],r:100,c:[.65,.68,.63],m:.05}\n];\nreturn renderRay({scene,origin:[Number(input.cameraX),.15,0],direction,reflector,\n mode:input.mode,depth:Number(input.depth),farRoot:input.root==='far',probeX:Number(input.probeX),shadow:true});",
    "codeHelp": "direction() 从 NDC 像素生成世界射线；先切到法线模式，再把方向归一化去掉，隔离命中位置与 t 的关系。背景 sky(d) 假设单位方向，去掉归一化还会改变未命中处的天空着色，不能把这种背景变化误判为几何变化。reflector() 是反射核心，修改前用垂直入射与擦边入射检验方向。scene 中 p、r、c、m 分别是球心、半径、线性基础色、镜面混合权重。完整求交/绘制脚手架可在源码详情查看。",
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
        "label": "观察最近命中法线",
        "values": {
          "mode": "normals",
          "root": "near",
          "cameraX": 0
        }
      },
      {
        "label": "远根故障",
        "values": {
          "mode": "normals",
          "root": "far"
        }
      },
      {
        "label": "关闭反射作基线",
        "values": {
          "mode": "mirror",
          "depth": 0
        }
      }
    ],
    "takeaway": "球后侧也有交点，但可见表面依赖最近有效命中。t 的距离解释依赖方向归一化；反射次数增加会改变真实射线路径。",
    "limitation": "解析球与球形近似地面、固定针孔相机、简化直接光照及理想镜面混合。没有三角网格/BVH、透明折射、面积光采样或完整路径积分；CPU时间不等于GPU时间。",
    "prelude": "function hitSphere(ro,rd,s,lo,hi,farRoot=false){\n const oc=sub(ro,s.p),a=dot(rd,rd),h=dot(oc,rd),c=dot(oc,oc)-s.r*s.r,disc=h*h-a*c;\n if(!(a>0)||disc<0)return null;\n const q=Math.sqrt(disc),roots=[(-h-q)/a,(-h+q)/a];if(farRoot)roots.reverse();\n for(const t of roots)if(t>lo&&t<hi){const p=add(ro,scale(rd,t));let n=scale(sub(p,s.p),1/s.r);const front=dot(rd,n)<0;if(!front)n=scale(n,-1);return {t,p,n,front,s};}\n return null;\n}\nfunction nearest(ro,rd,scene,lo=.001,hi=1e30,farRoot=false){let best=null;for(const s of scene){const h=hitSphere(ro,rd,s,lo,best?best.t:hi,farRoot);if(h)best=h;}return best;}\nfunction sky(d){const t=.5*(d[1]+1);return [1-.48*t,1-.34*t,1-.08*t];}\nfunction encode(v){v=Math.max(0,Math.min(1,v));return v<=.0031308?12.92*v:1.055*Math.pow(v,1/2.4)-.055;}\nfunction renderRay(config){\n const w=160,h=100,pixels=new Uint8ClampedArray(w*h*4);let rayCount=0;const start=performance.now(),sun=unit([-.6,1,.6]);\n function trace(ro,rd,depth){rayCount++;const hit=nearest(ro,rd,config.scene,.001,1e30,config.farRoot);if(!hit)return sky(rd);\n  if(config.mode==='normals')return hit.n.map(x=>x*.5+.5);\n  if(config.mode==='depth'){const z=Math.exp(-hit.t*.28);return [z,z,z];}\n  const blocked=config.shadow&&nearest(add(hit.p,scale(hit.n,.002)),sun,config.scene);\n  const light=.15+(blocked?0:.85*Math.max(0,dot(hit.n,sun))),base=hit.s.c.map(x=>x*light);\n  const reflectivity=config.mode==='mirror'?(hit.s.m||0):0;\n  if(depth<=0||reflectivity<=0)return base;\n  const reflected=unit(config.reflector(rd,hit.n));if(!reflected)return base;\n  const bounce=trace(add(hit.p,scale(hit.n,.002)),reflected,depth-1);\n  return base.map((x,i)=>(1-reflectivity)*x+reflectivity*bounce[i]);\n }\n for(let y=0;y<h;y++)for(let x=0;x<w;x++){\n  const rd=config.direction((2*(x+.5)/w-1),(1-2*(y+.5)/h));const color=trace(config.origin,rd,config.depth);\n  for(let k=0;k<3;k++)pixels[(y*w+x)*4+k]=Math.round(encode(color[k])*255);pixels[(y*w+x)*4+3]=255;\n }\n const probeDirection=config.direction(config.probeX||0,0),probe=nearest(config.origin,probeDirection,config.scene,.001,1e30,config.farRoot);\n return {w,h,pixels,rayCount,elapsed:performance.now()-start,probe:probe?{t:probe.t,p:probe.p,n:probe.n,id:probe.s.id,front:probe.front}:null,origin:config.origin,direction:probeDirection,mode:config.mode};\n}"
  },
  "tasks": [
    {
      "title": "手算中心射线",
      "prompt": "先取 o=(0,0,0)、d=(0,0,−1)、c=(0,0,−3)、R=1，写出 a、h、k、两个根及可见根。再将 d 改为 (0,0,−2)，解释命中位置不变但 t 为什么改变。修改代码验证。",
      "hint": "第一组根为2与4；第二组参数缩为一半，但 t d 仍表示同一位移。"
    },
    {
      "title": "用错误图像反推根选择",
      "prompt": "先预测远根优先对法线图和镜面图的影响，再切换预设。说明这与“整个球都画反面”为什么不是完全相同的问题。",
      "hint": "这里改变的是每条射线选哪个交点；法线还会按朝向射线一侧调整。"
    },
    {
      "title": "反射与数值偏移",
      "prompt": "比较0/1/3次反射，找一个只有反射开启才会出现的区域。到源码中把起点偏移从0.002改到0与0.1，记录自相交或漏光的可能条件。",
      "hint": "偏移是数值折衷，不能随场景尺度任意固定。"
    }
  ],
  "quiz": [
    {
      "question": "d 未归一化时，t 一定是欧氏距离吗？",
      "options": [
        "一定",
        "不一定，取决于 d 的长度",
        "只要球半径为1就一定"
      ],
      "answer": 1,
      "explanation": "位移长度是 |t|‖d‖。方向单位化后，正 t 才直接表示距离。"
    },
    {
      "question": "相机在球内部，较小根为负时应如何？",
      "options": [
        "直接判定无交点",
        "尝试有效区间内另一个根",
        "取负根绝对值"
      ],
      "answer": 1,
      "explanation": "负根位于射线起点后方，另一个正根可能是离开球面的命中。"
    },
    {
      "question": "多个球都命中时，最终可见表面如何确定？",
      "options": [
        "场景数组最后一个球",
        "有效正 t 最小的命中",
        "半径最大的球"
      ],
      "answer": 1,
      "explanation": "可见性由沿射线的最近有效命中决定，不由提交顺序或大小决定。"
    },
    {
      "question": "r=d−2(d·n)n 的常用形式要求什么？",
      "options": [
        "n 为单位法线",
        "d 必须等于 n",
        "n 的长度任意都可以"
      ],
      "answer": 0,
      "explanation": "非单位 n 会错误缩放法线分量；可先归一化或使用带 n·n 分母的一般投影形式。"
    },
    {
      "question": "新射线起点小偏移主要解决什么？",
      "options": [
        "提高几何精度到无限",
        "减少浮点误差导致的自相交",
        "代替最近交点选择"
      ],
      "answer": 1,
      "explanation": "偏移减少立即再击中同一表面的风险，但过大会漏掉近邻结构。"
    }
  ],
  "misconceptions": [
    "追踪射线并不自动意味着物理正确；材质、光源和采样仍决定结果。",
    "两个实根不等于两个都在相机前方。",
    "镜面反射需要二次可见性查询，不能仅通过把主球调亮实现。",
    "法线编码是调试颜色，不是材质的真实反射色。"
  ],
  "next": "下一周让反射方向变成随机变量，理解间接光为何带来噪声，以及样本数为何影响质量。",
  "sources": [
    {
      "title": "Ray Tracing in One Weekend · 原作者教材",
      "url": "https://raytracing.github.io/books/RayTracingInOneWeekend.html",
      "why": "射线方程、解析球求交、最近命中与材质反射。"
    },
    {
      "title": "PBRT 4 · Spheres",
      "url": "https://pbr-book.org/4ed/Shapes/Spheres",
      "why": "深入参考球体求交与数值处理；本周不要求完整实现。"
    }
  ]
};
