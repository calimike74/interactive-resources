'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { theme, typography, spacing, borderRadius, glass, transitions } from '@/lib/theme';

// ============================================
// CONSTANTS
// ============================================
const CANVAS_SIZE = 500;
const PADDING = 50;
const DB_MIN = -40;
const DB_MAX = 0;
const DB_RANGE = DB_MAX - DB_MIN;

const THRESHOLD_OPTIONS = [-5, -10, -15, -20, -25, -30, -35, -40];
const DRAW_RATIO_RANGE = { min: 2, max: 20 };
const ANALYSE_RATIOS = [2, 4, 8];
const DRAW_MAKEUP_OPTIONS = [5, 10, 15, 20];
const ANALYSE_MAKEUP_OPTIONS = [5, 10, 15];

// ============================================
// COLOUR TOKENS (matching site accent palette)
// ============================================
const colours = {
    userCurve: '#2563EB',
    userCurveLight: 'rgba(37, 99, 235, 0.7)',
    solution: '#059669',
    solutionLight: '#10B981',
    analyseCurve: '#0891B2',
    analyseCurveLight: '#22D3EE',
    threshold: 'rgba(220, 38, 38, 0.5)',
    thresholdDot: '#DC2626',
    slopeAnnotation: '#D97706',
    grid: '#E5E7EB',
    axis: '#6B7280',
    reference: '#9CA3AF',
    canvasBg: '#FAFAFA',
    labelText: '#374151',
};

// ============================================
// HELPERS
// ============================================
function calculateCompressedOutput(input, threshold, ratio, makeupGain) {
    let output;
    if (input <= threshold) {
        output = input;
    } else {
        output = threshold + (input - threshold) / ratio;
    }
    return output + makeupGain;
}

function dbToX(db) {
    return PADDING + ((db - DB_MIN) / DB_RANGE) * (CANVAS_SIZE - 2 * PADDING);
}

function dbToY(db) {
    return CANVAS_SIZE - PADDING - ((db - DB_MIN) / DB_RANGE) * (CANVAS_SIZE - 2 * PADDING);
}

function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomThreshold() {
    return pickRandom(THRESHOLD_OPTIONS);
}

function randomDrawRatio() {
    return Math.floor(Math.random() * (DRAW_RATIO_RANGE.max - DRAW_RATIO_RANGE.min + 1)) + DRAW_RATIO_RANGE.min;
}

function randomMakeup(options, threshold) {
    const filtered = options.filter(v => v !== Math.abs(threshold));
    return pickRandom(filtered.length > 0 ? filtered : options);
}

