# 图形学自主学习课程
<!-- impeccable:product-schema 1 -->
## Platform
web
## Stack
用户要求少依赖、本地运行、长期保存；采用原生 HTML/CSS/JavaScript 与 WebGL，无构建步骤。
## Users
有基础 OpenGL 与 3D 重建经验的计算机硕士，数学按需补充。
## Product Purpose
以预测、实验、解释建立实时渲染知识体系；第一周能画出模型到屏幕的数据流并解释两个着色器的职责。
## Operating Context
依据 README.md、学习计划.md、AI辅助学习.md 和学习记录模板.md。桌面与手机自主阅读，每周约 6–8 小时。
## Capabilities and Constraints
中文分步课程、可调三维场景、预测记录、答后解析、来源链接。只交付本地文件，不部署。不变成具体引擎操作教程。
## Product Principles
先直觉后符号；每次只改一个变量；主动修改一处核心代码；区分基础和延伸。

## Confirmed Learning Preferences
用户于 2026-11-12 反馈：已有编程基础，希望直接编辑少量核心代码来获得更高自由度；参数滑块作为辅助。知识讲解应结合图示和可观察的计算过程，尤其管线不能只有文字。此偏好适用于后续课程。

## Course Site Structure
用户确认将 `weeks/` 作为统一静态站点根目录，`weeks/index.html` 为课程首页，每周是独立子页面。保留完整 weeks 目录及公共导航资源；课程清单由 `weeks/courses.js` 统一维护，不为每周单独启动服务。
