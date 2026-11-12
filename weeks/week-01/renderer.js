/* 无第三方依赖。列向量、列主序矩阵，右手坐标；WebGL 1 / GLSL ES 1.00。 */
'use strict';
// STUDENT_TODO: 先预测方向，再将 0.0 改成 0.6，刷新并比较青色模型与红色参照物。
const STUDENT_TODO_X_OFFSET = 0.0;
(() => {
  const canvas = document.querySelector('#scene');
  const gl = canvas.getContext('webgl', {antialias:true, preserveDrawingBuffer:true});
  const defaults = {modelX:0, rotation:25, cameraX:0, distance:6, light:35, color:'#52b6a0', shading:'lit', depth:true, reversed:false};
  const state = {...defaults};
  const error = message => {const el=document.querySelector('#webgl-error');el.hidden=false;el.textContent=message;document.querySelector('#render-state').textContent='三维实验不可用';};
  if (!gl) {error('无法创建 WebGL 上下文。请启用浏览器图形加速，或换用支持 WebGL 的浏览器后刷新。正文、测验与笔记仍可使用。');window.GraphicsLab={available:false};return;}
  // 编辑区只暴露函数体，声明、资源绑定与绘制框架由课程提供。
  const defaultSnippets = Object.freeze({
    vertex: `gl_Position = uProjection * uView * uModel
            * vec4(aPosition, 1.0);
// 本例仅旋转、平移、统一缩放；非均匀缩放需逆转置法线矩阵。
vNormal = mat3(uModel) * aNormal;`,
    fragment: `vec3 n = normalize(vNormal);
vec3 l = normalize(uLightDirection);
float ambient = 0.22;
float diffuse = 0.78;
float brightness = ambient
  + diffuse * max(dot(n, l), 0.0);
gl_FragColor = vec4(uColor * brightness, 1.0);`
  });
  let snippets = {...defaultSnippets};
  function sourcesFor(code) {
    return {
      vertex: `attribute vec3 aPosition;
attribute vec3 aNormal;
uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;
varying vec3 vNormal;
void main() {
${code.vertex}
}`,
      fragment: `precision mediump float;
uniform vec3 uColor;
uniform vec3 uLightDirection;
uniform int uMode;
varying vec3 vNormal;
void main() {
  if (uMode == 0) {
${code.fragment}
  } else if (uMode == 2) {
    gl_FragColor = vec4(normalize(vNormal) * 0.5 + 0.5, 1.0);
  } else {
    gl_FragColor = vec4(uColor, 1.0);
  }
}`
    };
  }
  function shader(type, source) {
    const result = gl.createShader(type);
    gl.shaderSource(result, source);
    gl.compileShader(result);
    if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(result);
      gl.deleteShader(result);
      throw Error((type === gl.VERTEX_SHADER ? '顶点' : '片段') + '着色器：\n' + log);
    }
    return result;
  }
  let program, uniforms = {}, pos = -1, normal = -1;
  function applySnippets(code) {
    const sources = sourcesFor(code);
    let candidate, vs, fs;
    try {
      vs = shader(gl.VERTEX_SHADER, sources.vertex);
      fs = shader(gl.FRAGMENT_SHADER, sources.fragment);
      candidate = gl.createProgram();
      gl.attachShader(candidate, vs);
      gl.attachShader(candidate, fs);
      gl.linkProgram(candidate);
      if (!gl.getProgramParameter(candidate, gl.LINK_STATUS)) {
        throw Error('链接失败：\n' + gl.getProgramInfoLog(candidate));
      }
      // 只有新程序成功连接后才替换旧程序；错误不会抹掉上次画面。
      const previous = program;
      program = candidate;
      gl.useProgram(program);
      if (pos >= 0) gl.disableVertexAttribArray(pos);
      if (normal >= 0) gl.disableVertexAttribArray(normal);
      uniforms = {};
      for (const key of ['Model', 'View', 'Projection', 'Color', 'LightDirection', 'Mode']) {
        uniforms[key] = gl.getUniformLocation(program, 'u' + key);
      }
      pos = gl.getAttribLocation(program, 'aPosition');
      normal = gl.getAttribLocation(program, 'aNormal');
      snippets = {...code};
      if (previous) gl.deleteProgram(previous);
      return {ok:true, sources};
    } catch (e) {
      if (candidate) gl.deleteProgram(candidate);
      return {ok:false, log:e.message, sources};
    } finally {
      if (vs) gl.deleteShader(vs);
      if (fs) gl.deleteShader(fs);
    }
  }
  const initial = applySnippets(defaultSnippets);
  if (!initial.ok) {
    error('着色器编译或链接失败：' + initial.log);
    window.GraphicsLab = {available:false};
    return;
  }
  function mesh(vertices,normals){const p=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,p);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);const n=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,n);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(normals),gl.STATIC_DRAW);return {p,n,count:vertices.length/3};}
  const vertices=[],normals=[],lines=[],lineNormals=[];
  // 每个面有四个角，两个三角形。关闭背面剔除，以观察深度与顺序本身。
  const faces=[[[0,0,1],[[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]]],[[0,0,-1],[[1,-1,-1],[-1,-1,-1],[-1,1,-1],[1,1,-1]]],[[1,0,0],[[1,-1,1],[1,-1,-1],[1,1,-1],[1,1,1]]],[[-1,0,0],[[-1,-1,-1],[-1,-1,1],[-1,1,1],[-1,1,-1]]],[[0,1,0],[[-1,1,1],[1,1,1],[1,1,-1],[-1,1,-1]]],[[0,-1,0],[[-1,-1,-1],[1,-1,-1],[1,-1,1],[-1,-1,1]]]];
  for(const [n,points] of faces){for(const i of [0,1,2,0,2,3]){vertices.push(...points[i].map(v=>v*.65));normals.push(...n);}for(const [a,b] of [[0,1],[1,2],[2,0],[0,2],[2,3],[3,0]]){lines.push(...points[a].map(v=>v*.65),...points[b].map(v=>v*.65));lineNormals.push(...n,...n);}}
  const cube=mesh(vertices,normals),wire=mesh(lines,lineNormals);
  const floor=mesh([-7,-.66,-7,7,-.66,-7,7,-.66,4,-7,-.66,-7,7,-.66,4,-7,-.66,4],Array(6).fill([0,1,0]).flat());
  const gridV=[],gridN=[];for(let i=-7;i<=7;i++){gridV.push(i,-.655,-7,i,-.655,4,-7,-.655,i,7,-.655,i);gridN.push(...Array(4).fill([0,1,0]).flat());}const grid=mesh(gridV,gridN);
  function identity(){return [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];}
  function model(x,y,z,angle=0,scale=1){const c=Math.cos(angle)*scale,s=Math.sin(angle)*scale;return [c,0,-s,0,0,scale,0,0,s,0,c,0,x,y,z,1];}
  function normalize(v){const len=Math.hypot(...v);return v.map(x=>x/len);}
  function cross(a,b){return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
  const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
  function lookAt(eye,target){const z=normalize(eye.map((v,i)=>v-target[i])),x=normalize(cross([0,1,0],z)),y=cross(z,x);return [x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1];}
  function perspective(aspect){const f=1/Math.tan(50*Math.PI/360),near=.1,far=50;return [f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0];}
  function bind(m) {
    // 代码可能不再使用某个属性；被编译器优化掉的属性位置为 -1。
    if (pos >= 0) {gl.bindBuffer(gl.ARRAY_BUFFER,m.p);gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,3,gl.FLOAT,false,0,0);}
    if (normal >= 0) {gl.bindBuffer(gl.ARRAY_BUFFER,m.n);gl.enableVertexAttribArray(normal);gl.vertexAttribPointer(normal,3,gl.FLOAT,false,0,0);}
  }
  function draw(m,matrix,color,mode=0,primitive=gl.TRIANGLES){bind(m);gl.uniformMatrix4fv(uniforms.Model,false,new Float32Array(matrix));gl.uniform3fv(uniforms.Color,color);gl.uniform1i(uniforms.Mode,mode);gl.drawArrays(primitive,0,m.count);}
  function hex(value){return [1,3,5].map(i=>parseInt(value.slice(i,i+2),16)/255);}
  function render(){
    if (gl.isContextLost()) return;
    const rect=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2),w=Math.max(1,Math.round(rect.width*dpr)),h=Math.max(1,Math.round(rect.height*dpr));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
    gl.viewport(0,0,w,h);gl.clearColor(.063,.16,.137,1);gl.clearDepth(1);gl.depthMask(true);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    // 保持朝向固定：改变 distance 只沿 Z 移动，不重新对准原点。
    const tilt=2/6;gl.uniformMatrix4fv(uniforms.View,false,new Float32Array(lookAt([state.cameraX,2,state.distance],[state.cameraX,2-tilt, state.distance-1])));gl.uniformMatrix4fv(uniforms.Projection,false,new Float32Array(perspective(w/h)));
    const angle=state.light*Math.PI/180;gl.uniform3fv(uniforms.LightDirection,normalize([Math.sin(angle),.8,Math.cos(angle)]));
    // 环境地面始终先画并带深度；教学开关针对两个立方体的遮挡。
    gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LESS);draw(floor,identity(),[.10,.22,.18],1);draw(grid,identity(),[.17,.31,.25],1,gl.LINES);
    state.depth?gl.enable(gl.DEPTH_TEST):gl.disable(gl.DEPTH_TEST);
    const mode=state.shading==='lit'?0:state.shading==='normals'?2:1;
    const main=()=>draw(state.shading==='wire'?wire:cube,model(state.modelX+STUDENT_TODO_X_OFFSET,0,0,state.rotation*Math.PI/180),hex(state.color),mode,state.shading==='wire'?gl.LINES:gl.TRIANGLES);
    const rear=()=>draw(state.shading==='wire'?wire:cube,model(1.05,-.16,-1.7,-.2,.75),[.73,.38,.30],mode,state.shading==='wire'?gl.LINES:gl.TRIANGLES);
    if(state.reversed){rear();main();}else{main();rear();}
    document.querySelector('#render-state').textContent='WebGL 1 · '+(state.depth?'深度开启':'深度关闭');
    document.querySelector('#scene-readout').textContent=`模型 X = ${state.modelX.toFixed(1)} · 相机 X = ${state.cameraX.toFixed(1)} · 代码偏移 ${STUDENT_TODO_X_OFFSET.toFixed(1)}`;
    // 编辑器旁显示同一 WebGL 帧的副本，便于一边改代码一边观察。
    const preview = document.querySelector('#code-preview');
    if (preview) {
      const ctx = preview.getContext('2d');
      const scale = Math.min(preview.width / w, preview.height / h);
      ctx.fillStyle = '#102923'; ctx.fillRect(0,0,preview.width,preview.height);
      ctx.drawImage(canvas,(preview.width-w*scale)/2,(preview.height-h*scale)/2,w*scale,h*scale);
    }
  }
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();window.GraphicsLab.available=false;error('WebGL 上下文已丢失，三维实验暂不可用。请刷新页面重新初始化；笔记仍保留。');});
  window.GraphicsLab={available:true,state,defaults,render,defaultSnippets,applySnippets,getSnippets:()=>({...snippets}),sourcesFor,offset:STUDENT_TODO_X_OFFSET,reset(){Object.assign(state,defaults);render();},capture(){render();return canvas.toDataURL('image/png');},check(){return gl.getError();}};
  new ResizeObserver(()=>render()).observe(canvas);render();
})();
