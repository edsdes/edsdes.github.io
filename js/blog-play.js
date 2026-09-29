/* Blog interaction trial: remove this file and its inject entry to disable. */
(() => {
  'use strict';
  if (window.__blogPlayInstalled) return;
  window.__blogPlayInstalled = true;
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let atomicLayer = null, atomicTimer, atomicCleanup, lastAtomic = 0, rocketBusy = false;
  const rocketSvg = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3C11 8 10 14 11 21h10c1-7 0-13-5-18Z" fill="currentColor"/><circle cx="16" cy="12" r="3" fill="var(--card-bg,#fff)"/><path d="m11 15-6 7v5l7-4m9-8 6 7v5l-7-4" fill="currentColor"/><path d="m13 24 3 6 3-6" fill="#ffb86b"/></svg>';
  function closeAtomic() {
    clearTimeout(atomicTimer);
    atomicCleanup?.();
    atomicCleanup = null;
    atomicLayer?.remove();
    atomicLayer = null;
  }
  function atomic() {
    if (atomicLayer || Date.now() - lastAtomic < 4000) return;
    lastAtomic = Date.now();
    const calm = reduced();
    const previousFocus = document.activeElement;
    const layer = document.createElement('div');
    atomicLayer = layer;
    layer.className = 'blog-atomic blog-atomic-video' + (calm ? ' is-reduced' : '');
    layer.dataset.phase = calm ? 'logo' : 'video';
    layer.setAttribute('role', 'dialog');
    layer.setAttribute('aria-modal', 'true');
    layer.setAttribute('aria-label', '暗影 I AM ATOMIC 原片彩蛋');
    layer.innerHTML =
      '<video class="blog-atomic-movie" playsinline preload="none" aria-label="暗影 I AM ATOMIC 动漫片段"></video>' +
      '<div class="blog-atomic-white" aria-hidden="true"></div>' +
      '<div class="blog-genshin-splash"><img src="/img/genshin-start-screen.png" alt="原神启动画面" width="1586" height="992" draggable="false"><span class="blog-genshin-fallback" hidden>原神</span></div>' +
      '<div class="blog-atomic-playback"><span class="blog-atomic-status" role="status">正在加载原片…</span><button class="blog-atomic-play" type="button" hidden>播放原片</button></div>' +
      '<div class="blog-atomic-controls"><button class="blog-atomic-sound" type="button" aria-pressed="false" title="静音">声音：开</button><button class="blog-atomic-skip" type="button">退出 · Esc</button></div>';
    const video = layer.querySelector('video');
    const skip = layer.querySelector('.blog-atomic-skip');
    const sound = layer.querySelector('.blog-atomic-sound');
    const play = layer.querySelector('.blog-atomic-play');
    const status = layer.querySelector('.blog-atomic-status');
    const playback = layer.querySelector('.blog-atomic-playback');
    const logo = layer.querySelector('.blog-genshin-splash img');
    const timers = [];
    let closed = false, finished = false, needsReload = false, loadTimer, frameHandle;
    let controlsTimer, keyboardControls = false;
    function scheduleControlsHide() {
      clearTimeout(controlsTimer);
      if (closed || keyboardControls || !playback.hidden) return;
      controlsTimer = setTimeout(() => {
        if (!closed && !keyboardControls && playback.hidden) layer.classList.add('controls-idle');
      }, 2000);
    }
    function showControls() {
      layer.classList.remove('controls-idle');
      scheduleControlsHide();
    }
    const after = (fn, delay) => timers.push(setTimeout(() => { if (!closed) fn(); }, delay));
    const showMessage = (message, canPlay = false) => {
      status.textContent = message;
      playback.hidden = false;
      play.hidden = !canPlay;
      showControls();
    };
    function finish() {
      if (closed || finished) return;
      finished = true;
      clearTimeout(loadTimer);
      // Let the original explosion audio finish naturally under the whiteout.
      playback.hidden = true;
      sound.hidden = true;
      scheduleControlsHide();
      layer.dataset.phase = 'white';
      after(() => { layer.dataset.phase = 'logo'; }, 260);
      after(() => { layer.dataset.phase = 'exit'; }, 4200);
      after(closeAtomic, 4850);
    }
    async function startPlayback(reload = false) {
      if (closed || finished) return;
      showMessage('正在加载原片…');
      clearTimeout(loadTimer);
      if (reload) { needsReload = false; video.load(); }
      loadTimer = setTimeout(() => {
        if (!closed && !finished && video.paused) showMessage('加载较慢，点一下重试', true);
      }, 15000);
      try {
        await video.play();
        if (closed) video.pause();
      } catch (error) {
        if (closed || finished || error.name === 'AbortError') return;
        clearTimeout(loadTimer);
        showMessage(error.name === 'NotAllowedError' ? '点一下播放原片（含声音）' : '原片暂时无法播放，请重试', true);
      }
    }
    video.volume = 1;
    video.addEventListener('playing', () => {
      if (closed || finished) return;
      clearTimeout(loadTimer);
      playback.hidden = true;
      scheduleControlsHide();
    });
    video.addEventListener('waiting', () => { if (!finished && !closed) showMessage('视频缓冲中…'); });
    // The selected clip becomes white at 89.15s. Follow media time so buffering
    // cannot put the transition ahead of the actual explosion.
    function syncWhiteout(mediaTime) {
      if (!closed && !finished && mediaTime >= 89.15) finish();
    }
    function followFrame(now, frame) {
      if (closed || finished) return;
      syncWhiteout(frame.mediaTime);
      if (!finished) frameHandle = video.requestVideoFrameCallback(followFrame);
    }
    video.addEventListener('timeupdate', () => syncWhiteout(video.currentTime));
    video.addEventListener('ended', finish);
    video.addEventListener('error', () => {
      if (closed || finished) return;
      clearTimeout(loadTimer);
      needsReload = true;
      showMessage('原片加载失败，点一下重试', true);
    });
    play.addEventListener('click', event => {
      event.stopPropagation();
      startPlayback(needsReload);
    });
    sound.addEventListener('click', event => {
      event.stopPropagation();
      video.muted = !video.muted;
      sound.textContent = video.muted ? '声音：关' : '声音：开';
      sound.title = video.muted ? '开启声音' : '静音';
      sound.setAttribute('aria-pressed', String(video.muted));
    });
    logo.addEventListener('error', () => {
      logo.hidden = true;
      layer.querySelector('.blog-genshin-fallback').hidden = false;
    }, { once: true });
    layer.addEventListener('pointermove', event => {
      if (event.pointerType === 'touch') return;
      keyboardControls = false;
      showControls();
    });
    layer.addEventListener('pointerdown', event => {
      keyboardControls = false;
      if (event.target.closest('.blog-atomic-controls, .blog-atomic-play')) showControls();
      else scheduleControlsHide();
    });
    skip.addEventListener('click', event => {
      event.stopPropagation();
      closeAtomic();
    });
    layer.addEventListener('click', () => {
      // A tap on hidden controls first reveals them, without dismissing the video.
      if (layer.classList.contains('controls-idle')) { showControls(); return; }
      closeAtomic();
    });
    layer.addEventListener('wheel', event => event.preventDefault(), { passive: false });
    layer.addEventListener('keydown', event => {
      if (event.key === 'Tab') {
        event.preventDefault();
        keyboardControls = true;
        showControls();
        const buttons = [...layer.querySelectorAll('button')].filter(button => !button.hidden && button.getClientRects().length);
        const index = buttons.indexOf(document.activeElement);
        buttons[(index + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length]?.focus({ preventScroll: true });
      }
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(event.key)) event.preventDefault();
    });
    document.body.append(layer);
    skip.focus({ preventScroll: true });
    atomicCleanup = () => {
      closed = true;
      clearTimeout(loadTimer);
      clearTimeout(controlsTimer);
      if (frameHandle !== undefined && video.cancelVideoFrameCallback) video.cancelVideoFrameCallback(frameHandle);
      timers.forEach(clearTimeout);
      video.pause();
      video.removeAttribute('src');
      video.load();
      if (previousFocus?.isConnected && typeof previousFocus.focus === 'function') previousFocus.focus({ preventScroll: true });
    };
    if (calm) {
      playback.hidden = true;
      sound.hidden = true;
      scheduleControlsHide();
      atomicTimer = setTimeout(closeAtomic, 3800);
    } else {
      // Only fetch media after the user triggers the Easter egg.
      video.src = '/video/shadow-atomic.mp4?v=clarity-v11';
      if (video.requestVideoFrameCallback) frameHandle = video.requestVideoFrameCallback(followFrame);
      startPlayback();
    }
  }
  function init() {
    document.querySelectorAll('.avatar-img').forEach(wrapper => {
      if (wrapper.dataset.blogPlay || wrapper.closest('a, button')) return;
      const img = wrapper.querySelector('img');
      if (!img) return;
      wrapper.dataset.blogPlay = '1';
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'blog-avatar-button';
      button.setAttribute('aria-label', '和博主打个招呼，连续点击有彩蛋');
      button.title = '点我打个招呼';
      img.before(button);
      button.append(img);
      const bubble = document.createElement('div');
      bubble.className = 'blog-avatar-bubble';
      bubble.setAttribute('role', 'status');
      bubble.setAttribute('aria-live', 'polite');
      document.body.append(bubble);
      const lines = ['被你发现了 (｡･ω･｡)', '欢迎来我的小窝，随便逛逛～', '今天也要记得休息呀', '再点下去，我要认真了…'];
      let count = 0, last = 0, hideTimer;
      const hide = () => bubble.classList.remove('is-visible');
      button.addEventListener('click', () => {
        const now = Date.now();
        count = now - last < 2400 ? count + 1 : 1;
        last = now;
        clearTimeout(hideTimer);
        if (count >= 5) {
          count = 0;
          hide();
          atomic();
          return;
        }
        bubble.textContent = lines[count - 1];
        bubble.classList.add('is-visible');
        const box = button.getBoundingClientRect();
        const width = bubble.offsetWidth;
        bubble.style.left = Math.max(12, Math.min(innerWidth - width - 12, box.left + box.width / 2 - width / 2)) + 'px';
        bubble.style.top = (box.top > bubble.offsetHeight + 20 ? box.top - bubble.offsetHeight - 12 : box.bottom + 12) + 'px';
        hideTimer = setTimeout(hide, 2600);
      });
      window.addEventListener('scroll', hide, { passive: true });
      window.addEventListener('resize', hide);
    });
    const goUp = document.getElementById('go-up');
    if (goUp && !goUp.dataset.blogPlay) {
      goUp.dataset.blogPlay = '1';
      goUp.classList.add('blog-rocket-button');
      goUp.setAttribute('aria-label', '小火箭，返回顶部');
      goUp.title = '起飞，回到顶部';
      goUp.innerHTML = rocketSvg;
      // Keep Butterfly's original click handler and scrolling behavior.
      goUp.addEventListener('click', () => {
        if (rocketBusy || reduced()) return;
        rocketBusy = true;
        const box = goUp.getBoundingClientRect();
        const rocket = document.createElement('div');
        rocket.className = 'blog-rocket-flight';
        rocket.setAttribute('aria-hidden', 'true');
        rocket.innerHTML = rocketSvg;
        rocket.style.left = box.left + 'px';
        rocket.style.top = box.top + 'px';
        rocket.style.setProperty('--flight-distance', -(box.top + 90) + 'px');
        document.body.append(rocket);
        setTimeout(() => { rocket.remove(); rocketBusy = false; }, 900);
      });
    }
  }
  let typed = '', lastKey = 0;
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') { closeAtomic(); typed = ''; return; }
    if (event.isComposing || event.repeat || event.ctrlKey || event.metaKey || event.altKey ||
        event.target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"]')) {
      typed = ''; return;
    }
    if (event.key.length !== 1) { typed = ''; return; }
    const now = Date.now();
    if (now - lastKey > 1800) typed = '';
    lastKey = now;
    typed = (typed + event.key.toLowerCase()).slice(-6);
    if (typed === 'atomic') { typed = ''; atomic(); }
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();

