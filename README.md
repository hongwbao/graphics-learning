# 计算机图形学学习项目

一条面向实时渲染的 16 周图形学基础路线。重点是理解图像如何形成、做视觉实验、诊断问题；Unreal 和 Qt 不是课程目标。车机导航与道路场景可以作为练习素材。

学习者已有 C++、C、Python 和基础 OpenGL 经验，接触过 3D 重建；数学按需要补习。计划按每周 6～8 小时设计，实际时间不足时延长周期即可。

## 统一课程入口

整个网站的部署根目录是 [`weeks/`](weeks/)，首页是 [`weeks/index.html`](weeks/index.html)。每周都是它的一个子页面，不需要分别启动服务。

```bash
cd /home/bhw/repos/graphics-learning/weeks
python3 serve.py --port 8003 --bind 127.0.0.1
```

- 首页：**http://127.0.0.1:8003/**
- 第 1 周：**http://127.0.0.1:8003/week-01/**
- 第 2 周：**http://127.0.0.1:8003/week-02/**

无需安装 npm 或 Python 包。使用 Python 3 标准库即可，按 Ctrl+C 停止。若端口占用，请改用其他端口并同步修改地址。

第 1–16 周课程均已制作，全部从同一个首页进入：

- [第 1–4 周：从场景到屏幕](weeks/index.html#courses)：渲染管线、坐标、矩阵、相机与投影。
- [第 5–8 周：形成可见表面](weeks/week-05/index.html)：覆盖/插值、深度、纹理与中期软件渲染项目。
- [第 9–12 周：光、材质与图像质量](weeks/week-09/index.html)：法线、微表面材质、shadow map、抗锯齿与颜色。
- [第 13–16 周：性能与光线追踪](weeks/week-13/index.html)：CPU/WebGL测量、球体追踪、随机路径与期末项目。

每周包含递进解释、图解/交互实验、可修改的核心代码、预测任务、答后测验和记录导出。高阶实验有明确简化边界，不作为完整渲染器或实际 GPU profiler 的替代。第 3–16 周采用统一 Worker 计算框架，错误和超时保留上一张成功图像；第 13 周另有真实 WebGL 测量。

以后只需在 `weeks/week-XX/` 加入新课程，并在 [`weeks/courses.js`](weeks/courses.js) 登记入口；首页、周次选择及上一周/下一周导航会使用同一份目录。正在运行的本地静态服务不需要为每周重新配置。若发布到远程托管，新增文件仍需同步到原站点；部署根目录始终保持 `weeks/`。

详见 [统一部署说明](weeks/README.md)。GitHub 源码预览不会运行交互页面；下载后本地启动即可。学习记录只保存在当前浏览器，建议通过课程内按钮导出。

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
