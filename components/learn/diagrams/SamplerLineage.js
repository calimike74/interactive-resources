'use client';

import { useEffect, useRef } from 'react';

// Five-node horizontal timeline: Mellotron (1963) -> Fairlight CMI (1979) ->
// Akai S1000 (late 1980s) -> MPC -> Your DAW. Node x-positions are a single
// evenly-spaced array (X0=40..X1=440, step 100); each node's reveal phase is
// COMPUTED from its position along that same line (NODE_PHASE = LINE_START +
// fraction-along-line * LINE_DUR), not hand-typed, so the pop-in always tracks
// the line's own left-to-right draw.
//
// Sourcing: years/characteristics for Mellotron/Fairlight/Akai/MPC/DAW come
// straight from the row text and this task's own brief ("late-80s Akai
// S1000"). "The MPC years" and "Today" (nodes 4-5) are structural era labels,
// not dated facts — the reference gives no MPC release year, so none is
// invented; flagged in the task report.
//
// Label-clearance: the ONLY line in this diagram is the horizontal baseline +
// its short arrowheads, and both live exclusively at y=130 (node dot radius
// 4, so y in [126,134]). Every label — era/name above (y<=116) and
// characteristic below (y=148) and the closing caption (y=200) — sits outside
// that band by at least 12px, so no line can ever cross a label regardless of
// animation progress.
export default function SamplerLineage() {
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

        const baselineY = 130;
        const X0 = 40;
        const X1 = 440;
        const NODES = [
            { x: 40, era: '1963', name: 'Mellotron', char: 'tape strip, one per key' },
            { x: 140, era: '1979', name: 'Fairlight CMI', char: 'eight-bit, ~1 second' },
            { x: 240, era: 'Late 1980s', name: 'Akai S1000', char: 'reached CD quality' },
            { x: 340, era: 'The MPC years', name: 'MPC', char: 'pads for slicing' },
            { x: 440, era: 'Today', name: 'Your DAW', char: 'Sampler & Simpler' },
        ];

        const LINE_START = 30;
        const LINE_DUR = 260;
        // Single source of truth: reveal phase tracks position along the line.
        const nodePhase = (i) => LINE_START + ((NODES[i].x - X0) / (X1 - X0)) * LINE_DUR;

        const PHASE_CAPTION = nodePhase(4) + 90;

        const arrowHead = (x, y, dx, dy, color) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x - dx - dy, y - dy + dx);
            ctx.lineTo(x - dx + dy, y - dy - dx);
            ctx.closePath();
            ctx.fill();
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
            ctx.fillText('The Sampler Lineage', W / 2, 16);
            ctx.globalAlpha = 1;

            // Baseline draws progressively left to right.
            const lineP = progress(f, LINE_START, LINE_DUR);
            if (lineP > 0) {
                ctx.globalAlpha = 1;
                ctx.strokeStyle = '#14b8a6';
                ctx.lineWidth = 1.6;
                ctx.beginPath();
                ctx.moveTo(X0, baselineY);
                ctx.lineTo(X0 + (X1 - X0) * lineP, baselineY);
                ctx.stroke();
                if (lineP > 0.02) arrowHead(X0 + (X1 - X0) * lineP, baselineY, 5, 0, '#14b8a6');
            }

            NODES.forEach((node, i) => {
                const p = progress(f, nodePhase(i), 20);
                if (p <= 0) return;
                ctx.globalAlpha = p;

                const isLast = i === NODES.length - 1;
                ctx.fillStyle = isLast ? '#DCC892' : '#14b8a6';
                ctx.beginPath();
                ctx.arc(node.x, baselineY, 4, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#6b7280';
                ctx.font = 'bold 8px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(node.era, node.x, 100);
                ctx.fillStyle = '#1a1a2e';
                ctx.font = 'bold 8.5px -apple-system, sans-serif';
                ctx.fillText(node.name, node.x, 113);
                ctx.globalAlpha = 1;

                const charP = progress(f, nodePhase(i) + 15, 20);
                if (charP > 0) {
                    ctx.globalAlpha = charP;
                    ctx.fillStyle = '#374151';
                    ctx.font = 'italic 7px -apple-system, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(node.char, node.x, 148);
                    ctx.globalAlpha = 1;
                }
            });

            // Pulsing "present day" ring around the final node.
            if (f >= PHASE_CAPTION) {
                const pulse = 0.5 + 0.5 * Math.sin((f - PHASE_CAPTION) * 0.12);
                ctx.globalAlpha = 0.5 + 0.3 * pulse;
                ctx.strokeStyle = '#DCC892';
                ctx.lineWidth = 1.3;
                ctx.beginPath();
                ctx.arc(NODES[4].x, baselineY, 8 + pulse * 3, 0, Math.PI * 2);
                ctx.stroke();
                ctx.globalAlpha = 1;
            }

            const capP = progress(f, PHASE_CAPTION, 30);
            if (capP > 0) {
                ctx.globalAlpha = capP;
                ctx.fillStyle = '#374151';
                ctx.font = 'italic 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Two decades, one idea: record it once, play it back from a key', W / 2, 200);
                ctx.globalAlpha = 1;
            }

            const phase = f < nodePhase(1) ? 'Mellotron'
                : f < nodePhase(2) ? 'Fairlight CMI'
                : f < nodePhase(3) ? 'Akai S1000'
                : f < nodePhase(4) ? 'MPC'
                : 'Your DAW';
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
