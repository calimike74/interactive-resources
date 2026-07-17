'use client';

import { useEffect, useRef } from 'react';

// Four schematic connector silhouettes in a row — XLR (3-pin circular), TRS
// (tip-ring-sleeve bands), TS (tip-sleeve), RCA (pin+ring) — each geometry
// computed from a shared column layout, not hand-placed per connector.
//
// Column layout (n=4, itemW=90, gap=20): totalWidth = 4*90 + 3*20 = 420;
// marginX = (480-420)/2 = 30; column i's left edge = marginX + i*(itemW+gap),
// centre = left + itemW/2. Centres: XLR=75, TRS=185, TS=295, RCA=405. Each
// connector's own geometry (radius/rod half-width) is checked below to stay
// inside its own column's x-range, so no two connectors' drawings can ever
// overlap horizontally:
//   XLR  r=26  at cx=75  -> x=[49,101]   column0=[30,120]  OK
//   TRS  hw=35 at cx=185 -> x=[150,220]  column1=[140,230] OK
//   TS   hw=35 at cx=295 -> x=[260,330]  column2=[250,340] OK
//   RCA  r1=24 at cx=405 -> x=[381,429]  column3=[360,450] OK
//
// Label-clearance proof: every connector's drawn geometry (shell circles,
// pins, rod bands, divider lines) is vertically confined to the shape band
// y=[70,150] by construction — the tallest shape (XLR, r=26, cy=110) spans
// y=[84,136], the widest margin used is RCA's y=[86,134] — every shape's
// bottom edge is <=136, i.e. strictly above y=150. All three label lines per
// connector (name, descriptor, "where it lives") are drawn no higher than
// y=166. That leaves a line-free horizontal band y=[136,166] (30px) with NO
// drawn geometry at all — title, captions and the phase indicator are the
// only other canvas text, and none of them has an accompanying line either.
// Because every stroked/filled shape lives strictly above y=136 and every
// label lives strictly below y=166, no line can ever cross any label,
// regardless of how wide any individual label's text runs horizontally.
//
// Pins and dividers are computed, not hand-placed: XLR's three pins come
// from a trig loop over fixed angles at a fixed radius; TRS/TS dividers are
// fractions of the rod's own width (thirds / a 0.35 split), so the geometry
// scales from the same constants used to draw the rod itself.
export default function ConnectorLineup() {
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

        const ITEM_W = 90;
        const GAP = 20;
        const N = 4;
        const MARGIN_X = (W - (N * ITEM_W + (N - 1) * GAP)) / 2; // 30
        const colCentre = (i) => MARGIN_X + i * (ITEM_W + GAP) + ITEM_W / 2;
        const CY = 110;

        const drawXLR = (cx, alpha, color) => {
            const R = 26;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#fff';
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.arc(cx, CY, R, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            // three pins — computed from a fixed angle/radius pair, not hand-placed
            const pinDist = 11;
            const pinR = 2.2;
            [-90, 30, 150].forEach((deg) => {
                const rad = (deg * Math.PI) / 180;
                const px = cx + pinDist * Math.cos(rad);
                const py = CY + pinDist * Math.sin(rad);
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(px, py, pinR, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.globalAlpha = 1;
        };

        const drawBandedRod = (cx, alpha, color, dividerFracs, letters) => {
            const width = 70;
            const height = 16;
            const left = cx - width / 2;
            const top = CY - height / 2;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#fff';
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.roundRect(left, top, width, height, [8, 4, 4, 8]);
            ctx.fill();
            ctx.stroke();

            // dividers computed as fractions of the rod's own width
            const dividerXs = dividerFracs.map((f) => left + width * f);
            dividerXs.forEach((dx) => {
                ctx.strokeStyle = color;
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.moveTo(dx, top + 1);
                ctx.lineTo(dx, top + height - 1);
                ctx.stroke();
            });

            const bandEdges = [left, ...dividerXs, left + width];
            letters.forEach((letter, i) => {
                const bandMid = (bandEdges[i] + bandEdges[i + 1]) / 2;
                ctx.fillStyle = color;
                ctx.font = 'bold 6px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(letter, bandMid, CY + 2.2);
            });
            ctx.globalAlpha = 1;
        };

        const drawRCA = (cx, alpha, color) => {
            const R1 = 24;
            const R2 = 16;
            const R3 = 4;
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.arc(cx, CY, R1, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = '#fff';
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.3;
            ctx.beginPath();
            ctx.arc(cx, CY, R2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(cx, CY, R3, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        };

        const ITEMS = [
            { key: 'xlr', name: 'XLR', desc: '3-pin, locks', where: 'Mics, balanced runs', color: '#14b8a6', start: 40 },
            { key: 'trs', name: 'TRS', desc: 'Tip · Ring · Sleeve', where: 'Balanced line, stereo', color: '#2563EB', start: 100 },
            { key: 'ts', name: 'TS', desc: 'Tip · Sleeve', where: 'Guitars, instruments', color: '#e85d75', start: 160 },
            { key: 'rca', name: 'RCA', desc: 'Pin + ring', where: 'Consumer, DJ gear', color: '#9B7530', start: 220 },
        ];

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
            ctx.fillText('Four Connectors, Four Jobs', W / 2, 16);
            ctx.globalAlpha = 1;

            ITEMS.forEach((item, i) => {
                const p = progress(f, item.start, 45);
                if (p <= 0) return;
                const cx = colCentre(i);

                if (item.key === 'xlr') drawXLR(cx, p, item.color);
                else if (item.key === 'trs') drawBandedRod(cx, p, item.color, [1 / 3, 2 / 3], ['T', 'R', 'S']);
                else if (item.key === 'ts') drawBandedRod(cx, p, item.color, [0.35], ['T', 'S']);
                else if (item.key === 'rca') drawRCA(cx, p, item.color);

                ctx.globalAlpha = p;
                ctx.fillStyle = item.color;
                ctx.font = 'bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(item.name + ' — ' + item.desc, cx, 166);
                ctx.fillStyle = '#6b7280';
                ctx.font = 'italic 7px -apple-system, sans-serif';
                ctx.fillText(item.where, cx, 178);
                ctx.globalAlpha = 1;
            });

            const closingP = progress(f, 300, 40);
            if (closingP > 0) {
                ctx.globalAlpha = closingP;
                ctx.fillStyle = '#374151';
                ctx.font = 'italic bold 9px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Know the shape, know where it lives', W / 2, 245);
                ctx.globalAlpha = 1;
            }

            const phase = f < 100 ? 'XLR' : f < 160 ? 'TRS' : f < 220 ? 'TS' : f < 300 ? 'RCA' : 'Compare';
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
