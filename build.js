// 构建脚本：把老师的作业要求 + 我的作业答案汇总为 content.js
// 用法: node build.js
const fs = require('fs');
const path = require('path');

// 源素材目录，可用环境变量覆盖：HW_DIR=... ANS_DIR=... node build.js
const HW = process.env.HW_DIR || '/Users/cnmz/Study/HomeworkList';
const ANS = process.env.ANS_DIR || '/Users/cnmz/Projects/homeWork';
const OUT = path.join(__dirname, 'js', 'content.js');

// ---------- 内容清单（按课程 5 大阶段组织） ----------
const chapters = [
  {
    id: 'go',
    num: '01',
    title: 'Golang 后端基础',
    weeks: 3,
    summary: 'Go 基础语法 → 并发编程 → GORM → Gin → 个人博客系统大作业，打牢 DApp 后端开发基本功。',
    teacherFile: path.join(HW, '01.基础一：DApp 后端基础(Golang的学习).md'),
    groups: [
      { name: 'Lesson 01 · Go 基础', docs: [
        { title: 'LeetCode 算法题笔记', file: 'backup/lesson01/01-leetcode.md', lang: 'md' },
        { title: 'SumTwoN', file: 'backup/lesson01/SumTwoN.go', lang: 'go' },
        { title: 'ArrayDuplicates', file: 'backup/lesson01/ArrayDuplicates.go', lang: 'go' },
        { title: 'MergeIntervals', file: 'backup/lesson01/MergeIntervals.go', lang: 'go' },
        { title: 'PlusOne', file: 'backup/lesson01/plusOne.go', lang: 'go' },
        { title: 'PlusOne V2', file: 'backup/lesson01/plusOneV2.go', lang: 'go' },
      ]},
      { name: 'Lesson 02 · Go 进阶（并发/OOP）', docs: [
        { title: 'Go 进阶学习笔记（并发 / OOP）', file: 'backup/lesson02/README.md', lang: 'md' },
        { title: 'Goroutine', file: 'backup/lesson02/goroutine.go', lang: 'go' },
        { title: 'Channel', file: 'backup/lesson02/channel.go', lang: 'go' },
        { title: 'Lock 同步', file: 'backup/lesson02/lock.go', lang: 'go' },
        { title: 'OOP', file: 'backup/lesson02/oop.go', lang: 'go' },
        { title: 'Pointer', file: 'backup/lesson02/pointer.go', lang: 'go' },
      ]},
      { name: 'Lesson 03 · GORM 数据库', docs: [
        { title: 'GORM 学习笔记', file: 'backup/lesson03/README.md', lang: 'md' },
        { title: 'Hooks 钩子', file: 'backup/lesson03/hooks.go', lang: 'go' },
        { title: 'Models 模型', file: 'backup/lesson03/models.go', lang: 'go' },
        { title: 'Query 查询', file: 'backup/lesson03/query.go', lang: 'go' },
      ]},
      { name: 'Lesson 04 · Gin 博客系统大作业', docs: [
        { title: '博客系统 README', file: 'backup/lesson04/ApiuseGIN/README.md', lang: 'md' },
        { title: '实现指南', file: 'backup/lesson04/ApiuseGIN/IMPLEMENTATION_GUIDE.md', lang: 'md' },
        { title: '测试结果', file: 'backup/lesson04/ApiuseGIN/TEST_RESULTS.md', lang: 'md' },
        { title: 'handlers/auth.go', file: 'backup/lesson04/ApiuseGIN/handlers/auth.go', lang: 'go' },
        { title: 'handlers/post.go', file: 'backup/lesson04/ApiuseGIN/handlers/post.go', lang: 'go' },
        { title: 'handlers/comment.go', file: 'backup/lesson04/ApiuseGIN/handlers/comment.go', lang: 'go' },
        { title: 'middleware/auth.go', file: 'backup/lesson04/ApiuseGIN/middleware/auth.go', lang: 'go' },
        { title: 'models/models.go', file: 'backup/lesson04/ApiuseGIN/models/models.go', lang: 'go' },
        { title: 'utils/jwt.go', file: 'backup/lesson04/ApiuseGIN/utils/jwt.go', lang: 'go' },
        { title: 'utils/password.go', file: 'backup/lesson04/ApiuseGIN/utils/password.go', lang: 'go' },
      ]},
    ],
  },
  {
    id: 'solidity',
    num: '02',
    title: 'Solidity 智能合约基础',
    weeks: 3,
    summary: 'Solidity 语法 → 进阶特性与安全 → Hardhat/Foundry 框架 → 作业实战（算法合约 / 求助水池 / NFT 拍卖市场）。',
    teacherFile: path.join(HW, '02.Solidity智能合约基础.md'),
    groups: [
      { name: '学习资料', docs: [
        { title: 'Solidity 学习大纲（1445 行完整笔记）', file: 'backup/solidity/Solidity学习大纲.md', lang: 'md' },
        { title: 'Solidity 高频面试题（50 题）', file: 'backup/solidity/Solidity面试题.md', lang: 'md', qa: 'h3' },
      ]},
      { name: 'Homework 01 · 算法合约', docs: [
        { title: 'binarySearch 二分查找', file: 'backup/solidity/homework01/binarySearch.sol', lang: 'solidity' },
        { title: 'checkMark 打标记', file: 'backup/solidity/homework01/checkMark.sol', lang: 'solidity' },
        { title: 'mergeSortedArray 合并有序数组', file: 'backup/solidity/homework01/mergeSortedArray.sol', lang: 'solidity' },
      ]},
      { name: 'Homework 02 · 求助水池', docs: [
        { title: 'BeggingContract', file: 'backup/solidity/homework02/BeggingContract.sol', lang: 'solidity' },
      ]},
      { name: 'Homework 03 · NFT 拍卖市场', docs: [
        { title: 'NFT 拍卖市场 README', file: 'backup/solidity/homework03/nft-auction-market/README.md', lang: 'md' },
        { title: '测试报告', file: 'backup/solidity/homework03/nft-auction-market/测试报告.md', lang: 'md' },
        { title: 'NftAuction.sol', file: 'backup/solidity/homework03/nft-auction-market/contracts/NftAuction.sol', lang: 'solidity' },
        { title: 'NftAuctionV2.sol（升级版）', file: 'backup/solidity/homework03/nft-auction-market/contracts/NftAuctionV2.sol', lang: 'solidity' },
        { title: 'AuctionNFT.sol', file: 'backup/solidity/homework03/nft-auction-market/contracts/AuctionNFT.sol', lang: 'solidity' },
        { title: 'AuctionProxy.sol（代理合约）', file: 'backup/solidity/homework03/nft-auction-market/contracts/AuctionProxy.sol', lang: 'solidity' },
      ]},
    ],
  },
  {
    id: 'backend',
    num: '03',
    title: '后端实战：Go-Ethereum',
    weeks: 1,
    summary: '用 Go 与以太坊交互：RPC 客户端、账户与单位换算、查询区块、构建并签名发送交易、合约 ABI 与绑定。',
    teacherFile: path.join(HW, '03.后端实战.md'),
    groups: [
      { name: '笔记与架构', docs: [
        { title: 'goEth 项目说明', file: 'backup/goEth/README.md', lang: 'md' },
        { title: 'Go-Ethereum 核心功能与架构设计', file: 'backup/goEth/src/Go-Ethereum 核心功能与架构设计.md', lang: 'md' },
      ]},
      { name: '实战模块', docs: [
        { title: 'counter · 合约部署与调用', file: 'backup/goEth/src/counter/README.md', lang: 'md' },
        { title: 'counter/main.go', file: 'backup/goEth/src/counter/main.go', lang: 'go' },
        { title: 'Counter.sol', file: 'backup/goEth/src/counter/contracts/Counter.sol', lang: 'solidity' },
        { title: 'queryblock · 查询区块', file: 'backup/goEth/src/queryblock/README.md', lang: 'md' },
        { title: 'queryblock/main.go', file: 'backup/goEth/src/queryblock/main.go', lang: 'go' },
        { title: 'queryblock/rpc/rpc.go', file: 'backup/goEth/src/queryblock/rpc/rpc.go', lang: 'go' },
        { title: 'sendtx/main.go · 发送交易', file: 'backup/goEth/src/queryblock/sendtx/main.go', lang: 'go' },
        { title: 'sendtx/main_test.go', file: 'backup/goEth/src/queryblock/sendtx/main_test.go', lang: 'go' },
      ]},
    ],
  },
  {
    id: 'defi',
    num: '04',
    title: '合约实战：Stake / Uniswap / ERC',
    weeks: 3,
    summary: 'MetaNodeStake 质押合约分析与 Foundry 迁移测试 → Uniswap V2/V3 原理与问答（ERC/EIP 标准见学习路径外链手册）。',
    teacherFile: path.join(HW, '04.合约实战学习.md'),
    groups: [
      { name: '作业题目', docs: [
        { title: '合约实战作业题目', file: 'backup/MeteNode/00.合约实战作业题目.md', lang: 'md' },
      ]},
      { name: 'MetaNodeStake 质押合约', docs: [
        { title: '业务逻辑分析', file: '01.MetaNodeStake-业务逻辑分析.md', lang: 'md' },
        { title: 'Foundry 迁移记录', file: '02.Foundry-迁移记录.md', lang: 'md' },
        { title: 'Foundry 测试用例', file: '03.Foundry-测试用例.md', lang: 'md' },
      ]},
      { name: 'Uniswap V2', docs: [
        { title: '01 计算原理', file: 'uniswapV2 StudyNotes/01-uniswap计算原理.md', lang: 'md' },
        { title: '02 手续费', file: 'uniswapV2 StudyNotes/02-uniswap手续费.md', lang: 'md' },
        { title: '03 流动性', file: 'uniswapV2 StudyNotes/03-uniswap流动性.md', lang: 'md' },
        { title: '04 无常损失', file: 'uniswapV2 StudyNotes/04-uniswap无常损失.md', lang: 'md' },
        { title: '05 闪电贷', file: 'uniswapV2 StudyNotes/05-uniswap闪电贷.md', lang: 'md' },
        { title: '06 TWAP', file: 'uniswapV2 StudyNotes/06-unuswap TWAP.md', lang: 'md' },
        { title: 'Uniswap V2 问答（复习卡片）', file: '05.UniswapV2问答.md', lang: 'md', qa: 'h2' },
      ]},
      { name: 'Uniswap V3', docs: [
        { title: 'Uniswap V3 问答（复习卡片）', file: '06.Uniswapv3问答.md', lang: 'md', qa: 'h3' },
      ]},
    ],
  },
  {
    id: 'project',
    num: '05',
    title: '项目拆解',
    weeks: 6,
    summary: 'Pledge 固定利率借贷 / NFT Market / 永续合约三大项目：从业务角度理解合约、后端与前端的协作与资金流。',
    teacherFile: path.join(HW, '05.项目拆解.md'),
    groups: [
      { name: '拆解方法', docs: [
        { title: '🧩 项目拆解模板（三大项目通用）', inline: 'projectTodo', lang: 'md' },
      ]},
      { name: 'Pledge · 固定利率借贷', docs: [
        { title: 'Pledge 全景拆解：业务定位 → 状态机 → 审计视角（含本地复现）', file: 'backup/projectBreakdown/pledge-breakdown.md', lang: 'md' },
      ]},
    ],
  },
];

