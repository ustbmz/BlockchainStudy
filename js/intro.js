/* 进站全屏动画控制：每会话只播一次 · 点击任意处跳过 · prefers-reduced-motion 直接跳过 */
(function () {
  'use strict';
  var KEY = 'bcr_intro_v1';
  var intro = document.getElementById('intro');
  function unlock() { document.body.classList.remove('intro-playing'); }
  if (!intro) { unlock(); return; }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      sessionStorage.getItem(KEY)) {
    intro.remove();
    unlock();
    return;
  }
  var done = false;
  function finish() {
    if (done) return;
    done = true;
    sessionStorage.setItem(KEY, '1');
    intro.classList.add('intro-out');
    unlock();
    setTimeout(function () { intro.remove(); }, 500);
  }
  intro.addEventListener('click', finish);
  // 动画 4s 播完 + 缓冲后自动收尾
  setTimeout(finish, 4300);
  // 动画进行中就取真实数据填充装载文案（content.js / interview.js 已在前加载）
  try {
    var el = document.getElementById('introLoad');
    if (el && window.__CONTENT__) {
      var docCount = window.__CONTENT__.docs.length;
      var qCount = (window.__INTERVIEW__ && window.__INTERVIEW__.questions) ?
        window.__INTERVIEW__.questions.length : 0;
      el.textContent = '正在装载 · ' + docCount + ' 篇文档 · ' + qCount + ' 道面试题';
    }
  } catch (e) { /* 文案保持兜底 */ }
})();
