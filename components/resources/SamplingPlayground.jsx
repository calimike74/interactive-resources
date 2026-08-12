'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

// ============================================
// Sampling Playground
// A-Level Music Technology — Topic 2.4
// Revelation Design System (Canvas Mode)
// Dials: CANVAS_INTENSITY 7 / MOTION_INTENSITY 6 / CONTENT_DENSITY 3
// ============================================

const FONT_HEADING = "var(--font-fraunces), Georgia, serif";
const FONT_BODY = "'Inter', system-ui, sans-serif";

// Design tokens
const T = {
  bg: '#060A14',
  surface: 'rgba(12, 18, 35, 0.6)',
  surfaceHover: 'rgba(12, 18, 35, 0.85)',
  border: 'rgba(74, 127, 212, 0.04)',
  borderHover: 'rgba(74, 127, 212, 0.15)',
  text: '#F0EDE8',
  textSecondary: 'rgba(232, 228, 223, 0.8)',
  textTertiary: 'rgba(232, 228, 223, 0.5)',
  gold: '#C9B87A',
  accent: '#FF6B35',
  accentHover: '#E85D26',
  accentSoft: 'rgba(255, 107, 53, 0.15)',
  info: '#4A7FD4',
  physics: '#10B981',
  error: '#EF4444',
  success: '#059669',
  glowBlue: '0 0 40px rgba(74,127,212,0.4), 0 0 80px rgba(74,127,212,0.2)',
};

// ============================================
// SECTION NAV
// ============================================
const sections = [
  { id: 'sampling', label: 'Sampling' },
  { id: 'bitdepth', label: 'Bit Depth' },
  { id: 'filesize', label: 'File Size' },
  { id: 'evaluate', label: 'Your Turn' },
];

