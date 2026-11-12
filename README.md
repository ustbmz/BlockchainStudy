# BlockchainStudy · 区块链开发工程师复习站

把「区块链开发工程师系统课程」的作业要求、作业答案与学习笔记整理成一个可自学的静态网站：
**66 篇文档 + 63 张复习卡片 + 29 步引导式学习路径**，纯前端、无后端、可离线打开。

在线访问：<https://ustbmz.github.io/BlockchainStudy/>

---

## 功能

- **学习路径**：29 步有序路线，横跨 5 个阶段。每步含目标说明、预计时长、关联资料；支持「未开始 / 进行中 / 已完成」三态、阶段进度条与总进度环，完成后自动推荐下一步（全部走完有庆祝态）
- **复习卡片**：Uniswap V2/V3 问答、Solidity 面试题拆成卡片，先看问题、点击展开答案自测，可标记「已掌握」
- **文档阅读**：Markdown 渲染、目录锚点、Go / Solidity 代码高亮、KaTeX 数学公式
- **全文搜索**：搜概念、代码、笔记内容，命中高亮
- **进度记录**：阅读进度与卡片掌握状态存浏览器 localStorage，侧栏可一键重置
- **严格模式**：开启后按顺序解锁，只有完成当前步才能进入下一步（适合零基础照着走）

## 目录结构

```
index.html          入口
css/style.css       全站样式（GitHub Primer Light 配色）
js/content.js       构建产物：全部文档内容与元信息
js/path.js          学习路径步骤数据（29 步）
js/app.js           路由、渲染、进度与搜索逻辑
build.js            构建脚本：汇总源素材生成 js/content.js
vendor/             marked / highlight.js / KaTeX（已本地化，离线可用）
```

## 本地运行

直接双击 `index.html` 即可；或起一个静态服务：

```bash
python3 -m http.server 8765 --bind 127.0.0.1
# 打开 http://127.0.0.1:8765
```

## 重建内容

`js/content.js` 已随仓库提交，无需重建即可使用。笔记更新后想同步到网站：

```bash
node build.js
# 素材不在默认位置时：
HW_DIR=/path/to/HomeworkList ANS_DIR=/path/to/homeWork node build.js
```

> 源素材（老师作业目录 + 我的作业答案目录）没有放进本仓库，站点内容以构建产物 `js/content.js` 的形式提交，因此克隆下来即可直接运行。

## 课程阶段

| 阶段 | 内容 |
|---|---|
| 01 Golang 后端基础 | Go 语法、并发、GORM、Gin、个人博客系统大作业 |
| 02 Solidity 智能合约基础 | 语法与 EVM 存储、50 道面试题、三个作业合约 |
| 03 后端实战 Go-Ethereum | 架构笔记、查询区块、发送交易、合约部署与调用 |
| 04 合约实战 | MetaNodeStake 分析与 Foundry 迁移测试、Uniswap V2 笔记与 V2/V3 问答、ERC/EIP 标准速查（外链） |
| 05 项目拆解 | 任务书与检查清单 |

## 技术说明

- 零构建依赖（构建脚本仅用 Node 内置模块），前端库全部本地化
- 路由基于 URL hash（`#/home`、`#/path`、`#/doc/:id`、`#/cards/:docId`、`#/search/:q`），部署到任意静态托管均可直接使用
