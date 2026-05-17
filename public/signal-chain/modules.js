/* =====================================================================
   MODULES.JS — per-effect Eurorack panel renderer
   Each module is a single SVG with: brushed-metal panel, engraved brand +
   model + serial, LCD display, chicken-head knobs, VU meters, LED bars,
   toggle switches, jacks, screws, patina.
   ===================================================================== */

(function () {
  const DISPLAYS = window.DISPLAYS;

  /* Module layout constants */
  const HP = 16;           /* px per HP — 1HP = 16px (tight rack) */
  const PANEL_H = 320;     /* 3U module height */
  const ROW_H = 320;

  /* Panel area helpers */
  const TOP_Y    = 8;      /* screws */
  const BRAND_Y  = 22;     /* brand engraving baseline */
  const MODEL_Y  = 34;     /* model number */
  const SCR_Y    = 50;     /* LCD top */
  const SCR_H    = 76;     /* LCD height */
  const CTRL_Y   = 138;    /* controls start */
  const JACK_Y   = 256;    /* IN/OUT jacks */
  const BOT_Y    = 312;    /* serial / power */

  /* =====================================================================
     SVG primitives
     ===================================================================== */

  /* SVG defs shared across all module SVGs */
  function panelDefs(id) {
    return `
      <defs>
        <!-- Brushed metal panel finishes per category -->
        <linearGradient id="m-eq-${id}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#c8c3b3"/>
          <stop offset="48%" stop-color="#a39d8a"/>
          <stop offset="52%" stop-color="#8a8472"/>
          <stop offset="100%" stop-color="#5a5446"/>
        </linearGradient>
        <linearGradient id="m-dyn-${id}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#3a352e"/>
          <stop offset="48%" stop-color="#2a251f"/>
          <stop offset="52%" stop-color="#1d1813"/>
          <stop offset="100%" stop-color="#0e0a06"/>
        </linearGradient>
        <linearGradient id="m-time-${id}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#b88f6e"/>
          <stop offset="48%" stop-color="#8d684c"/>
          <stop offset="52%" stop-color="#6a4a32"/>
          <stop offset="100%" stop-color="#3a2818"/>
        </linearGradient>
        <linearGradient id="m-colour-${id}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#d6b271"/>
          <stop offset="48%" stop-color="#a87f30"/>
          <stop offset="52%" stop-color="#8a6420"/>
          <stop offset="100%" stop-color="#4d3614"/>
        </linearGradient>
        <linearGradient id="m-mod-${id}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#b87a52"/>
          <stop offset="48%" stop-color="#7a4c2a"/>
          <stop offset="52%" stop-color="#5a3520"/>
          <stop offset="100%" stop-color="#321a0f"/>
        </linearGradient>

        <!-- Brushed metal texture overlay -->
        <pattern id="brush-${id}" x="0" y="0" width="100" height="2" patternUnits="userSpaceOnUse">
          <rect width="100" height="2" fill="rgba(0,0,0,0.04)"/>
          <line x1="0" y1="1" x2="100" y2="1" stroke="rgba(255,255,255,0.06)" stroke-width="0.3"/>
        </pattern>

        <!-- Patina dust/scratches -->
        <filter id="patina-${id}" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="${id.length}"/>
          <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.06 0"/>
          <feComposite in2="SourceGraphic" operator="in"/>
        </filter>

        <!-- Chicken-head knob gradient -->
        <radialGradient id="kbrush-${id}" cx="0.35" cy="0.35" r="0.7">
          <stop offset="0%" stop-color="#5e5a52"/>
          <stop offset="60%" stop-color="#2a261f"/>
          <stop offset="100%" stop-color="#08050a"/>
        </radialGradient>
        <radialGradient id="kbody-${id}" cx="0.35" cy="0.35" r="0.85">
          <stop offset="0%" stop-color="#4a463e"/>
          <stop offset="55%" stop-color="#1a1610"/>
          <stop offset="100%" stop-color="#06040a"/>
        </radialGradient>

        <!-- VU meter background (cream paper) -->
        <linearGradient id="vu-bg-${id}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#f5ecd0"/>
          <stop offset="100%" stop-color="#d9c596"/>
        </linearGradient>

        <!-- Glass reflection on VU -->
        <linearGradient id="vu-glass-${id}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgba(255,255,255,0.4)"/>
          <stop offset="60%" stop-color="rgba(255,255,255,0)"/>
        </linearGradient>

        <!-- Screw head -->
        <radialGradient id="screw-${id}" cx="0.35" cy="0.35" r="0.8">
          <stop offset="0%" stop-color="#c4b894"/>
          <stop offset="65%" stop-color="#6a5e3a"/>
          <stop offset="100%" stop-color="#2a2418"/>
        </radialGradient>

        <!-- Jack port -->
        <radialGradient id="jack-${id}" cx="0.3" cy="0.3" r="0.9">
          <stop offset="0%" stop-color="#5a5650"/>
          <stop offset="55%" stop-color="#1a1815"/>
          <stop offset="100%" stop-color="#050402"/>
        </radialGradient>

        <!-- LCD background (amber phosphor look) -->
        <linearGradient id="lcd-bg-${id}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#0a0c10"/>
          <stop offset="100%" stop-color="#040608"/>
        </linearGradient>
      </defs>
    `;
  }

  function screw(x, y, id) {
    return `
      <g transform="translate(${x},${y})">
        <circle r="3" fill="url(#screw-${id})" stroke="rgba(0,0,0,0.5)" stroke-width="0.3"/>
        <line x1="-1.6" y1="-1.6" x2="1.6" y2="1.6" stroke="rgba(0,0,0,0.5)" stroke-width="0.5"/>
      </g>
    `;
  }

  function chickenHead(x, y, size, value, label, id) {
    const r = size / 2;
    const angle = -135 + value * 270;
    let knurl = '';
    for (let i = 0; i < 12; i++) {
      const a = (i * 30 - 90) * Math.PI / 180;
      const x1 = Math.cos(a) * (r - 0.5);
      const y1 = Math.sin(a) * (r - 0.5);
      const x2 = Math.cos(a) * (r - 2.5);
      const y2 = Math.sin(a) * (r - 2.5);
      knurl += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="rgba(0,0,0,0.35)" stroke-width="0.4"/>`;
    }
    const pointerLen = r + 3;
    return `
      <g transform="translate(${x},${y})">
        <!-- Drop shadow -->
        <circle cx="0.4" cy="1" r="${r + 1}" fill="rgba(0,0,0,0.4)"/>
        <!-- Brushed outer collar -->
        <circle r="${r}" fill="url(#kbrush-${id})"/>
        ${knurl}
        <!-- Inner body -->
        <circle r="${r - 2.5}" fill="url(#kbody-${id})" stroke="rgba(0,0,0,0.5)" stroke-width="0.4"/>
        <!-- Chicken-head pointer (rotates) -->
        <g transform="rotate(${angle.toFixed(1)})">
          <path d="M -1.3 0 L 1.3 0 L 1.6 -${pointerLen + 2} L -1.6 -${pointerLen + 2} Z"
                fill="#0a0a0a" stroke="rgba(255,255,255,0.06)" stroke-width="0.3"/>
          <circle cx="0" cy="-${pointerLen}" r="0.9" fill="#fff" fill-opacity="0.92"/>
        </g>
        <!-- Center cap -->
        <circle r="1.4" fill="rgba(0,0,0,0.55)"/>
        <!-- Label below -->
        <text y="${r + 9}" text-anchor="middle" class="lbl-knob">${label}</text>
      </g>
    `;
  }

  /* Small knob — for tight panels with many knobs */
  function smallKnob(x, y, value, label, id) {
    return chickenHead(x, y, 12, value, label, id);
  }

  function jack(x, y, id, role, label) {
    const ringColor = role === 'in' ? 'rgba(143,176,74,0.6)' : 'rgba(224,119,70,0.7)';
    return `
      <g transform="translate(${x},${y})">
        <circle r="6" fill="url(#jack-${id})" stroke="${ringColor}" stroke-width="0.8"/>
        <circle r="2.6" fill="#020203"/>
        <text y="13" text-anchor="middle" class="lbl-jack">${label}</text>
      </g>
    `;
  }

  function led(x, y, color, lit) {
    if (!lit) {
      return `<circle cx="${x}" cy="${y}" r="1.6" fill="rgba(255,255,255,0.06)" stroke="rgba(0,0,0,0.5)" stroke-width="0.3"/>`;
    }
    return `
      <g>
        <circle cx="${x}" cy="${y}" r="3" fill="${color}" fill-opacity="0.35"/>
        <circle cx="${x}" cy="${y}" r="1.8" fill="${color}"/>
        <circle cx="${x - 0.5}" cy="${y - 0.5}" r="0.6" fill="#fff" fill-opacity="0.85"/>
      </g>
    `;
  }

  /* LED meter — vertical strip of N cells, lit cells from bottom */
  function ledBar(x, y, w, h, count, lit, color, label) {
    const cellH = (h - 2) / count;
    let cells = '';
    for (let i = 0; i < count; i++) {
      const isLit = i >= count - lit;
      const yPos = h - 1 - (i + 1) * cellH;
      const isPeak = i === count - 1;
      const cellColor = isPeak ? '#ff5530' : (i >= count - 3 ? '#ffb84d' : color);
      if (isLit) {
        cells += `<rect x="1" y="${yPos.toFixed(1)}" width="${w - 2}" height="${(cellH - 1).toFixed(1)}" fill="${cellColor}" fill-opacity="0.95"/>
                  <rect x="1" y="${yPos.toFixed(1)}" width="${w - 2}" height="${(cellH - 1).toFixed(1)}" fill="${cellColor}" fill-opacity="0.4" filter="blur(2)"/>`;
      } else {
        cells += `<rect x="1" y="${yPos.toFixed(1)}" width="${w - 2}" height="${(cellH - 1).toFixed(1)}" fill="${color}" fill-opacity="0.10"/>`;
      }
    }
    return `
      <g transform="translate(${x},${y})">
        <rect width="${w}" height="${h}" fill="#040608" stroke="rgba(0,0,0,0.6)" stroke-width="0.5"/>
        ${cells}
        ${label ? `<text x="${w/2}" y="${h + 8}" text-anchor="middle" class="lbl-meter">${label}</text>` : ''}
      </g>
    `;
  }

  /* VU meter — analog needle on cream background */
  function vuMeter(x, y, w, h, value, id, label) {
    const angle = -45 + value * 90;
    const cx = w / 2;
    const pivotY = h - 4;
    const needleEnd = h * 0.18;
    // tick marks
    let ticks = '';
    const tickAngles = [-45, -30, -15, 0, 15, 30, 45];
    tickAngles.forEach(a => {
      const rad = a * Math.PI / 180;
      const r1 = h - 12, r2 = h - 14;
      const x1 = cx + Math.sin(rad) * r1;
      const y1 = pivotY - Math.cos(rad) * r1;
      const x2 = cx + Math.sin(rad) * r2;
      const y2 = pivotY - Math.cos(rad) * r2;
      ticks += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#1a1610" stroke-width="${a === 0 ? 0.9 : 0.5}"/>`;
    });
    return `
      <g transform="translate(${x},${y})">
        <!-- Bezel -->
        <rect x="-1" y="-1" width="${w + 2}" height="${h + 2}" fill="#0a0805" rx="1"/>
        <rect width="${w}" height="${h}" fill="url(#vu-bg-${id})" rx="0.5"/>
        <!-- Red zone arc -->
        <path d="M ${cx + Math.sin(0) * (h - 13)} ${pivotY - Math.cos(0) * (h - 13)}
                 A ${h - 13} ${h - 13} 0 0 1 ${cx + Math.sin(45 * Math.PI / 180) * (h - 13)} ${pivotY - Math.cos(45 * Math.PI / 180) * (h - 13)}"
              fill="none" stroke="#c43020" stroke-width="2.2" opacity="0.6" stroke-linecap="round"/>
        ${ticks}
        <!-- Needle -->
        <g transform="rotate(${angle.toFixed(1)} ${cx} ${pivotY})">
          <line x1="${cx}" y1="${pivotY}" x2="${cx}" y2="${needleEnd}" stroke="#0a0805" stroke-width="0.7" stroke-linecap="round"/>
        </g>
        <!-- Pivot cap -->
        <circle cx="${cx}" cy="${pivotY}" r="1.6" fill="#1a1610" stroke="#000" stroke-width="0.3"/>
        <!-- "VU" letters -->
        ${label ? `<text x="${cx}" y="${h - 10}" text-anchor="middle" class="lbl-vu">${label}</text>` : ''}
        <!-- Glass reflection -->
        <rect width="${w}" height="${h * 0.55}" fill="url(#vu-glass-${id})" opacity="0.5"/>
      </g>
    `;
  }

  /* LCD area — shows a display SVG with phosphor styling */
  function lcd(x, y, w, h, displayKey, id) {
    const inner = (displayKey && DISPLAYS[displayKey]) ? DISPLAYS[displayKey]() : '';
    return `
      <g transform="translate(${x},${y})">
        <!-- Bezel -->
        <rect x="-1" y="-1" width="${w + 2}" height="${h + 2}" fill="#000" rx="1"/>
        <rect width="${w}" height="${h}" fill="url(#lcd-bg-${id})" rx="0.5"/>
        <svg x="0" y="0" width="${w}" height="${h}" viewBox="0 0 240 100" preserveAspectRatio="none">
          ${inner}
        </svg>
        <!-- Glass overlay -->
        <rect width="${w}" height="${h}" fill="url(#vu-glass-${id})" opacity="0.16"/>
        <!-- Scanline -->
        <rect width="${w}" height="${h}" fill="url(#scanline)" opacity="0.4"/>
      </g>
    `;
  }

  /* Toggle switch — 2-position lever, miniature */
  function toggle(x, y, position /* 0|1 */, options, label) {
    const dy = position === 1 ? -3 : 3;
    return `
      <g transform="translate(${x},${y})">
        <!-- Threaded bezel -->
        <rect x="-3" y="-7" width="6" height="14" rx="1" fill="#0a0805" stroke="rgba(255,255,255,0.06)" stroke-width="0.3"/>
        <!-- Lever -->
        <rect x="-1.3" y="${dy - 4}" width="2.6" height="8" rx="0.5" fill="#a8a298" stroke="#000" stroke-width="0.3"/>
        <circle cx="0" cy="${dy - 4}" r="1.3" fill="#c8c2b6" stroke="#000" stroke-width="0.3"/>
        <!-- Labels above/below -->
        ${options[0] ? `<text x="0" y="-9" text-anchor="middle" class="lbl-toggle">${options[0]}</text>` : ''}
        ${options[1] ? `<text x="0" y="14" text-anchor="middle" class="lbl-toggle">${options[1]}</text>` : ''}
        ${label ? `<text x="0" y="22" text-anchor="middle" class="lbl-knob">${label}</text>` : ''}
      </g>
    `;
  }

  /* Rocker button — square illuminated push-button */
  function rocker(x, y, label, lit, color) {
    return `
      <g transform="translate(${x},${y})">
        <rect x="-6" y="-4" width="12" height="8" rx="1.5" fill="#0a0805" stroke="rgba(255,255,255,0.08)" stroke-width="0.4"/>
        <rect x="-5" y="-3" width="10" height="6" rx="1" fill="${lit ? color : '#181410'}" fill-opacity="${lit ? 0.9 : 1}"
              ${lit ? `filter="drop-shadow(0 0 3px ${color})"` : ''}/>
        ${lit ? `<rect x="-4.5" y="-2.5" width="9" height="2" rx="0.5" fill="#fff" fill-opacity="0.25"/>` : ''}
        <text y="${label ? 12 : 0}" text-anchor="middle" class="lbl-knob">${label || ''}</text>
      </g>
    `;
  }

  /* Engraved text (etched look) */
  function engrave(x, y, text, anchor, size, weight) {
    const sz = size || 6;
    const w = weight || 600;
    return `
      <text x="${x}" y="${y}" text-anchor="${anchor || 'start'}" class="lbl-engrave" font-size="${sz}" font-weight="${w}"
        style="paint-order: stroke fill; stroke: rgba(0,0,0,0.35); stroke-width: 0.4px;">${text}</text>
    `;
  }

  /* Scratchy patina overlay drawn within panel */
  function patinaLayer(w, h, seed) {
    /* Some random scratches */
    let scratches = '';
    const sd = (n) => {
      let h = seed; for (let i = 0; i < String(n).length; i++) h = (h * 31 + String(n).charCodeAt(i)) >>> 0;
      return (h % 1000) / 1000;
    };
    for (let i = 0; i < 6; i++) {
      const x = 4 + sd('x' + i) * (w - 8);
      const y = 30 + sd('y' + i) * (h - 60);
      const len = 4 + sd('l' + i) * 18;
      const angle = sd('a' + i) * 360;
      const op = 0.04 + sd('o' + i) * 0.08;
      scratches += `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}"
                    x2="${(x + Math.cos(angle) * len).toFixed(1)}"
                    y2="${(y + Math.sin(angle) * len).toFixed(1)}"
                    stroke="rgba(255,255,255,${op.toFixed(3)})" stroke-width="0.4"/>`;
    }
    /* Coffee ring */
    const rx = 12 + sd('rx') * (w - 24);
    const ry = 60 + sd('ry') * (h - 120);
    scratches += `<circle cx="${rx.toFixed(1)}" cy="${ry.toFixed(1)}" r="${(6 + sd('rr') * 10).toFixed(1)}"
                  fill="none" stroke="rgba(60,30,10,0.10)" stroke-width="0.6" opacity="0.6"/>`;
    return scratches;
  }

  /* =====================================================================
     Panel definitions per effect — each one is unique
     ===================================================================== */

  /* knob value generator (deterministic by key + index) */
  function kv(key, i) {
    let h = i * 7 + 1; for (let j = 0; j < key.length; j++) h = (h * 31 + key.charCodeAt(j)) >>> 0;
    return 0.18 + ((h % 1000) / 1000) * 0.72;
  }

  /* Each definition produces SVG markup for controls area (CTRL_Y down) */
  const PANELS = {
    /* ---------- EQ ---------- */
    hpf: {
      hp: 4, brand: 'WESTSIDE', model: 'HPF·24', serial: '0241',
      tagline: 'HIGH-PASS · 24 DB/OCT',
      drawControls(key, id, w) {
        return `
          ${chickenHead(w/2, CTRL_Y + 14, 22, kv(key, 0), 'CUTOFF', id)}
          ${toggle(w/2, CTRL_Y + 60, 1, ['24', '12'], 'SLOPE')}
          ${led(w/2 - 14, CTRL_Y + 92, 'var(--eq)', 1)}
          <text x="${w/2}" y="${CTRL_Y + 95}" text-anchor="middle" class="lbl-knob">ON</text>
        `;
      },
    },
    lpf: {
      hp: 4, brand: 'WESTSIDE', model: 'LPF·12', serial: '0241',
      tagline: 'LOW-PASS · 12 DB/OCT',
      drawControls(key, id, w) {
        return `
          ${chickenHead(w/2, CTRL_Y + 14, 22, kv(key, 0), 'CUTOFF', id)}
          ${toggle(w/2, CTRL_Y + 60, 0, ['24', '12'], 'SLOPE')}
          ${led(w/2 - 14, CTRL_Y + 92, 'var(--eq)', 1)}
          <text x="${w/2}" y="${CTRL_Y + 95}" text-anchor="middle" class="lbl-knob">ON</text>
        `;
      },
    },
    peq: {
      hp: 12, brand: 'CHROMA', model: 'PEQ·3', serial: '0314',
      tagline: '3-BAND PARAMETRIC',
      drawControls(key, id, w) {
        /* 3 bands x 3 knobs (freq, gain, Q) */
        const bands = ['LOW', 'MID', 'HIGH'];
        const colW = w / 3;
        let html = '';
        bands.forEach((b, i) => {
          const cx = colW * i + colW / 2;
          html += engrave(cx, CTRL_Y + 4, b, 'middle', 7, 600);
          html += chickenHead(cx, CTRL_Y + 22, 16, kv(key, i * 3), 'FREQ', id);
          html += chickenHead(cx - 16, CTRL_Y + 58, 12, kv(key, i * 3 + 1), 'GAIN', id);
          html += chickenHead(cx + 16, CTRL_Y + 58, 12, kv(key, i * 3 + 2), 'Q', id);
          html += led(cx, CTRL_Y + 86, 'var(--eq)', 1);
          html += `<text x="${cx}" y="${CTRL_Y + 96}" text-anchor="middle" class="lbl-knob">${i === 1 ? '· ' + 'ON · ' : 'ON'}</text>`;
        });
        return html;
      },
    },
    shelving: {
      hp: 6, brand: 'CHROMA', model: 'SHELF·2', serial: '0118',
      tagline: 'DUAL SHELF EQ',
      drawControls(key, id, w) {
        return `
          ${engrave(w/4, CTRL_Y + 4, 'LO', 'middle', 7, 600)}
          ${chickenHead(w/4, CTRL_Y + 22, 16, kv(key, 0), 'FREQ', id)}
          ${chickenHead(w/4, CTRL_Y + 60, 14, kv(key, 1), 'GAIN', id)}
          ${engrave(3*w/4, CTRL_Y + 4, 'HI', 'middle', 7, 600)}
          ${chickenHead(3*w/4, CTRL_Y + 22, 16, kv(key, 2), 'FREQ', id)}
          ${chickenHead(3*w/4, CTRL_Y + 60, 14, kv(key, 3), 'GAIN', id)}
          ${led(w/2, CTRL_Y + 90, 'var(--eq)', 1)}
        `;
      },
    },

    /* ---------- DYNAMICS ---------- */
    deesser: {
      hp: 6, brand: 'GRIT', model: 'DEX·1', serial: '0507',
      tagline: 'DE-ESSER',
      drawControls(key, id, w) {
        return `
          ${chickenHead(w/2 - 18, CTRL_Y + 18, 16, kv(key, 0), 'FREQ', id)}
          ${chickenHead(w/2 + 18, CTRL_Y + 18, 16, kv(key, 1), 'THR', id)}
          ${chickenHead(w/2, CTRL_Y + 58, 14, kv(key, 2), 'RANGE', id)}
          ${ledBar(w - 12, CTRL_Y + 4, 8, 56, 8, 4, '#e07746', 'GR')}
        `;
      },
    },
    gate: {
      hp: 8, brand: 'GRIT', model: 'GATE·A', serial: '0612',
      tagline: 'NOISE GATE',
      drawControls(key, id, w) {
        return `
          ${chickenHead(w * 0.20, CTRL_Y + 18, 16, kv(key, 0), 'THR', id)}
          ${chickenHead(w * 0.45, CTRL_Y + 18, 16, kv(key, 1), 'HOLD', id)}
          ${chickenHead(w * 0.70, CTRL_Y + 18, 16, kv(key, 2), 'REL', id)}
          ${chickenHead(w * 0.30, CTRL_Y + 60, 12, kv(key, 3), 'RANGE', id)}
          ${toggle(w * 0.55, CTRL_Y + 60, 0, ['EXT', 'INT'], 'KEY')}
          ${led(w - 14, CTRL_Y + 8,  'var(--dyn)', 1)}
          <text x="${w - 14}" y="${CTRL_Y + 20}" text-anchor="middle" class="lbl-knob">OPEN</text>
          ${led(w - 14, CTRL_Y + 36, 'var(--eq)', 0)}
          <text x="${w - 14}" y="${CTRL_Y + 48}" text-anchor="middle" class="lbl-knob">SHUT</text>
        `;
      },
    },
    comp: {
      hp: 10, brand: 'RUNWAY', model: '1176·N', serial: '1176',
      tagline: 'FET COMPRESSOR',
      drawControls(key, id, w) {
        return `
          ${vuMeter(w/2 - 28, CTRL_Y - 2, 56, 32, 0.55 + kv(key, 0) * 0.2, id, 'VU · GR')}
          ${chickenHead(w * 0.13, CTRL_Y + 56, 14, kv(key, 1), 'THR', id)}
          ${chickenHead(w * 0.36, CTRL_Y + 56, 14, kv(key, 2), 'RATIO', id)}
          ${chickenHead(w * 0.59, CTRL_Y + 56, 14, kv(key, 3), 'ATK', id)}
          ${chickenHead(w * 0.82, CTRL_Y + 56, 14, kv(key, 4), 'REL', id)}
          ${chickenHead(w * 0.5, CTRL_Y + 96, 14, kv(key, 5), 'OUT', id)}
          ${rocker(w * 0.16, CTRL_Y + 96, '4:1', 1, 'var(--dyn)')}
          ${rocker(w * 0.32, CTRL_Y + 96, '8:1', 0, 'var(--dyn)')}
          ${rocker(w * 0.68, CTRL_Y + 96, '12:1', 0, 'var(--dyn)')}
          ${rocker(w * 0.84, CTRL_Y + 96, '20:1', 0, 'var(--dyn)')}
        `;
      },
    },
    mbcomp: {
      hp: 14, brand: 'RUNWAY', model: 'MB·3', serial: '0303',
      tagline: '3-BAND MULTI-COMP',
      drawControls(key, id, w) {
        const colW = w / 3;
        const bands = ['LOW', 'MID', 'HIGH'];
        let html = '';
        bands.forEach((b, i) => {
          const cx = colW * i + colW / 2;
          html += engrave(cx, CTRL_Y + 4, b, 'middle', 7, 600);
          html += chickenHead(cx - 14, CTRL_Y + 22, 14, kv(key, i * 4),     'THR', id);
          html += chickenHead(cx + 14, CTRL_Y + 22, 14, kv(key, i * 4 + 1), 'RATIO', id);
          html += chickenHead(cx - 14, CTRL_Y + 60, 12, kv(key, i * 4 + 2), 'ATK', id);
          html += chickenHead(cx + 14, CTRL_Y + 60, 12, kv(key, i * 4 + 3), 'REL', id);
          html += ledBar(cx - 4, CTRL_Y + 86, 8, 14, 4, 2, '#e07746', '');
        });
        return html;
      },
    },
    limiter: {
      hp: 6, brand: 'RUNWAY', model: 'LIM·X', serial: '0089',
      tagline: 'BRICK-WALL LIMITER',
      drawControls(key, id, w) {
        return `
          ${chickenHead(w/2 - 18, CTRL_Y + 18, 16, kv(key, 0), 'CEILING', id)}
          ${chickenHead(w/2 + 18, CTRL_Y + 18, 16, kv(key, 1), 'RELEASE', id)}
          ${ledBar(w/2 - 32, CTRL_Y + 56, 8, 38, 10, 7, '#e07746', 'GR')}
          ${ledBar(w/2 + 24, CTRL_Y + 56, 8, 38, 10, 5, '#e07746', 'OUT')}
          ${rocker(w/2, CTRL_Y + 56, 'TRUE', 1, 'var(--dyn)')}
          <text x="${w/2}" y="${CTRL_Y + 68}" text-anchor="middle" class="lbl-knob">PEAK</text>
        `;
      },
    },
    transient_shaper: {
      hp: 6, brand: 'GRIT', model: 'TRANS·X', serial: '0744',
      tagline: 'TRANSIENT SHAPER',
      drawControls(key, id, w) {
        return `
          ${chickenHead(w/2 - 20, CTRL_Y + 22, 20, kv(key, 0), 'ATTACK', id)}
          ${chickenHead(w/2 + 20, CTRL_Y + 22, 20, kv(key, 1), 'SUSTAIN', id)}
          ${ledBar(w/2 - 22, CTRL_Y + 66, 10, 26, 6, 4, '#e07746', '+')}
          ${ledBar(w/2 + 12, CTRL_Y + 66, 10, 26, 6, 2, '#e07746', '-')}
          ${toggle(w/2, CTRL_Y + 96, 1, ['HARD', 'SOFT'], 'MODE')}
        `;
      },
    },

    /* ---------- COLOUR ---------- */
    saturation: {
      hp: 6, brand: 'VARNISH', model: 'TAPE·7', serial: '0707',
      tagline: 'HARMONIC EXCITER',
      drawControls(key, id, w) {
        return `
          ${chickenHead(w/2 - 18, CTRL_Y + 18, 16, kv(key, 0), 'DRIVE', id)}
          ${chickenHead(w/2 + 18, CTRL_Y + 18, 16, kv(key, 1), 'MIX', id)}
          ${chickenHead(w/2, CTRL_Y + 58, 14, kv(key, 2), 'TONE', id)}
          ${rocker(w * 0.2, CTRL_Y + 92, 'TAPE', 1, 'var(--colour)')}
          ${rocker(w * 0.5, CTRL_Y + 92, 'TUBE', 0, 'var(--colour)')}
          ${rocker(w * 0.8, CTRL_Y + 92, 'XFMR', 0, 'var(--colour)')}
        `;
      },
    },

    /* ---------- TIME ---------- */
    slap: {
      hp: 4, brand: 'ATLAS', model: 'SLAP', serial: '0090',
      tagline: 'SLAP ECHO',
      drawControls(key, id, w) {
        return `
          ${chickenHead(w/2, CTRL_Y + 14, 22, kv(key, 0), 'TIME', id)}
          ${chickenHead(w/2, CTRL_Y + 58, 16, kv(key, 1), 'MIX', id)}
          ${toggle(w/2, CTRL_Y + 92, 1, ['STR', 'MONO'], '')}
        `;
      },
    },
    tape: {
      hp: 8, brand: 'ATLAS', model: 'TAPE·D', serial: '0061',
      tagline: 'TAPE DELAY',
      drawControls(key, id, w) {
        return `
          ${chickenHead(w * 0.18, CTRL_Y + 18, 18, kv(key, 0), 'TIME', id)}
          ${chickenHead(w * 0.50, CTRL_Y + 18, 18, kv(key, 1), 'FB', id)}
          ${chickenHead(w * 0.82, CTRL_Y + 18, 18, kv(key, 2), 'MIX', id)}
          ${chickenHead(w * 0.25, CTRL_Y + 64, 14, kv(key, 3), 'WOW', id)}
          ${chickenHead(w * 0.75, CTRL_Y + 64, 14, kv(key, 4), 'TONE', id)}
          ${toggle(w/2, CTRL_Y + 64, 1, ['⅛', '¼·'], 'SYNC')}
        `;
      },
    },
    plate: {
      hp: 8, brand: 'PLATE STATE', model: 'PLT·140', serial: '0140',
      tagline: 'PLATE REVERB',
      drawControls(key, id, w) {
        return `
          ${vuMeter(w * 0.20, CTRL_Y + 4, 48, 28, 0.5 + kv(key, 0) * 0.3, id, 'IN')}
          ${vuMeter(w * 0.80 - 48, CTRL_Y + 4, 48, 28, 0.6 + kv(key, 1) * 0.2, id, 'OUT')}
          ${chickenHead(w * 0.18, CTRL_Y + 56, 14, kv(key, 2), 'DECAY', id)}
          ${chickenHead(w * 0.39, CTRL_Y + 56, 14, kv(key, 3), 'PRE', id)}
          ${chickenHead(w * 0.61, CTRL_Y + 56, 14, kv(key, 4), 'DAMP', id)}
          ${chickenHead(w * 0.82, CTRL_Y + 56, 14, kv(key, 5), 'MIX', id)}
          ${toggle(w/2, CTRL_Y + 100, 1, ['DARK', 'BRT'], 'TONE')}
        `;
      },
    },
    chamber: {
      hp: 6, brand: 'PLATE STATE', model: 'CHM·1', serial: '0058',
      tagline: 'CHAMBER REVERB',
      drawControls(key, id, w) {
        return `
          ${chickenHead(w/2 - 18, CTRL_Y + 18, 16, kv(key, 0), 'DECAY', id)}
          ${chickenHead(w/2 + 18, CTRL_Y + 18, 16, kv(key, 1), 'PRE', id)}
          ${chickenHead(w/2 - 18, CTRL_Y + 58, 14, kv(key, 2), 'DAMP', id)}
          ${chickenHead(w/2 + 18, CTRL_Y + 58, 14, kv(key, 3), 'MIX', id)}
          ${led(w/2, CTRL_Y + 94, 'var(--time)', 1)}
        `;
      },
    },
    hall: {
      hp: 8, brand: 'PLATE STATE', model: 'HALL·100', serial: '0100',
      tagline: 'HALL REVERB',
      drawControls(key, id, w) {
        return `
          ${chickenHead(w * 0.18, CTRL_Y + 18, 18, kv(key, 0), 'DECAY', id)}
          ${chickenHead(w * 0.50, CTRL_Y + 18, 18, kv(key, 1), 'SIZE', id)}
          ${chickenHead(w * 0.82, CTRL_Y + 18, 18, kv(key, 2), 'MIX', id)}
          ${chickenHead(w * 0.18, CTRL_Y + 64, 14, kv(key, 3), 'PRE', id)}
          ${chickenHead(w * 0.50, CTRL_Y + 64, 14, kv(key, 4), 'DAMP', id)}
          ${chickenHead(w * 0.82, CTRL_Y + 64, 14, kv(key, 5), 'WIDTH', id)}
          ${rocker(w/2, CTRL_Y + 100, 'AUX', 1, 'var(--time)')}
        `;
      },
    },
    room: {
      hp: 6, brand: 'PLATE STATE', model: 'RM·S', serial: '0024',
      tagline: 'ROOM REVERB',
      drawControls(key, id, w) {
        return `
          ${chickenHead(w/2 - 18, CTRL_Y + 18, 16, kv(key, 0), 'DECAY', id)}
          ${chickenHead(w/2 + 18, CTRL_Y + 18, 16, kv(key, 1), 'PRE', id)}
          ${chickenHead(w/2, CTRL_Y + 60, 14, kv(key, 2), 'MIX', id)}
          ${toggle(w * 0.3, CTRL_Y + 92, 0, ['LRG', 'SML'], '')}
          ${toggle(w * 0.7, CTRL_Y + 92, 1, ['DARK', 'BRT'], '')}
        `;
      },
    },

    /* ---------- MODULATION ---------- */
    chorus: {
      hp: 6, brand: 'WAVELAB', model: 'CH·2', serial: '0024',
      tagline: 'CHORUS',
      drawControls(key, id, w) {
        return `
          ${chickenHead(w/2 - 18, CTRL_Y + 18, 16, kv(key, 0), 'RATE', id)}
          ${chickenHead(w/2 + 18, CTRL_Y + 18, 16, kv(key, 1), 'DEPTH', id)}
          ${chickenHead(w/2, CTRL_Y + 58, 14, kv(key, 2), 'MIX', id)}
          ${rocker(w * 0.3, CTRL_Y + 92, '2V', 1, 'var(--mod)')}
          ${rocker(w * 0.7, CTRL_Y + 92, '4V', 0, 'var(--mod)')}
        `;
      },
    },
    flanger: {
      hp: 6, brand: 'WAVELAB', model: 'FLG·1', serial: '0089',
      tagline: 'FLANGER',
      drawControls(key, id, w) {
        return `
          ${chickenHead(w * 0.25, CTRL_Y + 18, 16, kv(key, 0), 'RATE', id)}
          ${chickenHead(w * 0.75, CTRL_Y + 18, 16, kv(key, 1), 'DEPTH', id)}
          ${chickenHead(w * 0.25, CTRL_Y + 60, 14, kv(key, 2), 'FB', id)}
          ${chickenHead(w * 0.75, CTRL_Y + 60, 14, kv(key, 3), 'MIX', id)}
          ${toggle(w/2, CTRL_Y + 95, 1, ['POS', 'NEG'], 'FB')}
        `;
      },
    },
    phaser: {
      hp: 6, brand: 'ORBIT', model: 'PHS·4', serial: '0407',
      tagline: '4-STAGE PHASER',
      drawControls(key, id, w) {
        return `
          ${chickenHead(w * 0.25, CTRL_Y + 18, 16, kv(key, 0), 'RATE', id)}
          ${chickenHead(w * 0.75, CTRL_Y + 18, 16, kv(key, 1), 'DEPTH', id)}
          ${chickenHead(w * 0.25, CTRL_Y + 60, 14, kv(key, 2), 'FB', id)}
          ${chickenHead(w * 0.75, CTRL_Y + 60, 14, kv(key, 3), 'MIX', id)}
          ${rocker(w * 0.25, CTRL_Y + 96, '4', 1, 'var(--mod)')}
          ${rocker(w * 0.5,  CTRL_Y + 96, '8', 0, 'var(--mod)')}
          ${rocker(w * 0.75, CTRL_Y + 96, '12', 0, 'var(--mod)')}
        `;
      },
    },
    auto_pan: {
      hp: 4, brand: 'ORBIT', model: 'PAN·A', serial: '0212',
      tagline: 'AUTO-PAN',
      drawControls(key, id, w) {
        return `
          ${chickenHead(w/2, CTRL_Y + 14, 20, kv(key, 0), 'RATE', id)}
          ${chickenHead(w/2, CTRL_Y + 56, 16, kv(key, 1), 'DEPTH', id)}
          ${toggle(w/2 - 12, CTRL_Y + 94, 1, ['SQR', 'SIN'], '')}
          ${toggle(w/2 + 12, CTRL_Y + 94, 1, ['1/8', '1/4'], '')}
        `;
      },
    },
  };

  /* =====================================================================
     Render a module panel — full SVG
     ===================================================================== */
  function renderModulePanel(key, eff, opts) {
    opts = opts || {};
    const panel = PANELS[key];
    if (!panel) return ''; /* fallback */
    const id = key + '-' + (opts.idx || 0);
    const w = panel.hp * HP;
    const h = PANEL_H;
    const cat = eff.category;
    const finishId = `m-${cat === 'eq' ? 'eq' : cat === 'dynamics' ? 'dyn' : cat === 'time' ? 'time' : cat === 'colour' ? 'colour' : 'mod'}-${id}`;

    // Decide engraving color based on category panel (dark panel = light text, light panel = dark text)
    const isLightPanel = cat === 'eq' || cat === 'time' || cat === 'colour';

    return `
      <svg class="panel-svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"
           style="${isLightPanel ? '--ink: #1a1916; --ink-soft: #5b554a;' : '--ink: #ece5d4; --ink-soft: #908a7b;'}">
        ${panelDefs(id)}
        <!-- panel background -->
        <rect width="${w}" height="${h}" fill="url(#${finishId})"/>
        <rect width="${w}" height="${h}" fill="url(#brush-${id})"/>

        <!-- top + bottom edge inner shadow -->
        <rect width="${w}" height="1" fill="rgba(255,255,255,0.16)"/>
        <rect y="${h - 1}" width="${w}" height="1" fill="rgba(0,0,0,0.5)"/>

        <!-- engraved brand + model at top -->
        <text x="${w/2}" y="${BRAND_Y}" text-anchor="middle" class="lbl-brand">${panel.brand}</text>
        <text x="${w/2}" y="${MODEL_Y}" text-anchor="middle" class="lbl-model">${panel.model}</text>

        <!-- thin divider line -->
        <line x1="6" y1="40" x2="${w - 6}" y2="40" stroke="rgba(0,0,0,0.3)" stroke-width="0.4"/>

        <!-- LCD display -->
        ${lcd(8, SCR_Y, w - 16, SCR_H, key, id)}

        <!-- Tagline -->
        <text x="${w/2}" y="${SCR_Y + SCR_H + 10}" text-anchor="middle" class="lbl-tag">${panel.tagline}</text>

        <!-- Controls (per effect) -->
        ${panel.drawControls(key, id, w)}

        <!-- Bottom area: jacks + serial -->
        <line x1="6" y1="${JACK_Y - 12}" x2="${w - 6}" y2="${JACK_Y - 12}" stroke="rgba(0,0,0,0.3)" stroke-width="0.4"/>
        ${jack(w * 0.32, JACK_Y, id, 'in', 'IN')}
        ${jack(w * 0.68, JACK_Y, id, 'out', 'OUT')}

        <!-- Power LED + serial -->
        ${led(8 + 6, BOT_Y - 2, 'var(--eq)', 1)}
        <text x="${w/2}" y="${BOT_Y}" text-anchor="middle" class="lbl-serial">${panel.hp} HP · SN ${panel.serial}</text>

        <!-- Patina overlay -->
        <g opacity="0.85">${patinaLayer(w, h, panel.serial)}</g>

        <!-- Screws at corners -->
        ${screw(7, TOP_Y, id)}
        ${screw(w - 7, TOP_Y, id)}
        ${screw(7, h - TOP_Y, id)}
        ${screw(w - 7, h - TOP_Y, id)}
      </svg>
      <style>
        .lbl-brand   { font-family: 'JetBrains Mono'; font-size: 8px; font-weight: 600; letter-spacing: 0.22em; fill: var(--ink); }
        .lbl-model   { font-family: 'Fraunces', serif; font-size: 7.5px; font-style: italic; font-weight: 500; fill: var(--ink-soft); letter-spacing: 0.04em; }
        .lbl-tag     { font-family: 'JetBrains Mono'; font-size: 6px; font-weight: 500; letter-spacing: 0.2em; fill: var(--ink-soft); }
        .lbl-knob    { font-family: 'JetBrains Mono'; font-size: 5.5px; font-weight: 500; letter-spacing: 0.14em; fill: var(--ink); }
        .lbl-meter   { font-family: 'JetBrains Mono'; font-size: 5.5px; font-weight: 500; letter-spacing: 0.14em; fill: var(--ink); }
        .lbl-jack    { font-family: 'JetBrains Mono'; font-size: 5px; font-weight: 500; letter-spacing: 0.18em; fill: var(--ink); }
        .lbl-vu      { font-family: 'JetBrains Mono'; font-size: 5px; font-weight: 600; letter-spacing: 0.2em; fill: #1a0f08; }
        .lbl-toggle  { font-family: 'JetBrains Mono'; font-size: 5px; font-weight: 500; letter-spacing: 0.16em; fill: var(--ink); }
        .lbl-serial  { font-family: 'JetBrains Mono'; font-size: 5px; font-weight: 500; letter-spacing: 0.20em; fill: var(--ink-soft); }
        .lbl-engrave { font-family: 'JetBrains Mono'; font-weight: 500; letter-spacing: 0.18em; fill: var(--ink); }
      </style>
    `;
  }

  /* Module HP width — needed by app.js for layout */
  function moduleHp(key) {
    return (PANELS[key] && PANELS[key].hp) || 6;
  }
  function modulePxWidth(key) {
    return moduleHp(key) * HP;
  }

  /* Cable color per category — for the patch cables between modules */
  function cableColor(category) {
    return ({
      eq: '#b6d165', dynamics: '#ff9a6a', time: '#d99cc7', colour: '#ffd57a', modulation: '#84d4cb',
    })[category] || '#d4a657';
  }

  /* =====================================================================
     Render the rack — single SVG of cables overlaid on module row
     ===================================================================== */
  function drawCables(row, state) {
    /* Remove existing */
    row.querySelectorAll('svg.cables').forEach(s => s.remove());

    const rowRect = row.getBoundingClientRect();
    /* Find sources (out jacks) and destinations (in jacks) in order */
    /* For module SVG, jacks are at fixed coordinates inside the panel.
       We compute panel screen position, then add jack offset. */
    const items = [];

    /* INPUT endpoint */
    const inEp = row.querySelector('.rack-ep.input');
    if (inEp) {
      const r = inEp.getBoundingClientRect();
      items.push({ kind: 'src', x: r.left + r.width / 2, y: r.top + r.height - 86 - rowRect.top, color: '#b6d165' });
    }

    /* Each module: in jack then out jack */
    row.querySelectorAll('.module').forEach(mod => {
      const r = mod.getBoundingClientRect();
      const w = r.width;
      /* Jacks defined inside panel at x=w*0.32 and x=w*0.68, y=JACK_Y */
      const inX = r.left + w * 0.32;
      const inY = r.top + (256 / 320) * r.height;
      const outX = r.left + w * 0.68;
      const outY = r.top + (256 / 320) * r.height;
      const cat = mod.dataset.category;
      items.push({ kind: 'dst', x: inX, y: inY - rowRect.top, idx: parseInt(mod.dataset.idx), cat });
      items.push({ kind: 'src', x: outX, y: outY - rowRect.top, idx: parseInt(mod.dataset.idx), cat });
    });

    /* OUTPUT endpoint */
    const outEp = row.querySelector('.rack-ep.output');
    if (outEp) {
      const r = outEp.getBoundingClientRect();
      items.push({ kind: 'dst', x: r.left + r.width / 2, y: r.top + r.height - 86 - rowRect.top });
    }

    /* Make pairs: src→dst */
    const pairs = [];
    for (let i = 0; i < items.length - 1; i += 2) {
      const a = items[i], b = items[i + 1];
      if (!a || !b) continue;
      if (a.kind !== 'src' || b.kind !== 'dst') continue;
      const cat = (b.cat) || (a.cat) || 'colour';
      pairs.push({ ax: a.x - rowRect.left, ay: a.y, bx: b.x - rowRect.left, by: b.y, color: cableColor(cat), destIdx: b.idx });
    }
    if (!pairs.length) return;

    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.classList.add('cables');
    svg.setAttribute('width', rowRect.width);
    svg.setAttribute('height', rowRect.height);
    svg.setAttribute('viewBox', `0 0 ${rowRect.width} ${rowRect.height}`);

    pairs.forEach(p => {
      const dx = p.bx - p.ax;
      const sag = Math.min(70, Math.max(28, Math.abs(dx) * 0.38));
      const cp1x = p.ax + dx * 0.30;
      const cp1y = p.ay + sag;
      const cp2x = p.bx - dx * 0.30;
      const cp2y = p.by + sag;
      const d = `M ${p.ax.toFixed(1)} ${p.ay.toFixed(1)} C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p.bx.toFixed(1)} ${p.by.toFixed(1)}`;
      // Shadow
      const shadow = document.createElementNS(svgNS, 'path');
      shadow.setAttribute('d', d);
      shadow.setAttribute('fill', 'none');
      shadow.setAttribute('stroke', 'rgba(0,0,0,0.7)');
      shadow.setAttribute('stroke-width', '5.5');
      shadow.setAttribute('stroke-linecap', 'round');
      shadow.setAttribute('transform', 'translate(1.5,3)');
      svg.appendChild(shadow);
      // Cable
      const path = document.createElementNS(svgNS, 'path');
      path.setAttribute('d', d);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', p.color);
      path.setAttribute('stroke-width', '3.4');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('opacity', '0.92');
      path.style.color = p.color; /* for filter:drop-shadow currentColor */
      if (typeof p.destIdx === 'number') {
        path.classList.add('click');
        path.dataset.destIdx = p.destIdx;
      }
      svg.appendChild(path);
      // Highlight stripe
      const hi = document.createElementNS(svgNS, 'path');
      hi.setAttribute('d', d);
      hi.setAttribute('fill', 'none');
      hi.setAttribute('stroke', 'rgba(255,255,255,0.30)');
      hi.setAttribute('stroke-width', '0.7');
      hi.setAttribute('stroke-linecap', 'round');
      hi.style.pointerEvents = 'none';
      svg.appendChild(hi);
    });

    row.appendChild(svg);
  }

  /* Export */
  window.MODULES = { renderModulePanel, moduleHp, modulePxWidth, drawCables, HP, PANEL_H };
})();
