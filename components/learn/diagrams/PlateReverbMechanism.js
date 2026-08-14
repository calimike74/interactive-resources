'use client';

import { useEffect, useRef } from 'react';

// Tensioned-plate schematic: a clipped rectangle (x 140-340, y 50-190) holds every
// ripple — ctx.clip() to that rect guarantees no ripple ever renders outside it, so
// the DRIVER label (above the rect, y<=42) and both PICKUP labels (outside the
// rect's left/right edges, x<=132 or x>=348) are safe from every ripple by simple
// geometric exclusion, regardless of animation state. The damping-plate slider and
// its label sit below the rect (y>=210), also outside the clip.
export default function PlateReverbMechanism() {
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

        const plate = { x: 140, y: 50, w: 200, h: 140 };
        const center = { x: 240, y: 120 };
        const leftPickup = { x: 140, y: 120 };
        const rightPickup = { x: 340, y: 120 };

        // illustrative — not a measured value (see w2-task-6-report)
        const RING_COUNT = 8;
        const RING_STAGGER = 6;
        const RING_LIFE = 60; // frames a ring takes to grow from 0 to max radius
        const RING_MAX_R = 150; // > plate diagonal half (~123), so rings always fill the clip

        const PHASE_PLATE = 15;
        const PHASE_RIPPLE_START = 60;
        const PHASE_DAMPING = 40;
        const PHASE_CAPTION = 300;

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
            ctx.fillText('Plate Reverb: the EMT 140', W / 2, 16);
            ctx.globalAlpha = 1;

            // Plate rectangle
            const plateP = progress(f, PHASE_PLATE, 25);
            if (plateP > 0) {
                ctx.globalAlpha = plateP;
                ctx.fillStyle = '#e5e7eb';
                ctx.strokeStyle = '#374151';
                ctx.lineWidth = 1.6;
                ctx.beginPath();
                ctx.roundRect(plate.x, plate.y, plate.w, plate.h, 4);
                ctx.fill();
                ctx.stroke();
                ctx.globalAlpha = 1;
            }

            // Ripples, clipped strictly to the plate rectangle
            if (f >= PHASE_RIPPLE_START) {
                ctx.save();
                ctx.beginPath();
                ctx.rect(plate.x + 1, plate.y + 1, plate.w - 2, plate.h - 2);
                ctx.clip();
                const elapsed = f - PHASE_RIPPLE_START;
                for (let i = 0; i < RING_COUNT; i++) {
                    const ringStart = i * RING_STAGGER;
                    if (elapsed < ringStart) continue;
                    const ringAge = (elapsed - ringStart) % (RING_LIFE * 2.2);
                    if (ringAge > RING_LIFE) continue;
                    const t = ringAge / RING_LIFE;
                    const r = RING_MAX_R * t;
                    ctx.globalAlpha = 0.5 * (1 - t);
                    ctx.strokeStyle = '#14b8a6';
                    ctx.lineWidth = 1.3;
                    ctx.beginPath();
                    ctx.arc(center.x, center.y, r, 0, Math.PI * 2);
                    ctx.stroke();
                }
                ctx.globalAlpha = 1;
                ctx.restore();
            }

            // Driver marker + label (label above the rect, leader stub inside the gap
            // y=42..50 which the clip never reaches since the clip starts at y=50)
            const driverP = progress(f, PHASE_PLATE + 15, 20);
            if (driverP > 0) {
                ctx.globalAlpha = driverP;
                ctx.strokeStyle = '#DC2626';
                ctx.lineWidth = 1.4;
                ctx.beginPath();
                ctx.moveTo(center.x, 42);
                ctx.lineTo(center.x, plate.y);
                ctx.stroke();
                ctx.fillStyle = '#DC2626';
                ctx.beginPath();
                ctx.arc(center.x, center.y, 3.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.font = 'bold 8px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('DRIVER (centre)', center.x, 38);
                ctx.globalAlpha = 1;
            }

            // Pickups + labels, strictly outside the plate rect on x
            const pickupP = progress(f, PHASE_PLATE + 30, 20);
            if (pickupP > 0) {
                ctx.globalAlpha = pickupP;
                ctx.fillStyle = '#f97316';
                [leftPickup, rightPickup].forEach((p) => {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
                    ctx.fill();
                });
                ctx.font = 'bold 8px -apple-system, sans-serif';
                ctx.fillStyle = '#f97316';
                ctx.textAlign = 'right';
                ctx.fillText('PICKUP', 132, leftPickup.y + 3);
                ctx.textAlign = 'left';
                ctx.fillText('PICKUP', 348, rightPickup.y + 3);
                ctx.globalAlpha = 1;
            }

            // Damping-plate slider — below the rect (y>=210), a movable marker on a
            // fixed track represents the EMT 140's mechanical decay-time control.
            const dampP = progress(f, PHASE_PLATE + 60, PHASE_DAMPING);
            if (dampP > 0) {
                ctx.globalAlpha = dampP;
                const trackX0 = 170;
                const trackX1 = 310;
                const trackY = 210;
                ctx.strokeStyle = '#9ca3af';
                ctx.lineWidth = 1.4;
                ctx.beginPath();
                ctx.moveTo(trackX0, trackY);
                ctx.lineTo(trackX1, trackY);
                ctx.stroke();
                // slider sweeps far -> near -> far over the loop, illustrating "movable"
                const sweep = (Math.sin((f - PHASE_PLATE - 60) * 0.025) + 1) / 2;
                const markerX = trackX0 + (trackX1 - trackX0) * sweep;
                ctx.fillStyle = '#9ca3af';
                ctx.fillRect(markerX - 5, trackY - 5, 10, 10);
                ctx.font = '8px -apple-system, sans-serif';
                ctx.fillStyle = '#374151';
                ctx.textAlign = 'center';
                ctx.fillText('damping plate (EMT 140): decay control', (trackX0 + trackX1) / 2, 226);
                ctx.globalAlpha = 1;
            }

            const capP = progress(f, PHASE_CAPTION, 25);
            if (capP > 0) {
                ctx.globalAlpha = capP;
                ctx.fillStyle = '#374151';
                ctx.font = 'italic 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Dense, bright, non-spatial: no room geometry to imprint on it', W / 2, 252);
                ctx.globalAlpha = 1;
            }

            const phase = f < PHASE_RIPPLE_START ? 'Plate'
                : f < PHASE_PLATE + 60 ? 'Ripples fuse densely'
                : 'Damping plate: decay control';
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
