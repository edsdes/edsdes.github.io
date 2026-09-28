/* Reading progress stays in this browser; only article pages participate. */
(() => {
  'use strict';
  const article = document.querySelector('#post > #article-container');
  if (!article || window.__blogReadingInstalled) return;
  window.__blogReadingInstalled = true;
  const KEY = 'blog-reading-v1', MAX_AGE = 90 * 86400000, LINE = 80;
  const page = location.pathname.replace(/\/index\.html$/, '/').replace(/\/?$/, '/');
  const valid = record => record && Number.isFinite(record.ratio) && record.ratio > 0 && record.ratio < .98 &&
    Number.isFinite(record.time) && record.time <= Date.now() && Date.now() - record.time < MAX_AGE &&
    typeof record.anchor === 'string' && record.anchor.length < 1000 &&
    Number.isFinite(record.section) && record.section >= 0 && record.section <= 1;
  function read() {
    try {
      const data = JSON.parse(localStorage.getItem(KEY) || '{}');
      if (!data || typeof data !== 'object' || Array.isArray(data)) return {};
      return Object.fromEntries(Object.entries(data).filter(([, record]) => valid(record)));
    } catch (_) { return {}; }
  }
  function write(record) {
    try {
      const data = read();
      if (record) data[page] = record;
      else delete data[page];
      const recent = Object.entries(data).sort((a, b) => b[1].time - a[1].time).slice(0, 50);
      localStorage.setItem(KEY, JSON.stringify(Object.fromEntries(recent)));
    } catch (_) { /* Private mode or full storage must never interrupt reading. */ }
  }
  function geometry() {
    const box = article.getBoundingClientRect();
    const top = box.top + window.scrollY;
    return { top, height: box.height, bottom: top + box.height };
  }
  const headings = [...article.querySelectorAll('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]')];
  const saved = read()[page];
  let prompt, pending = !!saved && !location.hash, moved = false, restoring = false, saveTimer;
  function save() {
    if (!moved || pending || restoring || document.querySelector('.blog-atomic')) return;
    const { top, height, bottom } = geometry();
    if (height < innerHeight * 1.5) return;
    const line = window.scrollY + LINE;
    if (window.scrollY + innerHeight >= bottom - 40) { write(null); moved = false; return; }
    // A newly opened page or a brief glance at the header must not erase a bookmark.
    if (line - top < 350) return;
    const ratio = Math.max(0, Math.min(.979, (line - top) / height));
    let index = -1;
    headings.forEach((heading, i) => { if (heading.getBoundingClientRect().top + window.scrollY <= line) index = i; });
    const heading = headings[index];
    const start = heading ? heading.getBoundingClientRect().top + window.scrollY : top;
    const next = headings[index + 1];
    const end = next ? next.getBoundingClientRect().top + window.scrollY : bottom;
    write({ ratio, anchor: heading?.id || '', section: Math.max(0, Math.min(1, (line - start) / Math.max(1, end - start))), time: Date.now() });
    moved = false;
  }
  function dismiss() {
    pending = false;
    prompt?.remove();
    prompt = null;
  }
  function destination(record) {
    const { top, height, bottom } = geometry();
    const index = headings.findIndex(heading => heading.id === record.anchor);
    if (index < 0 && record.anchor) return top + height * record.ratio - LINE;
    const start = index < 0 ? top : headings[index].getBoundingClientRect().top + window.scrollY;
    const next = headings[index + 1];
    const end = next ? next.getBoundingClientRect().top + window.scrollY : bottom;
    return Math.max(0, start + (end - start) * record.section - LINE);
  }
  function showPrompt() {
    if (!pending) return;
    prompt = document.createElement('aside');
    prompt.className = 'blog-reading-resume';
    prompt.setAttribute('aria-label', '上次阅读位置');
    const info = document.createElement('span');
    info.className = 'blog-reading-info';
    info.textContent = '上次读到约 ' + Math.round(saved.ratio * 100) + '%';
    const resume = document.createElement('button');
    resume.type = 'button';
    resume.className = 'blog-reading-continue';
    resume.textContent = '继续阅读';
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'blog-reading-dismiss';
    close.textContent = '×';
    close.setAttribute('aria-label', '关闭阅读位置提示');
    close.title = '关闭提示';
    close.addEventListener('click', dismiss);
    prompt.addEventListener('keydown', event => { if (event.key === 'Escape') dismiss(); });
    resume.addEventListener('click', async () => {
      if (restoring) return;
      restoring = true;
      resume.disabled = true;
      resume.textContent = '正在定位…';
      // Give eager article images time to settle, with a short upper bound on waiting.
      const images = [...article.querySelectorAll('img')].filter(img => !img.complete && img.loading !== 'lazy');
      await Promise.race([
        Promise.all(images.map(img => img.decode ? img.decode().catch(() => {}) : Promise.resolve())),
        new Promise(resolve => setTimeout(resolve, 1200))
      ]);
      // A close click while images were loading cancels the requested jump.
      if (!prompt?.isConnected) { restoring = false; return; }
      window.scrollTo({ top: destination(saved), behavior: 'instant' });
      dismiss();
      const hadTabIndex = article.hasAttribute('tabindex');
      if (!hadTabIndex) article.setAttribute('tabindex', '-1');
      article.focus({ preventScroll: true });
      if (!hadTabIndex) article.addEventListener('blur', () => article.removeAttribute('tabindex'), { once: true });
      moved = true;
      restoring = false;
      save();
    });
    prompt.append(info, resume, close);
    document.body.append(prompt);
  }
  window.addEventListener('scroll', () => {
    moved = true;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 400);
  }, { passive: true });
  window.addEventListener('pagehide', () => { clearTimeout(saveTimer); save(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') save(); });
  window.addEventListener('hashchange', () => { if (location.hash) dismiss(); });
  showPrompt();
})();
