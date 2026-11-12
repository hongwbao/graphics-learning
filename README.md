# 计算机图形学学习项目

一条面向实时渲染的 16 周图形学基础路线。重点是理解图像如何形成、做视觉实验、诊断问题；Unreal 和 Qt 不是课程目标。车机导航与道路场景可以作为练习素材。

学习者已有 C++、C、Python 和基础 OpenGL 经验，接触过 3D 重建；数学按需要补习。计划按每周 6～8 小时设计，实际时间不足时延长周期即可。

## 第 2 周交互课程（进阶）

[第 2 周：向量与坐标系](weeks/week-02/index.html) 已完成：局部/世界坐标轴、点与方向的数值追踪、点积与投影、叉积退化分析、四项数值推导、两类 GLSL 故障与四姿态修复检验。

从仓库根目录启动整个课程，周次间导航可直接使用：

```bash
python3 -m http.server 8003 --bind 127.0.0.1
```

打开 **http://127.0.0.1:8003/weeks/week-02/**。第 1 周位于 **http://127.0.0.1:8003/weeks/week-01/**。不需要安装依赖。详见 [第 2 周运行说明](weeks/week-02/README.md)。

## 第 1 周交互课程

已完成 [第 1 周：从场景到屏幕](weeks/week-01/index.html)。包含真实 WebGL 场景、单变量预测实验、管线讲解、六道测验和学习记录导出。

克隆仓库后，在仓库根目录运行：

```bash
python3 -m http.server 8001 --bind 127.0.0.1 --directory weeks/week-01
```

浏览器打开 **http://127.0.0.1:8001/**。无需安装 npm 或 Python 包，使用 Python 3 标准库即可。按 `Ctrl+C` 停止。

GitHub 的源码预览不会执行交互网站；请下载或克隆后在本地运行。课程正文和实验可离线使用，外部参考链接需要联网。浏览器学习记录仅保存在本机，建议通过课程内的按钮导出。

详见 [第 1 周运行说明](weeks/week-01/README.md) 和 [验证报告](weeks/week-01/checks/验证说明.md)。

## 从这里开始

1. 阅读 [16 周学习计划](学习计划.md)，先做第一周实验。
2. 每周复制 [学习记录模板](学习记录模板.md)，保存预测、结果和复盘。
3. 参考 [AI 辅助学习指南](AI辅助学习.md)，让 AI 帮助搭建实验和提问。

核心路线：场景与坐标 → 投影 → 光栅化与深度 → 纹理与光照 → 采样和性能 → 光线追踪。

## 参考资料

- [Berkeley CS 184：计算机图形学](https://cs184.eecs.berkeley.edu/fa26/)：系统课程主线，按主题选择讲义。
- [LearnOpenGL](https://learnopengl.com/)：实时渲染与 OpenGL 实验参考，按主题查阅。
- [Ray Tracing in One Weekend](https://raytracing.github.io/books/RayTracingInOneWeekend.html)：光线追踪入门，供第 14 周以后使用。
- [Physically Based Rendering](https://pbr-book.org/)：深入参考书，不需要从头通读。

完成实验后，可自行在项目中创建 `experiments/` 和 `notes/`，分别保存代码、图片与学习记录。
