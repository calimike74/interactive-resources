/* =====================================================================
   Effect displays — each function returns inner SVG for the phosphor screen.
   ViewBox: 240 × 100. Stretches to fill .node-screen and .detail-screen.
   Visualizations match the characteristic display each plugin type shows:
     EQ → frequency response curve
     Compressor → input/output transfer function + gain-reduction meter
     Gate → time-domain envelope with threshold line
     Reverb → impulse response (decaying bars)
     Delay → discrete taps over time
     Modulation → LFO / comb-filter response
   ===================================================================== */

(function () {

  /* --- Helper: generate exponentially-decaying IR bars --- */
  function irBars(opts) {
    // count, spacing, x0, decayK (smaller = slower), maxHeight, label, taper
    const { count = 26, spacing = 7.5, x0 = 18, decayK = 14, maxH = 60, label = '', taper = 1 } = opts;
    const bars = [];
    for (let i = 0; i < count; i++) {
      const x = x0 + i * spacing;
      const decay = Math.exp(-i / decayK);
      const h = decay * maxH * (1 - (i / count) * (1 - taper));
      const top = 86 - h;
      const op = Math.max(0.35, decay).toFixed(2);
      bars.push(`<line class="ir-bar" x1="${x.toFixed(1)}" y1="86" x2="${x.toFixed(1)}" y2="${top.toFixed(1)}" stroke-opacity="${op}"/>`);
    }
    return `
      <svg viewBox="0 0 240 100" preserveAspectRatio="none" class="display">
        <line class="axis" x1="0" y1="86" x2="240" y2="86"/>
        <line class="tap" x1="6" y1="86" x2="6" y2="12"/>
        <circle class="pt" cx="6" cy="12" r="2.8"/>
        ${bars.join('')}
        <text class="label" x="4" y="98">${label}</text>
      </svg>
    `;
  }

  const D = {

  // ====================================================================
  // FILTERING & EQ
  // ====================================================================

  hpf: () => `
    <svg viewBox="0 0 240 100" preserveAspectRatio="none" class="display">
      <line class="axis" x1="0" y1="98" x2="240" y2="98"/>
      <line class="axis-dash" x1="0" y1="44" x2="240" y2="44"/>
      <path class="curve-fill" d="M 0 100 L 0 96 Q 28 96 50 78 Q 76 50 110 38 L 240 38 L 240 100 Z"/>
      <path class="curve" d="M 0 96 Q 28 96 50 78 Q 76 50 110 38 L 240 38"/>
      <line class="ref-line" x1="50" y1="4" x2="50" y2="96"/>
      <circle class="pt" cx="50" cy="78" r="3.5"/>
      <text class="label" x="54" y="92">80 Hz · 24 dB/oct</text>
      <text class="label-dim" x="234" y="14" text-anchor="end">0 dB</text>
      <text class="label-dim" x="234" y="58" text-anchor="end">−12</text>
    </svg>
  `,

  lpf: () => `
    <svg viewBox="0 0 240 100" preserveAspectRatio="none" class="display">
      <line class="axis" x1="0" y1="98" x2="240" y2="98"/>
      <line class="axis-dash" x1="0" y1="44" x2="240" y2="44"/>
      <path class="curve-fill" d="M 0 38 L 130 38 Q 162 50 190 78 Q 212 96 240 96 L 240 100 L 0 100 Z"/>
      <path class="curve" d="M 0 38 L 130 38 Q 162 50 190 78 Q 212 96 240 96"/>
      <line class="ref-line" x1="190" y1="4" x2="190" y2="96"/>
      <circle class="pt" cx="190" cy="78" r="3.5"/>
      <text class="label" x="138" y="92">10 kHz · 12 dB/oct</text>
      <text class="label-dim" x="234" y="14" text-anchor="end">0 dB</text>
    </svg>
  `,

  peq: () => `
    <svg viewBox="0 0 240 100" preserveAspectRatio="none" class="display">
      <line class="axis" x1="0" y1="98" x2="240" y2="98"/>
      <line class="axis-dash" x1="0" y1="50" x2="240" y2="50"/>
      <!-- low cut, presence boost, air shelf -->
      <path class="curve-fill" d="
        M 0 100 L 0 46
        Q 24 46 44 52
        Q 58 78 80 70
        Q 100 56 130 28
        Q 162 24 196 30
        L 240 20
        L 240 100 Z"/>
      <path class="curve" d="
        M 0 46
        Q 24 46 44 52
        Q 58 78 80 70
        Q 100 56 130 28
        Q 162 24 196 30
        L 240 20"/>
      <circle class="pt" cx="60" cy="72" r="3.5"/>
      <circle class="pt" cx="130" cy="28" r="3.5"/>
      <circle class="pt" cx="222" cy="22" r="3.5"/>
      <text class="label-dim" x="50" y="92">300 Hz</text>
      <text class="label-dim" x="122" y="92">3 kHz</text>
      <text class="label-dim" x="200" y="92">10 kHz</text>
    </svg>
  `,

  shelving: () => `
    <svg viewBox="0 0 240 100" preserveAspectRatio="none" class="display">
      <line class="axis" x1="0" y1="98" x2="240" y2="98"/>
      <line class="axis-dash" x1="0" y1="50" x2="240" y2="50"/>
      <path class="curve-fill" d="M 0 50 L 134 50 Q 158 50 174 34 L 240 30 L 240 100 L 0 100 Z"/>
      <path class="curve" d="M 0 50 L 134 50 Q 158 50 174 34 L 240 30"/>
      <line class="ref-line" x1="158" y1="4" x2="158" y2="96"/>
      <circle class="pt" cx="174" cy="34" r="3.5"/>
      <text class="label" x="162" y="92">10 kHz · +3 dB</text>
    </svg>
  `,

  deesser: () => `
    <svg viewBox="0 0 240 100" preserveAspectRatio="none" class="display">
      <line class="axis" x1="0" y1="98" x2="240" y2="98"/>
      <line class="axis-dash" x1="0" y1="50" x2="240" y2="50"/>
      <path class="curve-fill" d="M 0 50 L 132 50 Q 152 50 162 74 Q 172 88 182 74 Q 192 50 212 50 L 240 50 L 240 100 L 0 100 Z"/>
      <path class="curve" d="M 0 50 L 132 50 Q 152 50 162 74 Q 172 88 182 74 Q 192 50 212 50 L 240 50"/>
      <line class="ref-line" x1="162" y1="4" x2="162" y2="96"/>
      <line class="ref-line" x1="182" y1="4" x2="182" y2="96"/>
      <text class="label" x="144" y="92">5–9 kHz</text>
      <!-- sibilance reduction meter -->
      <text class="label-dim" x="234" y="14" text-anchor="end">GR</text>
      <rect x="222" y="22" width="6" height="6" class="meter-cell lit"/>
      <rect x="222" y="32" width="6" height="6" class="meter-cell lit"/>
      <rect x="222" y="42" width="6" height="6" class="meter-cell lit"/>
      <rect x="222" y="52" width="6" height="6" class="meter-cell"/>
      <rect x="222" y="62" width="6" height="6" class="meter-cell"/>
    </svg>
  `,

  // ====================================================================
  // DYNAMICS
  // ====================================================================

  gate: () => `
    <svg viewBox="0 0 240 100" preserveAspectRatio="none" class="display">
      <line class="axis" x1="0" y1="92" x2="240" y2="92"/>
      <line class="ref-line" x1="0" y1="58" x2="240" y2="58"/>
      <text class="label" x="4" y="54">THRESH −24 dB</text>
      <!-- baseline noise -->
      <path class="signal" d="M 0 86 L 10 88 L 22 84 L 34 88 L 46 86 L 58 88 L 70 84"/>
      <!-- snare hit 1 (above threshold) -->
      <path class="signal-hot" d="M 70 84 Q 76 70 82 26 Q 86 14 90 18 Q 96 38 104 58 L 110 70"/>
      <path class="signal" d="M 110 70 L 122 88 L 134 86 L 146 90"/>
      <!-- snare hit 2 -->
      <path class="signal-hot" d="M 146 90 Q 152 70 158 30 Q 162 18 166 20 Q 172 38 180 58 L 186 70"/>
      <path class="signal" d="M 186 70 L 198 88 L 210 86 L 222 90 L 240 88"/>
      <!-- open indicator -->
      <text class="label-dim" x="234" y="14" text-anchor="end">OPEN</text>
      <rect x="218" y="22" width="14" height="3" class="bar"/>
    </svg>
  `,

  comp: () => `
    <svg viewBox="0 0 240 100" preserveAspectRatio="none" class="display">
      <!-- plot frame -->
      <line class="axis" x1="20" y1="86" x2="184" y2="86"/>
      <line class="axis" x1="20" y1="10" x2="20" y2="86"/>
      <!-- 1:1 reference line dim -->
      <line class="ref-line-soft" x1="20" y1="86" x2="170" y2="14"/>
      <!-- threshold vertical -->
      <line class="ref-line" x1="116" y1="10" x2="116" y2="86"/>
      <!-- compressor transfer curve: 1:1 below threshold, then bend to 4:1 -->
      <path class="curve" d="M 20 86 L 110 38 Q 116 33 122 38 L 184 24"/>
      <text class="label" x="120" y="22">4 : 1</text>
      <text class="label" x="120" y="98">THRESH</text>
      <text class="label-dim" x="4" y="20">OUT</text>
      <text class="label-dim" x="172" y="98">IN</text>
      <!-- gain reduction meter (right side) -->
      <text class="label-dim" x="234" y="14" text-anchor="end">GR</text>
      <rect x="222" y="22" width="6" height="5" class="meter-cell"/>
      <rect x="222" y="30" width="6" height="5" class="meter-cell"/>
      <rect x="222" y="38" width="6" height="5" class="meter-cell lit"/>
      <rect x="222" y="46" width="6" height="5" class="meter-cell lit"/>
      <rect x="222" y="54" width="6" height="5" class="meter-cell lit"/>
      <rect x="222" y="62" width="6" height="5" class="meter-cell lit"/>
      <rect x="222" y="70" width="6" height="5" class="meter-cell lit"/>
      <rect x="222" y="78" width="6" height="5" class="meter-cell lit"/>
      <text class="label-dim" x="234" y="98" text-anchor="end">−6</text>
    </svg>
  `,

  mbcomp: () => `
    <svg viewBox="0 0 240 100" preserveAspectRatio="none" class="display">
      <line class="ref-line" x1="80" y1="22" x2="80" y2="92"/>
      <line class="ref-line" x1="160" y1="22" x2="160" y2="92"/>
      <line class="axis" x1="0" y1="92" x2="240" y2="92"/>
      <line class="axis-dash" x1="0" y1="56" x2="240" y2="56"/>

      <!-- low band signal -->
      <path class="signal" d="M 4 70 Q 14 60 24 68 Q 34 78 44 60 Q 56 50 66 60 Q 74 64 78 56"/>
      <!-- mid band — slightly compressed shape -->
      <path class="signal-hot" d="M 84 64 Q 94 56 104 64 Q 114 72 124 56 Q 136 48 146 60 Q 154 64 158 58"/>
      <!-- high band -->
      <path class="signal" d="M 164 50 Q 174 40 184 48 Q 194 58 204 40 Q 216 28 226 40 Q 234 44 238 38"/>

      <text class="label" x="6" y="18">LOW</text>
      <text class="label" x="86" y="18">MID</text>
      <text class="label" x="166" y="18">HIGH</text>
      <text class="label-dim" x="46" y="98" text-anchor="middle">200 Hz</text>
      <text class="label-dim" x="120" y="98" text-anchor="middle">2 kHz</text>
      <text class="label-dim" x="200" y="98" text-anchor="middle">2:1 each</text>
    </svg>
  `,

  limiter: () => `
    <svg viewBox="0 0 240 100" preserveAspectRatio="none" class="display">
      <line class="axis" x1="0" y1="50" x2="240" y2="50"/>
      <!-- ceilings -->
      <line class="ref-line" x1="0" y1="22" x2="240" y2="22"/>
      <line class="ref-line" x1="0" y1="78" x2="240" y2="78"/>
      <text class="label" x="4" y="18">CEILING −0.3 dBFS</text>
      <text class="label-dim" x="4" y="96">∞ : 1</text>
      <!-- brick-walled waveform: peaks flatten at ceilings -->
      <path class="curve" d="
        M 0 50 L 4 50 L 8 38 L 12 22 L 22 22 L 26 32 L 32 50
        L 40 50 L 46 60 L 52 78 L 62 78 L 68 64 L 76 50
        L 84 50 L 90 34 L 96 22 L 108 22 L 114 36 L 122 50
        L 130 50 L 138 64 L 146 78 L 156 78 L 162 64 L 172 50
        L 180 50 L 188 36 L 196 22 L 208 22 L 214 36 L 222 50
        L 230 50 L 236 62 L 240 70"/>
    </svg>
  `,

  transient_shaper: () => `
    <svg viewBox="0 0 240 100" preserveAspectRatio="none" class="display">
      <line class="axis" x1="0" y1="86" x2="240" y2="86"/>
      <!-- envelope: sharp attack, slower decay -->
      <path class="curve-fill" d="M 0 86 L 10 86 L 16 22 L 26 18 L 42 38 L 78 58 L 130 74 L 200 82 L 240 84 L 240 86 Z"/>
      <path class="curve" d="M 0 86 L 10 86 L 16 22 L 26 18 L 42 38 L 78 58 L 130 74 L 200 82 L 240 84"/>
      <line class="ref-line" x1="42" y1="6" x2="42" y2="86"/>
      <text class="label" x="6" y="14">ATTACK +4</text>
      <text class="label-dim" x="48" y="14">SUSTAIN 0</text>
      <!-- knobs indicated bottom right -->
      <circle class="pt-ring" cx="200" cy="32" r="9"/>
      <line class="curve-2" x1="200" y1="32" x2="206" y2="26" stroke-width="1.5"/>
      <circle class="pt-ring" cx="224" cy="32" r="9"/>
      <line class="curve-2" x1="224" y1="32" x2="224" y2="24" stroke-width="1.5"/>
      <text class="label-dim" x="200" y="50" text-anchor="middle">ATK</text>
      <text class="label-dim" x="224" y="50" text-anchor="middle">SUS</text>
    </svg>
  `,

  // ====================================================================
  // COLOUR
  // ====================================================================

  saturation: () => `
    <svg viewBox="0 0 240 100" preserveAspectRatio="none" class="display">
      <!-- transfer function S-curve, left -->
      <line class="axis" x1="20" y1="86" x2="140" y2="86"/>
      <line class="axis" x1="20" y1="10" x2="20" y2="86"/>
      <line class="ref-line-soft" x1="20" y1="86" x2="140" y2="14"/>
      <path class="curve" d="M 20 86 Q 50 78 70 56 Q 90 30 110 16 Q 128 12 140 12"/>
      <text class="label-dim" x="4" y="20">OUT</text>
      <text class="label-dim" x="120" y="98">IN</text>
      <!-- harmonic series, right -->
      <text class="label-dim" x="158" y="20">HARMONICS</text>
      <line class="axis" x1="156" y1="86" x2="238" y2="86"/>
      <line class="ir-bar" x1="160" y1="86" x2="160" y2="22"/>
      <line class="ir-bar" x1="174" y1="86" x2="174" y2="44" stroke-opacity="0.85"/>
      <line class="ir-bar" x1="188" y1="86" x2="188" y2="36" stroke-opacity="0.9"/>
      <line class="ir-bar" x1="202" y1="86" x2="202" y2="56" stroke-opacity="0.7"/>
      <line class="ir-bar" x1="216" y1="86" x2="216" y2="48" stroke-opacity="0.75"/>
      <line class="ir-bar" x1="230" y1="86" x2="230" y2="64" stroke-opacity="0.55"/>
      <text class="label-dim" x="160" y="98" text-anchor="middle">1</text>
      <text class="label-dim" x="188" y="98" text-anchor="middle">3</text>
      <text class="label-dim" x="216" y="98" text-anchor="middle">5</text>
    </svg>
  `,

  // ====================================================================
  // TIME-BASED
  // ====================================================================

  slap: () => `
    <svg viewBox="0 0 240 100" preserveAspectRatio="none" class="display">
      <line class="axis" x1="0" y1="86" x2="240" y2="86"/>
      <line class="axis-dash" x1="0" y1="22" x2="240" y2="22"/>
      <!-- dry impulse -->
      <line class="tap" x1="30" y1="86" x2="30" y2="14"/>
      <circle class="pt" cx="30" cy="14" r="3"/>
      <text class="label-dim" x="22" y="98">0</text>
      <!-- single echo at 90 ms, attenuated -->
      <line class="tap" x1="140" y1="86" x2="140" y2="44"/>
      <circle class="pt" cx="140" cy="44" r="2.5"/>
      <text class="label-dim" x="124" y="98">90 ms</text>
      <text class="label" x="38" y="40">+ 90 ms · FB 0</text>
    </svg>
  `,

  tape: () => `
    <svg viewBox="0 0 240 100" preserveAspectRatio="none" class="display">
      <line class="axis" x1="0" y1="86" x2="240" y2="86"/>
      <!-- decaying echo train -->
      <line class="tap" x1="16" y1="86" x2="16" y2="14"/>
      <circle class="pt" cx="16" cy="14" r="3"/>
      <line class="tap" x1="54" y1="86" x2="54" y2="28" stroke-opacity="0.95"/>
      <circle class="pt" cx="54" cy="28" r="2.5"/>
      <line class="tap" x1="92" y1="86" x2="92" y2="42" stroke-opacity="0.78"/>
      <circle class="pt" cx="92" cy="42" r="2.5"/>
      <line class="tap" x1="130" y1="86" x2="130" y2="54" stroke-opacity="0.62"/>
      <line class="tap" x1="168" y1="86" x2="168" y2="62" stroke-opacity="0.47"/>
      <line class="tap" x1="206" y1="86" x2="206" y2="68" stroke-opacity="0.33"/>
      <!-- wow/flutter line -->
      <path class="curve-2" d="M 4 18 Q 32 16 60 22 Q 86 28 110 34 Q 134 42 156 48 Q 178 54 200 58 Q 220 62 236 64"/>
      <text class="label" x="4" y="98">⅛ note · 35% fb</text>
      <text class="label-dim" x="234" y="14" text-anchor="end">WOW</text>
    </svg>
  `,

  plate: () => {
    // Dense smooth decay — characteristic plate
    const bars = [];
    for (let i = 0; i < 28; i++) {
      const x = 18 + i * 7.6;
      const d = Math.exp(-i / 18);
      const h = d * 58;
      bars.push(`<line class="ir-bar" x1="${x.toFixed(1)}" y1="86" x2="${x.toFixed(1)}" y2="${(86 - h).toFixed(1)}" stroke-opacity="${Math.max(0.4, d).toFixed(2)}"/>`);
    }
    return `
      <svg viewBox="0 0 240 100" preserveAspectRatio="none" class="display">
        <line class="axis" x1="0" y1="86" x2="240" y2="86"/>
        <line class="tap" x1="6" y1="86" x2="6" y2="10"/>
        <circle class="pt" cx="6" cy="10" r="3"/>
        ${bars.join('')}
        <text class="label" x="4" y="98">RT60 ≈ 1.8 s · plate</text>
      </svg>
    `;
  },

  chamber: () => {
    // Medium decay — warmer, fewer brighter taps
    const bars = [];
    for (let i = 0; i < 22; i++) {
      const x = 22 + i * 9;
      const d = Math.exp(-i / 12);
      const h = d * 56;
      bars.push(`<line class="ir-bar" x1="${x.toFixed(1)}" y1="86" x2="${x.toFixed(1)}" y2="${(86 - h).toFixed(1)}" stroke-opacity="${Math.max(0.4, d).toFixed(2)}"/>`);
    }
    return `
      <svg viewBox="0 0 240 100" preserveAspectRatio="none" class="display">
        <line class="axis" x1="0" y1="86" x2="240" y2="86"/>
        <line class="tap" x1="6" y1="86" x2="6" y2="14"/>
        <circle class="pt" cx="6" cy="14" r="3"/>
        ${bars.join('')}
        <text class="label" x="4" y="98">RT60 ≈ 1.2 s · chamber</text>
      </svg>
    `;
  },

  hall: () => {
    // Long sparse decay — distinct early reflections then long tail
    const early = [[24, 56], [42, 50], [62, 44]];
    const tail = [];
    for (let i = 0; i < 18; i++) {
      const x = 84 + i * 8.6;
      const d = Math.exp(-i / 22) * 0.86;
      const h = d * 46;
      tail.push(`<line class="ir-bar" x1="${x.toFixed(1)}" y1="86" x2="${x.toFixed(1)}" y2="${(86 - h).toFixed(1)}" stroke-opacity="${Math.max(0.35, d).toFixed(2)}"/>`);
    }
    const earlyEls = early.map(([x, h]) => `<line class="tap" x1="${x}" y1="86" x2="${x}" y2="${86 - h}"/><circle class="pt" cx="${x}" cy="${86 - h}" r="2"/>`).join('');
    return `
      <svg viewBox="0 0 240 100" preserveAspectRatio="none" class="display">
        <line class="axis" x1="0" y1="86" x2="240" y2="86"/>
        <line class="tap" x1="6" y1="86" x2="6" y2="8"/>
        <circle class="pt" cx="6" cy="8" r="3"/>
        ${earlyEls}
        ${tail.join('')}
        <text class="label" x="4" y="98">RT60 ≈ 3 s · hall</text>
      </svg>
    `;
  },

  room: () => {
    // Distinct early reflections then quick dense decay
    const early = [[22, 50], [38, 44], [52, 38], [68, 32]];
    const tail = [];
    for (let i = 0; i < 16; i++) {
      const x = 86 + i * 9.6;
      const d = Math.exp(-i / 7);
      const h = d * 38;
      tail.push(`<line class="ir-bar" x1="${x.toFixed(1)}" y1="86" x2="${x.toFixed(1)}" y2="${(86 - h).toFixed(1)}" stroke-opacity="${Math.max(0.35, d).toFixed(2)}"/>`);
    }
    const earlyEls = early.map(([x, h]) => `<line class="tap" x1="${x}" y1="86" x2="${x}" y2="${86 - h}"/><circle class="pt" cx="${x}" cy="${86 - h}" r="2"/>`).join('');
    return `
      <svg viewBox="0 0 240 100" preserveAspectRatio="none" class="display">
        <line class="axis" x1="0" y1="86" x2="240" y2="86"/>
        <line class="tap" x1="6" y1="86" x2="6" y2="10"/>
        <circle class="pt" cx="6" cy="10" r="3"/>
        ${earlyEls}
        ${tail.join('')}
        <text class="label" x="4" y="98">RT60 ≈ 0.8 s · room</text>
      </svg>
    `;
  },

  // ====================================================================
  // MODULATION
  // ====================================================================

  chorus: () => `
    <svg viewBox="0 0 240 100" preserveAspectRatio="none" class="display">
      <line class="axis" x1="0" y1="52" x2="240" y2="52"/>
      <!-- dry wave -->
      <path class="curve-2" d="M 0 52 Q 18 24 36 52 T 72 52 T 108 52 T 144 52 T 180 52 T 216 52 L 240 52"/>
      <!-- delayed/modulated wave (slightly offset, slightly higher amp) -->
      <path class="curve" d="M 0 52 Q 22 20 44 52 T 84 52 T 122 52 T 158 52 T 196 52 T 232 52 L 240 52"/>
      <text class="label" x="4" y="16">LFO 0.5 Hz · 8 ms</text>
      <!-- LFO indicator at bottom -->
      <path class="ref-line" d="M 130 82 Q 150 74 170 82 T 210 82"/>
      <text class="label-dim" x="116" y="86">MOD</text>
    </svg>
  `,

  flanger: () => `
    <svg viewBox="0 0 240 100" preserveAspectRatio="none" class="display">
      <line class="axis" x1="0" y1="98" x2="240" y2="98"/>
      <line class="axis-dash" x1="0" y1="42" x2="240" y2="42"/>
      <path class="curve" d="
        M 0 36 L 22 36
        Q 28 84 34 36
        Q 58 36 64 36
        Q 70 82 76 36
        Q 100 36 106 36
        Q 112 80 118 36
        Q 142 36 148 36
        Q 154 78 160 36
        Q 184 36 190 36
        Q 196 76 202 36
        Q 222 36 240 36"/>
      <text class="label" x="4" y="20">COMB · 0.2 Hz</text>
      <text class="label-dim" x="234" y="20" text-anchor="end">±FB 60%</text>
    </svg>
  `,

  phaser: () => `
    <svg viewBox="0 0 240 100" preserveAspectRatio="none" class="display">
      <line class="axis" x1="0" y1="98" x2="240" y2="98"/>
      <line class="axis-dash" x1="0" y1="42" x2="240" y2="42"/>
      <!-- 4-stage phaser: 4 non-evenly spaced notches -->
      <path class="curve" d="
        M 0 38 L 36 38
        Q 46 82 56 38
        Q 86 38 96 38
        Q 104 82 112 38
        Q 144 38 154 38
        Q 162 76 170 38
        Q 194 38 202 38
        Q 209 72 216 38
        L 240 38"/>
      <text class="label" x="4" y="20">4-STAGE · 0.3 Hz</text>
    </svg>
  `,

  auto_pan: () => `
    <svg viewBox="0 0 240 100" preserveAspectRatio="none" class="display">
      <text class="label" x="6" y="14">L</text>
      <text class="label" x="232" y="14" text-anchor="end">R</text>
      <!-- L meter -->
      <rect x="14" y="26" width="14" height="6" class="meter-cell lit"/>
      <rect x="14" y="36" width="14" height="6" class="meter-cell lit"/>
      <rect x="14" y="46" width="14" height="6" class="meter-cell lit"/>
      <rect x="14" y="56" width="14" height="6" class="meter-cell"/>
      <rect x="14" y="66" width="14" height="6" class="meter-cell"/>
      <rect x="14" y="76" width="14" height="6" class="meter-cell"/>
      <!-- R meter -->
      <rect x="212" y="26" width="14" height="6" class="meter-cell"/>
      <rect x="212" y="36" width="14" height="6" class="meter-cell"/>
      <rect x="212" y="46" width="14" height="6" class="meter-cell lit"/>
      <rect x="212" y="56" width="14" height="6" class="meter-cell lit"/>
      <rect x="212" y="66" width="14" height="6" class="meter-cell lit"/>
      <rect x="212" y="76" width="14" height="6" class="meter-cell lit"/>
      <!-- LFO sine spanning -->
      <line class="axis-dash" x1="34" y1="54" x2="208" y2="54"/>
      <path class="curve" d="M 36 54 Q 56 24 76 54 T 116 54 T 156 54 T 196 54 L 208 54"/>
      <circle class="pt" cx="76" cy="54" r="3"/>
      <text class="label" x="38" y="98">SINE · ¼-NOTE</text>
    </svg>
  `,
  };

  window.DISPLAYS = D;
})();
