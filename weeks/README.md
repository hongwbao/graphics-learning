# 图形学课程：一次部署，按周学习

本目录是整个网站的唯一部署根目录，`index.html` 为总首页，各周独立为子页面。

## 本地启动

```bash
cd /home/bhw/repos/graphics-learning/weeks
python3 serve.py --port 8003 --bind 127.0.0.1
```

打开 **http://127.0.0.1:8003/**，从首页进入课程：

- `/week-01/`：从场景到屏幕。
- `/week-02/`：向量与坐标系（进阶）。
- `/week-03/` 至 `/week-16/`：矩阵/投影、光栅化/深度/纹理、光照/材质/阴影、性能与光线追踪。

只运行这一个服务即可访问所有周次。之后新增文件会直接由同一静态服务提供，无需为新课程再启动一个端口。终端按 Ctrl+C 停止。若已有进程占用端口，请使用另一个端口并同步修改浏览器地址，不要关闭无关进程。

依赖只有 Python 3 标准库；不需要 npm、构建步骤、账号或后端。

## 结构

```text
weeks/
├── index.html          # 课程首页
├── courses.js          # 统一课程目录
├── catalog.js          # 首页目录展示
├── navigation.js       # 子页面周次导航
├── course.css          # 首页与公共导航样式
├── week-01/index.html
├── week-02/index.html
├── shared/             # 第3–16周的运行/编辑/测验框架
├── week-03/index.html
└── week-16/index.html   # 中间各周同样独立成页
```

第 1–16 周均有完整入口，首页和周次导航已全部启用。

## 新增一周

1. 如需增加其他专题，在独立子目录内完成课程，入口保留为 `index.html`，课程自身资源用相对路径；修改既有周次可直接编辑该目录。
2. 在 `courses.js` 中新增或更新对应条目，填写 `path: '专题目录/index.html'`，按需更新简介或难度。
3. 在新页面引入 `../course.css`、`../courses.js`、`../navigation.js`，并放入导航容器：

```html
<link rel="stylesheet" href="../course.css">
<script defer src="../courses.js"></script>
<script defer src="../navigation.js"></script>
<div id="course-navigation" class="course-navigation"
     role="navigation" aria-label="周次导航">
  <a href="../index.html">课程首页</a>
</div>
```

首页和已有周次的选择器/相邻课程链接读取同一个目录，不需逐页维护。目录变更后刷新浏览器即可。

## 远程静态托管

若将来托管到服务器或静态网站平台，始终将此 `weeks/` 目录作为站点根目录，整体同步目录内容。新增课程继续更新同一个站点；仍需上传新增和修改文件，但不需要为每周创建新站点。

所有入口与资源使用相对路径，同样支持部署在 `/graphics-learning/` 等 URL 前缀下。此任务只整理统一静态入口，没有启用任何远程网站托管或开机常驻服务。

## 学习记录

每周继续使用原来的独立 localStorage 键，导航不修改学习记录。相同浏览器、协议、主机名和端口下，URL 路径改变不影响这些键；换端口或主机名会变成另一个存储来源。可以先在旧页面导出 Markdown，再统一使用新首页。

直接打开本目录 `index.html` 也可访问课程，目录脚本不依赖 fetch；file:// 的持久化行为由浏览器决定，建议固定本地 HTTP 地址。

## 验证

统一首页、导航、独立学习记录、手机布局与子路径部署已检查；详见 [验证说明](checks/验证说明.md)。两周原有课程回归检查均通过。


## 第 3–16 周的代码与记录

这些课程使用 `shared/runtime.js` 与 `shared/lesson.css` 统一提供核心代码编辑、参数、任务、答后测验及导出；各周的 `lesson.js` 独立定义知识内容与真正的计算实验。复杂几何/渲染 helper 放在只读 `lab.prelude`，浏览器编辑区保留关键公式，下载包含完整计算程序与当前输入。

核心 JavaScript 在独立 Worker 中运行，失败或超时不替换上次成功的计算程序。不是所有实验都用 GPU：例如深度量化、纹理过滤与光线追踪使用明确标注的 CPU 教学实现；第 13 周的附加 WebGL 面板则使用真实绘制调用。具体数值约定、限制与一手来源见每周页面和 README。

完整集成和数学检查详见 [第3–16周验证报告](checks/第3至16周验证说明.md)。每周用独立 `graphics-learning-week-XX-v1` 键保存参数、代码草稿/成功版本、预测与解释、测验和复盘，互不覆盖。


实验记录附带当时的核心代码、脚手架/数学 helper，以及不超过30万字符的实际输入表达式，保留 Infinity、NaN 和 typed array 的 JavaScript 表示。更大输入不内嵌记录，界面会提醒另存完整核心程序；此时仅保存 Markdown 不足以严格重现全部输入。下载程序包含当前实际输入，需在改变参数前及时保留。


## 避免旧目录缓存

推荐使用 `python3 serve.py` 启动：它始终服务本目录，给静态资源加 `Cache-Control: no-store`，不因旧的 If-Modified-Since 返回过期内容。HTML 引用和跨周链接也带发布版本，防止浏览器把旧课程目录脚本与新页面混用。课程首页不会因旧版目录脚本而删除已经发布的课程。

若浏览器此前已经缓存旧首页，可一次打开 `http://127.0.0.1:8003/?v=20261113-course16-r2#courses`，之后正常导航即可。URL版本参数不会改变同源localStorage学习记录。普通静态托管仍可使用，但更新课程资源后应更新HTML的资源版本。
