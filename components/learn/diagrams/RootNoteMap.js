'use client';

import { useEffect, useRef } from 'react';

// A 15-white-key strip (C3-C5, two octaves) built from one KEYS array — every x-position
// is computed as center(i)=44+28*i, never typed per-key. Root = G3 (index 4), matching the
// row's own assessment scenario (a G3 vocal sample left at the C3 default) — disclosed
// here, not invented: that example lives in sampling.js's `root-note` assessment. Every
// non-root key carries a uniform small arrow: teal ▲ above root (faster/higher), rose ▼
// below root (slower/lower) — only ▲▼ glyphs are used, never ▶/↔. C3 additionally gets a
// dashed rose outline (the wrong 2022 default) so the story reads directly off the keys,
// not just the caption.
//
// Label-clearance (recomputed from the actual draw calls, not estimated): the arrows sit
// in y=[69,79]; the root diamond extends the furthest of anything in this row, to
// y=[74,84]; the "ROOT" text above it spans approximately y=[63,72]. Combined, the whole
// arrow/root-marker band is y=[63,84]. The zone headers above it (baseline y=50) bottom
// out around y=52 — 11px clear of the band's top (63). The keyboard below starts at
// y=95 — 11px clear of the band's bottom (84). The keyboard itself occupies y=[95,180];
// key-name labels sit at y=170, 10px inside the box's own bottom edge — never touching a
// border line. Nothing is drawn in the y=[84,95] gap, so no arrow or marker can ever
// reach a key label at y=170.
export default function RootNoteMap() {
    const canvasRef = useRef(null);
    const frameRef = useRef(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const W = 480;
        const H = 280;
        canvas.width = W * 2;
        canvas.height = H * 2;
        ctx.scale(2, 2);

        const CYCLE = 560;
        let animId;

        const easeOut = (t) => 1 - Math.pow(1 - t, 3);
        const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
        const progress = (frame, start, dur) => clamp(easeOut(clamp((frame - start) / dur, 0, 1)), 0, 1);

        const NOTE_NAMES = ['C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
        const ROOT_I = 4; // G3
        const WRONG_DEFAULT_I = 0; // C3 — the 2022 task's actual default
        const KEY_W = 28;
        const KEYS_X0 = 30;
        const centerX = (i) => KEYS_X0 + KEY_W * i + KEY_W / 2;
        const leftX = (i) => KEYS_X0 + KEY_W * i;

        const BOX_TOP = 95;
        const BOX_H = 85;
        const BOX_BOTTOM = BOX_TOP + BOX_H;
        const ARROW_Y = 74;

        const boxPhase = (i) => 35 + i * 4;
        const labelPhase = (i) => boxPhase(i) + 15;
        const arrowPhase = (i) => 160 + Math.abs(i - ROOT_I) * 9;

        const drawTriangle = (x, y, up, color, alpha) => {
            ctx.globalAlpha = alpha;
            ctx.fillStyle = color;
            ctx.beginPath();
            if (up) {
                ctx.moveTo(x, y - 5);
                ctx.lineTo(x - 4, y + 4);
                ctx.lineTo(x + 4, y + 4);
            } else {
                ctx.moveTo(x, y + 5);
                ctx.lineTo(x - 4, y - 4);
                ctx.lineTo(x + 4, y - 4);
            }
            ctx.closePath();
            ctx.fill();
            ctx.globalAlpha = 1;
        };

        const draw = () => {
            frameRef.current = (frameRef.current + 0.6) % CYCLE;
            const f = frameRef.current;
            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = '#fafafa';
            ctx.fillRect(0, 0, W, H);

            const titleP = progress(f, 0, 20);
            ctx.globalAlpha = titleP;
            ctx.fillStyle = '#1a1a2e';
            ctx.font = 'bold 11px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('One Sample, Every Key — If the Root Is Right', W / 2, 16);
            ctx.globalAlpha = 1;

            const subP = progress(f, 15, 20);
            if (subP > 0) {
                ctx.globalAlpha = subP;
                ctx.fillStyle = '#6b7280';
                ctx.font = 'italic 8.5px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Root note = the key that plays back exactly as recorded', W / 2, 36);
                ctx.globalAlpha = 1;
            }

            // Keyboard boxes, staggered left to right
            NOTE_NAMES.forEach((name, i) => {
                const bp = progress(f, boxPhase(i), 20);
                if (bp <= 0) return;
                const x0 = leftX(i);
                const isRoot = i === ROOT_I;
                const isWrongDefault = i === WRONG_DEFAULT_I;
                ctx.globalAlpha = bp;
                ctx.fillStyle = isRoot ? '#DCC892' : '#fff';
                ctx.strokeStyle = isWrongDefault ? '#e85d75' : '#d1d5db';
                ctx.lineWidth = isWrongDefault ? 1.5 : 1;
                if (isWrongDefault) ctx.setLineDash([3, 2]);
                ctx.beginPath();
                ctx.roundRect(x0 + 1, BOX_TOP, KEY_W - 2, BOX_H, 3);
                ctx.fill();
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.globalAlpha = 1;

                const lp = progress(f, labelPhase(i), 15);
                if (lp > 0) {
                    ctx.globalAlpha = lp;
                    ctx.fillStyle = isRoot ? '#9B7530' : '#374151';
                    ctx.font = '6.5px -apple-system, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(name, centerX(i), 170);
                    ctx.globalAlpha = 1;
                }
            });

            // Zone headers
            const zoneP = progress(f, 120, 20);
            if (zoneP > 0) {
                ctx.globalAlpha = zoneP;
                ctx.fillStyle = '#e85d75';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('slower ▼', 86, 50);
                ctx.fillStyle = '#14b8a6';
                ctx.fillText('faster ▲', 310, 50);
                ctx.globalAlpha = 1;
            }

            // Root marker
            const rootP = progress(f, 140, 20);
            if (rootP > 0) {
                ctx.globalAlpha = rootP;
                ctx.fillStyle = '#9B7530';
                ctx.font = 'bold 8px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('ROOT', centerX(ROOT_I), 70);
                ctx.beginPath();
                ctx.moveTo(centerX(ROOT_I), ARROW_Y);
                ctx.lineTo(centerX(ROOT_I) + 4, ARROW_Y + 5);
                ctx.lineTo(centerX(ROOT_I), ARROW_Y + 10);
                ctx.lineTo(centerX(ROOT_I) - 4, ARROW_Y + 5);
                ctx.closePath();
                ctx.fillStyle = '#DCC892';
                ctx.fill();
                ctx.strokeStyle = '#9B7530';
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.globalAlpha = 1;
            }

            // Per-key speed arrows, staggered by distance from root
            NOTE_NAMES.forEach((_, i) => {
                if (i === ROOT_I) return;
                const ap = progress(f, arrowPhase(i), 18);
                if (ap <= 0) return;
                const up = i > ROOT_I;
                drawTriangle(centerX(i), ARROW_Y, up, up ? '#14b8a6' : '#e85d75', ap);
            });

            const cap1P = progress(f, 280, 25);
            if (cap1P > 0) {
                ctx.globalAlpha = cap1P;
                ctx.fillStyle = '#374151';
                ctx.font = 'italic 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Wrong root, wrong interval on every single key', W / 2, 205);
                ctx.globalAlpha = 1;
            }
            const cap2P = progress(f, 305, 25);
            if (cap2P > 0) {
                ctx.globalAlpha = cap2P;
                ctx.fillStyle = '#e85d75';
                ctx.font = 'italic 8.5px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('2022 error: G3 recorded, root left at C3 — the whole part came out wrong', W / 2, 222);
                ctx.globalAlpha = 1;
            }

            const phase = f < 120 ? 'Keyboard' : f < 160 ? 'Root' : f < 280 ? 'Speed arrows' : 'Complete';
            ctx.fillStyle = '#9ca3af';
            ctx.font = '8px -apple-system, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(phase, W - 20, H - 8);

            if (f > CYCLE - 40) {
                const fadeOut = progress(f, CYCLE - 40, 40);
                ctx.fillStyle = `rgba(245, 244, 242, ${fadeOut * 0.9})`;
                ctx.fillRect(0, 0, W, H);
            }

            animId = requestAnimationFrame(draw);
        };

        draw();
        return () => cancelAnimationFrame(animId);
    }, []);

    return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', borderRadius: '0.75rem' }} />;
}
