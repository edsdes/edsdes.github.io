/* Personal-site easter eggs. Progress, club membership and D-mail stay in this browser. */
(() => {
  'use strict';
  if (window.BlogAdventure) return;
  const KEY = 'blog-adventure-v1';
  const SOS_KEY = 'blog-sos-v1';
  const LAB_KEY = 'blog-lab-v1';
  const greeting = '恭喜你，找齐了小站里的八个彩蛋。感谢光临我的博客，希望你喜欢。Ciallo～(∠・ω< )⌒★';
  const roles = { debug: '找 bug 的', writeup: '写 WP 的', game: '负责摸鱼的', observe: '观测世界线的' };
  const worldlines = ['1.048596', '0.571024', '0.337187', '1.130426'];
  const entries = [
    { id: 'traveler', icon: '↗', title: '随便逛过了', hint: '首页随机选一篇文章，真的过去看看。', action: '去翻一篇文章', href: '/#recent-posts', target: '.blog-explore-random' },
    { id: 'fortune', icon: '☾', title: '今日便签', hint: '首页有张每天换一次的小纸条。', action: '去看今日便签', href: '/#recent-posts', target: '.blog-explore-fortune' },
    { id: 'starlight', icon: '✦', title: '可疑的星星', hint: '首页那颗星星可以多点几下。', action: '去找那颗星星', href: '/#recent-posts', target: '.blog-explore-emblem' },
    { id: 'rocket', icon: '↑', title: '搭过火箭', hint: '向下逛一逛，再点右下角的小火箭回到顶部。', action: '去页面下方', href: '/#footer', target: '#footer', tip: '到页面下方了。右下角的小火箭，负责送你回顶部。' },
    { id: 'atomic', icon: '◈', title: '暗影剧场', hint: '和侧栏头像连续打几次招呼；手机上先展开菜单。', action: '去找博主头像', href: '/#aside-content', target: '.blog-avatar-button' },
    { id: 'graduate', icon: '⚑', title: 'CTF 三题通过', hint: 'CTF 小练习的三道题，各有一枚 flag。', action: '去做 CTF 小练习', href: '/play/' },
    { id: 'terminal', icon: '⌘', title: '实验室的秘密', hint: '隐藏终端里，有个以点开头的文件。', action: '打开隐藏终端', panel: 'terminal' },
    { id: 'arcade', icon: '♧', title: '摸鱼记录', hint: '摸鱼角里翻牌或抓 flag，赢一局就算。', action: '去摸鱼角玩一局', href: '/play/arcade/' }
  ];
  const clubCharacters = [
    { id: 'haruhi', name: '春日', work: '凉宫春日的忧郁', x: '0%', y: '0%', notes: ['今天的议题：找点不寻常的事。先从这本彩蛋簿开始。', '活动经费暂时没有，零食可以先记在团长账上。'] },
    { id: 'konata', name: '此方', work: '幸运星', x: '33.333%', y: '0%', notes: ['把写 WP 排进日程以后，就可以先打一会儿游戏了。', '键盘摆好了，茶也泡了。接下来只差一个不想摸鱼的我。'] },
    { id: 'kurisu', name: '红莉栖', work: '命运石之门', x: '66.667%', y: '0%', notes: ['同一个 bug 改了三次？把报错给我，先别怪世界线。', '微波炉旁边那台电脑可以用。不要往里面放香蕉。'] },
    { id: 'yuki', name: '长门有希', work: '凉宫春日的忧郁', x: '100%', y: '0%', notes: ['书在桌上。书签停在还没看完的那一页。', '记录已保存。建议先把茶喝掉。'] },
    { id: 'mikoto', name: '御坂美琴', work: '某科学的超电磁炮', x: '0%', y: '100%', notes: ['街机的最高分先放一边。你刚才那局还没结束。', '电脑又没反应了？别看我，这次真的没放电。'] },
    { id: 'azusa', name: '中野梓', work: '轻音少女', x: '33.333%', y: '100%', notes: ['茶可以再喝一杯，练习也别拖到明天。', '零食先放下。至少把这一小段做完吧。'] },
    { id: 'kuroneko', name: '黑猫', work: '我的妹妹哪有这么可爱！', x: '66.667%', y: '100%', notes: ['这份题解的标题太朴素了。内容倒是可以再看一遍。', '所谓隐藏记录……你总得先把隐藏文件列出来。'] },
    { id: 'yui', name: '平泽唯', work: '轻音少女', x: '0%', y: '0%', portrait: '/img/easter-eggs/yui-room-portrait.webp', notes: ['先吃一块点心，再开始练习吧。梓说只能一块。', '吉他调好了！……刚才那个和弦，再教我一次好不好？'] }
  ];
  const ids = entries.map(entry => entry.id);
  function read() {
    try {
      const data = JSON.parse(localStorage.getItem(KEY) || '{}');
      return new Set(Array.isArray(data?.found) ? data.found.filter(id => ids.includes(id)) : []);
    } catch (_) { return new Set(); }
  }
  function readSOS(fallback = null) {
    try {
      const saved = JSON.parse(localStorage.getItem(SOS_KEY) || 'null');
      if (!saved || typeof saved.name !== 'string' || !saved.name.trim() || saved.name.length > 20 || !Object.hasOwn(roles, saved.role) || !/^\d{4}$/.test(saved.number) || !/^\d{4}\.\d{2}\.\d{2}$/.test(saved.date)) return null;
      return { name: saved.name, role: saved.role, number: saved.number, date: saved.date };
    } catch (_) { return fallback; }
  }
  function readLab(fallback = { worldline: worldlines[0], mail: '' }) {
    try {
      const saved = JSON.parse(localStorage.getItem(LAB_KEY) || '{}');
      return { worldline: worldlines.includes(saved?.worldline) ? saved.worldline : worldlines[0], mail: typeof saved?.mail === 'string' ? saved.mail.slice(0, 100) : '' };
    } catch (_) { return fallback; }
  }
  let lab = readLab(), membership = readSOS(), labSaved = true, membershipSaved = true;
  function saveLab() {
    try { localStorage.setItem(LAB_KEY, JSON.stringify(lab)); labSaved = true; }
    catch (_) { labSaved = false; }
    return labSaved;
  }
  let found = read(), activeDialog = null, toastTimer, previousOverflow;
  const launcher = document.createElement('button');
  launcher.type = 'button';
  launcher.className = 'adventure-launcher adventure-footer-book';
  launcher.textContent = '小站角落';
  launcher.setAttribute('aria-label', '打开小站角落的彩蛋簿');
  const toast = document.createElement('div');
  toast.className = 'adventure-toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  document.body.append(toast);
  function sync() {
    if (activeDialog?.dataset.panel === 'book') {
      activeDialog.querySelector('[data-book-count]').textContent = found.size + '/8';
      activeDialog.querySelector('progress').value = found.size;
      activeDialog.querySelectorAll('[data-discovery]').forEach(node => {
        const entry = entries.find(item => item.id === node.dataset.discovery);
        const earned = found.has(entry.id);
        node.classList.toggle('is-found', earned);
        node.querySelector('h3').textContent = entry.title;
        node.querySelector('[data-entry-state]').textContent = earned ? '已找到' : '还没找到';
      });
      activeDialog.querySelector('.adventure-reward').hidden = found.size !== ids.length;
      activeDialog.querySelector('[data-keepsake-quick]').hidden = found.size !== ids.length;
    }
    if (activeDialog?.dataset.panel === 'keepsake' && found.size !== ids.length) closePanel();
    window.dispatchEvent(new CustomEvent('blog:adventure', { detail: { found: ids.filter(id => found.has(id)), count: found.size } }));
  }
  function notice(message) {
    if (activeDialog) { activeDialog.querySelector('.adventure-panel-status').textContent = message; return; }
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('is-visible');
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 3800);
  }
  function discover(id, options = {}) {
    if (!ids.includes(id)) return false;
    read().forEach(saved => found.add(saved));
    if (found.has(id)) { sync(); return false; }
    found.add(id);
    try { localStorage.setItem(KEY, JSON.stringify({ found: ids.filter(saved => found.has(saved)) })); } catch (_) {}
    sync();
    if (!options.quiet && (activeDialog || found.size === ids.length)) notice(found.size === ids.length ? '恭喜你，八个彩蛋已全部找齐。彩蛋簿里有一张纪念卡和一封信，留给你。' : '找到「' + entries.find(entry => entry.id === id).title + '」 · ' + found.size + '/8');
    return true;
  }
  function closePanel() { activeDialog?.close(); }
  function panel(kind, title, subtitle) {
    closePanel();
    const focused = document.activeElement;
    const dialog = document.createElement('dialog');
    dialog.className = 'adventure-dialog';
    dialog.dataset.panel = kind;
    dialog.setAttribute('aria-labelledby', 'adventure-panel-title');
    dialog.innerHTML = '<div class="adventure-panel"><header class="adventure-panel-head"><h2 id="adventure-panel-title"></h2><button type="button" class="adventure-close" aria-label="关闭窗口">×</button></header><p class="adventure-subtitle"></p><div class="adventure-panel-body"></div><p class="adventure-panel-status" role="status" aria-live="polite"></p></div>';
    dialog.querySelector('h2').textContent = title;
    dialog.querySelector('.adventure-subtitle').textContent = subtitle;
    dialog.querySelector('.adventure-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('cancel', event => { event.preventDefault(); dialog.close(); });
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
    dialog.addEventListener('close', () => {
      dialog.remove();
      if (activeDialog === dialog) {
        activeDialog = null;
        document.documentElement.style.overflow = previousOverflow;
        if (focused?.isConnected && typeof focused.focus === 'function') focused.focus({ preventScroll: true });
        else {
          const fallback = launcher.isConnected ? launcher : document.querySelector('[data-open-book], [data-sos-room]');
          fallback?.focus({ preventScroll: true });
        }
        window.dispatchEvent(new CustomEvent('blog:panel', { detail: { open: false, kind } }));
      }
    }, { once: true });
    if (!activeDialog) previousOverflow = document.documentElement.style.overflow;
    activeDialog = dialog;
    document.documentElement.style.overflow = 'hidden';
    document.body.append(dialog);
    dialog.showModal();
    window.dispatchEvent(new CustomEvent('blog:panel', { detail: { open: true, kind } }));
    toast.classList.remove('is-visible');
    return dialog;
  }
  function openBook() {
    const dialog = panel('book', '彩蛋簿', '找齐八个，可以收下合照、壁纸和书签。');
    const body = dialog.querySelector('.adventure-panel-body');
    body.innerHTML = '<div class="adventure-book-intro"><div class="adventure-book-memo"><p>没找到的，可以从这里过去。</p><div class="adventure-book-progress"><span>已找到 <strong data-book-count></strong></span><progress class="adventure-sr-only" max="8" value="0" aria-label="彩蛋收集进度"></progress></div><button type="button" class="adventure-secondary" data-keepsake-quick hidden>礼物在这儿 →</button></div><button type="button" class="adventure-book-visitor" data-open-anime><img src="/img/easter-eggs/konata-room-cutout.webp" alt="此方拿着掌机和饼干坐在部室里" width="667" height="1000" decoding="async"><span>去部室坐坐 →</span></button></div><div class="adventure-stamps" aria-label="八枚彩蛋记录"></div><nav class="adventure-book-footer" aria-label="部室入口"><span>歇一会儿：</span><button type="button" class="adventure-secondary" data-open-anime>SOS 团部室</button><button type="button" class="adventure-secondary" data-open-wish>抽张纸条</button></nav><section class="adventure-reward" hidden><h3>留在最后的一封信</h3><details><summary>拆开这封信</summary><p class="adventure-letter-message"></p><p class="adventure-letter-sign">—— 无敌马的小窝</p></details><div class="adventure-reward-actions"><button type="button" class="adventure-secondary" data-open-keepsake>挑一份留念 ↗</button><button type="button" class="adventure-secondary" data-reward-wish>看看金色便签</button></div><p class="adventure-letter-note">合照、角色壁纸和书签都可以保存，也给你留了张金色便签。</p></section><p class="adventure-local-note">记录存在当前浏览器里。</p>';
    body.querySelector('.adventure-letter-message').textContent = greeting;
    body.querySelector('[data-open-keepsake]').addEventListener('click', openKeepsake);
    body.querySelector('[data-keepsake-quick]').addEventListener('click', openKeepsake);
    body.querySelector('[data-reward-wish]').addEventListener('click', () => {
      if (found.size !== ids.length) return;
      openWish();
      activeDialog.querySelector('[data-wish]').click();
    });
    const stamps = body.querySelector('.adventure-stamps');
    entries.forEach(entry => {
      const item = document.createElement('article');
      item.className = 'adventure-stamp';
      item.dataset.discovery = entry.id;
      item.innerHTML = '<span class="adventure-stamp-icon" aria-hidden="true"></span><div><div class="adventure-stamp-heading"><h3></h3></div><p></p><div class="adventure-stamp-foot"><span data-entry-state></span></div></div>';
      item.querySelector('.adventure-stamp-icon').textContent = entry.icon;
      item.querySelector('p').textContent = entry.hint;
      const action = document.createElement(entry.panel ? 'button' : 'a');
      action.className = 'adventure-entry-link';
      action.textContent = entry.action + ' →';
      if (entry.panel) {
        action.type = 'button';
        action.dataset.openTerminal = '';
        action.addEventListener('click', openTerminal);
      } else {
        action.href = entry.href;
        if (entry.target) action.addEventListener('click', event => {
          const targets = Array.from(document.querySelectorAll(entry.target));
          let target = targets.find(node => node.getClientRects().length && !node.closest('#sidebar-menus:not(.open)'));
          let openMenu = false;
          if (!target && entry.id === 'atomic' && document.querySelector('#toggle-menu')?.getClientRects().length) {
            target = targets.find(node => node.closest('#sidebar-menus'));
            openMenu = !!target;
          }
          if (!target) return;
          event.preventDefault();
          dialog.addEventListener('close', () => {
            if (openMenu) document.querySelector('#toggle-menu').click();
            else target.scrollIntoView({ block: 'center', behavior: 'auto' });
            if (typeof target.focus === 'function' && target.matches('button, a, input')) target.focus({ preventScroll: true });
            if (entry.tip) notice(entry.tip);
          }, { once: true });
          dialog.close();
        });
      }
      item.querySelector('.adventure-stamp-foot').append(action);
      stamps.append(item);
    });
    body.querySelector('[data-open-wish]').addEventListener('click', openWish);
    body.querySelectorAll('[data-open-anime]').forEach(button => button.addEventListener('click', openAnime));
    sync();
    dialog.querySelector('.adventure-close').focus({ preventScroll: true });
  }
  function openKeepsake() {
    if (found.size !== ids.length) {
      notice('八个彩蛋找齐后，留给你的礼物就会出现在彩蛋簿里。');
      return;
    }
    const dialog = panel('keepsake', '留给你的礼物', '合照可以留着，也可以挑一张壁纸或书签。');
    const body = dialog.querySelector('.adventure-panel-body');
    body.innerHTML = '<nav class="adventure-keepsake-formats" aria-label="礼物样式"><button type="button" data-keepsake-format="card" aria-pressed="true">合照卡</button><button type="button" data-keepsake-format="wallpaper" aria-pressed="false">手机壁纸</button><button type="button" data-keepsake-format="bookmark" aria-pressed="false">角色书签</button></nav><div class="adventure-keepsake-choices" data-keepsake-covers role="group" aria-label="合照"><button type="button" data-keepsake-cover="club" aria-pressed="true">放学后的部室</button><button type="button" data-keepsake-cover="tea" aria-pressed="false">下午茶</button></div><div class="adventure-keepsake-choices" data-keepsake-characters role="group" aria-label="选择角色" hidden><button type="button" data-keepsake-character="konata" aria-pressed="true">此方</button><button type="button" data-keepsake-character="yui" aria-pressed="false">平泽唯</button><button type="button" data-keepsake-character="chino" aria-pressed="false">香风智乃</button></div><figure class="adventure-keepsake-picture" data-keepsake-preview="card" aria-busy="true"><img data-keepsake-image hidden alt="春日、此方和红莉栖的全收集纪念卡" width="1600" height="1160"><p data-keepsake-loading role="status" aria-live="polite">合照准备中…</p></figure><p class="adventure-keepsake-caption" data-keepsake-caption>1600 × 1160 / 合照卡</p><form class="adventure-keepsake-signature"><label for="adventure-keepsake-name">留给<input id="adventure-keepsake-name" data-keepsake-name maxlength="20" autocomplete="nickname" placeholder="来小站做客的你"></label><button type="submit" class="adventure-secondary" data-keepsake-update data-keepsake-personalize>更新署名</button></form><p class="adventure-keepsake-text"></p><div class="adventure-keepsake-actions"><a data-keepsake-save hidden download>保存纪念卡</a><button type="button" class="adventure-secondary" data-keepsake-retry hidden>再试一次</button><button type="button" class="adventure-secondary" data-back-book>回彩蛋簿</button></div><p class="adventure-keepsake-tip">手机上也可以长按图片保存。</p>';
    body.querySelector('.adventure-keepsake-text').textContent = greeting;
    const image = body.querySelector('[data-keepsake-image]');
    const frame = body.querySelector('.adventure-keepsake-picture');
    const loading = body.querySelector('[data-keepsake-loading]');
    const save = body.querySelector('[data-keepsake-save]');
    const retry = body.querySelector('[data-keepsake-retry]');
    const caption = body.querySelector('[data-keepsake-caption]');
    const input = body.querySelector('[data-keepsake-name]');
    const status = dialog.querySelector('.adventure-panel-status');
    const savedMembership = membershipSaved ? readSOS(membership) : membership;
    let recipient = savedMembership?.name || '来小站做客的你';
    input.value = savedMembership?.name || '';
    const now = new Date();
    const date = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('.');
    const formats = {
      card: { width: 1600, height: 1160, name: '合照卡', save: '保存纪念卡' },
      wallpaper: { width: 1080, height: 1920, name: '手机壁纸', save: '保存壁纸' },
      bookmark: { width: 600, height: 1600, name: '角色书签', save: '保存书签' }
    };
    const portraits = {
      konata: { name: '此方', src: '/img/easter-eggs/konata-room-cutout.webp', paper: '#f5f1fc', ink: '#685481' },
      yui: { name: '平泽唯', src: '/img/easter-eggs/yui-room-cutout.webp', paper: '#fff7eb', ink: '#966747' },
      chino: { name: '香风智乃', src: '/img/easter-eggs/chino-room-cutout.webp', paper: '#edf6fa', ink: '#527b90' }
    };
    const covers = {
      club: { name: '放学后的部室', src: '/img/easter-eggs/all-collected-clubroom.webp', alt: '春日、此方和红莉栖的全收集纪念卡' },
      tea: { name: '下午茶', src: '/img/easter-eggs/classic-club-afternoon.webp', alt: '长门、美琴、梓和黑猫的下午茶纪念卡' }
    };
    const sans = '"Microsoft YaHei", "Yu Gothic", Arial, sans-serif';
    let format = 'card', character = 'konata', cover = 'club', revision = 0, closed = false, renderController = null, currentBlob = null;
    const pictures = new Map();
    function retire(record) {
      if (!record || record.retired) return;
      record.retired = true;
      // A browser download may still be reading this URL after the preview changes.
      if (record.downloaded) setTimeout(() => URL.revokeObjectURL(record.url), 30000);
      else URL.revokeObjectURL(record.url);
    }
    function loadPicture(src, signal) {
      if (pictures.has(src)) return Promise.resolve(pictures.get(src));
      return new Promise((resolve, reject) => {
        if (signal.aborted) { reject(new Error('cancelled')); return; }
        const picture = new Image();
        picture.decoding = 'async';
        let settled = false;
        const timer = setTimeout(() => fail(new Error('image timeout')), 12000);
        function cleanup() {
          clearTimeout(timer);
          picture.onload = picture.onerror = null;
          signal.removeEventListener('abort', abort);
        }
        function fail(error) {
          if (settled) return;
          settled = true;
          cleanup();
          picture.src = '';
          reject(error);
        }
        function abort() { fail(new Error('cancelled')); }
        picture.onload = () => {
          if (settled) return;
          if (!picture.naturalWidth || !picture.naturalHeight) { fail(new Error('empty image')); return; }
          settled = true;
          cleanup();
          pictures.set(src, picture);
          resolve(picture);
        };
        picture.onerror = () => fail(new Error('image failed'));
        signal.addEventListener('abort', abort, { once: true });
        picture.src = src;
      });
    }
    function fitPortrait(ctx, picture, box) {
      const scale = Math.min(box.width / picture.naturalWidth, box.height / picture.naturalHeight);
      const width = picture.naturalWidth * scale, height = picture.naturalHeight * scale;
      ctx.drawImage(picture, box.x + (box.width - width) / 2, box.y + box.height - height, width, height);
    }
    function drawCard(ctx, picture, selection) {
      ctx.fillStyle = '#faf7ef';
      ctx.fillRect(0, 0, 1600, 1160);
      const photo = { x: 60, y: 60, width: 1480, height: 832.5 };
      const scale = Math.max(photo.width / picture.naturalWidth, photo.height / picture.naturalHeight);
      const cropWidth = photo.width / scale, cropHeight = photo.height / scale;
      ctx.drawImage(picture, (picture.naturalWidth - cropWidth) / 2, (picture.naturalHeight - cropHeight) / 2, cropWidth, cropHeight, photo.x, photo.y, photo.width, photo.height);
      ctx.fillStyle = '#4b4e46';
      ctx.font = '38px "Noto Serif CJK SC", "Songti SC", SimSun, serif';
      ctx.fillText(covers[selection.cover].name, 70, 954);
      ctx.textAlign = 'right';
      ctx.font = '24px ' + sans;
      ctx.fillStyle = '#858476';
      ctx.fillText('8 / 8', 1530, 951);
      ctx.textAlign = 'left';
      ctx.strokeStyle = '#ddd7ca';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(70, 976);
      ctx.lineTo(1530, 976);
      ctx.stroke();
      const cialloAt = greeting.indexOf('Ciallo');
      ctx.fillStyle = '#56594f';
      ctx.font = '25px ' + sans;
      ctx.fillText(greeting.slice(0, cialloAt), 70, 1023, 1460);
      ctx.font = '34px ' + sans;
      ctx.fillText(greeting.slice(cialloAt), 70, 1070);
      ctx.fillStyle = '#858476';
      ctx.font = '20px ' + sans;
      ctx.fillText('留给 ' + selection.recipient, 70, 1120, 800);
      ctx.textAlign = 'right';
      ctx.fillText('无敌马的小窝 · 留念于 ' + date, 1530, 1120);
    }
    function drawWallpaper(ctx, picture, selection) {
      const portrait = portraits[selection.character];
      ctx.fillStyle = portrait.paper;
      ctx.fillRect(0, 0, 1080, 1920);
      // Keep the upper quarter quiet for the phone's clock and notifications.
      fitPortrait(ctx, picture, { x: 75, y: 480, width: 930, height: 1240 });
      ctx.fillStyle = portrait.ink;
      ctx.textAlign = 'center';
      ctx.font = '30px ' + sans;
      ctx.fillText('Ciallo～(∠・ω< )⌒★', 540, 1782);
      ctx.font = '22px ' + sans;
      ctx.fillText('留给 ' + selection.recipient, 540, 1830, 930);
      ctx.fillStyle = '#7e8584';
      ctx.font = '18px ' + sans;
      ctx.fillText('无敌马的小窝 · 8 / 8 · ' + date, 540, 1872, 930);
    }
    function drawBookmark(ctx, picture, selection) {
      const portrait = portraits[selection.character];
      ctx.fillStyle = portrait.paper;
      ctx.fillRect(0, 0, 600, 1600);
      ctx.fillStyle = portrait.ink;
      ctx.textAlign = 'center';
      ctx.font = '32px "Noto Serif CJK SC", "Songti SC", SimSun, serif';
      ctx.fillText('无敌马的小窝', 300, 96);
      ctx.font = '18px ' + sans;
      ctx.fillText('8 / 8', 300, 137);
      ctx.strokeStyle = '#cfd5ce';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(80, 172);
      ctx.lineTo(520, 172);
      ctx.stroke();
      fitPortrait(ctx, picture, { x: 45, y: 210, width: 510, height: 1140 });
      ctx.fillStyle = portrait.ink;
      ctx.font = '27px ' + sans;
      ctx.fillText('Ciallo～(∠・ω< )⌒★', 300, 1420, 510);
      ctx.font = '20px ' + sans;
      ctx.fillText('留给 ' + selection.recipient, 300, 1470, 510);
      ctx.fillStyle = '#7e8584';
      ctx.font = '17px ' + sans;
      ctx.fillText('留念于 ' + date, 300, 1520);
    }
    function updateChoices() {
      body.querySelectorAll('[data-keepsake-format]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.keepsakeFormat === format)));
      body.querySelectorAll('[data-keepsake-character]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.keepsakeCharacter === character)));
      body.querySelectorAll('[data-keepsake-cover]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.keepsakeCover === cover)));
      body.querySelector('[data-keepsake-covers]').hidden = format !== 'card';
      body.querySelector('[data-keepsake-characters]').hidden = format === 'card';
      frame.dataset.keepsakePreview = format;
      const details = formats[format];
      image.width = details.width;
      image.height = details.height;
      image.alt = format === 'card' ? covers[cover].alt : portraits[character].name + '的全收集' + details.name;
      caption.textContent = details.width + ' × ' + details.height + ' / ' + (format === 'card' ? covers[cover].name : portraits[character].name);
      save.textContent = details.save;
    }
    async function prepare() {
      const renderId = ++revision;
      renderController?.abort();
      const controller = new AbortController();
      renderController = controller;
      const selection = { format, character, cover, recipient };
      const details = formats[selection.format];
      let candidate = null;
      function current() {
        return !closed && !controller.signal.aborted && renderId === revision && dialog.open && found.size === ids.length;
      }
      retire(currentBlob);
      currentBlob = null;
      save.hidden = true;
      save.removeAttribute('href');
      image.hidden = true;
      image.removeAttribute('src');
      retry.hidden = true;
      retry.disabled = true;
      loading.hidden = false;
      loading.textContent = details.name + '准备中…';
      frame.setAttribute('aria-busy', 'true');
      status.textContent = '';
      updateChoices();
      try {
        const source = selection.format === 'card' ? covers[selection.cover].src : portraits[selection.character].src;
        const picture = await loadPicture(source, controller.signal);
        if (!current()) return;
        const canvas = document.createElement('canvas');
        canvas.width = details.width;
        canvas.height = details.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('canvas unavailable');
        if (selection.format === 'card') drawCard(ctx, picture, selection);
        else if (selection.format === 'wallpaper') drawWallpaper(ctx, picture, selection);
        else drawBookmark(ctx, picture, selection);
        const blob = await new Promise((resolve, reject) => canvas.toBlob(result => result ? resolve(result) : reject(new Error('PNG failed')), 'image/png'));
        if (!current()) return;
        candidate = { url: URL.createObjectURL(blob), downloaded: false, retired: false };
        // Decode separately so an obsolete render cannot change the visible preview.
        const decoded = new Image();
        decoded.src = candidate.url;
        await decoded.decode();
        if (!current()) { retire(candidate); return; }
        currentBlob = candidate;
        image.src = candidate.url;
        image.hidden = false;
        loading.hidden = true;
        save.href = candidate.url;
        save.download = '小站留念-' + details.name + (selection.format === 'card' ? '' : '-' + portraits[selection.character].name) + '-' + date.replaceAll('.', '') + '.png';
        save.hidden = false;
      } catch (_) {
        retire(candidate);
        if (!current()) return;
        currentBlob = null;
        loading.textContent = '这次没能准备好' + details.name + '。';
        status.textContent = '可以再试一次，也可以换一张。';
        retry.hidden = false;
      } finally {
        if (renderId === revision && !closed) {
          frame.setAttribute('aria-busy', 'false');
          retry.disabled = false;
        }
      }
    }
    body.querySelectorAll('[data-keepsake-format]').forEach(button => button.addEventListener('click', () => {
      if (format === button.dataset.keepsakeFormat) return;
      format = button.dataset.keepsakeFormat;
      void prepare();
    }));
    body.querySelectorAll('[data-keepsake-character]').forEach(button => button.addEventListener('click', () => {
      if (character === button.dataset.keepsakeCharacter) return;
      character = button.dataset.keepsakeCharacter;
      void prepare();
    }));
    body.querySelectorAll('[data-keepsake-cover]').forEach(button => button.addEventListener('click', () => {
      if (cover === button.dataset.keepsakeCover) return;
      cover = button.dataset.keepsakeCover;
      void prepare();
    }));
    body.querySelector('.adventure-keepsake-signature').addEventListener('submit', event => {
      event.preventDefault();
      if (!input.reportValidity()) return;
      const next = input.value.trim().slice(0, 20) || '来小站做客的你';
      input.value = input.value.trim().slice(0, 20);
      if (next === recipient) {
        status.textContent = '署名已经在图片上了。';
        return;
      }
      recipient = next;
      void prepare();
    });
    retry.addEventListener('click', () => { void prepare(); });
    save.addEventListener('click', event => {
      if (closed || found.size !== ids.length || !currentBlob || save.hidden) { event.preventDefault(); return; }
      currentBlob.downloaded = true;
    });
    body.querySelector('[data-back-book]').addEventListener('click', openBook);
    dialog.addEventListener('close', () => {
      closed = true;
      ++revision;
      renderController?.abort();
      retire(currentBlob);
      currentBlob = null;
      pictures.clear();
    }, { once: true });
    void prepare();
    dialog.querySelector('.adventure-close').focus({ preventScroll: true });
  }

  function renderMembership(body) {
    const saved = membership;
    body.querySelector('.adventure-sos-form').hidden = !!saved;
    body.querySelector('.adventure-sos-receipt').hidden = !saved;
    if (!saved) return;
    body.querySelector('[data-sos-name]').textContent = saved.name;
    body.querySelector('[data-sos-role]').textContent = roles[saved.role];
    body.querySelector('[data-sos-number]').textContent = 'No. ' + saved.number;
    body.querySelector('[data-sos-date]').textContent = saved.date;
  }
  function openAnime() {
    const dialog = panel('anime', 'SOS 团 · 临时部室', '今天也没正经开会。');
    const body = dialog.querySelector('.adventure-panel-body');
    if (membershipSaved) membership = readSOS(membership);
    body.innerHTML = "<figure class=\"adventure-sos-photo\"><div class=\"adventure-room-photo\"><img src=\"/img/easter-eggs/classic-club-afternoon.webp\" alt=\"长门在左边读书，美琴、梓和黑猫围桌喝茶；桌上有电脑和点心，后面靠着吉他\" width=\"1536\" height=\"864\" decoding=\"async\"><div class=\"adventure-room-objects\" role=\"group\" aria-label=\"部室里的小物件\"></div></div><figcaption>桌上的东西可以点。点心记得分着吃。</figcaption></figure><section class=\"adventure-club-notes\" aria-labelledby=\"adventure-club-notes-title\"><h3 id=\"adventure-club-notes-title\" class=\"adventure-sr-only\">部室闲聊</h3><div class=\"adventure-character-list\" role=\"group\" aria-label=\"和谁聊两句\"></div><div class=\"adventure-konata\"><span class=\"adventure-note-portrait adventure-character-portrait\" aria-hidden=\"true\"></span><div class=\"adventure-note-copy\"><div class=\"adventure-konata-speaker\"><strong data-character-speaker></strong><small data-character-work></small></div><p class=\"adventure-konata-line\" aria-live=\"polite\"></p><div class=\"adventure-room-response\"><button type=\"button\" class=\"adventure-secondary\" data-room-action hidden></button><span data-room-detail></span><button type=\"button\" class=\"adventure-anime-next\">聊点别的</button></div></div><img class=\"adventure-room-guest\" data-room-guest src=\"/img/easter-eggs/konata-room-cutout.webp\" alt=\"此方在部室玩掌机\" width=\"667\" height=\"1000\" decoding=\"async\"></div></section><nav class=\"adventure-room-links\" aria-label=\"从部室出发\"><button type=\"button\" class=\"adventure-secondary\" data-back-book>翻开彩蛋簿</button><a href=\"/play/arcade/\">去摸鱼角 →</a></nav><details class=\"adventure-registration\"><summary>入团登记 / 团员证</summary><form class=\"adventure-sos-form\"><h3>入团登记</h3><p class=\"adventure-sos-note\">宇宙人、未来人、异世界人，以及今晚还没写 WP 的人。</p><div class=\"adventure-sos-fields\"><label for=\"adventure-sos-name\">怎么称呼你<input id=\"adventure-sos-name\" name=\"name\" maxlength=\"20\" required placeholder=\"路过的阿宅\" autocomplete=\"nickname\"></label><label for=\"adventure-sos-role\">部室分工<select id=\"adventure-sos-role\" name=\"role\"><option value=\"debug\">找 bug 的</option><option value=\"writeup\">写 WP 的</option><option value=\"game\">负责摸鱼的</option><option value=\"observe\">观测世界线的</option></select></label></div><button type=\"submit\" class=\"adventure-secondary adventure-sos-submit\" data-sos-join>交给团长</button><span class=\"adventure-sos-local\">登记只保存在你的浏览器里。</span></form><section class=\"adventure-sos-receipt\" hidden aria-live=\"polite\"><div class=\"adventure-sos-receipt-head\"><h3>临时团员证</h3><span data-sos-number></span></div><p><strong data-sos-name></strong><span> / </span><span data-sos-role></span></p><p class=\"adventure-sos-approval\">批准。下次开会记得带点零食。</p><div class=\"adventure-sos-receipt-foot\"><time data-sos-date></time><button type=\"button\" class=\"adventure-sos-edit\">重新填表</button></div></section></details>";
    const characters = body.querySelector('.adventure-character-list');
    const notePortrait = body.querySelector('.adventure-note-portrait');
    const line = body.querySelector('.adventure-konata-line');
    const action = body.querySelector('[data-room-action]');
    const detail = body.querySelector('[data-room-detail]');
    const noteIndexes = clubCharacters.map(() => 0);
    const treatsGiven = clubCharacters.map(() => 0);
    let selectedCharacter = 1, scene = 'notes', biscuits = 3, pages = 0, cups = 0, riffs = 0, audio = null, audioBusy = false, audioTimer;
    const objects = [
      { id: 'book', name: '书', label: '翻翻长门的书', x: '20%', y: '54%' },
      { id: 'tea', name: '茶', label: '看看黑猫的茶杯', x: '84%', y: '40%' },
      { id: 'computer', name: '电脑', label: '看看桌上的电脑', x: '52%', y: '50%' },
      { id: 'guitar', name: '吉他', label: '看看梓的吉他', x: '75%', y: '36%' },
      { id: 'snack', name: '点心', label: '分一分桌上的点心', x: '49%', y: '65%' }
    ];
    const treatReplies = {
      haruhi: ['我那块要大一点。团长负责分配嘛。', '剩下的先留着，待会儿还有人来。'],
      konata: ['谢啦。这样就不用放下手柄了。', '三块的话，是不是一人一块、我两块？'],
      kurisu: ['谢了。我没说要配 Dr Pepper。', '先别给我了，去看看其他人有没有拿到。'],
      yuki: ['谢谢。', '这页看完再吃。'],
      mikoto: ['给我？那我就不客气了。', '剩下那块留给还没吃的人吧。'],
      azusa: ['吃完这一块就练习。说好了哦。', '又吃一块的话，练习要拖到什么时候啊。'],
      kuroneko: ['既然是你的心意，我就收下了。', '再吃一块……只是因为茶还没喝完。'],
      yui: ['好吃！你也吃一块吧。', '再来一块，就能好好练习了。']
    };
    function setAction() {
      action.hidden = scene === 'notes';
      action.disabled = scene === 'guitar' && audioBusy;
      const titles = { book: '再翻一页', tea: '再倒一杯', computer: '打开终端', guitar: '听两下 ♪', snack: biscuits ? '递给' + clubCharacters[selectedCharacter].name + '一块' : '再添一盘' };
      action.textContent = titles[scene] || '';
      action.setAttribute('aria-label', scene === 'guitar' ? '弹几下吉他，会播放声音' : action.textContent);
      detail.textContent = scene === 'snack' ? '盘里还剩 ' + biscuits + ' 块' : '';
      body.querySelectorAll('[data-room-object]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.roomObject === scene)));
    }
    function showCharacter(index, nextScene = 'notes', text) {
      selectedCharacter = index;
      scene = nextScene;
      const character = clubCharacters[index];
      characters.querySelectorAll('[data-character]').forEach(button => {
        const selected = button.dataset.character === character.id;
        button.setAttribute('aria-pressed', String(selected));
        button.classList.toggle('is-selected', selected);
      });
      notePortrait.style.setProperty('--portrait-x', character.x);
      notePortrait.style.setProperty('--portrait-y', character.y);
      body.querySelector('[data-character-speaker]').textContent = character.name;
      body.querySelector('[data-character-work]').textContent = character.work;
      const guest = body.querySelector('[data-room-guest]');
      const art = { konata: '/img/easter-eggs/konata-room-cutout.webp', yui: '/img/easter-eggs/yui-room-cutout.webp' };
      guest.hidden = !art[character.id];
      if (art[character.id]) { guest.src = art[character.id]; guest.alt = character.name + '的部室立绘'; }
      line.textContent = text === undefined ? character.notes[noteIndexes[index]] : text;
      setAction();
    }
    clubCharacters.forEach((character, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'adventure-character';
      button.dataset.character = character.id;
      button.setAttribute('aria-pressed', 'false');
      button.setAttribute('aria-label', '和' + character.name + '聊两句');
      button.innerHTML = '<span class="adventure-character-portrait" aria-hidden="true"></span><span class="adventure-character-name"></span>';
      button.querySelector('.adventure-character-portrait').style.setProperty('--portrait-x', character.x);
      button.querySelector('.adventure-character-portrait').style.setProperty('--portrait-y', character.y);
      if (character.portrait) {
        const portrait = button.querySelector('.adventure-character-portrait');
        portrait.style.backgroundImage = 'url("' + character.portrait + '")';
        portrait.style.backgroundSize = 'cover';
        portrait.style.backgroundPosition = 'center';
      }
      button.querySelector('.adventure-character-name').textContent = character.name;
      button.addEventListener('click', () => showCharacter(index, scene === 'snack' ? 'snack' : 'notes'));
      button.addEventListener('keydown', event => {
        const narrow = window.matchMedia('(max-width: 500px)').matches;
        const offsets = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: narrow ? -4 : -1, ArrowDown: narrow ? 4 : 1 };
        if (!Object.hasOwn(offsets, event.key) && event.key !== 'Home' && event.key !== 'End') return;
        event.preventDefault();
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? clubCharacters.length - 1 : (index + offsets[event.key] + clubCharacters.length) % clubCharacters.length;
        showCharacter(next, scene === 'snack' ? 'snack' : 'notes');
        characters.children[next].focus({ preventScroll: true });
      });
      characters.append(button);
    });
    objects.forEach(object => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'adventure-room-object';
      button.dataset.roomObject = object.id;
      button.style.setProperty('--object-x', object.x);
      button.style.setProperty('--object-y', object.y);
      button.setAttribute('aria-label', object.label);
      button.setAttribute('aria-pressed', 'false');
      const label = document.createElement('span');
      label.textContent = object.name;
      button.append(label);
      button.addEventListener('click', () => {
        if (object.id === 'book') showCharacter(3, 'book', '这本还没看完。书签别拿走。');
        if (object.id === 'tea') showCharacter(6, 'tea', '茶刚泡好。端的时候当心一点。');
        if (object.id === 'computer') showCharacter(2, 'computer', '电脑可以用。隐藏的文件，用普通列表是看不到的。');
        if (object.id === 'guitar') showCharacter(5, 'guitar', '那个不是摆设。今天还没练呢。');
        if (object.id === 'snack') showCharacter(selectedCharacter, 'snack', biscuits ? '点心在桌上。你想先留给谁？' : '……盘子已经空了。');
      });
      body.querySelector('.adventure-room-objects').append(button);
    });
    async function strum() {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return false;
      try {
        if (!audio) audio = new Audio();
        if (audio.state === 'suspended') {
          let timer;
          try { await Promise.race([audio.resume(), new Promise(resolve => { timer = setTimeout(resolve, 400); })]); }
          finally { clearTimeout(timer); }
        }
        if (!dialog.open || scene !== 'guitar' || audio.state !== 'running') return false;
        const frequencies = [329.63, 392, 440, riffs % 2 ? 392 : 523.25];
        frequencies.forEach((frequency, index) => {
          const start = audio.currentTime + index * .14;
          const oscillator = audio.createOscillator(), gain = audio.createGain();
          oscillator.type = 'triangle';
          oscillator.frequency.value = frequency;
          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(.045, start + .007);
          gain.gain.exponentialRampToValueAtTime(.001, start + .2);
          oscillator.connect(gain);
          gain.connect(audio.destination);
          oscillator.start(start);
          oscillator.stop(start + .21);
          oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
        });
        return true;
      } catch (_) { return false; }
    }
    action.addEventListener('click', async () => {
      if (scene === 'computer') { openTerminal(); return; }
      if (scene === 'book') {
        const lines = ['书签后夹着一张借书卡。看完记得还。', '这一页写着：ls -a。边上的字很小。', '再往后翻，是两页空白。长门把书拿回去了。'];
        showCharacter(3, 'book', lines[pages++ % lines.length]);
      } else if (scene === 'tea') {
        const lines = ['杯子满了。先喝这一杯吧。', '又添了一点茶。今天的茶会看来是结束不了了。', '茶壶空了。这次轮到你去接水。'];
        showCharacter(6, 'tea', lines[cups++ % lines.length]);
      } else if (scene === 'guitar') {
        if (audioBusy) return;
        audioBusy = true;
        setAction();
        clearTimeout(audioTimer);
        const played = await strum();
        if (!dialog.open) { audioBusy = false; return; }
        if (played) audioTimer = setTimeout(() => { audioBusy = false; if (dialog.open) setAction(); }, 900);
        riffs++;
        if (dialog.open && scene === 'guitar') showCharacter(5, 'guitar', played ? (riffs % 2 ? '嗯，这次调对了。\n……既然拿起来了，就多练一会儿吧。' : '美琴跟着敲了两下桌子。\n今天总算有点社团活动的样子了。') : '今天先轻轻练指法。声音没开也没关系。');
        if (!played) { clearTimeout(audioTimer); audioBusy = false; if (dialog.open) setAction(); }
      } else if (scene === 'snack') {
        if (!biscuits) {
          biscuits = 3;
          treatsGiven.fill(0);
          showCharacter(selectedCharacter, 'snack', '又添了三块。这次慢点分。');
          return;
        }
        biscuits--;
        const character = clubCharacters[selectedCharacter];
        const count = treatsGiven[selectedCharacter]++;
        const replies = treatReplies[character.id];
        const response = character.id === 'yui' && count >= 2 ? '……糟了，忘了给梓留一块。' : replies[Math.min(count, replies.length - 1)];
        showCharacter(selectedCharacter, 'snack', response);
      }
    });
    dialog.addEventListener('close', () => { clearTimeout(audioTimer); audioBusy = false; if (audio && audio.state !== 'closed') void audio.close().catch(() => {}); }, { once: true });
    body.querySelector('.adventure-anime-next').addEventListener('click', () => {
      noteIndexes[selectedCharacter] = (noteIndexes[selectedCharacter] + 1) % clubCharacters[selectedCharacter].notes.length;
      showCharacter(selectedCharacter);
    });
    body.querySelector('[data-back-book]').addEventListener('click', openBook);
    showCharacter(selectedCharacter);
    const form = body.querySelector('.adventure-sos-form');
    const name = body.querySelector('#adventure-sos-name');
    const role = body.querySelector('#adventure-sos-role');
    form.addEventListener('submit', event => {
      event.preventDefault();
      const nickname = name.value.trim().slice(0, 20);
      if (!nickname) { name.setCustomValidity('留个称呼再交给团长。'); name.reportValidity(); return; }
      const now = new Date();
      membership = { name: nickname, role: Object.hasOwn(roles, role.value) ? role.value : 'game', number: String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0'), date: now.getFullYear() + '.' + String(now.getMonth() + 1).padStart(2, '0') + '.' + String(now.getDate()).padStart(2, '0') };
      let saved = true;
      try { localStorage.setItem(SOS_KEY, JSON.stringify(membership)); } catch (_) { saved = false; }
      membershipSaved = saved;
      renderMembership(body);
      notice(saved ? '登记好了。团长现在大概在找下一个活动。' : '团员证已生成；这次浏览器没能保存，关掉页面后会丢失。');
      body.querySelector('.adventure-sos-edit').focus({ preventScroll: true });
    });
    name.addEventListener('input', () => name.setCustomValidity(''));
    body.querySelector('.adventure-sos-edit').addEventListener('click', () => {
      name.value = membership?.name || '';
      role.value = membership?.role || 'game';
      form.hidden = false;
      body.querySelector('.adventure-sos-receipt').hidden = true;
      name.focus({ preventScroll: true });
    });
    renderMembership(body);
    body.querySelector('.adventure-registration').open = !!membership;
    dialog.querySelector('.adventure-close').focus({ preventScroll: true });
  }
  function openTerminal() {
    const dialog = panel('terminal', '未来道具研究所 / 访客终端', '输入 help。D-mail 留给下次打开这里的自己，只存在这个浏览器里。');
    const body = dialog.querySelector('.adventure-panel-body');
    if (labSaved) lab = readLab(lab);
    body.innerHTML = '<figure class="adventure-lab-scene"><img src="/img/easter-eggs/lab-night.webp" alt="夜晚的未来道具研究所，红莉栖在旧电脑与辉光管前工作" width="1536" height="768" decoding="async"><figcaption><span>世界线观测值</span><output data-worldline></output></figcaption></figure><div class="adventure-terminal"><div class="adventure-terminal-bar"><span>LAB / visitor@future-gadget</span><span>接続中</span></div><div class="adventure-terminal-output" role="log" aria-live="polite" aria-label="终端消息" tabindex="0"></div><form class="adventure-terminal-form"><label for="adventure-command" aria-label="终端命令">lab <span aria-hidden="true">&gt;</span></label><input id="adventure-command" type="text" placeholder="help" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="120"><button type="submit">执行</button></form></div><div class="adventure-terminal-shortcuts"><button type="button" data-command="help">help</button><button type="button" data-command="ls">ls</button><button type="button" data-command="observe">观测世界线</button><button type="button" data-command="inbox">D-mail 信箱</button></div>';
    const output = body.querySelector('.adventure-terminal-output');
    const input = body.querySelector('#adventure-command');
    const display = body.querySelector('[data-worldline]');
    display.textContent = lab.worldline;
    const history = [];
    let cursor = 0;
    function line(text, type = '') {
      const p = document.createElement('p');
      if (type) p.className = type;
      p.textContent = text;
      output.append(p);
      while (output.childElementCount > 60) output.firstElementChild.remove();
      output.scrollTop = output.scrollHeight;
    }
    function run(raw) {
      const command = raw.trim().replace(/\s+/g, ' ');
      if (!command) return;
      history.push(command);
      if (history.length > 30) history.shift();
      cursor = history.length;
      line('lab > ' + command, 'adventure-terminal-prompt');
      const commands = {
        help: 'ls / ls -a       列出研究所文件\ncat 文件名       查看文件\nworldline        查看当前世界线\nobserve          再观测一次\ndmail 内容       留一条 D-mail（最多100字）\ninbox / erase    查看 / 清掉这条 D-mail\nwhoami / coffee  访客信息 / 补给\nclear            清屏',
        ls: 'welcome.txt    hint.txt    lab.txt',
        'ls -a': '.    ..    .secret    welcome.txt    hint.txt    lab.txt',
        'cat welcome.txt': '未来道具研究所，临时开放。\n桌上的电脑可以用，微波炉暂时别碰。',
        'cat hint.txt': '以点开头的文件不会出现在普通列表里。\nls -a，然后 cat。',
        'cat lab.txt': '观测值只是部室里的小道具。\nD-mail 不会改变过去，但能提醒未来的你少熬点夜。',
        coffee: '补给柜里只剩一瓶 Dr Pepper。\n红色瓶盖那瓶，别拿错了。',
        nya: '这台电脑没有猫耳模式。\n柜子上倒是有一本漫画。',
        isekai: '研究所暂时不负责异世界转生。\n如果电脑又死机了，先试试重启。',
        whoami: '研究所临时访客 / 已找到 ' + found.size + '/8 个彩蛋。',
        paimon: '实验记录：冰箱里的零食减少了。\n可疑的漂浮物正在门口装无辜。'
      };
      if (command === 'clear') { output.replaceChildren(); return; }
      if (command === 'cat .secret') {
        line('flag{curiosity_opens_hidden_doors}\n隐藏记录已读取。El Psy Congroo.', 'adventure-terminal-win');
        discover('terminal');
      } else if (command === 'worldline') line('当前观测值：' + lab.worldline);
      else if (command === 'observe') {
        lab.worldline = worldlines[(worldlines.indexOf(lab.worldline) + 1) % worldlines.length];
        display.textContent = lab.worldline;
        const saved = saveLab();
        line('重新观测：' + lab.worldline + (saved ? '\n桌上的茶还是凉的。' : '\n浏览器未能保存；本次观测暂存在这一页。'));
      } else if (command.startsWith('dmail ')) {
        lab.mail = command.slice(6).trim().slice(0, 100);
        const saved = saveLab();
        line((saved ? 'D-mail 已放进本地信箱：\n' : '浏览器未能保存；D-mail 暂存在这一页：\n') + lab.mail);
      } else if (command === 'dmail') line('用法：dmail 明天记得补完那篇 WP');
      else if (command === 'inbox') line(lab.mail ? '收到一条 D-mail：\n' + lab.mail : '信箱是空的。试试 dmail 后面加一句话。');
      else if (command === 'erase') { lab.mail = ''; const saved = saveLab(); line(saved ? 'D-mail 已清掉。' : '这一页的 D-mail 已清掉；浏览器未能更新保存记录。'); }
      else if (Object.hasOwn(commands, command)) line(commands[command]);
      else if (command.startsWith('cat ')) line('没有这个文件。试试 ls，或者 cat hint.txt。');
      else line('未识别的命令。输入 help 查看。');
    }
    line('Future Gadget Laboratory\n世界线 ' + lab.worldline + ' / 访客连接已建立。');
    body.querySelector('form').addEventListener('submit', event => { event.preventDefault(); run(input.value); input.value = ''; input.focus(); });
    body.querySelectorAll('[data-command]').forEach(button => button.addEventListener('click', () => { run(button.dataset.command); input.focus(); }));
    input.addEventListener('keydown', event => {
      if (!['ArrowUp', 'ArrowDown'].includes(event.key)) return;
      event.preventDefault();
      cursor = Math.max(0, Math.min(history.length, cursor + (event.key === 'ArrowUp' ? -1 : 1)));
      input.value = history[cursor] || '';
    });
    input.focus({ preventScroll: true });
  }
  function openWish() {
    const dialog = panel('wish', '部室抽签', '有些是社团杂物，有些是提瓦特带回来的东西。随便抽一张。');
    const body = dialog.querySelector('.adventure-panel-body');
    body.innerHTML = '<section class="adventure-wish-sky"><img class="adventure-wish-picture" src="/img/easter-eggs/sos-clubroom.webp" alt="午后的动漫部室" width="1536" height="768" decoding="async"><div class="adventure-wish-result" role="status" aria-live="polite"><span class="adventure-wish-rarity">· · ·</span><h3>箱子里还有几张纸条</h3><p>团长说这是今天的活动。至少不用出门。</p></div><button class="adventure-wish-button" type="button" data-wish>抽一张</button></section><p class="adventure-wish-note">免费，随时可抽。八个彩蛋全找到后，第一次会抽到限定金色纸条。</p>';
    const pool = [
      { title: '此方的游戏存档', stars: 3, text: '「就玩五分钟」的存档。修改时间：凌晨两点。' },
      { title: '派蒙留下的零食袋', stars: 3, text: '袋子里是空的。上面有一张便签：应急食品已经吃完应急食品了。' },
      { title: '未完成的暑假作业', stars: 3, text: '第一页很工整，后面全是空白。经典的开学前一晚装备。' },
      { title: '长门的借书卡', stars: 4, text: '借书记录很长。最后一本的书签，夹在「缓冲区溢出」那页。' },
      { title: '提瓦特传送锚点', stars: 4, text: '今天的委托：找篇想看的文章。走近一点，别再绕山了。' },
      { title: '研究所的瓶盖', stars: 4, text: '瓶盖下面写着：微波炉已经修好。旁边又补了一句：大概。' },
      { title: 'SOS 团的放假通知', stars: 5, text: '今日活动取消，全员自由行动。连团长也没意见的一次。' }
    ];
    const result = body.querySelector('.adventure-wish-result');
    const sky = body.querySelector('.adventure-wish-sky');
    const button = body.querySelector('[data-wish]');
    let previous = -1, draws = 0, timer;
    button.addEventListener('click', () => {
      if (button.disabled) return;
      button.disabled = true;
      button.textContent = '翻一翻…';
      sky.classList.add('is-drawing');
      const reveal = () => {
        if (!dialog.isConnected || !dialog.open) return;
        let item;
        if (found.size === ids.length && draws === 0) item = { title: '小窝常驻席位', stars: 5, text: '全收集限定。部室靠窗的位子给你留着，电脑、茶和没写完的 WP 都在。' };
        else {
          const roll = Math.random();
          const candidates = pool.map((candidate, index) => ({ candidate, index })).filter(({ candidate }) => candidate.stars === (roll < .08 ? 5 : roll < .42 ? 4 : 3));
          let chosen = candidates[Math.floor(Math.random() * candidates.length)];
          if (chosen.index === previous && candidates.length > 1) chosen = candidates[(candidates.indexOf(chosen) + 1) % candidates.length];
          previous = chosen.index;
          item = chosen.candidate;
        }
        draws++;
        result.querySelector('.adventure-wish-rarity').textContent = '★'.repeat(item.stars);
        result.querySelector('h3').textContent = item.title;
        result.querySelector('p').textContent = item.text;
        result.classList.toggle('is-gold', item.stars === 5);
        sky.classList.remove('is-drawing');
        button.disabled = false;
        button.textContent = '再抽一张';
      };
      timer = setTimeout(reveal, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 450);
    });
    dialog.addEventListener('close', () => clearTimeout(timer), { once: true });
    button.focus({ preventScroll: true });
  }
  window.BlogAdventure = { discover, openBook, openAnime, openTerminal, openWish, openKeepsake, progress: () => ids.filter(id => found.has(id)) };
  launcher.addEventListener('click', openBook);
  document.querySelectorAll('[data-sos-room]').forEach(button => button.addEventListener('click', openAnime));
  document.querySelectorAll('[data-open-book]').forEach(button => button.addEventListener('click', openBook));
  const footer = document.querySelector('#footer-wrap') || document.querySelector('#footer');
  if (footer) {
    const corners = document.createElement('div');
    corners.className = 'adventure-footer-corners';
    const separator = document.createElement('span');
    separator.className = 'adventure-footer-separator';
    separator.textContent = '·';
    separator.setAttribute('aria-hidden', 'true');
    const room = document.createElement('button');
    room.type = 'button';
    room.className = 'adventure-footer-room';
    room.textContent = '今天也没正经开会';
    room.addEventListener('click', openAnime);
    corners.append(launcher, separator, room);
    footer.append(corners);
  }
  window.addEventListener('storage', event => {
    if (event.key === KEY || event.key === null) { found = read(); sync(); }
    if (event.key === SOS_KEY || event.key === null) {
      membershipSaved = true;
      membership = readSOS(membership);
      if (activeDialog?.dataset.panel === 'anime') renderMembership(activeDialog.querySelector('.adventure-panel-body'));
    }
    if (event.key === LAB_KEY || event.key === null) {
      labSaved = true;
      lab = readLab(lab);
      const display = activeDialog?.querySelector('[data-worldline]');
      if (display) display.textContent = lab.worldline;
    }
  });
  try {
    const ctf = JSON.parse(localStorage.getItem('blog-ctf-v1') || '{}');
    if (Array.isArray(ctf?.solved) && ['signal', 'source', 'stack'].every(id => ctf.solved.includes(id))) discover('graduate', { quiet: true });
  } catch (_) {}
  sync();
})();