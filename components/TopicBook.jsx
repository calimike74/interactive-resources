'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { theme, typography, spacing, transitions } from '@/lib/theme';

// --- Canvas cover generation ---

function getPatternType(topicId) {
    const map = {
        recording: 'waveform',
        synthesis: 'knobs',
        sampling: 'waveform',
        midi: 'circuit',
        mixing: 'spectrum',
        dynamics: 'waveform',
        eq: 'spectrum',
        reverb: 'spectrum',
        'digital-analogue': 'binary',
        numeracy: 'binary',
        general: 'circuit',
    };
    return map[topicId] || 'waveform';
}

// Deterministic pseudo-random from seed string
function seededRandom(seed) {
    let h = 0;
    for (let i = 0; i < seed.length; i++) {
        h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
    }
    return function () {
        h = (h ^ (h >>> 16)) * 0x45d9f3b;
        h = (h ^ (h >>> 16)) * 0x45d9f3b;
        h = h ^ (h >>> 16);
        return (h >>> 0) / 4294967296;
    };
}

function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
}

function drawCover(canvas, topic) {
    const W = canvas.width;
    const H = canvas.height;
    const ctx = canvas.getContext('2d');
    const rand = seededRandom(topic.id);
    const { r, g, b } = hexToRgb(topic.colour);

    // Very dark background with subtle topic colour tint (matches demo aesthetic)
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, `rgb(${Math.floor(r * 0.15 + 10)}, ${Math.floor(g * 0.12 + 8)}, ${Math.floor(b * 0.18 + 20)})`);
    grad.addColorStop(0.5, `rgb(${Math.floor(r * 0.08 + 6)}, ${Math.floor(g * 0.06 + 5)}, ${Math.floor(b * 0.1 + 12)})`);
    grad.addColorStop(1, `rgb(${Math.floor(r * 0.05 + 4)}, ${Math.floor(g * 0.04 + 3)}, ${Math.floor(b * 0.06 + 8)})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Subtle grid underlay
    ctx.strokeStyle = `rgba(255,255,255,0.03)`;
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 20) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 20) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Pattern layer — high visibility
    const pattern = getPatternType(topic.id);
    const accentRgba = (a) => `rgba(${r}, ${g}, ${b}, ${a})`;

    if (pattern === 'waveform') {
        // Layered waveforms with colour
        for (let wave = 0; wave < 5; wave++) {
            ctx.beginPath();
            const yBase = H * 0.2 + wave * H * 0.12;
            const amp = 15 + rand() * 25;
            const freq = 0.015 + rand() * 0.025;
            const phase = wave * 2.1;
            ctx.moveTo(0, yBase);
            for (let x = 0; x <= W; x += 2) {
                const y = yBase + Math.sin(x * freq + phase) * amp + Math.sin(x * freq * 2.3 + phase * 0.7) * amp * 0.3;
                ctx.lineTo(x, y);
            }
            ctx.strokeStyle = accentRgba(0.15 + wave * 0.06);
            ctx.lineWidth = 2 + rand() * 1.5;
            ctx.stroke();
        }
    } else if (pattern === 'spectrum') {
        // Bold frequency spectrum bars
        const barCount = 20;
        const gap = 4;
        const totalGap = gap * (barCount - 1);
        const barW = (W - 40 - totalGap) / barCount;
        for (let i = 0; i < barCount; i++) {
            const barH = H * 0.1 + rand() * H * 0.5 + Math.sin(i * 0.5) * H * 0.12;
            const x = 20 + i * (barW + gap);
            const y = H * 0.7 - barH;
            const barGrad = ctx.createLinearGradient(x, y, x, y + barH);
            barGrad.addColorStop(0, accentRgba(0.5));
            barGrad.addColorStop(1, accentRgba(0.08));
            ctx.fillStyle = barGrad;
            ctx.fillRect(x, y, barW, barH);
        }
        // Horizontal frequency lines
        ctx.strokeStyle = `rgba(255,255,255,0.04)`;
        ctx.lineWidth = 1;
        for (let y = H * 0.15; y < H * 0.75; y += H * 0.08) {
            ctx.beginPath(); ctx.moveTo(20, y); ctx.lineTo(W - 20, y); ctx.stroke();
        }
    } else if (pattern === 'knobs') {
        // Larger, more prominent knobs in a grid
        const positions = [];
        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 3; col++) {
                positions.push({
                    cx: W * 0.22 + col * W * 0.28,
                    cy: H * 0.22 + row * H * 0.28,
                });
            }
        }
        positions.forEach(({ cx, cy }) => {
            const radius = 22 + rand() * 10;
            // Outer ring
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.strokeStyle = accentRgba(0.2);
            ctx.lineWidth = 2;
            ctx.stroke();
            // Arc indicator
            const startAngle = Math.PI * 0.75;
            const endAngle = startAngle + rand() * Math.PI * 1.3;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, startAngle, endAngle);
            ctx.strokeStyle = accentRgba(0.5);
            ctx.lineWidth = 3;
            ctx.stroke();
            // Centre dot
            ctx.beginPath();
            ctx.arc(cx, cy, 3, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,0.2)`;
            ctx.fill();
            // Tick marks around the arc
            for (let a = startAngle; a < startAngle + Math.PI * 1.5; a += Math.PI * 0.15) {
                ctx.beginPath();
                ctx.moveTo(cx + Math.cos(a) * (radius + 4), cy + Math.sin(a) * (radius + 4));
                ctx.lineTo(cx + Math.cos(a) * (radius + 7), cy + Math.sin(a) * (radius + 7));
                ctx.strokeStyle = `rgba(255,255,255,0.08)`;
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        });
    } else if (pattern === 'circuit') {
        // Circuit traces with right-angle paths and node dots
        ctx.strokeStyle = accentRgba(0.3);
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 14; i++) {
            let x = rand() * W;
            let y = rand() * H * 0.75 + H * 0.05;
            ctx.beginPath();
            ctx.moveTo(x, y);
            for (let seg = 0; seg < 5; seg++) {
                const nx = x + (rand() - 0.5) * 100;
                const ny = y + (rand() - 0.5) * 60;
                // Right-angle path
                ctx.lineTo(nx, y);
                ctx.lineTo(nx, ny);
                x = nx;
                y = ny;
            }
            ctx.stroke();
            // Node dots
            ctx.fillStyle = accentRgba(0.5);
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (pattern === 'binary') {
        // Background binary text
        ctx.font = '12px monospace';
        ctx.fillStyle = `rgba(255,255,255,0.04)`;
        for (let y = 12; y < H; y += 16) {
            let line = '';
            for (let c = 0; c < 30; c++) line += rand() > 0.5 ? '1' : '0';
            ctx.fillText(line, 8, y);
        }
        // Highlighted column
        ctx.fillStyle = accentRgba(0.06);
        ctx.fillRect(W * 0.25, 0, W * 0.2, H);
        // ADC staircase — bold and prominent
        ctx.beginPath();
        let x = W * 0.1;
        let y = H * 0.65;
        ctx.moveTo(x, y);
        for (let s = 0; s < 12; s++) {
            const stepW = 18 + rand() * 10;
            const stepH = 18 + rand() * 15;
            ctx.lineTo(x + stepW, y);
            x += stepW;
            y -= stepH;
            y = Math.max(H * 0.1, y);
            ctx.lineTo(x, y);
        }
        ctx.strokeStyle = accentRgba(0.6);
        ctx.lineWidth = 2.5;
        ctx.stroke();
    }

    // Noise texture
    const imageData = ctx.getImageData(0, 0, W, H);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        const noise = (rand() - 0.5) * 14;
        data[i] += noise;
        data[i + 1] += noise;
        data[i + 2] += noise;
    }
    ctx.putImageData(imageData, 0, 0);

    // Bottom gradient overlay for text readability
    const textGrad = ctx.createLinearGradient(0, H * 0.45, 0, H);
    textGrad.addColorStop(0, 'rgba(0,0,0,0)');
    textGrad.addColorStop(0.5, 'rgba(0,0,0,0.3)');
    textGrad.addColorStop(1, 'rgba(0,0,0,0.85)');
    ctx.fillStyle = textGrad;
    ctx.fillRect(0, 0, W, H);

    // Spec ref label with background pill
    const specText = `TOPIC ${topic.specRef}`;
    ctx.font = `600 ${Math.round(W * 0.035)}px ${typography.fontFamilyMono}`;
    ctx.textAlign = 'left';
    const specMetrics = ctx.measureText(specText);
    const pillX = 20;
    const pillY = H - 90;
    const pillW = specMetrics.width + 16;
    const pillH = Math.round(W * 0.035) + 10;
    ctx.fillStyle = accentRgba(0.25);
    ctx.beginPath();
    ctx.roundRect(pillX, pillY - pillH + 4, pillW, pillH, 4);
    ctx.fill();
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillText(specText, pillX + 8, pillY);

    // Topic name — bold, large
    ctx.fillStyle = '#ffffff';
    ctx.font = `700 ${Math.round(W * 0.06)}px ${typography.fontFamily}`;
    ctx.textAlign = 'left';

    const maxWidth = W - 40;
    const words = topic.name.split(' ');
    const lines = [];
    let line = '';
    for (const word of words) {
        const test = line ? line + ' ' + word : word;
        if (ctx.measureText(test).width > maxWidth && line) {
            lines.push(line);
            line = word;
        } else {
            line = test;
        }
    }
    if (line) lines.push(line);

    const lineH = Math.round(W * 0.07);
    const textY = H - 20 - (lines.length - 1) * lineH;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 6;
    lines.forEach((l, i) => {
        ctx.fillText(l, 20, textY + i * lineH);
    });
    ctx.shadowBlur = 0;
}

