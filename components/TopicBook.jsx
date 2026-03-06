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

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 1)`);
    grad.addColorStop(0.6, `rgba(${Math.max(r - 40, 0)}, ${Math.max(g - 40, 0)}, ${Math.max(b - 40, 0)}, 1)`);
    grad.addColorStop(1, `rgba(${Math.max(r - 80, 0)}, ${Math.max(g - 80, 0)}, ${Math.max(b - 80, 0)}, 1)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Pattern layer
    const pattern = getPatternType(topic.id);
    ctx.globalAlpha = 0.18;

    if (pattern === 'waveform') {
        // Sine-ish waveforms
        for (let wave = 0; wave < 3; wave++) {
            ctx.beginPath();
            const yBase = H * 0.3 + wave * H * 0.15;
            const amp = 12 + rand() * 20;
            const freq = 0.02 + rand() * 0.03;
            ctx.moveTo(0, yBase);
            for (let x = 0; x <= W; x += 2) {
                const y = yBase + Math.sin(x * freq + wave * 2) * amp;
                ctx.lineTo(x, y);
            }
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1.5 + rand();
            ctx.stroke();
        }
    } else if (pattern === 'spectrum') {
        // Vertical frequency bars
        const barCount = 18 + Math.floor(rand() * 10);
        const barW = W / (barCount * 1.8);
        for (let i = 0; i < barCount; i++) {
            const barH = H * 0.15 + rand() * H * 0.45;
            const x = (W / barCount) * i + barW * 0.4;
            const y = H * 0.65 - barH;
            ctx.fillStyle = '#fff';
            ctx.fillRect(x, y, barW, barH);
        }
    } else if (pattern === 'knobs') {
        // Dial/knob circles
        for (let i = 0; i < 5; i++) {
            const cx = W * 0.2 + rand() * W * 0.6;
            const cy = H * 0.25 + rand() * H * 0.4;
            const radius = 10 + rand() * 18;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            // Indicator tick
            const angle = rand() * Math.PI * 1.5 + Math.PI * 0.75;
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(angle) * radius * 0.5, cy + Math.sin(angle) * radius * 0.5);
            ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    } else if (pattern === 'circuit') {
        // Circuit-trace lines
        for (let i = 0; i < 8; i++) {
            ctx.beginPath();
            let x = rand() * W;
            let y = rand() * H * 0.7 + H * 0.1;
            ctx.moveTo(x, y);
            for (let seg = 0; seg < 4; seg++) {
                if (rand() > 0.5) {
                    x += (rand() - 0.3) * 60;
                } else {
                    y += (rand() - 0.3) * 40;
                }
                ctx.lineTo(Math.max(0, Math.min(W, x)), Math.max(0, Math.min(H, y)));
            }
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1 + rand();
            ctx.stroke();
            // Node dots at endpoints
            ctx.beginPath();
            ctx.arc(x, y, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.fill();
        }
    } else if (pattern === 'binary') {
        // Staircase / digital steps
        ctx.beginPath();
        let x = 0;
        let y = H * 0.35 + rand() * H * 0.1;
        ctx.moveTo(x, y);
        while (x < W) {
            const stepW = 8 + rand() * 20;
            ctx.lineTo(x + stepW, y);
            x += stepW;
            const stepH = (rand() > 0.5 ? 1 : -1) * (8 + rand() * 25);
            y = Math.max(H * 0.15, Math.min(H * 0.65, y + stepH));
            ctx.lineTo(x, y);
        }
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        // Scattered 0s and 1s
        ctx.font = '10px monospace';
        ctx.fillStyle = '#fff';
        for (let i = 0; i < 20; i++) {
            ctx.fillText(rand() > 0.5 ? '1' : '0', rand() * W, H * 0.7 + rand() * H * 0.2);
        }
    }

    ctx.globalAlpha = 1;

    // Noise texture
    const imageData = ctx.getImageData(0, 0, W, H);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        const noise = (rand() - 0.5) * 18;
        data[i] += noise;
        data[i + 1] += noise;
        data[i + 2] += noise;
    }
    ctx.putImageData(imageData, 0, 0);

    // Bottom gradient overlay for text readability
    const textGrad = ctx.createLinearGradient(0, H * 0.55, 0, H);
    textGrad.addColorStop(0, 'rgba(0,0,0,0)');
    textGrad.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = textGrad;
    ctx.fillRect(0, 0, W, H);

    // Spec ref — small mono text top-right
    ctx.globalAlpha = 0.7;
    ctx.font = `500 11px ${typography.fontFamilyMono}`;
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'right';
    ctx.fillText(topic.specRef, W - 12, 22);

    // Topic name — bottom-left
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fff';
    ctx.font = `600 15px ${typography.fontFamily}`;

    // Word-wrap the title
    const maxWidth = W - 24;
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

    const lineH = 19;
    const textY = H - 14 - (lines.length - 1) * lineH;
    lines.forEach((l, i) => {
        ctx.fillText(l, 12, textY + i * lineH);
    });
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
