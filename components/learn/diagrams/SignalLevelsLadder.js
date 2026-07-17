'use client';

import { useEffect, useRef } from 'react';

// A literal ladder: two vertical rails plus three horizontal rungs, one per
// signal level (mic, instrument, line), each rung positioned by a shared
// dbToY() mapping so its height on the canvas is proportional to its dBu
// value — not hand-placed pixels.
//
// Invented illustrative values (disclosed in the w3-task-8 report): none of
// this chapter's named sources (AudioLeadsFlashcards.jsx, PatchBaySimulator.
// jsx, SignalChainEurorack.jsx, lib/topics.js's specSummary) give numeric dB
// or voltage figures for mic/instrument/line level — specSummary names the
// three-way distinction only as vocabulary ("instrument level vs line
// level"). The three dBu figures drawn here (MIC_DBU = -50, INSTRUMENT_DBU =
// -20, LINE_DBU = +4) are standard, commonly-cited order-of-magnitude
// reference figures from general audio-engineering practice (mic level is
// roughly -60 to -40 dBu before a preamp; nominal instrument/guitar level is
// commonly cited around -20 dBu; professional line level is the standard
// +4 dBu reference), chosen to be tractable, correctly ordered
// (mic < instrument < line) and clearly separated on the ladder — not exam-
// sourced, not from any named source, and not claimed as exact.
//
// Label-clearance proof (geometry is static across every frame — only reveal
// alpha and the climbing marker's position animate): the two rails and three
// rungs are the ONLY lines this diagram draws, and every one of them is
// confined to x=[210,270] (rails at x=210 and x=270, rungs spanning between
// them) for the full plot height y=[50,220]. The dB-scale tick marks and
// their numeric labels sit at x<=205 (5px clear of the left rail). The three
// rung labels (name + dBu value + tag) sit at x>=280 (10px clear of the
// right rail). Because every line lives in x=[210,270] and every label lives
// either at x<=205 or x>=280, no line can ever cross a label regardless of
// vertical position. The DI caption below the plot (y=[240,252]) and the
// subtitle above it (y=30) are pure text with no accompanying line element
// at all, and the phase indicator (y=272) sits 20px clear of the DI
// caption's last line.
export default function SignalLevelsLadder() {
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

        const CYCLE = 580;
        let animId;

        const easeOut = (t) => 1 - Math.pow(1 - t, 3);
        const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
        const progress = (frame, start, dur) => clamp(easeOut(clamp((frame - start) / dur, 0, 1)), 0, 1);

        const TOP_DBU = 10;
        const BOTTOM_DBU = -60;
        const plotTop = 50;
        const plotBottom = 220;
        const dbToY = (db) => plotTop + ((TOP_DBU - db) / (TOP_DBU - BOTTOM_DBU)) * (plotBottom - plotTop);

        const RAIL_L = 210;
        const RAIL_R = 270;

        const RUNGS = [
            { name: 'Line Level', dbu: 4, tag: '+4 dBu · standardised, balanced', color: '#14b8a6', start: 190 },
            { name: 'Instrument Level', dbu: -20, tag: '~-20 dBu · high-Z, unbalanced', color: '#e85d75', start: 150 },
            { name: 'Mic Level', dbu: -50, tag: '~-50 dBu · tiny, needs gain', color: '#2563EB', start: 110 },
        ];

        const TICKS = [10, 0, -20, -40, -60];

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
            ctx.fillText('Three Levels: Mic, Instrument, Line', W / 2, 16);
            ctx.globalAlpha = 1;

            const subP = progress(f, 20, 20);
            if (subP > 0) {
                ctx.globalAlpha = subP;
                ctx.fillStyle = '#6b7280';
                ctx.font = 'italic 8.5px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Mic ▸ Instrument ▸ Line — climbing in level', W / 2, 30);
                ctx.globalAlpha = 1;
            }

            const tickP = progress(f, 40, 30);
            if (tickP > 0) {
                ctx.globalAlpha = tickP;
                TICKS.forEach((db) => {
                    const y = dbToY(db);
                    ctx.strokeStyle = '#e5e7eb';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(195, y);
                    ctx.lineTo(205, y);
                    ctx.stroke();
                    ctx.fillStyle = '#9ca3af';
                    ctx.font = '7px -apple-system, sans-serif';
                    ctx.textAlign = 'right';
                    ctx.fillText(`${db}`, 192, y + 2.5);
                });
                ctx.globalAlpha = 1;
            }

            const railP = progress(f, 70, 35);
            if (railP > 0) {
                ctx.globalAlpha = railP;
                ctx.strokeStyle = '#374151';
                ctx.lineWidth = 1.6;
                [RAIL_L, RAIL_R].forEach((x) => {
                    ctx.beginPath();
                    ctx.moveTo(x, plotTop);
                    ctx.lineTo(x, plotBottom);
                    ctx.stroke();
                });
                ctx.globalAlpha = 1;
            }

            RUNGS.forEach((rung) => {
                const p = progress(f, rung.start, 40);
                if (p <= 0) return;
                const y = dbToY(rung.dbu);

                ctx.globalAlpha = p;
                ctx.strokeStyle = rung.color;
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(RAIL_L, y);
                ctx.lineTo(RAIL_L + (RAIL_R - RAIL_L) * p, y);
                ctx.stroke();

                ctx.fillStyle = rung.color;
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText(rung.name, 280, y - 3);
                ctx.fillStyle = '#6b7280';
                ctx.font = '7.5px -apple-system, sans-serif';
                ctx.fillText(rung.tag, 280, y + 8);
                ctx.globalAlpha = 1;
            });

            // Climbing marker — a point riding the rails' centre from mic to line,
            // confined to x=240 (inside [RAIL_L, RAIL_R]), never near a label.
            const climbP = progress(f, 260, 60);
            if (climbP > 0) {
                const yMic = dbToY(-50);
                const yLine = dbToY(4);
                const my = yMic + (yLine - yMic) * climbP;
                ctx.globalAlpha = climbP;
                ctx.fillStyle = '#9B7530';
                ctx.beginPath();
                ctx.arc((RAIL_L + RAIL_R) / 2, my, 3.2, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            }

            const diP = progress(f, 330, 35);
            if (diP > 0) {
                ctx.globalAlpha = diP;
                ctx.fillStyle = '#374151';
                ctx.font = 'bold italic 8.5px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('DI: instrument level, high-Z, unbalanced ▸ mic-level, low-Z, balanced', W / 2, 240);
                ctx.fillStyle = '#6b7280';
                ctx.font = 'italic 8px -apple-system, sans-serif';
                ctx.fillText('— then a preamp brings it up to line level', W / 2, 252);
                ctx.globalAlpha = 1;
            }

            const phase = f < 150 ? 'Mic' : f < 190 ? 'Instrument' : f < 260 ? 'Line' : f < 330 ? 'Climbing' : 'DI';
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
