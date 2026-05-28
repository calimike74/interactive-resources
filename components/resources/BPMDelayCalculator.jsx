'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// ════════════════════════════════════════════════════════════════════
// TAPE LAB — BPM & Delay Time Calculator (v2)
// 1.12 Delay · 2.5 Numeracy
//
// Centrepiece: real reel-to-reel video + brushed-aluminium head meter
// where the playback head slides as you change BPM or note value.
// The physical gap between record and playback heads = the delay time.
// Includes drum loop, 6 source pads, theory/reference drawers with
// copy-out (plain text for notes, markdown for AI assistants).
// ════════════════════════════════════════════════════════════════════

const FONT_LINK_HREF = 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,800&family=IBM+Plex+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700;800&display=swap';

const TAPE_LAB_CSS = `
.tape-lab {
  --paper:#F1E8D0; --paper-edge:#E0D5B7; --paper-deep:#DCD0AB;
  --ink:#1A1612; --ink-soft:#4B4239; --ink-faded:#7A6B5A;
  --oxblood:#7A1F2B; --tape:#2F1F12; --tape-edge:#1A0F08;
  --steel:#C9C2B5; --amber:#FFB347; --amber-glow:rgba(255,179,71,0.55);
  --phosphor:#7FBF3F;
  --f-display:'Fraunces','Times New Roman',serif;
  --f-body:'IBM Plex Sans',system-ui,sans-serif;
  --f-mono:'JetBrains Mono',ui-monospace,monospace;
  font-family: var(--f-body); color: var(--ink); background: var(--paper);
  background-image:
    repeating-linear-gradient(0deg, transparent 0, transparent 23px, rgba(122,31,43,0.025) 23px, rgba(122,31,43,0.025) 24px),
    radial-gradient(ellipse at top, rgba(255,255,255,0.4) 0%, transparent 60%);
  min-height: 100vh; padding: 32px 24px 60px;
}
.tape-lab * { box-sizing: border-box; }

.tape-lab .tl-wrap { max-width: 1200px; margin: 0 auto; }
.tape-lab .tl-stage { display: block; }
@media (min-width: 980px) {
  .tape-lab .tl-stage {
    display: grid;
    grid-template-columns: minmax(260px, 320px) 1fr;
    gap: 32px;
    align-items: start;
  }
  .tape-lab .tl-stage-side { position: sticky; top: 24px; }
}
.tape-lab .tl-mixer-row {
  display: flex; align-items: center; gap: 14px;
  border: 1.5px solid var(--ink); background: var(--paper);
  padding: 10px 14px; margin: 0 0 18px;
}
.tape-lab .tl-mixer-row + .tl-mixer-row { margin-top: -10px; }
.tape-lab .tl-mixer-label {
  font-family: var(--f-mono); font-weight: 700; font-size: 10px;
  letter-spacing: 0.2em; text-transform: uppercase; color: var(--ink-faded);
  min-width: 96px;
}
.tape-lab .tl-mixer-slider {
  flex: 1; appearance: none; height: 4px;
  background: var(--ink); outline: none; cursor: pointer;
}
.tape-lab .tl-mixer-slider::-webkit-slider-thumb {
  appearance: none; width: 16px; height: 16px;
  background: var(--oxblood); border: 2px solid var(--ink); cursor: ew-resize;
  box-shadow: 0 2px 0 var(--ink);
}
.tape-lab .tl-mixer-slider::-moz-range-thumb {
  width: 16px; height: 16px; background: var(--oxblood);
  border: 2px solid var(--ink); cursor: ew-resize;
}
.tape-lab .tl-mixer-value {
  font-family: var(--f-mono); font-weight: 700; font-size: 11px;
  letter-spacing: 0.08em; color: var(--ink); min-width: 38px; text-align: right;
}

.tape-lab header.tl-header { border-bottom: 2px solid var(--ink); padding-bottom: 20px; margin-bottom: 28px; }
.tape-lab .tl-eyebrow {
  font-family: var(--f-mono); font-size: 11px; font-weight: 600;
  letter-spacing: 0.25em; text-transform: uppercase; color: var(--oxblood);
  margin-bottom: 6px;
}
.tape-lab h1.tl-title {
  font-family: var(--f-display); font-weight: 800;
  font-size: clamp(32px, 4.5vw, 52px); margin: 0;
  letter-spacing: -0.03em; line-height: 0.95;
}
.tape-lab .tl-amp { font-style: italic; font-weight: 400; color: var(--oxblood); }
.tape-lab .tl-lede {
  font-family: var(--f-display); font-weight: 400; font-style: italic;
  font-size: 18px; color: var(--ink-soft); margin-top: 10px;
  max-width: 620px; line-height: 1.45;
}

/* video hero */
.tape-lab .tl-video-hero {
  position: relative;
  border: 2px solid var(--ink);
  background: #000; overflow: hidden;
  margin-bottom: 4px;
  box-shadow: 0 4px 0 var(--ink), 6px 8px 0 rgba(26,22,18,0.08);
  aspect-ratio: 16 / 9;
}
.tape-lab .tl-video-hero video {
  width: 100%; height: 100%; object-fit: cover; display: block;
  filter: contrast(1.04) saturate(0.92);
}
.tape-lab .tl-video-stencil {
  position: absolute; top: 12px; left: 14px;
  font-family: var(--f-mono); font-weight: 700; font-size: 10px;
  letter-spacing: 0.22em; text-transform: uppercase;
  padding: 4px 8px; background: rgba(26,22,18,0.7);
  color: var(--amber); border: 1px solid var(--amber-glow);
  text-shadow: 0 0 6px var(--amber-glow); z-index: 3;
}
.tape-lab .tl-video-flash {
  position: absolute; top: 60%; left: 50%;
  width: 90px; height: 90px; border-radius: 50%;
  background: radial-gradient(circle, var(--amber-glow) 0%, transparent 70%);
  transform: translate(-50%, -50%) scale(0.6);
  opacity: 0; pointer-events: none;
  transition: opacity 80ms ease-out, transform 250ms ease-out;
  z-index: 2;
}
.tape-lab .tl-video-flash.on { opacity: 0.9; transform: translate(-50%, -50%) scale(1.4); }
.tape-lab .tl-video-grain {
  position: absolute; inset: 0;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' seed='5'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.18 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
  opacity: 0.45; mix-blend-mode: overlay;
  pointer-events: none; z-index: 1;
}
.tape-lab .tl-video-caption {
  font-family: var(--f-mono); font-size: 10px; letter-spacing: 0.22em;
  text-transform: uppercase; color: var(--ink-faded);
  padding: 10px 0 0;
  display: flex; justify-content: space-between; align-items: baseline;
  margin-bottom: 28px;
}
.tape-lab .tl-video-caption b { color: var(--oxblood); font-weight: 700; }

/* gap meter */
.tape-lab .tl-gap-meter-frame {
  border: 2px solid var(--ink);
  background:
    radial-gradient(circle at 20% 0%, rgba(255,255,255,0.5), transparent 50%),
    linear-gradient(180deg, var(--paper) 0%, var(--paper-deep) 100%);
  padding: 22px 28px 26px;
  position: relative; margin-bottom: 28px;
  box-shadow: 0 4px 0 var(--ink), 6px 8px 0 rgba(26,22,18,0.08);
}
.tape-lab .tl-gap-meter-frame::before {
  content: ''; position: absolute; top: 8px; right: 12px; bottom: 8px; left: 12px;
  border: 1px solid rgba(26,22,18,0.18); pointer-events: none;
}
.tape-lab .tl-gap-meter-stencil {
  font-family: var(--f-mono); font-weight: 700; font-size: 10px;
  letter-spacing: 0.22em; text-transform: uppercase; color: var(--ink-faded);
  display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 22px;
}
.tape-lab .tl-gap-meter-stencil .live { color: var(--oxblood); }
.tape-lab .tl-rail {
  position: relative; height: 64px; margin: 0 12px;
  background: linear-gradient(180deg, #d8d3c9 0%, #b8b3a9 45%, #6e695f 100%);
  border: 1.5px solid #1a1612; border-radius: 2px;
  background-image:
    linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 30%, rgba(0,0,0,0.18) 100%),
    repeating-linear-gradient(90deg, rgba(0,0,0,0.04) 0 1px, transparent 1px 3px);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.4);
}
.tape-lab .tl-head {
  position: absolute; top: 8px;
  width: 28px; height: 38px; transform: translateX(-50%);
  background: linear-gradient(180deg, #e8e3d8 0%, #b0aba0 35%, #5a554c 100%);
  border: 1.5px solid #1a1612; border-radius: 2px;
  box-shadow:
    inset 0 1.5px 0 rgba(255,255,255,0.5),
    inset 0 -2px 3px rgba(0,0,0,0.5),
    2px 3px 4px rgba(0,0,0,0.35);
  z-index: 2;
  transition: left 280ms cubic-bezier(0.2, 0.7, 0.2, 1);
}
.tape-lab .tl-head::before, .tape-lab .tl-head::after {
  content: ''; position: absolute; width: 2px; height: 2px;
  border-radius: 50%; background: #1a1612; top: 4px;
}
.tape-lab .tl-head::before { left: 4px; }
.tape-lab .tl-head::after  { right: 4px; }
.tape-lab .tl-head .tl-head-gap {
  position: absolute; bottom: 4px; left: 50%;
  width: 3px; height: 7px; background: #0a0604;
  transform: translateX(-50%); border-radius: 1px;
}
.tape-lab .tl-head .tl-head-glow {
  position: absolute; bottom: -1px; left: 50%;
  width: 4px; height: 4px; border-radius: 50%;
  background: var(--amber);
  box-shadow: 0 0 0 2px var(--amber), 0 0 14px 8px var(--amber-glow);
  transform: translateX(-50%) scale(0); opacity: 0;
  transition: opacity 60ms ease-out, transform 250ms ease-out;
}
.tape-lab .tl-head.flash .tl-head-glow { opacity: 1; transform: translateX(-50%) scale(1); }

.tape-lab .tl-head-label {
  position: absolute; bottom: -38px; left: 50%;
  transform: translateX(-50%);
  font-family: var(--f-mono); font-weight: 700; font-size: 10px;
  letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--ink); white-space: nowrap;
  transition: left 280ms cubic-bezier(0.2, 0.7, 0.2, 1),
              transform 200ms ease-out;
}
.tape-lab .tl-head-label .num { color: var(--oxblood); margin-right: 4px; font-weight: 800; }

.tape-lab .tl-bracket {
  position: absolute; top: 56px; height: 18px;
  border-left: 2px solid var(--oxblood);
  border-right: 2px solid var(--oxblood);
  border-bottom: 2px solid var(--oxblood);
  pointer-events: none;
  transition: left 280ms cubic-bezier(0.2, 0.7, 0.2, 1),
              width 280ms cubic-bezier(0.2, 0.7, 0.2, 1);
}
.tape-lab .tl-bracket-label {
  position: absolute; top: 80px;
  font-family: var(--f-mono); font-weight: 700; font-size: 14px;
  letter-spacing: 0.12em; color: var(--oxblood);
  background: var(--paper); padding: 0 10px;
  transform: translateX(-50%);
  transition: left 280ms cubic-bezier(0.2, 0.7, 0.2, 1);
}

.tape-lab .tl-ticks {
  position: relative; margin: 80px 12px 0;
  height: 20px; border-top: 1px solid var(--ink-faded);
}
.tape-lab .tl-tick {
  position: absolute; top: 0;
  width: 1px; height: 6px; background: var(--ink-faded);
}
.tape-lab .tl-tick.major { height: 10px; background: var(--ink); }
.tape-lab .tl-tick-num {
  position: absolute; top: 12px; transform: translateX(-50%);
  font-family: var(--f-mono); font-size: 9px; font-weight: 600;
  color: var(--ink-faded); letter-spacing: 0.08em;
}
.tape-lab .tl-pulse {
  position: absolute; top: 16px;
  width: 4px; height: 22px; transform: translateX(-50%);
  border-radius: 1px; pointer-events: none; z-index: 1;
}

/* formula */
.tape-lab .tl-formula {
  background: linear-gradient(180deg, var(--tape-edge) 0%, var(--tape) 100%);
  border: 2px solid var(--ink);
  padding: 22px 24px; margin: 0 0 22px;
  position: relative;
  box-shadow: inset 0 4px 16px rgba(0,0,0,0.6);
  text-align: center;
}
.tape-lab .tl-formula::before {
  content: ''; position: absolute; inset: 0;
  background: repeating-linear-gradient(0deg, transparent 0, transparent 2px, rgba(255,179,71,0.04) 2px, rgba(255,179,71,0.04) 3px);
  pointer-events: none;
}
.tape-lab .tl-formula-eq {
  font-family: var(--f-mono); font-size: 14px;
  color: rgba(255,179,71,0.6); letter-spacing: 0.05em; margin-bottom: 6px;
}
.tape-lab .tl-formula-eq em {
  color: var(--amber); font-style: normal; font-weight: 700;
  text-shadow: 0 0 10px var(--amber-glow);
}
.tape-lab .tl-formula-result {
  font-family: var(--f-mono); font-weight: 800;
  font-size: clamp(56px, 9vw, 96px); line-height: 0.85;
  letter-spacing: -0.05em; color: var(--amber);
  text-shadow: 0 0 18px var(--amber-glow);
  font-feature-settings: 'tnum';
}
.tape-lab .tl-formula-unit {
  font-family: var(--f-mono); font-size: 18px; font-weight: 600;
  color: rgba(255,179,71,0.65); letter-spacing: 0.18em;
  margin-left: 6px; vertical-align: 0.55em;
}

/* loop control + LEDs */
.tape-lab .tl-loop-row {
  display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
  border: 1.5px solid var(--ink); background: var(--paper);
  padding: 14px 18px; margin: 0 0 18px;
}
.tape-lab .tl-loop-btn {
  font-family: var(--f-mono); font-weight: 700; font-size: 11px;
  letter-spacing: 0.2em; text-transform: uppercase;
  padding: 12px 22px; cursor: pointer; user-select: none;
  border: 1.5px solid var(--ink); background: var(--paper); color: var(--ink);
  transition: background 100ms, color 100ms;
}
.tape-lab .tl-loop-btn:hover { background: var(--paper-edge); }
.tape-lab .tl-loop-btn.on { background: var(--oxblood); color: var(--paper); border-color: var(--oxblood); }
.tape-lab .tl-loop-label {
  font-family: var(--f-mono); font-size: 10px; letter-spacing: 0.22em;
  text-transform: uppercase; color: var(--ink-faded);
}
.tape-lab .tl-beat-leds { display: flex; gap: 9px; align-items: center; margin-left: auto; }
.tape-lab .tl-beat-led {
  width: 12px; height: 12px; border-radius: 50%;
  background: rgba(26,22,18,0.4);
  border: 1.5px solid var(--ink);
  transition: background 60ms ease-out, box-shadow 80ms ease-out;
}
.tape-lab .tl-beat-led.on {
  background: var(--amber);
  box-shadow: 0 0 12px var(--amber-glow), inset 0 0 4px rgba(255,255,255,0.4);
}

/* pads */
.tape-lab .tl-pads { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; margin: 0 0 22px; }
@media (max-width: 700px) { .tape-lab .tl-pads { grid-template-columns: repeat(3, 1fr); } }
.tape-lab .tl-pad {
  border: 1.5px solid var(--ink);
  background: linear-gradient(155deg, var(--paper) 0%, var(--paper-deep) 100%);
  padding: 16px 14px; cursor: pointer; user-select: none;
  font-family: var(--f-mono); font-weight: 700; font-size: 11px;
  letter-spacing: 0.18em; text-transform: uppercase; color: var(--ink);
  position: relative; overflow: hidden;
  transition: transform 80ms ease-out, background 100ms;
}
.tape-lab .tl-pad:hover { background: linear-gradient(155deg, var(--paper-deep), var(--paper-edge)); }
.tape-lab .tl-pad:active { transform: translateY(1px); }
.tape-lab .tl-pad-key {
  font-family: var(--f-mono); font-weight: 800; font-size: 16px;
  display: block; margin-bottom: 4px; opacity: 0.6;
}

/* controls */
.tape-lab .tl-controls {
  display: grid; grid-template-columns: 1fr; gap: 22px;
  border: 1.5px solid var(--ink); background: var(--paper); padding: 22px;
  margin-bottom: 28px;
}
@media (min-width: 700px) { .tape-lab .tl-controls { grid-template-columns: 1fr 1fr; } }
.tape-lab .tl-ctrl-label {
  font-family: var(--f-mono); font-weight: 700; font-size: 10px;
  letter-spacing: 0.22em; text-transform: uppercase; color: var(--ink-faded);
  margin-bottom: 12px;
}
.tape-lab .tl-bpm-row { display: flex; align-items: baseline; gap: 16px; flex-wrap: wrap; }
.tape-lab .tl-bpm-display {
  font-family: var(--f-display); font-weight: 800;
  font-size: 44px; line-height: 0.9; letter-spacing: -0.04em;
}
.tape-lab .tl-bpm-display .small {
  font-size: 12px; color: var(--ink-faded); margin-left: 6px; vertical-align: 1.5em;
  letter-spacing: 0.2em; font-family: var(--f-mono); font-weight: 600; text-transform: uppercase;
}
.tape-lab .tl-bpm-slider {
  flex: 1; min-width: 160px; appearance: none;
  height: 6px; background: var(--ink); outline: none; cursor: pointer;
}
.tape-lab .tl-bpm-slider::-webkit-slider-thumb {
  appearance: none; width: 22px; height: 22px;
  background: var(--oxblood); border: 2px solid var(--ink); cursor: ew-resize;
  box-shadow: 0 2px 0 var(--ink);
}
.tape-lab .tl-bpm-slider::-moz-range-thumb {
  width: 22px; height: 22px; background: var(--oxblood);
  border: 2px solid var(--ink); cursor: ew-resize;
}
.tape-lab .tl-bpm-presets { display: flex; gap: 6px; margin-top: 14px; flex-wrap: wrap; }
.tape-lab .tl-bpm-preset {
  font-family: var(--f-mono); font-size: 11px; font-weight: 600;
  padding: 6px 11px; border: 1.5px solid var(--ink); background: var(--paper);
  cursor: pointer; color: var(--ink); letter-spacing: 0.05em;
  transition: all 100ms ease-out;
}
.tape-lab .tl-bpm-preset:hover { background: var(--paper-edge); }
.tape-lab .tl-bpm-preset.active { background: var(--ink); color: var(--paper); }

.tape-lab .tl-notes { display: grid; grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)); gap: 6px; }
.tape-lab .tl-note-btn {
  border: 1.5px solid var(--ink); background: var(--paper);
  padding: 10px 6px; cursor: pointer; user-select: none;
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  font-family: var(--f-body); transition: all 100ms ease-out;
}
.tape-lab .tl-note-btn:hover { background: var(--paper-edge); }
.tape-lab .tl-note-btn.active { background: var(--ink); color: var(--paper); }
.tape-lab .tl-note-symbol { font-family: var(--f-display); font-size: 22px; line-height: 1; }
.tape-lab .tl-note-label  { font-family: var(--f-mono); font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; }
.tape-lab .tl-note-ms     { font-family: var(--f-mono); font-size: 11px; font-weight: 700; }

.tape-lab .tl-aside {
  font-family: var(--f-body); font-size: 14px; color: var(--ink-soft);
  line-height: 1.6; max-width: 640px; margin: 0 auto;
}
.tape-lab .tl-aside .tl-tag {
  font-family: var(--f-mono); font-size: 10px; color: var(--oxblood);
  display: inline-block; padding: 3px 8px; border: 1px solid var(--oxblood);
  margin-right: 8px; letter-spacing: 0.2em; text-transform: uppercase;
  vertical-align: 2px;
}
.tape-lab .tl-aside em { font-family: var(--f-mono); font-style: normal; color: var(--ink); font-weight: 600; }

/* drawer */
.tape-lab .tl-drawer-handle {
  position: fixed; right: 0; top: 50%; transform: translateY(-50%);
  display: flex; flex-direction: column; gap: 6px; z-index: 50;
}
.tape-lab .tl-drawer-handle button {
  writing-mode: vertical-rl; transform: rotate(180deg);
  padding: 14px 8px; cursor: pointer;
  font-family: var(--f-mono); font-weight: 700; font-size: 10px;
  letter-spacing: 0.22em; text-transform: uppercase;
  background: var(--ink); color: var(--paper); border: none;
  border-left: 2px solid var(--oxblood);
  transition: background 120ms;
}
.tape-lab .tl-drawer-handle button:hover { background: var(--oxblood); border-left-color: var(--ink); }

.tape-lab .tl-drawer-overlay {
  position: fixed; inset: 0; background: rgba(26,22,18,0.4);
  z-index: 60; backdrop-filter: blur(2px);
  animation: tl-fade 200ms ease-out;
}
.tape-lab .tl-drawer {
  position: fixed; top: 0; right: 0; bottom: 0;
  width: min(560px, 92vw); background: var(--paper);
  border-left: 3px solid var(--ink); z-index: 61;
  overflow-y: auto; padding: 32px 36px 60px;
  box-shadow: -12px 0 32px rgba(0,0,0,0.18);
  animation: tl-slide-in 280ms cubic-bezier(0.2, 0.7, 0.2, 1);
}
@keyframes tl-slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
@keyframes tl-fade  { from { opacity: 0; } to { opacity: 1; } }

.tape-lab .tl-drawer-close {
  position: absolute; top: 16px; right: 16px;
  width: 32px; height: 32px; border: 1.5px solid var(--ink);
  background: var(--paper); cursor: pointer;
  font-family: var(--f-mono); font-size: 16px; line-height: 1;
}
.tape-lab .tl-drawer h2 {
  font-family: var(--f-display); font-weight: 800;
  font-size: 36px; letter-spacing: -0.025em; margin: 0 0 8px;
}
.tape-lab .tl-drawer .tl-drawer-eyebrow {
  font-family: var(--f-mono); font-size: 11px; font-weight: 600;
  letter-spacing: 0.25em; text-transform: uppercase; color: var(--oxblood);
  margin-bottom: 20px;
}
.tape-lab .tl-drawer h3 {
  font-family: var(--f-display); font-weight: 600; font-style: italic;
  font-size: 22px; margin: 28px 0 10px; color: var(--oxblood);
}
.tape-lab .tl-drawer p, .tape-lab .tl-drawer li {
  font-family: var(--f-body); font-size: 15px; line-height: 1.65; color: var(--ink-soft);
}
.tape-lab .tl-drawer .tl-formula-block {
  font-family: var(--f-mono); font-weight: 600; font-size: 18px;
  background: var(--ink); color: var(--amber);
  padding: 16px 20px; margin: 16px 0;
  text-align: center; letter-spacing: 0.04em;
  text-shadow: 0 0 8px var(--amber-glow);
}
.tape-lab .tl-ref-table { width: 100%; border-collapse: collapse; margin-top: 12px; font-family: var(--f-mono); font-size: 12px; }
.tape-lab .tl-ref-table th, .tape-lab .tl-ref-table td { padding: 8px 5px; text-align: right; border-bottom: 1px solid var(--paper-edge); }
.tape-lab .tl-ref-table th { font-size: 10px; letter-spacing: 0.15em; color: var(--ink-faded); text-transform: uppercase; font-weight: 700; }
.tape-lab .tl-ref-table td:first-child, .tape-lab .tl-ref-table th:first-child { text-align: left; font-weight: 600; color: var(--ink); }
.tape-lab .tl-ref-table tr.clickable:hover td { background: var(--paper-deep); cursor: pointer; }
.tape-lab .tl-ref-bpm { font-weight: 700; color: var(--oxblood); }
.tape-lab .tl-ref-genre { font-size: 10px; color: var(--ink-faded); letter-spacing: 0.05em; }

/* copy buttons */
.tape-lab .tl-copy-row { display: flex; gap: 8px; margin: 8px 0 24px; flex-wrap: wrap; align-items: center; }
.tape-lab .tl-copy-btn {
  font-family: var(--f-mono); font-weight: 700; font-size: 10px;
  letter-spacing: 0.2em; text-transform: uppercase;
  padding: 9px 14px; cursor: pointer;
  background: var(--paper); color: var(--ink);
  border: 1.5px solid var(--ink); transition: all 100ms;
}
.tape-lab .tl-copy-btn:hover { background: var(--paper-edge); }
.tape-lab .tl-copy-btn.copied { background: var(--phosphor); border-color: var(--phosphor); }
.tape-lab .tl-copy-hint {
  color: var(--ink-faded); font-family: var(--f-body); font-weight: 500;
  font-size: 11px; letter-spacing: 0.02em;
}

/* ════════════════════════════════════════════════════════════════════
   TAB NAV — Lesson · Visualise · Practice
   ════════════════════════════════════════════════════════════════════ */
.tape-lab .tl-tabs {
  display: flex; gap: 0; margin: -8px 0 28px;
  border-top: 2px solid var(--ink); border-bottom: 2px solid var(--ink);
  background: var(--paper);
}
.tape-lab .tl-tab-btn {
  flex: 1; padding: 14px 10px;
  font-family: var(--f-mono); font-weight: 700; font-size: 11px;
  letter-spacing: 0.22em; text-transform: uppercase;
  background: transparent; border: none;
  border-right: 1px solid var(--paper-edge);
  color: var(--ink-faded); cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 10px;
  transition: background 100ms, color 100ms;
}
.tape-lab .tl-tab-btn:last-child { border-right: none; }
.tape-lab .tl-tab-btn:hover { background: var(--paper-edge); color: var(--ink); }
.tape-lab .tl-tab-btn.active {
  background: var(--ink); color: var(--paper);
}
.tape-lab .tl-tab-btn .tl-tab-num {
  font-size: 9px; opacity: 0.6; font-weight: 600;
}

/* margin glossary (Direction A polish) */
.tape-lab .tl-margin-glossary {
  margin-top: 18px;
  display: flex; flex-direction: column; gap: 14px;
}
.tape-lab .tl-margin-note {
  font-family: var(--f-body); font-size: 12.5px;
  line-height: 1.5; color: var(--ink-soft);
  border-left: 2px solid var(--oxblood);
  padding: 4px 0 4px 12px;
}
.tape-lab .tl-margin-term {
  display: block;
  font-family: var(--f-mono); font-weight: 700; font-size: 10px;
  letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--oxblood); margin-bottom: 4px;
}

/* spec footer */
.tape-lab .tl-spec-footer {
  display: flex; justify-content: space-between; align-items: center;
  border-top: 2px solid var(--ink); padding-top: 14px; margin-top: 28px;
  font-family: var(--f-mono); font-size: 10.5px;
  letter-spacing: 0.18em; text-transform: uppercase; color: var(--ink-faded);
  flex-wrap: wrap; gap: 8px;
}
.tape-lab .tl-spec-footer strong { color: var(--ink); font-weight: 700; }

/* ════════════════════════════════════════════════════════════════════
   B — TAPE TRANSPORT (animated, draggable head, travelling hits)
   ════════════════════════════════════════════════════════════════════ */
.tape-lab .tl-bx {
  background: radial-gradient(120% 80% at 50% 0%, #2a1c14 0%, var(--tape) 50%, var(--tape-edge) 100%);
  border: 2px solid var(--ink);
  padding: 24px 26px; margin-bottom: 28px;
  color: var(--paper);
  box-shadow: 0 4px 0 var(--ink), 6px 8px 0 rgba(26,22,18,0.08);
}
.tape-lab .tl-bx-head {
  display: flex; justify-content: space-between; align-items: flex-end;
  gap: 16px; flex-wrap: wrap; margin-bottom: 18px;
}
.tape-lab .tl-bx-eyebrow {
  font-family: var(--f-mono); font-weight: 700; font-size: 10px;
  letter-spacing: 0.22em; text-transform: uppercase;
  color: var(--amber); text-shadow: 0 0 6px var(--amber-glow);
  margin-bottom: 8px;
}
.tape-lab .tl-bx-title {
  font-family: var(--f-display); font-weight: 600; font-size: 32px;
  letter-spacing: -0.02em; line-height: 1; margin: 0;
}
.tape-lab .tl-bx-deck {
  font-family: var(--f-display); font-style: italic; font-size: 14px;
  color: #c8b89a; max-width: 520px; margin-top: 6px; line-height: 1.45;
}
.tape-lab .tl-bx-controls {
  display: flex; gap: 10px; align-items: center; flex-wrap: wrap;
}
.tape-lab .tl-bx-btn {
  font-family: var(--f-mono); font-weight: 700; font-size: 10px;
  letter-spacing: 0.2em; text-transform: uppercase;
  padding: 10px 14px; cursor: pointer;
  background: var(--amber); color: #1a0f06;
  border: 1.5px solid var(--amber); display: inline-flex; align-items: center; gap: 8px;
}
.tape-lab .tl-bx-btn:hover { background: var(--amber-glow); }
.tape-lab .tl-bx-tri {
  width: 0; height: 0;
  border-left: 8px solid currentColor;
  border-top: 5px solid transparent; border-bottom: 5px solid transparent;
}
.tape-lab .tl-bx-chip {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 8px 12px; background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  font-family: var(--f-mono); font-size: 11px; color: var(--paper);
}
.tape-lab .tl-bx-chip-k { color: #c8b89a; letter-spacing: 0.14em; font-size: 10px; text-transform: uppercase; }
.tape-lab .tl-bx-chip-v { color: var(--amber-glow); font-weight: 700; }

.tape-lab .tl-bx-reels {
  display: flex; justify-content: space-between; align-items: center;
  padding: 0 40px; position: relative; z-index: 2; margin-bottom: -16px;
}
.tape-lab .tl-bx-reel {
  width: 80px; height: 80px; border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #c9b78a, #6a543a 60%, #2a1d12 100%);
  border: 1px solid #1a1108;
  box-shadow: inset 0 0 0 4px rgba(0,0,0,0.5), inset 0 0 0 5px rgba(255,255,255,0.05);
  position: relative;
}
.tape-lab .tl-bx-reel.spinning { animation: tl-bx-reel 4s linear infinite; }
.tape-lab .tl-bx-reel-pair { display: flex; gap: 24px; align-items: center; }
.tape-lab .tl-bx-reel::after {
  content: ''; position: absolute; left: 50%; top: 50%;
  width: 14px; height: 14px; background: #0a0604;
  border: 1px solid #2a1d12; border-radius: 50%;
  transform: translate(-50%, -50%);
}
.tape-lab .tl-bx-reel .tl-bx-reel-spoke {
  position: absolute; left: 50%; top: 50%;
  width: 28px; height: 1.5px; background: rgba(255,230,180,0.35);
  transform-origin: 0 0;
}
@keyframes tl-bx-reel { to { transform: rotate(360deg); } }

.tape-lab .tl-bx-readout {
  background: linear-gradient(180deg, #1a110a 0%, #0e0805 100%);
  color: var(--amber); border: 1px solid #2c1d12;
  padding: 12px 18px;
  font-family: var(--f-mono); font-size: 12px;
  letter-spacing: 0.16em; text-transform: uppercase;
  text-shadow: 0 0 8px var(--amber-glow);
}
.tape-lab .tl-bx-readout-big {
  color: var(--amber-glow); font-size: 22px; font-weight: 700;
  text-shadow: 0 0 10px rgba(247,192,105,0.7);
  letter-spacing: 0.04em;
}

.tape-lab .tl-bx-tape-lane {
  position: relative; height: 180px;
  background: linear-gradient(180deg, #1d140d, #0f0805);
  border: 1px solid #3a2a1c; overflow: hidden;
  margin-top: 16px;
}
.tape-lab .tl-bx-tape {
  position: absolute; left: 0; right: 0; top: 40px; bottom: 60px;
  background:
    repeating-linear-gradient(90deg, rgba(255,210,150,0.05) 0 1px, transparent 1px 6px),
    linear-gradient(180deg, #a18253, #5a4528);
  background-size: 6px 100%, 100% 100%;
  border-top: 1px solid #6a4a2a; border-bottom: 1px solid #6a4a2a;
}
.tape-lab .tl-bx-tape.running {
  animation: tl-bx-tape 1.5s linear infinite;
}
@keyframes tl-bx-tape {
  from { background-position: 0 0, 0 0; }
  to   { background-position: -120px 0, 0 0; }
}

.tape-lab .tl-bx-big-head {
  position: absolute; top: 22px; width: 36px; height: 96px;
  transform: translateX(-50%);
}
.tape-lab .tl-bx-big-head .tl-bx-bh-body {
  position: absolute; inset: 0;
  background: linear-gradient(180deg,#e8d6ad,#9a7f50 60%,#6a4f28);
  border: 1px solid #2a1d12;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.25);
}
.tape-lab .tl-bx-big-head.glow .tl-bx-bh-body {
  box-shadow: 0 0 18px var(--amber-glow), inset 0 0 0 1px rgba(255,255,255,0.25);
}
.tape-lab .tl-bx-big-head .tl-bx-bh-gap {
  position: absolute; inset: 14px 8px 30px;
  background: var(--oxblood); border-radius: 1px;
}
.tape-lab .tl-bx-big-head.record .tl-bx-bh-gap { background: #c2333a; box-shadow: 0 0 14px #c2333acc inset; }
.tape-lab .tl-bx-big-head.playback .tl-bx-bh-gap { background: var(--amber-glow); box-shadow: 0 0 14px var(--amber-glow) inset; }
.tape-lab .tl-bx-big-head.erase .tl-bx-bh-gap { background: #6a584a; }
.tape-lab .tl-bx-big-head .tl-bx-bh-label {
  position: absolute; bottom: -22px; left: 50%; transform: translateX(-50%);
  color: #e9d8b3; font-family: var(--f-mono); font-size: 9px;
  letter-spacing: 0.2em; text-transform: uppercase; white-space: nowrap;
}
.tape-lab .tl-bx-big-head.draggable { cursor: ew-resize; }
.tape-lab .tl-bx-big-head .tl-bx-bh-arrow {
  position: absolute; top: -16px; left: 50%; transform: translateX(-50%);
  color: var(--amber); font-size: 14px; font-family: var(--f-mono);
}

.tape-lab .tl-bx-bracket {
  position: absolute; top: 14px; height: 18px; pointer-events: none;
}
.tape-lab .tl-bx-bracket::before {
  content: ''; position: absolute; inset: 0 0 6px 0;
  border-left: 1px solid var(--amber);
  border-right: 1px solid var(--amber);
  border-bottom: 1px solid var(--amber);
  opacity: 0.7;
}
.tape-lab .tl-bx-bracket-label {
  position: absolute; left: 50%; top: -7px; transform: translateX(-50%);
  background: #1d140d; padding: 0 8px;
  color: var(--amber-glow); font-family: var(--f-mono); font-size: 12px; font-weight: 700;
  text-shadow: 0 0 8px rgba(247,192,105,0.6);
}
.tape-lab .tl-bx-hit {
  position: absolute; top: 78px; width: 12px; height: 12px;
  border-radius: 50%; transform: translateX(-50%);
  background: var(--amber-glow);
  box-shadow: 0 0 12px var(--amber-glow), 0 0 30px rgba(247,192,105,0.5);
  pointer-events: none;
}
.tape-lab .tl-bx-trace {
  position: absolute; bottom: 10px; width: 2px; height: 30px;
  background: var(--amber); box-shadow: 0 0 10px var(--amber-glow);
  transition: opacity 60ms;
}
.tape-lab .tl-bx-ruler {
  position: absolute; left: 0; right: 0; bottom: 4px;
  display: flex; justify-content: space-between;
  color: #c8b89a; font-family: var(--f-mono); font-size: 10px;
  letter-spacing: 0.1em;
  padding: 0 200px;
}

.tape-lab .tl-bx-snaps {
  display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; margin-top: 14px;
}
@media (max-width: 700px) { .tape-lab .tl-bx-snaps { grid-template-columns: repeat(3, 1fr); } }
.tape-lab .tl-bx-snap {
  background: rgba(255,255,255,0.04); color: var(--paper);
  border: 1px solid rgba(255,255,255,0.1);
  padding: 10px 8px; cursor: pointer;
  font-family: var(--f-body); font-size: 10px;
  letter-spacing: 0.14em; text-transform: uppercase;
  display: flex; justify-content: space-between; align-items: center; gap: 8px;
}
.tape-lab .tl-bx-snap:hover { background: rgba(255,255,255,0.08); }
.tape-lab .tl-bx-snap.active {
  background: var(--amber); color: #1a0f06; border-color: var(--amber);
}
.tape-lab .tl-bx-snap-ms { font-family: var(--f-mono); font-weight: 700; }
.tape-lab .tl-bx-foot {
  display: flex; justify-content: space-between; align-items: center;
  margin-top: 14px; flex-wrap: wrap; gap: 8px;
  font-family: var(--f-mono); font-size: 10px;
  color: #c8b89a; letter-spacing: 0.16em; text-transform: uppercase;
}

/* ════════════════════════════════════════════════════════════════════
   C — BEAT GRID + OSCILLOSCOPE
   ════════════════════════════════════════════════════════════════════ */
.tape-lab .tl-bc {
  background: var(--paper);
  border: 2px solid var(--ink);
  padding: 28px 30px;
  box-shadow: 0 4px 0 var(--ink), 6px 8px 0 rgba(26,22,18,0.08);
}
.tape-lab .tl-bc-head {
  display: flex; justify-content: space-between; align-items: flex-end;
  gap: 16px; flex-wrap: wrap;
}
.tape-lab .tl-bc-eyebrow {
  font-family: var(--f-mono); font-weight: 700; font-size: 10px;
  letter-spacing: 0.22em; text-transform: uppercase; color: var(--oxblood);
  margin-bottom: 6px;
}
.tape-lab .tl-bc-title {
  font-family: var(--f-display); font-weight: 600;
  font-size: 36px; letter-spacing: -0.02em; line-height: 1; margin: 0;
}
.tape-lab .tl-bc-title em { font-style: italic; color: var(--oxblood); font-weight: 400; }
.tape-lab .tl-bc-deck {
  font-family: var(--f-display); font-style: italic; font-size: 15px;
  color: var(--ink-soft); margin-top: 6px; max-width: 600px; line-height: 1.45;
}
.tape-lab .tl-bc-readout {
  background: linear-gradient(180deg, #1a110a 0%, #0e0805 100%);
  color: var(--amber); border: 1px solid #2c1d12;
  padding: 12px 16px; text-align: right; min-width: 180px;
  text-shadow: 0 0 8px var(--amber-glow);
}
.tape-lab .tl-bc-readout-eyebrow {
  font-family: var(--f-mono); font-size: 10px; letter-spacing: 0.18em;
  text-transform: uppercase; opacity: 0.7;
}
.tape-lab .tl-bc-readout-big {
  font-family: var(--f-mono); font-size: 32px; font-weight: 800;
  color: var(--amber-glow); line-height: 1; margin-top: 4px;
  font-feature-settings: 'tnum';
}
.tape-lab .tl-bc-readout-unit { font-size: 13px; opacity: 0.7; margin-left: 2px; }

.tape-lab .tl-bc-rule {
  height: 0; border: none; border-top: 2px solid var(--ink); margin: 18px 0;
}

.tape-lab .tl-bc-picker {
  display: grid; grid-template-columns: repeat(8, 1fr); gap: 6px; margin-bottom: 14px;
}
@media (max-width: 900px) { .tape-lab .tl-bc-picker { grid-template-columns: repeat(4, 1fr); } }
.tape-lab .tl-bc-pick {
  background: var(--paper-edge);
  border: 1px solid var(--paper-edge);
  padding: 9px 10px; cursor: pointer; text-align: left;
  transition: all 120ms;
}
.tape-lab .tl-bc-pick-label {
  font-family: var(--f-mono); font-size: 9.5px; letter-spacing: 0.14em;
  text-transform: uppercase; color: var(--ink-faded);
}
.tape-lab .tl-bc-pick-ms {
  font-family: var(--f-mono); font-size: 13px; font-weight: 700;
  margin-top: 2px; color: var(--ink);
}
.tape-lab .tl-bc-pick.active .tl-bc-pick-label { color: rgba(255,255,255,0.75); }
.tape-lab .tl-bc-pick.active .tl-bc-pick-ms { color: var(--paper); }

.tape-lab .tl-bc-grid-frame {
  background: var(--paper);
  border: 1.5px solid var(--ink);
  padding: 14px 18px; position: relative;
}
.tape-lab .tl-bc-grid-head {
  display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;
}
.tape-lab .tl-bc-grid-cap {
  font-family: var(--f-mono); font-weight: 700; font-size: 10px;
  letter-spacing: 0.18em; text-transform: uppercase; color: var(--oxblood);
}
.tape-lab .tl-bc-grid-cap-r {
  font-family: var(--f-mono); font-weight: 500; font-size: 10px;
  letter-spacing: 0.14em; text-transform: uppercase; color: var(--ink-faded);
}
.tape-lab .tl-bc-row {
  position: relative; height: 26px; margin-bottom: 4px;
  padding-left: 86px; padding-right: 8px;
  cursor: pointer; transition: background 0.15s;
  border-radius: 2px;
}
.tape-lab .tl-bc-row.active { background: rgba(122,31,43,0.05); }
.tape-lab .tl-bc-row-label {
  position: absolute; left: 0; top: 6px; width: 80px;
  font-family: var(--f-mono); font-weight: 500; font-size: 10px;
  letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink-faded);
}
.tape-lab .tl-bc-row.active .tl-bc-row-label {
  font-weight: 700;
}
.tape-lab .tl-bc-row-line {
  position: absolute; left: 86px; right: 8px; top: 12px; height: 1px;
  background: var(--paper-edge);
}
.tape-lab .tl-bc-marker {
  position: absolute; top: 4px; width: 8px; height: 18px;
  border-radius: 2px;
  background: #bfae8a; opacity: 0.55;
  transform: translateX(-50%);
}
.tape-lab .tl-bc-row.active .tl-bc-marker { opacity: 1; }

.tape-lab .tl-bc-beats {
  position: relative; height: 18px;
  padding-left: 86px; padding-right: 8px; margin-top: 6px;
  border-top: 1px dashed var(--paper-edge);
}
.tape-lab .tl-bc-beat {
  position: absolute; top: 4px;
  font-family: var(--f-mono); font-size: 11px; color: var(--ink-faded);
  transform: translateX(-50%);
}

.tape-lab .tl-bc-osc-frame {
  background: linear-gradient(180deg, #1a110a 0%, #0e0805 100%);
  border: 1px solid #2c1d12;
  padding: 14px 18px; margin-top: 14px;
  box-shadow: inset 0 0 60px rgba(232,158,60,0.06);
}
.tape-lab .tl-bc-osc-head {
  display: flex; justify-content: space-between; align-items: center;
  font-family: var(--f-mono); font-size: 10px; letter-spacing: 0.18em;
  text-transform: uppercase; color: var(--amber); opacity: 0.85;
  text-shadow: 0 0 6px var(--amber-glow); margin-bottom: 10px;
}

/* ════════════════════════════════════════════════════════════════════
   D — PRACTICE / CHECK UNDERSTANDING
   ════════════════════════════════════════════════════════════════════ */
.tape-lab .tl-bd-head {
  display: flex; justify-content: space-between; align-items: flex-end;
  gap: 16px; flex-wrap: wrap; margin-bottom: 18px;
}
.tape-lab .tl-bd-mode {
  display: flex; gap: 4px; background: var(--paper-edge);
  padding: 3px; border: 1px solid var(--paper-edge);
}
.tape-lab .tl-bd-mode-btn {
  font-family: var(--f-mono); font-size: 10px; font-weight: 700;
  letter-spacing: 0.18em; text-transform: uppercase;
  padding: 8px 14px; cursor: pointer; border: none;
  background: transparent; color: var(--ink-soft);
}
.tape-lab .tl-bd-mode-btn.active {
  background: var(--ink); color: var(--paper);
}
.tape-lab .tl-bd-grid {
  display: grid; grid-template-columns: 1.05fr 1fr; gap: 18px;
}
@media (max-width: 880px) { .tape-lab .tl-bd-grid { grid-template-columns: 1fr; } }
.tape-lab .tl-bd-card {
  background: var(--paper);
  border: 2px solid var(--ink);
  padding: 22px 24px;
  box-shadow: 0 4px 0 var(--ink), 6px 8px 0 rgba(26,22,18,0.08);
}
.tape-lab .tl-bd-cap {
  font-family: var(--f-mono); font-weight: 700; font-size: 10px;
  letter-spacing: 0.22em; text-transform: uppercase; color: var(--oxblood);
  margin-bottom: 10px;
}
.tape-lab .tl-bd-q {
  font-family: var(--f-display); font-size: 19px; line-height: 1.4;
  color: var(--ink-soft);
}
.tape-lab .tl-bd-q strong { color: var(--ink); font-weight: 700; }
.tape-lab .tl-bd-q em { color: var(--oxblood); font-style: italic; }
.tape-lab .tl-bd-working {
  margin-top: 16px; padding: 14px 16px;
  background: var(--paper-edge);
  border: 1px solid var(--paper-edge);
}
.tape-lab .tl-bd-working-cap {
  font-family: var(--f-mono); font-weight: 700; font-size: 9.5px;
  letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--ink-faded); margin-bottom: 8px;
}
.tape-lab .tl-bd-working-line {
  font-family: var(--f-mono); font-size: 13px; line-height: 1.9;
  color: var(--ink-soft);
}
.tape-lab .tl-bd-working-result {
  background: var(--ink); color: var(--amber-glow);
  padding: 2px 8px; font-weight: 700;
  text-shadow: 0 0 8px rgba(247,192,105,0.6);
}
.tape-lab .tl-bd-teach {
  margin-top: 14px; padding-top: 12px;
  border-top: 1px dashed var(--paper-edge);
  font-family: var(--f-body); font-size: 12.5px; color: var(--ink-faded);
  line-height: 1.55;
}
.tape-lab .tl-bd-teach strong { color: var(--oxblood); }

.tape-lab .tl-bd-solve-row {
  margin-top: 16px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
}
.tape-lab .tl-bd-solve-label {
  font-family: var(--f-mono); font-size: 10px; font-weight: 700;
  letter-spacing: 0.18em; text-transform: uppercase; color: var(--ink-faded);
}
.tape-lab .tl-bd-solve-input {
  width: 110px; padding: 10px 12px;
  background: var(--paper-edge); border: 1.5px solid var(--ink);
  font-family: var(--f-mono); font-size: 22px; font-weight: 700;
  color: var(--ink); outline: none; text-align: center;
}
.tape-lab .tl-bd-solve-btn {
  font-family: var(--f-mono); font-weight: 700; font-size: 10px;
  letter-spacing: 0.2em; text-transform: uppercase;
  padding: 11px 16px; cursor: pointer;
  background: var(--ink); color: var(--paper);
  border: 1.5px solid var(--ink);
}
.tape-lab .tl-bd-solve-btn:hover { background: var(--oxblood); border-color: var(--oxblood); }
.tape-lab .tl-bd-feedback {
  margin-top: 14px; padding: 12px 14px;
  font-family: var(--f-display); font-style: italic; font-size: 14px;
  color: var(--ink-soft); line-height: 1.5;
}
.tape-lab .tl-bd-feedback.ok {
  background: rgba(127,191,63,0.08);
  border: 1px solid rgba(127,191,63,0.3);
}
.tape-lab .tl-bd-feedback.no {
  background: rgba(122,31,43,0.06);
  border: 1px solid rgba(122,31,43,0.3);
}
.tape-lab .tl-bd-feedback strong { color: var(--oxblood); font-style: normal; font-weight: 700; }
.tape-lab .tl-bd-feedback .hint {
  font-family: var(--f-mono); font-style: normal; font-size: 12px;
  color: var(--ink-faded); display: block; margin-top: 4px;
}

.tape-lab .tl-bd-try {
  margin-top: 14px; padding: 12px 14px;
  background: #efe2c4; border: 1px solid var(--paper-edge);
  border-left: 3px solid var(--oxblood);
}
.tape-lab .tl-bd-try-tag {
  font-family: var(--f-mono); font-weight: 700; font-size: 9.5px;
  letter-spacing: 0.2em; text-transform: uppercase; color: var(--oxblood);
  margin-bottom: 4px;
}
.tape-lab .tl-bd-try p {
  font-family: var(--f-display); font-style: italic; font-size: 14px;
  color: var(--ink-soft); line-height: 1.45; margin: 0;
}

.tape-lab .tl-bd-presets-head {
  display: flex; justify-content: space-between; align-items: baseline;
  margin-top: 22px; margin-bottom: 10px; flex-wrap: wrap; gap: 8px;
}
.tape-lab .tl-bd-presets {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;
}
@media (max-width: 880px) { .tape-lab .tl-bd-presets { grid-template-columns: 1fr; } }
.tape-lab .tl-bd-preset {
  text-align: left; cursor: pointer;
  background: var(--paper); border: 1.5px solid var(--paper-edge);
  border-left: 3px solid var(--paper-edge);
  padding: 14px 16px; transition: all 120ms;
}
.tape-lab .tl-bd-preset:hover { background: var(--paper-edge); }
.tape-lab .tl-bd-preset.active {
  background: #efe2c4; border-color: var(--oxblood); border-left-color: var(--oxblood);
}
.tape-lab .tl-bd-preset-row {
  display: flex; justify-content: space-between; align-items: center;
}
.tape-lab .tl-bd-preset-name {
  font-family: var(--f-display); font-size: 18px; font-weight: 600;
}
.tape-lab .tl-bd-preset-ms {
  font-family: var(--f-mono); font-size: 12px; color: var(--oxblood); font-weight: 700;
}
.tape-lab .tl-bd-preset-meta {
  font-family: var(--f-mono); font-size: 10px; color: var(--ink-faded);
  letter-spacing: 0.12em; text-transform: uppercase; margin-top: 4px;
}
.tape-lab .tl-bd-preset-blurb {
  font-family: var(--f-display); font-style: italic; font-size: 13px;
  color: var(--ink-soft); margin-top: 8px; line-height: 1.45;
}

.tape-lab .tl-bd-walk {
  margin-top: 18px; padding: 12px 16px;
  background: var(--paper); border: 1.5px solid var(--paper-edge);
  border-left: 3px solid var(--oxblood);
  display: flex; gap: 12px; align-items: center; flex-wrap: wrap;
}
.tape-lab .tl-bd-walk-cap {
  font-family: var(--f-mono); font-weight: 700; font-size: 10px;
  letter-spacing: 0.2em; text-transform: uppercase; color: var(--oxblood);
}
.tape-lab .tl-bd-walk-steps {
  display: flex; gap: 6px; flex: 1; flex-wrap: wrap;
}
.tape-lab .tl-bd-walk-step {
  background: var(--paper-edge);
  padding: 6px 10px;
  font-family: var(--f-mono); font-size: 10.5px;
  color: var(--ink-soft); display: flex; gap: 6px; align-items: center;
}
.tape-lab .tl-bd-walk-step .k {
  font-size: 9px; letter-spacing: 0.14em;
  text-transform: uppercase; color: var(--ink-faded);
}
`;