// ---------- 工具函数 ----------
function read(f) { return fs.readFileSync(path.join(ANS, f), 'utf8'); }
function slug(s) { return s; }

// 从 md 抽取 Q&A 卡片：匹配 "## 1. xxx？" / "### 2、xxx？" 之类的编号标题
function extractQA(md, level) {
  const lines = md.split('\n');
  const cards = [];
  let cur = null;
  const re = new RegExp(`^#{${level}}\\s+(\\d+[\\.、].*)$`);
  let group = null;
  for (const line of lines) {
    const g = line.match(/^#{2}\s+(.+)$/);
    if (level === 3 && g && !re.test(line)) { group = g[1].replace(/^一、|^二、|^三、|^四、|^五、|^六、|^七、|^八、|^九、|^十、/, ''); continue; }
    const m = line.match(re);
    if (m) {
      if (cur) cards.push(cur);
      cur = { q: m[1].trim(), a: [], group };
    } else if (cur) {
      cur.a.push(line);
    }
  }
  if (cur) cards.push(cur);
  return cards.map(c => ({ q: c.q, group: c.group, a: c.a.join('\n').trim() }))
    .filter(c => c.a.length > 0);
}

// ---------- 组装 ----------
const docIndex = [];
const allCards = [];
let idc = 0;
for (const ch of chapters) {
  ch.docs = [];
  for (const g of ch.groups) {
    for (const d of g.docs) {
      const id = `d${++idc}`;
      let content, cards = [];
      if (d.inline === 'projectTodo') {
        content = [
          '# 项目拆解模板（三大项目通用）',
          '',
          '> 拆解的重点不是读代码，而是从业务角度讲清「这个项目解决什么问题、钱怎么走、谁在什么时候做什么」。',
          '> 每个项目照这份模板填一遍，**填不出来的地方就是下一步要去看的代码**。',
          '',
          '## 一、10 分钟准备：先建立地图',
          '',
          '拆任何项目之前先别看代码，按顺序做四件事：',
          '',
          '1. **读 README**：项目解决什么问题，有哪些角色（用户 / 管理员 / LP / 清算人）',
          '2. **看部署脚本**（`script/`、`deploy/`、`hardhat.config`）：一共部署几个合约，谁引用谁',
          '3. **列合约清单**：主合约 / 代币 / 预言机 / 库 / 代理',
          '4. **翻目录结构**：`contracts/`、`src/`、`internal/`、`api/` 各自装什么',
          '',
          '> 产出：一张手写的「合约依赖草图」，标注 A 调用 B、B 持有 C 的地址。',
          '',
          '## 二、架构图模板',
          '',
          '画三列，箭头标清方向与含义（调用 / 事件回传）：',
          '',
          '```',
          '┌─────────────┐    写交易 / 读状态    ┌─────────────┐',
          '│  前端 DApp   │ ───────────────────▶ │   智能合约    │',
          '│ (React/Vue) │ ◀─────────────────── │  (Solidity)  │',
          '└──────┬──────┘     链上事件 / 查询    └──────┬──────┘',
          '       │                                     │ 事件日志',
          '       │ REST / WebSocket                     ▼',
          '       │                              ┌─────────────┐',
          '       └────────────────────────────▶ │   后端服务    │',
          '                                      │ 同步/索引/API │',
          '                                      └──────┬──────┘',
          '                                             ▼ 读写',
          '                                      ┌─────────────┐',
          '                                      │  数据库/缓存  │',
          '                                      └─────────────┘',
          '```',
          '',
          '画完必须能回答：',
          '',
          '- 前端哪些操作**直接调合约**，哪些走**后端 API**',
          '- 后端靠**什么事件**感知链上变化（事件名 + 关键字段）',
          '- 数据库存的是**全量同步**还是**只存聚合结果**',
          '',
          '## 三、核心业务流程（用户视角）',
          '',
          '按「谁 → 做什么 → 触发什么 → 结果」写成表格，一步一行：',
          '',
          '| # | 用户操作 | 前端动作 | 合约方法 | 状态变化 | 事件 |',
          '|---|---------|---------|---------|---------|------|',
          '| 1 | 授权代币 | 调 approve | `approve(spender, amt)` | allowance 更新 | Approval |',
          '| 2 | 质押 | 调合约 | `stake(amt)` | 用户份额↑、池子余额↑ | Staked |',
          '| 3 | … | | | | |',
          '',
          '> 能一张表写完的流程才算真理清了。超过 8 步就拆两条：**正常流程** 与 **异常/清算流程**。',
          '',
          '## 四、模块职责表',
          '',
          '| 层 | 模块 / 文件 | 职责（一句话） | 关键方法 / 接口 |',
          '|----|------------|--------------|----------------|',
          '| 合约 | | | |',
          '| 后端 | | | |',
          '| 前端 | | | |',
          '',
          '判断标准：**一句话说不清职责的模块，说明还没看懂它为什么存在**。',
          '',
          '## 五、资金流转清单',
          '',
          '钱是这个行业最真实的需求，逐条列清楚：',
          '',
          '- 用户的钱从哪来、进到哪个地址（合约 / 托管 / 多签）',
          '- 合约余额被谁、在什么条件下动用',
          '- 手续费 / 奖励从哪出、比例多少、怎么算',
          '- 退出时钱怎么回、有没有锁定期',
          '- 极端情况（清算、坏账、紧急提现）资金如何处理',
          '',
          '> 检验一句话：**如果我是攻击者，钱最可能从哪个环节被拿走？**',
          '',
          '## 六、三个项目的关键提问',
          '',
          '### Pledge（质押）',
          '',
          '- 奖励分配的数学模型是什么（累计每份额奖励 / 按时间线性 / 复利）',
          '- 用户份额怎么记账，为什么用「份额」而不是直接记余额',
          '- 解质押有没有锁定期或队列，为什么需要它',
          '- 谁能改奖励速率、谁能暂停合约（权限模型）',
          '- 奖励池余额不足时会发生什么',
          '',
          '### NFT Market（市场）',
          '',
          '- 挂单是把 NFT **托管进市场合约**，还是只做 **approve 授权**',
          '- 成交时 NFT 与 ETH 的转移顺序，如何避免「付了钱 NFT 没到」',
          '- 版税 / 平台费怎么算，从谁的钱里扣',
          '- 取消挂单谁付 gas，挂单数据存链上还是链下',
          '- 后端如何把「挂单事件」变成前端可翻页查询的列表',
          '',
          '### 永续合约（Perpetual）',
          '',
          '- 逐仓还是全仓，保证金与仓位怎么记账',
          '- 标记价格从哪来（预言机 / 指数 + 基差），为什么不用最新成交价',
          '- 资金费率的计算方式与结算周期，多空谁付谁',
          '- 强平条件怎么判定，清算人奖励从哪出',
          '- perp-backend 如何保证「链上仓位」与「数据库仓位」一致（对账 / 回滚）',
          '',
          '## 七、输出与自检',
          '',
          '每个项目完成后必须交付三样东西：',
          '',
          '- [ ] 一张整体架构图（三列 + 箭头 + 事件流向）',
          '- [ ] 一页核心业务流程表（用户视角，含异常流程）',
          '- [ ] 一页模块职责表 + 资金流转清单',
          '',
          '自检问题（答不上就回去补）：',
          '',
          '- [ ] 能用 3 分钟向非技术人员讲清这个项目做什么',
          '- [ ] 能说出用户每点一次按钮，链上到底发生了什么',
          '- [ ] 能指出项目里最值钱、也最容易被攻击的地方',
          '- [ ] 换一个同类型项目（另一个 DEX / 借贷协议），1 小时内能画出架构草图',
          '',
          '## 八、笔记区',
          '',
          '### Pledge',
          '',
          '> 待填：一句话业务定位 / 架构图 / 核心流程 / 资金流 / 疑点清单',
          '',
          '### NFT Market',
          '',
          '> 待填',
          '',
          '### 永续合约',
          '',
          '> 待填',
        ].join('\n');
      } else if (d.lang === 'md') {
        content = read(d.file);
      } else {
        // 代码文件：包一层代码块，标题取文件内 package/pragma 前的注释也可以，直接渲染
        const code = read(d.file);
        content = `## ${d.title}\n\n> 源码文件：\`${d.file.replace(/^backup\//, 'homeWork/')}\`\n\n\`\`\`${d.lang}\n${code.replace(/\n$/, '')}\n\`\`\`\n`;
      }
      if (d.qa) cards = extractQA(content, d.qa === 'h2' ? 2 : 3);
      const doc = {
        id, chapter: ch.id, group: g.name, title: d.title,
        isTeacher: false, lang: d.lang, qa: !!d.qa,
        content,
      };
      if (d.qa) {
        doc.cardStart = allCards.length;
        cards.forEach((c, i) => allCards.push({ id: `${id}-c${i}`, docId: id, chapter: ch.id, group: g.name, docTitle: d.title, ...c }));
        doc.cardEnd = allCards.length;
      }
      ch.docs.push(doc);
      docIndex.push(doc);
      d._id = id; // 回写到清单条目，供 meta 使用
    }
  }
  // 老师的作业要求文档（pinned）
  const tid = `t-${ch.id}`;
  const tDoc = {
    id: tid, chapter: ch.id, group: '老师要求', title: '作业要求（老师的原始任务书）',
    isTeacher: true, lang: 'md', qa: false,
    content: fs.readFileSync(ch.teacherFile, 'utf8'),
  };
  ch.docs.unshift(tDoc);
  docIndex.push(tDoc);
}

// ---------- 搜索索引 ----------
const searchIndex = docIndex.map(d => ({
  id: d.id, chapter: d.chapter, title: d.title,
  text: d.content.slice(0, 120000),
}));

const meta = {
  title: '区块链开发工程师 · 系统课程复习中心',
  builtAt: new Date().toISOString().slice(0, 10),
  chapters: chapters.map(c => ({
    id: c.id, num: c.num, title: c.title, weeks: c.weeks, summary: c.summary,
    groups: c.groups.map(g => ({ name: g.name, docIds: g.docs.map(d => d._id) })),
    teacherDocId: `t-${c.id}`,
  })),
  cardCount: allCards.length,
};

const payload = { meta, docs: docIndex, cards: allCards, searchIndex };
fs.writeFileSync(OUT, 'window.__CONTENT__ = ' + JSON.stringify(payload) + ';');
console.log(`✔ 生成 ${OUT}`);
console.log(`  文档 ${docIndex.length} 篇 · 复习卡片 ${allCards.length} 张 · 内容 ${(fs.statSync(OUT).size / 1024).toFixed(0)} KB`);
