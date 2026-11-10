// Caddie Co. "Build your own bag" — a clickable version of the bag builder flow.
// Screens are the real app screens; the option rows are live, and the chosen
// base color recolors the bag on every step through to the finished bag.
(function () {
  const root = document.querySelector('[data-bag-builder]');
  if (!root) return;

  const base = root.dataset.base;           // folder holding the screen images
  const screenEl = root.querySelector('.bb-screen');
  const statusEl = root.querySelector('.bb-status');
  const stepsEl = root.querySelector('.bb-steps');
  const summaryEl = root.querySelector('.bb-summary');
  const restartBtn = root.querySelector('.bb-restart');
  const W = 402, H = 874;                    // design size of every screen

  const pos = (el, x, y, w, h) => {
    el.style.left = (x / W * 100) + '%';
    el.style.top = (y / H * 100) + '%';
    if (w != null) el.style.width = (w / W * 100) + '%';
    if (h != null) el.style.height = (h / H * 100) + '%';
  };

  const COLORS = [
    { id: '', name: 'Red', hex: '#BB0C0C' },
    { id: 'pink', name: 'Pink', hex: '#E82898' },
    { id: 'orange', name: 'Orange', hex: '#FF7A00' },
    { id: 'yellow', name: 'Yellow', hex: '#FCEA1D' },
    { id: 'green', name: 'Green', hex: '#57BB0C' },
    { id: 'teal', name: 'Teal', hex: '#0E7C66' },
    { id: 'blue', name: 'Blue', hex: '#0072FF' },
  ];
  const tiles = (y) => ['Ballistic Nylon', 'Cordura', 'Ripstop', 'Cotton Canvas', 'Waxed Canvas']
    .map((label, i) => ({ label, x: 31 + i * 80, y, w: 50, h: 50 }));

  // Every screen of the flow, with its tap targets (in 402 × 874 design units).
  const SCREENS = [
    { file: '01-home', title: 'Home', hot: [{ label: 'Customize', x: 130, y: 210, w: 161, h: 43, go: 1, hint: true }] },
    { file: '02-create-bag', title: 'Create a bag', hot: [{ label: 'Customize Now', x: 124, y: 553, w: 161, h: 43, go: 2, hint: true }] },
    { file: '03-base-color', step: 'Base color', key: 'base', nav: 743, recolor: true, swatches: true },
    { file: '04-secondary-color', step: 'Secondary color', key: 'secondary', nav: 743, recolor: true, swatches: true },
    { file: '05-bag-style', step: 'Bag style', key: 'style', nav: 749, recolor: true,
      chips: [['Open', 20, 76], ['Zippered', 106, 99], ['Roll-top', 215, 93], ['Sling', 318, 73]] },
    { file: '06-pockets', step: 'Pockets', key: 'pockets', nav: 749, recolor: true,
      chips: [['1', 20, 45], ['2', 75, 47], ['3', 132, 48], ['4', 190, 48], ['5', 248, 48]] },
    { file: '07-material-base', step: 'Material base', key: 'materialBase', nav: 699, recolor: true,
      tiles: tiles(779), baked: { x: 26, y: 775, w: 58, h: 57 } },
    { file: '08-material-secondary', step: 'Material secondary', key: 'materialSecondary', nav: 703, recolor: true, tiles: tiles(782) },
    { file: '09-accessories', step: 'Accessories', key: 'accessories', nav: 749, recolor: true,
      chips: [['Umbrella holder', 20, 145], ['Towel ring', 175, 107], ['Cooler pouch', 292, 128]] },
    { file: '10-disc-capacity', step: 'Disc capacity', key: 'capacity', nav: 749, recolor: true,
      chips: [['15', 20, 53], ['20', 83, 57], ['25', 150, 55], ['30', 215, 57]] },
    { file: '11-custom-fitting', step: 'Custom fitting', nav: 736, recolor: true, finish: true,
      hot: [{ label: 'Book Appointment', x: 129, y: 840, w: 145, h: 27, toast: 'In the full app, this books a fitting with a pro.' }] },
    { file: '12-bag-created', title: 'Bag created', recolor: true,
      hot: [
        { label: 'Save Bag', x: 153, y: 101, w: 94, h: 37, toast: 'Saved as Bag #3.' },
        { label: 'Home', x: 122, y: 774, w: 157, h: 40, restart: true },
        { label: 'Share', x: 123, y: 823, w: 156, h: 40, toast: 'In the full app, this shares your bag.' },
      ] },
  ];
  const DEFAULTS = { base: 0, secondary: 0, style: 0, pockets: 0, materialBase: 0, materialSecondary: 0, accessories: 0, capacity: 1 };
  let choice = { ...DEFAULTS };
  let current = 0;
  const builderSteps = SCREENS.filter(s => s.step);

  // ---- build the screens -------------------------------------------------
  const toast = document.createElement('p');
  toast.className = 'bb-toast';
  toast.setAttribute('role', 'status');
  let toastTimer;
  const showToast = (msg) => {
    toast.textContent = msg; toast.classList.add('is-on');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('is-on'), 2400);
  };

  const imgSrc = (s) => base + s.file + (s.recolor && COLORS[choice.base].id ? '--' + COLORS[choice.base].id : '') + '.jpg';

  const button = (cls, label, x, y, w, h, onClick) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = cls; b.setAttribute('aria-label', label);
    pos(b, x, y, w, h); b.addEventListener('click', onClick); return b;
  };

  const layers = SCREENS.map((s, i) => {
    const layer = document.createElement('div');
    layer.className = 'bb-layer'; layer.setAttribute('aria-hidden', 'true'); layer.inert = true;
    const img = document.createElement('img');
    img.alt = ''; img.width = W; img.height = H; img.decoding = 'async';
    img.loading = i < 3 ? 'eager' : 'lazy';
    img.src = imgSrc(s);
    layer.appendChild(img);
    s.img = img;

    if (s.step) {
      layer.appendChild(button('bb-hot', 'Back', 8, 12, 44, 44, () => go(i - 1)));
      layer.appendChild(button('bb-hot', 'Back', 20, s.nav, 44, 44, () => go(i - 1)));
      const next = button('bb-hot bb-next', s.finish ? 'Finish' : 'Next step', 338, s.nav, 44, 44, () => go(i + 1));
      layer.appendChild(next);
    }
    (s.hot || []).forEach(h => {
      const b = button('bb-hot' + (h.hint ? ' bb-next' : ''), h.label, h.x, h.y, h.w, h.h, () => {
        if (h.toast) showToast(h.toast);
        if (h.restart) restart();
        if (h.go != null) go(h.go);
      });
      layer.appendChild(b);
    });

    if (s.swatches) {
      const row = document.createElement('div');
      row.className = 'bb-row bb-swatches'; row.setAttribute('role', 'radiogroup'); row.setAttribute('aria-label', s.step);
      pos(row, 0, 816, 402, 58);
      COLORS.forEach((c, k) => {
        const sw = document.createElement('button');
        sw.type = 'button'; sw.className = 'bb-swatch'; sw.style.background = c.hex;
        sw.setAttribute('role', 'radio'); sw.setAttribute('aria-label', c.name);
        pos(sw, 24 + k * 54, 823 - 816, 36, 36);
        sw.style.top = ((823 - 816) / 58 * 100) + '%'; sw.style.height = (36 / 58 * 100) + '%';
        sw.addEventListener('click', () => pick(s.key, k));
        row.appendChild(sw);
      });
      layer.appendChild(row);
    }
    if (s.chips) {
      const row = document.createElement('div');
      row.className = 'bb-row'; row.setAttribute('role', 'radiogroup'); row.setAttribute('aria-label', s.step);
      pos(row, 0, 818, 402, 56);
      s.chips.forEach(([label, x, w], k) => {
        const c = document.createElement('button');
        c.type = 'button'; c.className = 'bb-chip'; c.textContent = label;
        c.setAttribute('role', 'radio');
        c.style.left = (x / W * 100) + '%'; c.style.width = (w / W * 100) + '%';
        c.style.top = ((825 - 818) / 56 * 100) + '%'; c.style.height = (42 / 56 * 100) + '%';
        c.addEventListener('click', () => pick(s.key, k));
        row.appendChild(c);
      });
      layer.appendChild(row);
    }
    if (s.tiles) {
      if (s.baked) { const e = document.createElement('span'); e.className = 'bb-erase'; pos(e, s.baked.x - 1, s.baked.y - 1, s.baked.w + 2, s.baked.h + 2); layer.appendChild(e); s.erase = e; }
      const ring = document.createElement('span'); ring.className = 'bb-tile-ring'; layer.appendChild(ring); s.ring = ring;
      s.tiles.forEach((t, k) => {
        const b = button('bb-hot bb-tile', t.label, t.x, t.y, t.w, t.h, () => pick(s.key, k));
        b.setAttribute('role', 'radio'); layer.appendChild(b);
      });
    }
    screenEl.appendChild(layer);
    return layer;
  });
  screenEl.appendChild(toast);

  // ---- steps list beside the phone ---------------------------------------
  builderSteps.forEach(s => { const li = document.createElement('li'); li.textContent = s.step; stepsEl.appendChild(li); });

  // ---- state -------------------------------------------------------------
  function render() {
    SCREENS.forEach((s, i) => {
      const on = i === current;
      layers[i].classList.toggle('is-active', on);
      layers[i].setAttribute('aria-hidden', on ? 'false' : 'true');
      layers[i].inert = !on;
      if (s.swatches) layers[i].querySelectorAll('.bb-swatch').forEach((b, k) => b.setAttribute('aria-checked', String(choice[s.key] === k)));
      if (s.chips) layers[i].querySelectorAll('.bb-chip').forEach((b, k) => b.setAttribute('aria-checked', String(choice[s.key] === k)));
      if (s.tiles) {
        const t = s.tiles[choice[s.key]];
        pos(s.ring, t.x - 5, t.y - 4, t.w + 8, t.h + 7);
        if (s.erase) s.erase.hidden = choice[s.key] === 0;
        layers[i].querySelectorAll('.bb-tile').forEach((b, k) => b.setAttribute('aria-checked', String(choice[s.key] === k)));
      }
    });
    const idx = builderSteps.indexOf(SCREENS[current]);
    [...stepsEl.children].forEach((li, k) => {
      li.classList.toggle('is-done', idx === -1 ? current === SCREENS.length - 1 : k < idx);
      li.classList.toggle('is-current', k === idx);
      if (k === idx) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    });
    const s = SCREENS[current];
    statusEl.textContent = s.step ? `Step ${idx + 1} of ${builderSteps.length}: ${s.step}` : s.title;
    summaryEl.hidden = current !== SCREENS.length - 1;
    if (current === SCREENS.length - 1) {
      const c = choice;
      const name = (key, scr) => { const sc = SCREENS.find(x => x.key === key); return scr(sc); };
      summaryEl.querySelector('dl').innerHTML = [
        ['Base color', COLORS[c.base].name],
        ['Secondary color', COLORS[c.secondary].name],
        ['Style', name('style', sc => sc.chips[c.style][0])],
        ['Pockets', name('pockets', sc => sc.chips[c.pockets][0])],
        ['Materials', name('materialBase', sc => sc.tiles[c.materialBase].label) + ' / ' + name('materialSecondary', sc => sc.tiles[c.materialSecondary].label)],
        ['Accessory', name('accessories', sc => sc.chips[c.accessories][0])],
        ['Holds', name('capacity', sc => sc.chips[c.capacity][0]) + ' discs'],
      ].map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
    }
  }
  function go(i) {
    if (i < 0 || i >= SCREENS.length) return;
    current = i; render();
    const next = layers[i].querySelector('.bb-next');
    if (root.contains(document.activeElement) && next) next.focus({ preventScroll: true });
  }
  function pick(key, k) {
    choice[key] = k;
    if (key === 'base') {
      SCREENS.forEach(s => { if (s.recolor) s.img.src = imgSrc(s); });
    }
    render();
  }
  function restart() { choice = { ...DEFAULTS }; SCREENS.forEach(s => { if (s.recolor) s.img.src = imgSrc(s); }); go(0); }
  restartBtn.addEventListener('click', restart);

  root.classList.add('is-ready');
  render();
})();