// ════════════════════════════════════════════════════════════════════
// NOTE VALUES & CONSTANTS
// ════════════════════════════════════════════════════════════════════
const NOTE_VALUES = [
  { id: 'whole',          label: 'Whole',     symbol: '𝅝',   multiplier: 4    },
  { id: 'half',           label: 'Half',      symbol: '𝅗𝅥',   multiplier: 2    },
  { id: 'dotted-quarter', label: 'Dot · 1/4', symbol: '♩.',  multiplier: 1.5  },
  { id: 'quarter',        label: 'Quarter',   symbol: '♩',   multiplier: 1    },
  { id: 'dotted-eighth',  label: 'Dot · 1/8', symbol: '♪.',  multiplier: 0.75 },
  { id: 'eighth',         label: 'Eighth',    symbol: '♪',   multiplier: 0.5  },
  { id: 'eighth-triplet', label: '1/8 Trip',  symbol: '♪³',  multiplier: 1/3  },
  { id: 'sixteenth',      label: 'Sixteenth', symbol: '𝅘𝅥𝅯',   multiplier: 0.25 },
];

const SOURCES = [
  { id: 'kick',  label: 'Kick',  key: '1' },
  { id: 'snare', label: 'Snare', key: '2' },
  { id: 'clap',  label: 'Clap',  key: '3' },
  { id: 'rim',   label: 'Rim',   key: '4' },
  { id: 'vox',   label: 'Vox',   key: '5' },
  { id: 'pluck', label: 'Pluck', key: '6' },
];

