/* Reading tools above the homepage article list. */
(() => {
  'use strict';
  if (window.__blogExploreInstalled) return;
  window.__blogExploreInstalled = true;

  const script = document.currentScript;
  const root = script && script.src ? new URL('../', script.src) : new URL('/', location.href);
  const catalogURL = new URL('explore-posts.json', root);
  const fortunes = [
    { title: '假期作业', good: '假期刚开始时说“还早”，快结束时说“来不及了”。', advice: '中间那段时间大概都用来打游戏了。' },
    { title: 'SOS 团临时通知', good: '今日活动：打开博客，随便乱逛。', advice: '流程尚未制定，团长先决定开干。' },
    { title: '宅休日', good: '本来打算出门，电脑开机后决定再说。', advice: '天气不错。窗帘拉上也看不出来。' },
    { title: '明天再看', good: '这题明天再看——然后明天又看了一遍。', advice: '现在已经熟练掌握了打开这道题的步骤。' },
    { title: '今日任务列表', good: '列了五条计划，只完成了“列计划”。', advice: '至少这一条完成得很彻底。' },
    { title: '部室没人值班', good: '本来想更新博客，先调了两个小时字体。', advice: '文章没多一篇，行距倒是顺眼了。' },
    { title: '游戏刚存档', good: '打完这局就去学习。这局还没开始。', advice: '读条期间打开 WP，勉强算一心二用。' },
    { title: '番剧排期', good: '只补一集。片尾刚结束，下一集自己播了。', advice: '自动连播得为我的作息负一半责任。' },
    { title: '深渊暂停', good: '今天不深渊，今天下断点。', advice: '两边卡住的时候，我一般先看番。' },
    { title: '此方式假期', good: '白天补觉，晚上补番，作业暂时没排上日程。', advice: '假期结束前一天，突然掌握了极限赶工。' },
    { title: '树脂花完了', good: '树脂花完了，给大脑换个本刷。', advice: '这个本叫 baby-stack，奖励是一个 flag。' },
    { title: '团员观察报告', good: '开了二十个标签页，哪个才是刚才那篇？', advice: '历史记录比我更清楚今天做了什么。' }
  ];
  const starlightLines = [
    '你很闲诶。星星都被你戳亮了。',
    '别戳了，亮着呢。拿这精力去找个 flag？',
    '好好好，再亮一次。这颗星星今天加班。'
  ];

  function todayFortune() {
    const today = new Date();
    const year = today.getFullYear(), month = today.getMonth() + 1, day = today.getDate();
    // The key follows the visitor's local calendar, including after midnight.
    const seed = year * 372 + (month - 1) * 31 + day - 1;
    return { ...fortunes[seed % fortunes.length], date: month + '月' + day + '日 · 便签', key: year + '-' + month + '-' + day };
  }

  function pathKey(path) {
    let value = path.replace(/\/index\.html$/, '/').replace(/\/+$/, '');
    try { value = decodeURI(value); } catch (_) {}
    return value || '/';
  }

  function safePosts(data) {
    if (!Array.isArray(data)) throw new Error('Invalid catalog');
    const current = pathKey(location.pathname);
    const seen = new Set();
    return data.reduce((posts, post) => {
      if (!post || typeof post.title !== 'string' || !post.title.trim() || typeof post.url !== 'string') return posts;
      try {
        const url = new URL(post.url, root);
        if (!['http:', 'https:'].includes(url.protocol) || url.origin !== location.origin || url.username || url.password) return posts;
        const key = pathKey(url.pathname);
        if (key === current || seen.has(key)) return posts;
        url.hash = '';
        url.search = '';
        seen.add(key);
        posts.push({ title: post.title.trim().slice(0, 300), url: url.href });
      } catch (_) { /* Invalid destinations never become links. */ }
      return posts;
    }, []);
  }

  function shuffle(items) {
    const copy = items.slice();
    for (let index = copy.length - 1; index > 0; index--) {
      const other = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[other]] = [copy[other], copy[index]];
    }
    return copy;
  }

  function install() {
    const host = document.querySelector('#recent-posts');
    if (!host || !document.querySelector('header.full_page, header.fullpage') || document.querySelector('.blog-explore-card')) return;
    const card = document.createElement('section');
    card.className = 'blog-explore-card';
    card.setAttribute('aria-label', '文章阅读工具');
    card.innerHTML =
      '<div class="blog-explore-bar"><div class="blog-explore-controls">' +
        '<button type="button" class="blog-explore-random">随便翻一篇</button>' +
        '<button type="button" class="blog-explore-fortune" aria-expanded="false" aria-controls="blog-explore-fortune-panel">今日便签</button>' +
      '</div><button type="button" class="blog-explore-emblem" aria-label="有点可疑的星星" title="有点可疑的星星"><span class="blog-explore-emblem-main" aria-hidden="true">✦</span></button></div>' +
      '<p class="blog-explore-status" role="status" aria-live="polite" hidden></p>' +
      '<div class="blog-explore-preview" aria-live="polite" aria-atomic="true" hidden>' +
        '<span class="blog-explore-preview-label">翻到这篇：</span><a class="blog-explore-title"></a>' +
        '<a class="blog-explore-go">打开文章 <span aria-hidden="true">→</span></a>' +
      '</div>' +
      '<div class="blog-explore-fortune-panel" id="blog-explore-fortune-panel" aria-live="polite" aria-atomic="true" hidden>' +
        '<span class="blog-explore-fortune-date"></span><h3 class="blog-explore-fortune-title"></h3>' +
        '<p class="blog-explore-fortune-good"></p><p class="blog-explore-fortune-advice"></p>' +
      '</div>' +
      '<p class="blog-explore-starlight-status" role="status" aria-live="polite" hidden></p>';
    host.prepend(card);

    const random = card.querySelector('.blog-explore-random');
    const status = card.querySelector('.blog-explore-status');
    const preview = card.querySelector('.blog-explore-preview');
    const title = card.querySelector('.blog-explore-title');
    const go = card.querySelector('.blog-explore-go');
    const fortuneButton = card.querySelector('.blog-explore-fortune');
    const fortunePanel = card.querySelector('.blog-explore-fortune-panel');
    const emblem = card.querySelector('.blog-explore-emblem');
    const starlightStatus = card.querySelector('.blog-explore-starlight-status');
    let posts = null, bag = [], selected = null, busy = false;
    let starClicks = 0, lastStarClick = 0, lastStarUnlock = -Infinity, starUnlocks = 0;

    async function loadCatalog() {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      try {
        const response = await fetch(catalogURL.href, { signal: controller.signal, credentials: 'same-origin' });
        if (!response.ok) throw new Error('Catalog unavailable');
        const loaded = safePosts(await response.json());
        if (!loaded.length) throw new Error('No destinations');
        return loaded;
      } finally { clearTimeout(timeout); }
    }

    random.addEventListener('click', async () => {
      if (busy) return;
      busy = true;
      random.disabled = true;
      card.setAttribute('aria-busy', 'true');
      status.hidden = false;
      status.textContent = '找篇文章…';
      try {
        if (!posts) posts = await loadCatalog();
        if (!bag.length) {
          bag = shuffle(posts);
          if (bag.length > 1 && selected && bag[bag.length - 1].url === selected.url) {
            [bag[0], bag[bag.length - 1]] = [bag[bag.length - 1], bag[0]];
          }
        }
        selected = bag.pop();
        title.textContent = selected.title;
        title.href = selected.url;
        go.href = selected.url;
        preview.hidden = false;
        status.hidden = true;
        random.textContent = '再换一篇';
      } catch (_) {
        status.textContent = '文章列表没加载出来，再点一次试试。';
        random.textContent = '再试一次';
      } finally {
        busy = false;
        random.disabled = false;
        card.removeAttribute('aria-busy');
      }
    });

    [title, go].forEach(link => {
      const discoverTravel = event => {
        if (selected && (event.type === 'click' || event.button === 1)) window.BlogAdventure?.discover?.('traveler');
      };
      link.addEventListener('click', discoverTravel);
      link.addEventListener('auxclick', discoverTravel);
    });

    fortuneButton.addEventListener('click', () => {
      const opening = fortunePanel.hidden;
      fortunePanel.hidden = !opening;
      fortuneButton.setAttribute('aria-expanded', String(opening));
      if (!opening) return;
      const fortune = todayFortune();
      fortunePanel.dataset.date = fortune.key;
      fortunePanel.querySelector('.blog-explore-fortune-date').textContent = fortune.date;
      fortunePanel.querySelector('.blog-explore-fortune-title').textContent = fortune.title;
      fortunePanel.querySelector('.blog-explore-fortune-good').textContent = fortune.good;
      fortunePanel.querySelector('.blog-explore-fortune-advice').textContent = fortune.advice;
      window.BlogAdventure?.discover?.('fortune');
    });

    emblem.addEventListener('click', () => {
      const now = Date.now();
      if (now - lastStarUnlock < 6000) return;
      starClicks = now - lastStarClick > 4000 ? 1 : starClicks + 1;
      lastStarClick = now;
      if (starClicks < 5) return;
      starClicks = 0;
      lastStarUnlock = now;
      starlightStatus.hidden = false;
      starlightStatus.textContent = starlightLines[starUnlocks++ % starlightLines.length];
      emblem.classList.add('blog-explore-lit', 'blog-explore-awake');
      setTimeout(() => emblem.classList.remove('blog-explore-awake'), 1200);
      window.BlogAdventure?.discover?.('starlight');
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
