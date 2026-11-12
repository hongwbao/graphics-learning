# 图形学课程：一次部署，按周学习

本目录是整个网站的唯一部署根目录，`index.html` 为总首页，各周独立为子页面。

## 本地启动

```bash
cd /home/bhw/repos/graphics-learning/weeks
python3 -m http.server 8003 --bind 127.0.0.1
```

打开 **http://127.0.0.1:8003/**，从首页进入课程：

- `/week-01/`：从场景到屏幕。
- `/week-02/`：向量与坐标系（进阶）。

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
└── week-XX/index.html  # 将来完成的课程
```

计划中的第 3–16 周只展示标题，不创建无内容的课程链接。

## 新增一周

1. 在 `week-03/` 等目录内完成课程，入口保留为 `index.html`，课程自身资源用相对路径。
2. 在 `courses.js` 中将该周的 `path: null` 改为 `path: 'week-03/index.html'`；按需更新简介或难度。
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