const PULSE_COLOR = {
  kick:  '#FFB347', snare: '#7FBF3F', clap:  '#FF8B5C',
  rim:   '#5FD4FF', vox:   '#E04AFF', pluck: '#A674FF',
};

const BPM_PRESETS = [60, 80, 100, 120, 140];
const RECORD_LEFT_PCT = 22;
const RAIL_LEFT_LIMIT = 96;
const MS_PER_PCT = 22;

const calcMs = (bpm, mult) => (60000 / bpm) * mult;
const playbackPctFor = (ms) => Math.min(RAIL_LEFT_LIMIT, RECORD_LEFT_PCT + ms / MS_PER_PCT);

// ════════════════════════════════════════════════════════════════════
// AUDIO SYNTHESIS
// ════════════════════════════════════════════════════════════════════
function makeNoise(ctx, durSec) {
  const buf = ctx.createBuffer(1, ctx.sampleRate * durSec, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource(); src.buffer = buf;
  return src;
}

const synths = {
  kick(ctx, when, dest, gain = 1) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(140, when);
    o.frequency.exponentialRampToValueAtTime(45, when + 0.18);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.9 * gain, when + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.4);
    o.connect(g); g.connect(dest);
    o.start(when); o.stop(when + 0.45);
  },
  snare(ctx, when, dest, gain = 1) {
    const noise = makeNoise(ctx, 0.2);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 1900; bp.Q.value = 1.2;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.0001, when);
    ng.gain.exponentialRampToValueAtTime(0.55 * gain, when + 0.002);
    ng.gain.exponentialRampToValueAtTime(0.0001, when + 0.18);
    noise.connect(bp); bp.connect(ng); ng.connect(dest);
    noise.start(when);
    // Body tone
    const o = ctx.createOscillator(), og = ctx.createGain();
    o.type = 'triangle'; o.frequency.value = 200;
    og.gain.setValueAtTime(0.0001, when);
    og.gain.exponentialRampToValueAtTime(0.3 * gain, when + 0.002);
    og.gain.exponentialRampToValueAtTime(0.0001, when + 0.08);
    o.connect(og); og.connect(dest);
    o.start(when); o.stop(when + 0.1);
  },
  clap(ctx, when, dest, gain = 1) {
    [0, 0.011, 0.024, 0.04].forEach((dt, i) => {
      const noise = makeNoise(ctx, 0.06);
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass'; bp.frequency.value = 1500; bp.Q.value = 1.5;
      const g = ctx.createGain();
      const peak = i === 3 ? 0.5 : 0.28;
      g.gain.setValueAtTime(0.0001, when + dt);
      g.gain.exponentialRampToValueAtTime(peak * gain, when + dt + 0.001);
      g.gain.exponentialRampToValueAtTime(0.0001, when + dt + 0.06);
      noise.connect(bp); bp.connect(g); g.connect(dest);
      noise.start(when + dt);
    });
  },
  rim(ctx, when, dest, gain = 1) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'square'; o.frequency.value = 1800;
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.45 * gain, when + 0.001);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.05);
    o.connect(g); g.connect(dest);
    o.start(when); o.stop(when + 0.06);
    const o2 = ctx.createOscillator(), g2 = ctx.createGain();
    o2.type = 'triangle'; o2.frequency.value = 320;
    g2.gain.setValueAtTime(0.0001, when);
    g2.gain.exponentialRampToValueAtTime(0.3 * gain, when + 0.001);
    g2.gain.exponentialRampToValueAtTime(0.0001, when + 0.04);
    o2.connect(g2); g2.connect(dest);
    o2.start(when); o2.stop(when + 0.05);
  },
  vox(ctx, when, dest, gain = 1) {
    const fundamental = 220;
    const harmonics = [
      { f: fundamental,     g: 0.3 },
      { f: fundamental * 2, g: 0.18 },
      { f: 750,             g: 0.22 },
      { f: 1200,            g: 0.14 },
      { f: 2500,            g: 0.06 },
    ];
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, when);
    env.gain.exponentialRampToValueAtTime(gain, when + 0.04);
    env.gain.linearRampToValueAtTime(0.5 * gain, when + 0.2);
    env.gain.exponentialRampToValueAtTime(0.0001, when + 0.45);
    env.connect(dest);
    harmonics.forEach(h => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = h.f;
      g.gain.value = h.g * 0.4;
      o.connect(g); g.connect(env);
      o.start(when); o.stop(when + 0.5);
    });
  },
  pluck(ctx, when, dest, gain = 1) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    o.type = 'sawtooth'; o.frequency.value = 330;
    lp.frequency.setValueAtTime(2400, when);
    lp.frequency.exponentialRampToValueAtTime(450, when + 0.3);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.5 * gain, when + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.4);
    o.connect(lp); lp.connect(g); g.connect(dest);
    o.start(when); o.stop(when + 0.45);
  }
};

