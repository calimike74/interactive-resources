'use client';

import { useEffect, useRef } from 'react';

// Progressive disclosure: a single LFO box (violet, control-signal colour) fans out via three
// arrows to three destination lanes — pitch, amplitude, filter cutoff — each revealed in turn.
// Once all three are on screen their mini-visuals animate from the same shared phase, showing
// one LFO producing three different named effects at once: vibrato, tremolo, wah.
export default function LfoTargets() {
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

        const CYCLE = 720;
        let animId;

        const easeOut = (t) => 1 - Math.pow(1 - t, 3);
        const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
        const progress = (frame, start, dur) => clamp(easeOut(clamp((frame - start) / dur, 0, 1)), 0, 1);
        const drawRR = (x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); };

        const VIOLET = '#7c3aed';

        const lfoBox = { x: 20, y: 113, w: 70, h: 60 };
        const lfoCX = lfoBox.x + lfoBox.w / 2;
        const lfoCY = lfoBox.y + lfoBox.h / 2;

        const lanes = [
            { dest: 'PITCH', effect: 'Vibrato', color: '#0891b2', y: 42, frame: 100 },
            { dest: 'AMPLITUDE', effect: 'Tremolo', color: '#DC2626', y: 112, frame: 200 },
            { dest: 'FILTER CUTOFF', effect: 'Wah', color: '#9B7530', y: 182, frame: 300 },
        ];
        const laneX = 150;
        const laneW = 300;
        const laneH = 62;

        const draw = () => {
            frameRef.current = (frameRef.current + 1) % CYCLE;
            const f = frameRef.current;
            ctx.clearRect(0, 0, W, H);

            ctx.fillStyle = '#fafafa';
            ctx.fillRect(0, 0, W, H);

            // Title
            const titleP = progress(f, 0, 25);
            ctx.globalAlpha = titleP;
            ctx.fillStyle = '#1a1a6e';
            ctx.font = 'bold 11px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Where You Route the LFO', W / 2, 18);
            ctx.globalAlpha = 1;

            // --- LFO source box ---
            const lfoP = progress(f, 25, 35);
            if (lfoP > 0) {
                ctx.globalAlpha = lfoP;
                ctx.fillStyle = '#fff';
                ctx.strokeStyle = VIOLET;
                ctx.lineWidth = 1.5;
                drawRR(lfoBox.x, lfoBox.y, lfoBox.w, lfoBox.h, 6);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = VIOLET;
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('LFO', lfoCX, lfoBox.y + 16);

                // Mini sine icon, animates continuously once shown
                const iconW = lfoBox.w - 20;
                const iconX = lfoBox.x + 10;
                const iconY = lfoBox.y + 38;
                ctx.strokeStyle = VIOLET;
                ctx.lineWidth = 1.3;
                ctx.beginPath();
                const iconPhase = (f % 200) / 200;
                for (let px = 0; px <= iconW; px++) {
                    const nx = px / iconW + iconPhase;
                    const y = iconY - Math.sin(nx * Math.PI * 2) * 9;
                    if (px === 0) ctx.moveTo(iconX + px, y);
                    else ctx.lineTo(iconX + px, y);
                }
                ctx.stroke();

                ctx.globalAlpha = 1;
            }

            const sharedPhase = (f % 200) / 200;
            const sVal = Math.sin(sharedPhase * Math.PI * 2);

            lanes.forEach((lane) => {
                const laneP = progress(f, lane.frame, 40);
                if (laneP <= 0) return;
                ctx.globalAlpha = laneP;

                const laneCY = lane.y + laneH / 2;

                // Arrow from LFO box to this lane
                ctx.strokeStyle = '#9ca3af';
                ctx.lineWidth = 1.3;
                ctx.beginPath();
                ctx.moveTo(lfoBox.x + lfoBox.w + 2, lfoCY);
                ctx.lineTo(laneX - 3, laneCY);
                ctx.stroke();
                ctx.fillStyle = '#9ca3af';
                const angle = Math.atan2(laneCY - lfoCY, (laneX - 3) - (lfoBox.x + lfoBox.w + 2));
                ctx.save();
                ctx.translate(laneX - 3, laneCY);
                ctx.rotate(angle);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(-6, -3);
                ctx.lineTo(-6, 3);
                ctx.fill();
                ctx.restore();

                // Lane box
                ctx.fillStyle = '#fff';
                ctx.strokeStyle = '#e5e7eb';
                ctx.lineWidth = 1;
                drawRR(laneX, lane.y, laneW, laneH, 6);
                ctx.fill();
                ctx.stroke();

                // Destination + effect labels
                ctx.fillStyle = lane.color;
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText(lane.dest, laneX + 8, lane.y + 14);
                ctx.textAlign = 'right';
                ctx.fillText(lane.effect, laneX + laneW - 8, lane.y + 14);

                // Mini visual — only once the lane's own reveal has mostly finished
                const visX0 = laneX + 8;
                const visX1 = laneX + laneW - 8;
                const visW = visX1 - visX0;
                const visMidY = lane.y + 40;

                if (laneP > 0.9) {
                    ctx.strokeStyle = lane.color;
                    ctx.lineWidth = 1.5;

                    if (lane.dest === 'PITCH') {
                        // Wobbling pitch: fast audio-rate ripple riding up/down with the LFO
                        const centerOffset = sVal * 10;
                        ctx.beginPath();
                        for (let px = 0; px <= visW; px++) {
                            const nx = px / visW;
                            const y = visMidY + centerOffset - Math.sin(nx * 10 * Math.PI * 2) * 5;
                            if (px === 0) ctx.moveTo(visX0 + px, y);
                            else ctx.lineTo(visX0 + px, y);
                        }
                        ctx.stroke();
                    } else if (lane.dest === 'AMPLITUDE') {
                        // Pulsing loudness: fixed-pitch ripple whose amplitude scales with the LFO
                        const ampScale = 0.25 + 0.75 * (0.5 + 0.5 * sVal);
                        ctx.beginPath();
                        for (let px = 0; px <= visW; px++) {
                            const nx = px / visW;
                            const y = visMidY - Math.sin(nx * 10 * Math.PI * 2) * 9 * ampScale;
                            if (px === 0) ctx.moveTo(visX0 + px, y);
                            else ctx.lineTo(visX0 + px, y);
                        }
                        ctx.stroke();
                    } else {
                        // Wah: a low-pass response curve whose cutoff sweeps back and forth
                        const cutoffPos = 0.5 + sVal * 0.32;
                        ctx.beginPath();
                        for (let px = 0; px <= visW; px++) {
                            const nx = px / visW;
                            const diff = (nx - cutoffPos) * 9;
                            const gain = diff <= 0 ? 1 : 1 / (1 + diff * diff);
                            const y = visMidY + 9 - gain * 18;
                            if (px === 0) ctx.moveTo(visX0 + px, y);
                            else ctx.lineTo(visX0 + px, y);
                        }
                        ctx.stroke();
                    }
                }

                ctx.globalAlpha = 1;
            });

            // Phase indicator
            const phase = f < 100 ? 'LFO' : f < 200 ? 'Pitch' : f < 300 ? 'Amplitude' : f < 340 ? 'Filter' : 'Same LFO, 3 results';
            ctx.fillStyle = '#9ca3af';
            ctx.font = '8px -apple-system, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(phase, W - 20, H - 8);

            // Fade out
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
