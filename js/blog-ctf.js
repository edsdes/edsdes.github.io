/* Tiny client-side CTF models. Progress is local to this browser. */
(() => {
  'use strict';
  const root = document.querySelector('.ctf-playground');
  if (!root || window.__blogCtfInstalled) return;
  window.__blogCtfInstalled = true;
  const KEY = 'blog-ctf-v1';
  const ids = ['signal', 'source', 'stack'];
  const flags = {
    signal: 'flag{hello_from_the_other_side}',
    source: 'flag{curiosity_is_a_superpower}',
    stack: 'flag{one_small_step_into_win}'
  };
  const explanations = {
    signal: '收信成功！Base64 只是编码，换回原来的表示方式就能读到消息。',
    source: '纸条找到了！HTML 注释会留在源码里，浏览器不会把它显示出来。',
    stack: '程序进入 win()！24 字节填充越过 buf 和 RBP，接上的地址覆盖了 RIP。'
  };
  let solved = new Set();
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || '{}');
    if (Array.isArray(data?.solved)) solved = new Set(data.solved.filter(id => ids.includes(id)));
  } catch (_) { /* The puzzles still work when storage is unavailable. */ }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify({ solved: ids.filter(id => solved.has(id)) })); }
    catch (_) {}
  }
  function sync() {
    root.querySelector('[data-ctf-count]').textContent = String(solved.size);
    ids.forEach(id => {
      const badge = root.querySelector('[data-badge="' + id + '"]');
      badge.classList.toggle('is-earned', solved.has(id));
      badge.setAttribute('aria-label', badge.textContent + (solved.has(id) ? '，已点亮' : '，未点亮'));
      root.querySelector('[data-challenge="' + id + '"]').classList.toggle('is-solved', solved.has(id));
    });
    root.querySelector('.ctf-completion').hidden = solved.size !== ids.length;
    root.querySelector('.ctf-replay').hidden = solved.size !== ids.length;
    if (solved.size === ids.length) window.BlogAdventure?.discover('graduate');
  }
  function feedback(id, message, success) {
    const target = root.querySelector('[data-feedback="' + id + '"]');
    target.textContent = message;
    target.classList.toggle('is-success', success);
    target.classList.toggle('is-error', !success);
  }
  function celebrate() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const party = document.createElement('div');
    party.className = 'ctf-confetti';
    party.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 14; i++) {
      const star = document.createElement('span');
      star.textContent = i % 2 ? '✦' : '·';
      star.style.setProperty('--x', (8 + Math.random() * 84) + '%');
      star.style.setProperty('--delay', (Math.random() * .3) + 's');
      party.append(star);
    }
    root.append(party);
    setTimeout(() => party.remove(), 1700);
  }
  function earn(id) {
    const fresh = !solved.has(id);
    solved.add(id);
    save();
    sync();
    feedback(id, explanations[id] + (id === 'stack' ? ' ' + flags.stack : ''), true);
    if (fresh) celebrate();
  }
  root.querySelectorAll('[data-flag-form]').forEach(form => {
    form.addEventListener('submit', event => {
      event.preventDefault();
      const id = form.dataset.flagForm;
      const input = form.querySelector('input');
      const answer = input.value.trim();
      if (answer === flags[id]) earn(id);
      else feedback(id, answer.startsWith('flag{') ? '差一点点，检查大小写和花括号里的内容，再试试。' : '答案长得像 flag{...}，可以先看看提示。', false);
    });
  });
  const decode = root.querySelector('[data-decode]');
  decode.addEventListener('click', () => {
    const result = root.querySelector('[data-decoded]');
    result.hidden = false;
    result.textContent = '解码结果：' + atob('ZmxhZ3toZWxsb19mcm9tX3RoZV9vdGhlcl9zaWRlfQ==');
    decode.disabled = true;
    decode.textContent = '已收到原文';
  });
  const sourceToggle = root.querySelector('.ctf-source-toggle');
  const sourcePreview = root.querySelector('.ctf-source-preview');
  sourcePreview.querySelector('code').textContent = root.querySelector('[data-lobby]').outerHTML.replace(/></g, '>\n<');
  sourceToggle.addEventListener('click', () => {
    sourcePreview.hidden = !sourcePreview.hidden;
    sourceToggle.setAttribute('aria-expanded', String(!sourcePreview.hidden));
    sourceToggle.textContent = sourcePreview.hidden ? '翻开这段页面源码' : '合上源码小纸条';
  });
  const padding = root.querySelector('#ctf-padding');
  const targets = {
    main: [0x80, 0x10, 0x40, 0, 0, 0, 0, 0],
    win: [0xd6, 0x11, 0x40, 0, 0, 0, 0, 0],
    lost: [0xef, 0xbe, 0xad, 0xde, 0, 0, 0, 0]
  };
  const cells = [];
  ['buffer', 'rbp', 'rip'].forEach((region, regionIndex) => {
    const box = root.querySelector('[data-stack-region="' + region + '"]');
    const size = regionIndex === 0 ? 16 : 8;
    for (let i = 0; i < size; i++) {
      const cell = document.createElement('span');
      cell.className = 'ctf-byte';
      box.append(cell);
      cells.push(cell);
    }
  });
  function model() {
    const raw = padding.value.trim();
    const count = Number(raw);
    const valid = raw !== '' && Number.isInteger(count) && count >= 0 && count <= 40;
    const fill = valid ? count : 0;
    const choice = root.querySelector('input[name="ctf-target"]:checked')?.value || 'main';
    const memory = Array(48).fill(0);
    memory.splice(24, 8, ...targets.main);
    for (let i = 0; i < fill; i++) memory[i] = 0x41;
    targets[choice].forEach((byte, i) => { memory[fill + i] = byte; });
    const rip = memory.slice(24, 32);
    const hex = '0x' + [...rip].reverse().map(byte => byte.toString(16).padStart(2, '0')).join('').replace(/^0+(?=[0-9a-f])/, '');
    return { valid, fill, choice, memory, rip, hex };
  }
  function renderStack() {
    const state = model();
    cells.forEach((cell, index) => {
      cell.textContent = state.memory[index].toString(16).padStart(2, '0');
      cell.classList.toggle('is-padding', state.valid && index < state.fill);
      cell.classList.toggle('is-address', state.valid && index >= state.fill && index < state.fill + 8);
      cell.title = '偏移 ' + index + ' · 0x' + cell.textContent;
    });
    root.querySelector('[data-rip]').textContent = state.valid ? state.hex : '等待有效输入';
    root.querySelector('[data-payload-size]').textContent = state.valid ? ' · payload 共 ' + (state.fill + 8) + ' 字节' : '';
  }
  padding.addEventListener('input', renderStack);
  root.querySelectorAll('input[name="ctf-target"]').forEach(radio => radio.addEventListener('change', renderStack));
  root.querySelector('.ctf-stack-run').addEventListener('click', () => {
    const state = model();
    if (!state.valid) { feedback('stack', '先填一个 0 到 40 的整数，再运行试试。', false); return; }
    if (state.rip.every((byte, index) => byte === targets.win[index])) { earn('stack'); return; }
    if (state.fill < 24 && state.rip.every((byte, index) => byte === targets.main[index])) {
      feedback('stack', '程序还是回到了 main()。地址还没碰到 RIP，看看 buf 后面还有几格。', false);
    } else if (state.fill === 24) {
      feedback('stack', '位置对齐了！不过这个地址没有走进 win()，换一个目标试试。', false);
    } else {
      feedback('stack', '程序迷路了：RIP = ' + state.hex + '。让地址刚好从偏移 24 开始，不能早也不能晚。', false);
    }
  });
  root.querySelector('.ctf-replay').addEventListener('click', () => {
    solved.clear();
    save();
    root.querySelectorAll('[data-feedback]').forEach(target => { target.textContent = ''; target.classList.remove('is-success', 'is-error'); });
    root.querySelectorAll('[data-flag-form] input').forEach(input => { input.value = ''; });
    root.querySelectorAll('details').forEach(details => { details.open = false; });
    root.querySelector('[data-decoded]').hidden = true;
    decode.disabled = false;
    decode.textContent = '试试 Base64 解码';
    sourcePreview.hidden = true;
    sourceToggle.setAttribute('aria-expanded', 'false');
    sourceToggle.textContent = '翻开这段页面源码';
    padding.value = '16';
    root.querySelector('input[name="ctf-target"][value="main"]').checked = true;
    renderStack();
    sync();
    root.querySelector('#ctf-signal-answer').focus({ preventScroll: true });
    root.querySelector('.ctf-hero').scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  });
  window.addEventListener('storage', event => {
    if (event.key !== KEY && event.key !== null) return;
    try {
      const data = JSON.parse(event.newValue || '{}');
      solved = new Set(Array.isArray(data?.solved) ? data.solved.filter(id => ids.includes(id)) : []);
      sync();
    } catch (_) {}
  });
  sync();
  renderStack();
})();