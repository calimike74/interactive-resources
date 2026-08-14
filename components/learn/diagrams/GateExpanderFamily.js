'use client';

import { useEffect, useRef } from 'react';

// Progressive disclosure: same noisy-floor-plus-phrases signal, three lanes — Original
// (noise floor with two loud phrases), Gate (floor pinned flat to silence below
// threshold, phrases untouched), Expander (floor pushed quieter but still moving —
// reduced, not silenced — phrases untouched). A shared threshold line threads all three.
export default function GateExpanderFamily() {
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

        const THRESHOLD = -35;
        const DB_TOP = -5;
        const DB_BOTTOM = -70;
        const EXPAND_RATIO = 1.4;
        const dbToFrac = (db) => (DB_TOP - db) / (DB_TOP - DB_BOTTOM);

        const BURSTS = [[0.14, 0.34], [0.56, 0.76]];
        const burstEnvelope = (t) => {
            let w = 0;
            BURSTS.forEach(([s, e]) => {
                if (t >= s && t <= e) w = Math.max(w, Math.sin(((t - s) / (e - s)) * Math.PI));
            });
            return w;
        };

        const noiseFloorDb = (t) => -50 + 3 * Math.sin(t * 90) + 1.5 * Math.sin(t * 37 + 1);
        const originalDb = (t) => {
            const floor = noiseFloorDb(t);
            const w = burstEnvelope(t);
            return floor + w * (-10 - floor);
        };
        const gateDb = (t) => (originalDb(t) < THRESHOLD ? DB_BOTTOM : originalDb(t));
        const expanderDb = (t) => {
            const db = originalDb(t);
            if (db >= THRESHOLD) return db;
            return THRESHOLD + (db - THRESHOLD) * EXPAND_RATIO;
        };

        const drawLane = (panelTop, panelH, dbFn, color, drawP) => {
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            const steps = 160;
            const visible = Math.floor(steps * drawP);
            for (let i = 0; i <= visible; i++) {
                const t = i / steps;
                const y = panelTop + dbToFrac(dbFn(t)) * panelH;
                const x = margin.left + t * plotW;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
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
            ctx.fillText('Gate & Expander', W / 2, 16);
            ctx.globalAlpha = 1;

            const panelH = 54;
            const lanes = [
                { top: 42, label: 'Original: noise floor + two phrases', dbFn: originalDb, color: '#6b7280', start: 30 },
                { top: 124, label: 'Gate: below threshold, silence', dbFn: gateDb, color: '#DC2626', start: 190 },
                { top: 206, label: 'Expander: below threshold, reduced, not silenced', dbFn: expanderDb, color: '#2563EB', start: 350 },
            ];

            lanes.forEach((lane) => {
                const laneP = progress(f, lane.start, 60);
                if (laneP <= 0) return;

                ctx.globalAlpha = laneP;
                ctx.fillStyle = lane.color;
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText(lane.label, margin.left, lane.top - 8);
                ctx.globalAlpha = 1;

                const tY = lane.top + dbToFrac(THRESHOLD) * panelH;
                ctx.globalAlpha = laneP * 0.8;
                ctx.strokeStyle = '#9ca3af';
                ctx.lineWidth = 1;
                ctx.setLineDash([3, 3]);
                ctx.beginPath();
                ctx.moveTo(margin.left, tY);
                ctx.lineTo(margin.left + plotW, tY);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.globalAlpha = 1;

                drawLane(lane.top, panelH, lane.dbFn, lane.color, laneP);
            });

            const threshLabelP = progress(f, 60, 30);
            if (threshLabelP > 0) {
                ctx.globalAlpha = threshLabelP;
                ctx.fillStyle = '#6b7280';
                ctx.font = '8px -apple-system, sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText('Threshold', margin.left + plotW, 42 + dbToFrac(THRESHOLD) * panelH - 4);
                ctx.globalAlpha = 1;
            }

            const closingP = progress(f, 440, 40);
            if (closingP > 0) {
                ctx.globalAlpha = closingP;
                ctx.fillStyle = '#374151';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Both act below the threshold: a compressor acts above it', W / 2, 276);
                ctx.globalAlpha = 1;
            }

            const phase = f < 190 ? 'Original' : f < 350 ? 'Gate' : f < 440 ? 'Expander' : 'Compare';
            ctx.fillStyle = '#9ca3af';
            ctx.font = '8px -apple-system, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(phase, W - margin.right, 16);

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