// ════════════════════════════════════════════════════════════════════
// COPY-OUT CONTENT
// ════════════════════════════════════════════════════════════════════
const REF_BPMS_FULL = [60, 80, 100, 120, 140];
const REF_NOTES = [
  { label: 'Half',    mult: 2    },
  { label: 'Quarter', mult: 1    },
  { label: 'Eighth',  mult: 0.5  },
  { label: '16th',    mult: 0.25 },
];

function refTableText() {
  const header = 'BPM    HALF    QUARTER  EIGHTH  16TH';
  const rows = REF_BPMS_FULL.map(b => {
    const cells = REF_NOTES.map(n => String(Math.round(calcMs(b, n.mult))).padStart(7, ' '));
    return String(b).padEnd(6, ' ') + cells.join('  ');
  });
  return [header, ...rows].join('\n');
}
function refTableMd() {
  const header = '| BPM | Half | Quarter | Eighth | 16th |';
  const sep    = '|-----|------|---------|--------|------|';
  const rows = REF_BPMS_FULL.map(b => {
    const c = REF_NOTES.map(n => Math.round(calcMs(b, n.mult)));
    return `| ${b} | ${c[0]} | ${c[1]} | ${c[2]} | ${c[3]} |`;
  });
  return [header, sep, ...rows].join('\n');
}

