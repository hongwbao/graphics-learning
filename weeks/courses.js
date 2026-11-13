/* 课程唯一目录：新课程完成后，将对应 path 设为 week-XX/index.html。
 * 不使用 fetch 或构建步骤，HTTP 与 file:// 都可运行。
 */
'use strict';
window.GraphicsCourses=Object.freeze([
  {week:1,phase:1,title:'从场景到屏幕',description:'用真实 WebGL 场景串起顶点、片段、光栅化与深度测试。',path:'week-01/index.html',level:'基础'},
  {week:2,phase:1,title:'向量与坐标系',description:'手算坐标、投影与叉积，修复空间混用，用反例验证。',path:'week-02/index.html',level:'进阶'},
  {week:3,phase:1,title:'矩阵与变换',description:'真实矩阵组合、中心轨迹与支点旋转。',path:'week-03/index.html',level:'进阶'},
  {week:4,phase:1,title:'相机与投影',description:'相机、FOV、正交/透视和四维裁剪。',path:'week-04/index.html',level:'进阶'},
  {week:5,phase:2,title:'三角形与光栅化',description:'覆盖、重心坐标与透视属性插值。',path:'week-05/index.html',level:'进阶'},
  {week:6,phase:2,title:'深度与遮挡',description:'深度映射、量化冲突与遮挡诊断。',path:'week-06/index.html',level:'进阶'},
  {week:7,phase:2,title:'纹理与采样',description:'UV、双线性与真实 mip 链采样。',path:'week-07/index.html',level:'进阶'},
  {week:8,phase:2,title:'中期实验',description:'组合相机、纹理和深度的软件渲染项目。',path:'week-08/index.html',level:'进阶'},
  {week:9,phase:3,title:'法线与光照',description:'法线变换、非均匀缩放与光照分解。',path:'week-09/index.html',level:'进阶'},
  {week:10,phase:3,title:'材质与 PBR',description:'GGX 微表面、粗糙度、金属性与能量约束。',path:'week-10/index.html',level:'进阶'},
  {week:11,phase:3,title:'阴影与可见性',description:'两遍 shadow map、偏移与 PCF 伪影诊断。',path:'week-11/index.html',level:'进阶'},
  {week:12,phase:3,title:'抗锯齿与颜色',description:'覆盖采样、抗锯齿与线性/sRGB 比较。',path:'week-12/index.html',level:'进阶'},
  {week:13,phase:4,title:'GPU 与性能',description:'真实 WebGL 工作量测量与 CPU 对照。',path:'week-13/index.html',level:'进阶'},
  {week:14,phase:4,title:'光线追踪',description:'射线球求交、有效最近根与镜面反射。',path:'week-14/index.html',level:'进阶'},
  {week:15,phase:4,title:'路径追踪与全局光照',description:'真实随机路径、间接散射与噪声收敛。',path:'week-15/index.html',level:'进阶'},
  {week:16,phase:4,title:'期末项目',description:'可修改场景、对照实验与完整项目报告。',path:'week-16/index.html',level:'进阶'}
]);
