/* Clubroom games. A round only runs while its player is here. */
(() => {
  'use strict';
  const root = document.querySelector('.blog-arcade');
  if (!root || root.dataset.arcadeReady) return;
  root.dataset.arcadeReady = '1';
  const RECORD_KEY = 'blog-arcade-records-v1';
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const inDialog = () => !!document.querySelector('dialog[open]');
  const characters = [
    { id: 'haruhi', slot: 0, name: '春日', line: '团长到了。人齐了就开始今天的活动！' },
    { id: 'konata', slot: 1, name: '此方', line: '点完名以后，可以继续打游戏了吗？' },
    { id: 'kurisu', slot: 2, name: '红莉栖', line: '只是记忆测试而已，别把事情想得太复杂。' },
    { id: 'yuki', slot: 3, name: '长门有希', line: '确认。还有其他成员。' },
    { id: 'misaka', slot: 4, name: '御坂美琴', line: '找到了。下一张也不会认错的。' },
    { id: 'azusa', slot: 5, name: '中野梓', line: '大家到齐之后，记得认真练习啊。' },
    { id: 'kuroneko', slot: 6, name: '黑猫', line: '这张牌的封印，已经解开了。' },
    { id: 'saber', slot: 7, name: 'Saber', line: '稍作休息，也有助于下一场战斗。' }
  ];
  function shuffled(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
  function setText(selector, value) {
    const target = root.querySelector(selector);
    if (target) target.textContent = String(value);
  }
  function paintPortrait(element, character) {
    element.style.setProperty('--portrait-x', (character.slot % 4) * (100 / 3) + '%');
    element.style.setProperty('--portrait-y', character.slot < 4 ? '0%' : '100%');
    element.textContent = character.name.slice(0, 1);
  }
  function readRecords() {
    try {
      const data = JSON.parse(localStorage.getItem(RECORD_KEY) || '{}');
      const moves = (value, minimum) => Number.isInteger(value) && value >= minimum && value <= 1000000 ? value : null;
      return { memory4: moves(data?.memory4, 4), memory6: moves(data?.memory6, 6), flagCombo: Number.isInteger(data?.flagCombo) && data.flagCombo >= 0 && data.flagCombo <= 12 ? data.flagCombo : 0 };
    } catch (_) { return { memory4: null, memory6: null, flagCombo: 0 }; }
  }
  let records = readRecords();
  function updateRecords(update) {
    const stored = readRecords();
    for (const key of ['memory4', 'memory6']) {
      const values = [records[key], stored[key], update[key]].filter(value => Number.isInteger(value));
      records[key] = values.length ? Math.min(...values) : null;
    }
    records.flagCombo = Math.max(records.flagCombo, stored.flagCombo, update.flagCombo || 0);
    try { localStorage.setItem(RECORD_KEY, JSON.stringify(records)); } catch (_) {}
    renderRecords();
  }
  function celebrate(scope) {
    window.BlogAdventure?.discover('arcade');
    scope.classList.add('is-complete');
  }
  const portraitImage = new Image();
  portraitImage.onload = () => root.classList.add('has-portraits');
  portraitImage.onerror = () => {
    const note = root.querySelector('[data-portrait-note]');
    if (note) { note.hidden = false; note.textContent = '头像暂时没载到，照名字也能配对。'; }
  };
  portraitImage.src = '/img/easter-eggs/classic-girls-portraits.webp';

  const memoryRoot = root.querySelector('.arcade-memory');
  const memoryBoard = root.querySelector('.arcade-memory-board');
  const memoryFeedback = root.querySelector('[data-memory-feedback]');
  const memoryPortrait = root.querySelector('[data-memory-portrait]');
  const peekButton = root.querySelector('[data-memory-peek]');
  const modeButtons = [...root.querySelectorAll('[data-memory-mode]')];
  let pairCount = 4, deck = [], open = [], matched = new Set(), moves = 0, pairs = 0;
  let locked = false, peeking = false, peekUsed = false, memoryWon = false;
  let pairTimer, peekTimer, memoryRound = 0;
  function renderRecords() {
    setText('[data-memory-best]', records['memory' + pairCount] ?? '—');
    setText('[data-flag-best]', records.flagCombo || '—');
  }
  function memoryMessage(text, character = characters[1]) {
    memoryFeedback.textContent = text;
    if (memoryPortrait) paintPortrait(memoryPortrait, character);
  }
  function renderMemory() {
    [...memoryBoard.children].forEach((card, index) => {
      const faceUp = peeking || open.includes(index) || matched.has(index);
      card.classList.toggle('is-open', faceUp);
      card.classList.toggle('is-matched', matched.has(index));
      card.disabled = matched.has(index);
      card.setAttribute('aria-pressed', String(faceUp));
      card.setAttribute('aria-label', '第 ' + (index + 1) + ' 张，' + (faceUp ? deck[index].name : '未翻开') + (matched.has(index) ? '，已配对' : ''));
      card.querySelector('.arcade-card-label').textContent = matched.has(index) ? '✓ ' + deck[index].name : faceUp ? deck[index].name : '部室';
    });
    setText('[data-memory-moves]', moves);
    setText('[data-memory-pairs]', pairs);
    setText('[data-memory-total]', pairCount);
    memoryBoard.setAttribute('aria-label', '角色翻牌棋盘，共 ' + deck.length + ' 张卡片');
    if (peekButton) {
      peekButton.disabled = peekUsed || locked || open.length > 0 || memoryWon;
      peekButton.textContent = peekUsed ? '这一局已经借看过了' : '借看一眼';
    }
  }
  function finishMemory() {
    if (memoryWon || pairs !== pairCount) return;
    memoryWon = true;
    const previousBest = records['memory' + pairCount];
    updateRecords({ ['memory' + pairCount]: moves });
    memoryFeedback.classList.add('is-success');
    memoryMessage('全员到齐！用了 ' + moves + ' 步。' + (previousBest !== null && moves < previousBest ? '比上次少了几步。' : '洗一副牌，再换几位来。'), characters[0]);
    celebrate(memoryRoot);
  }
  function flip(index, keyboard) {
    if (locked || peeking || memoryWon || matched.has(index) || open.includes(index) || inDialog()) return;
    open.push(index);
    renderMemory();
    if (open.length === 1) { memoryMessage('翻到了' + deck[index].name + '。再找一张她的牌。', deck[index]); return; }
    moves++;
    locked = true;
    const [first, second] = open;
    const same = deck[first].id === deck[second].id;
    if (same) {
      matched.add(first);
      matched.add(second);
      pairs++;
      memoryMessage(deck[first].name + '：' + deck[first].line, deck[first]);
      // Award immediately: leaving the page must not swallow the final pair.
      finishMemory();
    } else memoryMessage('记住这两个位置。她们还没找到各自的搭档。');
    renderMemory();
    const thisRound = memoryRound;
    pairTimer = setTimeout(() => {
      if (thisRound !== memoryRound) return;
      pairTimer = undefined;
      open = [];
      locked = false;
      renderMemory();
      if (same && keyboard && !inDialog() && document.visibilityState !== 'hidden') {
        const next = [...memoryBoard.children].find(card => !card.disabled);
        (next || root.querySelector('.arcade-memory-restart')).focus({ preventScroll: true });
      }
    }, same ? (reduced() ? 0 : 220) : 720);
  }
  function settleMemory() {
    clearTimeout(pairTimer);
    clearTimeout(peekTimer);
    pairTimer = peekTimer = undefined;
    memoryRound++;
    open = [];
    peeking = false;
    locked = false;
    renderMemory();
  }
  function resetMemory() {
    settleMemory();
    const chosen = shuffled(characters).slice(0, pairCount);
    deck = shuffled([...chosen, ...chosen]);
    open = [];
    matched = new Set();
    moves = pairs = 0;
    locked = peeking = peekUsed = memoryWon = false;
    memoryRoot.classList.remove('is-complete');
    memoryFeedback.classList.remove('is-success');
    memoryMessage('洗好牌了。这局有 ' + pairCount + ' 位客人，试着把她们找齐。');
    memoryBoard.replaceChildren();
    deck.forEach((character, index) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'arcade-memory-card';
      card.dataset.cardIndex = String(index);
      card.dataset.cardKind = character.id;
      const face = document.createElement('span');
      face.className = 'arcade-card-portrait';
      face.setAttribute('aria-hidden', 'true');
      paintPortrait(face, character);
      const back = document.createElement('span');
      back.className = 'arcade-card-back';
      back.textContent = '？';
      back.setAttribute('aria-hidden', 'true');
      const label = document.createElement('span');
      label.className = 'arcade-card-label';
      label.setAttribute('aria-hidden', 'true');
      card.append(face, back, label);
      card.addEventListener('click', event => { if (card.isConnected) flip(index, event.detail === 0); });
      memoryBoard.append(card);
    });
    modeButtons.forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.memoryMode) === pairCount)));
    renderMemory();
    renderRecords();
  }
  modeButtons.forEach(button => button.addEventListener('click', () => {
    const next = Number(button.dataset.memoryMode);
    if (![4, 6].includes(next) || next === pairCount) return;
    pairCount = next;
    resetMemory();
  }));
  root.querySelector('.arcade-memory-restart').addEventListener('click', resetMemory);
  peekButton?.addEventListener('click', () => {
    if (peekUsed || locked || open.length || memoryWon || inDialog()) return;
    peekUsed = peeking = true;
    memoryMessage('借你看一眼。记好之后，就要把牌合上啦。');
    renderMemory();
    const thisRound = memoryRound;
    peekTimer = setTimeout(() => {
      if (thisRound !== memoryRound) return;
      peekTimer = undefined;
      peeking = false;
      renderMemory();
      memoryMessage('合上了。看看还记得几位。');
    }, 1300);
  });
  memoryBoard.addEventListener('keydown', event => {
    const steps = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -4, ArrowDown: 4 };
    if (!Object.hasOwn(steps, event.key) || inDialog()) return;
    const cards = [...memoryBoard.children];
    const current = cards.indexOf(event.target.closest('.arcade-memory-card'));
    if (current < 0) return;
    event.preventDefault();
    for (let offset = 1; offset <= cards.length; offset++) {
      const next = (current + steps[event.key] * offset + cards.length * cards.length) % cards.length;
      if (!cards[next].disabled) { cards[next].focus(); break; }
    }
  });

  const flagRoot = root.querySelector('.arcade-flag');
  const flagBoard = root.querySelector('.arcade-flag-board');
  const flagStart = root.querySelector('[data-flag-start]');
  const flagPause = root.querySelector('[data-flag-pause]');
  const flagRestart = root.querySelector('[data-flag-restart]');
  const flagFeedback = root.querySelector('[data-flag-feedback]');
  const flagMeter = root.querySelector('[data-flag-meter]');
  const flagOverlay = root.querySelector('[data-flag-overlay]');
  const flagButtons = [];
  const duration = 20000, goal = 12;
  let phase = 'idle', score = 0, combo = 0, roundBestCombo = 0, remaining = duration;
  let deadline = 0, flagTimer, waveTimer, flagRound = 0, wave = 0, realSlot = -1, decoySlot = -1, keyboardMode = false;
  function hideFlags() { flagButtons.forEach(button => { button.hidden = true; }); realSlot = decoySlot = -1; }
  function clearFlagTimers() { clearTimeout(flagTimer); clearTimeout(waveTimer); flagTimer = waveTimer = undefined; }
  function renderFlag() {
    setText('[data-flag-score]', score);
    setText('[data-flag-goal]', goal);
    setText('[data-flag-combo]', combo);
    const seconds = String(Math.ceil(Math.max(0, remaining) / 1000));
    if (root.querySelector('[data-flag-time]').textContent !== seconds) setText('[data-flag-time]', seconds);
    if (flagMeter) { flagMeter.value = Math.max(0, remaining) / 1000; flagMeter.setAttribute('aria-label', '剩余 ' + seconds + ' 秒'); }
    flagStart.disabled = phase === 'running';
    flagStart.textContent = phase === 'idle' ? '开始收件' : phase === 'paused' ? '继续这局' : phase === 'running' ? '收件中…' : '再来一局';
    if (flagPause) flagPause.hidden = phase !== 'running';
    flagBoard.dataset.phase = phase;
    if (flagOverlay) {
      flagOverlay.hidden = phase === 'running';
      flagOverlay.textContent = phase === 'paused' ? '歇一会儿 · 准备好再继续' : phase === 'won' ? '这一批，全部收到了。' : phase === 'lost' ? '收件时间到了。' : '等你按下开始';
    }
  }
  function flagMessage(message, success = false) {
    flagFeedback.textContent = message;
    flagFeedback.classList.toggle('is-success', success);
  }
  function finishFlag(success) {
    if (phase !== 'running') return;
    phase = success ? 'won' : 'lost';
    flagRound++;
    clearFlagTimers();
    hideFlags();
    renderFlag();
    if (success) {
      updateRecords({ flagCombo: roundBestCombo });
      flagMessage('长门：收件完成。最高连续命中 ' + roundBestCombo + ' 次。', true);
      celebrate(flagRoot);
    } else flagMessage('长门：时间已到。收到 ' + score + ' / ' + goal + ' 分，下一批可以再试。');
    if (keyboardMode && !inDialog() && document.visibilityState !== 'hidden') flagStart.focus({ preventScroll: true });
  }
  function tickFlag() {
    if (phase !== 'running') return;
    remaining = Math.max(0, deadline - performance.now());
    renderFlag();
    if (!remaining) { finishFlag(false); return; }
    const thisRound = flagRound;
    flagTimer = setTimeout(() => { if (thisRound === flagRound) tickFlag(); }, Math.min(125, remaining));
  }
  function showWave(exclude = []) {
    if (phase !== 'running') return;
    clearTimeout(waveTimer);
    const slots = shuffled(flagButtons.map((_, index) => index).filter(index => !exclude.includes(index)));
    hideFlags();
    realSlot = slots[0];
    decoySlot = slots[1];
    wave++;
    const thisWave = wave, thisRound = flagRound;
    const gold = (combo + 1) % 4 === 0;
    const real = flagButtons[realSlot], decoy = flagButtons[decoySlot];
    real.dataset.targetKind = gold ? 'gold' : 'flag';
    real.dataset.wave = String(thisWave);
    real.innerHTML = gold ? '<span aria-hidden="true">✦</span><span>flag +2</span>' : '<span aria-hidden="true">⚑</span><span>flag</span>';
    real.setAttribute('aria-label', gold ? '金色 flag，收下获得两分' : 'flag，收下获得一分');
    decoy.dataset.targetKind = 'decoy';
    decoy.dataset.wave = String(thisWave);
    decoy.innerHTML = '<span aria-hidden="true">?</span><span>404</span>';
    decoy.setAttribute('aria-label', '404 乱码，点中会扣一分并中断连击');
    real.hidden = decoy.hidden = false;
    if (keyboardMode && !inDialog() && document.visibilityState !== 'hidden') real.focus({ preventScroll: true });
    waveTimer = setTimeout(() => {
      if (phase !== 'running' || thisRound !== flagRound || thisWave !== wave) return;
      const previous = [realSlot, decoySlot];
      combo = 0;
      renderFlag();
      flagMessage('刚才那封溜走了。下一封，认准 flag。');
      showWave(previous);
    }, Math.max(950, 1650 - combo * 55));
  }
  function catchFlag(index, event) {
    const button = flagButtons[index];
    if (phase !== 'running' || button.hidden || Number(button.dataset.wave) !== wave || inDialog()) return;
    if (performance.now() >= deadline) { tickFlag(); return; }
    if (index !== realSlot && index !== decoySlot) return;
    const previous = [realSlot, decoySlot], kind = button.dataset.targetKind;
    // Consume the old wave first; repeated clicks on that slot cannot score again.
    clearTimeout(waveTimer);
    hideFlags();
    keyboardMode = event.detail === 0;
    if (kind === 'decoy') {
      score = Math.max(0, score - 1);
      combo = 0;
      flagMessage('这是 404，不是信。扣一分，下一封看清再点。');
    } else {
      score += kind === 'gold' ? 2 : 1;
      combo++;
      roundBestCombo = Math.max(roundBestCombo, combo);
      flagMessage(kind === 'gold' ? '连续四封都收对了。金色 flag，加两分。' : '收到。连续命中 ' + combo + ' 次。');
    }
    remaining = Math.max(0, deadline - performance.now());
    renderFlag();
    if (score >= goal) finishFlag(true);
    else showWave(previous);
  }
  function pauseFlag(message = '先歇会儿，回来可以接着收。') {
    if (phase !== 'running') return;
    remaining = Math.max(0, deadline - performance.now());
    if (!remaining) { finishFlag(false); return; }
    phase = 'paused';
    flagRound++;
    clearFlagTimers();
    hideFlags();
    renderFlag();
    flagMessage(message);
  }
  function resetFlag() {
    flagRound++;
    clearFlagTimers();
    hideFlags();
    phase = 'idle';
    score = combo = roundBestCombo = 0;
    remaining = duration;
    flagRoot.classList.remove('is-complete');
    renderFlag();
    flagMessage('只收 flag，404 留在原地。连中四次，就会遇到一封金色信。');
    renderRecords();
  }
  for (let i = 0; i < 12; i++) {
    const cell = document.createElement('div');
    cell.className = 'arcade-flag-cell';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'arcade-flag-target';
    button.dataset.flagSlot = String(i);
    button.hidden = true;
    button.addEventListener('click', event => catchFlag(i, event));
    flagButtons.push(button);
    cell.append(button);
    flagBoard.append(cell);
  }
  flagStart.addEventListener('click', event => {
    if (phase === 'running' || inDialog() || document.visibilityState === 'hidden') return;
    keyboardMode = event.detail === 0;
    if (phase !== 'paused') resetFlag();
    phase = 'running';
    flagRound++;
    deadline = performance.now() + remaining;
    flagMessage('长门：开始接收。识别到 flag 时，请点击。');
    renderFlag();
    showWave();
    tickFlag();
  });
  flagPause?.addEventListener('click', () => { pauseFlag(); flagStart.focus({ preventScroll: true }); });
  flagRestart?.addEventListener('click', () => { resetFlag(); flagStart.focus({ preventScroll: true }); });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'hidden') return;
    settleMemory();
    pauseFlag('刚刚离开了一下。这局暂停了，回来按继续就好。');
  });
  window.addEventListener('blog:panel', event => {
    if (event.detail?.open) { settleMemory(); pauseFlag('先逛逛别处，这局替你暂停了。'); }
  });
  window.addEventListener('pagehide', () => { settleMemory(); pauseFlag('回来以后，按继续就能接着收。'); });
  window.addEventListener('storage', event => {
    if (event.key === RECORD_KEY || event.key === null) { records = readRecords(); renderRecords(); }
  });
  resetMemory();
  resetFlag();
})();
