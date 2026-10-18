/* Section navigation for the two club pages; game and challenge code stays separate. */
(() => {
  'use strict';
  if (window.BlogPlaySpace) { window.BlogPlaySpace.init(); return; }
  let current = null, dispose = () => {};
  function init() {
    const space = document.querySelector('#article-container .ctf-playground, #article-container .arcade-room');
    if (space === current) return;
    dispose(); current = space;
    if (!space) return;
    const topbar = space.querySelector('.play-space-topbar');
    const nav = space.querySelector('.play-space-sections');
    if (!topbar || !nav) return;
    const entries = Array.from(nav.querySelectorAll('a[data-play-section]')).map(link => ({
      link, section: document.getElementById(link.dataset.playSection)
    })).filter(entry => entry.section && space.contains(entry.section));
    let pending = 0, height = 0, selectedId = null;
    function update() {
      pending = 0;
      const limit = height + nav.getBoundingClientRect().height + 32;
      let selected = entries[0];
      for (const entry of entries) {
        if (entry.section.getBoundingClientRect().top <= limit) selected = entry;
      }
      if (selected && selected.section.id !== selectedId) {
        selectedId = selected.section.id;
        const bar = nav.getBoundingClientRect(), link = selected.link.getBoundingClientRect();
        if (link.left < bar.left + 8) nav.scrollLeft += link.left - bar.left - 8;
        else if (link.right > bar.right - 8) nav.scrollLeft += link.right - bar.right + 8;
      }
      for (const entry of entries) {
        if (entry === selected) entry.link.setAttribute('aria-current', 'location');
        else entry.link.removeAttribute('aria-current');
      }
    }
    function schedule() { if (!pending) pending = requestAnimationFrame(update); }
    function measure() {
      const measured = Math.ceil(topbar.getBoundingClientRect().height);
      if (measured !== height) { height = measured; space.style.setProperty('--play-topbar-size', height + 'px'); }
      schedule();
    }
    function select(event) {
      const link = event.target.closest?.('a[data-play-section]');
      if (!link || !nav.contains(link)) return;
      const target = document.getElementById(link.dataset.playSection);
      if (target?.tagName === 'DETAILS') target.open = true;
      schedule();
    }
    nav.addEventListener('click', select);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', measure, { passive: true });
    const resize = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null;
    resize?.observe(topbar);
    measure();
    dispose = () => {
      cancelAnimationFrame(pending); resize?.disconnect();
      nav.removeEventListener('click', select);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', measure);
    };
  }
  window.BlogPlaySpace = Object.freeze({ init });
  init();
  document.addEventListener('pjax:complete', init);
})();
