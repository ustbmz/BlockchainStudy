/* 学习路径数据：按顺序的步骤清单，docs 用 "章节id/文档标题" 引用，运行时解析 */
window.__LEARN_PATH__ = {
  steps: [
    // ---------- 阶段一：Golang 后端基础 ----------
    { id: 'p01', stage: 1, t: '读懂任务书与课程地图', d: '先读老师的任务书：了解三个学习阶段、作业提交方式（GitHub 仓库）和推荐资料，建立整体认知。', h: 2, docs: ['go/作业要求（老师的原始任务书）'] },
    { id: 'p02', stage: 1, t: 'Go 基础语法 + 算法练习', d: '掌握流程控制、函数、值与引用类型；用 LeetCode 数组专题练手：两数之和、去重、区间合并、加一。', h: 10, docs: ['go/LeetCode 算法题笔记', 'go/SumTwoN', 'go/MergeIntervals', 'go/PlusOne V2'] },
    { id: 'p03', stage: 1, t: 'Go 进阶：OOP 与指针', d: '理解结构体、方法、接口与组合，搞清值传递与指针的区别，这是读框架源码的基本功。', h: 6, docs: ['go/Go 进阶学习笔记（并发 / OOP）', 'go/OOP', 'go/Pointer'] },
    { id: 'p04', stage: 1, t: '并发编程：goroutine / channel / 锁', d: '掌握 goroutine 启动与退出、channel 收发与 select、互斥锁与等待组，理解 CSP 并发模型。', h: 8, docs: ['go/Goroutine', 'go/Channel', 'go/Lock 同步'] },
    { id: 'p05', stage: 1, t: 'GORM 数据库开发', d: '从 SQL 到 ORM：模型定义、钩子函数、常见查询写法，能独立完成建表与增删改查。', h: 8, docs: ['go/GORM 学习笔记', 'go/Hooks 钩子', 'go/Models 模型', 'go/Query 查询'] },
    { id: 'p06', stage: 1, t: 'Gin 大作业：个人博客系统', d: '综合运用：JWT 鉴权、中间件、文章与评论接口，完成博客系统并跑通测试，对照实现指南复盘。', h: 12, docs: ['go/博客系统 README', 'go/实现指南', 'go/测试结果'] },

    // ---------- 阶段二：Solidity 智能合约基础 ----------
    { id: 'p07', stage: 2, t: 'Solidity 基础语法与 EVM 存储', d: '通读学习大纲前半部分：数据类型、数组、映射、结构体、函数、修饰符；用 Remix 写简单代币合约。', h: 10, docs: ['solidity/作业要求（老师的原始任务书）', 'solidity/Solidity 学习大纲（1445 行完整笔记）'] },
    { id: 'p08', stage: 2, t: '进阶：继承 / 库 / 事件 / 安全', d: '学习合约继承、库合约、错误处理、Gas 优化与常见漏洞，为 NFT 市场实战做准备。', h: 8, docs: ['solidity/Solidity 学习大纲（1445 行完整笔记）'] },
    { id: 'p09', stage: 2, t: '开发框架：Hardhat 与 Foundry', d: '从 Remix 过渡到专业工具链：编译、测试、部署脚本。新项目优先选 Foundry。', h: 6, docs: ['solidity/作业要求（老师的原始任务书）'] },
    { id: 'p10', stage: 2, t: '作业 1：算法合约', d: '用 Solidity 实现二分查找、打标记、合并有序数组，体会 EVM 下的算法写法差异。', h: 6, docs: ['solidity/binarySearch 二分查找', 'solidity/checkMark 打标记', 'solidity/mergeSortedArray 合并有序数组'] },
    { id: 'p11', stage: 2, t: '作业 2：求助水池 BeggingContract', d: '实现可接收 ETH 捐赠、记录捐赠者与提款的合约，练习 payable、事件与修饰符。', h: 4, docs: ['solidity/BeggingContract'] },
    { id: 'p12', stage: 2, t: '作业 3：NFT 拍卖市场（含升级）', d: '完整项目：NFT 拍卖 + Chainlink 预言机出价 + 代理可升级（NftAuctionV2），跑通 Foundry 测试。', h: 12, docs: ['solidity/NFT 拍卖市场 README', 'solidity/NftAuctionV2.sol（升级版）', 'solidity/AuctionProxy.sol（代理合约）', 'solidity/测试报告'] },
    { id: 'p13', stage: 2, t: '面试题自测：50 道高频题', d: '用复习卡片模式过一遍 Solidity 高频面试题，先自己回答再展开参考答案，标记掌握情况。', h: 4, cards: 'solidity/Solidity 高频面试题（50 题）' },

    // ---------- 阶段三：后端实战 Go-Ethereum ----------
    { id: 'p14', stage: 3, t: '理解 go-ethereum 架构', d: '了解 goEth 客户端的核心模块与项目结构，明白 DApp 后端如何与节点交互。', h: 3, docs: ['backend/作业要求（老师的原始任务书）', 'backend/goEth 项目说明', 'backend/Go-Ethereum 核心功能与架构设计'] },
    { id: 'p15', stage: 3, t: '连接节点与基础操作', d: '通过架构笔记掌握 RPC 客户端连接、账户与签名、ETH 单位换算（Wei/Gwei/ETH）等基础操作概念。', h: 3, docs: ['backend/goEth 项目说明', 'backend/Go-Ethereum 核心功能与架构设计'] },
    { id: 'p16', stage: 3, t: '查询区块实战', d: '实现按高度/哈希查询区块与交易，理解区块数据结构与 raw JSON-RPC 调用。', h: 4, docs: ['backend/queryblock · 查询区块', 'backend/queryblock/main.go', 'backend/queryblock/rpc/rpc.go'] },
    { id: 'p17', stage: 3, t: '构建并发送交易', d: '构建交易、EOA 签名、估算 Gas、广播交易并用测试验证发送逻辑。', h: 5, docs: ['backend/sendtx/main.go · 发送交易', 'backend/sendtx/main_test.go'] },
    { id: 'p18', stage: 3, t: '合约部署与调用（counter）', d: '解析合约 ABI、生成 Go 绑定，完成 Counter 合约的部署、读写调用闭环。', h: 5, docs: ['backend/counter · 合约部署与调用', 'backend/Counter.sol'] },

    // ---------- 阶段四：合约实战 ----------
    { id: 'p19', stage: 4, t: 'MetaNodeStake 业务逻辑分析', d: '梳理质押主合约：资金池结构、奖励计算（accMetaNodePerST）、解质押锁定队列与权限控制。', h: 6, docs: ['defi/合约实战作业题目', 'defi/业务逻辑分析'] },
    { id: 'p20', stage: 4, t: 'Foundry 迁移', d: '把 Hardhat 项目迁到 Foundry：依赖管理、forge 编译测试部署，记录踩坑与解决方案。', h: 8, docs: ['defi/Foundry 迁移记录'] },
    { id: 'p21', stage: 4, t: '补充测试用例（覆盖率 ≥ 80%）', d: '用 forge coverage 统计覆盖率，补齐质押/提现/领奖/暂停等分支测试。', h: 8, docs: ['defi/Foundry 测试用例'] },
    { id: 'p22', stage: 4, t: 'Uniswap V2 原理六连', d: '按顺序读六篇笔记：计算原理 → 手续费 → 流动性 → 无常损失 → 闪电贷 → TWAP，公式要自己推一遍。', h: 10, docs: ['defi/01 计算原理', 'defi/02 手续费', 'defi/03 流动性', 'defi/04 无常损失', 'defi/05 闪电贷', 'defi/06 TWAP'] },
    { id: 'p23', stage: 4, t: 'Uniswap V2 问答自测', d: '用复习卡片回答 AMM、滑点、三明治攻击、无常损失、Core/Periphery 接口七个问题。', h: 3, cards: 'defi/Uniswap V2 问答（复习卡片）' },
    { id: 'p24', stage: 4, t: 'Uniswap V3：集中流动性与 tick', d: '回答 V3 六问：集中流动性优势、tick 与价格关系、tick spacing 与费率的对应。', h: 4, cards: 'defi/Uniswap V3 问答（复习卡片）' },
    { id: 'p25', stage: 4, t: 'ERC / EIP 标准整理', d: '通过在线速查手册学习常用标准（DEX / 借贷 / NFT / 钱包 / AI+Web3 场景），掌握关键接口方法与选型依据。', h: 3, link: { name: 'ERC / EIP 标准速查手册', url: 'https://ustbmz.github.io/ERC/' } },

    // ---------- 阶段五：项目拆解 ----------
    { id: 'p26', stage: 5, t: '拆解方法论：5 步读陌生 Web3 项目', d: '先固定套路：读 README 与部署脚本列出合约 → 从用户操作找入口方法 → 跟一遍资金流 → 找事件与后端同步 → 画出架构图。后面三个项目都照这套流程走。', h: 2, docs: ['project/🧩 项目拆解模板（三大项目通用）', 'project/作业要求（老师的原始任务书）'] },
    { id: 'p27', stage: 5, t: 'Pledge · 合约业务流程（起手项目）', d: '业务最简单的一条线：质押 → 计奖励 → 领取 / 赎回。重点看奖励怎么算、解质押队列与权限控制，以及资金在合约里如何流转。', h: 5, link: { name: 'Pledge 项目仓库', url: 'https://github.com/MetaNodeAcademy/ProjectBreakdown-Pledge' } },
    { id: 'p28', stage: 5, t: 'Pledge · 后端模块与数据入库', d: '看后端怎么监听质押 / 领取事件、存了哪些表、API 如何查询收益与持仓，理解「链上状态 → 数据库 → 接口」这条链路。', h: 5, link: { name: 'Pledge 项目仓库', url: 'https://github.com/MetaNodeAcademy/ProjectBreakdown-Pledge' } },
    { id: 'p29', stage: 5, t: 'NFT Market · 合约流程（挂单 / 购买 / 分账）', d: '市场类通用套路：mint → 授权或托管挂单 → 购买 → 版税分账 → 取消挂单。重点看 NFT 归属变化和资金在合约之间的转移路径。', h: 6, link: { name: 'NFT Market 项目仓库', url: 'https://github.com/MetaNodeAcademy/ProjectBreakdown-NFTMarket' } },
    { id: 'p30', stage: 5, t: 'NFT Market · 前后端数据流转', d: '把订单从「链上事件 → 后端索引入库 → 前端列表展示」的链路串起来，说明前端每个页面调了哪些合约方法与 API。', h: 5, link: { name: 'NFT Market 项目仓库', url: 'https://github.com/MetaNodeAcademy/ProjectBreakdown-NFTMarket' } },
    { id: 'p31', stage: 5, t: '永续合约 · 核心资金流（保证金 / 杠杆 / 清算）', d: '最硬的骨头，放最后：开仓保证金、杠杆与仓位、标记价格、资金费率、强平清算。第一轮只跟资金流，不钻实现细节。', h: 8, link: { name: '永续合约仓库', url: 'https://github.com/MetaNodeAcademy/perpetual-contract' } },
    { id: 'p32', stage: 5, t: '永续合约 · 后端同步与风险引擎', d: '看 perp-backend 如何同步仓位与价格、如何计算风险并触发清算、API 怎样对外提供行情与持仓数据。', h: 8, link: { name: '永续合约后端仓库', url: 'https://github.com/MetaNodeAcademy/perp-backend' } },
    { id: 'p33', stage: 5, t: '输出：三张架构图 + 讲解练习', d: '每个项目产出一张架构图（前端 / 后端 / 合约三列 + 数据流箭头）和一页模块职责表，然后讲给别人听——能讲明白才算真的学会。', h: 6, docs: ['project/🧩 项目拆解模板（三大项目通用）'] },
  ],
};
