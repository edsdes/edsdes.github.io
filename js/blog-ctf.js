/* Client-side teaching models. Records stay in this browser. */
(() => {
  'use strict';
  const root = document.querySelector('.ctf-playground');
  if (!root || window.__blogCtfInstalled) return;
  window.__blogCtfInstalled = true;
  const KEY = 'blog-ctf-v1';
  const SIGNAL = 'ZnZpaHtrb3hpdWFfa294dV90aG9fYWJ2ZV9wd3NfeW9lfQ==';
  const ids = ['signal', 'source', 'stack'];
  const flags = {
    signal: 'flag{konata_kept_the_save_for_you}',
    source: 'flag{same_query_two_readers}',
    stack: 'flag{one_small_step_into_win}'
  };
  const explanations = {
    signal: '收信成功。Base64 还原外层；坐标路线倒着走得到 AKIBA，Vigenère 再用这个密钥还原字母。只有英文字母推进密钥位置，符号留在原处。',
    source: '通过啦。登记处把 club 和编码后的写法当作两个名字；资料柜解码后都读成 club，后面的 sos 就覆盖了前面的 ordinary。这题的关键是两处读法不同，以及后面的值会覆盖前面的值。',
    stack: '模型进入 win()！24 字节填充后，接 8 字节 ret() 地址和 8 字节 win() 地址，共 40 字节。额外 ret 弹出 8 字节后，入口 RSP % 16 = 8。'
  };
  const hints = {
    signal: ['此方：信的外面包了一层 Base64。先拆开看看，里面的字母也许还不是原文。', '此方：坐标是列字母加行号。便签说从终点抄回来，所以要把五个坐标倒着走，再去字母格里取字。', '此方：那几个字母是密钥。选 Vigenère，把刚才读出的密文和密钥放进去。', '此方：倒着走取出的是 AKIBA。Vigenère 只在遇到英文字母时推进密钥；花括号和下划线不占位置。'],
    source: ["春日 · 提示 1/4：先递交默认的 club=ordinary&item=snack。返回 200 只表示申请被接受，还不是通关。结果里的 desk 是登记处读到的原文；cabinet 是资料柜解码后的最终结果。先看看 cabinet 里 club 是什么。","春日 · 提示 2/4：点开两个窗口的规则。登记处不解码，所以 name 和 na%6De 算两个名字；资料柜会把 na%6De 还原成 name。同一份申请能不能在这里读出不同结果？直接写两次 club 会被登记处退回。","春日 · 提示 3/4：打开 URL 小工具，只输入参数名 club，点「按字节编码」。把输出再放回工具里点「还原编码」，确认它仍会变回 club。你需要改变的是名称的写法，不是把整份申请编码。","春日 · 提示 4/4：照这个例子拼一次申请。\nclub=ordinary&%63%6c%75%62=sos&item=snack\n第一项让登记处放行；%63%6c%75%62 解码后也叫 club，后面的 sos 覆盖前面的 ordinary。递交后看 cabinet 里的 club 是否为 sos，再把 note 里的完整 flag 填到下方答案框。"],
    stack: ['红莉栖：buf 16 字节，RBP 8 字节。返回地址从偏移 24 开始，先把位置摆对。', '红莉栖：选 win()。地址正确还不够，这个模型要求入口 RSP % 16 = 8；直接返回进去是 0。', '红莉栖：填充保持 24，在 win() 前接一个 ret()。它再弹出 8 字节，入口余数就从 0 变成 8。']
  };
  const reactions = {
    signal: { win: '此方：读到了。存档还给你留着，刚好能接着玩。', wrong: '此方：先别急着交，桌上那张便签还没看完吧？' },
    source: { win: '春日：便签和点心都拿回来了。今天算你立功啦。', wrong: '春日：递交申请后，找结果里的 note 字段。里面那串完整的 flag{...} 才是交给我的答案。' },
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
      const shownHint = hintSteps[id] + 1;
      say(id, hints[id][hintSteps[id]]);
      hintSteps[id] = Math.min(hintSteps[id] + 1, hints[id].length - 1);
      if (id === 'source') {
        const last = shownHint === hints[id].length;
        button.textContent = last ? '从第 1 条再看' : '下一条提示（' + (shownHint + 1) + '/' + hints[id].length + '）';
        if (last) hintSteps[id] = 0;
      }
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
        const wrongMessage = id === 'source'
          ? '这里要填写结果中 note 字段的完整 flag{...}，不是申请参数或状态码。如果还没有 note，先把借阅申请改到能取出 SOS 便签。'
          : id === 'signal' ? '这次的信还没读通。看看便签的方向，确认密钥和大小写。'
          : (answer.startsWith('flag{') ? '检查大小写和花括号里的内容，再试试。' : '把找到的 flag{...} 填在这里。');
        feedback(id, wrongMessage, false);
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
  function decodeSignal(input, mode, rawKey = '') {
    if (!input.trim()) throw new Error('先放一段要解码的文字。');
    if (input.length > 3000) throw new Error('这张纸条最多放 3000 个字符，短一点再试。');
    if (mode === 'rot13') return input.replace(/[A-Za-z]/g, letter => {
      const start = letter <= 'Z' ? 65 : 97;
      return String.fromCharCode(start + (letter.charCodeAt(0) - start + 13) % 26);
    });
    if (mode === 'vigenere') {
      const normalized = rawKey.replace(/[ \t\r\n\f\v]/g, '');
      if (!normalized) throw new Error('还差一个密钥。看看此方留下的便签。');
      if (!/^[A-Za-z]{1,64}$/.test(normalized)) throw new Error('密钥只用 1 到 64 个英文字母，可以夹着空格。');
      const key = normalized.toUpperCase();
      let position = 0;
      return input.replace(/[A-Za-z]/g, letter => {
        const start = letter <= 'Z' ? 65 : 97;
        const shift = key.charCodeAt(position++ % key.length) - 65;
        return String.fromCharCode(start + (letter.charCodeAt(0) - start - shift + 26) % 26);
      });
    }
    const compact = input.replace(/\s/g, '');
    if (mode === 'hex') {
      if (!/^[0-9a-fA-F]+$/.test(compact)) throw new Error('Hex 只用 0–9、a–f；可以用空格分开字节。');
      if (compact.length % 2) throw new Error('Hex 每两个字符是一字节，现在少了半个字节。');
      return decodeBytes(Uint8Array.from(compact.match(/../g), pair => parseInt(pair, 16)));
    }
    if (mode !== 'base64') throw new Error('先选 Base64、Hex、ROT13 或 Vigenère。');
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(compact) || compact.length % 4 === 1 ||
      (compact.includes('=') && compact.length % 4 !== 0)) {
      throw new Error('这段 Base64 的字符或长度不对。检查有没有多出的符号，等号只放在末尾。');
    }
    let binary;
    try { binary = atob(compact); }
    catch (_) { throw new Error('Base64 没读出来。检查字符、长度和末尾的等号。'); }
    return decodeBytes(Uint8Array.from(binary, char => char.charCodeAt(0)));
  }
  const signalKey = $('[data-signal-key]');
  const signalKeyField = $('[data-signal-key-field]');
  function showSignalKey() { if (signalKeyField) signalKeyField.hidden = codec?.value !== 'vigenere'; }
  codec?.addEventListener('change', showSignalKey);
  showSignalKey();
  function resetSignal() {
    if (wire) wire.value = SIGNAL;
    if (codec) codec.value = 'base64';
    if (signalKey) signalKey.value = '';
    showSignalKey();
    if (decoded) { decoded.hidden = true; decoded.textContent = ''; decoded.classList.remove('is-error'); }
  }
  decode?.addEventListener('click', () => {
    if (!decoded) return;
    decoded.hidden = false;
    try {
      decoded.textContent = decodeSignal(wire ? wire.value : SIGNAL, codec ? codec.value : 'base64', signalKey ? signalKey.value : '');
      decoded.classList.remove('is-error');
      if (/^flag\{/.test(decoded.textContent)) say('signal', '此方：好像能读了。交答案的时候别漏括号。');
      else say('signal', '此方：这一层读出来了。要是还看不懂，桌上的便签或许有用。');
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

  const webQuery = $('[data-web-query]');
  const webResponse = $('[data-web-response]');
  const webRule = $('[data-web-rule-code]');
  const urlInput = $('[data-url-input]');
  const urlOutput = $('[data-url-output]');
  const webRules = {
    desk: "登记处（desk）：检查输入框中的原文，不进行 URL 解码。\n1. 每个参数是 名称=值；参数之间用 & 分开。\n2. 原始名称完全相同的参数不能出现两次。\n3. 必须保留一项原样的 club=ordinary。\n4. 其它原始名称会原样交给资料柜。\n\n例如：name 和 na%6De 在这里是两个不同名称。\n这里不把 %6D 还原成 m。",
    cabinet: "资料柜（cabinet）：登记处放行后，重新读取同一份申请。\n1. URL 解码参数名和值：例如 na%6De 会变回 name。\n2. 解码后若名称相同，保留最后一项的值。\n3. 最终 club=sos 且 item=snack，才会取出带 flag 的 SOS 便签。\n\n读取代码：\nconst entries = new URLSearchParams(query);\nconst form = Object.fromEntries(entries);\n\n注意：它会解码名称和值，而登记处检查的是原始写法。"
  };
  function resetSource() {
    if (webQuery) webQuery.value = 'club=ordinary&item=snack';
    [webResponse, webRule, urlOutput].forEach(node => { if (node) { node.hidden = true; node.textContent = ''; } });
    if (urlInput) urlInput.value = '';
    const help = $('[data-mentor-help="source"]'); if (help) help.textContent = '问问春日';
    root.querySelectorAll('[data-web-rule]').forEach(b => b.setAttribute('aria-pressed','false'));
  }
  function displayWeb(node, value) { if(node) { node.hidden = false; const order = ['status','error','note','message','desk','cabinet']; node.textContent = typeof value === 'string' ? value : JSON.stringify(Object.fromEntries(Object.entries(value).sort((a,b)=>order.indexOf(a[0])-order.indexOf(b[0]))),null,2); } }
  function readApplication(raw) {
    const query = raw.trim().replace(/^\?/, '');
    if (!query || new TextEncoder().encode(query).length > 2000) return { status:400, error:'申请为空，或超过 2000 字节。请在上方填写 ? 后面的参数部分。' };
    if (/%(?![0-9a-fA-F]{2})/.test(query)) return { status:400, error:'百分号编码不完整：每个 % 后面需要两位十六进制数字，例如 %6D。检查是否漏了字母或数字。' };
    const entries = query.split('&').filter(Boolean).map(part => { const at=part.indexOf('='); return at<0 ? [part,''] : [part.slice(0,at),part.slice(at+1)]; });
    if (!entries.length || entries.length>32) return { status:400,error:'申请最多放 32 个参数。' };
    const seen = new Set();
    for(const [name] of entries) { if(seen.has(name))return {status:400,desk:entries,error:'登记处退回了申请：原文中的参数名「'+name+'」重复。它在解码前就会检查名称。'}; seen.add(name); }
    const club = entries.find(pair=>pair[0]==='club');
    if(!club || club[1]!=='ordinary')return {status:403,desk:entries,error:'登记处未放行：申请中必须保留一项原样的 club=ordinary。直接改成 sos，或把这项的名称、值编码，都不符合它的规则。'};
    const cabinet = Object.fromEntries(new URLSearchParams(query));
    if(cabinet.item!=='snack' || !['ordinary','sos'].includes(cabinet.club))return {status:404,desk:entries,cabinet,error:'登记处已放行，但资料柜找不到对应的点心。检查 cabinet：club 应为 ordinary 或 sos，item 应为 snack。'};
    if(cabinet.club==='sos')return {status:200,desk:entries,cabinet,note:flags.source,message:'已取到 SOS 便签。复制 note 字段中的完整 flag{...}，填到下方答案框，再点「拿给春日看」。'};
    return {status:200,desk:entries,cabinet,message:'申请通过了，但取到的是普通部的饼干。status=200 不代表通关；cabinet 中 club 仍是 ordinary。最终读到 sos 才会返回含 flag 的 note。'};
  }
  $('[data-web-send]')?.addEventListener('click', () => {
    const result=readApplication(webQuery?.value || '');
    displayWeb(webResponse,result);
    if (result.note) say('source', '春日：便签拿回来了！复制结果中 note 的完整 flag，填进下面的答案框，最后点「拿给春日看」。饼干也给你留一块～');
    else if (result.status === 403) say('source', '春日：登记处还没放行。先保留原样的 club=ordinary；你直接把这一项改成 sos，它当然不会收。看看两个窗口分别怎样读参数名。');
    else if (result.error?.includes('重复')) say('source', '春日：登记处发现了重复的原始参数名。直接写两次 club 不行；要比较的是「原文写法不同、解码后名称相同」的情况。');
    else if (result.status === 404) say('source', '春日：登记处已经放行，现在检查结果里的 cabinet。club 要是 ordinary 或 sos，item 要是 snack；拼写和大小写都要对。');
    else if (result.status === 200) say('source', '春日：200 只是申请通过，还没拿到 SOS 便签。看 cabinet 里的 club：如果仍是 ordinary，检查解码后的名称，以及同名参数的顺序。后面的值会覆盖前面的值。');
    else say('source', '春日：先看结果最上面的 error，按它指出的格式问题修改。上方只需要填 ? 后面的参数，不用写网址或 GET。');
  });
  root.querySelectorAll('[data-web-rule]').forEach(button=>button.addEventListener('click',()=>{
    const name=button.dataset.webRule;
    if(!Object.hasOwn(webRules,name))return;
    displayWeb(webRule,webRules[name]);
    root.querySelectorAll('[data-web-rule]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  }));
  $('[data-url-encode]')?.addEventListener('click',()=>{
    const value=urlInput?.value || '';
    if(!value || value.length>3000) {displayWeb(urlOutput,'先在工具输入框中放参数名或其它文字，再点编码；不要把整份申请一起放进来。最多 3000 个字符。');return;}
    const bytes=new TextEncoder().encode(value);
    displayWeb(urlOutput,Array.from(bytes,b=>'%'+b.toString(16).padStart(2,'0')).join(''));
  });
  $('[data-url-decode]')?.addEventListener('click',()=>{
    const value=urlInput?.value || '';
    if(!value || value.length>3000) {displayWeb(urlOutput,'先把编码结果放到工具输入框，再点还原。最多 3000 个字符。');return;}
    try {displayWeb(urlOutput,decodeURIComponent(value));}
    catch(_) {displayWeb(urlOutput,'这串编码没读通。% 后要有两位十六进制数字（例如 %6D），多字节字符也不能漏掉任何一段。');}
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
