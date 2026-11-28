/* 共识笔记 · 区块链开发学习中心 · 前端逻辑 */
(function () {
  const C = window.__CONTENT__;
  const LP = window.__LEARN_PATH__ || { steps: [] };
  const docsById = {};
  C.docs.forEach(d => { docsById[d.id] = d; });
  const docsByChTitle = {};
  C.docs.forEach(d => { docsByChTitle[d.chapter + '/' + d.title] = d; });

  // 阅读顺序 = 侧栏导航顺序：每章任务书打头，再按分组依次排列（供翻页/键盘 ←→ 使用）
  const navOrder = [];
  C.meta.chapters.forEach(ch => {
    const t = docsById[ch.teacherDocId];
    if (t) navOrder.push(t.id);
    ch.groups.forEach(g => g.docIds.forEach(id => { if (docsById[id]) navOrder.push(id); }));
  });

  // 解析路径步骤引用的文档（"章节/标题"），cards 引用跳复习卡片模式
  function resolveRef(ref) {
    const d = docsByChTitle[ref];
    if (!d) return null;
    return { id: d.id, title: d.title, hash: '#/doc/' + d.id };
  }

  // ---------- 本地进度 ----------
  const LS_DOC = 'bcr_docs_v1';
  const LS_CARD = 'bcr_cards_v1';
  const LS_NAV = 'bcr_nav_v1';
  const LS_PATH = 'bcr_path_v1';
  const LS_IQ = 'bcr_iq_v1';
  const LS_THEME = 'bcr_theme_v1';
  let docProgress = JSON.parse(localStorage.getItem(LS_DOC) || '{}');
  let cardProgress = JSON.parse(localStorage.getItem(LS_CARD) || '{}');
  let navOpen = JSON.parse(localStorage.getItem(LS_NAV) || '{}');
  // 手动点击选中的章节：只在点过大标题后生效，不随文章变化
  let navSelId = null;
  let pathProgress = JSON.parse(localStorage.getItem(LS_PATH) || '{}');
  let iqProgress = JSON.parse(localStorage.getItem(LS_IQ) || '{}');
  let pathStrict = localStorage.getItem(LS_PATH + '_strict') === '1';

  // ---------- 配色方案 ----------
  // blue 为默认（:root）；其余通过 body[data-theme] 覆盖变量，mm 是 mermaid 节点配色
  const THEMES = [
    { id: 'ember',  name: '雾蓝（默认）',  dot: ['#38618c', '#5e8ab4'], mm: { primaryColor: '#dde8f2', primaryBorderColor: '#9dbdd8' } },
    { id: 'blue',   name: '蓝·紫',         dot: ['#0969da', '#8250df'], mm: { primaryColor: '#dbeafe', primaryBorderColor: '#9ec1e8' } },
    { id: 'forest', name: '松林',          dot: ['#2b8a3e', '#0ca678'], mm: { primaryColor: '#d3f0da', primaryBorderColor: '#8fc9a3' } },
  ];
  function currentThemeId() { return localStorage.getItem(LS_THEME) || 'ember'; }
  document.body.dataset.theme = currentThemeId();

  function saveDoc() { localStorage.setItem(LS_DOC, JSON.stringify(docProgress)); }
  function saveCard() { localStorage.setItem(LS_CARD, JSON.stringify(cardProgress)); }
  function saveNav() { localStorage.setItem(LS_NAV, JSON.stringify(navOpen)); }
  function savePath() { localStorage.setItem(LS_PATH, JSON.stringify(pathProgress)); localStorage.setItem(LS_PATH + '_strict', pathStrict ? '1' : '0'); }
  function saveIQ() { localStorage.setItem(LS_IQ, JSON.stringify(iqProgress)); }

  // ---------- markdown 渲染 ----------
  marked.setOptions({ gfm: true, breaks: false });

  function slugify(text, used) {
    let s = text.trim().toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-').replace(/^-+|-+$/g, '') || 'h';
    if (used[s] !== undefined) { used[s]++; s += '-' + used[s]; } else used[s] = 0;
    return s;
  }

  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function renderMD(md) {
    const used = {};
    // 关键：marked 会把 \( \) \[ \] 当成转义括号吃掉反斜杠，
    // 导致 KaTeX 行内公式 (\sqrt{k}) 无法识别。
    // 所以先在 markdown 解析前把所有公式段抽成占位符，解析后再还原。
    const mathStore = [];
    const protect = re => { md = md.replace(re, m => `@@MATH${mathStore.push(m) - 1}@@`); };
    protect(/\$\$[\s\S]+?\$\$/g);
    protect(/\\\([\s\S]+?\\\)/g);
    protect(/\\\[[\s\S]+?\\\]/g);

    // 提取标题生成锚点
    const el = document.createElement('div');
    el.className = 'md-body';
    let html = marked.parse(md);
    // 还原公式原文（HTML 转义后放回），交给 KaTeX 渲染
    html = html.replace(/@@MATH(\d+)@@/g, (_, i) => escapeHtml(mathStore[+i]));
    el.innerHTML = html;
    // mermaid 图：先把代码块换成容器（避免被 hljs 高亮），交给全局观察器渲染
    el.querySelectorAll('pre > code[class*="language-mermaid"]').forEach(code => {
      const div = document.createElement('div');
      div.className = 'md-mermaid';
      div.textContent = code.textContent;
      code.parentElement.replaceWith(div);
    });
    // 标题加 id（用于目录）
    const tocItems = [];
    el.querySelectorAll('h2, h3').forEach(h => {
      const id = slugify(h.textContent, used);
      h.id = id;
      tocItems.push({ level: h.tagName, id, text: h.textContent });
    });
    // 代码高亮
    el.querySelectorAll('pre code').forEach(block => {
      try { hljs.highlightElement(block); } catch (e) { /* ignore */ }
    });
    // 数学公式
    try {
      renderMathInElement(el, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '\\[', right: '\\]', display: true },
          { left: '\\(', right: '\\)', display: false },
        ],
        throwOnError: false,
      });
    } catch (e) { /* ignore */ }
    return { html: `<div class="md-body">${el.innerHTML}</div>`, toc: tocItems };
  }

  // ---------- mermaid 图渲染 ----------
  // renderMD 只负责把 ```mermaid 代码块换成 <div class="md-mermaid">；
  // 真正画图由这里的全局观察器完成：内容插入 DOM 后自动渲染（文档页/卡片/面试答案通用）。
  let mermaidInited = false;
  function initMermaid() {
    if (mermaidInited) return true;
    if (typeof mermaid === 'undefined') return false;
    const th = THEMES.find(t => t.id === currentThemeId()) || THEMES[0];
    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      themeVariables: {
        // 贴近 Primer Light 配色（主色随配色方案切换）
        fontFamily: '-apple-system, "Segoe UI", Helvetica, Arial, sans-serif',
        fontSize: '14px',
        primaryColor: th.mm.primaryColor,
        primaryBorderColor: th.mm.primaryBorderColor,
        primaryTextColor: '#1f2328',
        secondaryColor: '#f6f8fa',
        secondaryBorderColor: '#d0d7de',
        tertiaryColor: '#ffffff',
        lineColor: '#57606a',
        edgeLabelBackground: '#ffffff',
        clusterBkg: '#f6f8fa',
        clusterBorder: '#d0d7de',
      },
      flowchart: { curve: 'basis' },
    });
    mermaidInited = true;
    return true;
  }

  // mermaid.js 2.9MB，按需加载：页面里真的有图才去拉（多数页面没有，零开销）
  let mermaidLoading = null;
  function loadMermaid() {
    if (typeof mermaid !== 'undefined') return Promise.resolve();
    if (!mermaidLoading) {
      mermaidLoading = new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = 'vendor/mermaid.min.js';
        s.onload = res;
        s.onerror = () => { mermaidLoading = null; rej(new Error('mermaid.js 加载失败')); };
        document.head.appendChild(s);
      });
    }
    return mermaidLoading;
  }

  let mermaidTimer = null;
  function scheduleMermaid(root) {
    const selfPending = root.matches && root.matches('.md-mermaid:not([data-done])');
    const pending = selfPending
      ? [root]
      : Array.from(root.querySelectorAll ? root.querySelectorAll('.md-mermaid:not([data-done])') : []);
    if (!pending.length) return;
    clearTimeout(mermaidTimer);
    mermaidTimer = setTimeout(() => {
      loadMermaid().then(() => {
        if (!initMermaid()) return;
        pending.forEach(n => n.setAttribute('data-done', '1')); // 先标记，防止观察器重复触发
        mermaid.run({ nodes: pending })
          .catch(err => console.warn('mermaid 渲染失败：', err));
      }).catch(err => console.warn(err.message));
    }, 0);
  }

  new MutationObserver(muts => {
    for (const m of muts) {
      for (const n of m.addedNodes) {
        if (n.nodeType === 1) scheduleMermaid(n);
      }
    }
  }).observe(document.body, { childList: true, subtree: true });

  function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 1800);
  }

  // ---------- 路由 ----------
  const main = document.getElementById('main');
  const nav = document.getElementById('nav');

  let currentDocId = null;

  function route() {
    main.onscroll = null; // 清除上一页可能残留的目录滚动监听
    main.classList.remove('has-doc-toc');
    const hash = location.hash || '#/home';
    const m = hash.match(/^#\/(doc|cards)\/(.+)$/);
    if (hash === '#/home' || hash === '') { currentDocId = null; renderHome(); }
    else if (hash === '#/path') { currentDocId = null; renderPath(); }
    else if (hash === '#/interview') { currentDocId = null; renderInterview(); }
    else if (hash.startsWith('#/search/')) { currentDocId = null; renderSearch(decodeURIComponent(hash.slice(9))); }
    else if (m) { currentDocId = m[2]; renderDoc(m[2], m[1] === 'cards'); }
    else { currentDocId = null; renderHome(); }
    renderNav();
    main.scrollTop = 0;
  }

  // ---------- 侧栏 ----------
  function renderNav() {
    const iqKnown = (window.__INTERVIEW__ ? window.__INTERVIEW__.questions : []).filter(q => iqProgress[q.id] === 'known').length;
    const iqTotal = (window.__INTERVIEW__ ? window.__INTERVIEW__.questions : []).length;
    let html = `<div class="nav-chapter path-entry">
      <div class="nav-chapter-head ${location.hash === '#/path' ? 'path-active' : ''}" data-go-path="1">
        <span class="num">GO</span>
        <span>学习路径</span>
        <span class="nav-cnt">${LP.steps.length} 步</span>
        <span class="arrow">→</span>
      </div>
    </div>
    <div class="nav-chapter path-entry iq-entry">
      <div class="nav-chapter-head ${location.hash === '#/interview' ? 'path-active' : ''}" data-go-interview="1">
        <span class="num">Q</span>
        <span>面试中心</span>
        <span class="iq-nav-count" id="iqNavCount">${iqKnown}/${iqTotal}</span>
        <span class="arrow">→</span>
      </div>
    </div>`;
    C.meta.chapters.forEach(ch => {
      const docIds = ch.groups.reduce((a, g) => a.concat(g.docIds), []);
      const done = docIds.filter(id => docProgress[id]).length;
      // 默认折叠：只自动展开当前正在阅读的章节
      // 导航进入某章的优先级高于「手动收起」的记忆——从路径/首页跳到文档时必须展开，否则高亮项藏在折叠区里
      const containsCurrent = !!currentDocId && docIds.includes(currentDocId);
      if (containsCurrent && navOpen[ch.id] === false) { delete navOpen[ch.id]; saveNav(); }
      const open = navOpen[ch.id] !== undefined ? navOpen[ch.id] : containsCurrent;
      const isSel = navSelId ? navSelId === ch.id : containsCurrent;
      html += `<div class="nav-chapter ${open ? '' : 'closed'}" data-ch="${ch.id}">
        <div class="nav-chapter-head ${isSel ? 'active' : ''}" data-toggle="${ch.id}">
          <span class="num">${ch.num}</span>
          <span>${ch.title}</span>
          <span class="nav-cnt">${done}/${docIds.length}</span>
          <span class="arrow">▼</span>
        </div>`;
      const tDoc = docsById[ch.teacherDocId];
      if (tDoc) {
        const active = currentDocId === tDoc.id ? 'active' : '';
        const doneCls = docProgress[tDoc.id] ? 'done' : '';
        html += `<div class="nav-doc teacher-entry ${active} ${doneCls}" data-go="doc/${tDoc.id}">
          <span class="dot"></span>
          <span style="overflow:hidden;text-overflow:ellipsis">📌 任务书（老师要求）</span>
        </div>`;
      }
      ch.groups.forEach(g => {
        html += `<div class="nav-group">${g.name}</div>`;
        g.docIds.forEach(id => {
          const d = docsById[id];
          if (!d) return;
          const active = currentDocId === id ? 'active' : '';
          const doneCls = docProgress[id] ? 'done' : '';
          html += `<div class="nav-doc ${active} ${doneCls} ${d.isTeacher ? 'is-teacher' : ''}" data-go="doc/${id}">
            <span class="dot"></span>
            <span style="overflow:hidden;text-overflow:ellipsis">${d.title}</span>
            ${d.qa ? '<span class="qa-badge">卡</span>' : ''}
          </div>`;
        });
      });
      html += `</div>`;
    });
    nav.innerHTML = html;
    // 文档阅读态：把高亮项滚进侧栏可视区（block:nearest 只滚侧栏容器，不影响主区）
    if (currentDocId) {
      const activeEl = nav.querySelector('.nav-doc.active');
      if (activeEl) activeEl.scrollIntoView({ block: 'nearest' });
    }
    nav.querySelectorAll('[data-toggle]').forEach(el => {
      el.onclick = () => {
        const ch = el.dataset.toggle;
        navOpen[ch] = navOpen[ch] === false ? true : false;
        saveNav();
        nav.querySelector(`[data-ch="${ch}"]`).classList.toggle('closed', navOpen[ch] === false);
        // 点击大标题只切换颜色：深蓝挪到被点的这一章，不涉及文章内容
        navSelId = ch;
        nav.querySelectorAll('.nav-chapter[data-ch] > .nav-chapter-head').forEach(h => h.classList.remove('active'));
        el.classList.add('active');
      };
    });
    nav.querySelectorAll('[data-go]').forEach(el => {
      el.onclick = () => { location.hash = '#/' + el.dataset.go; };
    });
    const goPath = nav.querySelector('[data-go-path]');
    if (goPath) goPath.onclick = () => { location.hash = '#/path'; };
    const goIQ = nav.querySelector('[data-go-interview]');
    if (goIQ) goIQ.onclick = () => { location.hash = '#/interview'; };
  }

  // ---------- 学习路径 ----------
  function pathStats() {
    const total = LP.steps.length;
    const done = LP.steps.filter(s => pathProgress[s.id] === 'done').length;
    const doing = LP.steps.filter(s => pathProgress[s.id] === 'doing').length;
    const hoursTotal = LP.steps.reduce((a, s) => a + (s.h || 0), 0);
    const hoursLeft = LP.steps.filter(s => pathProgress[s.id] !== 'done').reduce((a, s) => a + (s.h || 0), 0);
    const nextIdx = LP.steps.findIndex(s => pathProgress[s.id] !== 'done');
    return { total, done, doing, hoursTotal, hoursLeft, nextIdx: nextIdx === -1 ? total : nextIdx, pct: total ? Math.round(done / total * 100) : 0 };
  }

  function stepLocked(idx) {
    if (!pathStrict) return false;
    const stats = pathStats();
    return idx > stats.nextIdx;
  }

  function renderPath() {
    const stats = pathStats();
    const circ = 2 * Math.PI * 30;
    const ring = `<svg class="ring" width="76" height="76" viewBox="0 0 76 76">
      <circle cx="38" cy="38" r="30" fill="none" style="stroke:var(--bg-hover)" stroke-width="7"/>
      <circle cx="38" cy="38" r="30" fill="none" stroke="url(#ringGrad)" stroke-width="7" stroke-linecap="round"
        stroke-dasharray="${circ}" stroke-dashoffset="${circ * (1 - stats.pct / 100)}" transform="rotate(-90 38 38)"/>
      <defs><linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" style="stop-color:var(--accent)"/><stop offset="100%" style="stop-color:var(--accent-2)"/>
      </linearGradient></defs>
      <text x="38" y="43" text-anchor="middle" font-size="15" font-weight="700" style="fill:var(--text)">${stats.pct}%</text>
    </svg>`;

    const nextStep = LP.steps[stats.nextIdx];
    const heroHtml = nextStep ? `<div class="path-hero" id="pathHero">
        <div class="ph-left">
          <div class="ph-label">下一步推荐</div>
          <div class="ph-title">Step ${String(stats.nextIdx + 1).padStart(2, '0')} · ${nextStep.t}</div>
          <div class="ph-desc">${nextStep.d}</div>
          <div class="ph-meta">⏱ 预计 ${nextStep.h} 小时 · 完成后自动进入下一步</div>
        </div>
        <button class="btn primary big" data-start="${nextStep.id}">继续学习</button>
      </div>` : `<div class="path-hero done-all"><div class="ph-left">
          <div class="ph-title">🎉 恭喜！你已经走完了整条学习路径</div>
          <div class="ph-desc">可以开始复习卡片模式查漏补缺，或者把网站分享给朋友照着学习。</div>
        </div></div>`;

    let stagesHtml = '';
    for (let s = 1; s <= 5; s++) {
      const ch = C.meta.chapters[s - 1];
      const steps = LP.steps.map((st, i) => ({ ...st, idx: i })).filter(st => st.stage === s);
      const done = steps.filter(st => pathProgress[st.id] === 'done').length;
      stagesHtml += `<div class="path-stage">
        <div class="path-stage-head">
          <span class="ps-badge">${ch.num}</span>
          <span class="ps-title">${ch.title}</span>
          <span class="ps-weeks">阶段${'一二三四五'[s - 1]} · 共 ${ch.weeks} 周</span>
          <div class="ps-bar"><div style="width:${steps.length ? done / steps.length * 100 : 0}%"></div></div>
          <span class="ps-count ${done === steps.length ? 'all-done' : ''}">${done} / ${steps.length} 已完成</span>
        </div>
        <div class="path-steps">`;
      steps.forEach(st => {
        const state = pathProgress[st.id] || 'todo';
        const locked = stepLocked(st.idx);
        const docChips = (st.docs || []).map(r => {
          const d = resolveRef(r);
          return d ? `<span class="doc-chip" data-goto="${d.hash}">${d.title || r.split('/')[1]}</span>` : '';
        }).join('');
        const cardChip = st.cards ? `<span class="doc-chip card" data-goto="#/cards/${resolveRef(st.cards).id}">🃏 ${(resolveRef(st.cards) || {}).title || st.cards.split('/')[1]}</span>` : '';
        const extChip = st.link ? `<span class="doc-chip ext" data-url="${st.link.url}" title="${st.link.url}">📖 ${st.link.name} ↗</span>` : '';
        const action = locked
          ? `<button class="btn small" disabled>🔒 待解锁</button>`
          : state === 'done'
            ? `<button class="btn small done-state" data-reset="${st.id}">✅ 已完成</button>`
            : state === 'doing'
              ? `<button class="btn small primary" data-done="${st.id}">标记完成</button>`
              : `<button class="btn small" data-start="${st.id}">开始学习</button>`;
        stagesHtml += `<div class="path-step ${state} ${locked ? 'locked' : ''}" id="step-${st.id}">
          <div class="step-dot"></div>
          <div class="step-body">
            <div class="step-title-row">
              <span class="step-num">STEP ${String(st.idx + 1).padStart(2, '0')}</span>
              <span class="step-title">${st.t}</span>
              <span class="step-state st-${state}">${state === 'done' ? '已完成' : state === 'doing' ? '进行中' : '未开始'}</span>
              <span class="step-hours">⏱ ${st.h} 小时</span>
            </div>
            <div class="step-desc">${st.d}</div>
            ${(docChips || cardChip || extChip) ? `<div class="step-docs">${docChips}${cardChip}${extChip}</div>` : ''}
          </div>
          <div class="step-action">${action}</div>
        </div>`;
      });
      stagesHtml += `</div></div>`;
    }

    main.innerHTML = `<div class="main-inner">
      <div class="path-header">
        <div class="path-header-left">
          <h1>🎯 学习路径</h1>
          <p>跟着路线一步一步走：每一步都有目标、学习资料和预计时长。完成一步，自动推荐下一步。</p>
        </div>
        ${ring}
      </div>
      <div class="path-stats">
        <span class="stat-pill">📍 共 <b>${stats.total}</b> 步</span>
        <span class="stat-pill">✅ 已完成 <b>${stats.done}</b> 步</span>
        <span class="stat-pill">🔁 进行中 <b>${stats.doing}</b> 步</span>
        <span class="stat-pill">⏱ 剩余约 <b>${stats.hoursLeft}</b> 小时</span>
        <button class="btn small" id="strictToggle">${pathStrict ? '🔓 严格模式已开启（按顺序解锁）' : '🗝 自由模式（可跳跃学习）'}</button>
      </div>
      ${heroHtml}
      ${stagesHtml}
    </div>`;

    main.querySelectorAll('[data-start]').forEach(el => el.onclick = () => {
      pathProgress[el.dataset.start] = 'doing'; savePath();
      toast('开始学习，加油 🚀'); renderPath();
      const el2 = document.getElementById('step-' + el.dataset.start);
      if (el2) el2.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    main.querySelectorAll('[data-done]').forEach(el => el.onclick = () => {
      pathProgress[el.dataset.done] = 'done'; savePath();
      const st = LP.steps.find(s => s.id === el.dataset.done);
      toast(`完成「${st.t}」✅`); renderPath();
    });
    main.querySelectorAll('[data-reset]').forEach(el => el.onclick = () => {
      delete pathProgress[el.dataset.reset]; savePath(); toast('已重置该步骤'); renderPath();
    });
    main.querySelectorAll('[data-goto]').forEach(el => el.onclick = () => { location.hash = el.dataset.goto; });
    main.querySelectorAll('[data-url]').forEach(el => el.onclick = () => { window.open(el.dataset.url, '_blank', 'noopener'); });
    const strictBtn = document.getElementById('strictToggle');
    if (strictBtn) strictBtn.onclick = () => {
      pathStrict = !pathStrict; savePath();
      toast(pathStrict ? '严格模式：只有完成当前步骤才能解锁下一步' : '自由模式：所有步骤均可学习');
      renderPath();
    };
  }

  // ---------- 首页 ----------
  function chapterStats(ch) {
    const docIds = ch.groups.reduce((a, g) => a.concat(g.docIds), []);
    const readCount = docIds.filter(id => docProgress[id]).length;
    const cards = C.cards.filter(c => c.chapter === ch.id);
    const known = cards.filter(c => cardProgress[c.id] === 'known').length;
    return { docIds, readCount, total: docIds.length, cards, known, cardTotal: cards.length };
  }

  function renderHome() {
    const totalDocs = C.docs.length;
    const readTotal = Object.keys(docProgress).filter(id => docsById[id]).length;
    const knownTotal = Object.keys(cardProgress).filter(id => cardProgress[id] === 'known').length;
    const iqCount = (window.__INTERVIEW__ || { questions: [] }).questions.length;

    // 阶段卡瘦身：一条进度条 + 一行状态；零值时不显示数字
    let cardsHtml = C.meta.chapters.map(ch => {
      const st = chapterStats(ch);
      const pct = st.total ? Math.round(st.readCount / st.total * 100) : 0;
      const statLine = st.readCount > 0
        ? `已读 <b>${st.readCount}/${st.total}</b> 篇${st.cardTotal ? ` · 卡片掌握 <b>${st.known}/${st.cardTotal}</b> 张` : ''}`
        : `<span class="cc-empty">还没有进度 · 开始读第一篇后这里会亮起来</span>`;
      return `<div class="chapter-card" data-go="doc/${ch.teacherDocId}">
        <div class="cc-head">
          <span class="cc-num">阶段 ${ch.num}</span>
          <h3>${ch.title}</h3>
          <span class="cc-weeks">${ch.weeks} 周</span>
        </div>
        <div class="cc-summary">${ch.summary}</div>
        <div class="progress-bar"><div style="width:${pct}%"></div></div>
        <div class="cc-stat">${statLine}</div>
      </div>`;
    }).join('');

    const pathCta = (() => {
      if (!LP.steps.length) return '';
      const st = pathStats();
      return `<div class="path-cta" data-go-path="1">
        <div class="cta-left">
          <div class="cta-title">🎯 学习路径</div>
          <div class="cta-sub">${LP.steps.length} 步有序路线 · 每步带资料与预计时长 · ${st.done > 0 ? `你已完成 ${st.done} 步，下一步是「${LP.steps[st.nextIdx].t}」` : '从 Go 基础一路走到项目拆解'}</div>
        </div>
        <button class="btn primary">${st.done > 0 ? '继续学习' : '开始学习'}</button>
      </div>`;
    })();

    const iqCta = (() => {
      const IQD = window.__INTERVIEW__;
      if (!IQD || !IQD.questions.length) return '';
      const known = IQD.questions.filter(q => iqProgress[q.id] === 'known').length;
      const pct = Math.round(known / IQD.questions.length * 100);
      return `<div class="path-cta iq-cta" data-go-interview="1">
        <div class="cta-left">
          <div class="cta-title">🧠 面试中心 · ${IQD.questions.length} 道题</div>
          <div class="cta-sub">${IQD.categories.length} 大主题自测 · 模拟面试 · 错题本${known > 0 ? ` · 已掌握 ${known}（${pct}%）` : ''}</div>
        </div>
        <button class="btn primary iq-btn">开始自测</button>
      </div>`;
    })();

    // 统计收成一行小字，零值项（已读/掌握）隐藏
    let metaLine = `📚 <b>${totalDocs}</b> 篇文档 <span class="sep">·</span> 🃏 <b>${C.meta.cardCount}</b> 张卡片 <span class="sep">·</span> 🧠 <b>${iqCount}</b> 道面试题`;
    if (readTotal > 0) metaLine += ` <span class="sep">·</span> ✅ 已读 <b>${readTotal}</b> 篇`;
    if (knownTotal > 0) metaLine += ` <span class="sep">·</span> 🃏 卡片已掌握 <b>${knownTotal}</b> 张`;
    metaLine += ` <span class="sep">·</span> 更新于 ${C.meta.builtAt}`;

    main.innerHTML = `<div class="main-inner">
      <div class="home-hero">
        <h1><svg width="26" height="26" viewBox="0 0 24 24" fill="none" style="vertical-align:-5px;margin-right:6px" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="lgHero" x1="0" y1="24" x2="24" y2="0" gradientUnits="userSpaceOnUse"><stop style="stop-color:var(--accent)"/><stop offset="1" style="stop-color:var(--accent-2)"/></linearGradient></defs><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="url(#lgHero)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 11a4 4 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="url(#lgHero)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>共识笔记 · 区块链开发学习中心</h1>
        <p>四条学习阶段 + 四个项目拆解 + 面试题库，按课程阶段整理。适合系统复习，也可以直接照着学习。</p>
        <div class="home-meta">${metaLine}</div>
      </div>
      <div class="home-dual">${pathCta}${iqCta}</div>
      <div class="home-section-label">学习阶段</div>
      <div class="chapter-grid">${cardsHtml}</div>
    </div>`;

    main.querySelectorAll('[data-go]').forEach(el => {
      el.onclick = () => { location.hash = '#/' + el.dataset.go; };
    });
    const cta = main.querySelector('[data-go-path]');
    if (cta) cta.onclick = () => { location.hash = '#/path'; };
    const iqCtaEl = main.querySelector('[data-go-interview]');
    if (iqCtaEl) iqCtaEl.onclick = () => { location.hash = '#/interview'; };
  }

  // ---------- 文档页 ----------
  function renderDoc(docId, cardMode) {
    const d = docsById[docId];
    if (!d) { main.innerHTML = '<div class="main-inner"><p>文档不存在</p></div>'; return; }
    const ch = C.meta.chapters.find(c => c.id === d.chapter);
    const done = !!docProgress[docId];

    const cardCount = d.qa ? (d.cardEnd - d.cardStart) : 0;
    const header = `<div class="doc-header">
        <span class="doc-chapter-tag">阶段 ${ch.num} · ${ch.title}</span>
        ${d.group ? `<span class="doc-group-name">${d.group}</span>` : ''}
        ${d.isTeacher ? '<span class="doc-teacher-tag">任务书</span>' : ''}
        <div class="doc-actions">
          ${d.qa ? `<div class="mode-seg">
                   <span data-mode="read" class="${cardMode ? '' : 'on'}">📄 阅读</span>
                   <span data-mode="cards" class="${cardMode ? 'on' : ''}">🃏 卡片 ×${cardCount}</span>
                 </div>` : ''}
          <button class="btn ${done ? 'btn-done' : ''}" id="markBtn">${done ? '✓ 已读' : '标记为已读'}</button>
        </div>
      </div>
      <h1>${d.title}</h1>`;

    let body = '';
    let tocFloat = '';
    if (cardMode && d.qa) {
      body = renderCards(d);
    } else {
      // 正文自带的 `# 文档标题` 与头部 H1 重复，剥掉
      let mdText = d.content;
      const firstLine = (mdText.split('\n', 1)[0] || '').trim();
      if (firstLine === '# ' + d.title) mdText = mdText.slice(mdText.indexOf('\n')).replace(/^\s*\n+/, '');
      const { html, toc } = renderMD(mdText);
      if (toc.length > 2) {
        const links = toc.map(t =>
          `<a href="javascript:void(0)" class="${t.level === 'H3' ? 'l3' : ''}" data-anchor="${t.id}">${t.text}</a>`).join('');
        // 文内目录（窄屏回退用）
        body = `<div class="toc toc-inline"><div class="toc-title">目录</div>${links}</div>` + html;
        // 右侧悬浮目录（宽屏显示）
        tocFloat = `<aside class="doc-toc toc" id="docToc"><div class="toc-title">目录</div>${links}</aside>`;
      } else {
        body = html;
      }
    }

    main.innerHTML = `<div class="main-inner">${header}${body}${pagerHtml(docId)}</div>${tocFloat}`;
    if (tocFloat) main.classList.add('has-doc-toc'); // 宽屏下给内容区让出右侧目录位

    // 交互绑定
    const markBtn = document.getElementById('markBtn');
    markBtn.onclick = () => {
      if (docProgress[docId]) { delete docProgress[docId]; toast('已取消已读标记'); }
      else { docProgress[docId] = true; toast('已标记为已读 ✅'); }
      saveDoc();
      renderDoc(docId, cardMode);
    };
    main.querySelectorAll('[data-mode]').forEach(el => {
      el.onclick = () => { location.hash = `#/${el.dataset.mode}/${docId}`; };
    });
    main.querySelectorAll('[data-anchor]').forEach(el => {
      el.onclick = () => {
        const target = main.querySelector(`#${CSS.escape(el.dataset.anchor)}`);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      };
    });
    // 右侧悬浮目录：滚动时高亮当前小节，并让高亮项保持在面板可视区内
    const tocPanel = document.getElementById('docToc');
    if (tocPanel) {
      const heads = [...main.querySelectorAll('h2[id], h3[id]')];
      let ticking = false;
      const updateToc = () => {
        ticking = false;
        const mainTop = main.getBoundingClientRect().top;
        let cur = null;
        for (const h of heads) {
          if (h.getBoundingClientRect().top - mainTop <= 110) cur = h; else break;
        }
        tocPanel.querySelectorAll('a').forEach(a =>
          a.classList.toggle('active', !!cur && a.dataset.anchor === cur.id));
        const act = tocPanel.querySelector('a.active');
        if (act) {
          const ph = tocPanel.clientHeight;
          if (act.offsetTop < tocPanel.scrollTop + ph * 0.15 || act.offsetTop > tocPanel.scrollTop + ph * 0.75)
            tocPanel.scrollTop = act.offsetTop - ph / 2;
        }
      };
      main.onscroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(updateToc); } };
      updateToc();
    }
    main.querySelectorAll('[data-pager]').forEach(el => {
      el.onclick = () => { location.hash = `#/${el.dataset.mode}/${el.dataset.pager}`; };
    });
    bindCardEvents(d);
  }

  // ---------- 上一篇 / 下一篇（按侧栏导航顺序） ----------
  function pagerHtml(docId) {
    const idx = navOrder.indexOf(docId);
    const prev = idx > 0 ? docsById[navOrder[idx - 1]] : null;
    const next = idx >= 0 && idx < navOrder.length - 1 ? docsById[navOrder[idx + 1]] : null;
    if (!prev && !next) return '';
    const btn = (d, dir) => d ? `
      <a class="pager-btn ${dir}" href="javascript:void(0)" data-pager="${d.id}" data-mode="doc">
        ${dir === 'next'
          ? `<span class="pager-title">${d.title}</span><span class="pager-label">下一篇 →</span>`
          : `<span class="pager-label">← 上一篇</span><span class="pager-title">${d.title}</span>`}
        <span class="pager-ch">阶段 ${C.meta.chapters.find(c => c.id === d.chapter).num}</span>
      </a>` : `<span class="pager-btn ${dir} empty"></span>`;
    return `<div class="doc-pager">${btn(prev, 'prev')}${btn(next, 'next')}</div>`;
  }

  // 键盘 ←/→ 翻页（仅在文档页且未聚焦输入框时生效）
  document.addEventListener('keydown', e => {
    if (!currentDocId) return;
    const t = e.target;
    if (t && typeof t.matches === 'function' && t.matches('input, textarea, select')) return;
    const idx = navOrder.indexOf(currentDocId);
    if (e.key === 'ArrowLeft' && idx > 0) location.hash = `#/doc/${navOrder[idx - 1]}`;
    if (e.key === 'ArrowRight' && idx < navOrder.length - 1) location.hash = `#/doc/${navOrder[idx + 1]}`;
  });

  // ---------- 复习卡片 ----------
  function renderCards(d) {
    const cards = C.cards.filter(c => c.docId === d.id);
    const known = cards.filter(c => cardProgress[c.id] === 'known').length;
    const groups = [...new Set(cards.map(c => c.group).filter(Boolean))];

    let listHtml = cards.map((c, i) => {
      const st = cardProgress[c.id];
      const { html } = renderMD(c.a);
      return `<div class="qa-card ${st === 'known' ? 'known' : st === 'review' ? 'review' : ''}" data-card="${c.id}">
        <div class="qa-q" data-q>
          <span class="q-num">${i + 1}</span>
          <span>${c.group ? `<span class="card-group-tag">${c.group}</span>` : ''}${c.q}</span>
          <span class="toggle-hint">点击展开答案 ▾</span>
        </div>
        <div class="qa-a md-body">${html}
          <div style="display:flex;gap:8px;margin-top:12px">
            <button class="btn small" data-set="known">🧠 已掌握</button>
            <button class="btn small" data-set="review">🔁 再看看</button>
            <button class="btn small" data-set="clear">清除</button>
          </div>
        </div>
      </div>`;
    }).join('');

    return `<div class="cards-toolbar">
        <span class="cards-progress">共 <b>${cards.length}</b> 张卡片 · 已掌握 <b>${known}</b> 张 · 点击问题展开答案，自测后标记掌握情况</span>
        <span style="flex:1"></span>
        <button class="btn small" id="expandAll">全部展开</button>
        <button class="btn small" id="collapseAll">全部收起</button>
        <button class="btn small" id="hideKnown">隐藏已掌握</button>
      </div>
      <div class="card-list">${listHtml}</div>`;
  }

  function bindCardEvents(d) {
    main.querySelectorAll('[data-card]').forEach(card => {
      const q = card.querySelector('[data-q]');
      q.onclick = () => {
        card.classList.toggle('open');
        const hint = card.querySelector('.toggle-hint');
        hint.textContent = card.classList.contains('open') ? '点击收起 ▴' : '点击展开答案 ▾';
      };
      card.querySelectorAll('[data-set]').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const cid = card.dataset.card;
          const v = btn.dataset.set;
          if (v === 'clear') delete cardProgress[cid];
          else cardProgress[cid] = v;
          saveCard();
          card.classList.toggle('known', v === 'known');
          card.classList.toggle('review', v === 'review');
          toast(v === 'known' ? '标记为已掌握 🧠' : v === 'review' ? '标记为再看看 🔁' : '已清除');
        };
      });
    });
    const expandAll = document.getElementById('expandAll');
    if (expandAll) expandAll.onclick = () => {
      main.querySelectorAll('.qa-card').forEach(c => c.classList.add('open'));
      main.querySelectorAll('.toggle-hint').forEach(h => h.textContent = '点击收起 ▴');
    };
    const collapseAll = document.getElementById('collapseAll');
    if (collapseAll) collapseAll.onclick = () => {
      main.querySelectorAll('.qa-card').forEach(c => c.classList.remove('open'));
      main.querySelectorAll('.toggle-hint').forEach(h => h.textContent = '点击展开答案 ▾');
    };
    const hideKnown = document.getElementById('hideKnown');
    if (hideKnown) hideKnown.onclick = () => {
      const hidden = hideKnown.dataset.on === '1';
      main.querySelectorAll('.qa-card').forEach(c => {
        if (hidden) c.style.display = '';
        else if (cardProgress[c.dataset.card] === 'known') c.style.display = 'none';
      });
      hideKnown.dataset.on = hidden ? '' : '1';
      hideKnown.textContent = hidden ? '隐藏已掌握' : '显示全部';
    };
  }

  // ---------- 面试中心 ----------
  const IQ = window.__INTERVIEW__ || { categories: [], questions: [] };
  const IQ_BY_ID = {};
  const IQ_NO = {};
  IQ.questions.forEach((q, i) => { IQ_BY_ID[q.id] = q; IQ_NO[q.id] = i + 1; });
  const IQ_COLORS = {
    projects: '#cf222e', chain: '#1a7f37', ethtx: '#0969da', solidity: '#8250df',
    token: '#bf3989', security: '#9a6700', eng: '#0550ae', go: '#0f6e56',
    stake: '#1b7c83', univ2: '#e8590c', univ3: '#c2255c', auction: '#5f3dc4',
    pattern: '#57606a', eip: '#0b7285', geth: '#24292f',
  };
  const IQ_LV = ['', '基础', '进阶', '深水'];
  let iqFilter = { cat: 'all', level: 0, state: 'all', kw: '' };
  let iqSession = null;

  function iqStats() {
    const total = IQ.questions.length;
    const known = IQ.questions.filter(q => iqProgress[q.id] === 'known').length;
    const review = IQ.questions.filter(q => iqProgress[q.id] === 'review').length;
    return { total, known, review, todo: total - known - review, pct: total ? Math.round(known / total * 100) : 0 };
  }

  function iqFiltered() {
    const kw = iqFilter.kw.trim().toLowerCase();
    return IQ.questions.filter(q => {
      if (iqFilter.cat !== 'all' && q.cat !== iqFilter.cat) return false;
      if (iqFilter.level && q.level !== iqFilter.level) return false;
      const st = iqProgress[q.id] || 'todo';
      if (iqFilter.state !== 'all' && st !== iqFilter.state) return false;
      if (kw) {
        const hay = (q.q + ' ' + q.tags.join(' ') + ' ' + q.catName + ' ' + q.a).toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    });
  }

  function iqCardHtml(q) {
    const st = iqProgress[q.id] || 'todo';
    const stTag = st === 'known' ? '<span class="iq-st known">已掌握</span>'
      : st === 'review' ? '<span class="iq-st review">待复习</span>' : '';
    return `<div class="iq-card ${st}" data-qid="${q.id}">
      <div class="iq-q" data-toggle="1">
        <span class="iq-num">${IQ_NO[q.id]}</span>
        <span class="iq-qtext">${escapeHtml(q.q)}</span>
        <span class="iq-badges">
          <span class="iq-lv lv-${q.level}">${IQ_LV[q.level]}</span>${stTag}
        </span>
        <span class="iq-hint">展开 ▾</span>
      </div>
      <div class="iq-a"></div>
    </div>`;
  }

  function iqExpandCard(card) {
    const q = IQ_BY_ID[card.dataset.qid];
    if (!q) return;
    const aEl = card.querySelector('.iq-a');
    if (!aEl.dataset.rendered) {
      const { html } = renderMD(q.a);
      const tagsHtml = q.tags && q.tags.length
        ? `<div class="iq-tags">${q.tags.map(t => `<span class="iq-tag">${escapeHtml(t)}</span>`).join('')}</div>`
        : '';
      aEl.innerHTML = `${tagsHtml}
        ${html}
        <div class="iq-actions">
          <button class="btn small" data-set="known">🧠 已掌握</button>
          <button class="btn small" data-set="review">🔁 再看</button>
          <button class="btn small" data-set="clear">清除</button>
        </div>`;
      aEl.dataset.rendered = '1';
      aEl.querySelectorAll('[data-set]').forEach(btn => {
        btn.onclick = e => {
          e.stopPropagation();
          iqSetState(q.id, btn.dataset.set);
          card.classList.toggle('known', btn.dataset.set === 'known');
          card.classList.toggle('review', btn.dataset.set === 'review');
          const badge = card.querySelector('.iq-st');
          if (badge) badge.remove();
          if (btn.dataset.set !== 'clear') {
            const span = document.createElement('span');
            span.className = 'iq-st ' + (btn.dataset.set === 'known' ? 'known' : 'review');
            span.textContent = btn.dataset.set === 'known' ? '已掌握' : '待复习';
            card.querySelector('.iq-badges').appendChild(span);
          }
        };
      });
    }
    card.classList.add('open');
    card.querySelector('.iq-hint').textContent = '收起 ▴';
  }

  function iqCollapseCard(card) {
    card.classList.remove('open');
    card.querySelector('.iq-hint').textContent = '展开 ▾';
  }

  function iqSetState(qid, v) {
    if (v === 'clear') delete iqProgress[qid]; else iqProgress[qid] = v;
    saveIQ();
    const s = iqStats();
    const el = document.getElementById('iqProgressText');
    if (el) el.innerHTML = `已掌握 <b>${s.known}</b> / ${s.total} 道 · 待复习 <b>${s.review}</b> 道`;
    const bar = document.getElementById('iqProgressBar');
    if (bar) bar.style.width = s.pct + '%';
    const navCount = document.getElementById('iqNavCount');
    if (navCount) navCount.textContent = s.known + '/' + s.total;
    const pctEl = document.querySelector('.iq-big-num');
    if (pctEl) pctEl.innerHTML = s.pct + '<span>%</span>';
  }

  function renderInterview() {
    const s = iqStats();
    const catChips = [{ id: 'all', name: '全部', count: s.total }, ...IQ.categories]
      .map(c => `<button class="iq-chip ${iqFilter.cat === c.id ? 'active' : ''}" data-cat="${c.id}">
        ${c.id === 'all' ? '' : `<span class="iq-dot" style="background:${IQ_COLORS[c.id] || '#57606a'}"></span>`}${c.name}
        <span class="iq-chip-n">${c.count}</span></button>`).join('');
    const lvChips = [[0, '全部'], [1, '基础'], [2, '进阶'], [3, '深水']]
      .map(([v, l]) => `<button class="iq-chip sm ${iqFilter.level === v ? 'active' : ''}" data-lv="${v}">${l}</button>`).join('');
    const stChips = [['all', '全部'], ['todo', '未掌握'], ['known', '已掌握'], ['review', '待复习']]
      .map(([v, l]) => `<button class="iq-chip sm ${iqFilter.state === v ? 'active' : ''}" data-st="${v}">${l}</button>`).join('');

    main.innerHTML = `<div class="main-inner iq-wrap">
      <div class="iq-hero">
        <div class="iq-hero-left">
          <h1>🧠 面试中心</h1>
          <p>四套项目拆解各留一个判断，加上区块链开发岗的常见题。先自己回答，再展开对照；标记「已掌握」的会记在本地。</p>
        </div>
        <div class="iq-hero-right">
          <div class="iq-ring-wrap">
            <div class="iq-big-num">${s.pct}<span>%</span></div>
            <div class="iq-ring-label">掌握率</div>
          </div>
        </div>
      </div>
      <div class="iq-progress-row">
        <div class="iq-progress-bar"><div id="iqProgressBar" style="width:${s.pct}%"></div></div>
        <span id="iqProgressText">已掌握 <b>${s.known}</b> / ${s.total} 道 · 待复习 <b>${s.review}</b> 道</span>
      </div>

      <div class="iq-toolbar">
        <div class="iq-chip-row" id="iqCatRow">${catChips}</div>
        <div class="iq-toolbar-2">
          <div class="iq-chip-row">${lvChips}</div>
          <span class="iq-sep"></span>
          <div class="iq-chip-row">${stChips}</div>
          <span style="flex:1"></span>
          <input class="iq-search" id="iqSearch" type="text" placeholder="搜题目 / 标签…" value="${escapeHtml(iqFilter.kw)}">
          <button class="btn small primary" id="iqMockBtn">🎲 模拟面试</button>
        </div>
      </div>

      <div id="iqList"></div>
    </div>`;

    renderIQList();

    main.querySelectorAll('[data-cat]').forEach(el => {
      el.onclick = () => { iqFilter.cat = el.dataset.cat; renderInterview(); };
    });
    main.querySelectorAll('[data-lv]').forEach(el => {
      el.onclick = () => { iqFilter.level = +el.dataset.lv; renderInterview(); };
    });
    main.querySelectorAll('[data-st]').forEach(el => {
      el.onclick = () => { iqFilter.state = el.dataset.st; renderInterview(); };
    });
    const kw = document.getElementById('iqSearch');
    let kwTimer;
    kw.oninput = () => {
      clearTimeout(kwTimer);
      kwTimer = setTimeout(() => {
        iqFilter.kw = kw.value;
        renderIQList();
      }, 220);
    };
    kw.onkeydown = e => { if (e.key === 'Enter') { clearTimeout(kwTimer); iqFilter.kw = kw.value; renderIQList(); } };
    document.getElementById('iqMockBtn').onclick = () => startMock(10);
  }

  function renderIQList() {
    const list = iqFiltered();
    const box = document.getElementById('iqList');
    if (!box) return;
    if (!list.length) {
      box.innerHTML = `<div class="iq-empty">没有匹配的题目 🤷 试试换个关键词或清除筛选</div>`;
      return;
    }
    const byCat = {};
    list.forEach(q => { (byCat[q.cat] = byCat[q.cat] || []).push(q); });

    const groups = IQ.categories.filter(c => byCat[c.id]).map(c => {
      const qs = byCat[c.id];
      const known = qs.filter(q => iqProgress[q.id] === 'known').length;
      return `<section class="iq-group">
        <div class="iq-group-head">
          <span class="iq-dot" style="background:${IQ_COLORS[c.id] || '#57606a'}"></span>
          <h2>${c.name}</h2>
          <span class="iq-group-desc">${escapeHtml(c.desc)}</span>
          <span class="iq-group-count">${known} / ${qs.length}</span>
        </div>
        <div class="iq-list">${qs.map(iqCardHtml).join('')}</div>
      </section>`;
    }).join('');

    box.innerHTML = `<div class="iq-list-head">
        <span>共 <b>${list.length}</b> 道题</span>
        <span style="flex:1"></span>
        <button class="btn small" id="iqExpandAll">展开可见</button>
        <button class="btn small" id="iqCollapseAll">全部收起</button>
      </div>${groups}`;

    box.querySelectorAll('.iq-card').forEach(card => {
      card.querySelector('[data-toggle]').onclick = () => {
        if (card.classList.contains('open')) iqCollapseCard(card); else iqExpandCard(card);
      };
    });
    document.getElementById('iqExpandAll').onclick = () => {
      box.querySelectorAll('.iq-card').forEach(iqExpandCard);
      toast('已展开，慢慢看 👀');
    };
    document.getElementById('iqCollapseAll').onclick = () => {
      box.querySelectorAll('.iq-card').forEach(iqCollapseCard);
    };
  }

  // ---- 模拟面试 ----
  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  // 计时辅助
  const fmtMs = ms => {
    const s = Math.floor(ms / 1000);
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  };
  let mockTimerInt = null;

  function startMock(n) {
    const pool = iqFiltered();
    if (!pool.length) { toast('当前筛选下没有题目'); return; }
    // 错题优先：之前标「要复习」的题先抽，剩下从其它题随机补齐
    const shuffled = shuffle(pool.slice());
    const wrong = shuffled.filter(q => iqProgress[q.id] === 'review');
    const rest = shuffled.filter(q => iqProgress[q.id] !== 'review');
    const list = wrong.slice(0, n).concat(rest.slice(0, Math.max(0, n - wrong.length)));
    iqSession = { list, idx: 0, revealed: false, known: 0, review: 0,
      startTs: Date.now(), qTs: Date.now(), times: [], wrongFirst: wrong.length };
    openMock();
  }

  function openMock() {
    let el = document.getElementById('iqMock');
    if (!el) {
      el = document.createElement('div');
      el.id = 'iqMock';
      el.className = 'iq-mock';
      document.body.appendChild(el);
    }
    el.classList.add('show');
    document.body.classList.add('iq-mock-open');
    renderMock();
  }

  function closeMock() {
    clearInterval(mockTimerInt);
    const el = document.getElementById('iqMock');
    if (el) el.classList.remove('show');
    document.body.classList.remove('iq-mock-open');
    iqSession = null;
  }

  function renderMock() {
    const el = document.getElementById('iqMock');
    if (!el || !iqSession) return;
    const s = iqSession;

    if (s.idx >= s.list.length) {
      const total = s.list.length;
      const score = Math.round(s.known / total * 100);
      const elapsed = Date.now() - s.startTs;
      const answered = s.times.length;
      const avg = answered ? elapsed / answered : 0;
      clearInterval(mockTimerInt);
      el.innerHTML = `<div class="iqm-inner iqm-done">
        <div class="iqm-done-emoji">${score >= 80 ? '🎉' : score >= 50 ? '💪' : '📚'}</div>
        <h2>本轮 ${total} 题完成</h2>
        <div class="iqm-score">${score}<span>%</span></div>
        <div class="iqm-done-row">
          <span class="stat-pill">🧠 会了 <b>${s.known}</b></span>
          <span class="stat-pill">🔁 要复习 <b>${s.review}</b></span>
          <span class="stat-pill">⏭ 跳过 <b>${total - s.known - s.review}</b></span>
        </div>
        <div class="iqm-done-row iqm-time-row">
          <span class="stat-pill">⏱ 总用时 <b>${fmtMs(elapsed)}</b></span>
          <span class="stat-pill">平均每题 <b>${fmtMs(avg)}</b></span>
          ${s.wrongFirst ? `<span class="stat-pill">🎯 优先复考错题 <b>${Math.min(s.wrongFirst, total)}</b> 道</span>` : ''}
        </div>
        <p class="iqm-done-tip">${score >= 80 ? '状态不错，可以挑战更难的题或者去复习项目拆解。' : score >= 50 ? '基本掌握，把「要复习」的那几道再刷一遍。' : '别急，先回到对应章节把笔记读一遍再来。'}</p>
        <div class="iqm-done-btns">
          <button class="btn primary" data-mock="again">再来一轮</button>
          <button class="btn" data-mock="close">返回题库</button>
        </div>
      </div>`;
      el.querySelector('[data-mock="again"]').onclick = () => startMock(s.list.length >= 10 ? 10 : s.list.length);
      el.querySelector('[data-mock="close"]').onclick = closeMock;
      return;
    }

    const q = s.list[s.idx];
    const st = iqProgress[q.id] || 'todo';
    el.innerHTML = `<div class="iqm-inner">
      <div class="iqm-head">
        <span class="iqm-progress">第 <b>${s.idx + 1}</b> / ${s.list.length} 题</span>
        <div class="iqm-bar"><div style="width:${s.idx / s.list.length * 100}%"></div></div>
        <span class="iqm-timer" id="iqmTimer">⏱ ${fmtMs(Date.now() - s.startTs)}</span>
        ${st === 'known' ? '<span class="iqm-flag">已掌握</span>' : st === 'review' ? '<span class="iqm-flag review">待复习</span>' : ''}
        <button class="iqm-close" data-mock="close" title="退出（Esc）">✕</button>
      </div>
      <div class="iqm-body">
        <div class="iqm-meta">
          <span class="iq-dot" style="background:${IQ_COLORS[q.cat] || '#57606a'}"></span>
          <span>${q.catName}</span>
          <span class="iq-lv lv-${q.level}">${IQ_LV[q.level]}</span>
          ${q.tags.slice(0, 3).map(t => `<span class="iq-tag">${escapeHtml(t)}</span>`).join('')}
        </div>
        <h2 class="iqm-q">${escapeHtml(q.q)}</h2>
        ${s.revealed
          ? `<div class="iqm-a">${renderMD(q.a).html}</div>`
          : `<div class="iqm-tip">先在脑子里过一遍答案，能讲出 70% 就算过。再点「显示答案」对照。</div>`}
      </div>
      <div class="iqm-foot">
        ${s.revealed
          ? `<button class="btn small" data-mock="known">🧠 会了</button>
             <button class="btn small" data-mock="review">🔁 要复习</button>
             <span style="flex:1"></span>
             <button class="btn primary" data-mock="next">下一题 →</button>`
          : `<button class="btn primary big" data-mock="reveal">显示答案（空格）</button>
             <button class="btn small" data-mock="skip">跳过</button>`}
      </div>
    </div>`;

    clearInterval(mockTimerInt);
    mockTimerInt = setInterval(() => {
      const t = document.getElementById('iqmTimer');
      if (t && iqSession) t.textContent = '⏱ ' + fmtMs(Date.now() - iqSession.startTs);
    }, 1000);

    el.querySelectorAll('[data-mock]').forEach(btn => {
      btn.onclick = () => {
        const act = btn.dataset.mock;
        if (act === 'close') return closeMock();
        if (act === 'reveal') { iqSession.revealed = true; return renderMock(); }
        if (act === 'skip' || act === 'next') {
          iqSession.times.push(Date.now() - iqSession.qTs);
          iqSession.qTs = Date.now();
          iqSession.idx++; iqSession.revealed = false; return renderMock();
        }
        if (act === 'known' || act === 'review') {
          iqSession.times.push(Date.now() - iqSession.qTs);
          iqSession.qTs = Date.now();
          iqSetState(q.id, act);
          if (act === 'known') iqSession.known++; else iqSession.review++;
          iqSession.idx++; iqSession.revealed = false;
          return renderMock();
        }
      };
    });
  }

  document.addEventListener('keydown', e => {
    const el = document.getElementById('iqMock');
    if (!el || !el.classList.contains('show') || !iqSession) return;
    if (e.key === 'Escape') { e.preventDefault(); closeMock(); return; }
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (!iqSession.revealed) { iqSession.revealed = true; renderMock(); }
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      iqSession.idx++; iqSession.revealed = false; renderMock();
    }
  });

  // ---------- 搜索 ----------
  function renderSearch(q) {
    q = q.trim();
    if (!q) { main.innerHTML = '<div class="main-inner"><p>输入关键词开始搜索</p></div>'; return; }
    const kw = q.toLowerCase();
    const results = [];
    C.searchIndex.forEach(d => {
      const inTitle = d.title.toLowerCase().includes(kw);
      const idx = d.text.toLowerCase().indexOf(kw);
      if (inTitle || idx >= 0) {
        let snippet = '';
        if (idx >= 0) {
          snippet = d.text.slice(Math.max(0, idx - 60), idx + 100).replace(/\s+/g, ' ');
        } else {
          snippet = d.text.slice(0, 120).replace(/\s+/g, ' ');
        }
        snippet = snippet.replace(new RegExp(escapeReg(q), 'gi'), m => `<mark>${m}</mark>`);
        results.push({ ...d, snippet, hit: inTitle ? '标题命中' : '内容命中' });
      }
    });
    main.innerHTML = `<div class="main-inner">
      <h1 style="font-size:22px;margin-bottom:4px">搜索“${q}”</h1>
      <p style="color:var(--text-dim);margin-bottom:18px">找到 ${results.length} 篇相关文档</p>
      ${results.map(r => `<div class="search-result" data-go="doc/${r.id}">
        <div class="sr-chapter">${r.hit} · ${r.chapter}</div>
        <div class="sr-title">${r.title}</div>
        <div class="sr-snippet">…${r.snippet}…</div>
      </div>`).join('') || '<p>没有找到相关内容 🤷</p>'}
    </div>`;
    main.querySelectorAll('[data-go]').forEach(el => {
      el.onclick = () => { location.hash = '#/' + el.dataset.go; };
    });
  }

  function escapeReg(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  // ---------- 搜索框 ----------
  const searchInput = document.getElementById('searchInput');
  let searchTimer;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      const v = searchInput.value.trim();
      if (v) location.hash = '#/search/' + encodeURIComponent(v);
      else location.hash = '#/home';
    }, 350);
  });
  searchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const v = searchInput.value.trim();
      if (v) location.hash = '#/search/' + encodeURIComponent(v);
    }
  });

  // ---------- 重置 ----------
  document.getElementById('resetBtn').onclick = () => {
    if (confirm('确定清空所有阅读进度、卡片掌握、面试题标记与学习路径记录吗？')) {
      localStorage.removeItem(LS_DOC);
      localStorage.removeItem(LS_CARD);
      localStorage.removeItem(LS_PATH);
      localStorage.removeItem(LS_IQ);
      docProgress = {}; cardProgress = {}; pathProgress = {}; iqProgress = {};
      toast('进度已重置');
      route();
    }
  };

  document.getElementById('buildDate').textContent = '更新于 ' + C.meta.builtAt;

  // ---------- 配色切换器：品牌区的低调图标 + 下拉菜单 ----------
  (function initPalette() {
    const box = document.getElementById('palettePicker');
    if (!box) return;
    const cur = currentThemeId();
    // 图标：半实半虚的对比圆，中性的墨色，不抢 brand 视线
    box.innerHTML = `
      <button class="pal-btn" title="切换配色" aria-label="切换配色">
        <svg width="16" height="16" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M19.2782 12.14C21.181 12.4802 22.9856 12.9636 24.6924 13.5899C21.8825 13.6074 19.0791 14.7782 17.0541 17.103L16.8557 17.338C14.0164 20.8063 13.8258 25.7793 16.2839 29.4497L16.2224 29.3375C18.7497 33.9805 23.0519 38.0543 27.499 39.3643C31.0799 40.4191 34.4305 40.6989 37.5178 40.1993L37.5447 40.1811C33.8191 43.092 29.3272 44.553 24.831 44.5656H24.7149L24.2838 44.56C18.9676 44.4356 13.6883 42.2862 9.70805 38.1144L9.37863 37.7609C5.80885 33.8395 4.01583 28.845 4 23.8458V23.7129L4.00633 23.2584C4.09466 19.6851 5.09141 16.1308 6.99642 12.986L6.9277 13.0052C11.431 11.7594 15.5469 11.4727 19.2782 12.14ZM29.8165 32.6328C31.3625 31.897 33.2256 32.2537 34.4485 33.4761L39.4604 38.4855L39.1209 38.8174C39.0934 38.8437 39.0659 38.8699 39.0383 38.8959C35.6475 39.8087 31.8914 39.663 27.7688 38.4486C24.7892 37.5709 22.2332 35.4184 19.9509 32.7704L19.9015 32.7431C22.9258 34.3813 26.604 34.377 29.6249 32.7305L29.8165 32.6328ZM24.7544 2.99994L25.1975 3.00471C30.3656 3.11518 35.5015 5.14197 39.4455 9.08599L34.4485 14.083L34.2924 14.2313C33.0178 15.3811 31.1429 15.6554 29.6249 14.8281L29.3639 14.6908C29.3141 14.6655 29.2642 14.6407 29.2142 14.6163C26.2909 12.9805 23.0341 11.8419 19.4463 11.2003C15.8761 10.5619 11.9853 10.7621 7.77611 11.797C8.35234 10.9768 8.99698 10.1901 9.70805 9.44472L10.0345 9.10999C14.0951 5.03678 19.4211 2.99994 24.7495 2.99994H24.7544Z" fill="currentColor"/>
          <path fill-rule="evenodd" clip-rule="evenodd" d="M41.549 17.3253L33.6594 21.8806L33.4435 22.0288C33.4435 22.0288 32.7681 22.4814 32.8427 23.4385C32.9079 24.2756 33.5043 24.6288 33.5043 24.6288L41.7348 29.3768C41.7348 29.3768 42.3796 29.7247 43.1811 29.2913C44.0774 28.8066 44.0162 27.8599 44.0162 27.8599V18.7503C44.0162 18.7503 44.0171 18.7404 44.0171 18.7227V18.698C44.0152 18.5127 43.9623 17.8792 43.3674 17.4409C43.02 17.185 42.6771 17.1049 42.3841 17.1049C41.8974 17.1054 41.549 17.3253 41.549 17.3253Z" fill="currentColor"/>
        </svg>
      </button>
      <div class="pal-menu">
        ${THEMES.map(t => `
          <button class="pal-item ${t.id === cur ? 'active' : ''}" data-theme="${t.id}">
            <span class="pal-swatch" style="background:linear-gradient(135deg, ${t.dot[0]}, ${t.dot[1]})"></span>
            <span class="pal-name">${t.name}</span>
            ${t.id === cur ? '<span class="pal-check">✓</span>' : ''}
          </button>`).join('')}
      </div>`;
    const menu = box.querySelector('.pal-menu');
    const btn = box.querySelector('.pal-btn');
    btn.onclick = (e) => { e.stopPropagation(); menu.classList.toggle('open'); };
    box.querySelectorAll('.pal-item').forEach(el => {
      el.onclick = (e) => {
        e.stopPropagation();
        const id = el.dataset.theme;
        if (id === currentThemeId()) { menu.classList.remove('open'); return; }
        localStorage.setItem(LS_THEME, id);
        toast('配色已切换：' + THEMES.find(t => t.id === id).name);
        location.reload(); // 整页重载，保证 mermaid 图与代码高亮一并刷新
      };
    });
    document.addEventListener('click', () => menu.classList.remove('open'));
  })();

  window.addEventListener('hashchange', route);
  route();
})();
