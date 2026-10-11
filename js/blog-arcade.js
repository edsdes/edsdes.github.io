/* Two independent little arcade games. No timers run until somebody plays. */
(() => {
  'use strict';
  const root = document.querySelector('.blog-arcade');
  if (!root || root.dataset.arcadeReady) return;
  root.dataset.arcadeReady = '1';
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cheers = new Map();
  function stopCheer(scope) {
    const entry = cheers.get(scope);
    if (!entry) return;
    clearTimeout(entry.timer);
    entry.element.remove();
    cheers.delete(scope);
  }
  function celebrate(scope) {
    try { window.BlogAdventure?.discover('arcade'); } catch (_) {}
    stopCheer(scope);
    if (reduced()) return;
    const cheer = document.createElement('span');
    cheer.className = 'arcade-cheer';
    cheer.textContent = '✦ NICE!';
    cheer.setAttribute('aria-hidden', 'true');
    scope.append(cheer);
    const timer = setTimeout(() => { cheer.remove(); cheers.delete(scope); }, 950);
    cheers.set(scope, { timer, element: cheer });
  }

  const memoryRoot = root.querySelector('.arcade-memory');
  const memoryBoard = root.querySelector('.arcade-memory-board');
  const memoryMoves = root.querySelector('[data-memory-moves]');
  const memoryPairs = root.querySelector('[data-memory-pairs]');
  const memoryFeedback = root.querySelector('[data-memory-feedback]');
  const kinds = [
    { id: 'anemo', symbol: '🍃', name: '风元素' },
    { id: 'pyro', symbol: '🔥', name: '火元素' },
    { id: 'electro', symbol: 'ϟ', name: '雷元素' },
    { id: 'cryo', symbol: '❄', name: '冰元素' }
  ];
  let deck = [], open = [], matched = new Set(), moves = 0, pairs = 0, locked = false, pairTimer;
  function renderMemory() {
    [...memoryBoard.children].forEach((card, index) => {
      const faceUp = open.includes(index) || matched.has(index);
      card.classList.toggle('is-open', faceUp);
      card.classList.toggle('is-matched', matched.has(index));
      card.disabled = matched.has(index);
      card.setAttribute('aria-pressed', String(faceUp));
      card.setAttribute('aria-label', '第 ' + (index + 1) + ' 张，' + (faceUp ? deck[index].name : '未翻开') + (matched.has(index) ? '，已配对' : ''));
      card.querySelector('.arcade-card-symbol').textContent = faceUp ? deck[index].symbol : '?';
      card.querySelector('.arcade-card-label').textContent = matched.has(index) ? '✓ 已配对' : faceUp ? deck[index].name : '翻开';
    });
    memoryMoves.textContent = String(moves);
    memoryPairs.textContent = String(pairs);
  }
  function flip(index, keyboard) {
    if (locked || matched.has(index) || open.includes(index)) return;
    open.push(index);
    renderMemory();
    if (open.length === 1) {
      memoryFeedback.textContent = '翻开了' + deck[index].name + '，再选一张试试。';
      return;
    }
    moves++;
    locked = true;
    renderMemory();
    const [first, second] = open;
    const same = deck[first].id === deck[second].id;
    if (same) {
      matched.add(first);
      matched.add(second);
      pairs++;
      renderMemory();
      memoryFeedback.textContent = '找到一对' + deck[first].name + '！还有 ' + (4 - pairs) + ' 对。';
    } else memoryFeedback.textContent = '它们不是一对，记住位置，下次再来。';
    pairTimer = setTimeout(() => {
      pairTimer = undefined;
      open = [];
      locked = false;
      renderMemory();
      if (same && keyboard) {
        const nextCard = [...memoryBoard.children].find(card => !card.disabled);
        (nextCard || root.querySelector('.arcade-memory-restart')).focus({ preventScroll: true });
      }
      if (pairs === 4) {
        memoryFeedback.textContent = '元素共鸣！四种元素都找到了搭档，用了 ' + moves + ' 步，摸鱼功力 +1。';
        memoryFeedback.classList.add('is-success');
        celebrate(memoryRoot);
      }
    }, same ? 250 : 700);
  }
  function resetMemory() {
    clearTimeout(pairTimer);
    pairTimer = undefined;
    stopCheer(memoryRoot);
    deck = [...kinds, ...kinds];
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    open = [];
    matched = new Set();
    moves = 0;
    pairs = 0;
    locked = false;
    memoryFeedback.classList.remove('is-success');
    memoryFeedback.textContent = '洗好牌啦。点两张卡片，看看能不能触发元素共鸣。';
    memoryBoard.replaceChildren();
    deck.forEach((kind, index) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'arcade-memory-card';
      card.dataset.cardIndex = String(index);
      card.dataset.cardKind = kind.id;
      const symbol = document.createElement('span');
      symbol.className = 'arcade-card-symbol';
      symbol.setAttribute('aria-hidden', 'true');
      const label = document.createElement('span');
      label.className = 'arcade-card-label';
      label.setAttribute('aria-hidden', 'true');
      card.append(symbol, label);
      card.addEventListener('click', event => { if (card.isConnected) flip(index, event.detail === 0); });
      memoryBoard.append(card);
    });
    renderMemory();
  }
  root.querySelector('.arcade-memory-restart').addEventListener('click', resetMemory);

  const flagRoot = root.querySelector('.arcade-flag');
  const flagBoard = root.querySelector('.arcade-flag-board');
  const flagStart = root.querySelector('[data-flag-start]');
  const flagScore = root.querySelector('[data-flag-score]');
  const flagTime = root.querySelector('[data-flag-time]');
  const flagFeedback = root.querySelector('[data-flag-feedback]');
  const flagButtons = [];
  const duration = 12000, goal = 6;
  let running = false, score = 0, active = -1, deadline = 0, flagTimer;
  function hideFlags() { flagButtons.forEach(button => { button.hidden = true; }); active = -1; }
  function endFlag(success, message) {
    const returnFocus = flagButtons.includes(document.activeElement);
    running = false;
    clearTimeout(flagTimer);
    flagTimer = undefined;
    hideFlags();
    flagStart.disabled = false;
    flagStart.textContent = '再来一局';
    if (returnFocus && document.visibilityState !== 'hidden') flagStart.focus({ preventScroll: true });
    flagFeedback.textContent = message;
    flagFeedback.classList.toggle('is-success', success);
    if (success) celebrate(flagRoot);
  }
  function tickFlag() {
    if (!running) return;
    const remaining = Math.max(0, deadline - Date.now());
    flagTime.textContent = String(Math.ceil(remaining / 1000));
    if (!remaining) {
      endFlag(false, '时间到！抓到了 ' + score + ' / ' + goal + ' 次，再来一局，这次一定。');
      return;
    }
    flagTimer = setTimeout(tickFlag, Math.min(200, remaining));
  }
  function showFlag(previous, keyboard) {
    const options = flagButtons.map((_, i) => i).filter(i => i !== previous);
    active = options[Math.floor(Math.random() * options.length)];
    const button = flagButtons[active];
    button.hidden = false;
    if (keyboard) button.focus({ preventScroll: true });
  }
  function catchFlag(index, event) {
    if (!running || index !== active || flagButtons[index].hidden) return;
    if (Date.now() >= deadline) { tickFlag(); return; }
    // Hide this target before counting, so a second click cannot catch it twice.
    flagButtons[index].hidden = true;
    active = -1;
    score++;
    flagScore.textContent = String(score);
    if (score >= goal) {
      flagTime.textContent = String(Math.ceil(Math.max(0, deadline - Date.now()) / 1000));
      endFlag(true, '星辉收集完成！六只 flag 一个没跑掉，冒险家的反应不错嘛。');
    } else showFlag(index, event.detail === 0);
  }
  for (let i = 0; i < 12; i++) {
    const cell = document.createElement('div');
    cell.className = 'arcade-flag-cell';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'arcade-flag-target';
    button.dataset.flagSlot = String(i);
    button.hidden = true;
    button.setAttribute('aria-label', '抓住星辉 flag');
    button.innerHTML = '<span aria-hidden="true">✦</span><span>flag</span>';
    button.addEventListener('click', event => catchFlag(i, event));
    flagButtons.push(button);
    cell.append(button);
    flagBoard.append(cell);
  }
  flagStart.addEventListener('click', event => {
    if (running) return;
    clearTimeout(flagTimer);
    stopCheer(flagRoot);
    hideFlags();
    score = 0;
    flagScore.textContent = '0';
    flagTime.textContent = '12';
    flagFeedback.classList.remove('is-success');
    flagFeedback.textContent = '开始！找到旗子就点它，抓满 6 次。';
    flagStart.disabled = true;
    flagStart.textContent = '这一局正在进行…';
    running = true;
    deadline = Date.now() + duration;
    showFlag(-1, event.detail === 0);
    tickFlag();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && running) {
      flagTime.textContent = String(Math.ceil(Math.max(0, deadline - Date.now()) / 1000));
      endFlag(false, '刚刚切走了，这局先收工。准备好再按开始，不着急。');
    }
  });
  window.addEventListener('pagehide', () => {
    clearTimeout(pairTimer);
    pairTimer = undefined;
    open = [];
    locked = false;
    renderMemory();
    if (running) endFlag(false, '回来啦，准备好可以再开一局。');
    else clearTimeout(flagTimer);
    [...cheers.keys()].forEach(stopCheer);
  });
  resetMemory();
})();



