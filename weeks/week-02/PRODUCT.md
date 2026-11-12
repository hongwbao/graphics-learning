# 图形学第 2 周：向量与坐标系
<!-- impeccable:product-schema 1 -->
## Platform
web
## Stack
原生 HTML/CSS/JavaScript、WebGL 1、Canvas 2D，无运行依赖或构建步骤。独立目录可保存、离线使用。
## Users
有 C/C++/Python、基础 OpenGL 与 3D 重建经验，数学按需补充的计算机硕士。
## Product Purpose
能区分点与方向、局部与世界坐标，手算刚体坐标转换，推导投影，解释叉积用途与退化，并诊断空间混用。
## Operating Context
继承项目学习计划及第 1 周反馈；本周明确提高难度，推荐 7–9 小时完成全部实验，支持分次学习。
## Capabilities and Constraints
继承第 1 周的阅读与交互视觉语言；图文结合，直接编辑核心 GLSL，包含数学推导和反例。只用旋转和平移，不提前展开矩阵乘法顺序或完整法线逆转置推导。
## Confirmed Learning Preferences
用户希望减少纯滑块操作、允许直接改核心几行代码；知识讲解必须配图。本周新增非平凡数值题、数值退化分析和多姿态修复检验。
## Product Principles
直觉→公式→代码→反例；说明每条结论的前提；把参考数值与学生着色器的输出区分；验证有限案例不等于证明全部正确。

## Course Site Structure
用户确认将 `weeks/` 作为统一静态站点根目录，`weeks/index.html` 为课程首页，每周是独立子页面。保留完整 weeks 目录及公共导航资源；课程清单由 `weeks/courses.js` 统一维护，不为每周单独启动服务。
