'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './squared-paper.module.css';
import { benchSans } from '@/components/bench/fonts';
import {
    DIVS, COLS, SQUARES, ROWS, SHAPES, TIME_BASES,
    INITIAL, questionOf, figureOf, isBlank, totalMarks, tagOf, COUNT,
    drawAt, clearLine, setChecked, stepQuestion, canStep, nextWord, spanOf,
    read, answerOf, marksFor, scoreOf, verdict, shapeAt,
    fmtHz, fmtMs, fmtS,
} from '@/lib/bench/paper-model';

// Squared Paper (2.5): the exam page, not a bench.
//
// Mike, 12 Sep 2026, after looking at the bench-framed version: "I don't want
// you to have one model for 3D and one model for 2D that you're just going to
// copy and paste new ideas into. I think it's a really good idea that the
// resources that the student has are going to reflect the actual task in
// front of them, rather than this fitting into something that doesn't really
// make sense." And: "we don't need to hear anything."
//
// So this page is a sheet of the paper's own paper on a dark desk. On it, the
// question as Edexcel prints it (the part label, the stem in the paper's
// words, Figure 1 where the paper prints one, the marks in brackets at the
// right), the answer grid ruled the way the paper rules it, and nothing else.
// Under the sheet, one strip: Back, where you are, Next, Check, Clear.
//
// Check marks the drawing the way a script comes back: each scheme point
// ticked or crossed in the margin in the scheme's own wording, the model
// answer dashed over the grid, the total beside the marks bracket, and the
// examiner report's own line when a mark is lost. The measuring is
// lib/bench/paper-model.js; this file draws.

const CODE = '2.5 Numeracy';
const TITLE = 'Squared Paper';

// The grid as the paper rules it: 25 small squares across (five to a
// division) and 20 down, the zero line through the middle, "Displacement" up
// the side and "Time (ms)" along the bottom with the divisions numbered.
// 18 px a square keeps a question that prints a figure inside about one and
// a small scroll at 1280 by 800, which is what a paper page should cost.
const ANSWER_SQ = 18; // a small square, in pixels, on the answer grid
const FIGURE_SQ = 11; // the same grid, smaller, for the figure the paper prints
const PAD = { left: 38, right: 78, top: 10, bottom: 22 };

const gridBox = (sq) => ({
    w: DIVS * SQUARES * sq,
    h: ROWS * sq,
    canvasW: DIVS * SQUARES * sq + PAD.left + PAD.right,
    canvasH: ROWS * sq + PAD.top + PAD.bottom,
    x0: PAD.left,
    y0: PAD.top,
});

const COL = {
    grid: '#dcdcdc',
    axis: '#16161d',
    ink: '#16161d',
    ink3: '#767b87',
    pencil: '#3f4450',
    pen: '#c0392b',
    figure: '#4b5060',
};

// One grid, drawn the paper's way. `line` is the student's drawing (one
// height per column), `wave` an ideal wave the paper printed or the scheme
// draws, `answer` the model answer in red dashes.
function paint(canvas, { sq, span, line = null, wave = null, answer = null, dpr = 1 }) {
    const box = gridBox(sq);
    canvas.width = Math.round(box.canvasW * dpr);
    canvas.height = Math.round(box.canvasH * dpr);
    canvas.style.width = `${box.canvasW}px`;
    canvas.style.height = `${box.canvasH}px`;
    const g = canvas.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, box.canvasW, box.canvasH);

    const { x0, y0, w, h } = box;
    const mid = y0 + h / 2;
    const half = h / 2;

    // the fine ruling
    g.strokeStyle = COL.grid;
    g.lineWidth = 1;
    g.beginPath();
    for (let i = 0; i <= DIVS * SQUARES; i += 1) {
        const x = Math.round(x0 + i * sq) + 0.5;
        g.moveTo(x, y0); g.lineTo(x, y0 + h);
    }
    for (let i = 0; i <= ROWS; i += 1) {
        const y = Math.round(y0 + i * sq) + 0.5;
        g.moveTo(x0, y); g.lineTo(x0 + w, y);
    }
    g.stroke();

    // the two axes the paper draws heavily: the left edge and the zero line
    g.strokeStyle = COL.axis;
    g.lineWidth = 1.6;
    g.beginPath();
    g.moveTo(Math.round(x0) + 0.5, y0);
    g.lineTo(Math.round(x0) + 0.5, y0 + h);
    g.moveTo(x0, Math.round(mid) + 0.5);
    g.lineTo(x0 + w + 6, Math.round(mid) + 0.5);
    g.stroke();

    const plot = (w2, colour, dash) => {
        g.save();
        g.beginPath();
        g.rect(x0, y0, w, h);
        g.clip();
        g.strokeStyle = colour;
        g.lineWidth = dash ? 1.6 : 1.8;
        g.lineJoin = 'round';
        if (dash) g.setLineDash([6, 5]);
        g.beginPath();
        const steps = 600;
        for (let i = 0; i <= steps; i += 1) {
            const ms = (i / steps) * span;
            const v = shapeAt(w2.shape, ms / w2.periodMs) * w2.amp * (w2.inverted ? -1 : 1) + (w2.offset || 0);
            const x = x0 + (i / steps) * w;
            const y = mid - v * half;
            if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
        }
        g.stroke();
        g.setLineDash([]);
        g.restore();
    };

    if (wave) plot(wave, COL.figure, false);
    if (answer) plot(answer, COL.pen, true);

    if (line) {
        g.save();
        g.beginPath();
        g.rect(x0, y0 - 2, w, h + 4);
        g.clip();
        g.strokeStyle = COL.pencil;
        g.lineWidth = 2.2;
        g.lineJoin = 'round';
        g.lineCap = 'round';
        const colW = w / COLS;
        let open = false;
        g.beginPath();
        for (let i = 0; i < COLS; i += 1) {
            const v = line[i];
            if (v == null) { open = false; continue; }
            const x = x0 + (i + 0.5) * colW;
            const y = mid - v * half;
            if (!open) { g.moveTo(x, y); open = true; } else g.lineTo(x, y);
        }
        g.stroke();
        g.restore();
    }

    // the paper's own labels, drawn last so a wave crossing a division number
    // does not bury it. The smaller grid keeps the type readable rather than
    // to scale: at 8 px the figure's numbers sat on the axis line.
    const face = getComputedStyle(canvas).fontFamily;
    const type = Math.max(10, Math.round(sq * 0.62));
    g.fillStyle = COL.ink;
    g.font = `700 ${type}px ${face}`;
    g.textAlign = 'center';
    for (let i = 1; i <= DIVS; i += 1) {
        g.fillText(String(i), x0 + (i / DIVS) * w, mid + type + 3);
    }
    g.font = `${type}px ${face}`;
    g.textAlign = 'left';
    g.fillText('Time (ms)', x0 + w + 10, mid - 2);
    g.save();
    g.translate(x0 - 12, mid);
    g.rotate(-Math.PI / 2);
    g.textAlign = 'center';
    g.fillText('Displacement', 0, 0);
    g.restore();
    return box;
}

