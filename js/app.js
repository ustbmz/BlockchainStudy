/* 区块链开发复习中心 · 前端逻辑 */
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
  let docProgress = JSON.parse(localStorage.getItem(LS_DOC) || '{}');
  let cardProgress = JSON.parse(localStorage.getItem(LS_CARD) || '{}');
  let navOpen = JSON.parse(localStorage.getItem(LS_NAV) || '{}');
  let pathProgress = JSON.parse(localStorage.getItem(LS_PATH) || '{}');
  let pathStrict = localStorage.getItem(LS_PATH + '_strict') === '1';

  function saveDoc() { localStorage.setItem(LS_DOC, JSON.stringify(docProgress)); }
  function saveCard() { localStorage.setItem(LS_CARD, JSON.stringify(cardProgress)); }
  function saveNav() { localStorage.setItem(LS_NAV, JSON.stringify(navOpen)); }
  function savePath() { localStorage.setItem(LS_PATH, JSON.stringify(pathProgress)); localStorage.setItem(LS_PATH + '_strict', pathStrict ? '1' : '0'); }

  // ---------- markdown 渲染 ----------
  marked.setOptions({ gfm: true, breaks: false });

  function slugify(text, used) {
    let s = text.trim().toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-').replace(/^-+|-+$/g, '') || 'h';
    if (used[s] !== undefined) { used[s]++; s += '-' + used[s]; } else used[s] = 0;
    return s;
  }

  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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
    else if (hash.startsWith('#/search/')) { currentDocId = null; renderSearch(decodeURIComponent(hash.slice(9))); }
    else if (m) { currentDocId = m[2]; renderDoc(m[2], m[1] === 'cards'); }
    else { currentDocId = null; renderHome(); }
    renderNav();
    main.scrollTop = 0;
  }

  // ---------- 侧栏 ----------
  function renderNav() {
    let html = `<div class="nav-chapter path-entry">
      <div class="nav-chapter-head ${location.hash === '#/path' ? 'path-active' : ''}" data-go-path="1">
        <span class="num">GO</span>
        <span>学习路径</span>
        <span class="arrow">→</span>
      </div>
    </div>`;
    C.meta.chapters.forEach(ch => {
      const open = navOpen[ch.id] !== false;
      const docIds = ch.groups.reduce((a, g) => a.concat(g.docIds), []);
      const done = docIds.filter(id => docProgress[id]).length;
      html += `<div class="nav-chapter ${open ? '' : 'closed'}" data-ch="${ch.id}">
        <div class="nav-chapter-head" data-toggle="${ch.id}">
          <span class="num">${ch.num}</span>
          <span>${ch.title}</span>
          <span class="arrow">▼</span>
        </div>`;
      const tDoc = docsById[ch.teacherDocId];
      if (tDoc) {
        const active = currentDocId === tDoc.id ? 'active' : '';
        const doneCls = docProgress[tDoc.id] ? 'done' : '';
        html += `<div class="nav-doc teacher-entry ${active} ${doneCls}" data-go="doc/${tDoc.id}">
          <span class="dot"></span>
          <span style="overflow:hidden;text-overflow:ellipsis">📌 作业要求（老师的任务书）</span>
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
    nav.querySelectorAll('[data-toggle]').forEach(el => {
      el.onclick = () => {
        const ch = el.dataset.toggle;
        navOpen[ch] = navOpen[ch] === false ? true : false;
        saveNav();
        nav.querySelector(`[data-ch="${ch}"]`).classList.toggle('closed', navOpen[ch] === false);
      };
    });
    nav.querySelectorAll('[data-go]').forEach(el => {
      el.onclick = () => { location.hash = '#/' + el.dataset.go; };
    });
    const goPath = nav.querySelector('[data-go-path]');
    if (goPath) goPath.onclick = () => { location.hash = '#/path'; };
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

    let cardsHtml = C.meta.chapters.map(ch => {
      const st = chapterStats(ch);
      const pct = st.total ? Math.round(st.readCount / st.total * 100) : 0;
      const cardPct = st.cardTotal ? Math.round(st.known / st.cardTotal * 100) : 0;
      return `<div class="chapter-card" data-go="doc/${ch.teacherDocId}">
        <div class="cc-head">
          <span class="cc-num">阶段 ${ch.num}</span>
          <h3>${ch.title}</h3>
          <span style="margin-left:auto;font-size:12px;color:var(--text-dim)">${ch.weeks} 周</span>
        </div>
        <div class="cc-summary">${ch.summary}</div>
        <div>
          <div class="cc-progress-label"><span>文档 ${st.readCount}/${st.total}</span><span>卡片掌握 ${st.known}/${st.cardTotal}</span></div>
          <div class="progress-bar" style="margin-top:4px"><div style="width:${pct}%"></div></div>
          <div class="progress-bar" style="margin-top:4px"><div style="width:${cardPct}%;background:linear-gradient(90deg,var(--orange),var(--green))"></div></div>
        </div>
      </div>`;
    }).join('');

    const pathCta = (() => {
      if (!LP.steps.length) return '';
      const st = pathStats();
      return `<div class="path-cta" data-go-path="1">
        <div class="cta-left">
          <div class="cta-title">🎯 第一次来？跟学习路径走</div>
          <div class="cta-sub">29 步有序路线 · 每步带资料与预计时长 · ${st.done > 0 ? `你已完成 ${st.done} 步，下一步是「${LP.steps[st.nextIdx].t}」` : '从 Go 基础一路走到项目拆解'}</div>
        </div>
        <button class="btn primary big">${st.done > 0 ? '继续学习' : '开始学习'}</button>
      </div>`;
    })();

    main.innerHTML = `<div class="main-inner">
      <div class="home-hero">
        <h1>⛓️ 区块链开发工程师 · 系统课程复习中心</h1>
        <p>老师的作业要求 + 我的全部作业答案与学习笔记，按课程阶段整理。适合快速复习，也可以直接照着学习。</p>
        <div class="stats">
          <span class="stat-pill">📚 文档 <b>${totalDocs}</b> 篇</span>
          <span class="stat-pill">🃏 复习卡片 <b>${C.cardCount}</b> 张</span>
          <span class="stat-pill">✅ 已读 <b>${readTotal}</b> 篇</span>
          <span class="stat-pill">🧠 已掌握 <b>${knownTotal}</b> 张卡片</span>
          <span class="stat-pill">🗓 更新于 ${C.meta.builtAt}</span>
        </div>
      </div>
      ${pathCta}
      <div class="chapter-grid">${cardsHtml}</div>
    </div>`;

    main.querySelectorAll('[data-go]').forEach(el => {
      el.onclick = () => { location.hash = '#/' + el.dataset.go; };
    });
    const cta = main.querySelector('[data-go-path]');
    if (cta) cta.onclick = () => { location.hash = '#/path'; };
  }

  // ---------- 文档页 ----------
  function renderDoc(docId, cardMode) {
    const d = docsById[docId];
    if (!d) { main.innerHTML = '<div class="main-inner"><p>文档不存在</p></div>'; return; }
    const ch = C.meta.chapters.find(c => c.id === d.chapter);
    const done = !!docProgress[docId];

    const header = `<div class="doc-header">
        <span class="doc-chapter-tag">阶段 ${ch.num} · ${ch.title}</span>
        ${d.isTeacher ? '<span class="doc-teacher-tag">老师要求</span>' : ''}
        <div class="doc-actions">
          ${d.qa ? `<button class="btn ${cardMode ? '' : 'primary'}" data-mode="cards">🃏 复习卡片模式</button>
                   <button class="btn ${cardMode ? 'primary' : ''}" data-mode="read">📄 原文阅读</button>` : ''}
          <button class="btn ${done ? 'done-state' : ''}" id="markBtn">${done ? '✅ 已读' : '标记为已读'}</button>
        </div>
      </div>
      <h1>${d.title}</h1>`;

    let body = '';
    let tocFloat = '';
    if (cardMode && d.qa) {
      body = renderCards(d);
    } else {
      const { html, toc } = renderMD(d.content);
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
    if (confirm('确定清空所有阅读进度、卡片掌握与学习路径记录吗？')) {
      localStorage.removeItem(LS_DOC);
      localStorage.removeItem(LS_CARD);
      localStorage.removeItem(LS_PATH);
      docProgress = {}; cardProgress = {}; pathProgress = {};
      toast('进度已重置');
      route();
    }
  };

  document.getElementById('buildDate').textContent = '更新于 ' + C.meta.builtAt;

  window.addEventListener('hashchange', route);
  route();
})();
