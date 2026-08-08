'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';

// ============================================
// WAVEFORM DRAWING EXPLORER
// Free-play practice — no login, no submission
// 10 challenges with Show Answer toggle
// ============================================

// ─── House Design Tokens (Botanical Press — see app/globals.css @theme) ─────
const HOUSE = {
    bg: '#F2EBE0',            // cream page ground
    surface: '#F8F2E8',       // paper card
    ink: '#1F2A1C',
    inkMuted: 'rgba(31,42,28,0.62)',
    inkFaint: 'rgba(31,42,28,0.42)',
    border: '#D4C9B4',
    accent: '#B85A3F',        // sienna — primary action
    accentHover: '#95421F',
    accentSoft: '#FBF1EB',
    field: '#3A4A35',         // moss — secondary/confirm action
    fieldHover: '#2D3A2A',
    mono: 'var(--font-jbmono), ui-monospace, SFMono-Regular, Menlo, monospace',
    serif: 'var(--font-fraunces), Georgia, serif',
    sans: 'var(--font-manrope), -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const WaveformExplorer = () => {
    const [currentChallenge, setCurrentChallenge] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);

    // Canvas state
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [userPoints, setUserPoints] = useState([]);

    const canvasWidth = 700;
    const canvasHeight = 350;
    const padding = { top: 50, right: 50, bottom: 60, left: 70 };

    // Canvas-specific colors (exam-style graph paper — kept as-is; this is the
    // functional part of the tool and deliberately reads like real exam paper)
    const canvasTheme = {
        bg: '#f5f5f5',
        bgGraph: '#ffffff',
        gridFine: '#c0c0c0',
        gridMajor: '#404040',
        centerLine: '#000000',
        axisLine: '#000000',
        text: '#000000',
        textSecondary: '#666666',
        userLine: HOUSE.accent,
        originalLine: 'rgba(100, 100, 100, 0.6)',
        answerLine: '#0d7d5f',
    };

    // Waveform shape definitions
    const waveformShapes = {
        sine: {
            name: 'Sine',
            draw: (progress, cycles) => Math.sin(progress * cycles * 2 * Math.PI),
        },
        square: {
            name: 'Square',
            draw: (progress, cycles) => Math.sign(Math.sin(progress * cycles * 2 * Math.PI)),
        },
        saw: {
            name: 'Saw',
            draw: (progress, cycles) => {
                const phase = (progress * cycles) % 1;
                return 2 * phase - 1;
            },
        },
        triangle: {
            name: 'Triangle',
            draw: (progress, cycles) => {
                const phase = (progress * cycles) % 1;
                return 4 * Math.abs(phase - 0.5) - 1;
            },
        },
    };

    // The 10 practice challenges
    const challenges = [
        {
            id: 1,
            name: 'Sine \u2192 Sine (1 Octave Lower)',
            originalShape: 'sine',
            targetShape: 'sine',
            originalCycles: 4,
            targetCycles: 2,
            direction: 'lower',
            octaves: 1,
            description: 'Draw a SINE wave ONE OCTAVE LOWER',
            hint: 'Same shape, but period doubles \u2192 half as many cycles (4\u21922).',
        },
        {
            id: 2,
            name: 'Square \u2192 Square (1 Octave Higher)',
            originalShape: 'square',
            targetShape: 'square',
            originalCycles: 2,
            targetCycles: 4,
            direction: 'higher',
            octaves: 1,
            description: 'Draw a SQUARE wave ONE OCTAVE HIGHER',
            hint: 'Same shape, but period halves \u2192 twice as many cycles (2\u21924).',
        },
        {
            id: 3,
            name: 'Saw \u2192 Saw (1 Octave Lower)',
            originalShape: 'saw',
            targetShape: 'saw',
            originalCycles: 4,
            targetCycles: 2,
            direction: 'lower',
            octaves: 1,
            description: 'Draw a SAW wave ONE OCTAVE LOWER',
            hint: 'Same shape, period doubles \u2192 half the cycles (4\u21922).',
        },
        {
            id: 4,
            name: 'Triangle \u2192 Triangle (1 Octave Higher)',
            originalShape: 'triangle',
            targetShape: 'triangle',
            originalCycles: 2,
            targetCycles: 4,
            direction: 'higher',
            octaves: 1,
            description: 'Draw a TRIANGLE wave ONE OCTAVE HIGHER',
            hint: 'Same shape, period halves \u2192 double the cycles (2\u21924).',
        },
        {
            id: 5,
            name: 'Sine \u2192 Square (1 Octave Higher)',
            originalShape: 'sine',
            targetShape: 'square',
            originalCycles: 2,
            targetCycles: 4,
            direction: 'higher',
            octaves: 1,
            description: 'Draw a SQUARE wave ONE OCTAVE HIGHER',
            hint: 'Change to square wave AND double the cycles (2\u21924).',
        },
        {
            id: 6,
            name: 'Square \u2192 Sine (1 Octave Lower)',
            originalShape: 'square',
            targetShape: 'sine',
            originalCycles: 4,
            targetCycles: 2,
            direction: 'lower',
            octaves: 1,
            description: 'Draw a SINE wave ONE OCTAVE LOWER',
            hint: 'Change shape from square to sine, and halve the cycles (4\u21922).',
        },
        {
            id: 7,
            name: 'Saw \u2192 Triangle (2 Octaves Higher)',
            originalShape: 'saw',
            targetShape: 'triangle',
            originalCycles: 1,
            targetCycles: 4,
            direction: 'higher',
            octaves: 2,
            description: 'Draw a TRIANGLE wave TWO OCTAVES HIGHER',
            hint: 'Two octaves = \u00d74 cycles. Change saw to triangle (1\u21924).',
        },
        {
            id: 8,
            name: 'Triangle \u2192 Saw (1 Octave Lower)',
            originalShape: 'triangle',
            targetShape: 'saw',
            originalCycles: 4,
            targetCycles: 2,
            direction: 'lower',
            octaves: 1,
            description: 'Draw a SAW wave ONE OCTAVE LOWER',
            hint: 'Change shape from triangle to saw, and halve the cycles (4\u21922).',
        },
        {
            id: 9,
            name: 'Sine \u2192 Saw (2 Octaves Higher)',
            originalShape: 'sine',
            targetShape: 'saw',
            originalCycles: 1,
            targetCycles: 4,
            direction: 'higher',
            octaves: 2,
            description: 'Draw a SAW wave TWO OCTAVES HIGHER',
            hint: 'Two octaves = \u00d74 cycles. Change sine to saw (1\u21924).',
        },
        {
            id: 10,
            name: 'Square \u2192 Triangle (2 Octaves Higher)',
            originalShape: 'square',
            targetShape: 'triangle',
            originalCycles: 2,
            targetCycles: 8,
            direction: 'higher',
            octaves: 2,
            description: 'Draw a TRIANGLE wave TWO OCTAVES HIGHER',
            hint: 'Two octaves = \u00d74 cycles. Change square to triangle (2\u21928).',
        },
    ];

    const currentChallengeData = challenges[currentChallenge];

    // Draw the exam-style graph paper grid and reference waveform
    const drawGrid = useCallback((ctx) => {
        const innerWidth = canvasWidth - padding.left - padding.right;
        const innerHeight = canvasHeight - padding.top - padding.bottom;

        // Background
        ctx.fillStyle = canvasTheme.bg;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Graph paper area (white)
        ctx.fillStyle = canvasTheme.bgGraph;
        ctx.fillRect(padding.left, padding.top, innerWidth, innerHeight);

        // Grid spacing
        const majorDivisionsX = 5;
        const minorPerMajorX = 10;
        const totalMinorX = majorDivisionsX * minorPerMajorX;
        const minorSpacingX = innerWidth / totalMinorX;
        const minorSpacingY = minorSpacingX; // Square cells
        const totalMinorY = Math.floor(innerHeight / minorSpacingY);
        const majorDivisionsY = Math.floor(totalMinorY / minorPerMajorX);

        // Fine grid lines
        ctx.strokeStyle = canvasTheme.gridFine;
        ctx.lineWidth = 0.5;

        for (let i = 0; i <= totalMinorX; i++) {
            const x = padding.left + i * minorSpacingX;
            ctx.beginPath();
            ctx.moveTo(x, padding.top);
            ctx.lineTo(x, padding.top + innerHeight);
            ctx.stroke();
        }

        for (let i = 0; i <= totalMinorY; i++) {
            const y = padding.top + i * minorSpacingY;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(padding.left + innerWidth, y);
            ctx.stroke();
        }

        // Major grid lines
        ctx.strokeStyle = canvasTheme.gridMajor;
        ctx.lineWidth = 1.5;

        for (let i = 0; i <= majorDivisionsX; i++) {
            const x = padding.left + (i / majorDivisionsX) * innerWidth;
            ctx.beginPath();
            ctx.moveTo(x, padding.top);
            ctx.lineTo(x, padding.top + innerHeight);
            ctx.stroke();
        }

        const majorSpacingY = minorSpacingY * minorPerMajorX;
        for (let i = 0; i <= majorDivisionsY; i++) {
            const y = padding.top + i * majorSpacingY;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(padding.left + innerWidth, y);
            ctx.stroke();
        }

        // Center line (zero displacement)
        const centerY = padding.top + innerHeight / 2;
        ctx.strokeStyle = canvasTheme.centerLine;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding.left, centerY);
        ctx.lineTo(padding.left + innerWidth, centerY);
        ctx.stroke();

        // Axes border
        ctx.strokeStyle = canvasTheme.axisLine;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding.left, padding.top);
        ctx.lineTo(padding.left, padding.top + innerHeight);
        ctx.lineTo(padding.left + innerWidth, padding.top + innerHeight);
        ctx.stroke();

        // X-axis tick marks and numbers
        ctx.fillStyle = canvasTheme.text;
        ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        for (let i = 1; i <= majorDivisionsX; i++) {
            const x = padding.left + (i / majorDivisionsX) * innerWidth;
            ctx.beginPath();
            ctx.moveTo(x, padding.top + innerHeight);
            ctx.lineTo(x, padding.top + innerHeight + 6);
            ctx.stroke();
            ctx.fillText(String(i), x, padding.top + innerHeight + 10);
        }

        // X-axis label
        ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.fillStyle = canvasTheme.text;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText('Time (ms)', padding.left + innerWidth, padding.top + innerHeight + 35);

        // Y-axis label (rotated)
        ctx.save();
        ctx.translate(padding.left - 35, padding.top + innerHeight / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center';
        ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.fillText('Amplitude', 0, 0);
        ctx.restore();

        // Draw ORIGINAL waveform as dashed reference
        if (currentChallengeData) {
            const midY = padding.top + innerHeight / 2;
            const amplitude = innerHeight * 0.35;
            const shapeFunc = waveformShapes[currentChallengeData.originalShape]?.draw;
            const shapeName = waveformShapes[currentChallengeData.originalShape]?.name || '';

            if (shapeFunc) {
                ctx.strokeStyle = canvasTheme.originalLine;
                ctx.lineWidth = 2;
                ctx.setLineDash([8, 6]);
                ctx.beginPath();

                for (let i = 0; i <= innerWidth; i++) {
                    const x = padding.left + i;
                    const progress = i / innerWidth;
                    const y = midY - shapeFunc(progress, currentChallengeData.originalCycles) * amplitude;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();
                ctx.setLineDash([]);
            }

            // Original waveform label
            ctx.fillStyle = canvasTheme.textSecondary;
            ctx.font = '11px ui-monospace, monospace';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(
                `Original: ${shapeName} (${currentChallengeData.originalCycles} cycle${currentChallengeData.originalCycles !== 1 ? 's' : ''})`,
                padding.left + 8,
                padding.top + 8
            );

            // Header with challenge info
            ctx.fillStyle = canvasTheme.text;
            ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'bottom';
            ctx.fillText(
                `Challenge ${currentChallenge + 1}: ${currentChallengeData.name}`,
                padding.left,
                padding.top - 8
            );

            // Target shape badge
            const targetShapeName = waveformShapes[currentChallengeData.targetShape]?.name || '';
            const badgeText = `Draw: ${targetShapeName}`;
            ctx.font = 'bold 11px ui-monospace, monospace';
            const badgeWidth = ctx.measureText(badgeText).width + 16;
            const badgeX = padding.left + innerWidth - badgeWidth - 8;

            ctx.fillStyle = 'rgba(184, 90, 63, 0.15)';
            ctx.beginPath();
            ctx.roundRect(badgeX, padding.top + 8, badgeWidth, 22, 4);
            ctx.fill();

            ctx.strokeStyle = '#B85A3F';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.fillStyle = '#B85A3F';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(badgeText, badgeX + badgeWidth / 2, padding.top + 19);
        }
    }, [currentChallengeData, currentChallenge]);

    // Draw user's freehand line (smoothed with quadratic curves)
    const drawUserLine = useCallback((ctx) => {
        if (userPoints.length < 2) return;

        ctx.strokeStyle = canvasTheme.userLine;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(userPoints[0].x, userPoints[0].y);

        if (userPoints.length === 2) {
            ctx.lineTo(userPoints[1].x, userPoints[1].y);
        } else {
            for (let i = 1; i < userPoints.length - 1; i++) {
                const midX = (userPoints[i].x + userPoints[i + 1].x) / 2;
                const midY = (userPoints[i].y + userPoints[i + 1].y) / 2;
                ctx.quadraticCurveTo(userPoints[i].x, userPoints[i].y, midX, midY);
            }
            const last = userPoints[userPoints.length - 1];
            ctx.lineTo(last.x, last.y);
        }
        ctx.stroke();
    }, [userPoints]);

    // Draw the correct answer overlay
    const drawAnswer = useCallback((ctx) => {
        if (!showAnswer || !currentChallengeData) return;

        const innerWidth = canvasWidth - padding.left - padding.right;
        const innerHeight = canvasHeight - padding.top - padding.bottom;
        const midY = padding.top + innerHeight / 2;
        const amplitude = innerHeight * 0.35;
        const shapeFunc = waveformShapes[currentChallengeData.targetShape]?.draw;

        if (!shapeFunc) return;

        ctx.strokeStyle = canvasTheme.answerLine;
        ctx.lineWidth = 3;
        ctx.beginPath();

        for (let i = 0; i <= innerWidth; i++) {
            const x = padding.left + i;
            const progress = i / innerWidth;
            const y = midY - shapeFunc(progress, currentChallengeData.targetCycles) * amplitude;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Answer label
        const targetName = waveformShapes[currentChallengeData.targetShape]?.name || '';
        ctx.fillStyle = canvasTheme.answerLine;
        ctx.font = '11px ui-monospace, monospace';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        ctx.fillText(
            `Answer: ${targetName} (${currentChallengeData.targetCycles} cycle${currentChallengeData.targetCycles !== 1 ? 's' : ''})`,
            padding.left + innerWidth - 8,
            padding.top + innerHeight - 22
        );
    }, [showAnswer, currentChallengeData]);

    // Redraw canvas
    const redrawCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        drawGrid(ctx);
        drawUserLine(ctx);
        drawAnswer(ctx);
    }, [drawGrid, drawUserLine, drawAnswer]);

    useEffect(() => {
        redrawCanvas();
    }, [redrawCanvas, userPoints, currentChallenge, showAnswer]);

    // Mouse event handlers
    const getMousePos = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY,
        };
    };

    const isInBounds = (pos) =>
        pos.x >= padding.left &&
        pos.x <= canvasWidth - padding.right &&
        pos.y >= padding.top &&
        pos.y <= canvasHeight - padding.bottom;

    const handleMouseDown = (e) => {
        const pos = getMousePos(e);
        if (isInBounds(pos)) {
            setIsDrawing(true);
            setUserPoints([pos]);
        }
    };

    const handleMouseMove = (e) => {
        if (!isDrawing) return;
        const pos = getMousePos(e);
        if (isInBounds(pos)) {
            setUserPoints((prev) => [...prev, pos]);
        }
    };

    const handleMouseUp = () => {
        setIsDrawing(false);
    };

    const handleMouseLeave = () => {
        setIsDrawing(false);
    };

    // Touch event handlers
    const getTouchPos = (e) => {
        if (!e.touches || e.touches.length === 0) return null;
        const touch = e.touches[0];
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (touch.clientX - rect.left) * scaleX,
            y: (touch.clientY - rect.top) * scaleY,
        };
    };

    const handleTouchStart = (e) => {
        e.preventDefault();
        const pos = getTouchPos(e);
        if (!pos) return;
        if (isInBounds(pos)) {
            setIsDrawing(true);
            setUserPoints([pos]);
        }
    };

    const handleTouchMove = (e) => {
        e.preventDefault();
        if (!isDrawing) return;
        const pos = getTouchPos(e);
        if (!pos) return;
        if (isInBounds(pos)) {
            setUserPoints((prev) => [...prev, pos]);
        }
    };

    const handleTouchEnd = (e) => {
        e.preventDefault();
        setIsDrawing(false);
    };

    // Navigation
    const clearDrawing = () => {
        setUserPoints([]);
        setShowAnswer(false);
    };

    const goToChallenge = (index) => {
        setCurrentChallenge(index);
        setUserPoints([]);
        setShowAnswer(false);
    };

    const goPrev = () => {
        if (currentChallenge > 0) goToChallenge(currentChallenge - 1);
    };

    const goNext = () => {
        if (currentChallenge < challenges.length - 1) goToChallenge(currentChallenge + 1);
    };

    // --- Styles ---
    const styles = {
        page: {
            background: HOUSE.bg,
            padding: '28px 20px',
            borderRadius: 20,
        },
        wrapper: {
            maxWidth: 760,
            margin: '0 auto',
            fontFamily: HOUSE.sans,
        },
        card: {
            background: HOUSE.surface,
            border: `1px solid ${HOUSE.border}`,
            borderRadius: 16,
            padding: '24px',
            boxShadow: '0 1px 0 rgba(43,36,24,0.04), 0 18px 40px -24px rgba(43,36,24,0.22)',
        },
        eyebrow: {
            fontFamily: HOUSE.mono,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: HOUSE.accent,
            margin: '0 0 6px',
        },
        header: {
            marginBottom: 16,
        },
        title: {
            fontFamily: HOUSE.serif,
            fontSize: 22,
            fontWeight: 500,
            color: HOUSE.ink,
            margin: 0,
        },
        description: {
            fontSize: 15,
            color: HOUSE.inkMuted,
            marginTop: 6,
            marginBottom: 0,
        },
        canvasContainer: {
            border: `1px solid ${HOUSE.border}`,
            borderRadius: 8,
            overflow: 'hidden',
            background: '#f5f5f5',
            lineHeight: 0,
        },
        canvas: {
            width: '100%',
            height: 'auto',
            cursor: 'crosshair',
            touchAction: 'none',
        },
        hint: {
            fontSize: 13,
            color: HOUSE.inkFaint,
            marginTop: 8,
            marginBottom: 12,
            fontStyle: 'italic',
        },
        buttonRow: {
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            marginBottom: 16,
        },
        btn: {
            padding: '9px 18px',
            fontSize: 13,
            fontWeight: 600,
            fontFamily: HOUSE.sans,
            border: `1px solid ${HOUSE.border}`,
            borderRadius: 999,
            cursor: 'pointer',
            background: HOUSE.surface,
            color: HOUSE.ink,
            transition: 'background 150ms var(--ease-house, ease), transform 100ms var(--ease-house, ease)',
        },
        btnPrimary: {
            background: HOUSE.accent,
            color: '#fff',
            border: 'none',
        },
        btnSuccess: {
            background: HOUSE.field,
            color: '#fff',
            border: 'none',
        },
        btnDisabled: {
            opacity: 0.4,
            cursor: 'not-allowed',
        },
        dots: {
            display: 'flex',
            justifyContent: 'center',
            gap: 6,
        },
        dot: {
            width: 10,
            height: 10,
            borderRadius: '50%',
            border: `1.5px solid ${HOUSE.border}`,
            background: HOUSE.surface,
            cursor: 'pointer',
            transition: 'background 0.15s, border-color 0.15s',
            padding: 0,
        },
        dotActive: {
            background: HOUSE.accent,
            borderColor: HOUSE.accent,
        },
    };

    return (
        <div style={styles.page}>
        <div style={styles.wrapper}>
            <div style={styles.card}>
            {/* Header */}
            <div style={styles.header}>
                <p style={styles.eyebrow}>Challenge {currentChallenge + 1} of {challenges.length}</p>
                <h2 style={styles.title}>{currentChallengeData.description}</h2>
                <p style={styles.description}>
                    {currentChallengeData.name} &mdash; {currentChallengeData.originalCycles} cycle{currentChallengeData.originalCycles !== 1 ? 's' : ''} &rarr; {currentChallengeData.targetCycles} cycle{currentChallengeData.targetCycles !== 1 ? 's' : ''}
                </p>
            </div>

            {/* Canvas */}
            <div style={styles.canvasContainer}>
                <canvas
                    ref={canvasRef}
                    width={canvasWidth}
                    height={canvasHeight}
                    style={styles.canvas}
                    aria-label="Drawing canvas — use mouse or touch to draw your waveform answer"
                    role="img"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                />
            </div>
            <p style={{ ...styles.hint, marginTop: 4, marginBottom: 0, color: HOUSE.inkFaint }}>
                Keyboard users: press Show Answer to see the correct waveform.
            </p>

            {/* Hint */}
            <p style={styles.hint}>{currentChallengeData.hint}</p>

            {/* Action buttons */}
            <div style={styles.buttonRow}>
                <button type="button"
                    style={styles.btn}
                    onClick={clearDrawing}
                >
                    Clear Drawing
                </button>
                <button type="button"
                    style={{
                        ...styles.btn,
                        ...(showAnswer ? styles.btnSuccess : styles.btnPrimary),
                    }}
                    onClick={() => setShowAnswer((prev) => !prev)}
                >
                    {showAnswer ? 'Hide Answer' : 'Show Answer'}
                </button>
                <div style={{ flex: 1 }} />
                <button type="button"
                    style={{
                        ...styles.btn,
                        ...(currentChallenge === 0 ? styles.btnDisabled : {}),
                    }}
                    onClick={goPrev}
                    disabled={currentChallenge === 0}
                >
                    &larr; Previous
                </button>
                <button type="button"
                    style={{
                        ...styles.btn,
                        ...styles.btnPrimary,
                        ...(currentChallenge === challenges.length - 1 ? styles.btnDisabled : {}),
                    }}
                    onClick={goNext}
                    disabled={currentChallenge === challenges.length - 1}
                >
                    Next &rarr;
                </button>
            </div>

            {/* Challenge navigation dots */}
            <div style={styles.dots}>
                {challenges.map((_, i) => (
                    <button type="button"
                        key={i}
                        style={{
                            ...styles.dot,
                            ...(i === currentChallenge ? styles.dotActive : {}),
                        }}
                        onClick={() => goToChallenge(i)}
                        aria-label={`Challenge ${i + 1}`}
                    />
                ))}
            </div>
            </div>
        </div>
        </div>
    );
};

export default WaveformExplorer;
