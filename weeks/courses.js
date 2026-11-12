/* 课程唯一目录：新课程完成后，将对应 path 设为 week-XX/index.html。
 * 不使用 fetch 或构建步骤，HTTP 与 file:// 都可运行。
 */
'use strict';
window.GraphicsCourses=Object.freeze([
  {week:1,phase:1,title:'从场景到屏幕',description:'用真实 WebGL 场景串起顶点、片段、光栅化与深度测试。',path:'week-01/index.html',level:'基础'},
  {week:2,phase:1,title:'向量与坐标系',description:'手算坐标、投影与叉积，修复空间混用，用反例验证。',path:'week-02/index.html',level:'进阶'},
  {week:3,phase:1,title:'矩阵与变换',description:'变换顺序为什么重要？',path:null},
  {week:4,phase:1,title:'相机与投影',description:'三维点如何到屏幕？',path:null},
  {week:5,phase:2,title:'三角形与光栅化',description:'哪些像素被覆盖？',path:null},
  {week:6,phase:2,title:'深度与遮挡',description:'哪个表面在前面？',path:null},
  {week:7,phase:2,title:'纹理与采样',description:'图片如何贴到模型上？',path:null},
  {week:8,phase:2,title:'中期实验',description:'把坐标、纹理与深度串起来。',path:null},
  {week:9,phase:3,title:'法线与光照',description:'表面为什么有明暗？',path:null},
  {week:10,phase:3,title:'材质与 PBR',description:'金属和塑料为何不同？',path:null},
  {week:11,phase:3,title:'阴影与可见性',description:'阴影如何生成？',path:null},
  {week:12,phase:3,title:'抗锯齿与颜色',description:'边缘为何闪烁、颜色为何偏暗？',path:null},
  {week:13,phase:4,title:'GPU 与性能',description:'一帧为何变慢？',path:null},
  {week:14,phase:4,title:'光线追踪',description:'从相机发射射线会看到什么？',path:null},
  {week:15,phase:4,title:'路径追踪与全局光照',description:'间接光与噪声从何而来？',path:null},
  {week:16,phase:4,title:'期末项目',description:'解释并改进一张图。',path:null}
]);