function SectionNav({ active, onNavigate }) {
  function handleKeyDown(e) {
    const ids = sections.map(s => s.id);
    const currentIdx = ids.indexOf(active);
    let nextIdx = currentIdx;
    if (e.key === 'ArrowRight') {
      nextIdx = (currentIdx + 1) % ids.length;
    } else if (e.key === 'ArrowLeft') {
      nextIdx = (currentIdx - 1 + ids.length) % ids.length;
    } else if (e.key === 'Home') {
      nextIdx = 0;
    } else if (e.key === 'End') {
      nextIdx = ids.length - 1;
    } else {
      return;
    }
    e.preventDefault();
    onNavigate(ids[nextIdx]);
    // Move DOM focus to the newly selected tab
    const tablist = e.currentTarget;
    const tabs = tablist.querySelectorAll('[role="tab"]');
    if (tabs[nextIdx]) tabs[nextIdx].focus();
  }

  return (
    <div
      role="tablist"
      aria-label="Section navigation"
      onKeyDown={handleKeyDown}
      style={{
        display: 'flex',
        gap: '4px',
        background: T.surface,
        borderRadius: '12px',
        padding: '4px',
        marginBottom: '32px',
        position: 'sticky',
        top: '12px',
        zIndex: 10,
        backdropFilter: 'blur(12px)',
        border: `1px solid ${T.border}`,
      }}>
      {sections.map(s => (
        <button type="button"
          key={s.id}
          role="tab"
          aria-selected={active === s.id}
          tabIndex={active === s.id ? 0 : -1}
          onClick={() => onNavigate(s.id)}
          style={{
            flex: 1,
            padding: '10px 8px',
            fontSize: '11px',
            fontWeight: 600,
            fontFamily: FONT_BODY,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: active === s.id ? T.accent : T.textSecondary,
            background: active === s.id ? T.accentSoft : 'transparent',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            transition: 'transform, opacity, background-color, color, border-color, box-shadow 0.2s ease',
          }}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}

// ============================================
// SECTION 1: SAMPLING EXPLORER
// ============================================
const WAVE_CYCLES = 4;

function SamplingExplorer() {
  const canvasRef = useRef(null);
  const [sampleCount, setSampleCount] = useState(24);
  const [waveFrequency, setWaveFrequency] = useState(2);
  const [showReconstructed, setShowReconstructed] = useState(true);

  const NYQUIST_THRESHOLD = waveFrequency * 2 * WAVE_CYCLES;
  const isAliasing = sampleCount < NYQUIST_THRESHOLD;
  const samplesPerCycle = Math.round(sampleCount / WAVE_CYCLES);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    const W = rect.width;
    const H = rect.height;
    const midY = H / 2;
    const amp = H * 0.38;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = T.bg;
    ctx.fillRect(0, 0, W, H);

    if (isAliasing) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.10)';
      ctx.fillRect(0, 0, W, H);
    }

    // Grid
    ctx.strokeStyle = 'rgba(74, 127, 212, 0.06)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 8; i++) {
      ctx.beginPath(); ctx.moveTo(0, (H / 8) * i); ctx.lineTo(W, (H / 8) * i); ctx.stroke();
    }
    for (let i = 1; i < WAVE_CYCLES * 4; i++) {
      ctx.beginPath(); ctx.moveTo((W / (WAVE_CYCLES * 4)) * i, 0); ctx.lineTo((W / (WAVE_CYCLES * 4)) * i, H); ctx.stroke();
    }

    // Centre line
    ctx.strokeStyle = 'rgba(74, 127, 212, 0.15)';
    ctx.beginPath(); ctx.moveTo(0, midY); ctx.lineTo(W, midY); ctx.stroke();

    // Nyquist line
    const nyquistX = (NYQUIST_THRESHOLD / sampleCount) * W;
    if (nyquistX <= W) {
      ctx.strokeStyle = isAliasing ? 'rgba(239, 68, 68, 0.6)' : 'rgba(16, 185, 129, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(nyquistX, 0); ctx.lineTo(nyquistX, H); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = isAliasing ? 'rgba(239, 68, 68, 0.8)' : 'rgba(16, 185, 129, 0.8)';
      ctx.font = '500 10px Inter, system-ui, sans-serif';
      ctx.fillText('Nyquist', nyquistX + 4, 14);
    }

    // Analogue wave
    ctx.beginPath();
    ctx.strokeStyle = T.info;
    ctx.lineWidth = 2.5;
    ctx.shadowBlur = 12;
    ctx.shadowColor = 'rgba(74, 127, 212, 0.5)';
    for (let px = 0; px <= W; px++) {
      const t = px / W;
      const y = midY - amp * Math.sin(2 * Math.PI * waveFrequency * WAVE_CYCLES * t);
      if (px === 0) ctx.moveTo(px, y); else ctx.lineTo(px, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Sample positions
    const sampleXs = [], sampleYs = [];
    for (let i = 0; i <= sampleCount; i++) {
      const t = i / sampleCount;
      sampleXs.push(t * W);
      sampleYs.push(midY - amp * Math.sin(2 * Math.PI * waveFrequency * WAVE_CYCLES * t));
    }

    // Reconstructed signal
    if (showReconstructed) {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 107, 53, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 3]);
      sampleXs.forEach((x, i) => { if (i === 0) ctx.moveTo(x, sampleYs[i]); else ctx.lineTo(x, sampleYs[i]); });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Vertical sample lines
    ctx.strokeStyle = 'rgba(255, 107, 53, 0.35)';
    ctx.lineWidth = 1;
    sampleXs.forEach((x, i) => { ctx.beginPath(); ctx.moveTo(x, midY); ctx.lineTo(x, sampleYs[i]); ctx.stroke(); });

    // Sample dots
    sampleXs.forEach((x, i) => {
      ctx.beginPath();
      ctx.arc(x, sampleYs[i], 4, 0, Math.PI * 2);
      ctx.fillStyle = T.accent;
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'rgba(255, 107, 53, 0.7)';
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  }, [sampleCount, waveFrequency, isAliasing, showReconstructed]);

  useEffect(() => {
    draw();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => draw());
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [draw]);

  const sliderTrack = (value, min, max, accent) => {
    const pct = ((value - min) / (max - min)) * 100;
    return {
      width: '100%', appearance: 'none', WebkitAppearance: 'none', height: '4px', borderRadius: '2px',
      background: `linear-gradient(to right, ${accent} 0%, ${accent} ${pct}%, rgba(74,127,212,0.2) ${pct}%)`,
      outline: 'none', cursor: 'pointer',
    };
  };

  return (
    <div>
      <SectionHeader label="Sample Rate Explorer" title="How Sampling Captures Sound"
        description="Drop the sample rate below the Nyquist threshold to hear aliasing occur." />

      <div style={{
        borderRadius: '12px', overflow: 'hidden', marginBottom: '24px',
        border: `1px solid ${isAliasing ? 'rgba(239,68,68,0.25)' : 'rgba(74, 127, 212, 0.1)'}`,
        boxShadow: isAliasing ? '0 0 30px rgba(239,68,68,0.12)' : '0 0 40px rgba(74,127,212,0.12)',
        transition: 'border-color 0.3s, box-shadow 0.3s',
      }}>
        <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '220px' }}
          role="img"
          aria-label={`Waveform showing ${sampleCount} samples at frequency ${waveFrequency}×; status: ${isAliasing ? 'aliasing' : 'good capture'}`} />
      </div>

      {/* Status pills */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {[
          { label: 'Samples per cycle', value: samplesPerCycle, colour: T.accent },
          { label: 'Nyquist minimum', value: `${waveFrequency * 2} per cycle`, colour: T.physics },
          { label: 'Status', value: isAliasing ? 'Aliasing risk' : 'Good capture', colour: isAliasing ? T.error : T.physics },
        ].map(({ label, value, colour }) => (
          <div key={label} style={{
            flex: '1 1 140px', background: T.surface, border: `1px solid rgba(74, 127, 212, 0.08)`,
            borderRadius: '10px', padding: '12px 14px',
          }}>
            <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.textTertiary, marginBottom: '4px' }}>{label}</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: colour }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <SliderControl label="Sample Rate" value={sampleCount} min={4} max={64} accent={T.accent}
          displayValue={`${sampleCount} samples`} onChange={setSampleCount}
          minLabel="4" maxLabel="64" />
        <SliderControl label="Wave Frequency" value={waveFrequency} min={1} max={6} accent={T.info}
          displayValue={`${waveFrequency}× base`} onChange={setWaveFrequency}
          minLabel="Low" maxLabel="High" />

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button type="button" onClick={() => setShowReconstructed(v => !v)} aria-label="Toggle reconstructed signal" style={{
            width: '40px', height: '22px', borderRadius: '11px', border: 'none', cursor: 'pointer',
            background: showReconstructed ? T.accent : 'rgba(74, 127, 212, 0.2)', position: 'relative', transition: 'background 0.2s', flexShrink: 0,
          }}>
            <span style={{
              position: 'absolute', top: '3px', left: showReconstructed ? '21px' : '3px',
              width: '16px', height: '16px', borderRadius: '50%', background: T.text, transition: 'left 0.2s', display: 'block',
            }} />
          </button>
          <span style={{ fontSize: '12px', color: 'rgba(232, 228, 223, 0.6)' }}>Show reconstructed signal <span style={{ color: T.textTertiary, fontSize: '11px' }}>(linear interpolation — real reconstruction is smoother)</span></span>
        </div>
      </div>

      {isAliasing && (
        <div style={{
          marginTop: '20px', padding: '12px 16px', background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '10px',
          fontSize: '13px', color: T.textSecondary, lineHeight: 1.55,
        }}>
          <span style={{ color: T.error, fontWeight: 700 }}>Aliasing territory. </span>
          Only {samplesPerCycle} sample{samplesPerCycle !== 1 ? 's' : ''} per cycle — below the Nyquist minimum of {waveFrequency * 2} per cycle.
          The reconstructed signal no longer matches the original.
        </div>
      )}

      <Legend items={[
        { colour: T.info, label: 'Analogue signal' },
        { colour: T.accent, label: 'Sample points' },
        { colour: 'rgba(255,107,53,0.5)', label: 'Reconstructed digital', dashed: true },
        { colour: isAliasing ? T.error : T.physics, label: 'Nyquist threshold' },
      ]} />
    </div>
  );
}

// ============================================
// SECTION 2: BIT DEPTH EXPLORER
// ============================================
function BitDepthExplorer() {
  const canvasRef = useRef(null);
  const [bitDepth, setBitDepth] = useState(4);

  const getVisualLevels = (bits) => bits <= 4 ? Math.pow(2, bits) : Math.min(Math.pow(2, bits), 64);

  const drawWave = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    const W = rect.width;
    const H = rect.height;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = T.bg;
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = 'rgba(74, 127, 212, 0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 8; i++) { ctx.beginPath(); ctx.moveTo((W / 8) * i, 0); ctx.lineTo((W / 8) * i, H); ctx.stroke(); }
    for (let i = 0; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(0, (H / 4) * i); ctx.lineTo(W, (H / 4) * i); ctx.stroke(); }

    const levels = getVisualLevels(bitDepth);
    const amplitude = (H / 2) * 0.82;
    const centreY = H / 2;
    const cycles = 2;

    const analogueY = (x) => centreY - amplitude * Math.sin((x / W) * Math.PI * 2 * cycles);
    const quantiseY = (y) => {
      const normalised = (y - centreY) / amplitude;
      const stepped = Math.round(((normalised + 1) / 2) * (levels - 1)) / (levels - 1);
      return centreY - (stepped * 2 - 1) * amplitude;
    };

    const staircasePoints = [];
    for (let x = 0; x <= W; x++) staircasePoints.push({ x, y: quantiseY(analogueY(x)) });

    // Quantisation error fill
    ctx.beginPath();
    ctx.moveTo(0, staircasePoints[0].y);
    for (let x = 1; x <= W; x++) ctx.lineTo(x, staircasePoints[x].y);
    for (let x = W; x >= 0; x--) ctx.lineTo(x, analogueY(x));
    ctx.closePath();
    ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
    ctx.fill();

    // Analogue wave
    ctx.beginPath();
    ctx.moveTo(0, analogueY(0));
    for (let x = 1; x <= W; x++) ctx.lineTo(x, analogueY(x));
    ctx.strokeStyle = T.info;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Staircase
    ctx.beginPath();
    ctx.moveTo(0, staircasePoints[0].y);
    for (let i = 1; i <= W; i++) {
      const prev = staircasePoints[i - 1].y;
      const curr = staircasePoints[i].y;
      if (curr !== prev) { ctx.lineTo(i, prev); ctx.lineTo(i, curr); }
      else ctx.lineTo(i, curr);
    }
    ctx.strokeStyle = T.accent;
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [bitDepth]);

  useEffect(() => {
    drawWave();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => drawWave());
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [drawWave]);

  const dynamicRange = (bitDepth * 6).toFixed(0);
  const amplitudeLevels = Math.pow(2, bitDepth).toLocaleString();

  return (
    <div>
      <SectionHeader label="Bit Depth Explorer" title="Quantisation Staircase"
        description="Drag the slider to see how bit depth shapes the staircase approximation of an analogue signal. The shaded area shows quantisation error." />

      <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(74, 127, 212, 0.1)', marginBottom: '24px' }}>
        <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '240px' }}
          aria-label={`Quantisation staircase at ${bitDepth}-bit depth`} />
      </div>

      <Legend items={[
        { colour: T.info, label: 'Analogue signal' },
        { colour: T.accent, label: 'Quantised (digital)' },
        { colour: 'rgba(239,68,68,0.4)', label: 'Quantisation error' },
      ]} />

      <div style={{ margin: '24px 0' }}>
        <SliderControl label="Bit Depth" value={bitDepth} min={2} max={16} accent={T.accent}
          displayValue={`${bitDepth}-bit`} onChange={setBitDepth}
          minLabel="2-bit (coarse)" maxLabel="16-bit (CD quality)" />
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Amplitude levels', formula: `2^${bitDepth}`, value: amplitudeLevels, colour: T.info },
          { label: 'Dynamic range', formula: `${bitDepth} × 6`, value: `${dynamicRange} dB`, colour: T.physics },
        ].map(({ label, formula, value, colour }) => (
          <div key={label} style={{
            background: T.surfaceHover, border: `1px solid rgba(74, 127, 212, 0.08)`, borderRadius: '12px', padding: '14px 16px',
          }}>
            <div style={{ fontSize: '11px', color: T.textTertiary, marginBottom: '4px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</div>
            <div style={{ fontSize: '13px', color: 'rgba(232,228,223,0.6)', marginBottom: '4px', fontFamily: 'monospace' }}>{formula}</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: colour, fontFamily: FONT_HEADING }}>{value}</div>
          </div>
        ))}
      </div>

      <InfoCallout>
        <strong style={{ color: T.text }}>More bits = more levels = quieter noise floor.</strong>{' '}
        Each additional bit roughly doubles the number of amplitude levels, adding ~6 dB of dynamic range
        and reducing the quantisation noise that fills the error-shaded area above.
      </InfoCallout>
    </div>
  );
}