// --- Book dimensions ---
const BOOK_W = 160;
const BOOK_H = 220;
const SPINE_W = 14;
const CANVAS_W = BOOK_W * 2; // draw at 2x for retina
const CANVAS_H = BOOK_H * 2;

export default function TopicBook({ topic, animationDelay = 0 }) {
    const [isHovered, setIsHovered] = useState(false);
    const [coverUrl, setCoverUrl] = useState(null);
    const t = theme.light;

    const hasResources = topic.resourceIds.length > 0;

    // Generate canvas cover on mount
    useEffect(() => {
        const canvas = document.createElement('canvas');
        canvas.width = CANVAS_W;
        canvas.height = CANVAS_H;
        drawCover(canvas, topic);
        setCoverUrl(canvas.toDataURL('image/png'));
    }, [topic]);

    const book = (
        <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                width: BOOK_W + SPINE_W,
                height: BOOK_H,
                perspective: '800px',
                cursor: hasResources ? 'pointer' : 'default',
                animation: `cardReveal 400ms ease-out ${animationDelay}ms both`,
            }}
        >
            <div
                style={{
                    width: BOOK_W + SPINE_W,
                    height: BOOK_H,
                    position: 'relative',
                    transformStyle: 'preserve-3d',
                    transform: isHovered && hasResources
                        ? 'rotateY(-6deg) translateY(-6px) scale(1.04)'
                        : 'rotateY(-18deg)',
                    transition: `transform 400ms ${transitions.easing}`,
                }}
            >
                {/* Front cover */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: SPINE_W,
                        width: BOOK_W,
                        height: BOOK_H,
                        borderRadius: '2px 6px 6px 2px',
                        overflow: 'hidden',
                        backgroundImage: coverUrl ? `url(${coverUrl})` : undefined,
                        backgroundColor: topic.colour,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        boxShadow: isHovered && hasResources
                            ? `4px 4px 20px rgba(0,0,0,0.25), 1px 1px 4px rgba(0,0,0,0.12)`
                            : `2px 4px 12px rgba(0,0,0,0.18), 1px 1px 3px rgba(0,0,0,0.08)`,
                        transition: `box-shadow 400ms ${transitions.easing}`,
                        transformOrigin: 'left center',
                    }}
                >
                    {/* Page edges — right side repeating gradient */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 3,
                            right: 0,
                            width: 5,
                            height: BOOK_H - 6,
                            background: `repeating-linear-gradient(
                                to bottom,
                                #f5f2ea 0px,
                                #f5f2ea 1px,
                                #e8e4da 1px,
                                #e8e4da 2px
                            )`,
                            borderRadius: '0 2px 2px 0',
                            opacity: isHovered ? 0.7 : 0.5,
                            transition: `opacity 400ms ${transitions.easing}`,
                        }}
                        aria-hidden="true"
                    />
                </div>

                {/* Spine */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: SPINE_W,
                        height: BOOK_H,
                        background: `linear-gradient(to right, ${topic.colour}, ${topic.colour}dd)`,
                        borderRadius: '4px 0 0 4px',
                        boxShadow: 'inset -2px 0 6px rgba(0,0,0,0.25)',
                        transformOrigin: 'right center',
                        transform: 'rotateY(0deg)',
                    }}
                    aria-hidden="true"
                />

                {/* Bottom shadow (fake cast shadow) */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: -8,
                        left: SPINE_W + 6,
                        width: BOOK_W - 12,
                        height: 10,
                        background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.18) 0%, transparent 70%)',
                        filter: 'blur(3px)',
                        opacity: isHovered && hasResources ? 0.9 : 0.5,
                        transition: `opacity 400ms ${transitions.easing}`,
                        pointerEvents: 'none',
                    }}
                    aria-hidden="true"
                />
            </div>

            {/* Resource count label below book */}
            <div
                style={{
                    textAlign: 'center',
                    marginTop: spacing[3],
                    fontSize: typography.size.xs,
                    fontWeight: typography.weight.medium,
                    color: hasResources ? t.text.secondary : t.text.tertiary,
                    fontStyle: hasResources ? 'normal' : 'italic',
                    opacity: hasResources ? 1 : 0.6,
                    transition: `color ${transitions.normal} ${transitions.easing}`,
                }}
            >
                {hasResources
                    ? `${topic.resourceIds.length} ${topic.resourceIds.length === 1 ? 'tool' : 'tools'}`
                    : 'Coming Soon'}
            </div>
        </div>
    );

    if (!hasResources) return book;

    return (
        <Link href={`/topic/${topic.id}`} style={{ textDecoration: 'none' }}>
            {book}
        </Link>
    );
}
