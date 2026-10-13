/* Small clubroom games. Every timer belongs to the round that created it. */
(() => {
  'use strict';
  const root = document.querySelector('.blog-arcade');
  if (!root || root.dataset.arcadeReady) return;
  root.dataset.arcadeReady = '1';
  const RECORD_KEY = 'blog-arcade-records-v1';
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const inDialog = () => !!document.querySelector('dialog[open]');
  const available = () => !inDialog() && document.visibilityState !== 'hidden';
  const characters = [
    { id: 'haruhi', slot: 0, name: '春日', line: '团长到了。人齐了就开始今天的活动！' },
    { id: 'konata', slot: 1, name: '此方', line: '点完名以后，可以继续打游戏了吗？' },
    { id: 'kurisu', slot: 2, name: '红莉栖', line: '只是记忆测试而已，别把事情想得太复杂。' },
    { id: 'yuki', slot: 3, name: '长门有希', line: '确认。还有其他成员。' },
    { id: 'misaka', slot: 4, name: '御坂美琴', line: '找到了。下一张也不会认错的。' },
    { id: 'azusa', slot: 5, name: '中野梓', line: '大家到齐之后，记得认真练习啊。' },
    { id: 'kuroneko', slot: 6, name: '黑猫', line: '这张牌的封印，已经解开了。' },
    { id: 'yui', slot: 7, portrait: '/img/easter-eggs/yui-room-portrait.webp', name: '平泽唯', line: '啊，找到了！现在可以吃蛋糕了吗？' }
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
    element.classList.toggle('arcade-portrait-solo', !!character.portrait);
    if (character.portrait) element.style.setProperty('--portrait-image', 'url("' + character.portrait + '")');
    else element.style.removeProperty('--portrait-image');
    element.style.setProperty('--portrait-x', (character.slot % 4) * (100 / 3) + '%');
    element.style.setProperty('--portrait-y', character.slot < 4 ? '0%' : '100%');
    element.textContent = character.name.slice(0, 1);
  }
  function readRecords() {
    try {
      const data = JSON.parse(localStorage.getItem(RECORD_KEY) || '{}');
      const moves = (value, minimum, maximum = 1000000) => Number.isInteger(value) && value >= minimum && value <= maximum ? value : null;
      const bounded = (value, maximum) => Number.isInteger(value) && value >= 0 && value <= maximum ? value : 0;
      return { memory4: moves(data?.memory4, 4), memory6: moves(data?.memory6, 6), memoryExam: moves(data?.memoryExam, 6, 12), flagCombo: bounded(data?.flagCombo, 12), musicRounds: bounded(data?.musicRounds, 5) };
    } catch (_) { return { memory4: null, memory6: null, memoryExam: null, flagCombo: 0, musicRounds: 0 }; }
  }
  let records = readRecords();
  function updateRecords(update) {
    const stored = readRecords();
    for (const key of ['memory4', 'memory6', 'memoryExam']) {
      const values = [records[key], stored[key], update[key]].filter(value => Number.isInteger(value));
      records[key] = values.length ? Math.min(...values) : null;
    }
    records.flagCombo = Math.max(records.flagCombo, stored.flagCombo, update.flagCombo || 0);
    records.musicRounds = Math.max(records.musicRounds, stored.musicRounds, update.musicRounds || 0);
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
  const yuiImage = new Image();
  yuiImage.onload = () => root.classList.add('has-yui-portrait');
  yuiImage.onerror = () => {
    const note = root.querySelector('[data-portrait-note]');
    if (note) { note.hidden = false; note.textContent = '有张头像暂时没载到，名字还在，照样能玩。'; }
  };
  yuiImage.src = '/img/easter-eggs/yui-room-portrait.webp';

  const memoryRoot = root.querySelector('.arcade-memory');
  const memoryBoard = root.querySelector('.arcade-memory-board');
  const memoryFeedback = root.querySelector('[data-memory-feedback]');
  const memoryPortrait = root.querySelector('[data-memory-portrait]');
  const peekButton = root.querySelector('[data-memory-peek]');
  const modeButtons = [...root.querySelectorAll('[data-memory-mode]')];
  let memoryMode = '4', pairCount = 4, deck = [], open = [], matched = new Set(), moves = 0, pairs = 0;
  let locked = false, peeking = false, peekUsed = false, memoryWon = false, memoryLost = false, examPreviewPending = false;
  let pairTimer, peekTimer, memoryRound = 0;
  const memoryRecordKey = () => memoryMode === 'exam' ? 'memoryExam' : 'memory' + pairCount;
  function renderRecords() {
    setText('[data-memory-best]', records[memoryRecordKey()] ?? '—');
    setText('[data-flag-best]', records.flagCombo || '—');
    setText('[data-music-best]', records.musicRounds || '—');
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
      card.disabled = memoryLost || matched.has(index);
      card.setAttribute('aria-pressed', String(faceUp));
      card.setAttribute('aria-label', '第 ' + (index + 1) + ' 张，' + (faceUp ? deck[index].name : '未翻开') + (matched.has(index) ? '，已配对' : ''));
      card.querySelector('.arcade-card-label').textContent = matched.has(index) ? '✓ ' + deck[index].name : faceUp ? deck[index].name : '部室';
    });
    setText('[data-memory-moves]', moves);
    setText('[data-memory-pairs]', pairs);
    setText('[data-memory-total]', pairCount);
    setText('[data-memory-limit]', memoryMode === 'exam' ? ' / 12' : '');
    memoryBoard.setAttribute('aria-label', '角色翻牌棋盘，共 ' + deck.length + ' 张卡片');
    memoryBoard.dataset.phase = memoryWon ? 'won' : memoryLost ? 'lost' : peeking ? 'preview' : 'playing';
    if (peekButton) {
      peekButton.hidden = memoryMode === 'exam';
      peekButton.disabled = peekUsed || locked || open.length > 0 || memoryWon || memoryLost;
      peekButton.textContent = peekUsed ? '这一局已经借看过了' : '借看一眼';
    }
  }
  function finishMemory() {
    if (memoryWon || memoryLost || pairs !== pairCount) return;
    memoryWon = true;
    const key = memoryRecordKey(), previousBest = records[key];
    updateRecords({ [key]: moves });
    memoryFeedback.classList.add('is-success');
    memoryMessage(memoryMode === 'exam' ? '小测通过！十二张牌，' + moves + ' 步找齐。去喝口茶吧。' : '全员到齐！用了 ' + moves + ' 步。' + (previousBest !== null && moves < previousBest ? '比上次少了几步。' : '洗一副牌，再换几位来。'), characters[0]);
    celebrate(memoryRoot);
  }
  function flip(index, keyboard) {
    if (locked || peeking || memoryWon || memoryLost || matched.has(index) || open.includes(index) || !available()) return;
    open.push(index);
    renderMemory();
    if (open.length === 1) { memoryMessage('翻到了' + deck[index].name + '。再找一张她的牌。', deck[index]); return; }
    moves++;
    locked = true;
    const [first, second] = open;
    const same = deck[first].id === deck[second].id;
    if (same) {
      matched.add(first); matched.add(second); pairs++;
      memoryMessage(deck[first].name + '：' + deck[first].line, deck[first]);
      finishMemory();
    } else memoryMessage('记住这两个位置。她们还没找到各自的搭档。');
    if (memoryMode === 'exam' && moves >= 12 && !memoryWon) {
      memoryLost = true;
      memoryMessage('十二步用完了。这次找齐 ' + pairs + ' 对。再洗一副，开头那两秒仔细看。');
    }
    renderMemory();
    const thisRound = memoryRound;
    pairTimer = setTimeout(() => {
      if (thisRound !== memoryRound) return;
      pairTimer = undefined; open = []; locked = false;
      renderMemory();
      if (same && keyboard && available()) {
        const next = [...memoryBoard.children].find(card => !card.disabled);
        (next || root.querySelector('.arcade-memory-restart')).focus({ preventScroll: true });
      }
    }, same ? (reduced() ? 0 : 220) : 720);
  }
  function settleMemory() {
    clearTimeout(pairTimer); clearTimeout(peekTimer);
    pairTimer = peekTimer = undefined; memoryRound++;
    open = []; peeking = examPreviewPending; locked = false;
    if (deck.length) renderMemory();
  }
  function startExamPreview() {
    if (!examPreviewPending || !available() || peekTimer !== undefined) return;
    clearTimeout(peekTimer);
    const thisRound = memoryRound;
    peeking = true;
    renderMemory();
    peekTimer = setTimeout(() => {
      if (thisRound !== memoryRound) return;
      peekTimer = undefined; peeking = false; examPreviewPending = false;
      renderMemory();
      memoryMessage('合上了。十二步以内，找齐六对就通过。');
    }, 2000);
  }
  function resetMemory() {
    examPreviewPending = false;
    settleMemory();
    const chosen = shuffled(characters).slice(0, pairCount);
    deck = shuffled([...chosen, ...chosen]);
    open = []; matched = new Set(); moves = pairs = 0;
    locked = peeking = peekUsed = memoryWon = memoryLost = false;
    memoryRoot.classList.remove('is-complete');
    memoryFeedback.classList.remove('is-success');
    memoryMessage(memoryMode === 'exam' ? '闭卷小测：先免费看两秒，再用十二步找齐六对。' : '洗好牌了。这局有 ' + pairCount + ' 位客人，试着把她们找齐。');
    memoryBoard.replaceChildren();
    deck.forEach((character, index) => {
      const card = document.createElement('button');
      card.type = 'button'; card.className = 'arcade-memory-card';
      card.dataset.cardIndex = String(index); card.dataset.cardKind = character.id;
      const face = document.createElement('span');
      face.className = 'arcade-card-portrait'; face.setAttribute('aria-hidden', 'true'); paintPortrait(face, character);
      const back = document.createElement('span');
      back.className = 'arcade-card-back'; back.textContent = '？'; back.setAttribute('aria-hidden', 'true');
      const label = document.createElement('span');
      label.className = 'arcade-card-label'; label.setAttribute('aria-hidden', 'true');
      card.append(face, back, label);
      card.addEventListener('click', event => { if (card.isConnected) flip(index, event.detail === 0); });
      memoryBoard.append(card);
    });
    modeButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.memoryMode === memoryMode)));
    if (memoryMode === 'exam') { examPreviewPending = peeking = true; startExamPreview(); }
    renderMemory(); renderRecords();
  }
  modeButtons.forEach(button => button.addEventListener('click', () => {
    const next = button.dataset.memoryMode;
    if (!['4', '6', 'exam'].includes(next) || next === memoryMode) return;
    memoryMode = next; pairCount = next === '4' ? 4 : 6;
    resetMemory();
  }));
  root.querySelector('.arcade-memory-restart').addEventListener('click', resetMemory);
  peekButton?.addEventListener('click', () => {
    if (memoryMode === 'exam' || peekUsed || locked || open.length || memoryWon || memoryLost || !available()) return;
    peekUsed = peeking = true;
    memoryMessage('借你看一眼。记好之后，就要把牌合上啦。');
    renderMemory();
    const thisRound = memoryRound;
    peekTimer = setTimeout(() => {
      if (thisRound !== memoryRound) return;
      peekTimer = undefined; peeking = false;
      renderMemory(); memoryMessage('合上了。看看还记得几位。');
    }, 1300);
  });
  memoryBoard.addEventListener('keydown', event => {
    const steps = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -4, ArrowDown: 4 };
    if (!Object.hasOwn(steps, event.key) || !available()) return;
    const cards = [...memoryBoard.children], current = cards.indexOf(event.target.closest('.arcade-memory-card'));
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
  let deadline = 0, flagTimer, waveTimer, flagRound = 0, wave = 0, realSlot = -1, decoySlot = -1, teaSlot = -1, teaOffered = false, teaUsed = false, keyboardMode = false;
  function hideFlags() { flagButtons.forEach(button => { button.hidden = true; }); realSlot = decoySlot = teaSlot = -1; }
  function clearFlagTimers() { clearTimeout(flagTimer); clearTimeout(waveTimer); flagTimer = waveTimer = undefined; }
  function renderFlag() {
    setText('[data-flag-score]', score); setText('[data-flag-goal]', goal); setText('[data-flag-combo]', combo);
    const seconds = String(Math.ceil(Math.max(0, remaining) / 1000));
    if (root.querySelector('[data-flag-time]').textContent !== seconds) setText('[data-flag-time]', seconds);
    if (flagMeter) { flagMeter.value = Math.min(20, Math.max(0, remaining) / 1000); flagMeter.setAttribute('aria-label', '剩余 ' + seconds + ' 秒'); }
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
    phase = success ? 'won' : 'lost'; flagRound++;
    clearFlagTimers(); hideFlags(); renderFlag();
    if (success) {
      updateRecords({ flagCombo: roundBestCombo });
      flagMessage('长门：收件完成。最高连续命中 ' + roundBestCombo + ' 次。', true);
      celebrate(flagRoot);
    } else flagMessage('长门：时间已到。收到 ' + score + ' / ' + goal + ' 分，下一批可以再试。');
    if (keyboardMode && available()) flagStart.focus({ preventScroll: true });
  }
  function tickFlag() {
    if (phase !== 'running') return;
    remaining = Math.max(0, deadline - performance.now()); renderFlag();
    if (!remaining) { finishFlag(false); return; }
    const thisRound = flagRound;
    flagTimer = setTimeout(() => { if (thisRound === flagRound) tickFlag(); }, Math.min(125, remaining));
  }
  function showWave(exclude = []) {
    if (phase !== 'running') return;
    clearTimeout(waveTimer);
    const slots = shuffled(flagButtons.map((_, index) => index).filter(index => !exclude.includes(index)));
    hideFlags(); realSlot = slots[0]; decoySlot = slots[1]; wave++;
    const thisWave = wave, thisRound = flagRound, gold = (combo + 1) % 4 === 0;
    const real = flagButtons[realSlot], decoy = flagButtons[decoySlot];
    real.dataset.targetKind = gold ? 'gold' : 'flag'; real.dataset.wave = String(thisWave);
    real.innerHTML = gold ? '<span aria-hidden="true">✦</span><span>flag +2</span>' : '<span aria-hidden="true">⚑</span><span>flag</span>';
    real.setAttribute('aria-label', gold ? '金色 flag，收下获得两分' : 'flag，收下获得一分');
    decoy.dataset.targetKind = 'decoy'; decoy.dataset.wave = String(thisWave);
    decoy.innerHTML = '<span aria-hidden="true">?</span><span>404</span>';
    decoy.setAttribute('aria-label', '404 乱码，点中会扣一分并中断连击');
    real.hidden = decoy.hidden = false;
    if (wave >= 3 && !teaOffered) {
      teaOffered = true; teaSlot = slots[2];
      const tea = flagButtons[teaSlot];
      tea.dataset.targetKind = 'tea'; tea.dataset.wave = String(thisWave);
      tea.innerHTML = '<span aria-hidden="true">☕</span><span>续两秒</span>';
      tea.setAttribute('aria-label', '茶水，剩余时间增加两秒，每局一次');
      tea.hidden = false;
    }
    if (keyboardMode && available()) real.focus({ preventScroll: true });
    waveTimer = setTimeout(() => {
      if (phase !== 'running' || thisRound !== flagRound || thisWave !== wave) return;
      const previous = [realSlot, decoySlot, teaSlot];
      combo = 0; renderFlag();
      flagMessage('刚才那封溜走了。下一封，认准 flag。');
      showWave(previous);
    }, Math.max(950, 1650 - combo * 55));
  }
  function catchFlag(index, event) {
    const button = flagButtons[index];
    if (phase !== 'running' || button.hidden || Number(button.dataset.wave) !== wave || !available()) return;
    if (performance.now() >= deadline) { tickFlag(); return; }
    if (index !== realSlot && index !== decoySlot && index !== teaSlot) return;
    keyboardMode = event.detail === 0;
    const kind = button.dataset.targetKind;
    if (kind === 'tea') {
      if (teaUsed || index !== teaSlot) return;
      teaUsed = true; button.hidden = true; teaSlot = -1;
      deadline += 2000; remaining = Math.max(0, deadline - performance.now());
      renderFlag(); flagMessage('长门：茶已收到。多留两秒，连击继续。');
      if (keyboardMode && available()) flagButtons[realSlot].focus({ preventScroll: true });
      return;
    }
    const previous = [realSlot, decoySlot, teaSlot];
    clearTimeout(waveTimer); hideFlags();
    if (kind === 'decoy') { score = Math.max(0, score - 1); combo = 0; flagMessage('这是 404，不是信。扣一分，下一封看清再点。'); }
    else {
      score += kind === 'gold' ? 2 : 1; combo++;
      roundBestCombo = Math.max(roundBestCombo, combo);
      flagMessage(kind === 'gold' ? '连续四封都收对了。金色 flag，加两分。' : '收到。连续命中 ' + combo + ' 次。');
    }
    remaining = Math.max(0, deadline - performance.now()); renderFlag();
    if (score >= goal) finishFlag(true);
    else showWave(previous);
  }
  function pauseFlag(message = '先歇会儿，回来可以接着收。') {
    if (phase !== 'running') return;
    remaining = Math.max(0, deadline - performance.now());
    if (!remaining) { finishFlag(false); return; }
    phase = 'paused'; flagRound++;
    clearFlagTimers(); hideFlags(); renderFlag(); flagMessage(message);
  }
  function resetFlag() {
    flagRound++; clearFlagTimers(); hideFlags();
    phase = 'idle'; score = combo = roundBestCombo = wave = 0; teaOffered = teaUsed = false; remaining = duration;
    flagRoot.classList.remove('is-complete');
    renderFlag(); flagMessage('只收 flag，404 留在原地。路过的茶水能续两秒，每局只有一杯。'); renderRecords();
  }
  for (let i = 0; i < 12; i++) {
    const cell = document.createElement('div'); cell.className = 'arcade-flag-cell';
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'arcade-flag-target'; button.dataset.flagSlot = String(i); button.hidden = true;
    button.addEventListener('click', event => catchFlag(i, event)); flagButtons.push(button); cell.append(button); flagBoard.append(cell);
  }
  flagStart.addEventListener('click', event => {
    if (phase === 'running' || !available()) return;
    keyboardMode = event.detail === 0;
    if (phase !== 'paused') resetFlag();
    phase = 'running'; flagRound++; deadline = performance.now() + remaining;
    flagMessage('长门：开始接收。识别到 flag 时，请点击。');
    renderFlag(); showWave(); tickFlag();
  });
  flagPause?.addEventListener('click', () => { pauseFlag(); flagStart.focus({ preventScroll: true }); });
  flagRestart?.addEventListener('click', () => { resetFlag(); flagStart.focus({ preventScroll: true }); });

  const musicRoot = root.querySelector('.arcade-music');
  const musicBoard = root.querySelector('[data-music-board]');
  const musicPads = [...root.querySelectorAll('[data-music-pad]')];
  musicBoard.tabIndex = 0;
  const musicStart = root.querySelector('[data-music-start]');
  const musicReplay = root.querySelector('[data-music-replay]');
  const musicRestart = root.querySelector('[data-music-restart]');
  const musicSound = root.querySelector('[data-music-sound]');
  const musicFeedback = root.querySelector('[data-music-feedback]');
  const noteNames = ['Do', 'Mi', 'Sol', 'La'];
  const frequencies = [261.63, 329.63, 392, 440];
  let musicPhase = 'idle', sequence = [], completedRounds = 0, inputIndex = 0, musicToken = 0, inputAfter = 0;
  let audioContext, soundEnabled = false, soundPending = false, soundRevision = 0, cancelSoundWait;
  const musicTimers = new Set(), voices = new Set();
  function musicLater(callback, delay, token = musicToken) {
    const timer = setTimeout(() => { musicTimers.delete(timer); if (token === musicToken) callback(); }, delay);
    musicTimers.add(timer); return timer;
  }
  function clearMusicTimers() {
    musicToken++; musicTimers.forEach(timer => clearTimeout(timer)); musicTimers.clear();
    musicPads.forEach(pad => pad.classList.remove('is-playing'));
    voices.forEach(voice => { try { voice.stop(); } catch (_) {} }); voices.clear();
  }
  function musicMessage(text) { musicFeedback.textContent = text; }
  function renderMusic() {
    musicBoard.dataset.phase = musicPhase;
    setText('[data-music-round]', musicPhase === 'won' ? 5 : Math.min(5, completedRounds + 1));
    setText('[data-music-input]', inputIndex);
    setText('[data-music-length]', sequence.length || 2);
    musicPads.forEach(pad => { pad.disabled = musicPhase !== 'input'; pad.setAttribute('aria-pressed', String(pad.classList.contains('is-playing'))); });
    musicStart.hidden = musicPhase === 'input' || musicPhase === 'playing' || musicPhase === 'between';
    musicStart.textContent = musicPhase === 'paused' ? '重播这一轮' : musicPhase === 'won' || musicPhase === 'lost' ? '再练一次' : '听梓示范';
    musicReplay.disabled = !['input', 'paused'].includes(musicPhase);
    musicSound.disabled = soundPending;
    musicSound.setAttribute('aria-pressed', String(soundEnabled));
    musicSound.textContent = soundPending ? '声音打开中…' : soundEnabled ? '声音：开' : '声音：关';
  }
  function playTone(index) {
    if (!soundEnabled || !audioContext || audioContext.state !== 'running' || !available()) return;
    try {
      const voice = audioContext.createOscillator(), gain = audioContext.createGain(), now = audioContext.currentTime;
      voice.type = 'sine'; voice.frequency.value = frequencies[index]; gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(.035, now + .02); gain.gain.exponentialRampToValueAtTime(.001, now + .20);
      voice.connect(gain); gain.connect(audioContext.destination); voices.add(voice);
      voice.onended = () => { voices.delete(voice); voice.disconnect(); gain.disconnect(); };
      voice.start(now); voice.stop(now + .22);
    } catch (_) { soundEnabled = false; renderMusic(); musicMessage('声音暂时开不了，看琴键亮起的顺序也能练。'); }
  }
  function highlightNote(index, token = musicToken) {
    const pad = musicPads[index]; pad.classList.add('is-playing'); pad.setAttribute('aria-pressed', 'true');
    playTone(index);
    musicLater(() => { pad.classList.remove('is-playing'); pad.setAttribute('aria-pressed', String(pad.classList.contains('is-playing'))); }, 310, token);
  }
  function replayMusic() {
    if (!available() || !sequence.length) return;
    clearMusicTimers(); inputIndex = 0; inputAfter = 0; musicPhase = 'playing'; renderMusic();
    musicBoard.focus({ preventScroll: true });
    const token = musicToken;
    musicMessage('梓：先听我弹一遍。看好亮起的顺序。');
    sequence.forEach((note, index) => musicLater(() => {
      if (!available()) { pauseMusic(); return; }
      highlightNote(note, token);
      musicMessage('梓：' + (index + 1) + ' / ' + sequence.length + ' · ' + noteNames[note]);
    }, 400 + index * 520, token));
    musicLater(() => {
      if (!available()) { pauseMusic(); return; }
      musicPhase = 'input'; inputIndex = 0; inputAfter = performance.now(); renderMusic();
      musicMessage('轮到你啦。' + sequence.length + ' 个音，照顺序弹；键盘 1～4 也可以。');
    }, 400 + sequence.length * 520, token);
  }
  function resetMusic() {
    clearMusicTimers(); musicPhase = 'idle'; sequence = []; completedRounds = inputIndex = 0;
    musicRoot.classList.remove('is-complete'); musicFeedback.classList.remove('is-success');
    renderMusic(); renderRecords(); musicMessage('梓：先从两个音开始。没有开声音也能照亮起的顺序练。');
  }
  function startMusic() {
    if (!available() || ['input', 'playing', 'between'].includes(musicPhase)) return;
    if (musicPhase !== 'paused') {
      resetMusic(); sequence = [Math.floor(Math.random() * 4), Math.floor(Math.random() * 4)];
    }
    replayMusic();
  }
  function inputNote(index) {
    if (musicPhase !== 'input' || !available() || performance.now() < inputAfter) return;
    inputAfter = performance.now() + 150; highlightNote(index);
    if (sequence[inputIndex] !== index) {
      clearMusicTimers(); musicPhase = 'lost'; updateRecords({ musicRounds: completedRounds }); renderMusic();
      musicMessage('梓：刚才那个音走错啦。这次弹完 ' + completedRounds + ' 轮，重新来一遍？');
      return;
    }
    inputIndex++; renderMusic();
    if (inputIndex !== sequence.length) { musicMessage('梓：对，接着弹。' + inputIndex + ' / ' + sequence.length); return; }
    completedRounds++; updateRecords({ musicRounds: completedRounds });
    if (completedRounds === 5) {
      clearMusicTimers(); musicPhase = 'won'; renderMusic(); musicFeedback.classList.add('is-success');
      musicMessage('梓：五轮都接住了！这次可以放心去吃点心啦。'); celebrate(musicRoot); return;
    }
    musicPhase = 'between'; renderMusic(); musicMessage('这一轮对了。下一轮多一个音。');
    musicLater(() => {
      if (!available()) { pauseMusic(); return; }
      sequence.push(Math.floor(Math.random() * 4)); replayMusic();
    }, 750);
  }
  function pauseMusic() {
    if (!['playing', 'input', 'between'].includes(musicPhase)) return;
    // Completing a round and interrupting before its next preview keeps the next round intact.
    if (musicPhase === 'between') sequence.push(Math.floor(Math.random() * 4));
    clearMusicTimers(); musicPhase = 'paused'; inputIndex = 0; renderMusic();
    musicMessage('琴先放下了。回来点「重播这一轮」，从头听这一段。');
  }
  musicPads.forEach((pad, index) => pad.addEventListener('click', () => inputNote(index)));
  musicStart.addEventListener('click', startMusic);
  musicReplay.addEventListener('click', () => { if (['input', 'paused'].includes(musicPhase)) replayMusic(); });
  musicRestart.addEventListener('click', () => { resetMusic(); musicStart.focus({ preventScroll: true }); });
  function audioStatus(message) {
    const note = root.querySelector('[data-music-audio-note]');
    if (note) { note.textContent = message; note.hidden = !message; }
  }
  function cancelPendingSound() {
    soundRevision++;
    soundPending = false;
    if (cancelSoundWait) { const cancel = cancelSoundWait; cancelSoundWait = undefined; cancel(); }
    musicSound.disabled = false;
  }
  musicSound.addEventListener('click', async () => {
    if (soundPending || !available()) return;
    if (soundEnabled) {
      cancelPendingSound(); soundEnabled = false;
      voices.forEach(voice => { try { voice.stop(); } catch (_) {} }); voices.clear();
      audioStatus(''); renderMusic(); return;
    }
    const revision = ++soundRevision;
    soundPending = true; audioStatus(''); renderMusic();
    let resumeTimer, context;
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) throw new Error('Audio unavailable');
      if (!audioContext || audioContext.state === 'closed') audioContext = new Audio();
      context = audioContext;
      const limit = new Promise((_, reject) => {
        resumeTimer = setTimeout(() => reject(new Error('Audio resume timed out')), 500);
        cancelSoundWait = () => { clearTimeout(resumeTimer); reject(new Error('Audio resume cancelled')); };
      });
      await Promise.race([context.resume(), limit]);
      if (revision !== soundRevision || !available() || audioContext !== context) return;
      soundEnabled = context.state === 'running';
      if (!soundEnabled) audioStatus('声音暂时开不了，看琴键亮起的顺序也能练。');
    } catch (_) {
      if (revision === soundRevision && available()) {
        soundEnabled = false;
        audioStatus('声音暂时开不了，看琴键亮起的顺序也能练。');
      }
    } finally {
      clearTimeout(resumeTimer);
      if (revision === soundRevision) {
        cancelSoundWait = undefined; soundPending = false; renderMusic();
      }
    }
  });
  musicRoot.addEventListener('keydown', event => {
    if (event.repeat || event.altKey || event.ctrlKey || event.metaKey || !/^[1-4]$/.test(event.key) || event.target.closest('input, textarea, select') || !available()) return;
    event.preventDefault(); inputNote(Number(event.key) - 1);
  });
  function pauseAll(message) { cancelPendingSound(); settleMemory(); pauseFlag(message); pauseMusic(); renderMusic(); }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') pauseAll('刚刚离开了一下。这局暂停了，回来按继续就好。');
    else startExamPreview();
  });
  window.addEventListener('blog:panel', event => {
    if (event.detail?.open) pauseAll('先逛逛别处，这局替你暂停了。');
    else startExamPreview();
  });
  window.addEventListener('pagehide', () => {
    pauseAll('回来以后，按继续就能接着收。');
    if (audioContext) { const previous = audioContext; audioContext = undefined; previous.close().catch(() => {}); }
    soundEnabled = false; renderMusic();
  });
  window.addEventListener('pageshow', () => { if (available()) startExamPreview(); });
  window.addEventListener('storage', event => {
    if (event.key === RECORD_KEY || event.key === null) { records = readRecords(); renderRecords(); }
  });
  resetMemory(); resetFlag(); resetMusic();
})();