// ============================================
// SECTION 3: FILE SIZE CHALLENGE
// ============================================
const SCENARIOS = [
  { id: 1, description: '3-minute stereo podcast at 16-bit / 44.1 kHz', sampleRate: 44100, bitDepth: 16, channels: 2, durationSeconds: 180, durationLabel: '3 minutes' },
  { id: 2, description: '30-second mono voice memo at 8-bit / 22.05 kHz', sampleRate: 22050, bitDepth: 8, channels: 1, durationSeconds: 30, durationLabel: '30 seconds' },
  { id: 3, description: '5-minute stereo orchestral recording at 24-bit / 96 kHz', sampleRate: 96000, bitDepth: 24, channels: 2, durationSeconds: 300, durationLabel: '5 minutes' },
  { id: 4, description: '1-minute stereo pop track at 16-bit / 48 kHz', sampleRate: 48000, bitDepth: 16, channels: 2, durationSeconds: 60, durationLabel: '1 minute' },
  { id: 5, description: '10-second mono sound effect at 24-bit / 44.1 kHz', sampleRate: 44100, bitDepth: 24, channels: 1, durationSeconds: 10, durationLabel: '10 seconds' },
];

function calcFileSizeMB(s) { return (s.sampleRate * (s.bitDepth / 8) * s.channels * s.durationSeconds) / (1024 * 1024); }
function getAccuracy(guess, correct) {
  const pct = Math.abs(guess - correct) / correct;
  if (pct <= 0.1) return 'within10';
  if (pct <= 0.25) return 'within25';
  return 'over25';
}
const ACC_CFG = {
  within10: { label: 'Within 10% — excellent!', colour: T.success, bg: 'rgba(5,150,105,0.1)', border: 'rgba(5,150,105,0.3)' },
  within25: { label: 'Within 25% — close!', colour: '#D97706', bg: 'rgba(217,119,6,0.1)', border: 'rgba(217,119,6,0.3)' },
  over25: { label: 'More than 25% out — check your working', colour: '#DC2626', bg: 'rgba(220,38,38,0.1)', border: 'rgba(220,38,38,0.3)' },
};

