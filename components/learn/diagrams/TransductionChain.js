'use client';

import { useEffect, useRef } from 'react';

// Linear 5-box chain — signal in -> transducer -> vibrating element -> pickup ->
// signal out — the mechanism shared by spring/plate reverb, microphones and
// loudspeakers. All boxes sit on one row (y=130..162, mid=146) so every connector
// is a short horizontal segment strictly inside its own inter-box gap; box labels
// are drawn INSIDE the opaque box fill (masked, structurally safe, same precedent
// as SidechainTriggerTarget.js's in-box labels). The only external text is the
// title (y=16), the closing caption (y=195, 33px clear of box bottom 162) and the
// phase indicator (y=H-8=272, 110px clear) — neither sits anywhere near x in
// [16,464] AND y in [130,162], the only region any connector occupies, so no
// label/line crossing is possible regardless of animation state.
export default function TransductionChain() {
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

        const CYCLE = 520;
        let animId;

        const easeOut = (t) => 1 - Math.pow(1 - t, 3);
        const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
        const progress = (frame, start, dur) => clamp(easeOut(clamp((frame - start) / dur, 0, 1)), 0, 1);

        // Five boxes, one row: x_i = 16 + i*94, width 72, gap 22, margin 16 both sides.
        const boxes = [
            { x: 16, y: 130, w: 72, h: 32, label: 'IN', sub: 'signal' },
            { x: 110, y: 130, w: 72, h: 32, label: 'TRANSDUCER', sub: null },
            { x: 204, y: 130, w: 72, h: 32, label: 'ELEMENT', sub: 'vibrates' },
            { x: 298, y: 130, w: 72, h: 32, label: 'PICKUP', sub: null },
            { x: 392, y: 130, w: 72, h: 32, label: 'OUT', sub: 'signal' },
        ];
        const midY = 146;

        const drawBox = (b, alpha) => {
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#fff';
            ctx.strokeStyle = '#374151';
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.roundRect(b.x, b.y, b.w, b.h, 5);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#374151';
            ctx.font = 'bold 9px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(b.label, b.x + b.w / 2, b.y + b.h / 2 + (b.sub ? -2 : 3));
            if (b.sub) {
                ctx.font = '7px -apple-system, sans-serif';
                ctx.fillStyle = '#6b7280';
                ctx.fillText(b.sub, b.x + b.w / 2, b.y + b.h / 2 + 10);
            }
            ctx.globalAlpha = 1;
        };

        const arrowHead = (x, y, dx, dy, color) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x - dx - dy, y - dy + dx);
            ctx.lineTo(x - dx + dy, y - dy - dx);
            ctx.closePath();
            ctx.fill();
        };

        const PHASE_B = [20, 72, 124, 176, 228];
        const PHASE_A = [48, 100, 152, 204]; // arrow i connects box i -> box i+1
        const PHASE_CAPTION = 264;
        const PULSE_START = 264;

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
            ctx.fillText('The Transduction Chain', W / 2, 16);
            ctx.globalAlpha = 1;

            // Arrows first (so box fills sit on top and mask the arrow ends cleanly)
            for (let i = 0; i < PHASE_A.length; i++) {
                const p = progress(f, PHASE_A[i], 18);
                if (p <= 0) continue;
                const from = boxes[i];
                const to = boxes[i + 1];
                const x0 = from.x + from.w;
                const x1 = to.x;
                ctx.globalAlpha = p;
                ctx.strokeStyle = '#14b8a6';
                ctx.lineWidth = 1.8;
                ctx.beginPath();
                ctx.moveTo(x0, midY);
                ctx.lineTo(x1, midY);
                ctx.stroke();
                arrowHead(x1, midY, 5, 0, '#14b8a6');
                ctx.globalAlpha = 1;
            }

            for (let i = 0; i < boxes.length; i++) {
                const p = progress(f, PHASE_B[i], 22);
                if (p > 0) drawBox(boxes[i], p);
            }

            // Travelling pulse: continuous back-and-forth across the whole chain once
            // it is fully drawn, riding the shared baseline y=midY.
            if (f >= PULSE_START) {
                const period = 140;
                const cyclePos = ((f - PULSE_START) % period) / period;
                const t = cyclePos < 0.5 ? cyclePos * 2 : (1 - cyclePos) * 2;
                const x0 = boxes[0].x + boxes[0].w / 2;
                const x1 = boxes[4].x + boxes[4].w / 2;
                const px = x0 + (x1 - x0) * t;
                ctx.fillStyle = '#14b8a6';
                ctx.beginPath();
                ctx.arc(px, midY, 3, 0, Math.PI * 2);
                ctx.fill();
            }

            const capP = progress(f, PHASE_CAPTION, 30);
            if (capP > 0) {
                ctx.globalAlpha = capP;
                ctx.fillStyle = '#374151';
                ctx.font = 'italic 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Signal in, something vibrates, signal out: shared by mics and speakers too', W / 2, 195);
                ctx.globalAlpha = 1;
            }

            const phase = f < PHASE_B[1] ? 'Signal in'
                : f < PHASE_B[2] ? 'Transducer'
                : f < PHASE_B[3] ? 'Vibrating element'
                : f < PHASE_B[4] ? 'Pickup'
                : f < PULSE_START ? 'Signal out'
                : 'Chain complete';
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
