'use client';

import { useEffect, useRef } from 'react';

// Three lanes, one shared recording. Bar length = 1/speedRatio × BASE_PX (BASE_PX=90 is
// the only illustrative constant here — "1 length unit" has no real ms value, disclosed
// as such). speedRatio 2/1/0.5 gives length ratios 0.5/1/2 exactly, and semitone shift =
// 12·log2(speedRatio) gives +12/0/-12 exactly — both are the row's own "half speed = twice
// as long, octave down" arithmetic, verified as exact powers of two (log2(2)=1, log2(0.5)
// =-1), never approximated. Each bar is filled with the SAME tiny waveform function
// (tinyWave(u)=sin(2π·4·u), N_CYCLES=4 illustrative — "the same few cycles," not a real
// frequency) stretched or squeezed to that bar's own pixel length, so "same recording,
// different duration" is drawn, not just stated.
//
// Label-clearance: lane bars sit in their own y-bands (lane1 y=[50,68], lane2 y=[100,118],
// lane3 y=[150,168]); every lane label sits >=6px outside its own band (labelY 44/94/144
// are 6px above each band top) and >=26px from the adjacent lane's band. The arithmetic
// strip (y=195) and closing caption (y=218) both sit below the lowest bar bottom (168)
// with >=27px clearance, and above the phase indicator (H-8=272) with >=54px clearance.
export default function SpeedPitchLink() {
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

        const X0 = 90;
        const BASE_PX = 90; // pixels per "1 length unit" — illustrative, no real ms value
        const N_CYCLES = 4; // illustrative "same few cycles" — not a real frequency
        const BAR_H = 18;

        const tinyWave = (u) => Math.sin(u * 2 * Math.PI * N_CYCLES);

        const LANES = [
            { speed: 2, y: 50, labelY: 44, color: '#14b8a6', speedLabel: '2× speed', pitchLabel: '+12 semitones (1 octave up)' },
            { speed: 1, y: 100, labelY: 94, color: '#374151', speedLabel: '1× (original)', pitchLabel: 'pitch unchanged' },
            { speed: 0.5, y: 150, labelY: 144, color: '#DCC892', speedLabel: '0.5× speed', pitchLabel: '−12 semitones (1 octave down)' },
        ].map((lane) => ({
            ...lane,
            length: BASE_PX / lane.speed,
            semitones: 12 * Math.log2(lane.speed),
        }));

        const PHASE = LANES.map((_, i) => ({
            grow: 40 + i * 90,
            label: 40 + i * 90,
            pitch: 85 + i * 90,
        }));
        const PHASE_STRIP = 310;
        const PHASE_CAPTION = 335;

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
            ctx.fillText('Speed and Pitch Move Together', W / 2, 16);
            ctx.globalAlpha = 1;

            const subP = progress(f, 15, 20);
            if (subP > 0) {
                ctx.globalAlpha = subP;
                ctx.fillStyle = '#6b7280';
                ctx.font = 'italic 8.5px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('One recording, three playback speeds', W / 2, 32);
                ctx.globalAlpha = 1;
            }

            LANES.forEach((lane, i) => {
                const ph = PHASE[i];

                const labelP = progress(f, ph.label, 20);
                if (labelP > 0) {
                    ctx.globalAlpha = labelP;
                    ctx.fillStyle = lane.color === '#DCC892' ? '#9B7530' : lane.color;
                    ctx.font = 'bold 9px -apple-system, sans-serif';
                    ctx.textAlign = 'right';
                    ctx.fillText(lane.speedLabel, X0 - 8, lane.y + BAR_H / 2 + 3);
                    ctx.globalAlpha = 1;
                }

                const growP = progress(f, ph.grow, 35);
                if (growP > 0) {
                    const curLen = lane.length * growP;
                    ctx.save();
                    ctx.beginPath();
                    ctx.rect(X0, lane.y, curLen, BAR_H);
                    ctx.clip();
                    ctx.globalAlpha = growP;
                    ctx.fillStyle = lane.color;
                    ctx.globalAlpha = growP * 0.18;
                    ctx.fillRect(X0, lane.y, lane.length, BAR_H);
                    ctx.globalAlpha = growP;
                    ctx.strokeStyle = lane.color;
                    ctx.lineWidth = 1.6;
                    ctx.beginPath();
                    const midY = lane.y + BAR_H / 2;
                    const amp = BAR_H / 2 - 3;
                    const N = 60;
                    for (let s = 0; s <= N; s++) {
                        const u = s / N;
                        const x = X0 + u * lane.length;
                        const y = midY - amp * tinyWave(u);
                        if (s === 0) ctx.moveTo(x, y);
                        else ctx.lineTo(x, y);
                    }
                    ctx.stroke();
                    ctx.restore();
                    ctx.globalAlpha = 1;

                    ctx.globalAlpha = growP;
                    ctx.strokeStyle = lane.color;
                    ctx.lineWidth = 1;
                    ctx.strokeRect(X0, lane.y, curLen, BAR_H);
                    ctx.globalAlpha = 1;
                }

                const pitchP = progress(f, ph.pitch, 20);
                if (pitchP > 0) {
                    ctx.globalAlpha = pitchP;
                    ctx.fillStyle = lane.color === '#DCC892' ? '#9B7530' : lane.color;
                    ctx.font = '8.5px -apple-system, sans-serif';
                    ctx.textAlign = 'left';
                    ctx.fillText(lane.pitchLabel, X0 + lane.length + 8, lane.y + BAR_H / 2 + 3);
                    ctx.globalAlpha = 1;
                }
            });

            const stripP = progress(f, PHASE_STRIP, 25);
            if (stripP > 0) {
                ctx.globalAlpha = stripP;
                ctx.fillStyle = '#374151';
                ctx.font = 'bold 8.5px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('×2 → ½ length   |   ×1 → 1 length   |   ×0.5 → 2× length', W / 2, 195);
                ctx.globalAlpha = 1;
            }

            const capP = progress(f, PHASE_CAPTION, 25);
            if (capP > 0) {
                ctx.globalAlpha = capP;
                ctx.fillStyle = '#374151';
                ctx.font = 'italic 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Large transpositions drag timbre with them: chipmunk up, slow motion down', W / 2, 218);
                ctx.globalAlpha = 1;
            }

            const phase = f < PHASE[1].grow ? '2× speed' : f < PHASE[2].grow ? '1× original' : f < PHASE_STRIP ? '0.5× speed' : 'Compare';
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