function FileSizeChallenge() {
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState('');
  const [committed, setCommitted] = useState(false);
  const [scores, setScores] = useState([]);
  const [finished, setFinished] = useState(false);
  const inputRef = useRef(null);

  const scenario = SCENARIOS[idx];
  const correctMB = calcFileSizeMB(scenario);

  const handleCommit = useCallback(() => {
    const parsed = parseFloat(input.replace(',', '.'));
    if (isNaN(parsed) || parsed <= 0) return;
    setCommitted(true);
    setScores(prev => [...prev, getAccuracy(parsed, correctMB)]);
  }, [input, correctMB]);

  const handleNext = useCallback(() => {
    if (idx >= SCENARIOS.length - 1) { setFinished(true); return; }
    setIdx(i => i + 1); setInput(''); setCommitted(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [idx]);

  const handleRestart = useCallback(() => {
    setIdx(0); setInput(''); setCommitted(false); setScores([]); setFinished(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const withinTenCount = scores.filter(s => s === 'within10').length;
  const parsedGuess = parseFloat(input.replace(',', '.'));
  const accResult = committed && !isNaN(parsedGuess) ? getAccuracy(parsedGuess, correctMB) : null;
  const accCfg = accResult ? ACC_CFG[accResult] : null;

  if (finished) {
    return (
      <div>
        <SectionHeader label="File Size Challenge" title="Challenge Complete" description="" />
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontFamily: FONT_HEADING, fontSize: '36px', fontWeight: 700, color: T.text }}>{withinTenCount} / {SCENARIOS.length}</div>
          <div style={{ color: T.textSecondary, fontSize: '15px' }}>within 10% accuracy</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
          {SCENARIOS.map((s, i) => {
            const cfg = ACC_CFG[scores[i]];
            return (
              <div key={s.id} style={{
                background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: '10px',
                padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
              }}>
                <span style={{ fontSize: '13px', color: T.textSecondary, flex: 1 }}>{s.description}</span>
                <span style={{ fontSize: '12px', color: cfg.colour, fontWeight: 600, whiteSpace: 'nowrap' }}>{calcFileSizeMB(s).toFixed(2)} MB</span>
              </div>
            );
          })}
        </div>
        <button type="button" onClick={handleRestart} style={{
          display: 'block', margin: '0 auto', background: T.accent, color: '#fff', border: 'none',
          borderRadius: '10px', padding: '12px 28px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: FONT_BODY,
        }}>Try again</button>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader label="File Size Challenge" title="Estimate the File Size"
        description="Type your estimate in MB before revealing the answer. Commit first — no hints." />

      {/* Progress */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
        {SCENARIOS.map((_, i) => (
          <div key={i} style={{
            flex: 1, height: '4px', borderRadius: '2px',
            background: i < idx ? (scores[i] === 'within10' ? T.success : scores[i] === 'within25' ? '#D97706' : '#DC2626')
              : i === idx ? T.accent : 'rgba(74,127,212,0.15)',
            transition: 'background 0.3s',
          }} />
        ))}
        <span style={{ fontSize: '12px', color: T.textTertiary, whiteSpace: 'nowrap' }}>{idx + 1}/{SCENARIOS.length}</span>
      </div>

      {/* Formula */}
      <div style={{
        background: 'rgba(74, 127, 212, 0.06)', border: '1px solid rgba(74, 127, 212, 0.15)',
        borderRadius: '10px', padding: '10px 14px', marginBottom: '20px',
        fontSize: '12px', color: 'rgba(232,228,223,0.7)', fontFamily: 'monospace', letterSpacing: '0.03em',
      }}>
        Formula: Sample Rate × (Bit Depth ÷ 8) × Channels × Duration ÷ 1,048,576 (= 1,024²: bytes → KB → MB)
      </div>

      {/* Scenario card */}
      <div style={{
        background: T.surfaceHover, border: '1px solid rgba(74, 127, 212, 0.12)',
        borderRadius: '14px', padding: '20px 22px', marginBottom: '20px',
      }}>
        <div style={{ fontSize: '11px', color: T.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
          Scenario {idx + 1}
        </div>
        <p style={{ fontFamily: FONT_HEADING, fontSize: '18px', color: T.text, margin: '0 0 14px', lineHeight: 1.4 }}>{scenario.description}</p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {[
            { label: 'Sample rate', value: `${(scenario.sampleRate / 1000).toLocaleString()} kHz` },
            { label: 'Bit depth', value: `${scenario.bitDepth}-bit` },
            { label: 'Channels', value: scenario.channels === 1 ? 'Mono' : 'Stereo' },
            { label: 'Duration', value: scenario.durationLabel },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: 'rgba(74,127,212,0.06)', borderRadius: '8px', padding: '6px 12px' }}>
              <div style={{ fontSize: '10px', color: T.textTertiary, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</div>
              <div style={{ fontSize: '13px', color: T.text, fontWeight: 600, marginTop: '2px' }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Input */}
      {!committed && (
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: T.textSecondary, marginBottom: '8px' }}>Your estimate (in MB):</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input ref={inputRef} type="number" min="0" step="any" placeholder="e.g. 45.2" value={input}
              onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !committed && handleCommit()}
              autoFocus aria-label="Your file size estimate in megabytes"
              style={{
                flex: 1, background: 'rgba(6, 10, 20, 0.9)', border: '1px solid rgba(74, 127, 212, 0.2)',
                borderRadius: '10px', padding: '12px 16px', fontSize: '16px', color: T.text, fontFamily: FONT_BODY, outline: 'none',
              }}
              onFocus={e => { e.target.style.borderColor = 'rgba(74, 127, 212, 0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(74, 127, 212, 0.12)'; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(74, 127, 212, 0.2)'; e.target.style.boxShadow = 'none'; }}
            />
            <button type="button" onClick={handleCommit} disabled={!input || isNaN(parseFloat(input))}
              style={{
                background: T.accent, color: '#fff', border: 'none', borderRadius: '10px', padding: '12px 22px',
                fontSize: '14px', fontWeight: 600, cursor: input ? 'pointer' : 'not-allowed',
                opacity: !input || isNaN(parseFloat(input)) ? 0.5 : 1, fontFamily: FONT_BODY, whiteSpace: 'nowrap',
              }}>Check</button>
          </div>
        </div>
      )}

      {/* Reveal */}
      {committed && accCfg && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            background: accCfg.bg, border: `1px solid ${accCfg.border}`, borderRadius: '10px',
            padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px',
          }}>
            <div>
              <div style={{ fontSize: '12px', color: accCfg.colour, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{accCfg.label}</div>
              <div style={{ fontSize: '13px', color: T.textSecondary, marginTop: '4px' }}>
                Your guess: <strong style={{ color: T.text }}>{parsedGuess.toFixed(2)} MB</strong>
                {'  ·  '}Correct: <strong style={{ color: T.physics }}>{correctMB.toFixed(2)} MB</strong>
              </div>
            </div>
            <div style={{ fontSize: '13px', color: accCfg.colour, fontWeight: 600 }}>
              {Math.abs(((parsedGuess - correctMB) / correctMB) * 100).toFixed(1)}% off
            </div>
          </div>

          {/* Step by step */}
          <div style={{
            background: T.surfaceHover, border: `1px solid rgba(74, 127, 212, 0.08)`,
            borderRadius: '12px', padding: '16px 18px', marginTop: '16px',
          }}>
            <div style={{ fontSize: '12px', color: T.textTertiary, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }}>Step-by-step calculation</div>
            {(() => {
              const bps = scenario.bitDepth / 8;
              const bytesPerSec = scenario.sampleRate * bps * scenario.channels;
              const totalBytes = bytesPerSec * scenario.durationSeconds;
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Step n={1}>Bytes per sample: <Num>{scenario.bitDepth}</Num> ÷ 8 = <Num>{bps}</Num> bytes</Step>
                  <Step n={2}>Bytes per second: <Num>{scenario.sampleRate.toLocaleString()}</Num> × <Num>{bps}</Num> × <Num>{scenario.channels}</Num> ch = <Num>{bytesPerSec.toLocaleString()}</Num></Step>
                  <Step n={3}>Total bytes: <Num>{bytesPerSec.toLocaleString()}</Num> × <Num>{scenario.durationSeconds}s</Num> = <Num>{totalBytes.toLocaleString()}</Num></Step>
                  <Step n={4}>Convert to MB: ÷ 1,024 ÷ 1,024 = <strong style={{ color: T.physics, fontSize: '15px' }}>{correctMB.toFixed(2)} MB</strong></Step>
                </div>
              );
            })()}
          </div>

          <button type="button" onClick={handleNext} style={{
            marginTop: '16px', background: T.accent, color: '#fff', border: 'none', borderRadius: '10px',
            padding: '12px 24px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: FONT_BODY, width: '100%',
          }}>{idx >= SCENARIOS.length - 1 ? 'See final score' : 'Next scenario →'}</button>
        </div>
      )}
    </div>
  );
}

// ============================================
// SECTION 4: AO3/AO4 EVALUATE RESPONSE
// ============================================
const CHECKLIST_ITEMS = [
  'I identified specific sample rate and bit depth values',
  'I explained what these settings control (frequency range / dynamic range)',
  'I evaluated WHY these are appropriate for podcasts specifically',
  'I considered the trade-off between quality and file size',
  'I used correct technical vocabulary (e.g., Nyquist, quantisation, dynamic range)',
];

const MODEL_ANSWER = 'For a podcast, I would recommend recording at 24-bit/48kHz. The 48kHz sample rate captures frequencies up to 24kHz (Nyquist frequency), which exceeds the range of human hearing at approximately 20kHz. This is appropriate for speech-based content where the fundamental frequencies are typically between 85Hz and 300Hz, with harmonics extending higher. The 24-bit depth provides a dynamic range of approximately 144dB (24 × 6), meaning the noise floor sits far below any audible signal — significantly reducing the risk of quantisation noise during quiet passages. Note: the file size calculation in Section 3 uses 16-bit/44.1kHz — that represents a typical distribution format. Professional recording at 24-bit/48kHz is then converted down for delivery. For streaming distribution, the final file would typically be converted to a compressed format such as MP3 or AAC, reducing the file size significantly from the uncompressed original. Recording at higher quality than the delivery format preserves detail during editing and processing — this is standard professional practice.';

function EvaluateResponse() {
  const [response, setResponse] = useState('');
  const [checked, setChecked] = useState(Array(CHECKLIST_ITEMS.length).fill(false));
  const [modelRevealed, setModelRevealed] = useState(false);

  const tickedCount = checked.filter(Boolean).length;
  const canReveal = tickedCount >= 3;

  return (
    <div>
      <SectionHeader label="AO3 / AO4 — Your Turn" title="Extended Response Practice"
        description="Apply what you've explored. Write a short response to the scenario below." />

      {/* Scenario */}
      <Card>
        <CardLabel>Scenario</CardLabel>
        <p style={{ fontSize: '15px', lineHeight: 1.7, color: T.text, margin: 0 }}>
          A client asks you to record a podcast for streaming distribution. They want the best quality
          possible but are concerned about file sizes for hosting. <strong style={{ color: T.gold }}>Describe</strong> the sample rate and bit
          depth you would recommend, and <strong style={{ color: T.gold }}>evaluate</strong> why these settings are appropriate for this context.
        </p>
      </Card>

      {/* Pattern reminder */}
      <Card>
        <CardLabel>How to answer well</CardLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ background: T.surfaceHover, border: `1px solid rgba(74, 127, 212, 0.08)`, borderRadius: '10px', padding: '14px 16px' }}>
            <span style={{ color: T.gold, fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em' }}>AO3 — DESCRIBE</span>
            <p style={{ color: T.textSecondary, fontSize: '13px', lineHeight: 1.5, margin: '6px 0 0' }}>Identify the technical detail → explain what it does</p>
          </div>
          <div style={{ background: T.surfaceHover, border: `1px solid rgba(74, 127, 212, 0.08)`, borderRadius: '10px', padding: '14px 16px' }}>
            <span style={{ color: T.gold, fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em' }}>AO4 — EVALUATE</span>
            <p style={{ color: T.textSecondary, fontSize: '13px', lineHeight: 1.5, margin: '6px 0 0' }}>Why is this the right choice? What are the trade-offs?</p>
          </div>
        </div>
        <div style={{
          marginTop: '14px', padding: '10px 16px', background: 'rgba(201, 184, 122, 0.08)',
          border: '1px solid rgba(201, 184, 122, 0.2)', borderRadius: '8px', color: T.gold,
          fontSize: '13px', fontWeight: 600, textAlign: 'center', letterSpacing: '0.04em',
        }}>IDENTIFY → EXPLAIN → EVALUATE</div>
      </Card>

      {/* Response */}
      <Card>
        <CardLabel>Your Response</CardLabel>
        <textarea aria-label="Response" value={response} onChange={e => setResponse(e.target.value)}
          placeholder="Start by identifying your recommended settings..."
          rows={6}
          style={{
            width: '100%', minHeight: '150px', background: 'rgba(6, 10, 20, 0.9)',
            border: '1px solid rgba(74, 127, 212, 0.15)', borderRadius: '10px', color: T.text,
            fontSize: '14px', lineHeight: 1.7, padding: '14px 16px', resize: 'vertical', outline: 'none',
            boxSizing: 'border-box', fontFamily: FONT_BODY, transition: 'border-color 0.2s',
          }}
          onFocus={e => e.target.style.borderColor = 'rgba(74, 127, 212, 0.4)'}
          onBlur={e => e.target.style.borderColor = 'rgba(74, 127, 212, 0.15)'}
        />
        <p style={{ textAlign: 'right', color: T.textTertiary, fontSize: '12px', marginTop: '6px' }}>{response.length} characters</p>
      </Card>

      {/* Self-check */}
      <Card>
        <CardLabel>Self-Check — tick after writing</CardLabel>
        {CHECKLIST_ITEMS.map((item, i) => (
          <div key={i} onClick={() => setChecked(prev => prev.map((v, j) => j === i ? !v : v))}
            role="checkbox" aria-checked={checked[i]} tabIndex={0}
            onKeyDown={e => (e.key === ' ' || e.key === 'Enter') && setChecked(prev => prev.map((v, j) => j === i ? !v : v))}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px 0',
              borderBottom: '1px solid rgba(74, 127, 212, 0.04)', cursor: 'pointer',
            }}>
            <div style={{
              width: '20px', height: '20px', minWidth: '20px', borderRadius: '5px',
              border: checked[i] ? '2px solid #059669' : '2px solid rgba(74, 127, 212, 0.3)',
              background: checked[i] ? 'rgba(5, 150, 105, 0.15)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '1px', transition: 'transform, opacity, background-color, color, border-color, box-shadow 0.2s',
            }}>
              {checked[i] && <svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
            </div>
            <span style={{ fontSize: '14px', lineHeight: 1.5, color: checked[i] ? '#6EE7B7' : T.textSecondary, transition: 'color 0.2s' }}>{item}</span>
          </div>
        ))}

        <div style={{ marginTop: '24px' }}>
          <button type="button" onClick={() => canReveal && setModelRevealed(true)} disabled={!canReveal} aria-disabled={!canReveal}
            style={{
              display: 'block', margin: '4px auto 0', padding: '12px 28px',
              background: canReveal ? T.accent : 'rgba(255, 107, 53, 0.25)',
              color: canReveal ? '#fff' : 'rgba(255, 107, 53, 0.5)',
              border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600,
              cursor: canReveal ? 'pointer' : 'not-allowed', fontFamily: FONT_BODY, transition: 'transform, opacity, background-color, color, border-color, box-shadow 0.2s',
            }}>How did I do?</button>
          {!canReveal && <p style={{ textAlign: 'center', color: T.textTertiary, fontSize: '12px', marginTop: '8px' }}>Tick at least 3 items to unlock the model answer</p>}
        </div>

        {modelRevealed && (
          <div style={{
            background: 'rgba(5, 150, 105, 0.06)', border: '1px solid rgba(5, 150, 105, 0.2)',
            borderRadius: '12px', padding: '20px 24px', marginTop: '16px',
          }}>
            <span style={{ fontFamily: FONT_HEADING, color: '#6EE7B7', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>Model Answer</span>
            <p style={{ color: 'rgba(232, 228, 223, 0.6)', fontSize: '12px', fontStyle: 'italic', margin: '0 0 10px' }}>
                Model response written against the Edexcel mark scheme for this question type.
            </p>
            <p style={{ color: 'rgba(232, 228, 223, 0.85)', fontSize: '14px', lineHeight: 1.75, margin: 0 }}>{MODEL_ANSWER}</p>
          </div>
        )}
      </Card>
    </div>
  );
}

// ============================================
// SHARED UTILITY COMPONENTS
// ============================================
function SectionHeader({ label, title, description }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ fontFamily: FONT_BODY, color: T.gold, fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>{label}</div>
      <h2 style={{ fontFamily: FONT_HEADING, fontSize: '22px', fontWeight: 700, color: T.text, margin: '0 0 6px', letterSpacing: '-0.01em' }}>{title}</h2>
      {description && <p style={{ fontSize: '14px', color: T.textTertiary, lineHeight: 1.5, margin: 0 }}>{description}</p>}
    </div>
  );
}

function Card({ children }) {
  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`, borderRadius: '16px',
      padding: '28px 32px', marginBottom: '20px', backdropFilter: 'blur(12px)',
    }}>{children}</div>
  );
}

function CardLabel({ children }) {
  return <span style={{ fontFamily: FONT_HEADING, color: T.gold, fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px', display: 'block' }}>{children}</span>;
}

function SliderControl({ label, value, min, max, accent, displayValue, onChange, minLabel, maxLabel }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
        <label style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.textTertiary }}>{label}</label>
        <span style={{ fontSize: '15px', fontWeight: 700, color: accent }}>{displayValue}</span>
      </div>
      <input aria-label={label} type="range" min={min} max={max} step={1} value={value} onChange={e => onChange(Number(e.target.value))}
        aria-valuemin={min} aria-valuemax={max} aria-valuenow={value}
        style={{
          width: '100%', appearance: 'none', WebkitAppearance: 'none', height: '4px', borderRadius: '2px',
          background: `linear-gradient(to right, ${accent} 0%, ${accent} ${pct}%, rgba(74,127,212,0.2) ${pct}%)`,
          outline: 'none', cursor: 'pointer',
        }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '10px', color: 'rgba(232, 228, 223, 0.35)' }}>
        <span>{minLabel}</span><span>{maxLabel}</span>
      </div>
    </div>
  );
}

function Legend({ items }) {
  return (
    <div style={{ marginTop: '16px', display: 'flex', gap: '18px', flexWrap: 'wrap' }}>
      {items.map(({ colour, label, dashed }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <span style={{
            display: 'inline-block', width: '24px', height: '2px', borderRadius: '1px',
            ...(dashed
              ? { backgroundImage: `repeating-linear-gradient(to right, ${colour} 0, ${colour} 4px, transparent 4px, transparent 8px)` }
              : { background: colour }),
          }} />
          <span style={{ fontSize: '11px', color: T.textTertiary }}>{label}</span>
        </div>
      ))}
    </div>
  );
}

function InfoCallout({ children }) {
  return (
    <div style={{
      background: 'rgba(74, 127, 212, 0.08)', border: '1px solid rgba(74, 127, 212, 0.2)',
      borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: '10px',
    }}>
      <span style={{ color: T.info, fontSize: '16px', lineHeight: 1.4 }}>ℹ</span>
      <p style={{ margin: 0, fontSize: '13px', color: T.textSecondary, lineHeight: 1.6 }}>{children}</p>
    </div>
  );
}

function Num({ children }) {
  return <strong style={{ color: T.accent, fontFamily: 'monospace', fontSize: '14px' }}>{children}</strong>;
}

function Step({ n, children }) {
  return (
    <div style={{ fontSize: '13px', color: T.textSecondary, lineHeight: 1.7 }}>
      <span style={{ color: T.textTertiary }}>{n}.</span> {children}
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function SamplingPlayground() {
  const [activeSection, setActiveSection] = useState('sampling');
  const sectionRefs = useRef({});

  const handleNavigate = (id) => {
    setActiveSection(id);
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Track which section is in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActiveSection(entry.target.dataset.section);
        });
      },
      { threshold: 0.3 }
    );
    Object.values(sectionRefs.current).forEach(el => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  return (
    <div style={{
      background: T.bg,
      color: T.text,
      fontFamily: FONT_BODY,
      minHeight: '100vh',
      padding: '32px 24px',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%;
          background: #F0EDE8; cursor: pointer; border: 2px solid rgba(74,127,212,0.3);
          box-shadow: 0 0 8px rgba(74,127,212,0.3);
        }
        input[type="range"]::-moz-range-thumb {
          width: 16px; height: 16px; border-radius: 50%; background: #F0EDE8;
          cursor: pointer; border: 2px solid rgba(74,127,212,0.3);
        }
        textarea::placeholder { color: rgba(232, 228, 223, 0.35); }
        input::placeholder { color: rgba(232, 228, 223, 0.35); }
      `}</style>

      <div style={{ maxWidth: '760px', margin: '0 auto' }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: '40px', paddingTop: '16px' }}>
          <div style={{ fontSize: '11px', color: T.gold, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '12px' }}>
            Topic 2.4 — Digital and Analogue
          </div>
          <h1 style={{ fontFamily: FONT_HEADING, fontSize: '32px', fontWeight: 900, color: T.text, margin: '0 0 10px', letterSpacing: '-0.02em' }}>
            Sampling Playground
          </h1>
          <p style={{ color: T.textTertiary, fontSize: '15px', lineHeight: 1.6, maxWidth: '520px', margin: '0 auto' }}>
            Explore how digital audio captures analogue sound. Play with sample rate, bit depth, and file sizes — then put it all together.
          </p>
        </div>

        <SectionNav active={activeSection} onNavigate={handleNavigate} />

        {/* Sections */}
        <div ref={el => sectionRefs.current.sampling = el} data-section="sampling" style={{ marginBottom: '64px', scrollMarginTop: '80px' }}>
          <SamplingExplorer />
        </div>

        <div ref={el => sectionRefs.current.bitdepth = el} data-section="bitdepth" style={{ marginBottom: '64px', scrollMarginTop: '80px' }}>
          <BitDepthExplorer />
        </div>

        <div ref={el => sectionRefs.current.filesize = el} data-section="filesize" style={{ marginBottom: '64px', scrollMarginTop: '80px' }}>
          <FileSizeChallenge />
        </div>

        <div ref={el => sectionRefs.current.evaluate = el} data-section="evaluate" style={{ marginBottom: '64px', scrollMarginTop: '80px' }}>
          <EvaluateResponse />
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', padding: '24px 0 32px', borderTop: `1px solid ${T.border}` }}>
          <p style={{ color: T.textTertiary, fontSize: '12px', margin: 0 }}>
            A-Level Music Technology — Component 4: Producing and Analysing — Section 2.4: Digital Audio
          </p>
        </div>
      </div>
    </div>
  );
}
