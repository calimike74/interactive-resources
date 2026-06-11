'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  buildFlashcardCopyMarkdown,
  buildFlashcardCopyHtml,
  buildFlashcardCopyText,
  FLASHCARD_MODES,
} from '@/lib/copy-for-ai';

const STORAGE_KEY = 'delay-flashcards-progress-v1';
const LEARN_MODE_STORAGE_KEY = 'copy-ai-learn-mode';

// Revelation Design System tokens — warm neutrals, single blue accent,
// matches the look of DelayEffects / StereoPanning / CompressorExplorer.
const DESIGN_TOKENS_CSS = `
  .dfc-root {
    --bg: #FAFAFA;
    --surface: #FFFFFF;
    --fg: #1A1A2E;
    --fg-secondary: #4A4F5A;
    --fg-tertiary: #8B909A;
    --border: #E5E7EB;
    --border-strong: #9CA3AF;
    --accent: #DCC892;
    --accent-hover: #C8B47A;
    --accent-soft: rgba(37, 99, 235, 0.08);
    --success: #059669;
    --success-soft: rgba(5, 150, 105, 0.08);
    --warning: #DCC892;
    --warning-soft: rgba(217, 119, 6, 0.08);
    --danger: #DC2626;
    --danger-soft: rgba(220, 38, 38, 0.08);

    background: var(--bg);
    color: var(--fg);
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    line-height: 1.55;
    padding: 2rem 1rem 4rem;
    min-height: 100%;
  }
  .dfc-container { max-width: 880px; margin: 0 auto; }

  /* Header */
  .dfc-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1.5rem;
    margin-bottom: 2rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid var(--border);
  }
  .dfc-eyebrow {
    font-size: 0.7rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--fg-tertiary);
    margin-bottom: 0.5rem;
  }
  .dfc-title {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 2.1rem;
    font-weight: 600;
    color: var(--fg);
    margin: 0 0 0.4rem 0;
    letter-spacing: -0.01em;
  }
  .dfc-subtitle {
    color: var(--fg-secondary);
    font-size: 0.95rem;
    margin: 0;
    max-width: 48ch;
  }
  .dfc-keyboard {
    font-size: 0.75rem;
    color: var(--fg-secondary);
    background: var(--surface);
    border: 1px solid var(--border);
    padding: 0.6rem 0.85rem;
    border-radius: 4px;
    line-height: 1.7;
    white-space: nowrap;
  }
  .dfc-keyboard-title {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--fg-tertiary);
    margin-bottom: 0.35rem;
  }
  .dfc-kbd {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 3px;
    padding: 0 0.35rem;
    font-family: ui-monospace, SFMono-Regular, monospace;
    font-size: 0.7rem;
    color: var(--fg);
  }
  @media (max-width: 640px) {
    .dfc-header { flex-direction: column; }
    .dfc-keyboard { display: none; }
  }

  /* Segmented controls */
  .dfc-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem 2rem;
    margin-bottom: 1.5rem;
  }
  .dfc-control-group { display: flex; flex-direction: column; gap: 0.4rem; }
  .dfc-control-label {
    font-size: 0.65rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--fg-tertiary);
  }
  .dfc-segmented {
    display: inline-flex;
    border: 1px solid var(--border);
    border-radius: 4px;
    background: var(--surface);
    padding: 3px;
  }
  .dfc-segmented button {
    border: none;
    background: transparent;
    padding: 0.35rem 0.9rem;
    font-size: 0.85rem;
    color: var(--fg-secondary);
    cursor: pointer;
    font-family: inherit;
    border-radius: 3px;
    transition: color 0.15s, background 0.15s;
  }
  .dfc-segmented button:hover:not([data-active="true"]) { color: var(--fg); }
  .dfc-segmented button[data-active="true"] {
    background: var(--fg);
    color: var(--surface);
    font-weight: 500;
  }

  /* Instructions */
  .dfc-instructions {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 1.25rem 1.5rem;
    margin-bottom: 1.5rem;
  }
  .dfc-instructions h3 {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 1.25rem;
    margin: 0 0 0.75rem 0;
    color: var(--fg);
    font-weight: 600;
  }
  .dfc-instructions-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    margin-bottom: 1rem;
  }
  @media (max-width: 640px) { .dfc-instructions-grid { grid-template-columns: 1fr; } }
  .dfc-instructions h4 {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--fg-tertiary);
    margin: 0 0 0.5rem 0;
    font-weight: 600;
  }
  .dfc-instructions ol, .dfc-instructions ul {
    font-size: 0.9rem;
    color: var(--fg-secondary);
    padding-left: 1.25rem;
    line-height: 1.6;
    margin: 0;
  }
  .dfc-instructions li + li { margin-top: 0.25rem; }

  /* Progress */
  .dfc-progress { margin-bottom: 1.25rem; }
  .dfc-progress-dots {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    margin-bottom: 0.6rem;
  }
  .dfc-dot {
    height: 3px;
    flex: 1;
    min-width: 14px;
    max-width: 28px;
    border-radius: 1.5px;
    background: var(--border);
    transition: background 0.25s;
  }
  .dfc-dot[data-state="mastered"] { background: var(--success); }
  .dfc-dot[data-state="needs-review"] { background: var(--danger); }
  .dfc-dot[data-state="current"] { background: var(--accent); }
  .dfc-progress-meta {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    color: var(--fg-tertiary);
    text-transform: capitalize;
    gap: 1rem;
    flex-wrap: wrap;
  }

  /* Card — 3D flip. Both faces occupy the same grid cell, so the
     container sizes to whichever side is taller. Rotating the inner
     wrapper 180deg reveals the back; backface-visibility hides the
     face currently pointing away from the viewer. */
  .dfc-card-flip {
    perspective: 1600px;
    margin-bottom: 1.25rem;
    animation: dfcCardEnter 0.4s cubic-bezier(0.22, 0.8, 0.3, 1);
  }
  @keyframes dfcCardEnter {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .dfc-card-flip-inner {
    position: relative;
    display: grid;
    grid-template-areas: "card";
    transform-style: preserve-3d;
    transition: transform 0.6s cubic-bezier(0.22, 0.8, 0.3, 1);
    will-change: transform;
  }
  .dfc-card-flip[data-revealed="true"] .dfc-card-flip-inner {
    transform: rotateY(180deg);
  }
  .dfc-card-face {
    grid-area: card;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 1.75rem 2rem;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .dfc-card-face-back {
    transform: rotateY(180deg);
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-soft);
    transition: border-color 0.15s ease-out, box-shadow 0.15s ease-out;
  }
  /* Rating confirmation: briefly recolours the back face border/ring
     to match the chosen rating (red/amber/green) before the card advances. */
  .dfc-card-flip[data-last-rating="again"] .dfc-card-face-back {
    border-color: var(--danger);
    box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.18);
  }
  .dfc-card-flip[data-last-rating="hard"] .dfc-card-face-back {
    border-color: var(--warning);
    box-shadow: 0 0 0 4px rgba(217, 119, 6, 0.18);
  }
  .dfc-card-flip[data-last-rating="good"] .dfc-card-face-back {
    border-color: var(--success);
    box-shadow: 0 0 0 4px rgba(5, 150, 105, 0.18);
  }
  @media (prefers-reduced-motion: reduce) {
    .dfc-card-flip-inner { transition: none; }
    .dfc-card-flip { animation: none; }
  }
  .dfc-card-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.25rem;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--fg-tertiary);
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--border);
  }
  .dfc-card-question {
    font-size: 1.35rem;
    font-weight: 500;
    text-align: center;
    color: var(--fg);
    line-height: 1.45;
    margin: 2rem 0;
    cursor: pointer;
    padding: 0 0.5rem;
  }
  .dfc-card-answer {
    font-size: 1.05rem;
    color: var(--fg);
    line-height: 1.6;
    margin: 0 0 1.25rem 0;
  }
  .dfc-card-diagram {
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 0.5rem;
    background: var(--bg);
    margin: 1rem 0;
  }
  .dfc-explain-block {
    background: var(--bg);
    border-left: 2px solid var(--accent);
    padding: 0.75rem 1rem;
    margin-top: 0.75rem;
    font-size: 0.9rem;
    color: var(--fg-secondary);
    border-radius: 0 3px 3px 0;
  }
  .dfc-explain-label {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--fg-tertiary);
    margin-bottom: 0.3rem;
    display: block;
    font-weight: 600;
  }

  /* Buttons */
  .dfc-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    background: var(--surface);
    color: var(--fg);
    border: 1px solid var(--border);
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
    border-radius: 4px;
    cursor: pointer;
    font-family: inherit;
    transition: background 0.15s, border-color 0.15s, color 0.15s;
  }
  .dfc-btn:hover:not(:disabled) { border-color: var(--border-strong); background: var(--bg); }
  .dfc-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .dfc-btn-primary {
    background: var(--accent);
    color: white;
    border-color: var(--accent);
  }
  .dfc-btn-primary:hover:not(:disabled) { background: var(--accent-hover); border-color: var(--accent-hover); }
  .dfc-btn-ghost {
    background: transparent;
    border-color: transparent;
    color: var(--fg-secondary);
  }
  .dfc-btn-ghost:hover:not(:disabled) { color: var(--fg); background: var(--bg); border-color: transparent; }

  /* Study tools — copy / ask-AI row */
  .dfc-tools {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 0.4rem;
    padding-top: 0.75rem;
    margin-top: 1rem;
    border-top: 1px solid var(--border);
    position: relative;
  }
  .dfc-tools-label {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--fg-tertiary);
    margin-right: auto;
  }
  .dfc-tool-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    background: transparent;
    color: var(--fg-secondary);
    border: 1px solid var(--border);
    padding: 0.35rem 0.75rem;
    font-size: 0.8rem;
    border-radius: 4px;
    cursor: pointer;
    font-family: inherit;
    transition: background 0.15s, border-color 0.15s, color 0.15s;
  }
  .dfc-tool-btn:hover { color: var(--fg); border-color: var(--border-strong); background: var(--bg); }
  .dfc-tool-btn[data-active="true"] {
    background: var(--accent);
    color: white;
    border-color: var(--accent);
  }
  .dfc-tool-btn[data-copied="true"] {
    background: var(--success);
    color: white;
    border-color: var(--success);
  }
  .dfc-ai-popover {
    position: absolute;
    bottom: calc(100% + 6px);
    right: 0;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 6px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
    padding: 0.4rem;
    min-width: 260px;
    z-index: 50;
    animation: dfcPopoverEnter 0.15s ease-out;
  }
  @keyframes dfcPopoverEnter {
    from { opacity: 0; transform: translateY(4px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .dfc-ai-option {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    width: 100%;
    text-align: left;
    background: transparent;
    border: none;
    padding: 0.55rem 0.75rem;
    border-radius: 4px;
    cursor: pointer;
    font-family: inherit;
    color: var(--fg);
  }
  .dfc-ai-option:hover { background: var(--bg); }
  .dfc-ai-option strong { font-size: 0.9rem; font-weight: 500; }
  .dfc-ai-option span { font-size: 0.75rem; color: var(--fg-tertiary); }
  .dfc-ai-divider {
    height: 1px;
    background: var(--border);
    margin: 0.35rem 0.25rem;
  }
  .dfc-ai-toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    font-size: 0.8rem;
    color: var(--fg-secondary);
    cursor: pointer;
  }
  .dfc-ai-toggle input { cursor: pointer; }
  .dfc-ai-toggle span { line-height: 1.3; }

  /* Rating grid */
  .dfc-ratings {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 0.5rem;
    margin-top: 1.25rem;
  }
  .dfc-rating-btn {
    position: relative;
    padding: 0.75rem 0.5rem;
    border: 1px solid var(--border);
    background: var(--surface);
    font-family: inherit;
    font-size: 0.95rem;
    font-weight: 500;
    color: var(--fg);
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s, color 0.15s;
    text-align: center;
  }
  .dfc-rating-btn[data-rating="again"]:hover { background: var(--danger-soft); border-color: var(--danger); color: var(--danger); }
  .dfc-rating-btn[data-rating="hard"]:hover { background: var(--warning-soft); border-color: var(--warning); color: var(--warning); }
  .dfc-rating-btn[data-rating="good"]:hover { background: var(--success-soft); border-color: var(--success); color: var(--success); }
  .dfc-rating-hint {
    display: block;
    font-size: 0.68rem;
    color: var(--fg-tertiary);
    font-weight: 400;
    margin-top: 0.25rem;
    text-transform: none;
    letter-spacing: normal;
  }

  /* Nav */
  .dfc-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .dfc-nav-center { display: flex; gap: 0.5rem; }

  /* Summary */
  .dfc-summary-title {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 1.75rem;
    margin: 0 0 1.5rem 0;
    text-align: center;
    color: var(--fg);
    font-weight: 600;
  }
  .dfc-meter {
    height: 4px;
    background: var(--border);
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 1rem;
  }
  .dfc-meter-fill { height: 100%; background: var(--accent); transition: width 0.35s; }
  .dfc-stat-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
    margin-bottom: 2rem;
  }
  .dfc-stat {
    text-align: center;
    padding: 1rem 0.75rem;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 5px;
  }
  .dfc-stat-label {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--fg-tertiary);
    margin-bottom: 0.4rem;
  }
  .dfc-stat-value { font-size: 1.6rem; font-weight: 600; color: var(--fg); line-height: 1; }
  .dfc-stat-value[data-tone="success"] { color: var(--success); }
  .dfc-stat-value[data-tone="danger"] { color: var(--danger); }

  .dfc-summary-section { margin-bottom: 1.75rem; }
  .dfc-summary-section h3 {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 1.2rem;
    margin: 0 0 0.75rem 0;
    font-weight: 600;
  }
  .dfc-summary-subgroup + .dfc-summary-subgroup { margin-top: 1rem; }
  .dfc-summary-item {
    padding: 0.75rem 1rem;
    background: var(--surface);
    border: 1px solid var(--border);
    border-left: 3px solid var(--border);
    border-radius: 4px;
    margin-bottom: 0.5rem;
  }
  .dfc-summary-item[data-tone="needs-review"] { border-left-color: var(--danger); }
  .dfc-summary-item[data-tone="mastered"] { border-left-color: var(--success); }
  .dfc-summary-item p { margin: 0; }
  .dfc-summary-item p + p { margin-top: 0.35rem; font-size: 0.85rem; color: var(--fg-secondary); }

  .dfc-summary-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: center;
    margin-top: 2rem;
  }
`;

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const DelayFlashcards = () => {
  const allCards = {
    basic: [
      {
        id: "b1",
        question: "What is Delay Time in audio effects? (Edexcel 1.12a)",
        answer: "Delay Time is the duration between the original signal and its delayed copy, measured in milliseconds. It determines the perceived spacing of echoes and is a core parameter for both creative and corrective applications in A-Level production work.",
        furtherLearning: "In Ableton Live's Echo device, experiment with delay times from 20ms (slapback) to 1000ms+ (long echoes). Try syncing to tempo for rhythmic effects.",
        practicalExample: "A-Level Application: 80ms = slapback doubling, 125ms = distinct echo, 250ms+ = rhythmic delay. Essential for Component 4 practical work.",
        difficulty: 1,
        image: "delay-time",
        category: "fundamentals"
      },
      {
        id: "b2",
        question: "What is a 'Dry' audio signal in delay processing? (A-Level Core Concept)",
        answer: "The Dry signal is the original, unprocessed audio before any delay effect is applied. Essential for Component 4 understanding - the dry/wet balance controls how much original vs. delayed signal appears in the final mix.",
        furtherLearning: "In Ableton's Echo device, the 'Dry' control adjusts the original signal level. Try 100% dry (no delay heard) vs. 0% dry (only delays heard).",
        practicalExample: "A-Level Technique: Vocals typically use 70% dry/30% wet for clarity, while guitar solos might use 50/50 for dramatic effect. Critical for exam scenarios.",
        difficulty: 1,
        image: "dry-signal",
        category: "fundamentals"
      },
      {
        id: "b3",
        question: "What is a 'Wet' audio signal?",
        answer: "A Wet signal is a processed audio signal. It has had effects or processing applied to it, altering the original sound.",
        furtherLearning: "Experiment with different wet/dry balances on vocal delay to find a blend that adds depth without sacrificing intelligibility.",
        practicalExample: "100% wet would mean only hearing the processed sound with no original signal, which is rarely used except for special effects.",
        difficulty: 1,
        image: "wet-signal",
        category: "fundamentals"
      },
      {
        id: "b4",
        question: "What is Echo in audio processing?",
        answer: "Echo is the repetition of a sound after a sufficient amount of time that it is perceived as separate from the original. If there are several copies of the sound, we obtain a multiple echo.",
        furtherLearning: "Try creating a multiple echo effect with gradually decreasing volume to simulate natural echoes in a large space.",
        practicalExample: "The classic 'canyon echo' effect in recordings, where you hear distinct repetitions of a vocal or guitar note fading away.",
        difficulty: 1,
        image: "echo",
        category: "effects"
      },
      {
        id: "b5",
        question: "What is Feedback in delay effects? (Edexcel 1.12 Key Parameter)",
        answer: "Feedback controls how much of the delayed signal is fed back into the delay line, creating multiple repeats. Essential A-Level parameter: 0% = single repeat, higher values = more repeats, 100%+ = infinite delay (use carefully!).",
        furtherLearning: "In Ableton Echo: Start with 20% feedback for subtle repeats, try 60% for dub-style effects. CAUTION: Above 90% can cause runaway feedback - always monitor levels!",
        practicalExample: "Component 4 Applications: Slapback (0% feedback), Rock guitar (30-50%), Dub delays (70-85%). Critical for both creative and corrective applications in coursework.",
        difficulty: 1,
        image: "feedback",
        category: "parameters"
      }
    ],
    intermediate: [
      {
        id: "i1",
        question: "What is the difference between Delay and Echo?",
        answer: "While both terms are sometimes used interchangeably, technically, delay is the effect itself (repetition of sound), while echo refers specifically to delays long enough to be perceived as distinct repetitions (usually >50ms).",
        furtherLearning: "Compare the same sound with a 30ms delay versus a 150ms delay to hear when the effect transitions from a sense of space to distinct echoes.",
        practicalExample: "A 30ms delay on vocals creates a thicker sound (doubling effect), while a 200ms delay creates clear, separate echoes.",
        difficulty: 2,
        image: "delay-vs-echo",
        category: "concepts"
      },
      {
        id: "i2",
        question: "What is a Ping-Pong Delay? (Edexcel 1.12d - Exam Essential)",
        answer: "Ping-Pong Delay alternates echoes between left and right stereo channels, creating spatial movement. A-Level requirement: Must understand stereo imaging, channel alternation (L→R→L→R), and requires proper stereo monitoring to be effective.",
        furtherLearning: "Ableton Live Echo: Enable 'Ping Pong' mode, best with center-panned sources. Try on lead vocals or guitar solos - listen on headphones to hear full effect.",
        practicalExample: "Component 4 Assessment: Essential for demonstrating stereo processing knowledge. Used in dub, electronic music, and rock solos. Key exam topic - know when and why to use it.",
        difficulty: 2,
        image: "ping-pong",
        category: "types"
      },
      {
        id: "i3",
        question: "What is the Wet/Dry Mix control in delay effects?",
        answer: "The Wet/Dry Mix control determines the balance between the original (dry) signal and the processed (wet) signal in the final output. A 50/50 mix would blend equal amounts of both signals.",
        furtherLearning: "Compare a 20% wet mix to an 80% wet mix on the same delay setting to hear how the balance affects the prominence of the effect.",
        practicalExample: "Background vocals often use higher wet/dry ratios for delays (more effect), while lead vocals typically use lower ratios to maintain clarity.",
        difficulty: 2,
        image: "wet-dry-mix",
        category: "parameters"
      },
      {
        id: "i4",
        question: "What happens when you synchronize Delay Time to the tempo?",
        answer: "When delay time is synchronized to the tempo of a song, the echoes will repeat in time with the music, often set to specific note values (quarter notes, eighth notes, etc.).",
        furtherLearning: "Try setting up delays at different note values (quarter note, dotted eighth note) to create rhythmic patterns that complement the music.",
        practicalExample: "The Edge (U2's guitarist) often uses tempo-synchronized delay to create rhythmic patterns that become integral parts of the song.",
        difficulty: 2,
        image: "tempo-sync",
        category: "techniques"
      }
    ],
    advanced: [
      {
        id: "a1",
        question: "What is Self-Oscillation in delay effects?",
        answer: "Self-Oscillation occurs when feedback is set so high that the delayed signal continues to build upon itself indefinitely, eventually creating a continuous tone or sound that persists even after the input stops.",
        furtherLearning: "Carefully experiment with raising feedback to just below the self-oscillation point for dramatic, long-lasting echoes without runaway feedback.",
        practicalExample: "Some experimental musicians purposely cause delay units to self-oscillate and then manipulate the resulting tones for creative sound design.",
        difficulty: 3,
        image: "self-oscillation",
        category: "advanced"
      },
      {
        id: "a2",
        question: "What is a Multi-Tap Delay?",
        answer: "A Multi-Tap Delay creates multiple echoes at different time intervals from a single input, allowing for complex echo patterns. Each 'tap' can have its own delay time, level, and pan position.",
        furtherLearning: "Create a multi-tap delay with taps at different rhythmic intervals (e.g., eighth note, dotted eighth, quarter note) to create complex rhythmic patterns.",
        practicalExample: "Used heavily in electronic music to create complex rhythmic echoes that evolve throughout a section or track.",
        difficulty: 3,
        image: "multi-tap",
        category: "types"
      },
      {
        id: "a3",
        question: "How does modulation affect delay?",
        answer: "Adding modulation (like chorus or vibrato) to a delay effect causes the delay time to fluctuate slightly, creating more organic-sounding echoes with subtle pitch and timing variations.",
        furtherLearning: "Compare a standard digital delay to one with light modulation to hear how it adds character and analog-like qualities to the echoes.",
        practicalExample: "Tape echo units naturally had modulation due to mechanical imperfections; modern delay plugins often include modulation to emulate this warmth.",
        difficulty: 3,
        image: "modulated-delay",
        category: "advanced"
      },
      {
        id: "a4",
        question: "What is Pre-Delay in reverb and delay combinations?",
        answer: "Pre-Delay is the time between the original sound and the first reflections of reverb. When combining delay and reverb, the order and timing create different spatial impressions and depths.",
        furtherLearning: "Try placing delay before reverb vs. reverb before delay in your signal chain to hear how it affects the perceived space and clarity.",
        practicalExample: "Film sound designers use carefully crafted combinations of delay and reverb to create realistic spatial environments for different scenes.",
        difficulty: 3,
        image: "pre-delay",
        category: "advanced"
      },
      {
        id: "a5",
        question: "How do you calculate tempo-synced delay times for A-Level coursework? (Component 4 Essential)",
        answer: "Formula: Delay Time (ms) = 60,000 ÷ BPM × Note Value. Essential for Component 4: Quarter note at 120 BPM = 60,000 ÷ 120 × 1 = 500ms. Dotted eighth = 500ms × 1.5 = 750ms.",
        furtherLearning: "In Ableton Echo, use 'Sync' mode and select note values. Practice calculating: eighth notes at 100 BPM, dotted quarters at 80 BPM. Essential exam skill.",
        practicalExample: "A-Level Assessment: Must demonstrate understanding of musical time relationships. Used in U2-style guitar parts, electronic music, and dub production for coursework projects.",
        difficulty: 3,
        image: "tempo-sync",
        category: "advanced"
      },
      {
        id: "a6",
        question: "What is ADT (Automatic Double Tracking) and why is it important for A-Level study? (Edexcel 1.12e)",
        answer: "ADT uses very short delays (5-40ms) with modulation to simulate double-tracking without re-recording. A-Level significance: Pioneered at Abbey Road Studios, demonstrates understanding of psychoacoustics and creative vs. corrective applications.",
        furtherLearning: "Ableton Live: Use Echo with very short delay times, add slight modulation. Compare to actual double-tracking - essential technique for Component 4 practical work.",
        practicalExample: "Component 4 Context: Beatles vocals, modern pop production. Shows technical knowledge of studio techniques and their digital emulation - key assessment area for advanced students.",
        difficulty: 3,
        image: "adt",
        category: "advanced"
      },
      {
        id: "a7",
        question: "How does the Haas Effect relate to slapback delay in A-Level production work?",
        answer: "Haas Effect: Sounds within 20-40ms are perceived as one thicker sound, not separate echoes. A-Level application: Slapback delays (40-120ms) sit just above this fusion zone - heard as a distinct, tight echo that adds space, rather than fusing into one sound.",
        furtherLearning: "Test the boundary: Record vocals, apply delays from 20ms to 80ms. Note when it transitions from thickening to distinct echo - critical for Component 4 understanding.",
        practicalExample: "Assessment Essential: Demonstrates psychoacoustic knowledge. Used correctively to enhance vocals without obvious delay artifacts. Shows advanced understanding of perception vs. technical parameters.",
        difficulty: 3,
        image: "haas-effect",
        category: "advanced"
      }
    ]
  };

  // SVG representations for delay/echo concepts
  const illustrations = {
    "delay-time": (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" className="w-full h-32" role="img" aria-label="Diagram showing original signal and a delayed copy on a timeline, illustrating delay time in milliseconds">
        <rect x="0" y="0" width="200" height="100" fill="#f0f9ff" />
        {/* Timeline */}
        <line x1="20" y1="70" x2="180" y2="70" stroke="#64748b" strokeWidth="1" />
        <text x="90" y="90" fill="#64748b" fontSize="8">Time</text>
        
        {/* Original sound */}
        <path d="M40,70 L40,30 L50,30 L50,70" stroke="#DCC892" strokeWidth="2" fill="none" />
        <text x="30" y="20" fill="#DCC892" fontSize="8">Original Sound</text>
        
        {/* Delay time arrow */}
        <line x1="50" y1="80" x2="100" y2="80" stroke="#ef4444" strokeWidth="1" />
        <polygon points="100,80 95,77 95,83" fill="#ef4444" />
        <text x="65" y="88" fill="#ef4444" fontSize="8">Delay Time</text>
        
        {/* Delayed sound */}
        <path d="M100,70 L100,40 L110,40 L110,70" stroke="#ef4444" strokeWidth="2" fill="none" />
        <text x="90" y="30" fill="#ef4444" fontSize="8">Delayed Sound</text>
      </svg>
    ),
    "dry-signal": (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" className="w-full h-32" role="img" aria-label="Signal path diagram showing the unprocessed dry signal passing directly to the output without any delay effect">
        <rect x="0" y="0" width="200" height="100" fill="#f0f9ff" />
        
        {/* Signal flow */}
        <line x1="40" y1="50" x2="160" y2="50" stroke="#64748b" strokeWidth="1" strokeDasharray="2,1" />
        <polygon points="160,50 155,47 155,53" fill="#64748b" />
        
        {/* Input */}
        <rect x="20" y="40" width="20" height="20" fill="#DCC892" rx="2" />
        <text x="26" y="54" fill="white" fontSize="8">In</text>
        
        {/* Output */}
        <rect x="160" y="40" width="20" height="20" fill="#DCC892" rx="2" />
        <text x="164" y="54" fill="white" fontSize="8">Out</text>
        
        {/* Direct path (no effects) */}
        <path d="M40,50 L160,50" stroke="#DCC892" strokeWidth="3" fill="none" />
        <text x="85" y="40" fill="#DCC892" fontSize="10" fontWeight="bold">DRY SIGNAL</text>
        <text x="85" y="65" fill="#DCC892" fontSize="7">(Unprocessed Audio)</text>
      </svg>
    ),
    "wet-signal": (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" className="w-full h-32" role="img" aria-label="Signal path diagram showing the processed wet signal after passing through the delay effect block">
        <rect x="0" y="0" width="200" height="100" fill="#f0f9ff" />
        
        {/* Signal flow */}
        <line x1="40" y1="50" x2="160" y2="50" stroke="#64748b" strokeWidth="1" strokeDasharray="2,1" />
        <polygon points="160,50 155,47 155,53" fill="#64748b" />
        
        {/* Input */}
        <rect x="20" y="40" width="20" height="20" fill="#DCC892" rx="2" />
        <text x="26" y="54" fill="white" fontSize="8">In</text>
        
        {/* Effect unit */}
        <rect x="80" y="30" width="40" height="40" fill="#ef4444" rx="4" />
        <text x="88" y="50" fill="white" fontSize="7">EFFECT</text>
        <text x="88" y="60" fill="white" fontSize="6">PROCESSOR</text>
        
        {/* Output */}
        <rect x="160" y="40" width="20" height="20" fill="#ef4444" rx="2" />
        <text x="164" y="54" fill="white" fontSize="8">Out</text>
        
        {/* Effect path */}
        <path d="M40,50 L80,50" stroke="#DCC892" strokeWidth="2" fill="none" />
        <path d="M120,50 L160,50" stroke="#ef4444" strokeWidth="3" fill="none" />
        <text x="130" y="40" fill="#ef4444" fontSize="10" fontWeight="bold">WET</text>
        <text x="120" y="70" fill="#ef4444" fontSize="7">(Processed Audio)</text>
      </svg>
    ),
    "echo": (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" className="w-full h-32" role="img" aria-label="Timeline showing an original sound followed by one or more distinct echo repetitions at longer delay times">
        <rect x="0" y="0" width="200" height="100" fill="#f0f9ff" />
        
        {/* Timeline */}
        <line x1="20" y1="70" x2="180" y2="70" stroke="#64748b" strokeWidth="1" />
        <text x="90" y="90" fill="#64748b" fontSize="8">Time</text>
        
        {/* Original sound */}
        <rect x="30" y="30" width="15" height="40" fill="#DCC892" />
        <text x="30" y="20" fill="#DCC892" fontSize="8">Original</text>
        
        {/* Echoes with decreasing amplitude */}
        <rect x="70" y="40" width="15" height="30" fill="#ef4444" fillOpacity="0.8" />
        <rect x="110" y="45" width="15" height="25" fill="#ef4444" fillOpacity="0.6" />
        <rect x="150" y="50" width="15" height="20" fill="#ef4444" fillOpacity="0.4" />
        
        <text x="70" y="35" fill="#ef4444" fontSize="8">Echo 1</text>
        <text x="110" y="40" fill="#ef4444" fontSize="8">Echo 2</text>
        <text x="150" y="45" fill="#ef4444" fontSize="8">Echo 3</text>
        
        {/* Echo times */}
        <line x1="45" y1="75" x2="70" y2="75" stroke="#64748b" strokeWidth="1" strokeDasharray="2,1" />
        <line x1="85" y1="75" x2="110" y2="75" stroke="#64748b" strokeWidth="1" strokeDasharray="2,1" />
        <line x1="125" y1="75" x2="150" y2="75" stroke="#64748b" strokeWidth="1" strokeDasharray="2,1" />
      </svg>
    ),
    "feedback": (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" className="w-full h-32" role="img" aria-label="Signal flow diagram showing the delay feedback loop: delayed output fed back into the input, creating repeating echoes that decay over time">
        <rect x="0" y="0" width="200" height="100" fill="#f0f9ff" />
        
        {/* Input and output */}
        <rect x="20" y="40" width="20" height="20" fill="#DCC892" rx="2" />
        <text x="26" y="54" fill="white" fontSize="8">In</text>
        
        <rect x="160" y="40" width="20" height="20" fill="#DCC892" rx="2" />
        <text x="164" y="54" fill="white" fontSize="8">Out</text>
        
        {/* Delay unit */}
        <rect x="80" y="30" width="40" height="40" fill="#ef4444" rx="4" />
        <text x="86" y="50" fill="white" fontSize="8">DELAY</text>
        <text x="88" y="60" fill="white" fontSize="6">UNIT</text>
        
        {/* Signal paths */}
        {/* Input to delay */}
        <path d="M40,50 L80,50" stroke="#DCC892" strokeWidth="2" fill="none" />
        
        {/* Delay to output */}
        <path d="M120,50 L160,50" stroke="#ef4444" strokeWidth="2" fill="none" />
        
        {/* Feedback loop */}
        <path d="M120,50 C130,50 130,20 100,20 C70,20 70,30 80,30" 
              stroke="#10b981" 
              strokeWidth="2" 
              fill="none" 
              strokeDasharray="4,2" />
        <polygon points="80,30 84,25 86,33" fill="#10b981" />
        
        <text x="95" y="15" fill="#10b981" fontSize="8">Feedback Path</text>
      </svg>
    ),
    "delay-vs-echo": (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" className="w-full h-32" role="img" aria-label="Side-by-side comparison showing short delay (thickening effect) versus longer delay producing distinct echo repeats">
        <rect x="0" y="0" width="200" height="100" fill="#f0f9ff" />
        
        {/* Timeline */}
        <line x1="10" y1="80" x2="190" y2="80" stroke="#64748b" strokeWidth="1" />
        <text x="90" y="95" fill="#64748b" fontSize="8">Time</text>
        
        {/* Short delay (doubling effect) */}
        <text x="20" y="20" fill="#DCC892" fontSize="8">Short Delay (&lt;50ms)</text>
        <rect x="20" y="30" width="10" height="20" fill="#DCC892" />
        <rect x="32" y="30" width="10" height="20" fill="#DCC892" fillOpacity="0.7" />
        <path d="M20,60 Q31,40 42,60" stroke="#DCC892" strokeWidth="1" fill="none" />
        <text x="15" y="70" fill="#DCC892" fontSize="6">Perceived as one sound</text>
        
        {/* Echo (distinct repetitions) */}
        <text x="120" y="20" fill="#ef4444" fontSize="8">Echo (&gt;50ms)</text>
        <rect x="120" y="30" width="10" height="20" fill="#ef4444" />
        <rect x="150" y="30" width="10" height="20" fill="#ef4444" fillOpacity="0.7" />
        <rect x="180" y="30" width="10" height="20" fill="#ef4444" fillOpacity="0.4" />
        <path d="M120,60 L130,60 M150,60 L160,60 M180,60 L190,60" stroke="#ef4444" strokeWidth="1" fill="none" />
        <text x="125" y="70" fill="#ef4444" fontSize="6">Perceived as separate sounds</text>
      </svg>
    ),
    "ping-pong": (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" className="w-full h-32" role="img" aria-label="Stereo diagram showing ping-pong delay: echoes alternating left and right between speaker channels">
        <rect x="0" y="0" width="200" height="100" fill="#f0f9ff" />
        
        {/* Stereo field indicator */}
        <text x="20" y="20" fill="#64748b" fontSize="7">Left Channel</text>
        <text x="150" y="20" fill="#64748b" fontSize="7">Right Channel</text>
        <line x1="10" y1="25" x2="190" y2="25" stroke="#64748b" strokeWidth="1" strokeDasharray="1,1" />
        
        {/* Original sound (center) */}
        <rect x="90" y="30" width="20" height="30" fill="#DCC892" />
        <text x="93" y="50" fill="white" fontSize="6">Orig</text>
        
        {/* Ping-pong echoes */}
        <rect x="30" y="40" width="15" height="20" fill="#ef4444" fillOpacity="0.7" />
        <text x="32" y="53" fill="white" fontSize="6">1</text>
        
        <rect x="150" y="40" width="15" height="20" fill="#ef4444" fillOpacity="0.5" />
        <text x="152" y="53" fill="white" fontSize="6">2</text>
        
        <rect x="50" y="50" width="15" height="15" fill="#ef4444" fillOpacity="0.3" />
        <text x="52" y="59" fill="white" fontSize="6">3</text>
        
        <rect x="130" y="50" width="15" height="15" fill="#ef4444" fillOpacity="0.2" />
        <text x="132" y="59" fill="white" fontSize="6">4</text>
        
        {/* Arrows showing bounce pattern */}
        <path d="M100,65 L40,65 M40,70 L155,70 M155,75 L55,75" 
              stroke="#10b981" 
              strokeWidth="1.5" 
              strokeDasharray="2,1" 
              fill="none" />
        <polygon points="40,65 45,62 45,68" fill="#10b981" />
        <polygon points="155,70 150,67 150,73" fill="#10b981" />
        <polygon points="55,75 60,72 60,78" fill="#10b981" />
        
        <text x="75" y="90" fill="#10b981" fontSize="8">Ping-Pong Pattern</text>
      </svg>
    ),
    "wet-dry-mix": (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" className="w-full h-32" role="img" aria-label="Mixer diagram showing the blend between dry (unprocessed) and wet (delayed) signals to set the effect amount">
        <rect x="0" y="0" width="200" height="100" fill="#f0f9ff" />
        
        {/* Mixer visualization */}
        <rect x="80" y="50" width="40" height="30" rx="3" fill="#64748b" />
        <text x="92" y="68" fill="white" fontSize="8">MIX</text>
        
        {/* Dry signal path */}
        <path d="M20,40 L80,40" stroke="#DCC892" strokeWidth="3" fill="none" />
        <text x="35" y="35" fill="#DCC892" fontSize="8">Dry Signal</text>
        
        {/* Wet signal path */}
        <path d="M20,90 C40,90 60,90 80,90" stroke="#ef4444" strokeWidth="3" fill="none" />
        <text x="35" y="85" fill="#ef4444" fontSize="8">Wet Signal</text>
        
        {/* Output path */}
        <path d="M120,65 L180,65" stroke="#10b981" strokeWidth="3" fill="none" />
        <text x="140" y="60" fill="#10b981" fontSize="8">Mixed Output</text>
        
        {/* Mix slider */}
        <line x1="85" y1="40" x2="85" y2="90" stroke="white" strokeWidth="1" />
        <line x1="115" y1="40" x2="115" y2="90" stroke="white" strokeWidth="1" />
        <rect x="95" y="40" width="10" height="50" fill="white" fillOpacity="0.3" />
        <circle cx="100" cy="65" r="5" fill="white" />
        <text x="97" y="95" fill="white" fontSize="6">50/50</text>
      </svg>
    ),
    "tempo-sync": (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" className="w-full h-32" role="img" aria-label="Diagram showing delay times locked to musical note values (quarter-note, eighth-note) aligned with a tempo grid">
        <rect x="0" y="0" width="200" height="100" fill="#f0f9ff" />
        
        {/* Beat markers */}
        <line x1="20" y1="70" x2="20" y2="80" stroke="#64748b" strokeWidth="1" />
        <line x1="60" y1="70" x2="60" y2="80" stroke="#64748b" strokeWidth="1" />
        <line x1="100" y1="70" x2="100" y2="80" stroke="#64748b" strokeWidth="1" />
        <line x1="140" y1="70" x2="140" y2="80" stroke="#64748b" strokeWidth="1" />
        <line x1="180" y1="70" x2="180" y2="80" stroke="#64748b" strokeWidth="1" />
        
        <line x1="20" y1="75" x2="180" y2="75" stroke="#64748b" strokeWidth="1" />
        <text x="95" y="90" fill="#64748b" fontSize="8">Beat Divisions</text>
        
        {/* Original notes */}
        <rect x="20" y="50" width="10" height="20" fill="#DCC892" />
        <text x="20" y="45" fill="#DCC892" fontSize="8">Original</text>
        
        {/* Quarter note delay */}
        <rect x="60" y="50" width="10" height="20" fill="#ef4444" fillOpacity="0.7" />
        <text x="50" y="35" fill="#ef4444" fontSize="7">Quarter Note Delay</text>
        <path d="M30,60 C40,40 50,40 60,60" stroke="#ef4444" strokeWidth="1" strokeDasharray="2,1" fill="none" />
        
        {/* Eighth note delay */}
        <rect x="40" y="30" width="10" height="15" fill="#10b981" fillOpacity="0.7" />
        <text x="35" y="20" fill="#10b981" fontSize="7">Eighth Note</text>
        <path d="M30,55 C35,45 35,35 40,30" stroke="#10b981" strokeWidth="1" strokeDasharray="2,1" fill="none" />
      </svg>
    ),
    "self-oscillation": (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" className="w-full h-32" role="img" aria-label="Diagram showing delay self-oscillation: feedback above 100% causing repeats to grow indefinitely into a sustained tone">
        <rect x="0" y="0" width="200" height="100" fill="#f0f9ff" />
        
        {/* Timeline */}
        <line x1="20" y1="80" x2="180" y2="80" stroke="#64748b" strokeWidth="1" />
        <line x1="20" y1="20" x2="20" y2="80" stroke="#64748b" strokeWidth="1" />
        <text x="90" y="95" fill="#64748b" fontSize="8">Time</text>
        <text x="5" y="50" fill="#64748b" fontSize="8">Volume</text>
        
        {/* Original sound */}
        <rect x="30" y="60" width="10" height="20" fill="#DCC892" />
        <text x="25" y="55" fill="#DCC892" fontSize="6">Input</text>
        
        {/* Normal feedback (decaying) */}
        <path d="M50,70 L50,50 L55,50 L55,70 M70,70 L70,55 L75,55 L75,70 M90,70 L90,60 L95,60 L95,70" 
              stroke="#10b981" 
              strokeWidth="1.5" 
              fill="none" 
              strokeDasharray="3,1" />
        <text x="50" y="40" fill="#10b981" fontSize="6">Normal Feedback</text>
        
        {/* Self-oscillation */}
        <path d="M120,70 L120,30 L125,30 L125,70 M140,70 L140,30 L145,30 L145,70 M160,70 L160,30 L165,30 L165,70" 
              stroke="#ef4444" 
              strokeWidth="2" 
              fill="none" />
        <text x="120" y="20" fill="#ef4444" fontSize="7">Self-Oscillation</text>
        
        {/* Dividing line where input stops */}
        <line x1="110" y1="20" x2="110" y2="80" stroke="#64748b" strokeWidth="1" strokeDasharray="4,2" />
        <text x="105" y="90" fill="#64748b" fontSize="6">Input Stops</text>
      </svg>
    ),
    "multi-tap": (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" className="w-full h-32" role="img" aria-label="Timeline diagram showing multi-tap delay: several echoes at different delay times and volumes creating a rhythmic pattern">
        <rect x="0" y="0" width="200" height="100" fill="#f0f9ff" />
        
        {/* Timeline */}
        <line x1="20" y1="70" x2="180" y2="70" stroke="#64748b" strokeWidth="1" />
        <text x="90" y="90" fill="#64748b" fontSize="8">Time</text>
        
        {/* Original sound */}
        <rect x="30" y="40" width="10" height="30" fill="#DCC892" />
        <text x="27" y="35" fill="#DCC892" fontSize="7">Input</text>
        
        {/* Multiple delay taps with different amplitudes and positions */}
        <rect x="60" y="45" width="8" height="25" fill="#ef4444" fillOpacity="0.8" />
        <text x="60" y="40" fill="#ef4444" fontSize="6">Tap 1</text>
        
        <rect x="85" y="50" width="8" height="20" fill="#ef4444" fillOpacity="0.7" />
        <text x="85" y="45" fill="#ef4444" fontSize="6">Tap 2</text>
        
        <rect x="120" y="47" width="8" height="23" fill="#ef4444" fillOpacity="0.6" />
        <text x="120" y="42" fill="#ef4444" fontSize="6">Tap 3</text>
        
        <rect x="140" y="53" width="8" height="17" fill="#ef4444" fillOpacity="0.5" />
        <text x="140" y="48" fill="#ef4444" fontSize="6">Tap 4</text>
        
        <rect x="170" y="55" width="8" height="15" fill="#ef4444" fillOpacity="0.4" />
        <text x="170" y="50" fill="#ef4444" fontSize="6">Tap 5</text>
        
        {/* Connector lines */}
        <line x1="40" y1="55" x2="60" y2="55" stroke="#10b981" strokeWidth="1" strokeDasharray="2,1" />
        <line x1="40" y1="55" x2="85" y2="55" stroke="#10b981" strokeWidth="1" strokeDasharray="2,1" />
        <line x1="40" y1="55" x2="120" y2="55" stroke="#10b981" strokeWidth="1" strokeDasharray="2,1" />
        <line x1="40" y1="55" x2="140" y2="55" stroke="#10b981" strokeWidth="1" strokeDasharray="2,1" />
        <line x1="40" y1="55" x2="170" y2="55" stroke="#10b981" strokeWidth="1" strokeDasharray="2,1" />
      </svg>
    ),
    "modulated-delay": (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" className="w-full h-32" role="img" aria-label="Diagram showing modulated delay: LFO varying the delay time to create chorus or flanger effects">
        <rect x="0" y="0" width="200" height="100" fill="#f0f9ff" />
        
        {/* Standard delay vs modulated delay */}
        <line x1="20" y1="50" x2="180" y2="50" stroke="#64748b" strokeWidth="1" strokeDasharray="2,1" />
        <text x="20" y="20" fill="#64748b" fontSize="8">Standard vs Modulated Delay</text>
        
        {/* Standard delay (evenly spaced) */}
        <rect x="40" y="30" width="8" height="15" fill="#DCC892" />
        <rect x="80" y="30" width="8" height="15" fill="#DCC892" fillOpacity="0.7" />
        <rect x="120" y="30" width="8" height="15" fill="#DCC892" fillOpacity="0.5" />
        <rect x="160" y="30" width="8" height="15" fill="#DCC892" fillOpacity="0.3" />
        <text x="40" y="25" fill="#DCC892" fontSize="6">Standard Delay</text>
        
        {/* Modulated delay (slightly varying time and pitch) */}
        <rect x="38" y="70" width="8" height="15" fill="#ef4444" />
        <rect x="82" y="73" width="8" height="12" fill="#ef4444" fillOpacity="0.7" />
        <rect x="118" y="68" width="8" height="17" fill="#ef4444" fillOpacity="0.5" />
        <rect x="163" y="71" width="8" height="14" fill="#ef4444" fillOpacity="0.3" />
        <text x="38" y="90" fill="#ef4444" fontSize="6">Modulated Delay</text>
        
        {/* Modulation wave */}
        <path d="M20,85 Q30,80 40,85 Q50,90 60,85 Q70,80 80,85 Q90,90 100,85 Q110,80 120,85 Q130,90 140,85 Q150,80 160,85 Q170,90 180,85" 
              stroke="#10b981" 
              strokeWidth="1" 
              fill="none" 
              strokeDasharray="2,1" />
      </svg>
    ),
    "pre-delay": (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" className="w-full h-32" role="img" aria-label="Signal chain diagram showing pre-delay: a short delay inserted before the reverb to separate direct sound from the reverb tail">
        <rect x="0" y="0" width="200" height="100" fill="#f0f9ff" />
        
        {/* Timeline */}
        <line x1="20" y1="80" x2="180" y2="80" stroke="#64748b" strokeWidth="1" />
        <text x="90" y="95" fill="#64748b" fontSize="8">Time</text>
        
        {/* Direct sound */}
        <rect x="30" y="30" width="10" height="50" fill="#DCC892" />
        <text x="28" y="25" fill="#DCC892" fontSize="7">Direct</text>
        
        {/* Pre-delay gap */}
        <line x1="40" y1="55" x2="70" y2="55" stroke="#ef4444" strokeWidth="1" strokeDasharray="2,1" />
        <text x="45" y="50" fill="#ef4444" fontSize="6">Pre-delay</text>
        
        {/* Early reflections (initial reverb) */}
        <rect x="70" y="60" width="5" height="20" fill="#10b981" fillOpacity="0.9" />
        <rect x="77" y="63" width="5" height="17" fill="#10b981" fillOpacity="0.8" />
        <rect x="84" y="65" width="5" height="15" fill="#10b981" fillOpacity="0.7" />
        <rect x="91" y="67" width="5" height="13" fill="#10b981" fillOpacity="0.6" />
        <text x="70" y="55" fill="#10b981" fontSize="6">Early Reflections</text>
        
        {/* Late reverb */}
        <path d="M100,80 C105,65 110,60 115,65 C120,70 125,65 130,70 C135,75 140,65 145,70 C150,75 155,70 160,75 C165,80 170,70 175,80" 
              fill="#10b981" 
              fillOpacity="0.3" />
        <text x="120" y="55" fill="#10b981" fontSize="6">Late Reverb</text>
      </svg>
    )
  };

  const [difficulty, setDifficulty] = useState("basic");
  // Initial render must match server output — no Math.random on first paint.
  // Client-side shuffle happens in the mount effect below.
  const [currentCards, setCurrentCards] = useState(allCards.basic);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [progress, setProgress] = useState({});
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showSummary, setShowSummary] = useState(false);
  const [studyMode, setStudyMode] = useState("learn");
  const [masteryScore, setMasteryScore] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [lastRating, setLastRating] = useState(null);
  const [reviewHistory, setReviewHistory] = useState([]);
  const [copyStatus, setCopyStatus] = useState(null); // 'notes' | 'explain' | 'quiz' | 'exam' | null
  const [aiMenuOpen, setAiMenuOpen] = useState(false);
  const [learnMode, setLearnMode] = useState(false);
  const aiMenuRef = useRef(null);
  const aiButtonRef = useRef(null);
  const copyResetRef = useRef(null);

  // Client-only: shuffle the initial deck + load persisted progress.
  // Deferring the shuffle avoids an SSR/client hydration mismatch — the first
  // paint on both server and client uses the unshuffled deck order.
  useEffect(() => {
    setCurrentCards(prev => shuffleArray(prev));
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setProgress(JSON.parse(stored));
    } catch (e) {
      // ignore (private mode, quota, etc.)
    }
    setProgressLoaded(true);
  }, []);

  // Persist progress on change (skip the first render before load completes)
  useEffect(() => {
    if (!progressLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (e) {
      // ignore
    }
  }, [progress, progressLoaded]);

  // Derive the binary confidence map the existing UI uses.
  // box >= 3 = mastered (true), any review but box < 3 = needs review (false),
  // never reviewed = absent (undefined)
  const confidence = useMemo(() => {
    const c = {};
    for (const [id, p] of Object.entries(progress)) {
      if (p?.lastReviewed) c[id] = (p.box || 1) >= 3;
    }
    return c;
  }, [progress]);
  
  // Build and shuffle the deck whenever difficulty tier changes
  useEffect(() => {
    let newCards = [];
    if (difficulty === "all") {
      newCards = [...allCards.basic, ...allCards.intermediate, ...allCards.advanced];
    } else {
      newCards = [...allCards[difficulty]];
    }
    setCurrentCards(shuffleArray(newCards));
    setCurrentIndex(0);
    setShowAnswer(false);
    setShowHint(false);
    setShowSummary(false);
  }, [difficulty]);
  
  // Calculate mastery score whenever confidence changes — filter to current tier only
  useEffect(() => {
    if (currentCards.length > 0) {
      const totalCards = currentCards.length;
      const masteredCards = currentCards.filter(c => confidence[c.id] === true).length;
      setMasteryScore((masteredCards / totalCards) * 100);
    }
  }, [confidence, currentCards]);

  const handleNext = () => {
    if (currentIndex < currentCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowAnswer(false);
      setShowHint(false);
    } else if (Object.keys(confidence).length > 0) {
      setShowSummary(true);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowAnswer(false);
      setShowHint(false);
    }
  };

  const toggleAnswer = () => {
    setShowAnswer(!showAnswer);
    
    // Add to review history when first revealing an answer
    if (!showAnswer && reviewHistory.findIndex(h => h.cardId === currentCards[currentIndex].id) === -1) {
      setReviewHistory([
        ...reviewHistory,
        { 
          cardId: currentCards[currentIndex].id,
          question: currentCards[currentIndex].question,
          timestamp: new Date().toISOString(),
          timesReviewed: 1
        }
      ]);
    }
  };

  const resetDeck = () => {
    // Reshuffle the current deck but keep persisted progress — "reset" means
    // "start this deck over", not "erase what I've learned".
    setCurrentCards(prev => shuffleArray(prev));
    setCurrentIndex(0);
    setShowAnswer(false);
    setShowSummary(false);
    setShowHint(false);
  };

  const toggleHint = () => {
    setShowHint(!showHint);
  };

  // Leitner-box spaced repetition. Each card lives in a box (1–5). The rating
  // controls how the box moves: Again → back to box 1, Hard → stay, Good →
  // promote one box (max 5). Progress persists to localStorage so students
  // return to their prior state across sessions.
  const rateCard = (rating) => {
    const card = currentCards[currentIndex];
    if (!card) return;
    setProgress(prev => {
      const existing = prev[card.id] || { box: 1, history: [] };
      const prevBox = existing.box || 1;
      let newBox = prevBox;
      if (rating === 'again') newBox = 1;
      else if (rating === 'hard') newBox = prevBox;
      else if (rating === 'good') newBox = Math.min(5, prevBox + 1);
      return {
        ...prev,
        [card.id]: {
          box: newBox,
          lastReviewed: new Date().toISOString(),
          history: [...(existing.history || []).slice(-9), { rating, ts: Date.now() }],
        },
      };
    });
    // Brief visual confirmation on the back face before advancing.
    setLastRating(rating);
    setTimeout(() => {
      setLastRating(null);
      handleNext();
    }, 350);
  };

  // "Study Weak Cards" pulls across every tier, filtered to cards that are
  // unseen or still in box 1–2. Shuffles and restarts the session.
  const studyWeakCards = () => {
    const weakPool = [
      ...allCards.basic,
      ...allCards.intermediate,
      ...allCards.advanced,
    ].filter(c => {
      const p = progress[c.id];
      return !p?.lastReviewed || (p.box || 1) < 3;
    });
    if (weakPool.length === 0) return;
    setCurrentCards(shuffleArray(weakPool));
    setCurrentIndex(0);
    setShowAnswer(false);
    setShowHint(false);
    setShowSummary(false);
  };

  // Keyboard shortcuts: Space flips the card, arrows navigate, 1/2/3 rate
  // when the answer is visible.
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (showSummary || showInstructions) return;
      if (e.code === 'Space') {
        e.preventDefault();
        toggleAnswer();
        return;
      }
      if (e.key === 'ArrowRight') { handleNext(); return; }
      if (e.key === 'ArrowLeft') { handlePrevious(); return; }
      if (showAnswer) {
        if (e.key === '1') rateCard('again');
        else if (e.key === '2') rateCard('hard');
        else if (e.key === '3') rateCard('good');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAnswer, showSummary, showInstructions, currentIndex, currentCards]);

  // Load tutor-mode preference (shared across all Copy-for-AI resources)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LEARN_MODE_STORAGE_KEY);
      if (stored === 'true') setLearnMode(true);
    } catch (e) { /* ignore */ }
  }, []);

  // Click-outside closes the Ask-AI popover
  useEffect(() => {
    if (!aiMenuOpen) return;
    const onDoc = (e) => {
      if (
        aiMenuRef.current && !aiMenuRef.current.contains(e.target) &&
        aiButtonRef.current && !aiButtonRef.current.contains(e.target)
      ) {
        setAiMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [aiMenuOpen]);

  const toggleLearnMode = () => {
    setLearnMode(prev => {
      const next = !prev;
      try { localStorage.setItem(LEARN_MODE_STORAGE_KEY, String(next)); } catch (e) { /* ignore */ }
      return next;
    });
  };

  // Copy the current card. 'notes' mode ships rich HTML + clean plain text
  // so OneNote / Word / Apple Notes render it as formatted content rather
  // than raw markdown. AI modes ship markdown text — LLMs prefer that.
  const copyCurrentCard = async (mode) => {
    const card = currentCards[currentIndex];
    if (!card) return;
    const topicRef = '1.12 Delay';

    const markAsCopied = () => {
      setCopyStatus(mode);
      setAiMenuOpen(false);
      clearTimeout(copyResetRef.current);
      copyResetRef.current = setTimeout(() => setCopyStatus(null), 2200);
    };

    // Notes mode: try rich HTML via ClipboardItem, fall back to plain text.
    if (mode === 'notes') {
      const html = buildFlashcardCopyHtml(card, { topicRef });
      const text = buildFlashcardCopyText(card, { topicRef });
      try {
        if (typeof window !== 'undefined' && typeof window.ClipboardItem !== 'undefined') {
          const item = new window.ClipboardItem({
            'text/html': new Blob([html], { type: 'text/html' }),
            'text/plain': new Blob([text], { type: 'text/plain' }),
          });
          await navigator.clipboard.write([item]);
          markAsCopied();
          return;
        }
      } catch (e) {
        // fall through to plain-text fallback
      }
      try {
        await navigator.clipboard.writeText(text);
        markAsCopied();
      } catch (e) {
        console.warn('Clipboard unavailable:', e);
      }
      return;
    }

    // AI modes: markdown works best when pasted into an LLM chat.
    const markdown = buildFlashcardCopyMarkdown(card, { mode, learnMode, topicRef });
    try {
      await navigator.clipboard.writeText(markdown);
      markAsCopied();
    } catch (e) {
      console.warn('Clipboard unavailable:', e);
    }
  };

  const needsReview = currentCards.filter(card => confidence[card.id] === false);
  const mastered = currentCards.filter(card => confidence[card.id] === true);
  const notReviewed = currentCards.filter(card => confidence[card.id] === undefined);

  // Group cards by category for the summary
  const getCardsByCategory = (cards) => {
    const categories = {};
    cards.forEach(card => {
      if (!categories[card.category]) {
        categories[card.category] = [];
      }
      categories[card.category].push(card);
    });
    return categories;
  };

  const masteredByCategory = getCardsByCategory(mastered);
  const needsReviewByCategory = getCardsByCategory(needsReview);

  const currentCard = currentCards[currentIndex];
  const difficultyLabel = currentCard
    ? ['', 'Foundation', 'Standard', 'Advanced'][currentCard.difficulty] || ''
    : '';
  const weakCount = useMemo(() => [
    ...allCards.basic,
    ...allCards.intermediate,
    ...allCards.advanced,
  ].filter(c => {
    const p = progress[c.id];
    return !p?.lastReviewed || (p.box || 1) < 3;
  }).length, [progress]);

  return (
    <div className="dfc-root">
      <style>{DESIGN_TOKENS_CSS}</style>
      <div className="dfc-container">

        <header className="dfc-header">
          <div>
            <div className="dfc-eyebrow">Pearson Edexcel · Component 4 · Topic 1.12</div>
            <h1 className="dfc-title">Delay Effects</h1>
            <p className="dfc-subtitle">
              Flashcards covering delay parameters, creative applications, and corrective techniques.
            </p>
          </div>
          <div className="dfc-keyboard" aria-label="Keyboard shortcuts">
            <div className="dfc-keyboard-title">Keyboard</div>
            <div><span className="dfc-kbd">Space</span> flip</div>
            <div><span className="dfc-kbd">←</span> <span className="dfc-kbd">→</span> prev / next</div>
            <div><span className="dfc-kbd">1</span> <span className="dfc-kbd">2</span> <span className="dfc-kbd">3</span> rate</div>
          </div>
        </header>

        {showSummary ? (
          <>
            <h2 className="dfc-summary-title">Delay &amp; Echo — Summary</h2>

            <div className="dfc-meter" aria-label={`${Math.round(masteryScore)}% ready`}>
              <div className="dfc-meter-fill" style={{ width: `${masteryScore}%` }} />
            </div>

            <div className="dfc-stat-grid">
              <div className="dfc-stat">
                <div className="dfc-stat-label">Ready</div>
                <div className="dfc-stat-value" data-tone="success">{mastered.length}</div>
              </div>
              <div className="dfc-stat">
                <div className="dfc-stat-label">Needs review</div>
                <div className="dfc-stat-value" data-tone="danger">{needsReview.length}</div>
              </div>
              <div className="dfc-stat">
                <div className="dfc-stat-label">Not seen</div>
                <div className="dfc-stat-value">{notReviewed.length}</div>
              </div>
            </div>

            {Object.keys(needsReviewByCategory).length > 0 ? (
              <section className="dfc-summary-section">
                <h3>To revise</h3>
                {Object.entries(needsReviewByCategory).map(([category, cards], idx) => (
                  <div key={idx} className="dfc-summary-subgroup">
                    <div className="dfc-control-label" style={{ marginBottom: '0.45rem' }}>
                      {category} — {cards.length} card{cards.length === 1 ? '' : 's'}
                    </div>
                    {cards.map((card, cardIdx) => (
                      <div key={cardIdx} className="dfc-summary-item" data-tone="needs-review">
                        <p style={{ fontWeight: 500 }}>{card.question}</p>
                        <p>{card.practicalExample}</p>
                      </div>
                    ))}
                  </div>
                ))}
              </section>
            ) : (
              <section className="dfc-summary-section">
                <div className="dfc-summary-item">
                  <p>No cards currently flagged for review.{notReviewed.length > 0 ? ` ${notReviewed.length} card${notReviewed.length === 1 ? '' : 's'} remain unseen at this level.` : ''}</p>
                </div>
              </section>
            )}

            {Object.keys(masteredByCategory).length > 0 && (
              <section className="dfc-summary-section">
                <h3>Ready</h3>
                {Object.entries(masteredByCategory).map(([category, cards], idx) => (
                  <div key={idx} className="dfc-summary-subgroup">
                    <div className="dfc-control-label" style={{ marginBottom: '0.45rem' }}>
                      {category} — {cards.length} card{cards.length === 1 ? '' : 's'}
                    </div>
                    {cards.map((card, cardIdx) => (
                      <div key={cardIdx} className="dfc-summary-item" data-tone="mastered">
                        <p style={{ fontWeight: 500 }}>{card.question}</p>
                        <p>{card.furtherLearning}</p>
                      </div>
                    ))}
                  </div>
                ))}
              </section>
            )}

            <div className="dfc-summary-actions">
              {weakCount > 0 && (
                <button type="button" className="dfc-btn dfc-btn-primary" onClick={studyWeakCards}>
                  Study weak cards ({weakCount})
                </button>
              )}
              <button type="button" className="dfc-btn" onClick={resetDeck}>Study this deck again</button>
              <button type="button"
                className="dfc-btn"
                onClick={() => {
                  setDifficulty(difficulty === "basic" ? "intermediate" : difficulty === "intermediate" ? "advanced" : "basic");
                  setShowSummary(false);
                }}
              >
                {difficulty === "advanced" ? "Try Foundation" : `Try ${difficulty === "basic" ? "Standard" : "Advanced"}`}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="dfc-controls">
              <div className="dfc-control-group">
                <span className="dfc-control-label">Mode</span>
                <div className="dfc-segmented" role="tablist" aria-label="Study mode">
                  <button type="button" role="tab" data-active={studyMode === 'learn'} onClick={() => setStudyMode('learn')}>Learn</button>
                  <button type="button" role="tab" data-active={studyMode === 'test'} onClick={() => setStudyMode('test')}>Assessment prep</button>
                </div>
              </div>
              <div className="dfc-control-group">
                <span className="dfc-control-label">Level</span>
                <div className="dfc-segmented" role="tablist" aria-label="Difficulty">
                  <button type="button" role="tab" data-active={difficulty === 'basic'} onClick={() => setDifficulty('basic')}>Foundation</button>
                  <button type="button" role="tab" data-active={difficulty === 'intermediate'} onClick={() => setDifficulty('intermediate')}>Standard</button>
                  <button type="button" role="tab" data-active={difficulty === 'advanced'} onClick={() => setDifficulty('advanced')}>Advanced</button>
                  <button type="button" role="tab" data-active={difficulty === 'all'} onClick={() => setDifficulty('all')}>All</button>
                </div>
              </div>
            </div>

            {showInstructions && (
              <div className="dfc-instructions">
                <h3>How to use this deck</h3>
                <div className="dfc-instructions-grid">
                  <div>
                    <h4>Working through the cards</h4>
                    <ol>
                      <li>Read the question and try to recall the answer before flipping.</li>
                      <li>Use the diagram only after you have attempted an answer.</li>
                      <li>Rate yourself honestly &mdash; the card schedules itself accordingly.</li>
                      <li>Your progress is saved locally between sessions.</li>
                    </ol>
                  </div>
                  <div>
                    <h4>Specification coverage</h4>
                    <ul>
                      <li>Foundation &mdash; core parameters and terminology.</li>
                      <li>Standard &mdash; A-Level expected content for Component 4.</li>
                      <li>Advanced &mdash; extension material for higher-band responses.</li>
                      <li>All cards link to Ableton Live practical applications.</li>
                    </ul>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" className="dfc-btn dfc-btn-primary" onClick={() => setShowInstructions(false)}>Begin</button>
                  <button type="button" className="dfc-btn dfc-btn-ghost" onClick={() => setShowInstructions(false)}>Skip</button>
                </div>
              </div>
            )}

            <div className="dfc-progress">
              <div className="dfc-progress-dots">
                {currentCards.map((card, idx) => {
                  let state = 'untouched';
                  if (confidence[card.id] === true) state = 'mastered';
                  else if (confidence[card.id] === false) state = 'needs-review';
                  else if (idx === currentIndex) state = 'current';
                  return <div key={card.id} className="dfc-dot" data-state={state} />;
                })}
              </div>
              <div className="dfc-progress-meta">
                <span>Card {currentIndex + 1} of {currentCards.length}</span>
                <span>Mastered: {Object.values(confidence).filter(Boolean).length} of {currentCards.length}</span>
                <span>{currentCard?.category}</span>
              </div>
            </div>

            <div
              className="dfc-card-flip"
              data-revealed={showAnswer}
              data-last-rating={lastRating || undefined}
              key={currentCard?.id || currentIndex}
            >
              <div className="dfc-card-flip-inner">
                {/* Front — question */}
                <div
                  className="dfc-card-face dfc-card-face-front"
                  aria-hidden={showAnswer}
                >
                  <div className="dfc-card-head">
                    <span>{difficultyLabel}</span>
                    <button type="button"
                      className="dfc-btn dfc-btn-ghost"
                      onClick={toggleHint}
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                    >
                      {showHint ? 'Hide diagram' : 'Show diagram'}
                    </button>
                  </div>
                  {currentCard && (
                    <>
                      <p
                        className="dfc-card-question"
                        onClick={toggleAnswer}
                        title="Click to reveal the answer"
                      >
                        {currentCard.question}
                      </p>
                      {showHint && (
                        <div className="dfc-card-diagram">
                          {illustrations[currentCard.image]}
                        </div>
                      )}
                      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                        <button type="button" className="dfc-btn dfc-btn-primary" onClick={toggleAnswer}>
                          {studyMode === 'learn' ? 'Show explanation' : 'Show answer'}
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Back — answer */}
                <div
                  className="dfc-card-face dfc-card-face-back"
                  aria-hidden={!showAnswer}
                >
                  <div className="dfc-card-head">
                    <span>{difficultyLabel}</span>
                    <span>Answer</span>
                  </div>
                  {currentCard && (
                    <>
                      <p className="dfc-card-answer">{currentCard.answer}</p>
                      <div className="dfc-card-diagram">
                        {illustrations[currentCard.image]}
                      </div>
                      {studyMode === 'learn' && (
                        <>
                          <div className="dfc-explain-block">
                            <span className="dfc-explain-label">Practical example</span>
                            {currentCard.practicalExample}
                          </div>
                          <div className="dfc-explain-block">
                            <span className="dfc-explain-label">Try this</span>
                            {currentCard.furtherLearning}
                          </div>
                        </>
                      )}
                      <div className="dfc-tools">
                        <span className="dfc-tools-label">Study tools</span>
                        <button type="button"
                          className="dfc-tool-btn"
                          data-copied={copyStatus === 'notes'}
                          onClick={() => copyCurrentCard('notes')}
                          title="Copy this card as clean markdown — paste into OneNote or any notes app"
                        >
                          {copyStatus === 'notes' ? 'Copied' : 'Copy for notes'}
                        </button>
                        <div style={{ position: 'relative' }}>
                          <button type="button"
                            ref={aiButtonRef}
                            className="dfc-tool-btn"
                            data-active={aiMenuOpen}
                            data-copied={copyStatus && copyStatus !== 'notes'}
                            onClick={() => setAiMenuOpen(o => !o)}
                            aria-haspopup="menu"
                            aria-expanded={aiMenuOpen}
                            title="Copy a ready-made prompt to paste into ChatGPT, Claude, or any LLM"
                          >
                            {copyStatus && copyStatus !== 'notes' ? 'Copied' : 'Ask AI'}
                            <span aria-hidden="true" style={{ fontSize: '0.7rem', opacity: 0.7 }}>▾</span>
                          </button>
                          {aiMenuOpen && (
                            <div className="dfc-ai-popover" ref={aiMenuRef} role="menu">
                              {FLASHCARD_MODES.map(m => (
                                <button type="button"
                                  key={m.key}
                                  className="dfc-ai-option"
                                  role="menuitem"
                                  onClick={() => copyCurrentCard(m.key)}
                                >
                                  <strong>{m.label}</strong>
                                  <span>{m.description}</span>
                                </button>
                              ))}
                              <div className="dfc-ai-divider" />
                              <label className="dfc-ai-toggle">
                                <input
                                  type="checkbox"
                                  checked={learnMode}
                                  onChange={toggleLearnMode}
                                />
                                <span>Tutor mode — AI asks questions, doesn't give answers</span>
                              </label>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="dfc-ratings">
                        <button type="button"
                          className="dfc-rating-btn"
                          data-rating="again"
                          onClick={() => rateCard('again')}
                        >
                          Again
                          <span className="dfc-rating-hint">see this soon</span>
                        </button>
                        <button type="button"
                          className="dfc-rating-btn"
                          data-rating="hard"
                          onClick={() => rateCard('hard')}
                        >
                          Hard
                          <span className="dfc-rating-hint">same frequency</span>
                        </button>
                        <button type="button"
                          className="dfc-rating-btn"
                          data-rating="good"
                          onClick={() => rateCard('good')}
                        >
                          Good
                          <span className="dfc-rating-hint">see this less often</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="dfc-nav">
              <button type="button" className="dfc-btn" onClick={handlePrevious} disabled={currentIndex === 0}>
                Previous
              </button>
              <div className="dfc-nav-center">
                <button type="button" className="dfc-btn" onClick={resetDeck}>Reset deck</button>
                {Object.keys(confidence).length > 0 && (
                  <button type="button" className="dfc-btn" onClick={() => setShowSummary(true)}>Summary</button>
                )}
              </div>
              <button type="button"
                className="dfc-btn"
                onClick={handleNext}
                disabled={currentIndex === currentCards.length - 1 && studyMode === 'test' && !showAnswer}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DelayFlashcards;