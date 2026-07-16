'use client';

import { useEffect, useRef } from 'react';

// Progressive disclosure: kick pattern appears → a mismatched release lane sags further
// with every hit and never recovers (the artefact) → a tempo-tuned lane ducks and
// recovers cleanly before each kick (the effect) → a callout on the tuned lane names
// the two moments explicitly: Grab (the dip) and Release (the recovery).
export default function PumpingEnvelope() {
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

        const margin = { left: 24, right: 24 };
        const plotW = W - margin.left - margin.right;
        const KICKS = [0.1, 0.35, 0.6, 0.85];
        const GRAB_AMOUNT = 0.72;

        // Single envelope model, shared by both lanes — only the release time constant
        // (tau) differs. Each kick contributes a decaying "duck"; a slow tau means the
        // ducks from consecutive kicks pile up (never recovers); a fast tau clears
        // between hits.
        const levelAt = (t, tau) => {
            let dip = 0;
            for (const k of KICKS) {
                if (t >= k) dip += GRAB_AMOUNT * Math.exp(-(t - k) / tau);
            }
            return clamp(1 - dip, 0.08, 1);
        };

        const drawLane = (laneTop, laneH, tau, drawP, color) => {
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            const steps = 140;
            const visibleSteps = Math.floor(steps * drawP);
            for (let i = 0; i <= visibleSteps; i++) {
                const t = i / steps;
                const y = laneTop + laneH - levelAt(t, tau) * laneH;
                const x = margin.left + t * plotW;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        };

        const drawKicks = (laneTop, laneH, alpha) => {
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#374151';
            KICKS.forEach((k) => {
                const x = margin.left + k * plotW;
                ctx.beginPath();
                ctx.moveTo(x - 4, laneTop + laneH + 10);
                ctx.lineTo(x + 4, laneTop + laneH + 10);
                ctx.lineTo(x, laneTop + laneH + 2);
                ctx.fill();
            });
            ctx.globalAlpha = 1;
        };

        const draw = () => {
            frameRef.current = (frameRef.current + 1) % CYCLE;
            const f = frameRef.current;
            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = '#fafafa';
            ctx.fillRect(0, 0, W, H);

            const titleP = progress(f, 0, 20);
            ctx.globalAlpha = titleP;
            ctx.fillStyle = '#1a1a6e';
            ctx.font = 'bold 11px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Pumping: Artefact or Effect', W / 2, 16);
            ctx.globalAlpha = 1;

            const laneH = 60;
            const laneA_top = 44;
            const laneB_top = 172;

            // --- Lane A: mismatched release (artefact) ---
            const introP = progress(f, 20, 30);
            if (introP > 0) {
                ctx.globalAlpha = introP;
                ctx.fillStyle = '#DC2626';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('Release too slow — never recovers', margin.left, laneA_top - 8);
                ctx.globalAlpha = 1;

                drawKicks(laneA_top, laneH, introP);
            }
            const laneAP = progress(f, 50, 70);
            if (laneAP > 0) {
                drawLane(laneA_top, laneH, 0.34, laneAP, '#DC2626');
            }
            const laneACaptionP = progress(f, 150, 30);
            if (laneACaptionP > 0) {
                ctx.globalAlpha = laneACaptionP;
                ctx.fillStyle = '#DC2626';
                ctx.font = '8px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('sags lower with every hit', margin.left, laneA_top + laneH + 26);
                ctx.globalAlpha = 1;
            }

            // --- Lane B: tempo-tuned release (effect) ---
            const introBP = progress(f, 200, 30);
            if (introBP > 0) {
                ctx.globalAlpha = introBP;
                ctx.fillStyle = '#16a34a';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('Tuned to tempo — recovers before the next kick', margin.left, laneB_top - 8);
                ctx.globalAlpha = 1;

                drawKicks(laneB_top, laneH, introBP);
            }
            const laneBP = progress(f, 230, 70);
            if (laneBP > 0) {
                drawLane(laneB_top, laneH, 0.07, laneBP, '#16a34a');
            }

            // --- Grab / Release caption, named explicitly, below lane B's kicks —
            // mirrors lane A's caption position so nothing sits near the drawn curve.
            const calloutP = progress(f, 330, 40);
            if (calloutP > 0) {
                ctx.globalAlpha = calloutP;
                ctx.fillStyle = '#9B7530';
                ctx.font = 'bold 8px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('Grab — the sudden drop at each kick', margin.left, laneB_top + laneH + 24);
                ctx.fillText('Release — the recovery back to baseline', margin.left, laneB_top + laneH + 36);
                ctx.globalAlpha = 1;
            }

            const phase = f < 200 ? (f < 150 ? 'Grab' : 'Sags') : f < 330 ? 'Release' : 'Compare';
            ctx.fillStyle = '#9ca3af';
            ctx.font = '8px -apple-system, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(phase, W - margin.right, laneA_top - 8);

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

    return (
        <canvas
            ref={canvasRef}
            style={{ width: '100%', height: '100%', borderRadius: '0.75rem' }}
        />
    );
}