const COPY_TEXTS = {
  'theory-text': () => `1.12 DELAY — THEORY

THE MATHS
BPM is beats per minute. One minute is 60,000 milliseconds. Divide and you get the duration of one beat — one quarter note in 4/4 time.

DELAY (ms) = 60,000 / BPM x NOTE

Multiply by a note value to scale up or down. Quarter = 1, eighth = 0.5 (twice as fast), half = 2 (twice as slow). Dotted notes multiply by 1.5; triplets multiply by 2/3.

THE TAPE CONNECTION
On a real Echoplex or Roland Space Echo, the formula isn't an abstraction — it's a piece of tape moving past two heads. The physical gap between the record head and the playback head, divided by the tape speed, IS the delay time.

WORKED EXAMPLE — 120 BPM, dotted eighth
1. Quarter:        60,000 / 120 = 500 ms
2. Eighth:         500 / 2      = 250 ms
3. Dotted eighth:  250 x 1.5    = 375 ms

375 ms is the iconic U2 / The Edge guitar delay. Each echo lands a sixteenth before the next eighth — weaving across the beat.

WATCH OUT FOR
- Forgetting milliseconds (writing 0.5 for a quarter at 120 BPM)
- Rounding too early — keep one decimal through the working
- Triplet maths: an eighth triplet = quarter / 3, not eighth / 3. Three triplet eighths fit in ONE beat.
- BPM always refers to the quarter note in 4/4. Always derive the quarter first, then scale.
`,
  'theory-md': () => `# Delay (1.12) — Theory

## The maths

BPM is *beats per minute*. One minute is 60,000 milliseconds. Divide and you get the duration of one beat — one quarter note in 4/4 time.

\`\`\`
DELAY (ms) = 60,000 ÷ BPM × NOTE
\`\`\`

Multiply by a note value to scale up or down:

- Quarter = 1
- Eighth = 0.5 (twice as fast)
- Half = 2 (twice as slow)
- Dotted notes multiply by 1.5
- Triplets multiply by 2/3

## The tape connection

On a real Echoplex or Roland Space Echo, the formula isn't an abstraction — it's a piece of tape moving past two heads. The **physical gap** between the record head and the playback head, divided by the tape speed, **is** the delay time.

## Worked example — 120 BPM, dotted eighth

1. **Quarter:** 60,000 ÷ 120 = **500 ms**
2. **Eighth:** 500 ÷ 2 = **250 ms**
3. **Dotted eighth:** 250 × 1.5 = **375 ms**

> 375 ms is the iconic U2 / The Edge guitar delay. Each echo lands a sixteenth before the next eighth — weaving across the beat.

## Watch out for

- Forgetting milliseconds (writing 0.5 for a quarter at 120 BPM).
- Rounding too early — keep one decimal through the working.
- Triplet maths: an eighth triplet = quarter ÷ 3, not eighth ÷ 3. Three triplet eighths fit in *one* beat.
- BPM always refers to the quarter note in 4/4. Always derive the quarter first, then scale.
`,
  'reference-text': () => `1.12 DELAY — REFERENCE

FORMULA
DELAY (ms) = 60,000 / BPM x NOTE

NOTE MULTIPLIERS
Whole         = 4
Half          = 2
Dotted 1/4    = 1.5
Quarter       = 1
Dotted 1/8    = 0.75
Eighth        = 0.5
1/8 triplet   = 0.333
Sixteenth     = 0.25

BPM x NOTE VALUE — DELAY TIMES (ms, rounded)

${refTableText()}
`,
  'reference-md': () => `# Delay (1.12) — Reference

## Formula

\`\`\`
DELAY (ms) = 60,000 ÷ BPM × NOTE
\`\`\`

## Note multipliers

| Note value | Multiplier |
|---|---|
| Whole | 4 |
| Half | 2 |
| Dotted quarter | 1.5 |
| Quarter | 1 |
| Dotted eighth | 0.75 |
| Eighth | 0.5 |
| Eighth triplet | 0.333… |
| Sixteenth | 0.25 |

## BPM × note value — delay times (ms)

${refTableMd()}
`,
};

async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {}
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); } catch (e) {}
  document.body.removeChild(ta);
  return true;
}

// ════════════════════════════════════════════════════════════════════
// NOTE ICON — SVG glyphs for all 8 note values
// (Unicode music symbols require SMuFL fonts; SVG is universal.)
// ════════════════════════════════════════════════════════════════════
const Stem = () => <rect x="14.5" y="4" width="1.6" height="20" fill="currentColor" />;
const HeadFilled = () => (
  <ellipse cx="9" cy="22" rx="6" ry="4.2" transform="rotate(-22 9 22)" fill="currentColor" />
);
const HeadHollow = () => (
  <ellipse cx="9" cy="22" rx="6" ry="4.2" transform="rotate(-22 9 22)"
    fill="none" stroke="currentColor" strokeWidth="1.8" />
);
const Dot = () => <circle cx="18.5" cy="22" r="1.4" fill="currentColor" />;
const Flag1 = () => (
  <path d="M 16 4 Q 22 7.5 19.5 13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
);
const Flag2 = () => (
  <path d="M 16 9 Q 22 12.5 19.5 17.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
);

function NoteIcon({ id, size = 22 }) {
  const w = size;
  const h = Math.round(size * 1.27);

  switch (id) {
    case 'whole':
      return (
        <svg viewBox="0 0 24 32" width={w} height={h} aria-hidden="true">
          <ellipse cx="12" cy="22" rx="7" ry="5" fill="none" stroke="currentColor" strokeWidth="2.4" />
          <ellipse cx="12" cy="22" rx="3.5" ry="4.6" transform="rotate(-30 12 22)" fill="currentColor" />
          <ellipse cx="12" cy="22" rx="2" ry="3.6" transform="rotate(-30 12 22)" fill="var(--paper, #fff)" />
        </svg>
      );
    case 'half':
      return (
        <svg viewBox="0 0 24 32" width={w} height={h} aria-hidden="true">
          <Stem /><HeadHollow />
        </svg>
      );
    case 'dotted-quarter':
      return (
        <svg viewBox="0 0 24 32" width={w} height={h} aria-hidden="true">
          <Stem /><HeadFilled /><Dot />
        </svg>
      );
    case 'quarter':
      return (
        <svg viewBox="0 0 24 32" width={w} height={h} aria-hidden="true">
          <Stem /><HeadFilled />
        </svg>
      );
    case 'dotted-eighth':
      return (
        <svg viewBox="0 0 24 32" width={w} height={h} aria-hidden="true">
          <Stem /><HeadFilled /><Flag1 /><Dot />
        </svg>
      );
    case 'eighth':
      return (
        <svg viewBox="0 0 24 32" width={w} height={h} aria-hidden="true">
          <Stem /><HeadFilled /><Flag1 />
        </svg>
      );
    case 'eighth-triplet':
      return (
        <svg viewBox="0 0 28 32" width={w * 1.15} height={h} aria-hidden="true">
          <Stem /><HeadFilled /><Flag1 />
          <text x="22" y="6" fontSize="8" fontFamily="JetBrains Mono, monospace" fontWeight="800" fill="currentColor">3</text>
        </svg>
      );
    case 'sixteenth':
      return (
        <svg viewBox="0 0 24 32" width={w} height={h} aria-hidden="true">
          <Stem /><HeadFilled /><Flag1 /><Flag2 />
        </svg>
      );
    default:
      return null;
  }
}