export default function SquaredPaper({ back }) {
    const [state, setState] = useState(INITIAL);
    const [drawing, setDrawing] = useState(false);
    const answerRef = useRef(null);
    const figureRef = useRef(null);
    const dragRef = useRef(null);

    const q = questionOf(state);
    const figure = figureOf(state);
    const span = spanOf(state);
    const total = totalMarks(q);
    const rd = read(state);
    const marks = state.checked ? marksFor(state) : [];
    const score = scoreOf(state);
    const answer = answerOf(state);
    const lost = state.checked && score.got < score.total;

    // The figure the paper prints, drawn once a question.
    useEffect(() => {
        const canvas = figureRef.current;
        if (!canvas || !figure) return;
        paint(canvas, { sq: FIGURE_SQ, span, wave: figure, dpr: window.devicePixelRatio || 1 });
    }, [figure, span]);

    // The answer grid, redrawn as the student draws on it.
    useEffect(() => {
        const canvas = answerRef.current;
        if (!canvas) return;
        paint(canvas, {
            sq: ANSWER_SQ,
            span,
            line: state.line,
            answer: state.checked && answer && !answer.anyPeriod ? answer : null,
            dpr: window.devicePixelRatio || 1,
        });
        canvas.dataset.question = tagOf(state);
        canvas.dataset.checked = state.checked ? 'true' : 'false';
        canvas.dataset.shape = rd.shape || '';
        canvas.dataset.periodMs = rd.periodMs ? rd.periodMs.toFixed(2) : '';
        canvas.dataset.verdict = verdict(state);
        canvas.dataset.score = state.checked ? `${score.got}/${score.total}` : '';
        // the grid's own box inside the canvas, and the wave the scheme
        // draws, so scripts/check-paper.mjs can answer the question with the
        // pointer the way a student does
        const box = gridBox(ANSWER_SQ);
        canvas.dataset.grid = `${box.x0}:${box.y0}:${box.w}:${box.h}`;
        canvas.dataset.span = String(span);
        canvas.dataset.answer = answer ? `${answer.shape}:${answer.periodMs}:${answer.amp.toFixed(2)}:${answer.inverted ? 1 : 0}` : '';
    }, [state, span, answer, rd.shape, rd.periodMs, score.got, score.total]);

    // ---- drawing on the answer grid ----
    const at = (e) => {
        const canvas = answerRef.current;
        if (!canvas) return null;
        const r = canvas.getBoundingClientRect();
        const box = gridBox(ANSWER_SQ);
        const px = e.clientX - r.left;
        const py = e.clientY - r.top;
        if (px < box.x0 - 6 || px > box.x0 + box.w + 6) return null;
        if (py < box.y0 - 10 || py > box.y0 + box.h + 10) return null;
        const colW = box.w / COLS;
        const c = Math.round((px - box.x0) / colW - 0.5);
        const y = (box.y0 + box.h / 2 - py) / (box.h / 2);
        return { col: Math.max(0, Math.min(COLS - 1, c)), y: Math.max(-1, Math.min(1, y)) };
    };
    const onDown = (e) => {
        const p = at(e);
        if (!p) return;
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        dragRef.current = p;
        setDrawing(true);
        setState((s) => drawAt(s, p.col, p.y));
    };
    const onMove = (e) => {
        if (!dragRef.current) return;
        const p = at(e);
        if (!p) return;
        const from = dragRef.current;
        dragRef.current = p;
        setState((s) => drawAt(s, p.col, p.y, from.col, from.y));
    };
    const onUp = (e) => {
        setDrawing(false);
        if (!dragRef.current) return;
        dragRef.current = null;
        try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* gone */ }
    };

    const step = useCallback((by) => setState((s) => stepQuestion(s, by)), []);
    const onCheck = () => setState((s) => setChecked(s, true));
    const onClear = () => setState((s) => clearLine(s));

    const where = q.n ? `Question ${q.n} of ${COUNT}` : 'Blank paper';
    const ladder = rd.periodMs
        ? `T = ${fmtMs(rd.periodMs)} = ${fmtS(rd.periodMs / 1000)}   f = 1 ÷ T = ${fmtHz(1000 / rd.periodMs)}`
        : null;

    return (
        <div className={`${styles.desk} ${benchSans.variable}`} data-paper-page>
            <header className={styles.head}>
                {back ? <a className={styles.back} href={back.href}>{back.label}</a> : null}
                <span className={styles.code}>{CODE}</span>
                <span className={styles.name}>{TITLE}</span>

            </header>

            <main className={styles.sheet} aria-label="The question paper">
                <div className={styles.sheetHead}>
                    <span><b>{where}</b></span>
                    <span>{q.source}</span>
                </div>

                {figure ? (
                    <figure className={styles.figure}>
                        <canvas ref={figureRef} role="img" aria-label={`Figure 1: ${SHAPES[figure.shape].said} with a period of ${fmtMs(figure.periodMs)}`} />
                        <figcaption className={styles.figCaption}>{figure.caption}</figcaption>
                    </figure>
                ) : null}

                <div className={styles.question}>
                    <span className={styles.part}>{q.part}</span>
                    <div className={styles.stemCol}>
                        <p className={styles.stem}>{q.stem}</p>
                        {q.bullets ? (
                            <ul className={styles.bullets}>
                                {q.bullets.map((b) => (
                                    <li key={b.text}><span>{b.text}</span><i>({b.worth})</i></li>
                                ))}
                            </ul>
                        ) : null}
                    </div>
                    {total ? (
                        <span className={styles.marks}>
                            {q.bullets ? null : <span>({total})</span>}
                            {state.checked ? <span className={styles.score}>{score.got}/{score.total}</span> : null}
                        </span>
                    ) : null}
                </div>

                <div className={styles.grid}>
                    <canvas
                        ref={answerRef}
                        className={styles.answerCanvas}
                        role="img"
                        aria-label="The answer grid: draw the wave on it with the pointer"
                        onPointerDown={onDown}
                        onPointerMove={onMove}
                        onPointerUp={onUp}
                        onPointerCancel={onUp}
                    />
                </div>
                {rd.drawn === 0 ? <p className={styles.hint}>Draw the wave on the grid with the pointer.</p> : null}

                {state.checked ? (
                    <div className={styles.marking} aria-live="polite">
                        {isBlank(state) ? (
                            <p className={styles.reading}>
                                {rd.periodMs
                                    ? `You drew ${rd.shape ? SHAPES[rd.shape].said : 'a wave the page cannot name as one of the four'}, one cycle every ${fmtMs(rd.periodMs)}, which is ${fmtHz(1000 / rd.periodMs)}.`
                                    : 'Draw two whole cycles side by side and the page will read the shape and the period back to you.'}
                            </p>
                        ) : (
                            <>
                                {marks.map((m) => (
                                    <div key={m.id} className={styles.markLine}>
                                        <span className={styles.tick}>{m.ok ? '✓' : '✗'}</span>
                                        <span className={styles.words}>{m.words}</span>
                                        <span className={styles.measured}>{m.note}</span>
                                    </div>
                                ))}
                                {ladder ? <p className={styles.ladder}>{ladder}</p> : null}
                                {q.accept ? <p className={styles.accept}>{q.accept}</p> : null}
                                {lost && q.report ? <p className={styles.report}>{q.report}</p> : null}
                            </>
                        )}
                    </div>
                ) : null}
            </main>

            <div className={styles.strip} role="group" aria-label="The questions" data-drawing={drawing || undefined}>
                <button type="button" className={styles.stripBtn} onClick={() => step(-1)} disabled={!canStep(state, -1)}>
                    &larr;&nbsp;Back
                </button>
                <span className={styles.where}>{where}</span>
                <button type="button" className={styles.stripBtn} onClick={() => step(1)} disabled={!canStep(state, 1)}>
                    {nextWord(state)}&nbsp;&rarr;
                </button>
                <span className={styles.stripRule} />
                <button type="button" className={`${styles.stripBtn} ${styles.check}`} onClick={onCheck} disabled={state.checked || rd.drawn === 0}>
                    Check
                </button>
                <button type="button" className={styles.stripBtn} onClick={onClear} disabled={rd.drawn === 0}>
                    Clear
                </button>
            </div>
        </div>
    );
}
