/* Client-side teaching models. Records stay in this browser. */
(() => {
  'use strict';
  const root = document.querySelector('.ctf-playground');
  if (!root || window.__blogCtfInstalled) return;
  window.__blogCtfInstalled = true;
  const KEY = 'blog-ctf-v1';
  const SIGNAL = 'c3ludHt1cnl5Yl9zZWJ6X2d1cl9iZ3VyZV9mdnFyfQ==';
  const ids = ['signal', 'source', 'stack'];
  const flags = {
    signal: 'flag{hello_from_the_other_side}',
    source: 'flag{curiosity_is_a_superpower}',
    stack: 'flag{one_small_step_into_win}'
  };
  const explanations = {
    signal: '收信成功。先用 Base64 还原外层，再用 ROT13 还原字母，才是完整的 flag。',
    source: '纸条拼好了。HTML 注释不会显示在页面上；按 01、02、03 的编号连接内容，就能得到完整 flag。',
    stack: '模型进入 win()！24 字节填充后，接 8 字节 ret() 地址和 8 字节 win() 地址，共 40 字节。额外 ret 弹出 8 字节后，入口 RSP % 16 = 8。'
  };
  const hints = {
    signal: ['此方：外面看着像 Base64。先把收到的信解开看看。', '此方：synt 和 flag 长得有点像。字母可能又转了一圈，试试 ROT13。', '此方：先选 Base64 解码，把得到的文字复制回工作台，再选 ROT13。两个工具接着用，不是二选一。'],
    source: ['春日：页面上只有半句话？那就看看部室的源码。', '春日：注释里有三张纸条，都带着编号。先把它们圈出来。', '春日：按 01、02、03 排好，去掉编号和注释符号，把三段内容直接接起来。'],
    stack: ['红莉栖：buf 16 字节，RBP 8 字节。返回地址从偏移 24 开始，先把位置摆对。', '红莉栖：选 win()。地址正确还不够，这个模型要求入口 RSP % 16 = 8；直接返回进去是 0。', '红莉栖：填充保持 24，在 win() 前接一个 ret()。它再弹出 8 字节，入口余数就从 0 变成 8。']
  };
  const reactions = {
    signal: { win: '此方：两层都拆开了。下次记得先看看里面还有没有一层。', wrong: '此方：是不是还有一层没解？把工作台的结果再看一眼。' },
    source: { win: '春日：三张拼起来了。这个团员眼力还行！', wrong: '春日：按编号排纸条，别把编号也抄进答案里。' },
    stack: { win: '红莉栖：位置和对齐都对了。这次可以放你进 win()。', wrong: '红莉栖：先看 RIP 的值，再决定改填充还是改地址。' }
  };
  const hintSteps = { signal: 0, source: 0, stack: 0 };
  const $ = selector => root.querySelector(selector);
  let solved = new Set();
  let resetAt = 0;

  function parseRecord(raw) {
    if (raw === null) return { solved: [], resetAt: 0 };
    try {
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
      if (!Array.isArray(data.solved)) return null;
      return {
        solved: ids.filter(id => data.solved.includes(id)),
        resetAt: Number.isSafeInteger(data.resetAt) && data.resetAt >= 0 ? data.resetAt : 0
      };
    } catch (_) { return null; }
  }
  function readRecord() {
    try { return parseRecord(localStorage.getItem(KEY)); }
    catch (_) { return null; }
  }
  function mergeRecord(record) {
    if (!record) return;
    if (record.resetAt > resetAt) {
      resetAt = record.resetAt;
      solved = new Set(record.solved);
    } else if (record.resetAt === resetAt) {
      record.solved.forEach(id => solved.add(id));
    }
  }
  mergeRecord(readRecord());
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify({ solved: ids.filter(id => solved.has(id)), resetAt }));
      return true;
    } catch (_) { return false; }
  }
  function say(id, message) {
    const node = $('[data-mentor-message="' + id + '"]');
    if (node) node.textContent = message;
  }
  function feedback(id, message, success) {
    const target = $('[data-feedback="' + id + '"]');
    if (!target) return;
    target.textContent = message;
    target.classList.toggle('is-success', success);
    target.classList.toggle('is-error', !success);
  }
  function sync() {
    if ($('[data-ctf-count]')) $('[data-ctf-count]').textContent = String(solved.size);
    ids.forEach(id => {
      const badge = $('[data-badge="' + id + '"]');
      if (badge) {
        badge.classList.toggle('is-earned', solved.has(id));
        badge.setAttribute('aria-label', badge.textContent + (solved.has(id) ? '，已通过' : '，未通过'));
      }
      $('[data-challenge="' + id + '"]')?.classList.toggle('is-solved', solved.has(id));
    });
    if ($('.ctf-completion')) $('.ctf-completion').hidden = solved.size !== ids.length;
    if ($('.ctf-replay')) $('.ctf-replay').hidden = solved.size !== ids.length;
    if (solved.size === ids.length) window.BlogAdventure?.discover('graduate');
  }
  function earn(id) {
    if (!ids.includes(id)) return;
    mergeRecord(readRecord());
    solved.add(id);
    const saved = save();
    sync();
    feedback(id, explanations[id] + (id === 'stack' ? ' ' + flags.stack : '') + (saved ? '' : ' 本页已通过；浏览器不允许保存，刷新后可能需要再做一次。'), true);
    say(id, reactions[id].win);
  }
  root.querySelectorAll('[data-mentor-help]').forEach(button => {
    button.addEventListener('click', () => {
      const id = button.dataset.mentorHelp;
      if (!hints[id]) return;
      say(id, hints[id][hintSteps[id]]);
      hintSteps[id] = Math.min(hintSteps[id] + 1, hints[id].length - 1);
    });
  });
  root.querySelectorAll('[data-flag-form]').forEach(form => {
    form.addEventListener('submit', event => {
      event.preventDefault();
      const id = form.dataset.flagForm;
      if (!ids.includes(id)) return;
      const answer = form.querySelector('input').value.trim();
      if (answer === flags[id]) earn(id);
      else {
        feedback(id, answer.startsWith('flag{') ? '检查大小写和花括号里的内容，再试试。' : '把找到的 flag{...} 填在这里。', false);
        say(id, reactions[id].wrong);
      }
    });
  });

  const decode = $('[data-decode]');
  const wire = $('[data-signal-wire]');
  const codec = $('[data-signal-codec]');
  const decoded = $('[data-decoded]');
  function decodeBytes(bytes) {
    try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
    catch (_) { throw new Error('这些字节不是完整的 UTF-8 文本。检查有没有漏掉一段。'); }
  }
  function decodeSignal(input, mode) {
    if (!input.trim()) throw new Error('先放一段要解码的文字。');
    if (input.length > 3000) throw new Error('这张纸条最多放 3000 个字符，短一点再试。');
    if (mode === 'rot13') return input.replace(/[A-Za-z]/g, letter => {
      const start = letter <= 'Z' ? 65 : 97;
      return String.fromCharCode(start + (letter.charCodeAt(0) - start + 13) % 26);
    });
    const compact = input.replace(/\s/g, '');
    if (mode === 'hex') {
      if (!/^[0-9a-fA-F]+$/.test(compact)) throw new Error('Hex 只用 0–9、a–f；可以用空格分开字节。');
      if (compact.length % 2) throw new Error('Hex 每两个字符是一字节，现在少了半个字节。');
      return decodeBytes(Uint8Array.from(compact.match(/../g), pair => parseInt(pair, 16)));
    }
    if (mode !== 'base64') throw new Error('先选 Base64、Hex 或 ROT13。');
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(compact) || compact.length % 4 === 1 ||
      (compact.includes('=') && compact.length % 4 !== 0)) {
      throw new Error('这段 Base64 的字符或长度不对。检查有没有多出的符号，等号只放在末尾。');
    }
    let binary;
    try { binary = atob(compact); }
    catch (_) { throw new Error('Base64 没读出来。检查字符、长度和末尾的等号。'); }
    return decodeBytes(Uint8Array.from(binary, char => char.charCodeAt(0)));
  }
  function resetSignal() {
    if (wire) wire.value = SIGNAL;
    if (codec) codec.value = 'base64';
    if (decoded) { decoded.hidden = true; decoded.textContent = ''; decoded.classList.remove('is-error'); }
  }
  decode?.addEventListener('click', () => {
    if (!decoded) return;
    decoded.hidden = false;
    try {
      decoded.textContent = decodeSignal(wire ? wire.value : SIGNAL, codec ? codec.value : 'base64');
      decoded.classList.remove('is-error');
      if (/^synt\{/.test(decoded.textContent)) say('signal', '此方：花括号还在，字母却偏了点。把这段再用 ROT13 解一次？');
      else if (codec?.value === 'rot13' && /^flag\{/.test(decoded.textContent)) say('signal', '此方：这回读得通了。交答案的时候别漏括号。');
      else say('signal', '此方：这一层读出来了。你也可以换串 Hex 或 ROT13 玩玩。');
    } catch (error) {
      decoded.textContent = error.message;
      decoded.classList.add('is-error');
      say('signal', '此方：这串没读通。看看是不是选错了编码，或者抄漏了字符。');
    }
  });
  $('[data-signal-reset]')?.addEventListener('click', () => {
    resetSignal();
    say('signal', '此方：最初那封信放回来了，通关记录还在。');
  });

  const sourceToggle = $('.ctf-source-toggle');
  const sourcePreview = $('.ctf-source-preview');
  const sourceHighlight = $('[data-source-highlight]');
  const sourceCode = sourcePreview?.querySelector('code');
  const sourceText = $('[data-lobby]')?.outerHTML.replace(/></g, '>\n<') || '';
  if (sourceCode) sourceCode.textContent = sourceText;
  function resetSource() {
    if (sourcePreview) sourcePreview.hidden = true;
    if (sourceToggle) { sourceToggle.setAttribute('aria-expanded', 'false'); sourceToggle.textContent = '查看页面源码'; }
    if (sourceCode) sourceCode.textContent = sourceText;
    if (sourceHighlight) { sourceHighlight.hidden = true; sourceHighlight.disabled = false; sourceHighlight.textContent = '圈出注释'; }
  }
  sourceToggle?.addEventListener('click', () => {
    if (!sourcePreview) return;
    sourcePreview.hidden = !sourcePreview.hidden;
    sourceToggle.setAttribute('aria-expanded', String(!sourcePreview.hidden));
    sourceToggle.textContent = sourcePreview.hidden ? '查看页面源码' : '合上源码';
    if (sourceHighlight) sourceHighlight.hidden = sourcePreview.hidden;
  });
  sourceHighlight?.addEventListener('click', () => {
    if (!sourceCode || sourcePreview.hidden) return;
    const fragment = document.createDocumentFragment();
    const comments = /<!--[\s\S]*?-->/g;
    let end = 0;
    for (const match of sourceText.matchAll(comments)) {
      fragment.append(document.createTextNode(sourceText.slice(end, match.index)));
      const mark = document.createElement('mark');
      mark.className = 'ctf-code-note';
      mark.textContent = match[0];
      fragment.append(mark);
      end = match.index + match[0].length;
    }
    fragment.append(document.createTextNode(sourceText.slice(end)));
    sourceCode.replaceChildren(fragment);
    sourceHighlight.disabled = true;
    sourceHighlight.textContent = '纸条已圈出';
    say('source', '春日：这些纸条有编号。先排顺序，再把内容连起来。');
  });

  const padding = $('#ctf-padding');
  const alignmentToggle = $('[data-stack-align]');
  const targets = {
    main: [0x80, 0x10, 0x40, 0, 0, 0, 0, 0],
    win: [0xd6, 0x11, 0x40, 0, 0, 0, 0, 0],
    lost: [0xef, 0xbe, 0xad, 0xde, 0, 0, 0, 0]
  };
  const retAddress = [0x16, 0x10, 0x40, 0, 0, 0, 0, 0];
  const equalBytes = (left, right) => left.every((byte, index) => byte === right[index]);
  function addressHex(bytes) {
    return '0x' + [...bytes].reverse().map(byte => byte.toString(16).padStart(2, '0')).join('').replace(/^0+(?=[0-9a-f])/, '');
  }
  const cells = [];
  ['buffer', 'rbp', 'rip', 'chain'].forEach((region, regionIndex) => {
    const box = $('[data-stack-region="' + region + '"]');
    if (!box) return;
    for (let i = 0; i < (regionIndex === 0 ? 16 : 8); i++) {
      const cell = document.createElement('span');
      cell.className = 'ctf-byte';
      box.append(cell);
      cells.push(cell);
    }
  });
  function makePayload(state) {
    const bytes = new Uint8Array(state.fill + (state.align ? 16 : 8));
    bytes.fill(0x41, 0, state.fill);
    if (state.align) bytes.set(retAddress, state.fill);
    bytes.set(targets[state.choice], state.fill + (state.align ? 8 : 0));
    return bytes;
  }
  function model() {
    const raw = padding ? padding.value.trim() : '';
    const count = Number(raw);
    const valid = raw !== '' && Number.isInteger(count) && count >= 0 && count <= 40;
    const fill = valid ? count : 0;
    const selected = $('input[name="ctf-target"]:checked')?.value || 'main';
    const choice = Object.hasOwn(targets, selected) ? selected : 'main';
    const align = !!alignmentToggle?.checked;
    const memory = Array(56).fill(0);
    memory.splice(24, 8, ...targets.main);
    const payload = valid ? makePayload({ fill, choice, align }) : new Uint8Array();
    payload.forEach((byte, index) => { memory[index] = byte; });
    const rip = memory.slice(24, 32);
    const next = memory.slice(32, 40);
    const viaRet = equalBytes(rip, retAddress);
    const entry = viaRet ? next : rip;
    return {
      valid, fill, choice, align, memory, payload, rip, next, viaRet, entry,
      hex: addressHex(rip), nextHex: addressHex(next), entryHex: addressHex(entry),
      entryModulo: viaRet ? 8 : 0
    };
  }
  const download = $('[data-stack-download]');
  const route = $('[data-stack-route]');
  let payloadURL = null;
  const retiredURLs = new Set();
  function retirePayload(record) {
    if (!record) return;
    if (!record.clicked) { URL.revokeObjectURL(record.url); return; }
    retiredURLs.add(record.url);
    setTimeout(() => { URL.revokeObjectURL(record.url); retiredURLs.delete(record.url); }, 30000);
  }
  function clearPayload() {
    retirePayload(payloadURL);
    payloadURL = null;
    if (download) { download.hidden = true; download.removeAttribute('href'); }
  }
  function updatePayload(state) {
    if (!download) return;
    if (!state.valid) { clearPayload(); return; }
    const signature = state.fill + '/' + state.choice + '/' + state.align;
    if (!payloadURL || payloadURL.signature !== signature) {
      clearPayload();
      payloadURL = { url: URL.createObjectURL(new Blob([state.payload], { type: 'application/octet-stream' })), signature, clicked: false };
    }
    download.href = payloadURL.url;
    download.download = 'payload.bin';
    download.hidden = false;
  }
  download?.addEventListener('click', event => {
    if (!payloadURL || !model().valid) { event.preventDefault(); return; }
    payloadURL.clicked = true;
  });
  function renderStack(clearRoute = false) {
    const state = model();
    cells.forEach((cell, index) => {
      cell.textContent = state.memory[index].toString(16).padStart(2, '0');
      cell.classList.toggle('is-padding', state.valid && index < state.fill);
      cell.classList.toggle('is-address', state.valid && index >= state.fill && index < state.payload.length);
      cell.classList.toggle('is-ret', state.valid && state.align && index >= state.fill && index < state.fill + 8);
      cell.title = '偏移 ' + index + ' · 0x' + cell.textContent;
    });
    const chain = $('[data-stack-region="chain"]')?.closest('.ctf-stack-region');
    if (chain) chain.hidden = !state.align;
    $('.ctf-stack-visual')?.classList.toggle('has-chain', state.align);
    if ($('[data-rip]')) $('[data-rip]').textContent = state.valid ? state.hex : '等待有效输入';
    if ($('[data-payload-size]')) $('[data-payload-size]').textContent = state.valid ? ' · payload 共 ' + state.payload.length + ' 字节' : '';
    const alignment = $('[data-stack-alignment]');
    if (alignment) {
      if (!state.valid) alignment.textContent = '等待有效输入后，再看入口对齐。';
      else if (state.viaRet) alignment.textContent = '额外 ret() 再弹出 8 字节 → 下一入口 RSP % 16 = 8；win() 需要 8。';
      else alignment.textContent = '直接返回后的入口 RSP % 16 = 0；此模型的 win() 需要 8。';
    }
    root.querySelectorAll('[data-stack-shift]').forEach(button => {
      const delta = Number(button.dataset.stackShift);
      button.disabled = state.valid && ((delta < 0 && state.fill === 0) || (delta > 0 && state.fill === 40));
    });
    if (clearRoute && route) { route.textContent = ''; route.hidden = true; }
    updatePayload(state);
  }
  padding?.addEventListener('input', () => renderStack(true));
  alignmentToggle?.addEventListener('change', () => renderStack(true));
  root.querySelectorAll('input[name="ctf-target"]').forEach(radio => radio.addEventListener('change', () => renderStack(true)));
  root.querySelectorAll('[data-stack-shift]').forEach(button => {
    button.addEventListener('click', () => {
      if (!padding) return;
      const delta = Number(button.dataset.stackShift);
      if (delta !== 1 && delta !== -1) return;
      const state = model();
      padding.value = String(Math.max(0, Math.min(40, (state.valid ? state.fill : 0) + delta)));
      renderStack(true);
    });
  });
  $('.ctf-stack-run')?.addEventListener('click', () => {
    const state = model();
    if (!state.valid) {
      feedback('stack', '先填一个 0 到 40 的整数，再运行。', false);
      say('stack', '红莉栖：字节数先用整数。负数和小数，先放一边。');
      if (route) { route.textContent = ''; route.hidden = true; }
      return;
    }
    const entersWin = equalBytes(state.entry, targets.win);
    const returnsMain = equalBytes(state.entry, targets.main);
    const wins = entersWin && state.entryModulo === 8;
    const destination = entersWin ? 'win() 入口，RSP % 16 = ' + state.entryModulo + (wins ? '，通过' : '，对齐检查失败') : returnsMain ? 'main()' : '跑飞';
    if (route) {
      route.hidden = false;
      route.textContent = 'read(' + state.payload.length + ' 字节) → ret → RIP = ' + state.hex +
        (state.viaRet ? ' → ret() 再弹出 8 字节 → 下一地址 = ' + state.nextHex : '') + ' → ' + destination;
    }
    if (wins) { earn('stack'); return; }
    if (entersWin) {
      feedback('stack', 'win() 的地址到了，但入口 RSP % 16 = 0；此模型要求 8。多接一个 ret()，让它再弹出 8 字节。', false);
      say('stack', '红莉栖：地址没填错。差一个 ret()，再试一次？');
    } else if (returnsMain) {
      feedback('stack', '程序回到了 main()。让地址从偏移 24 开始，并确认最后选的是 win()。', false);
      say('stack', '红莉栖：还在 main()。先看看地址落在哪几格。');
    } else {
      feedback('stack', '程序跑飞：入口地址 = ' + state.entryHex + '。先把填充对齐到偏移 24，再检查 ret 链和目标地址。', false);
      say('stack', '红莉栖：先对齐位置，再看后面的地址。别一口气改三处。');
    }
  });
  $('.ctf-replay')?.addEventListener('click', () => {
    mergeRecord(readRecord());
    solved.clear();
    resetAt = Math.min(Number.MAX_SAFE_INTEGER, Math.max(Date.now(), resetAt + 1));
    const saved = save();
    root.querySelectorAll('[data-feedback]').forEach(target => { target.textContent = ''; target.classList.remove('is-success', 'is-error'); });
    root.querySelectorAll('[data-flag-form] input').forEach(input => { input.value = ''; });
    root.querySelectorAll('details').forEach(details => { details.open = false; });
    ids.forEach(id => { hintSteps[id] = 0; say(id, hints[id][0]); });
    if (!saved) say('signal', '此方：本页重新开始了。浏览器不允许保存，旧记录还可能在。');
    resetSignal();
    resetSource();
    if (padding) padding.value = '16';
    const main = $('input[name="ctf-target"][value="main"]');
    if (main) main.checked = true;
    if (alignmentToggle) alignmentToggle.checked = false;
    renderStack(true);
    sync();
    $('#ctf-signal-answer')?.focus({ preventScroll: true });
    $('.ctf-hero')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  });
  window.addEventListener('storage', event => {
    if (event.key !== KEY && event.key !== null) return;
    if (event.newValue === null) { solved.clear(); resetAt = 0; }
    else {
      const incoming = parseRecord(event.newValue);
      if (!incoming) return;
      mergeRecord(incoming);
      const latest = readRecord();
      mergeRecord(latest);
      // Two tabs may write different answers before either receives an event.
      // Persist their union once; matching records do not trigger another write.
      if (latest && (latest.resetAt !== resetAt ||
          ids.some(id => solved.has(id) !== latest.solved.includes(id)))) save();
    }
    sync();
  });
  window.addEventListener('pagehide', clearPayload);
  window.addEventListener('pageshow', () => renderStack());
  function initRadio() {
    const puzzle = $('[data-radio-puzzle]');
    if (!puzzle || puzzle.dataset.radioInstalled === 'true') return;
    puzzle.dataset.radioInstalled = 'true';
    const RADIO_KEY = 'blog-ctf-radio-v1';
    const RADIO_FLAG = 'flag{the_lab_is_still_open}';
    const query = selector => puzzle.querySelector(selector);
    const wire = query('[data-radio-wire]');
    const bytesOutput = query('[data-radio-bytes]');
    const hexInput = query('[data-radio-hex]');
    const keyInput = query('[data-radio-key]');
    const plainOutput = query('[data-radio-output]');
    const radioFeedback = query('[data-radio-feedback]');
    const mentor = query('[data-radio-mentor]');
    const radioHints = [
      '红莉栖：先把 Base64 还原成字节。它现在还不是明文。',
      '红莉栖：把那些字节交给 XOR。密钥来自实验室口令，去掉口令中间的空格。',
      '红莉栖：密钥是 ELPSYCONGROO。每个密文字节，和循环使用的密钥字节异或。'
    ];
    let hintStep = 0;
    function parseRadio(raw) {
      if (raw === null) return false;
      try {
        const record = JSON.parse(raw);
        if (!record || typeof record !== 'object' || Array.isArray(record) ||
            typeof record.solved !== 'boolean') return null;
        return record.solved;
      } catch (_) { return null; }
    }
    function readRadio() {
      try { return parseRadio(localStorage.getItem(RADIO_KEY)); }
      catch (_) { return null; }
    }
    let radioSolved = readRadio() === true;
    function syncRadio() {
      puzzle.classList.toggle('is-solved', radioSolved);
      puzzle.dataset.radioSolved = String(radioSolved);
      const state = query('[data-radio-state]');
      if (state) state.textContent = radioSolved ? '已收听' : '未收听';
    }
    function report(message, success) {
      if (!radioFeedback) return;
      radioFeedback.textContent = message;
      radioFeedback.classList.toggle('is-success', success);
      radioFeedback.classList.toggle('is-error', !success);
    }
    function radioSay(message) { if (mentor) mentor.textContent = message; }
    function showResult(output, message, error = false) {
      if (!output) return;
      output.hidden = false;
      output.textContent = message;
      output.classList.toggle('is-error', error);
    }
    function radioBytes(input) {
      if (!input.trim()) throw new Error('先放一段广播里的 Base64。');
      if (input.length > 2048) throw new Error('这台收音机最多读 2048 个字符，短一点再试。');
      const compact = input.replace(/\s/g, '');
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(compact) || compact.length % 4 === 1 ||
          (compact.includes('=') && compact.length % 4 !== 0)) {
        throw new Error('Base64 的字符或长度不对。等号只放在末尾，检查有没有抄漏。');
      }
      let binary;
      try { binary = atob(compact); }
      catch (_) { throw new Error('Base64 没读出来，检查字符和末尾的等号。'); }
      return Uint8Array.from(binary, character => character.charCodeAt(0));
    }
    function xorRadio(rawHex, rawKey) {
      if (!rawHex.trim()) throw new Error('先把第一步得到的 HEX 放在这里。');
      if (rawHex.length > 6144) throw new Error('HEX 最多放 6144 个字符，短一点再试。');
      const hex = rawHex.replace(/\s/g, '');
      if (!/^[0-9a-fA-F]+$/.test(hex)) throw new Error('HEX 只用 0–9、a–f，可以用空格分开字节。');
      if (hex.length % 2) throw new Error('HEX 每两个字符是一字节，现在少了半个字节。');
      if (rawKey.length > 64) throw new Error('密钥最多放 64 个字符。');
      const key = rawKey.replace(/[ \t\r\n\f\v]/g, '');
      if (!key) throw new Error('还差一个密钥。看看实验室便签里的口令。');
      if (!/^[\x00-\x7f]+$/.test(key)) throw new Error('这里的密钥使用 ASCII 字符。用便签里的英文口令，不要加中文或全角空格。');
      const cipher = Uint8Array.from(hex.match(/../g), pair => parseInt(pair, 16));
      const plain = cipher.map((byte, index) => byte ^ key.charCodeAt(index % key.length));
      try { return new TextDecoder('utf-8', { fatal: true }).decode(plain); }
      catch (_) { throw new Error('异或后还不是有效的 UTF-8 文本。检查密钥和 HEX 有没有抄错。'); }
    }
    query('[data-radio-decode]')?.addEventListener('click', () => {
      try {
        const bytes = radioBytes(wire ? wire.value : '');
        showResult(bytesOutput, Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join(' '));
        radioSay('红莉栖：字节读出来了。复制到第二步，再处理 XOR。');
      } catch (error) {
        showResult(bytesOutput, error.message, true);
        radioSay('红莉栖：先把这一层读通，第二步还用不上。');
      }
    });
    query('[data-radio-xor]')?.addEventListener('click', () => {
      try {
        showResult(plainOutput, xorRadio(hexInput ? hexInput.value : '', keyInput ? keyInput.value : ''));
        radioSay('红莉栖：有字了。看看是不是完整的 flag，再交给我。');
      } catch (error) {
        showResult(plainOutput, error.message, true);
        radioSay('红莉栖：检查密钥和字节。每一位都会影响解出来的内容。');
      }
    });
    query('[data-radio-hint]')?.addEventListener('click', () => {
      radioSay(radioHints[hintStep]);
      hintStep = Math.min(hintStep + 1, radioHints.length - 1);
    });
    query('[data-radio-answer-form]')?.addEventListener('submit', event => {
      event.preventDefault();
      const answer = event.currentTarget.querySelector('input[name="flag"]')?.value.trim() || '';
      if (answer !== RADIO_FLAG) {
        report(answer.startsWith('flag{') ? '广播还没对上。检查下划线、大小写和花括号里的内容。' : '把解出来的完整 flag{...} 填在这里。', false);
        radioSay('红莉栖：密钥正确的时候，广播会读成一段完整的文字。');
        return;
      }
      radioSolved = true;
      let saved = readRadio() === true;
      if (!saved) {
        try { localStorage.setItem(RADIO_KEY, JSON.stringify({ solved: true })); saved = true; }
        catch (_) { /* This optional puzzle stays playable without storage. */ }
      }
      syncRadio();
      report('旧广播收听成功。Base64 先还原字节，重复密钥 XOR 再还原明文。' +
        (saved ? '' : ' 本页已收听；浏览器不允许保存，刷新后可能需要再提交一次。'), true);
      radioSay('红莉栖：听清了。嗯，这次算你帮上忙了。');
    });
    window.addEventListener('storage', event => {
      if (event.key !== RADIO_KEY && event.key !== null) return;
      const incoming = parseRadio(event.newValue);
      if (incoming === null) return;
      radioSolved = incoming;
      syncRadio();
      if (radioSolved) report('另一页已经收听了这段广播，记录同步过来了。', true);
      else if (radioFeedback) {
        radioFeedback.textContent = '';
        radioFeedback.classList.remove('is-success', 'is-error');
      }
    });
    syncRadio();
    if (radioSolved) report('这段旧广播已经收听过了。工作台还可以继续试。', true);
  }
  initRadio();
  sync();
  renderStack();
})();