// ════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════
function BPMDelayCalculator() {
  const [tab, setTab] = useState('lesson');
  const [bpm, setBpm] = useState(120);
  const [noteId, setNoteId] = useState('quarter');
  const [loopOn, setLoopOn] = useState(false);
  const [beat, setBeat] = useState(-1);
  const [drawer, setDrawer] = useState(null);
  const [loopVol, setLoopVol] = useState(0.6);
  const [wetLevel, setWetLevel] = useState(0.7);

  const audioCtxRef = useRef(null);
  const loopGainRef = useRef(null);
  const wetGainRef = useRef(null);
  const loopTimerRef = useRef(null);
  const railRef = useRef(null);
  const recordHeadRef = useRef(null);
  const playbackHeadRef = useRef(null);
  const videoFlashRef = useRef(null);
  const copyTimers = useRef({});

  const note = NOTE_VALUES.find(n => n.id === noteId) || NOTE_VALUES[3];
  const ms = calcMs(bpm, note.multiplier);
  const playbackPct = playbackPctFor(ms);
  const labelsCrowded = (playbackPct - RECORD_LEFT_PCT) < 14;

  // Lazy-init audio
  const ensureAudio = useCallback(() => {
    if (!audioCtxRef.current && typeof window !== 'undefined') {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx && ctx.state === 'suspended') ctx.resume();
    if (ctx && !loopGainRef.current) {
      loopGainRef.current = ctx.createGain();
      loopGainRef.current.gain.value = loopVol;
      loopGainRef.current.connect(ctx.destination);
    }
    if (ctx && !wetGainRef.current) {
      wetGainRef.current = ctx.createGain();
      wetGainRef.current.gain.value = wetLevel;
      wetGainRef.current.connect(ctx.destination);
    }
    return ctx;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (loopGainRef.current && audioCtxRef.current) {
      loopGainRef.current.gain.setTargetAtTime(loopVol, audioCtxRef.current.currentTime, 0.01);
    }
  }, [loopVol]);

  useEffect(() => {
    if (wetGainRef.current && audioCtxRef.current) {
      wetGainRef.current.gain.setTargetAtTime(wetLevel, audioCtxRef.current.currentTime, 0.01);
    }
  }, [wetLevel]);

  // Inject fonts + CSS once
  useEffect(() => {
    const existing = document.getElementById('tape-lab-styles');
    if (existing) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet'; link.href = FONT_LINK_HREF; link.id = 'tape-lab-fonts';
    document.head.appendChild(link);
    const style = document.createElement('style');
    style.id = 'tape-lab-styles'; style.textContent = TAPE_LAB_CSS;
    document.head.appendChild(style);
    return () => {
      document.getElementById('tape-lab-fonts')?.remove();
      document.getElementById('tape-lab-styles')?.remove();
    };
  }, []);

  // Trigger source pad
  const trigger = useCallback((sourceId) => {
    const ctx = ensureAudio();
    if (!ctx) return;
    const now = ctx.currentTime;
    const cur = NOTE_VALUES.find(n => n.id === noteId) || NOTE_VALUES[3];
    const delayMs = calcMs(bpm, cur.multiplier);

    synths[sourceId](ctx, now, ctx.destination, 1);
    const wetDest = wetGainRef.current || ctx.destination;
    synths[sourceId](ctx, now + delayMs / 1000, wetDest, 1);

    if (recordHeadRef.current) {
      recordHeadRef.current.classList.add('flash');
      setTimeout(() => recordHeadRef.current?.classList.remove('flash'), 280);
    }
    if (videoFlashRef.current) {
      videoFlashRef.current.classList.add('on');
      setTimeout(() => videoFlashRef.current?.classList.remove('on'), 280);
    }

    if (railRef.current) {
      const pbPct = playbackPctFor(delayMs);
      const pulse = document.createElement('div');
      pulse.className = 'tl-pulse';
      const color = PULSE_COLOR[sourceId];
      pulse.style.background = color;
      pulse.style.boxShadow = `0 0 4px ${color}, 0 0 12px ${color}cc, 0 0 20px ${color}77`;
      pulse.style.left = RECORD_LEFT_PCT + '%';
      railRef.current.appendChild(pulse);

      const anim = pulse.animate(
        [{ left: RECORD_LEFT_PCT + '%' }, { left: pbPct + '%' }],
        { duration: delayMs, easing: 'linear', fill: 'forwards' }
      );
      anim.onfinish = () => {
        if (playbackHeadRef.current) {
          playbackHeadRef.current.classList.add('flash');
          setTimeout(() => playbackHeadRef.current?.classList.remove('flash'), 280);
        }
        const fade = pulse.animate(
          [{ opacity: 1, transform: 'translateX(-50%) scale(1)' },
           { opacity: 0, transform: 'translateX(-50%) scale(1.6)' }],
          { duration: 500, fill: 'forwards' }
        );
        fade.onfinish = () => pulse.remove();
      };
    }
  }, [bpm, noteId, ensureAudio]);

  // Drum loop scheduler
  useEffect(() => {
    if (!loopOn) {
      if (loopTimerRef.current) {
        clearInterval(loopTimerRef.current);
        loopTimerRef.current = null;
      }
      setBeat(-1);
      return;
    }
    const ctx = ensureAudio();
    if (!ctx) return;
    const beatSec = 60 / bpm;
    let nextTime = ctx.currentTime + 0.1;
    let b = 0;
    const lookahead = () => {
      const ahead = ctx.currentTime + 0.18;
      while (nextTime < ahead) {
        const which = b % 4;
        const drumDest = loopGainRef.current || ctx.destination;
        if (which === 0 || which === 2) synths.kick(ctx, nextTime, drumDest, 1);
        if (which === 1 || which === 3) synths.snare(ctx, nextTime, drumDest, 1);
        synths.rim(ctx, nextTime + beatSec / 2, drumDest, 0.6);
        const visualAt = (nextTime - ctx.currentTime) * 1000;
        const beatNow = b;
        setTimeout(() => setBeat(beatNow % 4), Math.max(0, visualAt));
        b++;
        nextTime += beatSec;
      }
    };
    lookahead();
    loopTimerRef.current = setInterval(lookahead, 25);
    return () => {
      if (loopTimerRef.current) {
        clearInterval(loopTimerRef.current);
        loopTimerRef.current = null;
      }
      setBeat(-1);
    };
  }, [loopOn, bpm, ensureAudio]);

  // Keyboard
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const map = { '1': 'kick', '2': 'snare', '3': 'clap', '4': 'rim', '5': 'vox', '6': 'pluck' };
      if (map[e.key]) trigger(map[e.key]);
      if (e.key === 'p' || e.key === 'P') setLoopOn(v => !v);
      if (e.key === 'Escape') setDrawer(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [trigger]);

  // Cleanup audio on unmount
  useEffect(() => () => {
    try { audioCtxRef.current?.close(); } catch (e) {}
  }, []);

  const handleCopy = async (key, btnEl) => {
    const fn = COPY_TEXTS[key];
    if (!fn) return;
    await copyToClipboard(fn());
    btnEl.classList.add('copied');
    const original = btnEl.textContent;
    btnEl.textContent = '✓ Copied';
    if (copyTimers.current[key]) clearTimeout(copyTimers.current[key]);
    copyTimers.current[key] = setTimeout(() => {
      btnEl.textContent = original;
      btnEl.classList.remove('copied');
    }, 1600);
  };

  // Tick marks 0..1100ms
  const ticks = [];
  for (let m = 0; m <= 1100; m += 50) {
    const pct = RECORD_LEFT_PCT + m / MS_PER_PCT;
    if (pct > 100) break;
    const isMajor = m % 250 === 0;
    ticks.push({ m, pct, isMajor });
  }

  return (
    <div className="tape-lab">
      <div className="tl-wrap">

        <header className="tl-header">
          <div className="tl-eyebrow">Topic 2.5 Numeracy · 1.12 Delay</div>
          <h1 className="tl-title">
            Tape <span className="tl-amp">&amp;</span> Heads
          </h1>
          <p className="tl-lede">
            In an Echoplex, the delay isn't a number — it's the gap between the record head and the playback head. The tape carries each hit from one to the other, and the distance is the delay time.
          </p>
        </header>

        <nav className="tl-tabs" aria-label="Lesson sections">
          {[
            { id: 'lesson',    label: 'Lesson',    n: '01' },
            { id: 'visualise', label: 'Visualise', n: '02' },
            { id: 'practice',  label: 'Practice',  n: '03' },
          ].map(t => (
            <button
              key={t.id}
              type="button"
              className={'tl-tab-btn' + (tab === t.id ? ' active' : '')}
              onClick={() => setTab(t.id)}
              aria-pressed={tab === t.id}
            >
              <span className="tl-tab-num">{t.n}</span>{t.label}
            </button>
          ))}
        </nav>

        {tab === 'lesson' && (
        <div className="tl-stage">
          <aside className="tl-stage-side">
            {/* VIDEO HERO */}
            <div className="tl-video-hero">
              <video aria-hidden="true" autoPlay loop muted playsInline preload="auto">
                <source src="/Reel-to-reel-video.mp4" type="video/mp4" />
              </video>
              <div className="tl-video-grain" />
              <div className="tl-video-flash" ref={videoFlashRef} />
              <div className="tl-video-stencil">● Live · TR-1600</div>
            </div>
            <div className="tl-video-caption">
              <span>Tape transport · AUDIOTECH TR-1600</span>
              <span><b>{bpm}</b>&nbsp;BPM · 7½&nbsp;ips</span>
            </div>

            <div className="tl-margin-glossary">
              <div className="tl-margin-note">
                <span className="tl-margin-term">Record head</span>
                The electromagnet that imprints the audio onto the tape as it passes.
              </div>
              <div className="tl-margin-note">
                <span className="tl-margin-term">Playback head</span>
                A second head, downstream, that reads the tape back. The gap between the two = the delay time.
              </div>
              <div className="tl-margin-note">
                <span className="tl-margin-term">IPS</span>
                Inches per second — how fast the tape moves. 7½ IPS is studio-standard.
              </div>
              <div className="tl-margin-note">
                <span className="tl-margin-term">Wow &amp; flutter</span>
                Pitch wobble caused by tiny speed variations of the tape — the &ldquo;warmth&rdquo; of analog delay.
              </div>
            </div>
          </aside>

          <div className="tl-stage-main">

        {/* HEAD METER */}
        <div className="tl-gap-meter-frame">
          <div className="tl-gap-meter-stencil">
            <span>Head distance — what the formula <em>looks like</em></span>
            <span className="live">{note.label.toUpperCase()} · {Math.round(ms)} MS</span>
          </div>
          <div className="tl-rail" ref={railRef}>
            <div className="tl-head" style={{ left: '12%' }}>
              <div className="tl-head-gap" /><div className="tl-head-glow" />
            </div>
            <div className="tl-head" style={{ left: RECORD_LEFT_PCT + '%' }} ref={recordHeadRef}>
              <div className="tl-head-gap" /><div className="tl-head-glow" />
            </div>
            <div className="tl-head" style={{ left: playbackPct + '%' }} ref={playbackHeadRef}>
              <div className="tl-head-gap" /><div className="tl-head-glow" />
            </div>
            <div
              className="tl-bracket"
              style={{ left: RECORD_LEFT_PCT + '%', width: (playbackPct - RECORD_LEFT_PCT) + '%' }}
            />
            <div
              className="tl-bracket-label"
              style={{ left: ((RECORD_LEFT_PCT + playbackPct) / 2) + '%' }}
            >
              {Math.round(ms)} ms
            </div>
          </div>
          <div style={{ position: 'relative', margin: '4px 12px 0', height: 16 }}>
            <div className="tl-head-label" style={{ left: '12%' }}>
              <span className="num">①</span>Erase
            </div>
            <div className="tl-head-label" style={{ left: RECORD_LEFT_PCT + '%' }}>
              <span className="num">②</span>Record
            </div>
            <div
              className="tl-head-label"
              style={{
                left: playbackPct + '%',
                transform: labelsCrowded
                  ? 'translateX(-50%) translateY(14px)'
                  : 'translateX(-50%)',
              }}
            >
              <span className="num">③</span>Playback
            </div>
          </div>
          <div className="tl-ticks">
            {ticks.map(t => (
              <div
                key={t.m}
                className={'tl-tick' + (t.isMajor ? ' major' : '')}
                style={{ left: t.pct + '%' }}
              />
            ))}
            {ticks.filter(t => t.isMajor).map(t => (
              <div key={'n' + t.m} className="tl-tick-num" style={{ left: t.pct + '%' }}>
                {t.m === 0 ? '0' : t.m + 'ms'}
              </div>
            ))}
          </div>
        </div>

        {/* FORMULA */}
        <div className="tl-formula">
          <div className="tl-formula-eq">
            60,000 ÷ <em>{bpm}</em> × <em>{note.multiplier === 1/3 ? '0.333…' : note.multiplier}</em> =
          </div>
          <div>
            <span className="tl-formula-result">{Math.round(ms)}</span>
            <span className="tl-formula-unit">MS</span>
          </div>
        </div>

        {/* LOOP */}
        <div className="tl-loop-row">
          <button type="button"
            className={'tl-loop-btn' + (loopOn ? ' on' : '')}
            onClick={() => setLoopOn(v => !v)}
          >
            {loopOn ? '■ Stop loop' : '▸ Drum loop'}
          </button>
          <span className="tl-loop-label">4-on-the-floor at {bpm}&nbsp;BPM</span>
          <div className="tl-beat-leds">
            {[0,1,2,3].map(i => (
              <div key={i} className={'tl-beat-led' + (beat === i ? ' on' : '')} />
            ))}
          </div>
        </div>

        {/* MIXER */}
        <div className="tl-mixer-row">
          <span className="tl-mixer-label">Drum loop</span>
          <input
            className="tl-mixer-slider" type="range" min="0" max="100"
            value={Math.round(loopVol * 100)}
            onChange={e => setLoopVol(parseInt(e.target.value, 10) / 100)}
            aria-label="Drum loop volume"
          />
          <span className="tl-mixer-value">{Math.round(loopVol * 100)}%</span>
        </div>
        <div className="tl-mixer-row">
          <span className="tl-mixer-label">Wet level</span>
          <input
            className="tl-mixer-slider" type="range" min="0" max="100"
            value={Math.round(wetLevel * 100)}
            onChange={e => setWetLevel(parseInt(e.target.value, 10) / 100)}
            aria-label="Delay wet level"
          />
          <span className="tl-mixer-value">{Math.round(wetLevel * 100)}%</span>
        </div>

        {/* PADS */}
        <div className="tl-pads">
          {SOURCES.map(s => (
            <div key={s.id} className="tl-pad" onClick={() => trigger(s.id)} role="button" tabIndex={0}>
              <span className="tl-pad-key">{s.key}</span>{s.label}
            </div>
          ))}
        </div>

        {/* CONTROLS */}
        <div className="tl-controls">
          <div>
            <div className="tl-ctrl-label">Tempo</div>
            <div className="tl-bpm-row">
              <div className="tl-bpm-display">
                {bpm}<span className="small">BPM</span>
              </div>
              <input aria-label="Slider"
                className="tl-bpm-slider" type="range" min="60" max="180"
                value={bpm}
                onChange={e => setBpm(parseInt(e.target.value, 10))}
              />
            </div>
            <div className="tl-bpm-presets">
              {BPM_PRESETS.map(p => (
                <button type="button"
                  key={p}
                  className={'tl-bpm-preset' + (bpm === p ? ' active' : '')}
                  onClick={() => setBpm(p)}
                >{p}</button>
              ))}
            </div>
          </div>
          <div>
            <div className="tl-ctrl-label">Note value</div>
            <div className="tl-notes">
              {NOTE_VALUES.map(n => (
                <div
                  key={n.id}
                  className={'tl-note-btn' + (n.id === noteId ? ' active' : '')}
                  onClick={() => setNoteId(n.id)}
                  role="button" tabIndex={0}
                >
                  <div className="tl-note-symbol"><NoteIcon id={n.id} size={22} /></div>
                  <div className="tl-note-label">{n.label}</div>
                  <div className="tl-note-ms">{Math.round(calcMs(bpm, n.multiplier))}ms</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="tl-aside">
          <span className="tl-tag">Try this</span>
          Hit the <em>snare</em> pad and watch a glowing flux mark fly across the rail from <em>record</em> to <em>playback</em>. Drag BPM down — playback slides right, the bracket widens, the wet hit arrives later. Pick an eighth — the head jumps left, the gap halves. The maths and the geometry are the same idea.
        </p>

          </div>
        </div>
        )}

        {tab === 'visualise' && (
          <VisualiseTab bpm={bpm} setBpm={setBpm} />
        )}

        {tab === 'practice' && (
          <PracticeTab />
        )}

        <div className="tl-spec-footer">
          <span>Eduqas A-Level Music Tech · <strong>Spec 1.12</strong> Delay</span>
          <span>Lesson 03 · <strong>2.5 Numeracy</strong></span>
        </div>

      </div>

      {/* DRAWER HANDLES */}
      <div className="tl-drawer-handle">
        <button type="button" onClick={() => setDrawer('theory')}>Theory</button>
        <button type="button" onClick={() => setDrawer('reference')}>Reference</button>
      </div>

      {/* DRAWER */}
      {drawer && (
        <>
          <div className="tl-drawer-overlay" onClick={() => setDrawer(null)} />
          <div className="tl-drawer">
            <button type="button" className="tl-drawer-close" onClick={() => setDrawer(null)}>×</button>
            {drawer === 'theory' && (
              <TheoryPanel onCopy={handleCopy} />
            )}
            {drawer === 'reference' && (
              <ReferencePanel
                onCopy={handleCopy}
                onPickBpm={(b) => { setBpm(b); setDrawer(null); }}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// THEORY PANEL
// ════════════════════════════════════════════════════════════════════
function TheoryPanel({ onCopy }) {
  return (
    <>
      <div className="tl-drawer-eyebrow">1.12 Delay · Theory</div>
      <div className="tl-copy-row">
        <button type="button" className="tl-copy-btn" onClick={(e) => onCopy('theory-text', e.currentTarget)}>
          Copy as text
        </button>
        <button type="button" className="tl-copy-btn" onClick={(e) => onCopy('theory-md', e.currentTarget)}>
          Copy as Markdown
        </button>
        <span className="tl-copy-hint">Text → notes · Markdown → AI assistants</span>
      </div>
      <h2>The maths</h2>
      <p>BPM is <em>beats per minute</em>. One minute is 60,000 milliseconds. Divide and you get the duration of one beat — one quarter note in 4/4 time.</p>
      <div className="tl-formula-block">DELAY (ms) = 60,000 ÷ BPM × NOTE</div>
      <p>Multiply by a note value to scale up or down. Quarter = 1, eighth = 0.5 (twice as fast), half = 2 (twice as slow). Dotted notes multiply by 1.5; triplets multiply by 2/3.</p>

      <h3>The tape connection</h3>
      <p>On a real Echoplex or Roland Space Echo, the formula isn't an abstraction — it's a piece of tape moving past two heads. The <em>physical gap</em> between the record head and the playback head, divided by the tape speed, IS the delay time. That's why the head distance meter slides as you change BPM. The maths and the geometry are one idea.</p>

      <h3>Worked example</h3>
      <p>120 BPM, dotted eighth.</p>
      <ol>
        <li><strong>Quarter:</strong> 60,000 ÷ 120 = <span style={{ fontFamily: 'var(--f-mono)' }}>500 ms</span></li>
        <li><strong>Eighth:</strong> 500 ÷ 2 = <span style={{ fontFamily: 'var(--f-mono)' }}>250 ms</span></li>
        <li><strong>Dotted eighth:</strong> 250 × 1.5 = <span style={{ fontFamily: 'var(--f-mono)' }}>375 ms</span></li>
      </ol>
      <p style={{ fontStyle: 'italic', color: 'var(--ink-faded)' }}>375 ms is the iconic U2/The Edge guitar delay. Each echo lands a sixteenth before the next eighth — weaving across the beat.</p>

      <h3>Watch out for</h3>
      <ul>
        <li>Forgetting milliseconds (writing 0.5 for a quarter at 120 BPM).</li>
        <li>Rounding too early — keep one decimal through the working, only round at the end.</li>
        <li>Triplet maths: an eighth triplet = quarter ÷ 3, not eighth ÷ 3. Three triplet eighths fit in <em>one</em> beat.</li>
        <li>BPM always refers to the quarter note in 4/4. Always derive the quarter first, then scale.</li>
      </ul>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
// REFERENCE PANEL
// ════════════════════════════════════════════════════════════════════
const REF_BPMS = [
  { bpm: 60,  genre: 'Slow / Reggae' },
  { bpm: 80,  genre: 'Hip-hop / R&B' },
  { bpm: 100, genre: 'Mid-tempo pop' },
  { bpm: 120, genre: 'Pop / dance pop' },
  { bpm: 140, genre: 'Drum & bass' },
];
const REF_MULTS = [
  { id: 'half',      m: 2    },
  { id: 'quarter',   m: 1    },
  { id: 'eighth',    m: 0.5  },
  { id: 'sixteenth', m: 0.25 },
];

function ReferencePanel({ onCopy, onPickBpm }) {
  return (
    <>
      <div className="tl-drawer-eyebrow">1.12 Delay · Reference</div>
      <div className="tl-copy-row">
        <button type="button" className="tl-copy-btn" onClick={(e) => onCopy('reference-text', e.currentTarget)}>
          Copy as text
        </button>
        <button type="button" className="tl-copy-btn" onClick={(e) => onCopy('reference-md', e.currentTarget)}>
          Copy as Markdown
        </button>
        <span className="tl-copy-hint">Text → notes · Markdown → AI assistants</span>
      </div>
      <h2>BPM × note value</h2>
      <p>All values rounded to whole milliseconds. Click any BPM to load it into the calculator.</p>
      <table className="tl-ref-table">
        <thead>
          <tr>
            <th>BPM</th>
            {REF_MULTS.map(rm => (
              <th key={rm.m} style={{ verticalAlign: 'middle' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', height: 18 }}>
                  <NoteIcon id={rm.id} size={16} />
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {REF_BPMS.map(p => (
            <tr key={p.bpm} className="clickable" onClick={() => onPickBpm(p.bpm)}>
              <td>
                <div className="tl-ref-bpm">{p.bpm}</div>
                <div className="tl-ref-genre">{p.genre}</div>
              </td>
              {REF_MULTS.map(rm => (
                <td key={rm.m}>{Math.round(calcMs(p.bpm, rm.m))}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <h3>Keyboard</h3>
      <ul style={{ fontFamily: 'var(--f-mono)', fontSize: 12, lineHeight: 1.9 }}>
        <li><strong>1–6</strong> · trigger source pad</li>
        <li><strong>P</strong> · play / stop drum loop</li>
        <li><strong>Esc</strong> · close drawer</li>
      </ul>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
// VISUALISE TAB — Tape Transport (B) + Beat Grid + Oscilloscope (C)
// ════════════════════════════════════════════════════════════════════
const RECORD_PCT_BX = 18;
const TAPE_RANGE_PCT = 70;
const TAPE_MAX_MS = 1500;
const msToPctBx = (ms) => RECORD_PCT_BX + (ms / TAPE_MAX_MS) * TAPE_RANGE_PCT;
const pctToMsBx = (pct) => Math.round(((pct - RECORD_PCT_BX) / TAPE_RANGE_PCT) * TAPE_MAX_MS);

const SUBDIVISIONS_BX = [
  { id: 'sixteenth', label: 'Sixteenth',  n: 0.25 },
  { id: 'trip-e',    label: 'Eighth Trip', n: 1/3 },
  { id: 'eighth',    label: 'Eighth',     n: 0.5  },
  { id: 'dot-e',     label: 'Dot · ⅛',    n: 0.75 },
  { id: 'quarter',   label: 'Quarter',    n: 1    },
  { id: 'dot-q',     label: 'Dot · ¼',    n: 1.5  },
];

const SUBDIVISIONS_BC = [
  { id: 'whole',     label: 'Whole',      n: 4,    color: '#7a1e22' },
  { id: 'half',      label: 'Half',       n: 2,    color: '#a3402a' },
  { id: 'dot-q',     label: 'Dot · ¼',    n: 1.5,  color: '#c46a2a' },
  { id: 'quarter',   label: 'Quarter',    n: 1,    color: '#e89e3c' },
  { id: 'dot-e',     label: 'Dot · ⅛',    n: 0.75, color: '#b89c4a' },
  { id: 'eighth',    label: 'Eighth',     n: 0.5,  color: '#7a8a3a' },
  { id: 'trip-e',    label: '⅛ Triplet',  n: 1/3,  color: '#3f7a4a' },
  { id: 'sixteenth', label: 'Sixteenth',  n: 0.25, color: '#2a6a7a' },
];

function ReelSpokes() {
  return (
    <>
      {[0, 60, 120, 180, 240, 300].map(deg => (
        <div
          key={deg}
          className="tl-bx-reel-spoke"
          style={{ transform: `rotate(${deg}deg)` }}
        />
      ))}
    </>
  );
}

function VisualiseTab({ bpm, setBpm }) {
  // ─── B: Tape transport ─────────────────────────────────────────────
  const [headMs, setHeadMs] = useState(500);
  const [running, setRunning] = useState(true);
  const [t, setT] = useState(0);
  const startRef = useRef(typeof performance !== 'undefined' ? performance.now() : 0);
  const laneRef = useRef(null);

  useEffect(() => {
    let raf;
    const tick = (now) => {
      if (running) setT((now - startRef.current) / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  const playbackPctB = msToPctBx(headMs);

  const beatMs = 60000 / bpm;
  const lifeMs = headMs + 200;
  const nowMs = t * 1000;
  const earliest = nowMs - lifeMs;
  const first = Math.ceil(earliest / beatMs);
  const last = Math.floor(nowMs / beatMs);
  const hits = [];
  if (running) {
    for (let i = first; i <= last; i++) {
      const age = nowMs - i * beatMs;
      const pct = RECORD_PCT_BX + (age / TAPE_MAX_MS) * TAPE_RANGE_PCT;
      if (pct >= RECORD_PCT_BX && pct <= 100) {
        hits.push({ id: i, pct });
      }
    }
  }
  const hitOnPlayback = hits.some(h => Math.abs(h.pct - playbackPctB) < 0.6);

  const onDrag = useCallback((clientX) => {
    if (!laneRef.current) return;
    const rect = laneRef.current.getBoundingClientRect();
    const pctRaw = ((clientX - rect.left) / rect.width) * 100;
    const pctClamped = Math.max(RECORD_PCT_BX + 2, Math.min(95, pctRaw));
    const ms = Math.max(60, Math.min(TAPE_MAX_MS, Math.round(pctToMsBx(pctClamped) / 5) * 5));
    setHeadMs(ms);
  }, []);

  const beginDrag = useCallback((e) => {
    e.preventDefault();
    const move = (ev) => {
      const x = ev.touches ? ev.touches[0].clientX : ev.clientX;
      onDrag(x);
    };
    const end = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', end);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', end);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', end);
  }, [onDrag]);

  const closestNote =
    Math.abs(headMs - 60000 / bpm) < 8 ? 'Quarter' :
    Math.abs(headMs - 30000 / bpm) < 6 ? 'Eighth' :
    Math.abs(headMs - 90000 / bpm) < 8 ? 'Dotted ⅛' :
    Math.abs(headMs - 15000 / bpm) < 6 ? 'Sixteenth' :
    Math.abs(headMs - 20000 / bpm) < 6 ? 'Eighth Triplet' :
    Math.abs(headMs - 90000 / bpm * 1) < 10 ? 'Dotted ¼' :
    '—';

  // ─── C: Beat grid ──────────────────────────────────────────────────
  const [hovered, setHovered] = useState('quarter');
  const activeC = SUBDIVISIONS_BC.find(s => s.id === hovered) || SUBDIVISIONS_BC[3];
  const barMs = beatMs * 4;
  const activeMsC = Math.round(beatMs * activeC.n);

  return (
    <>
      {/* ─── B: Tape transport ──────────────────────────────────── */}
      <div className="tl-bx">
        <div className="tl-bx-head">
          <div>
            <div className="tl-bx-eyebrow">● Live · TR-1600 · 7½ IPS</div>
            <h2 className="tl-bx-title">The travelling hit</h2>
            <p className="tl-bx-deck">
              Each tap is recorded by the red head. The tape carries it past the playback head — that gap, in time, <em>is</em> the delay.
            </p>
          </div>
          <div className="tl-bx-controls">
            <button
              type="button"
              className="tl-bx-btn"
              onClick={() => setRunning(r => !r)}
            >
              <span className="tl-bx-tri" />
              {running ? 'Pause tape' : 'Run tape'}
            </button>
            <span className="tl-bx-chip">
              <span className="tl-bx-chip-k">BPM</span>
              <span className="tl-bx-chip-v">{bpm}</span>
            </span>
            <span className="tl-bx-chip">
              <span className="tl-bx-chip-k">Δt</span>
              <span className="tl-bx-chip-v">{headMs} ms</span>
            </span>
          </div>
        </div>

        {/* BPM slider so you can change it inside Visualise too */}
        <div className="tl-mixer-row" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.12)' }}>
          <span className="tl-mixer-label" style={{ color: '#c8b89a' }}>Tempo</span>
          <input
            className="tl-mixer-slider"
            type="range" min="60" max="180"
            value={bpm}
            onChange={e => setBpm(parseInt(e.target.value, 10))}
            aria-label="Tempo BPM"
          />
          <span className="tl-mixer-value" style={{ color: 'var(--amber-glow)' }}>{bpm}</span>
        </div>

        {/* Reels + readout */}
        <div className="tl-bx-reels">
          <div className="tl-bx-reel-pair">
            <div className={'tl-bx-reel' + (running ? ' spinning' : '')}><ReelSpokes/></div>
            <div className={'tl-bx-reel' + (running ? ' spinning' : '')}><ReelSpokes/></div>
          </div>
          <div className="tl-bx-readout">
            <span style={{ opacity: 0.7 }}>HEAD GAP =</span>{' '}
            <span className="tl-bx-readout-big">{headMs}<span style={{ fontSize: 12, opacity: 0.7 }}>ms</span></span>{' '}
            <span style={{ opacity: 0.6 }}>≈ {closestNote}</span>
          </div>
          <div className="tl-bx-reel-pair">
            <div className={'tl-bx-reel' + (running ? ' spinning' : '')}><ReelSpokes/></div>
            <div className={'tl-bx-reel' + (running ? ' spinning' : '')}><ReelSpokes/></div>
          </div>
        </div>

        {/* Tape lane */}
        <div className="tl-bx-tape-lane" ref={laneRef}>
          <div className={'tl-bx-tape' + (running ? ' running' : '')} />

          {/* Erase head */}
          <div className="tl-bx-big-head erase" style={{ left: '6%' }}>
            <div className="tl-bx-bh-body" />
            <div className="tl-bx-bh-gap" />
            <div className="tl-bx-bh-label">Erase</div>
          </div>

          {/* Record head */}
          <div className="tl-bx-big-head record glow" style={{ left: RECORD_PCT_BX + '%' }}>
            <div className="tl-bx-bh-body" />
            <div className="tl-bx-bh-gap" />
            <div className="tl-bx-bh-label">Record</div>
          </div>

          {/* Playback head (draggable) */}
          <div
            className="tl-bx-big-head playback glow draggable"
            style={{ left: playbackPctB + '%' }}
            onMouseDown={beginDrag}
            onTouchStart={beginDrag}
            role="slider"
            aria-label="Playback head distance"
            aria-valuemin={60}
            aria-valuemax={TAPE_MAX_MS}
            aria-valuenow={headMs}
            tabIndex={0}
          >
            <div className="tl-bx-bh-arrow">↔</div>
            <div className="tl-bx-bh-body" />
            <div className="tl-bx-bh-gap" />
            <div className="tl-bx-bh-label">Playback</div>
          </div>

          {/* Bracket between record and playback */}
          <div
            className="tl-bx-bracket"
            style={{ left: RECORD_PCT_BX + '%', width: (playbackPctB - RECORD_PCT_BX) + '%' }}
          >
            <div className="tl-bx-bracket-label">{headMs} ms</div>
          </div>

          {/* Travelling hits */}
          {hits.map(h => (
            <div key={h.id} className="tl-bx-hit" style={{ left: h.pct + '%' }} />
          ))}

          {/* Playback trace flash */}
          <div
            className="tl-bx-trace"
            style={{ left: playbackPctB + '%', opacity: hitOnPlayback ? 1 : 0.15 }}
          />

          {/* Ruler labels */}
          <div className="tl-bx-ruler">
            <span>0ms</span><span>250</span><span>500</span><span>750</span><span>1000</span>
          </div>
        </div>

        {/* Subdivision snap buttons */}
        <div className="tl-bx-snaps">
          {SUBDIVISIONS_BX.map(s => {
            const v = Math.round(60000 / bpm * s.n);
            const active = Math.abs(v - headMs) < 4;
            return (
              <button
                key={s.id}
                type="button"
                className={'tl-bx-snap' + (active ? ' active' : '')}
                onClick={() => setHeadMs(v)}
              >
                <span>{s.label}</span>
                <span className="tl-bx-snap-ms">{v}ms</span>
              </button>
            );
          })}
        </div>

        <div className="tl-bx-foot">
          <span>Drag the playback head ▸ snap to a subdivision ▸ watch the hit travel</span>
          <span>Spec 1.12 · Tape Delay</span>
        </div>
      </div>

      {/* ─── C: Beat grid + oscilloscope ─────────────────────────── */}
      <div className="tl-bc">
        <div className="tl-bc-head">
          <div>
            <div className="tl-bc-eyebrow">Visualisation 02 · Beat Grid</div>
            <h2 className="tl-bc-title">
              One bar, every <em>subdivision</em>.
            </h2>
            <p className="tl-bc-deck">
              Hover a note value. Watch where its hits land in the bar — and the same delay drawn onto the oscilloscope.
            </p>
          </div>
          <div className="tl-bc-readout">
            <div className="tl-bc-readout-eyebrow">{activeC.label.toUpperCase()} @ {bpm} BPM</div>
            <div className="tl-bc-readout-big">
              {activeMsC}<span className="tl-bc-readout-unit">ms</span>
            </div>
          </div>
        </div>

        <hr className="tl-bc-rule" />

        {/* Picker chips */}
        <div className="tl-bc-picker">
          {SUBDIVISIONS_BC.map(s => {
            const ms2 = Math.round(beatMs * s.n);
            const isActive = s.id === hovered;
            return (
              <button
                key={s.id}
                type="button"
                className={'tl-bc-pick' + (isActive ? ' active' : '')}
                onMouseEnter={() => setHovered(s.id)}
                onClick={() => setHovered(s.id)}
                style={isActive ? { background: s.color, borderColor: s.color } : undefined}
              >
                <div className="tl-bc-pick-label">{s.label}</div>
                <div className="tl-bc-pick-ms">{ms2}ms</div>
              </button>
            );
          })}
        </div>

        {/* Beat grid */}
        <div className="tl-bc-grid-frame">
          <div className="tl-bc-grid-head">
            <span className="tl-bc-grid-cap">One bar — 4 beats — {Math.round(barMs)} ms total</span>
            <span className="tl-bc-grid-cap-r">Hits land where the colour falls</span>
          </div>

          {SUBDIVISIONS_BC.map(s => {
            const count = Math.round(4 / s.n);
            const isActive = s.id === hovered;
            const markers = [];
            for (let i = 0; i <= count; i++) {
              markers.push((i / count) * 100);
            }
            return (
              <div
                key={s.id}
                className={'tl-bc-row' + (isActive ? ' active' : '')}
                onMouseEnter={() => setHovered(s.id)}
                onClick={() => setHovered(s.id)}
              >
                <div
                  className="tl-bc-row-label"
                  style={isActive ? { color: s.color, fontWeight: 700 } : undefined}
                >{s.label}</div>
                <div className="tl-bc-row-line" />
                {markers.map((pct, i) => (
                  <div
                    key={i}
                    className="tl-bc-marker"
                    style={{
                      left: `calc(86px + ${pct}% * (100% - 94px) / 100%)`,
                      background: isActive ? s.color : undefined,
                      boxShadow: isActive ? `0 0 8px ${s.color}80` : 'none',
                    }}
                  />
                ))}
              </div>
            );
          })}

          <div className="tl-bc-beats">
            {[1, 2, 3, 4, 5].map(i => (
              <div
                key={i}
                className="tl-bc-beat"
                style={{ left: `calc(86px + ${((i - 1) / 4) * 100}% * (100% - 94px) / 100%)` }}
              >
                {i === 5 ? '|' : i}
              </div>
            ))}
          </div>
        </div>

        {/* Oscilloscope */}
        <div className="tl-bc-osc-frame">
          <div className="tl-bc-osc-head">
            <span>OSCILLOSCOPE — DRY ▸ WET</span>
            <span>1 BAR · {Math.round(barMs)} MS</span>
          </div>
          <Oscilloscope barMs={barMs} delayMs={activeMsC} color={activeC.color} />
        </div>
      </div>
    </>
  );
}

function Oscilloscope({ barMs, delayMs, color }) {
  const W = 1180, H = 120;
  const beatMsLocal = barMs / 4;
  const dryHits = [0, 1, 2, 3].map(i => i * beatMsLocal);
  const wetHits = dryHits.map(time => time + delayMs);

  const buildPolyline = (hits) => {
    const arr = [];
    for (let x = 0; x <= W; x += 2) {
      const time = (x / W) * barMs;
      let y = 0;
      for (const h of hits) {
        const dt = time - h;
        if (dt >= 0 && dt < 400) {
          y += Math.sin(dt * 0.06) * 32 * Math.exp(-dt / 70);
        }
      }
      arr.push(`${x},${(H / 2 - y).toFixed(2)}`);
    }
    return arr.join(' ');
  };

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', height: H, display: 'block' }}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {[0, 1, 2, 3, 4].map(i => (
        <line
          key={'g' + i}
          x1={(i / 4) * W} x2={(i / 4) * W} y1={0} y2={H}
          stroke="rgba(232,158,60,0.12)"
        />
      ))}
      <line x1={0} x2={W} y1={H/2} y2={H/2} stroke="rgba(232,158,60,0.12)" />

      <polyline fill="none" stroke="#c8b89a" strokeWidth="1.2" opacity="0.7"
        points={buildPolyline(dryHits)} />
      <polyline fill="none" stroke={color} strokeWidth="1.6" opacity="0.95"
        points={buildPolyline(wetHits)}
        style={{ filter: `drop-shadow(0 0 4px ${color})` }} />

      {dryHits.map((h, i) => (
        <line key={'d' + i}
          x1={(h / barMs) * W} x2={(h / barMs) * W}
          y1={H/2 - 36} y2={H/2 + 36}
          stroke="#c8b89a" strokeWidth="1" opacity="0.4" />
      ))}
      {wetHits.map((h, i) => {
        const x = (h / barMs) * W;
        if (x > W) return null;
        return (
          <line key={'w' + i} x1={x} x2={x}
            y1={H/2 - 36} y2={H/2 + 36}
            stroke={color} strokeWidth="1" opacity="0.9" />
        );
      })}
    </svg>
  );
}

// ════════════════════════════════════════════════════════════════════
// PRACTICE TAB — Worked example, Solve-for-X, Genre presets (D)
// ════════════════════════════════════════════════════════════════════
const GENRE_PRESETS = [
  { id: 'dub',   title: 'Dub',                bpm: 80,  note: 'Dot · ⅛',   n: 0.75,  blurb: 'King Tubby chains a dotted-eighth feedback delay against a slow groove — that off-beat shuffle is the genre.' },
  { id: 'rocka', title: 'Rockabilly slap',    bpm: 168, note: 'Eighth',    n: 0.5,   blurb: 'Sun Studios slapback: a single short echo, just an eighth behind. Sounds like the room is twice as alive.' },
  { id: 'edge',  title: 'Dotted-⅛ guitar',    bpm: 110, note: 'Dot · ⅛',   n: 0.75,  blurb: 'The Edge / U2: a clean guitar arpeggio with a dotted-eighth delay creates a counter-melody from one part.' },
  { id: 'gilm',  title: 'Half-time lead',     bpm: 120, note: 'Half',      n: 2,     blurb: 'Long, lyrical solos sit beautifully against a half-note repeat — Gilmour territory.' },
  { id: 'trip',  title: 'Triplet shuffle',    bpm: 140, note: '⅛ Triplet', n: 1/3,   blurb: 'Triplet eighths against a straight groove pull the rhythm sideways — common in shuffle blues and trap hi-hats.' },
  { id: 'shoe',  title: 'Shoegaze wash',      bpm: 96,  note: 'Quarter',   n: 1,     blurb: 'A quarter-note delay with high feedback smears notes into a chord — the wall.' },
];

function PracticeTab() {
  const [mode, setMode] = useState('student');
  const [preset, setPreset] = useState(null);

  return (
    <div>
      <div className="tl-bd-head">
        <div>
          <div className="tl-bc-eyebrow">Lesson 03 · Check Understanding</div>
          <h2 className="tl-bc-title">
            Solve for <em>X</em>, then listen for it.
          </h2>
        </div>
        <div className="tl-bd-mode" role="tablist" aria-label="Mode">
          {['student', 'teacher'].map(m => (
            <button
              key={m}
              type="button"
              className={'tl-bd-mode-btn' + (mode === m ? ' active' : '')}
              onClick={() => setMode(m)}
              aria-pressed={mode === m}
            >{m} mode</button>
          ))}
        </div>
      </div>

      <hr className="tl-bc-rule" />

      <div className="tl-bd-grid">
        {/* Worked example */}
        <div className="tl-bd-card">
          <div className="tl-bd-cap">Worked example</div>
          <div className="tl-bd-q">
            A track at <strong>96 BPM</strong> needs a <em>dotted-eighth</em> delay. What time, in milliseconds, do you set?
          </div>
          <div className="tl-bd-working">
            <div className="tl-bd-working-cap">Working</div>
            <div className="tl-bd-working-line">
              quarter @ 96 BPM = 60,000 ÷ 96 = <span style={{ color: 'var(--oxblood)' }}>625 ms</span><br/>
              dotted-eighth = quarter × 0.75 = 625 × 0.75<br/>
              =&nbsp;<span className="tl-bd-working-result">468.75 ms</span>
            </div>
          </div>
          {mode === 'teacher' && (
            <div className="tl-bd-teach">
              <strong>Teacher note —</strong> common error: students multiply by 1.5 (the dot adds half), forgetting they started from an <em>eighth</em> (312.5 ms). Both routes give the same answer; check working.
            </div>
          )}
        </div>

        <SolveForX />
      </div>

      {/* Genre presets */}
      <div className="tl-bd-presets-head">
        <div className="tl-bd-cap" style={{ marginBottom: 0 }}>Where the numbers come from — genre presets</div>
        <span style={{
          fontFamily: 'var(--f-mono)', fontSize: 10, color: 'var(--ink-faded)',
          letterSpacing: '0.14em', textTransform: 'uppercase',
        }}>Click a card to highlight</span>
      </div>
      <div className="tl-bd-presets">
        {GENRE_PRESETS.map(p => {
          const ms = Math.round(60000 / p.bpm * p.n);
          const isActive = preset === p.id;
          return (
            <button
              key={p.id}
              type="button"
              className={'tl-bd-preset' + (isActive ? ' active' : '')}
              onClick={() => setPreset(p.id)}
              aria-pressed={isActive}
            >
              <div className="tl-bd-preset-row">
                <div className="tl-bd-preset-name">{p.title}</div>
                <div className="tl-bd-preset-ms">{ms} ms</div>
              </div>
              <div className="tl-bd-preset-meta">{p.bpm} BPM · {p.note}</div>
              <div className="tl-bd-preset-blurb">{p.blurb}</div>
            </button>
          );
        })}
      </div>

      {mode === 'teacher' && (
        <div className="tl-bd-walk">
          <span className="tl-bd-walk-cap">Walkthrough</span>
          <div className="tl-bd-walk-steps">
            {['Define heads', 'Run the formula', 'Hear quarter', 'Hear dotted-⅛', 'Genre listening', 'Mini-quiz'].map((step, i) => (
              <div key={i} className="tl-bd-walk-step">
                <span className="k">Step {i + 1}</span><span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SolveForX() {
  const [answer, setAnswer] = useState('');
  const [reveal, setReveal] = useState(false);
  const correct = 120; // 60000 / BPM × 0.75 = 375 → BPM = 120
  const ok = parseInt(answer, 10) === correct;

  return (
    <div className="tl-bd-card">
      <div className="tl-bd-cap">Solve for X</div>
      <div className="tl-bd-q">
        A delay reads <strong>375 ms</strong> on a <em>dotted-eighth</em> setting. What is the tempo?
      </div>
      <div className="tl-bd-solve-row">
        <span className="tl-bd-solve-label">BPM =</span>
        <input
          className="tl-bd-solve-input"
          inputMode="numeric"
          value={answer}
          placeholder="?"
          onChange={(e) => {
            setAnswer(e.target.value.replace(/[^0-9]/g, ''));
            setReveal(false);
          }}
          onKeyDown={(e) => { if (e.key === 'Enter') setReveal(true); }}
          aria-label="Tempo answer in BPM"
        />
        <button
          type="button"
          className="tl-bd-solve-btn"
          onClick={() => setReveal(true)}
        >Check</button>
      </div>
      {reveal && (
        <div className={'tl-bd-feedback ' + (ok ? 'ok' : 'no')}>
          {ok
            ? <>Correct — at <strong>120 BPM</strong>, a dotted-eighth is exactly 375 ms.</>
            : <>Not quite. <span className="hint">Hint: rearrange 60,000 ÷ BPM × 0.75 = 375.</span></>
          }
        </div>
      )}
      <div className="tl-bd-try">
        <div className="tl-bd-try-tag">Try this</div>
        <p>Now solve in reverse: the song is at <strong>92 BPM</strong>. What&rsquo;s the quarter-note delay? (Within ±5 ms is fine.)</p>
      </div>
    </div>
  );
}

export default BPMDelayCalculator;
