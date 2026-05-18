/* =====================================================================
   APP.JS — state + rack rendering + interactions
   Patch-only build. Uses window.EFFECTS, PRESETS, DIAGNOSTICS, DISPLAYS, MODULES
   ===================================================================== */

(function () {
  const EFFECTS     = window.EFFECTS;
  const PRESETS     = window.PRESETS;
  const DIAGNOSTICS = window.DIAGNOSTICS;
  const DISPLAYS    = window.DISPLAYS;
  const MODULES     = window.MODULES;

  /* ---------- Analytics ---------- */
  /* PostHog wrapper: silent no-op when posthog is unavailable (e.g. local dev or
     standalone HTML). All events share a payload of the current chain so a single
     event tells you what the student had built at that moment. */
  function track(eventName, extra) {
    if (typeof window === 'undefined' || !window.posthog || typeof window.posthog.capture !== 'function') return;
    try {
      window.posthog.capture('signal_chain_' + eventName, Object.assign({
        chain_effects: state.chain.slice(),
        chain_length: state.chain.length,
        from_preset: state.activePreset,
        active_scenario: state.activeScenario,
        mode: state.mode,
      }, extra || {}));
    } catch (_) { /* swallow */ }
  }
  let _chainChangeTimer = null;
  function trackChainChangeDebounced() {
    clearTimeout(_chainChangeTimer);
    _chainChangeTimer = setTimeout(() => track('chain_changed'), 1200);
  }

  /* ---------- State ---------- */
  const state = {
    chain: [],
    selectedIdx: null,
    activePreset: null,
    dragSrcIdx: null,
    dragSrcKey: null, /* effect key being dragged from inventory */
    mode: 'build',
    activeScenario: null,
    _diagState: null,
    _faultIdx: new Set(), /* indices of faulty modules to highlight */
  };

  function insertIntoChain(key, idx) {
    if (typeof idx !== 'number' || idx < 0 || idx > state.chain.length) {
      idx = state.chain.length;
    }
    state.chain.splice(idx, 0, key);
    state.selectedIdx = idx;
    clearPresetState();
    render();
    trackChainChangeDebounced();
  }

  function moveInChain(srcIdx, targetIdx) {
    if (srcIdx < 0 || srcIdx >= state.chain.length) return;
    if (targetIdx < 0) targetIdx = 0;
    if (targetIdx > state.chain.length) targetIdx = state.chain.length;
    const moved = state.chain.splice(srcIdx, 1)[0];
    /* targetIdx was computed against the pre-splice array, so if it sat after the source, shift by 1 */
    const newIdx = targetIdx > srcIdx ? targetIdx - 1 : targetIdx;
    state.chain.splice(newIdx, 0, moved);
    state.selectedIdx = newIdx;
    clearPresetState();
    render();
    trackChainChangeDebounced();
  }

  function dropIdxFromX(row, x) {
    const mods = Array.from(row.querySelectorAll('.module'));
    for (let i = 0; i < mods.length; i++) {
      const r = mods[i].getBoundingClientRect();
      if (x < r.left + r.width / 2) return i;
    }
    return mods.length;
  }

  /* Position the vertical drop-indicator at the gap snapped to cursor's nearest midpoint.
     The line lives inside the rack-row; the floating label sits on document.body so the
     rack-zone overflow can't clip it. */
  function updateDropIndicator(row, x) {
    let ind = row.querySelector('.drop-indicator');
    if (!ind) {
      ind = document.createElement('div');
      ind.className = 'drop-indicator';
      row.appendChild(ind);
    }
    let lbl = document.getElementById('drop-indicator-label');
    if (!lbl) {
      lbl = document.createElement('div');
      lbl.id = 'drop-indicator-label';
      lbl.textContent = 'Release to place';
      document.body.appendChild(lbl);
    }
    const rowRect = row.getBoundingClientRect();
    const mods = Array.from(row.querySelectorAll('.module'));
    /* Skip the module currently being dragged — don't show the indicator over itself */
    const live = mods.filter((m, i) => state.dragSrcIdx === null || i !== state.dragSrcIdx);
    let gapX;
    for (let i = 0; i < live.length; i++) {
      const r = live[i].getBoundingClientRect();
      if (x < r.left + r.width / 2) {
        gapX = r.left - rowRect.left - 2;
        break;
      }
    }
    if (gapX === undefined) {
      const last = live[live.length - 1];
      if (last) {
        const r = last.getBoundingClientRect();
        gapX = r.right - rowRect.left + 2;
      } else {
        gapX = rowRect.width / 2;
      }
    }
    ind.style.left = gapX + 'px';
    ind.classList.add('shown');
    /* Anchor the label above the rack-row at the same X — in viewport coordinates */
    lbl.style.left = (rowRect.left + gapX) + 'px';
    lbl.style.top  = (rowRect.top - 4) + 'px';
    lbl.classList.add('shown');
  }
  function hideDropIndicator(row) {
    const ind = row && row.querySelector('.drop-indicator');
    if (ind) ind.classList.remove('shown');
    const lbl = document.getElementById('drop-indicator-label');
    if (lbl) lbl.classList.remove('shown');
  }

  function esc(s) { return String(s || '').replace(/</g, '&lt;'); }
  function catLabel(c) { return ({ eq: 'Filter / EQ', dynamics: 'Dynamics', time: 'Time-based', colour: 'Colour', modulation: 'Modulation' })[c] || c; }

  /* ---------- Mutators ---------- */
  function addToChain(key) {
    state.chain.push(key);
    state.selectedIdx = state.chain.length - 1;
    clearPresetState();
    render();
    trackChainChangeDebounced();
  }
  function removeFromChain(i) {
    state.chain.splice(i, 1);
    if (state.selectedIdx === i) state.selectedIdx = null;
    else if (state.selectedIdx !== null && i < state.selectedIdx) state.selectedIdx -= 1;
    clearPresetState();
    render();
    trackChainChangeDebounced();
  }
  function selectIdx(i) {
    state.selectedIdx = i;
    render();
  }
  function clearPresetState() {
    if (!state.activePreset) return;
    const p = PRESETS[state.activePreset];
    if (!p) return;
    if (state.chain.length !== p.chain.length || state.chain.some((k, idx) => k !== p.chain[idx])) {
      state.activePreset = null;
      document.querySelectorAll('#presets-row .pill').forEach(b => b.classList.remove('active'));
    }
  }

  /* ---------- Unified pointer drag (works for mouse, pen, touch) ----------
     HTML5 drag-and-drop doesn't fire reliably on touch devices. Pointer events
     handle all three input types with one code path. The drag is gated by a
     6 px movement threshold so a plain tap/click still works for select-or-add.
     On touch, vertical-dominant movement is treated as page-scroll rather than
     drag, so students can still scroll the page past a module. */
  function attachPointerDrag(el, opts) {
    const MOVE_THRESHOLD = 6;
    let startX, startY, dragging = false, pointerId = null;
    let moveHandler, upHandler, cancelHandler;

    el.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      /* Ignore presses inside an inner button (eg. the future delete) so its own click can fire */
      if (e.target.closest('button') && e.target.closest('button') !== el) return;
      startX = e.clientX;
      startY = e.clientY;
      dragging = false;
      pointerId = e.pointerId;

      moveHandler = (me) => {
        if (me.pointerId !== pointerId) return;
        const dx = me.clientX - startX;
        const dy = me.clientY - startY;
        const dist = Math.sqrt(dx*dx + dy*dy);
        /* On touch, only trigger drag for horizontal-dominant movement so vertical swipes scroll */
        const horizontalDominant = me.pointerType !== 'touch' || Math.abs(dx) > Math.abs(dy);
        if (!dragging && dist > MOVE_THRESHOLD && horizontalDominant) {
          const src = opts.getSrc();
          if (!src) return;
          if (src.idx !== undefined) state.dragSrcIdx = src.idx;
          if (src.key !== undefined) state.dragSrcKey = src.key;
          el.classList.add('dragging');
          dragging = true;
        }
        if (dragging) {
          me.preventDefault(); /* prevent page-scroll while dragging on touch */
          const row = document.getElementById('rack-row');
          if (row) {
            const r = row.getBoundingClientRect();
            const overRow = me.clientX >= r.left && me.clientX <= r.right && me.clientY >= r.top && me.clientY <= r.bottom;
            if (overRow) {
              row.classList.add('drop-target');
              updateDropIndicator(row, me.clientX);
            } else {
              row.classList.remove('drop-target');
              hideDropIndicator(row);
            }
          }
        }
      };

      upHandler = (ue) => {
        if (ue.pointerId !== pointerId) return;
        window.removeEventListener('pointermove', moveHandler);
        window.removeEventListener('pointerup', upHandler);
        window.removeEventListener('pointercancel', cancelHandler);
        if (!dragging) {
          if (opts.onTap) opts.onTap();
        } else {
          const row = document.getElementById('rack-row');
          let committed = false;
          if (row) {
            const r = row.getBoundingClientRect();
            const overRow = ue.clientX >= r.left && ue.clientX <= r.right && ue.clientY >= r.top && ue.clientY <= r.bottom;
            if (overRow) {
              const targetIdx = dropIdxFromX(row, ue.clientX);
              if (opts.onCommit) { opts.onCommit(targetIdx); committed = true; }
            }
            row.classList.remove('drop-target');
            hideDropIndicator(row);
          }
          el.classList.remove('dragging');
        }
        state.dragSrcIdx = null;
        state.dragSrcKey = null;
        dragging = false;
        pointerId = null;
      };

      cancelHandler = () => {
        window.removeEventListener('pointermove', moveHandler);
        window.removeEventListener('pointerup', upHandler);
        window.removeEventListener('pointercancel', cancelHandler);
        el.classList.remove('dragging');
        const row = document.getElementById('rack-row');
        if (row) { row.classList.remove('drop-target'); hideDropIndicator(row); }
        state.dragSrcIdx = null;
        state.dragSrcKey = null;
        dragging = false;
        pointerId = null;
      };

      window.addEventListener('pointermove', moveHandler, { passive: false });
      window.addEventListener('pointerup', upHandler);
      window.addEventListener('pointercancel', cancelHandler);
    });
  }

  /* ---------- Render the rack ---------- */
  function renderRack() {
    const rack = document.getElementById('rack');
    rack.innerHTML = `
      <div class="caution-tape"></div>
      <div class="rack-case">
        <div class="rack-header">
          <div class="h-brand">
            <span class="insignia" aria-hidden="true"></span>
            <span>SIGNAL CHAIN · CO</span>
          </div>
          <div class="h-meta"><strong>EUROCHASSIS · 84HP</strong><span class="dot"></span><strong>+12V / −12V</strong></div>
        </div>
        <div class="rack-rail-top"></div>
        <div class="rack-zone"><div class="rack-row" id="rack-row"></div></div>
        <div class="rack-rail-bot">
          <div class="rack-bus-line">
            <span class="bus-label">BUS · 16PIN</span>
            <span class="bus-ribbon"></span>
            <span class="bus-power">
              <span class="pwr-led"></span>
              <span class="pwr-label">+12V</span>
              <span class="pwr-led" style="background: var(--brass); box-shadow: 0 0 4px var(--brass);"></span>
              <span class="pwr-label">−12V</span>
              <span class="pwr-led" style="background: var(--dyn); box-shadow: 0 0 4px var(--dyn-glow);"></span>
              <span class="pwr-label">5V</span>
            </span>
            <span class="bus-ribbon" style="width: 200px;"></span>
          </div>
        </div>
      </div>
      <div class="rack-foot" id="narration"></div>
      <div class="rack-foot" id="diag-output"></div>
    `;

    const row = rack.querySelector('#rack-row');

    /* Input endpoint */
    const inEp = document.createElement('div');
    inEp.className = 'rack-ep input';
    inEp.innerHTML = `
      <div class="ep-screws"></div>
      <div class="ep-led"></div>
      <div class="ep-label">Input</div>
      <div class="ep-jack"></div>
      <div class="ep-engraving">SRC</div>
      <div class="ep-screws-bot"></div>
    `;
    row.appendChild(inEp);

    if (state.chain.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'rack-empty';
      empty.innerHTML = `<div>Empty rack &mdash; <em>add a module from the inventory below</em></div>`;
      row.appendChild(empty);
    } else {
      state.chain.forEach((key, i) => {
        const eff = EFFECTS[key];
        const mod = document.createElement('div');
        mod.className = 'module' + (i === state.selectedIdx ? ' selected' : '') + (state._faultIdx.has(i) ? ' faulty' : '');
        mod.dataset.category = eff.category;
        mod.dataset.idx = i;
        mod.style.width = MODULES.modulePxWidth(key) + 'px';
        mod.innerHTML = `
          ${MODULES.renderModulePanel(key, eff, { idx: i })}
          <button class="module-remove" aria-label="Remove ${esc(eff.name)}">×</button>
        `;
        mod.querySelector('.module-remove').addEventListener('click', (e) => { e.stopPropagation(); removeFromChain(i); });
        attachPointerDrag(mod, {
          getSrc: () => ({ idx: i }),
          onCommit: (targetIdx) => moveInChain(i, targetIdx),
          onTap: () => selectIdx(i),
        });
        row.appendChild(mod);
      });
    }

    /* Output endpoint */
    const outEp = document.createElement('div');
    outEp.className = 'rack-ep output';
    outEp.innerHTML = `
      <div class="ep-screws"></div>
      <div class="ep-led"></div>
      <div class="ep-label">Output</div>
      <div class="ep-jack"></div>
      <div class="ep-engraving">MIX</div>
      <div class="ep-screws-bot"></div>
    `;
    row.appendChild(outEp);

    /* (rack-row drop zone is now handled by the unified pointer-drag via the window-level
        pointermove listener — no rack-row-level dragover/drop needed.) */

    /* Draw cables after layout */
    requestAnimationFrame(() => {
      MODULES.drawCables(row, state);
      attachCableHandlers(row);
    });

    /* Populate foot panels */
    populateFootPanels({
      narrationEl: rack.querySelector('#narration'),
      diagEl: rack.querySelector('#diag-output'),
    });

    /* Toolbar visibility for mode */
    document.getElementById('presets-row').style.display = (state.mode === 'build') ? '' : 'none';
    document.getElementById('scenarios').classList.toggle('shown', state.mode === 'diagnose');
    document.body.classList.toggle('diagnose-active', state.mode === 'diagnose');
  }

  function attachCableHandlers(row) {
    row.querySelectorAll('svg.cables path.click').forEach(p => {
      p.addEventListener('click', (e) => {
        const idx = parseInt(p.dataset.destIdx);
        if (!isNaN(idx)) removeFromChain(idx);
      });
      p.addEventListener('mouseenter', () => {
        const idx = parseInt(p.dataset.destIdx);
        const key = state.chain[idx];
        const eff = EFFECTS[key];
        if (eff) showCableTip(eff.name);
      });
      p.addEventListener('mousemove', (e) => moveCableTip(e.clientX, e.clientY));
      p.addEventListener('mouseleave', hideCableTip);
    });
  }

  function showCableTip(name) {
    let tip = document.getElementById('cable-tip');
    if (!tip) {
      tip = document.createElement('div');
      tip.id = 'cable-tip';
      document.body.appendChild(tip);
    }
    tip.innerHTML = `<span class="tip-x">×</span><span>Disconnect</span><span class="tip-name">${esc(name)}</span>`;
    tip.classList.add('shown');
  }
  function moveCableTip(x, y) {
    const tip = document.getElementById('cable-tip');
    if (!tip) return;
    tip.style.left = x + 'px';
    tip.style.top  = y + 'px';
  }
  function hideCableTip() {
    const tip = document.getElementById('cable-tip');
    if (tip) tip.classList.remove('shown');
  }

  /* ---------- Render bottom (palette + detail) ---------- */
  function renderBottom() {
    const bottom = document.getElementById('bottom');
    const cats = ['eq', 'dynamics', 'time', 'colour', 'modulation'];
    const catTitles = {
      eq: 'Filtering & EQ', dynamics: 'Dynamics', time: 'Time-based',
      colour: 'Colour & saturation', modulation: 'Modulation'
    };
    const paletteHTML = `
      <div class="palette">
        <div class="palette-heading">
          <h2>Module <em>inventory</em></h2>
          <span class="palette-sub">Drag into rack · or click to append</span>
        </div>
        ${cats.map(c => `
          <div class="cat-group cat-${c}">
            <p class="cat-title">${esc(catTitles[c])}</p>
            <div class="effect-list">
              ${Object.entries(EFFECTS).filter(([k, e]) => e.category === c).map(([k, e]) => `
                <button class="effect-chip" data-category="${c}" data-key="${k}">${esc(e.name)}</button>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    `;

    let detailHTML = '';
    if (state.selectedIdx === null || !state.chain[state.selectedIdx]) {
      detailHTML = `<div class="detail empty"><p>Click a module in the rack to read what it does — and why it sits where it sits.</p></div>`;
    } else {
      const key = state.chain[state.selectedIdx];
      const eff = EFFECTS[key];
      let whyHere = '';
      if (state.activePreset && PRESETS[state.activePreset]?.whyHere?.[key]) {
        whyHere = `<div class="why-here"><h3>Why it sits here · ${esc(PRESETS[state.activePreset].name)}</h3><p>${esc(PRESETS[state.activePreset].whyHere[key])}</p></div>`;
      }
      const posStr = `POS&nbsp;<strong>${state.selectedIdx + 1}</strong>&nbsp;/&nbsp;${state.chain.length}`;
      detailHTML = `
        <div class="detail ${eff.category}">
          <div class="detail-head">
            <span class="detail-head-led"></span>
            <span class="detail-head-cat">${catLabel(eff.category)}</span>
            <span class="detail-head-spec">· ${esc(eff.spec)}</span>
            <span class="detail-head-pos">${posStr}</span>
          </div>
          <div class="detail-body">
            <h2 class="detail-name"><em>${esc(eff.name)}</em></h2>
            <div class="detail-screen">${DISPLAYS[key]?.() || ''}</div>
            <div class="d-section"><h3>What it does</h3><p>${esc(eff.what)}</p></div>
            <div class="d-section"><h3>Why &amp; where you'd use it</h3><p>${esc(eff.use)}</p></div>
            ${whyHere}
          </div>
        </div>`;
    }
    bottom.innerHTML = paletteHTML + detailHTML;
    bottom.querySelectorAll('.effect-chip').forEach(chip => {
      attachPointerDrag(chip, {
        getSrc: () => ({ key: chip.dataset.key }),
        onCommit: (targetIdx) => insertIntoChain(chip.dataset.key, targetIdx),
        onTap: () => addToChain(chip.dataset.key),
      });
    });
  }

  /* ---------- Render foot panels ---------- */
  function populateFootPanels({ narrationEl, diagEl }) {
    narrationEl.className = 'rack-foot';
    narrationEl.innerHTML = '';
    if (state.activePreset && PRESETS[state.activePreset]) {
      const p = PRESETS[state.activePreset];
      narrationEl.classList.add('shown');
      narrationEl.innerHTML = `<div class="rack-foot-inner"><div class="accent-bar"></div><h3>${esc(p.name)} — why this order</h3><p>${esc(p.narration)}</p></div>`;
    }
    diagEl.className = 'rack-foot';
    diagEl.innerHTML = '';
    if (state.mode === 'diagnose' && state.activeScenario && state._diagState) {
      const ds = state._diagState;
      diagEl.classList.add('shown', ds.phase + '-state');
      diagEl.innerHTML = `<div class="rack-foot-inner"><div class="accent-bar"></div>${ds.html}</div>`;
    }
  }

  /* ---------- Combined render ---------- */
  function render() {
    renderRack();
    renderBottom();
  }

  /* ---------- Presets ---------- */
  function loadPreset(key) {
    const p = PRESETS[key]; if (!p) return;
    state.chain = [...p.chain];
    state.activePreset = key;
    state.selectedIdx = 0;
    state._faultIdx = new Set();
    document.querySelectorAll('#presets-row .pill').forEach(b => b.classList.toggle('active', b.dataset.preset === key));
    render();
    track('preset_loaded', { preset: key });
  }

  /* ---------- Scenarios ---------- */
  function loadScenario(key) {
    const sc = DIAGNOSTICS[key]; if (!sc) return;
    state.chain = sc.brokenChain.slice();
    state.activeScenario = key;
    state.selectedIdx = state.chain.length > 0 ? 0 : null;
    state._faultIdx = new Set();
    state._diagState = {
      phase: 'brief',
      html: `<h3>${esc(sc.name)}</h3><p>${esc(sc.brief)}</p>`,
    };
    document.querySelectorAll('.pill.danger').forEach(b => b.classList.toggle('active', b.dataset.scenario === key));
    document.getElementById('diagnose-btn').disabled = false;
    render();
    track('scenario_loaded', { scenario: key });
  }

  function diagnose() {
    if (!state.activeScenario) return;
    const sc = DIAGNOSTICS[state.activeScenario];
    const remaining = sc.faults.filter(f => f.detect(state.chain));
    if (remaining.length === 0) {
      state._diagState = {
        phase: 'clean',
        html: `<h3>Diagnosis · chain is clean</h3><p>${esc(sc.cleanMessage || 'Chain is clean.')}</p>`,
      };
      state._faultIdx = new Set();
    } else {
      let html = `<h3>Diagnosis · ${remaining.length} fault${remaining.length > 1 ? 's' : ''} detected</h3>`;
      const faultIdx = new Set();
      remaining.forEach(f => {
        html += `<div class="fault">
          <h4>What an examiner would write</h4>
          <p class="examiner">${esc(f.examinerLanguage)}</p>
          <p class="hint"><strong>Fix:</strong> ${esc(f.hint)}</p>
        </div>`;
        /* Heuristic: highlight modules involved in fault */
        if (f.id === 'reverb_before_comp') {
          state.chain.forEach((k, i) => { if (k === 'plate' || k === 'room' || k === 'comp') faultIdx.add(i); });
        } else if (f.id === 'no_gate_or_hpf_first' || f.id === 'gate_without_hpf_first') {
          if (state.chain[0]) faultIdx.add(0);
        } else if (f.id === 'comp_after_limiter') {
          state.chain.forEach((k, i) => { if (k === 'comp' || k === 'limiter') faultIdx.add(i); });
        } else if (f.id === 'saturation_after_eq') {
          state.chain.forEach((k, i) => { if (k === 'saturation' || k === 'peq') faultIdx.add(i); });
        } else if (f.id === 'gate_on_vocal') {
          state.chain.forEach((k, i) => { if (k === 'gate') faultIdx.add(i); });
        } else if (f.id === 'chorus_on_lead_vocal') {
          state.chain.forEach((k, i) => { if (k === 'chorus') faultIdx.add(i); });
        }
      });
      state._diagState = { phase: 'fault', html };
      state._faultIdx = faultIdx;
    }
    render();
    track('diagnosed', {
      scenario: state.activeScenario,
      outcome: remaining.length === 0 ? 'clean' : 'fault',
      fault_count: remaining.length,
      fault_ids: remaining.map(f => f.id),
    });
  }

  /* ---------- Mode toggle ---------- */
  function setMode(newMode) {
    if (newMode !== 'build' && newMode !== 'diagnose') return;
    state.mode = newMode;
    state.chain = [];
    state.selectedIdx = null;
    state.activePreset = null;
    state.activeScenario = null;
    state._diagState = null;
    state._faultIdx = new Set();
    document.querySelectorAll('.mode-btn').forEach(b => {
      const on = b.dataset.mode === newMode;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    document.querySelectorAll('#presets-row .pill').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.pill.danger').forEach(b => b.classList.remove('active'));
    document.getElementById('diagnose-btn').disabled = true;
    render();
    track('mode_switched', { new_mode: newMode });
  }

  /* ---------- Wire DOM events ---------- */
  document.querySelectorAll('#presets-row .pill').forEach(b => {
    b.addEventListener('click', () => loadPreset(b.dataset.preset));
  });
  document.getElementById('reset').addEventListener('click', () => {
    state.chain = []; state.selectedIdx = null; state.activePreset = null; state._faultIdx = new Set();
    document.querySelectorAll('#presets-row .pill').forEach(b => b.classList.remove('active'));
    render();
  });
  document.querySelectorAll('.mode-btn').forEach(b => {
    b.addEventListener('click', () => setMode(b.dataset.mode));
  });
  document.querySelectorAll('.pill.danger').forEach(b => {
    b.addEventListener('click', () => loadScenario(b.dataset.scenario));
  });
  document.getElementById('diagnose-btn').addEventListener('click', diagnose);

  /* Re-draw cables on resize */
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const row = document.getElementById('rack-row');
      if (row) MODULES.drawCables(row, state);
    }, 120);
  });

  /* Initial */
  render();
})();
