'use client';

import { useEffect, useRef } from 'react';

// Progressive disclosure: same transient, three lanes — uncompressed peaks at +6 dBFS,
// a ∞:1 limiter flattens it exactly at the −1 dBFS ceiling, a 4:1 compressor rounds it
// to a lower peak (−6 dBFS) without flattening it. Numbers match this row's own
// assessment (threshold −1 dBFS, transient that would otherwise reach +6 dBFS).
export default function LimiterCeiling() {
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

        const CYCLE = 540;
        let animId;

        const easeOut = (t) => 1 - Math.pow(1 - t, 3);
        const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
        const progress = (frame, start, dur) => clamp(easeOut(clamp((frame - start) / dur, 0, 1)), 0, 1);

        const margin = { left: 24, right: 24 };
        const plotW = W - margin.left - margin.right;

        const CEILING = -1;
        const COMP_THRESH = -10;
        const COMP_RATIO = 4;
        const REST_DB = -30;
        const PEAK_DB = 6;

        const DB_TOP = 8;
        const DB_BOTTOM = -30;
        const dbToFrac = (db) => (DB_TOP - db) / (DB_TOP - DB_BOTTOM);

        // Single transient shape, shared by all three lanes.
        const ampShapeAt = (t) => {
            if (t < 0.06) return t / 0.06;
            if (t < 0.25) return 1 - (t - 0.06) * (0.85 / 0.19);
            return Math.max(0, 0.15 * (1 - (t - 0.25) / 0.75));
        };
        const uncompressedDb = (t) => REST_DB + ampShapeAt(t) * (PEAK_DB - REST_DB);
        const limiterDb = (t) => Math.min(uncompressedDb(t), CEILING);
        const compressorDb = (t) => {
            const db = uncompressedDb(t);
            if (db <= COMP_THRESH) return db;
            return COMP_THRESH + (db - COMP_THRESH) / COMP_RATIO;
        };

        const drawLane = (panelTop, panelH, dbFn, color, drawP) => {
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            const steps = 140;
            const visible = Math.floor(steps * drawP);
            let peakX = margin.left;
            let peakY = panelTop + dbToFrac(dbFn(0)) * panelH;
            for (let i = 0; i <= visible; i++) {
                const t = i / steps;
                const db = dbFn(t);
                const y = panelTop + dbToFrac(db) * panelH;
                const x = margin.left + t * plotW;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
                if (y < peakY) { peakY = y; peakX = x; }
            }
            ctx.stroke();
            return { peakX, peakY };
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
            ctx.fillText('The Limiter: A Hard Ceiling', W / 2, 16);
            ctx.globalAlpha = 1;

            const panelH = 54;
            const lanes = [
                { top: 42, label: 'Uncompressed', dbFn: uncompressedDb, color: '#DC2626', start: 30 },
                { top: 124, label: 'Limiter ∞:1', dbFn: limiterDb, color: '#e85d75', start: 170 },
                { top: 206, label: 'Compressor 4:1 (for contrast)', dbFn: compressorDb, color: '#2563EB', start: 310 },
            ];

            const ceilingY = 42 + dbToFrac(CEILING) * panelH;

            lanes.forEach((lane, idx) => {
                const laneP = progress(f, lane.start, 60);
                if (laneP <= 0) return;

                ctx.globalAlpha = laneP;
                ctx.fillStyle = lane.color;
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText(lane.label, margin.left, lane.top - 8);
                ctx.globalAlpha = 1;

                // Ceiling reference line threaded through every lane
                const cY = lane.top + dbToFrac(CEILING) * panelH;
                ctx.globalAlpha = laneP * 0.8;
                ctx.strokeStyle = '#9ca3af';
                ctx.lineWidth = 1;
                ctx.setLineDash([3, 3]);
                ctx.beginPath();
                ctx.moveTo(margin.left, cY);
                ctx.lineTo(margin.left + plotW, cY);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.globalAlpha = 1;

                const { peakX, peakY } = drawLane(lane.top, panelH, lane.dbFn, lane.color, laneP);

                const peakLabelP = progress(f, lane.start + 30, 25);
                if (peakLabelP > 0) {
                    ctx.globalAlpha = peakLabelP;
                    ctx.fillStyle = lane.color;
                    ctx.font = 'bold 8px -apple-system, sans-serif';
                    ctx.textAlign = 'left';
                    const dbLabel = idx === 0 ? '+6 dBFS' : idx === 1 ? '−1 dBFS' : '−6 dBFS';
                    ctx.fillText(dbLabel, peakX + 8, peakY + 3);
                    ctx.globalAlpha = 1;
                }
            });

            const ceilingLabelP = progress(f, 60, 30);
            if (ceilingLabelP > 0) {
                ctx.globalAlpha = ceilingLabelP;
                ctx.fillStyle = '#6b7280';
                ctx.font = '8px -apple-system, sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText('Ceiling: −1 dBFS', margin.left + plotW, ceilingY - 4);
                ctx.globalAlpha = 1;
            }

            const closingP = progress(f, 420, 40);
            if (closingP > 0) {
                ctx.globalAlpha = closingP;
                ctx.fillStyle = '#374151';
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Nothing crosses the ceiling: that\'s a limiter', W / 2, 276);
                ctx.globalAlpha = 1;
            }

            const phase = f < 170 ? 'Uncompressed' : f < 310 ? 'Limiter' : f < 420 ? 'Compressor' : 'Ceiling';
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
