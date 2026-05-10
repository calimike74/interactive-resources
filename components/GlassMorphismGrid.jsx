'use client';

import { useEffect, useRef } from 'react';

/**
 * GlassMorphismGrid — hand-crafted Canvas 2D interactive grid.
 * Cursor reveals colour zones across squircle tiles with subsurface
 * scattering, light bleed, frosted-veil distance falloff and edge AO.
 *
 * Adapted from prototypes/glass-morphism-grid.html (Feb 2026).
 *
 * Container-aware: sizes to its parent (not the viewport), so it can
 * be used as a hero strip rather than a full-page background.
 */
export default function GlassMorphismGrid({
    rows = 4,
    cols = 14,
    revealRadius = 280,
    corner = 22,
    crevice = 5,
    minCell = 70,
    maxCell = 130,
}) {
    const wrapperRef = useRef(null);
    const canvasRef = useRef(null);

    useEffect(() => {
        const wrapper = wrapperRef.current;
        const canvas = canvasRef.current;
        if (!wrapper || !canvas) return;
        const ctx = canvas.getContext('2d');

        let W = 1, H = 1, dpr = 1;
        let mouseX = -9999, mouseY = -9999;
        let smX = -9999, smY = -9999;
        let bloomX = -9999, bloomY = -9999;
        let time = 0;
        let CELL = minCell;
        let rafId = null;

        // Three colour zones (preserved from prototype — golden / chartreuse / amber)
        const ZONES = [
            { bright: { h: 50, s: 92, l: 68 }, mid: { h: 35, s: 75, l: 52 }, dark: { h: 28, s: 60, l: 36 }, milky: { h: 40, s: 28, l: 84 } },
            { bright: { h: 72, s: 88, l: 58 }, mid: { h: 78, s: 50, l: 48 }, dark: { h: 65, s: 38, l: 32 }, milky: { h: 70, s: 16, l: 82 } },
            { bright: { h: 42, s: 95, l: 62 }, mid: { h: 25, s: 82, l: 48 }, dark: { h: 15, s: 65, l: 34 }, milky: { h: 30, s: 20, l: 88 } },
        ];

        function noise2D(x, y) {
            const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
            return s - Math.floor(s);
        }
        function smoothNoise(x, y) {
            const ix = Math.floor(x), iy = Math.floor(y);
            const fx = x - ix, fy = y - iy;
            const sx = fx * fx * (3 - 2 * fx);
            const sy = fy * fy * (3 - 2 * fy);
            const a = noise2D(ix, iy), b = noise2D(ix + 1, iy);
            const c = noise2D(ix, iy + 1), d = noise2D(ix + 1, iy + 1);
            return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
        }

        const cubeData = [];
        for (let r = 0; r < rows; r++) {
            cubeData[r] = [];
            for (let c = 0; c < cols; c++) {
                const n1 = smoothNoise(r * 0.8, c * 0.8);
                const n2 = smoothNoise(r * 1.2 + 30, c * 1.2 + 30);
                const n3 = smoothNoise(r * 0.5 + 70, c * 0.5 + 70);
                const parity = ((r + c) % 3);
                let role;
                if (parity === 0) role = n1 > 0.5 ? 0 : 1;
                else if (parity === 1) role = n2 > 0.4 ? 2 : 1;
                else role = n3 > 0.6 ? 3 : (n1 > 0.3 ? 1 : 0);
                cubeData[r][c] = {
                    role,
                    hueNoise: (n2 - 0.5) * 8,
                    satNoise: (n3 - 0.5) * 10,
                    lightNoise: (n1 - 0.5) * 5,
                    morphPhase: n1 * Math.PI * 2,
                };
            }
        }

        function getZoneBlend() {
            const nx = Math.max(0, Math.min(1, smX / W));
            const ny = Math.max(0, Math.min(1, smY / H));
            const td = time * 0.00008;
            const wA = Math.max(0, 1 - Math.sqrt((nx - 0.2) ** 2 + (ny - 0.5) ** 2) * 2.2 + Math.sin(td) * 0.3);
            const wB = Math.max(0, 1 - Math.sqrt((nx - 0.8) ** 2 + (ny - 0.3) ** 2) * 2.2 + Math.sin(td + 2) * 0.3);
            const wC = Math.max(0, 1 - Math.sqrt((nx - 0.5) ** 2 + (ny - 0.8) ** 2) * 2.2 + Math.sin(td + 4) * 0.3);
            const total = wA + wB + wC + 0.001;
            return { a: wA / total, b: wB / total, c: wC / total };
        }

        function blendZoneColour(role, zw) {
            const keys = ['bright', 'mid', 'dark', 'milky'];
            const k = keys[role];
            return {
                h: ZONES[0][k].h * zw.a + ZONES[1][k].h * zw.b + ZONES[2][k].h * zw.c,
                s: ZONES[0][k].s * zw.a + ZONES[1][k].s * zw.b + ZONES[2][k].s * zw.c,
                l: ZONES[0][k].l * zw.a + ZONES[1][k].l * zw.b + ZONES[2][k].l * zw.c,
            };
        }

        function proximityFalloff(raw) {
            if (raw < 0.1) return raw * 0.2;
            if (raw < 0.3) return 0.02 + (raw - 0.1) * 0.45;
            return 0.11 + (raw - 0.3) * 1.27;
        }

        function squircle(x, y, w, h, r) {
            r = Math.min(r, w / 2, h / 2);
            const k = 0.55228;
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + w - r, y);
            ctx.bezierCurveTo(x + w - r * (1 - k), y, x + w, y + r * (1 - k), x + w, y + r);
            ctx.lineTo(x + w, y + h - r);
            ctx.bezierCurveTo(x + w, y + h - r * (1 - k), x + w - r * (1 - k), y + h, x + w - r, y + h);
            ctx.lineTo(x + r, y + h);
            ctx.bezierCurveTo(x + r * (1 - k), y + h, x, y + h - r * (1 - k), x, y + h - r);
            ctx.lineTo(x, y + r);
            ctx.bezierCurveTo(x, y + r * (1 - k), x + r * (1 - k), y, x + r, y);
            ctx.closePath();
        }

        function drawTile(fx, fy, size, row, col, rawProximity, zw) {
            const pp = proximityFalloff(rawProximity);
            if (pp < 0.005) return;
            const cd = cubeData[row][col];
            const baseCol = blendZoneColour(cd.role, zw);
            const tShift = Math.sin(time * 0.0003 + cd.morphPhase) * 3;
            const h = baseCol.h + cd.hueNoise + tShift;
            const s = baseCol.s + cd.satNoise;
            const l = baseCol.l + cd.lightNoise;

            const half = crevice / 2;
            const bx = fx + half;
            const by = fy + half;
            const bs = size - crevice;
            const cx = bx + bs / 2;
            const cy = by + bs / 2;

            const lx = smX - cx;
            const ly = smY - cy;
            const lDist = Math.sqrt(lx * lx + ly * ly) || 1;
            const lnx = lx / lDist;
            const lny = ly / lDist;
            const sssX = cx - lnx * bs * 0.25;
            const sssY = cy - lny * bs * 0.25;

            const brightness = 0.2 + pp * 0.8;
            const bodyS = s * (0.1 + pp * 0.9);
            const bodyL = 92 - (92 - l) * brightness;

            if (pp > 0.05) {
                ctx.save();
                squircle(fx + 1, fy + 1, size - 2, size - 2, corner + 1);
                ctx.fillStyle = `hsla(${h - 6}, ${Math.min(55, s * 0.6)}%, 12%, ${pp * 0.18})`;
                ctx.fill();
                ctx.restore();
            }

            squircle(bx, by, bs, bs, corner);
            const fGrd = ctx.createRadialGradient(cx, cy, 0, cx, cy, bs * 0.6);
            fGrd.addColorStop(0, `hsla(${h}, ${bodyS}%, ${bodyL - 5}%, ${pp * 0.96})`);
            fGrd.addColorStop(0.5, `hsla(${h + 1}, ${bodyS * 0.95}%, ${bodyL - 1}%, ${pp * 0.92})`);
            fGrd.addColorStop(0.8, `hsla(${h + 3}, ${bodyS * 0.65}%, ${bodyL + 6}%, ${pp * 0.82})`);
            fGrd.addColorStop(1, `hsla(${h + 5}, ${bodyS * 0.35}%, ${bodyL + 14}%, ${pp * 0.6})`);
            ctx.fillStyle = fGrd;
            ctx.fill();

            squircle(bx, by, bs, bs, corner);
            const dGrd = ctx.createLinearGradient(bx, by, bx + bs, by + bs);
            dGrd.addColorStop(0, `hsla(${h + 5}, ${bodyS * 0.4}%, ${bodyL + 4}%, ${pp * 0.12})`);
            dGrd.addColorStop(0.5, 'hsla(0, 0%, 50%, 0)');
            dGrd.addColorStop(1, `hsla(${h - 4}, ${bodyS * 0.35}%, ${bodyL - 8}%, ${pp * 0.1})`);
            ctx.fillStyle = dGrd;
            ctx.fill();

            if (pp > 0.05) {
                ctx.save();
                squircle(bx, by, bs, bs, corner);
                ctx.clip();
                const sssI = Math.pow(pp, 0.7);
                const sss1 = ctx.createRadialGradient(sssX, sssY, 0, cx, cy, bs * 0.7);
                sss1.addColorStop(0, `hsla(${h + 8}, ${Math.min(100, s + 30)}%, ${Math.min(92, l + 22)}%, ${sssI * 0.6})`);
                sss1.addColorStop(0.2, `hsla(${h + 5}, ${Math.min(100, s + 18)}%, ${l + 14}%, ${sssI * 0.38})`);
                sss1.addColorStop(0.5, `hsla(${h + 2}, ${s}%, ${l + 5}%, ${sssI * 0.12})`);
                sss1.addColorStop(1, 'hsla(40, 25%, 60%, 0)');
                ctx.fillStyle = sss1;
                ctx.fillRect(bx, by, bs, bs);

                const sss2 = ctx.createRadialGradient(
                    sssX + lnx * bs * 0.1, sssY + lny * bs * 0.1, 0,
                    cx, cy, bs * 0.5
                );
                sss2.addColorStop(0, `hsla(${h - 12}, ${Math.min(100, s + 20)}%, ${l - 2}%, ${sssI * 0.22})`);
                sss2.addColorStop(0.5, `hsla(${h - 7}, ${s * 0.5}%, ${l + 2}%, ${sssI * 0.06})`);
                sss2.addColorStop(1, 'hsla(25, 20%, 40%, 0)');
                ctx.fillStyle = sss2;
                ctx.fillRect(bx, by, bs, bs);
                ctx.restore();
            }

            if (pp > 0.2 && cd.role <= 1) {
                const bleedR = bs * 0.2;
                const bleedA = (pp - 0.2) * 0.15;
                ctx.save();
                const bg = ctx.createRadialGradient(cx, cy, bs * 0.4, cx, cy, bs * 0.65);
                bg.addColorStop(0, `hsla(${h}, ${s * 0.8}%, ${l + 12}%, ${bleedA})`);
                bg.addColorStop(1, `hsla(${h}, ${s * 0.4}%, ${l + 15}%, 0)`);
                ctx.fillStyle = bg;
                ctx.fillRect(fx - bleedR, fy - bleedR, size + bleedR * 2, size + bleedR * 2);
                ctx.restore();
            }

            if (pp > 0.1) {
                ctx.save();
                squircle(bx, by, bs, bs, corner);
                ctx.clip();
                const tGrd = ctx.createRadialGradient(smX, smY, 0, smX, smY, revealRadius * 0.5);
                tGrd.addColorStop(0, `hsla(${h + 6}, 100%, 90%, ${pp * 0.28})`);
                tGrd.addColorStop(0.15, `hsla(${h + 3}, 85%, 80%, ${pp * 0.14})`);
                tGrd.addColorStop(0.4, `hsla(${h}, 55%, 68%, ${pp * 0.04})`);
                tGrd.addColorStop(1, 'hsla(40, 20%, 55%, 0)');
                ctx.fillStyle = tGrd;
                ctx.fillRect(bx - CELL, by - CELL, bs + CELL * 2, bs + CELL * 2);
                ctx.restore();
            }

            if (pp < 0.55) {
                ctx.save();
                squircle(bx, by, bs, bs, corner);
                ctx.clip();
                const veil = (1 - pp / 0.55) * 0.45;
                ctx.fillStyle = `hsla(${h + 5}, 8%, 96%, ${veil})`;
                ctx.fillRect(bx, by, bs, bs);
                ctx.restore();
            }

            ctx.save();
            squircle(bx, by, bs, bs, corner);
            ctx.clip();
            const shGrd = ctx.createLinearGradient(bx, by, bx, by + bs * 0.5);
            shGrd.addColorStop(0, `hsla(${h + 5}, 15%, 98%, ${pp * 0.12})`);
            shGrd.addColorStop(0.12, `hsla(${h + 3}, 10%, 96%, ${pp * 0.04})`);
            shGrd.addColorStop(0.35, 'hsla(40, 6%, 94%, 0)');
            ctx.fillStyle = shGrd;
            ctx.fillRect(bx, by, bs, bs * 0.5);
            ctx.restore();

            if (pp > 0.06) {
                ctx.save();
                squircle(bx, by, bs, bs, corner);
                ctx.clip();
                const aoStrength = pp * 0.16;
                const biGrd = ctx.createLinearGradient(bx, by + bs - 16, bx, by + bs);
                biGrd.addColorStop(0, 'hsla(0, 0%, 0%, 0)');
                biGrd.addColorStop(1, `hsla(${h - 8}, ${s * 0.45}%, 15%, ${aoStrength})`);
                ctx.fillStyle = biGrd;
                ctx.fillRect(bx, by + bs - 16, bs, 16);

                const riGrd = ctx.createLinearGradient(bx + bs - 12, by, bx + bs, by);
                riGrd.addColorStop(0, 'hsla(0, 0%, 0%, 0)');
                riGrd.addColorStop(1, `hsla(${h - 5}, ${s * 0.35}%, 16%, ${aoStrength * 0.75})`);
                ctx.fillStyle = riGrd;
                ctx.fillRect(bx + bs - 12, by, 12, bs);

                const tiGrd = ctx.createLinearGradient(bx, by, bx, by + 10);
                tiGrd.addColorStop(0, `hsla(${h}, ${s * 0.25}%, 20%, ${aoStrength * 0.4})`);
                tiGrd.addColorStop(1, 'hsla(0, 0%, 30%, 0)');
                ctx.fillStyle = tiGrd;
                ctx.fillRect(bx, by, bs, 10);

                const liGrd = ctx.createLinearGradient(bx, by, bx + 8, by);
                liGrd.addColorStop(0, `hsla(${h - 3}, ${s * 0.2}%, 18%, ${aoStrength * 0.45})`);
                liGrd.addColorStop(1, 'hsla(0, 0%, 28%, 0)');
                ctx.fillStyle = liGrd;
                ctx.fillRect(bx, by, 8, bs);
                ctx.restore();
            }
        }

        function draw(t) {
            time = t;
            smX += (mouseX - smX) * 0.1;
            smY += (mouseY - smY) * 0.1;
            bloomX += (mouseX - bloomX) * 0.05;
            bloomY += (mouseY - bloomY) * 0.05;

            ctx.clearRect(0, 0, W, H);

            const totalW = cols * CELL;
            const totalH = rows * CELL;
            const gridX = (W - totalW) / 2;
            const gridY = (H - totalH) / 2;

            const zw = getZoneBlend();

            const bH = 50 * zw.a + 72 * zw.b + 35 * zw.c;
            const bS = 85 * zw.a + 75 * zw.b + 90 * zw.c;
            const bL = 68 * zw.a + 58 * zw.b + 62 * zw.c;

            const wash1 = ctx.createRadialGradient(bloomX, bloomY, 0, bloomX, bloomY, revealRadius * 1.3);
            wash1.addColorStop(0, `hsla(${bH - 6}, ${bS}%, ${bL - 30}%, 0.95)`);
            wash1.addColorStop(0.1, `hsla(${bH - 5}, ${bS}%, ${bL - 26}%, 0.88)`);
            wash1.addColorStop(0.2, `hsla(${bH - 4}, ${bS * 0.95}%, ${bL - 20}%, 0.72)`);
            wash1.addColorStop(0.32, `hsla(${bH - 3}, ${bS * 0.9}%, ${bL - 12}%, 0.5)`);
            wash1.addColorStop(0.45, `hsla(${bH - 1}, ${bS * 0.75}%, ${bL - 4}%, 0.3)`);
            wash1.addColorStop(0.6, `hsla(${bH + 1}, ${bS * 0.5}%, ${bL + 8}%, 0.14)`);
            wash1.addColorStop(0.78, `hsla(${bH + 3}, ${bS * 0.25}%, ${bL + 18}%, 0.04)`);
            wash1.addColorStop(1, 'hsla(40, 10%, 88%, 0)');
            ctx.fillStyle = wash1;
            ctx.fillRect(0, 0, W, H);

            const darkPool = CELL * 2.5;
            const wash2 = ctx.createRadialGradient(bloomX, bloomY, 0, bloomX, bloomY, darkPool);
            wash2.addColorStop(0, `hsla(${bH - 10}, ${Math.min(100, bS + 12)}%, ${bL - 35}%, 0.65)`);
            wash2.addColorStop(0.2, `hsla(${bH - 7}, ${Math.min(100, bS + 5)}%, ${bL - 26}%, 0.45)`);
            wash2.addColorStop(0.45, `hsla(${bH - 4}, ${bS}%, ${bL - 16}%, 0.22)`);
            wash2.addColorStop(0.7, `hsla(${bH - 2}, ${bS * 0.7}%, ${bL - 6}%, 0.08)`);
            wash2.addColorStop(1, `hsla(${bH}, ${bS * 0.3}%, ${bL}%, 0)`);
            ctx.fillStyle = wash2;
            ctx.fillRect(0, 0, W, H);

            const tiles = [];
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    const x = gridX + col * CELL;
                    const y = gridY + row * CELL;
                    const ccx = x + CELL / 2;
                    const ccy = y + CELL / 2;
                    const dx = smX - ccx;
                    const dy = smY - ccy;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const proximity = Math.max(0, 1 - dist / revealRadius);
                    if (proximity < 0.02) continue;
                    tiles.push({ x, y, row, col, proximity });
                }
            }
            tiles.sort((a, b) => a.proximity - b.proximity);
            for (const tile of tiles) {
                drawTile(tile.x, tile.y, CELL, tile.row, tile.col, tile.proximity, zw);
            }

            const hazeGrd = ctx.createRadialGradient(smX, smY, revealRadius * 0.06, smX, smY, revealRadius * 1.1);
            hazeGrd.addColorStop(0, 'hsla(0, 0%, 100%, 0)');
            hazeGrd.addColorStop(0.18, `hsla(${bH}, ${bS * 0.15}%, 96%, 0.02)`);
            hazeGrd.addColorStop(0.38, `hsla(${bH}, ${bS * 0.1}%, 96%, 0.12)`);
            hazeGrd.addColorStop(0.58, `hsla(${bH}, ${bS * 0.06}%, 97%, 0.35)`);
            hazeGrd.addColorStop(0.75, 'hsla(40, 3%, 98%, 0.65)');
            hazeGrd.addColorStop(0.88, 'hsla(0, 0%, 99%, 0.85)');
            hazeGrd.addColorStop(1, 'hsla(0, 0%, 100%, 0.97)');
            ctx.fillStyle = hazeGrd;
            ctx.fillRect(0, 0, W, H);

            rafId = requestAnimationFrame(draw);
        }

        function resize() {
            const rect = wrapper.getBoundingClientRect();
            dpr = window.devicePixelRatio || 1;
            W = Math.max(1, rect.width);
            H = Math.max(1, rect.height);
            canvas.width = W * dpr;
            canvas.height = H * dpr;
            canvas.style.width = W + 'px';
            canvas.style.height = H + 'px';
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            // Fit cell to container
            CELL = Math.max(minCell, Math.min(maxCell, Math.min(W / (cols * 0.85), H / (rows * 0.85))));
        }

        function onMouseMove(e) {
            const rect = wrapper.getBoundingClientRect();
            mouseX = e.clientX - rect.left;
            mouseY = e.clientY - rect.top;
        }
        function onMouseLeave() {
            mouseX = -9999;
            mouseY = -9999;
        }

        const ro = new ResizeObserver(resize);
        ro.observe(wrapper);
        resize();

        wrapper.addEventListener('mousemove', onMouseMove);
        wrapper.addEventListener('mouseleave', onMouseLeave);

        rafId = requestAnimationFrame(draw);

        return () => {
            cancelAnimationFrame(rafId);
            ro.disconnect();
            wrapper.removeEventListener('mousemove', onMouseMove);
            wrapper.removeEventListener('mouseleave', onMouseLeave);
        };
    }, [rows, cols, revealRadius, corner, crevice, minCell, maxCell]);

    return (
        <div
            ref={wrapperRef}
            aria-hidden="true"
            style={{
                position: 'absolute',
                inset: 0,
                overflow: 'hidden',
                pointerEvents: 'auto',
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    display: 'block',
                    width: '100%',
                    height: '100%',
                }}
            />
        </div>
    );
}