// ============================================
// CANVAS DRAWING UTILITIES
// ============================================
function drawGrid(ctx) {
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.fillStyle = colours.canvasBg;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Grid lines every 10dB
    ctx.strokeStyle = colours.grid;
    ctx.lineWidth = 1;
    for (let i = DB_MIN; i <= DB_MAX; i += 10) {
        const x = dbToX(i);
        const y = dbToY(i);
        ctx.beginPath(); ctx.moveTo(x, PADDING); ctx.lineTo(x, CANVAS_SIZE - PADDING); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(PADDING, y); ctx.lineTo(CANVAS_SIZE - PADDING, y); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = colours.axis;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(PADDING, CANVAS_SIZE - PADDING); ctx.lineTo(CANVAS_SIZE - PADDING, CANVAS_SIZE - PADDING); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(PADDING, CANVAS_SIZE - PADDING); ctx.lineTo(PADDING, PADDING); ctx.stroke();

    // Labels
    ctx.fillStyle = colours.labelText;
    ctx.font = `${typography.weight.normal} 14px ${typography.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.fillText('INPUT SIGNAL (dB)', CANVAS_SIZE / 2, CANVAS_SIZE - 10);
    ctx.save();
    ctx.translate(15, CANVAS_SIZE / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('OUTPUT SIGNAL (dB)', 0, 0);
    ctx.restore();

    // Tick values
    for (let i = DB_MIN; i <= DB_MAX; i += 10) {
        ctx.fillText(i.toString(), dbToX(i), CANVAS_SIZE - PADDING + 20);
        ctx.fillText(i.toString(), PADDING - 20, dbToY(i) + 5);
    }

    // 1:1 reference line (dashed)
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = colours.reference;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PADDING, CANVAS_SIZE - PADDING);
    ctx.lineTo(CANVAS_SIZE - PADDING, PADDING);
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawCurve(ctx, threshold, ratio, makeupGain, colour1, colour2) {
    const grad = ctx.createLinearGradient(PADDING, PADDING, CANVAS_SIZE - PADDING, CANVAS_SIZE - PADDING);
    grad.addColorStop(0, colour1);
    grad.addColorStop(1, colour2);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let input = DB_MIN; input <= DB_MAX; input += 0.5) {
        const output = calculateCompressedOutput(input, threshold, ratio, makeupGain);
        const x = dbToX(input);
        const y = dbToY(output);
        if (input === DB_MIN) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
}

function drawUserPoints(ctx, points, colour1, colour2, alpha) {
    if (points.length === 0) return;
    const grad = ctx.createLinearGradient(PADDING, PADDING, CANVAS_SIZE - PADDING, CANVAS_SIZE - PADDING);
    grad.addColorStop(0, alpha ? `rgba(37, 99, 235, ${alpha})` : colour1);
    grad.addColorStop(1, alpha ? `rgba(96, 165, 250, ${alpha})` : colour2);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();
}

function drawAnnotations(ctx, threshold, ratio, makeupGain) {
    // Threshold vertical line
    const tx = dbToX(threshold);
    ctx.strokeStyle = colours.threshold;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(tx, PADDING); ctx.lineTo(tx, CANVAS_SIZE - PADDING); ctx.stroke();

    // Threshold dot
    const thOut = calculateCompressedOutput(threshold, threshold, ratio, makeupGain);
    const ty = dbToY(thOut);
    ctx.fillStyle = colours.thresholdDot;
    ctx.beginPath(); ctx.arc(tx, ty, 5, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = colours.labelText;
    ctx.font = `${typography.weight.normal} 13px ${typography.fontFamily}`;
    ctx.textAlign = 'left';
    ctx.fillText(`Threshold: ${threshold}dB`, tx + 10, ty);

    // Slope annotation
    const inputAbove = threshold + 10;
    const outAbove = calculateCompressedOutput(inputAbove, threshold, ratio, makeupGain);
    ctx.strokeStyle = colours.slopeAnnotation;
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(dbToX(inputAbove), dbToY(outAbove)); ctx.stroke();
    ctx.setLineDash([]);
    const mx = (tx + dbToX(inputAbove)) / 2;
    const my = (ty + dbToY(outAbove)) / 2;
    ctx.fillText(`Ratio: ${ratio}:1`, mx + 5, my - 5);

    // Makeup gain label
    ctx.fillText(`Makeup Gain: ${makeupGain}dB`, PADDING + 10, PADDING + 20);
}

// ============================================
// PARAM CARD
// ============================================
function ParamCard({ label, value, unit }) {
    const t = theme.light;
    return (
        <div style={{
            background: t.bg.secondary,
            padding: spacing[3],
            borderRadius: borderRadius.lg,
            textAlign: 'center',
        }}>
            <div style={{ fontSize: typography.size.xs, color: t.text.tertiary, marginBottom: spacing[1] }}>{label}</div>
            <div style={{ fontSize: typography.size.lg, fontWeight: typography.weight.semibold, color: t.text.primary }}>{value}{unit}</div>
        </div>
    );
}

// ============================================
// DRAW TAB
// ============================================
function DrawTab() {
    const t = theme.light;
    const canvasRef = useRef(null);
    const userPoints = useRef([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawMode, setDrawMode] = useState(true);
    const [showSolution, setShowSolution] = useState(false);
    const [showInstructions, setShowInstructions] = useState(true);
    const [settings, setSettings] = useState(() => ({
        threshold: -30, ratio: 10, makeupGain: 10,
    }));

    const redraw = useCallback((s = settings, solution = showSolution, points = userPoints.current) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        drawGrid(ctx);

        // Threshold hint line
        const tx = dbToX(s.threshold);
        ctx.strokeStyle = colours.threshold;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(tx, PADDING); ctx.lineTo(tx, CANVAS_SIZE - PADDING); ctx.stroke();

        if (solution) {
            drawCurve(ctx, s.threshold, s.ratio, s.makeupGain, colours.solution, colours.solutionLight);
        }
        drawUserPoints(ctx, points, colours.userCurve, colours.userCurveLight, solution ? 0.7 : null);
    }, [settings, showSolution]);

    useEffect(() => { redraw(); }, [redraw]);

    const newSettings = () => {
        const th = randomThreshold();
        const s = { threshold: th, ratio: randomDrawRatio(), makeupGain: randomMakeup(DRAW_MAKEUP_OPTIONS, th) };
        userPoints.current = [];
        setShowSolution(false);
        setDrawMode(true);
        setSettings(s);
    };

    const clear = () => { userPoints.current = []; setShowSolution(false); setDrawMode(true); redraw(settings, false, []); };

    const compare = () => { setShowSolution(true); setDrawMode(false); };

    const toggleSolution = () => {
        const next = !showSolution;
        setShowSolution(next);
        setDrawMode(!next);
    };

    // Canvas mouse/touch handlers
    const getPos = (e, canvas) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = CANVAS_SIZE / rect.width;
        const scaleY = CANVAS_SIZE / rect.height;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
    };

    const onDown = (e) => {
        if (!drawMode) return;
        e.preventDefault();
        setIsDrawing(true);
        const pos = getPos(e, canvasRef.current);
        userPoints.current = [pos];
        const ctx = canvasRef.current.getContext('2d');
        ctx.strokeStyle = colours.userCurve;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    };

    const onMove = (e) => {
        if (!isDrawing || !drawMode) return;
        e.preventDefault();
        const pos = getPos(e, canvasRef.current);
        if (pos.x < PADDING || pos.x > CANVAS_SIZE - PADDING || pos.y < PADDING || pos.y > CANVAS_SIZE - PADDING) return;
        userPoints.current.push(pos);
        const ctx = canvasRef.current.getContext('2d');
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
    };

    const onUp = () => setIsDrawing(false);

    useEffect(() => {
        window.addEventListener('mouseup', onUp);
        window.addEventListener('touchend', onUp);
        return () => { window.removeEventListener('mouseup', onUp); window.removeEventListener('touchend', onUp); };
    }, []);

    return (
        <div>
            {/* Settings card */}
            <div style={{
                background: t.bg.primary,
                border: `1px solid ${t.border.subtle}`,
                borderRadius: borderRadius['2xl'],
                padding: spacing[6],
                marginBottom: spacing[6],
                boxShadow: t.shadow.sm,
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[4], flexWrap: 'wrap', gap: spacing[2] }}>
                    <h2 style={{ fontSize: typography.size.xl, fontWeight: typography.weight.semibold, color: t.text.primary, margin: 0 }}>
                        Draw the Curve
                    </h2>
                    <div style={{ display: 'flex', gap: spacing[2] }}>
                        <button type="button" onClick={() => setShowInstructions(!showInstructions)} style={btnStyle(glass.bg, t.text.secondary, t.border.subtle)}>
                            {showInstructions ? 'Hide Tips' : 'Show Tips'}
                        </button>
                        <button type="button" onClick={newSettings} style={btnStyle(glass.bgPrimary, t.text.inverse)}>
                            New Settings
                        </button>
                    </div>
                </div>

                <p style={{ color: t.text.secondary, fontSize: typography.size.sm, marginBottom: spacing[4] }}>
                    Draw the compressor response curve for these settings:
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: spacing[3] }}>
                    <ParamCard label="Threshold" value={settings.threshold} unit=" dB" />
                    <ParamCard label="Ratio" value={`${settings.ratio}:1`} unit="" />
                    <ParamCard label="Knee" value="Hard" unit="" />
                    <ParamCard label="Makeup Gain" value={settings.makeupGain} unit=" dB" />
                </div>
            </div>

            {/* Canvas */}
            <div style={{
                background: t.bg.primary,
                border: `1px solid ${t.border.subtle}`,
                borderRadius: borderRadius['2xl'],
                overflow: 'hidden',
                boxShadow: t.shadow.md,
                marginBottom: spacing[6],
            }}>
                <canvas
                    ref={canvasRef}
                    width={CANVAS_SIZE}
                    height={CANVAS_SIZE}
                    onMouseDown={onDown}
                    onMouseMove={onMove}
                    onMouseUp={onUp}
                    onTouchStart={onDown}
                    onTouchMove={onMove}
                    onTouchEnd={onUp}
                    style={{
                        width: '100%',
                        maxWidth: CANVAS_SIZE,
                        height: 'auto',
                        display: 'block',
                        margin: '0 auto',
                        cursor: drawMode ? 'crosshair' : 'default',
                        touchAction: 'none',
                    }}
                />
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: spacing[3], flexWrap: 'wrap', marginBottom: spacing[6] }}>
                <button type="button" onClick={clear} style={btnStyle(t.bg.tertiary, t.text.primary)}>Clear Drawing</button>
                <button type="button" onClick={compare} disabled={showSolution} style={{
                    ...btnStyle(glass.bgPrimary, t.text.inverse),
                    opacity: showSolution ? 0.5 : 1,
                    cursor: showSolution ? 'not-allowed' : 'pointer',
                }}>Compare with Solution</button>
                <button type="button" onClick={toggleSolution} style={btnStyle(showSolution ? glass.bgWarning : glass.bgSuccess, t.text.inverse)}>
                    {showSolution ? 'Hide Solution' : 'Show Solution'}
                </button>
            </div>

            {/* Tips */}
            {showInstructions && (
                <div style={{
                    background: t.bg.primary,
                    border: `1px solid ${t.border.subtle}`,
                    borderRadius: borderRadius['2xl'],
                    padding: spacing[6],
                    boxShadow: t.shadow.sm,
                }}>
                    <h3 style={{ fontSize: typography.size.lg, fontWeight: typography.weight.semibold, color: t.text.primary, marginBottom: spacing[4], marginTop: 0 }}>
                        Drawing Tips
                    </h3>
                    <ul style={{ margin: 0, paddingLeft: spacing[5], color: t.text.secondary, fontSize: typography.size.sm, lineHeight: typography.lineHeight.relaxed }}>
                        <li style={{ marginBottom: spacing[2] }}>Below the threshold the curve follows a 1:1 slope (no compression).</li>
                        <li style={{ marginBottom: spacing[2] }}>At the threshold the hard knee creates a sharp angle where the slope changes.</li>
                        <li style={{ marginBottom: spacing[2] }}>Above the threshold a higher ratio means a flatter slope.</li>
                        <li style={{ marginBottom: spacing[2] }}>Makeup gain shifts the entire curve upward.</li>
                        <li>Keep the curve continuous — avoid breaks or jumps.</li>
                    </ul>
                </div>
            )}
        </div>
    );
}

// ============================================
// ANALYSE TAB
// ============================================
function AnalyseTab() {
    const t = theme.light;
    const canvasRef = useRef(null);
    const [settings, setSettings] = useState(() => {
        const th = randomThreshold();
        return { threshold: th, ratio: pickRandom(ANALYSE_RATIOS), makeupGain: randomMakeup(ANALYSE_MAKEUP_OPTIONS, th) };
    });
    const [userThreshold, setUserThreshold] = useState('');
    const [userRatio, setUserRatio] = useState('');
    const [userMakeup, setUserMakeup] = useState('');
    const [result, setResult] = useState(null);
    const [showAnswer, setShowAnswer] = useState(false);

    const redraw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        drawGrid(ctx);
        drawCurve(ctx, settings.threshold, settings.ratio, settings.makeupGain, colours.analyseCurve, colours.analyseCurveLight);
        if (showAnswer) drawAnnotations(ctx, settings.threshold, settings.ratio, settings.makeupGain);
    }, [settings, showAnswer]);

    useEffect(() => { redraw(); }, [redraw]);

    const newCurve = () => {
        const th = randomThreshold();
        setSettings({ threshold: th, ratio: pickRandom(ANALYSE_RATIOS), makeupGain: randomMakeup(ANALYSE_MAKEUP_OPTIONS, th) });
        setUserThreshold(''); setUserRatio(''); setUserMakeup('');
        setResult(null); setShowAnswer(false);
    };

    const check = () => {
        if (!userThreshold || !userRatio || !userMakeup) {
            setResult({ status: 'incomplete', message: 'Please provide all three values.' });
            return;
        }
        const uTh = parseFloat(userThreshold);
        const uR = parseFloat(userRatio);
        const uMg = parseFloat(userMakeup);
        if (isNaN(uTh) || isNaN(uR) || isNaN(uMg)) {
            setResult({ status: 'error', message: 'Please enter valid numbers.' });
            return;
        }
        const thOk = uTh === settings.threshold;
        const rOk = uR === settings.ratio;
        const mgOk = uMg === settings.makeupGain;
        const allOk = thOk && rOk && mgOk;

        let msg = allOk ? 'All parameters correct.' : 'Some parameters need adjustment:';
        if (!thOk) msg += `\nThreshold: your ${uTh}dB is ${uTh < settings.threshold ? 'too low' : 'too high'}.`;
        if (!rOk) msg += `\nRatio: your ${uR}:1 is ${uR < settings.ratio ? 'too low' : 'too high'}.`;
        if (!mgOk) msg += `\nMakeup Gain: your ${uMg}dB is ${uMg < settings.makeupGain ? 'too low' : 'too high'}.`;

        setResult({ status: allOk ? 'success' : 'partial', message: msg, thOk, rOk, mgOk });
    };

    const inputStyle = (correct) => ({
        width: '100%',
        padding: `${spacing[2]} ${spacing[3]}`,
        border: `1px solid ${correct === true ? t.accent.success : correct === false ? t.accent.error : t.border.input}`,
        borderRadius: borderRadius.lg,
        fontSize: typography.size.base,
        fontFamily: typography.fontFamily,
        background: correct === true ? t.accent.successLight : correct === false ? t.accent.errorLight : t.bg.primary,
        outline: 'none',
        boxSizing: 'border-box',
    });

    return (
        <div>
            {/* Instructions */}
            <div style={{
                background: t.bg.primary,
                border: `1px solid ${t.border.subtle}`,
                borderRadius: borderRadius['2xl'],
                padding: spacing[6],
                marginBottom: spacing[6],
                boxShadow: t.shadow.sm,
            }}>
                <h2 style={{ fontSize: typography.size.xl, fontWeight: typography.weight.semibold, color: t.text.primary, margin: 0, marginBottom: spacing[3] }}>
                    Analyse the Curve
                </h2>
                <p style={{ color: t.text.secondary, fontSize: typography.size.sm, margin: 0 }}>
                    Read the compressor curve below and identify the threshold, ratio, and makeup gain.
                </p>
            </div>

            {/* Canvas + inputs side by side on desktop */}
            <div style={{ display: 'flex', gap: spacing[6], flexWrap: 'wrap', marginBottom: spacing[6] }}>
                {/* Canvas */}
                <div style={{
                    flex: '1 1 320px',
                    background: t.bg.primary,
                    border: `1px solid ${t.border.subtle}`,
                    borderRadius: borderRadius['2xl'],
                    overflow: 'hidden',
                    boxShadow: t.shadow.md,
                }}>
                    <canvas
                        ref={canvasRef}
                        width={CANVAS_SIZE}
                        height={CANVAS_SIZE}
                        style={{ width: '100%', height: 'auto', display: 'block' }}
                    />
                </div>

                {/* Input panel */}
                <div style={{
                    flex: '0 1 280px',
                    background: t.bg.primary,
                    border: `1px solid ${t.border.subtle}`,
                    borderRadius: borderRadius['2xl'],
                    padding: spacing[6],
                    boxShadow: t.shadow.md,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: spacing[4],
                }}>
                    <h3 style={{ fontSize: typography.size.lg, fontWeight: typography.weight.semibold, color: t.text.primary, margin: 0 }}>
                        Your Analysis
                    </h3>

                    <div>
                        <label style={{ display: 'block', fontSize: typography.size.sm, fontWeight: typography.weight.medium, color: t.text.secondary, marginBottom: spacing[1] }}>
                            Threshold (dB)
                        </label>
                        <input aria-label="Input" type="text" value={userThreshold} onChange={e => setUserThreshold(e.target.value)} placeholder="e.g. -20"
                            style={inputStyle(result?.thOk)} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: typography.size.sm, fontWeight: typography.weight.medium, color: t.text.secondary, marginBottom: spacing[1] }}>
                            Ratio (X:1)
                        </label>
                        <input aria-label="Input" type="text" value={userRatio} onChange={e => setUserRatio(e.target.value)} placeholder="e.g. 4"
                            style={inputStyle(result?.rOk)} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: typography.size.sm, fontWeight: typography.weight.medium, color: t.text.secondary, marginBottom: spacing[1] }}>
                            Makeup Gain (dB)
                        </label>
                        <input aria-label="Input" type="text" value={userMakeup} onChange={e => setUserMakeup(e.target.value)} placeholder="e.g. 5"
                            style={inputStyle(result?.mgOk)} />
                    </div>

                    {/* Feedback */}
                    {result && (
                        <div style={{
                            padding: spacing[3],
                            borderRadius: borderRadius.lg,
                            fontSize: typography.size.sm,
                            lineHeight: typography.lineHeight.normal,
                            whiteSpace: 'pre-line',
                            background: result.status === 'success' ? t.accent.successLight : result.status === 'partial' ? t.accent.warningLight : t.accent.errorLight,
                            color: result.status === 'success' ? '#065F46' : result.status === 'partial' ? '#92400E' : '#991B1B',
                            border: `1px solid ${result.status === 'success' ? t.accent.success : result.status === 'partial' ? t.accent.warning : t.accent.error}`,
                        }}>
                            {result.message}
                        </div>
                    )}

                    {/* Buttons */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing[2] }}>
                        <button type="button" onClick={check} style={btnStyle(glass.bgPrimary, t.text.inverse)}>Check</button>
                        <button type="button" onClick={() => setShowAnswer(!showAnswer)} style={btnStyle('rgba(124, 58, 237, 0.85)', t.text.inverse)}>
                            {showAnswer ? 'Hide Answer' : 'Show Answer'}
                        </button>
                    </div>
                    <button type="button" onClick={newCurve} style={{ ...btnStyle(glass.bgSuccess, t.text.inverse), width: '100%' }}>
                        New Curve
                    </button>
                </div>
            </div>

            {/* How-to cards */}
            <div style={{
                background: t.bg.primary,
                border: `1px solid ${t.border.subtle}`,
                borderRadius: borderRadius['2xl'],
                padding: spacing[6],
                boxShadow: t.shadow.sm,
            }}>
                <h3 style={{ fontSize: typography.size.lg, fontWeight: typography.weight.semibold, color: t.text.primary, marginTop: 0, marginBottom: spacing[4] }}>
                    How to Analyse a Compressor Curve
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: spacing[4] }}>
                    {[
                        { title: 'Finding the Threshold', text: 'Look for the point where the curve changes from a 1:1 slope (45\u00B0) to a more gradual slope.' },
                        { title: 'Calculating the Ratio', text: 'For every X\u00A0dB increase in input above threshold, the output increases by 1\u00A0dB. Measure this relationship.' },
                        { title: 'Determining Makeup Gain', text: 'Look at how much the entire curve is shifted upward compared to the 1:1 reference line.' },
                        { title: 'Using the Reference Line', text: 'The dashed diagonal shows a 1:1 response (no compression). Use it as your baseline.' },
                    ].map(c => (
                        <div key={c.title} style={{ background: t.bg.secondary, padding: spacing[4], borderRadius: borderRadius.lg }}>
                            <h4 style={{ fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: t.text.primary, margin: 0, marginBottom: spacing[2] }}>{c.title}</h4>
                            <p style={{ fontSize: typography.size.sm, color: t.text.secondary, margin: 0, lineHeight: typography.lineHeight.relaxed }}>{c.text}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ============================================
// BUTTON HELPER
// ============================================
function btnStyle(bg, color, borderColor) {
    return {
        padding: `${spacing[2]} ${spacing[4]}`,
        background: bg,
        color: color,
        border: borderColor ? `1px solid ${borderColor}` : 'none',
        borderRadius: borderRadius.lg,
        fontSize: typography.size.sm,
        fontWeight: typography.weight.medium,
        fontFamily: typography.fontFamily,
        cursor: 'pointer',
        transition: `all ${transitions.fast}`,
        whiteSpace: 'nowrap',
    };
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function CompressorCurvePractice() {
    const t = theme.light;
    const [activeTab, setActiveTab] = useState('draw');

    const tabStyle = (active) => ({
        padding: `${spacing[3]} ${spacing[5]}`,
        background: active ? t.bg.primary : 'transparent',
        color: active ? t.accent.primary : t.text.tertiary,
        border: 'none',
        borderBottom: active ? `2px solid ${t.accent.primary}` : '2px solid transparent',
        fontSize: typography.size.sm,
        fontWeight: active ? typography.weight.semibold : typography.weight.medium,
        fontFamily: typography.fontFamily,
        cursor: 'pointer',
        transition: `all ${transitions.fast}`,
    });

    return (
        <div style={{
            fontFamily: typography.fontFamily,
            color: t.text.primary,
            minHeight: '100vh',
            background: t.bg.secondary,
        }}>
            {/* Hero with video background */}
            <div style={{
                position: 'relative',
                overflow: 'hidden',
                minHeight: '240px',
            }}>
                <video aria-hidden="true"
                    autoPlay
                    muted
                    loop
                    playsInline
                    onLoadedData={(e) => { e.target.style.opacity = 1; }}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        opacity: 0,
                        transition: 'opacity 0.8s ease-out',
                    }}
                    src="/compressor-hero.mp4"
                />
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to bottom, rgba(26,26,46,0.4) 0%, rgba(26,26,46,0.7) 100%)',
                }} />
                <div style={{
                    position: 'relative',
                    maxWidth: '640px',
                    margin: '0 auto',
                    padding: `${spacing[12]} ${spacing[6]} ${spacing[10]}`,
                    textAlign: 'center',
                }}>
                    <h1 style={{
                        fontSize: typography.size['4xl'],
                        fontWeight: typography.weight.bold,
                        color: '#ffffff',
                        lineHeight: typography.lineHeight.tight,
                        marginBottom: spacing[4],
                        textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    }}>
                        Compressor Curve Practice
                    </h1>
                    <p style={{
                        color: 'rgba(255,255,255,0.85)',
                        fontSize: typography.size.lg,
                        lineHeight: typography.lineHeight.relaxed,
                        maxWidth: '480px',
                        margin: '0 auto',
                        textShadow: '0 1px 4px rgba(0,0,0,0.2)',
                    }}>
                        Draw and analyse transfer curves
                    </p>
                </div>
            </div>

            {/* Content */}
            <div style={{ maxWidth: '900px', margin: '0 auto', padding: `${spacing[6]} ${spacing[4]}` }}>
                {/* Tab bar */}
                <div style={{
                    display: 'flex',
                    borderBottom: `1px solid ${t.border.subtle}`,
                    marginBottom: spacing[6],
                    gap: spacing[1],
                }}>
                    <button type="button" onClick={() => setActiveTab('draw')} style={tabStyle(activeTab === 'draw')}>
                        Draw Compressor Curve
                    </button>
                    <button type="button" onClick={() => setActiveTab('analyse')} style={tabStyle(activeTab === 'analyse')}>
                        Analyse Compressor Curve
                    </button>
                </div>

                {activeTab === 'draw' ? <DrawTab /> : <AnalyseTab />}
            </div>
        </div>
    );
}
