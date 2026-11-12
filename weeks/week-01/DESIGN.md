---
name: 图形学手记
description: 本地图形学自主学习课程
colors:
  primary: "#225c49"
  paper: "#f7f7f1"
  ink: "#233c35"
  muted: "#56685f"
  rail: "#163c36"
  line: "#d7ded2"
typography:
  display:
    fontFamily: 'Noto Serif CJK SC, Source Han Serif SC, Songti SC, serif'
    fontSize: '54px'
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: 'Noto Sans CJK SC, Microsoft YaHei, sans-serif'
    fontSize: '16px'
    lineHeight: 1.85
rounded:
  control: '5px'
  lab: '12px'
spacing:
  small: '12px'
  medium: '20px'
  section: '62px'
components:
  button-primary:
    backgroundColor: '{colors.primary}'
    textColor: '#ffffff'
    rounded: '{rounded.control}'
    padding: '12px 20px'
---

## Overview

以中文阅读和可验证的视觉实验为中心。米白阅读面、深绿目录栏与深色三维观察区，区分阅读、导航和实验。页面层级依赖文字、留白和分隔线。

## Colors

颜色以 style.css 的 :root 为准；正文、辅助文案使用 ink 与 muted。颜色输入属于实验数据，不改变网站主题。

## Typography

中文标题用本地可用宋体族，正文用中文无衬线字体。网站不下载远程字体；操作系统缺少指定字体时使用相应系统字体族回退。公式、代码分别使用数学衬线与等宽字。辅助文本下限 12px，正文 15–16px。

## Layout

桌面 238px 固定目录；1100px 以下改为 205px。760px 以下目录变为顶部横向可滚动导航，实验控件、前后对照和正文垂直排列。阅读内容最大约 920–1020px，使用分栏控制短段文字长度。手机正文左右各 22px。

## Elevation & Depth

平面排版，靠底色与细边界区分信息，无阴影。立方体深度只由实际三维渲染呈现。

## Shapes

控件 5px 圆角，实验整体 12px。正文不装入重复卡片。

## Components

主按钮深绿底白字；次按钮浅底细边。可聚焦元素有明确焦点轮廓。答题解析提交后显示；任务参考解释在写下预测、执行实验并提交解释后显示。禁用状态用真实 disabled 属性。

## Do's and Don'ts

- 保持语义标题、可读对比和键盘操作。
- 将核心和延伸明确区分；不要用装饰动画干扰几何实验。
- 参数变化实时渲染，无持续动画循环。减少动态效果偏好下关闭平滑滚动。
