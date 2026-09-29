'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import bench from '@/components/bench/bench.module.css';
import styles from './reverb-by-ear.module.css';
import { benchSans, benchSerif } from '@/components/bench/fonts';
import { Legal } from '@/components/bench/BenchBits';
import { useBenchAudio, glide } from '@/components/bench/useBenchAudio';
import { buildReverbGraph, SOURCE_TRIM } from '@/components/resources/ReverbBench';
import {
    impulse, SOURCES, BPM, BEATS_PER_BAR, MODEL_RATE, DB_FLOOR, DB_RT60,
    tailShape, fmtSec, sig3,
} from '@/lib/bench/reverb-model';
import {
    drawSet, normaliseCode, randomCode, soundState, markRound, leanOf, leanSentences,
    TIME_LADDER, WET_LADDER, DRY_RUNG, ROUND_TYPES, ROUNDS_PER_SET, TYPE_LABEL, EMPTY_ANSWER,
    ANSWER_TIME, ANSWER_WET, TIME_TOL, WET_TOL, RULE_OF_THUMB,
} from '@/lib/bench/reverb-by-ear';

// Reverb by ear (1.12): calibration ladders, then five blind rounds on the
// Reverb bench's own vocal, marked the way the exam's reverb table is marked,
// then the pupil's lean. Built 29 Sep 2026 for the Upper Sixth.
//
// Its own page rather than a stage of the bench: the bench prints its
// settings in six places (the dials, the stage note, the stats, the canvas's
// data attributes), and a blind round must print none of them; and a class
// shares one set by one URL (?set=CODE). The sound is the bench's: the same
// graph (buildReverbGraph), the same impulse() and the same vocal file, so
// the loudness trims are the bench's measured ones.
//
// The hidden settings live in JS state only. Nothing about a round reaches
// the DOM, the canvas or the URL until Reveal is pressed.

const FILES = { vocal: '/bench-audio/reverb/vocal.mp3' };
const LEVEL = 0.8;

const blankAnswers = () => Array.from({ length: ROUNDS_PER_SET }, () => ({ ...EMPTY_ANSWER }));
const blankFlags = () => Array.from({ length: ROUNDS_PER_SET }, () => false);
const pct = (n) => `${Math.round(n)}%`;
const secs = (t) => fmtSec(sig3(t));

export default function ReverbByEar({ back }) {
    // ---- the set ----
    const [code, setCode] = useState(null);
    const [setNo, setSetNo] = useState(1);
    const [idx, setIdx] = useState(0);
    const [answers, setAnswers] = useState(blankAnswers);
    const [revealed, setRevealed] = useState(blankFlags);
    const [finished, setFinished] = useState(false);
    const rounds = useMemo(() => (code ? drawSet(code, setNo) : null), [code, setNo]);

    // The code comes off the URL, or a fresh one is made and written there so
    // a refresh keeps the same rounds. Read after mount: the page is a static
    // export and the server never sees the query.
    useEffect(() => {
        const q = new URLSearchParams(window.location.search);
        const given = normaliseCode(q.get('set'));
        const n = Math.max(1, Math.min(99, parseInt(q.get('n') || '1', 10) || 1));
        // One read of the URL on mount; a hydrated page cannot know it sooner.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCode(given || randomCode());
        setSetNo(n);
    }, []);
    useEffect(() => {
        if (!code) return;
        const q = new URLSearchParams(window.location.search);
        q.set('set', code);
        if (setNo > 1) q.set('n', String(setNo)); else q.delete('n');
        const next = `${window.location.pathname}?${q.toString()}`;
        if (next !== `${window.location.pathname}${window.location.search}`) window.history.replaceState(null, '', next);
    }, [code, setNo]);

    // ---- sound: the bench's own graph ----
    const onSchedule = useCallback(({ bar, barStart, playBuffer }) => {
        if (bar % SOURCES.vocal.bars !== 0) return;
        playBuffer('vocal', barStart, { gain: SOURCE_TRIM.vocal });
    }, []);
    const audio = useBenchAudio({ files: FILES, bpm: BPM, beatsPerBar: BEATS_PER_BAR, onSchedule, buildGraph: buildReverbGraph });
    const { nodesRef, playing, begin, start, stop, restart } = audio;
    const [nowId, setNowId] = useState(null);
    const [dryOn, setDryOn] = useState(false);
    const impCache = useRef(new Map());

    const sound = useCallback(async (id, s, { dry = false } = {}) => {
        const ctx = await begin();
        const nodes = nodesRef.current;
        const graph = nodes?.graph;
        if (!ctx || !graph) return;
        glide(nodes.level.gain, LEVEL, ctx);
        const key = `${s.type}|${s.time}|${s.damping}|${ctx.sampleRate}`;
        let imp = impCache.current.get(key);
        if (!imp) {
            imp = impulse({ type: s.type, time: s.time, damping: s.damping, stereo: s.stereo }, ctx.sampleRate);
            impCache.current.set(key, imp);
        }
        const buf = ctx.createBuffer(2, imp.left.length, imp.sampleRate);
        buf.copyToChannel(imp.left, 0);
        buf.copyToChannel(imp.right, 1);
        graph.setBuffer(buf);
        graph.set(s);
        graph.holdDry(dry);
        setDryOn(dry);
        if (playing) restart(); else await start();
        setNowId(id);
    }, [begin, nodesRef, playing, restart, start]);

    const silence = useCallback(() => {
        stop();
        setNowId(null);
        setDryOn(false);
    }, [stop]);

    const toggleRung = (rung) => {
        if (playing && nowId === rung.id) { silence(); return; }
        sound(rung.id, soundState(rung));
    };

    const round = rounds ? rounds[idx] : null;
    const roundId = `round-${setNo}-${idx}`;
    const roundPlaying = playing && nowId === roundId;
    const toggleRound = () => {
        if (!round) return;
        if (roundPlaying) { silence(); return; }
        sound(roundId, soundState(round));
    };
    const toggleDry = () => {
        if (!round) return;
        if (!roundPlaying) { sound(roundId, soundState(round), { dry: true }); return; }
        const next = !dryOn;
        nodesRef.current?.graph?.holdDry(next);
        setDryOn(next);
    };

    // ---- answering ----
    const answer = answers[idx];
    const isRevealed = revealed[idx];
    const setAnswer = (patch) => {
        if (isRevealed) return;
        setAnswers((all) => all.map((a, i) => (i === idx ? { ...a, ...patch } : a)));
    };
    const reveal = () => setRevealed((all) => all.map((r, i) => (i === idx ? true : r)));
    const nextRound = () => {
        if (roundPlaying) silence();
        if (idx < ROUNDS_PER_SET - 1) setIdx(idx + 1);
        else setFinished(true);
    };
    const nextSet = () => {
        if (playing) silence();
        setSetNo((n) => n + 1);
        setIdx(0);
        setAnswers(blankAnswers());
        setRevealed(blankFlags());
        setFinished(false);
    };

    const marks = round && isRevealed ? markRound(answer, round) : null;
    const scoreSoFar = rounds
        ? rounds.reduce((s, r, i) => (revealed[i] ? s + markRound(answers[i], r).total : s), 0)
        : 0;
    const revealedCount = revealed.filter(Boolean).length;
    const lean = finished && rounds ? leanOf(rounds, answers) : null;

    // An untouched slider sits mid-way and reads "not set". A tap on it with
    // no move still sets it (pointer up or a key), so 50% can be an answer.
    const timeValue = answer.time ?? Math.round(((ANSWER_TIME.min + ANSWER_TIME.max) / 2) * 10) / 10;
    const wetValue = answer.wet ?? 50;
    const fill = (v, r) => `${((v - r.min) / (r.max - r.min)) * 100}%`;

    return (
        <div className={`${bench.scope} ${benchSans.variable} ${benchSerif.variable} ${styles.scope}`}>
            <div className={styles.page}>
                <header className={styles.head}>
                    {back ? <a className={bench.back} href={back.href}>{back.label}</a> : null}
                    <span className={bench.code}>1.12 Reverb</span>
                    <h1 className={bench.title}>Reverb by ear</h1>
                    <Link className={styles.benchLink} href="/reverb-bench">Open the bench</Link>
                </header>

                <div className={styles.setBar}>
                    <span className={styles.codeChip} data-set-code={code || undefined}>
                        <span className={bench.eyebrow}>Class code</span>
                        <b>{code || '....'}</b>
                        {setNo > 1 ? <span className={styles.setNo}>set {setNo}</span> : null}
                    </span>
                    <span className={styles.setHint}>
                        Everyone who opens <code>/reverb-by-ear?set={code || '....'}{setNo > 1 ? `&n=${setNo}` : ''}</code> hears the same five rounds.
                    </span>
                </div>

                <p className={styles.lede}>
                    A past question: a pop vocal, with its reverb set out in a table: Type, Reverb time (s), Wet level %. Tune your ear on the two ladders first. Then do five blind rounds, and I will show you which way you lean.
                </p>

                <div className={styles.grid}>
                    {/* ---- 1. the ladders ---- */}
                    <section className={styles.card} aria-labelledby="ladders-h">
                        <h2 id="ladders-h" className={styles.h2}><span className={styles.num}>1</span>Tune your ear</h2>
                        <p className={styles.note}>The same vocal every time. Listen for how long the tail hangs after each phrase, then for how loud it sits behind the voice.</p>
                        <Ladder
                            label="Reverb time"
                            sub="hall, 20% wet"
                            rungs={TIME_LADDER}
                            text={(r) => secs(r.time)}
                            nowId={playing ? nowId : null}
                            onPress={toggleRung}
                        />
                        <Ladder
                            label="Wet level"
                            sub="hall, 2 s"
                            rungs={WET_LADDER}
                            text={(r) => pct(r.wet)}
                            nowId={playing ? nowId : null}
                            onPress={toggleRung}
                        />
                        <Ladder
                            label="Dry"
                            sub="no reverb at all"
                            rungs={[DRY_RUNG]}
                            text={() => 'Dry vocal'}
                            nowId={playing ? nowId : null}
                            onPress={toggleRung}
                        />
                        <p className={styles.note}>Press a lit button again to stop it.</p>
                    </section>

                    {/* ---- 2. the round ---- */}
                    {rounds && !finished ? (
                        <section className={styles.card} aria-labelledby="round-h">
                            <div className={styles.roundHead}>
                                <h2 id="round-h" className={styles.h2}><span className={styles.num}>2</span>Blind round {idx + 1} of {ROUNDS_PER_SET}</h2>
                                <ol className={styles.dots} aria-label="Rounds">
                                    {rounds.map((r, i) => (
                                        <li key={r.n} data-state={i === idx ? 'now' : revealed[i] ? 'done' : 'todo'} aria-current={i === idx ? 'step' : undefined}>
                                            <span className={styles.srOnly}>Round {i + 1}{revealed[i] ? ', revealed' : ''}</span>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                            <div className={styles.transport}>
                                <button type="button" className={bench.play} aria-pressed={roundPlaying} aria-label={roundPlaying ? 'Stop the round' : 'Play the round'} onClick={toggleRound}>
                                    {roundPlaying ? (
                                        <svg width="14" height="14" viewBox="0 0 12 12" aria-hidden="true"><rect width="12" height="12" rx="1.5" fill="currentColor" /></svg>
                                    ) : (
                                        <svg width="16" height="16" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 1.2v9.6L11 6z" fill="currentColor" /></svg>
                                    )}
                                </button>
                                <button type="button" className={bench.hold} data-held={roundPlaying && dryOn} aria-pressed={roundPlaying && dryOn} onClick={toggleDry}>
                                    {roundPlaying && dryOn ? 'Dry: on' : 'Dry: off'}
                                </button>
                                <span className={styles.note}>Play it as often as you like. Dry takes the reverb off, so you can hear what it adds.</span>
                            </div>

                            <div className={styles.table} role="table" aria-label="Your answer">
                                <div className={styles.tr} role="row" data-head>
                                    <span role="columnheader" />
                                    <span role="columnheader" className={bench.eyebrow}>Your answer</span>
                                    {isRevealed ? <span role="columnheader" className={bench.eyebrow}>The answer</span> : null}
                                    {isRevealed ? <span role="columnheader" className={bench.eyebrow}>Mark</span> : null}
                                </div>

                                <div className={styles.tr} role="row" data-revealed={isRevealed || undefined}>
                                    <span role="rowheader" className={styles.th}>Type</span>
                                    <span role="cell" className={styles.td}>
                                        <span className={styles.typeBtns} role="group" aria-label="Type">
                                            {ROUND_TYPES.map((t) => (
                                                <button key={t} type="button" className={`${bench.chip} ${styles.typeBtn}`} aria-pressed={answer.type === t} disabled={isRevealed} onClick={() => setAnswer({ type: t })}>
                                                    {TYPE_LABEL[t]}
                                                </button>
                                            ))}
                                        </span>
                                    </span>
                                    {isRevealed ? <Truth text={TYPE_LABEL[round.type]} /> : null}
                                    {isRevealed ? <Mark ok={marks.type} why={answer.type == null ? 'not set' : marks.type ? 'matches' : 'a different type'} /> : null}
                                </div>

                                <div className={styles.tr} role="row" data-revealed={isRevealed || undefined}>
                                    <span role="rowheader" className={styles.th}>Reverb time (s)</span>
                                    <span role="cell" className={styles.td}>
                                        <span className={styles.slider}>
                                            <input
                                                type="range"
                                                className={bench.range}
                                                min={ANSWER_TIME.min}
                                                max={ANSWER_TIME.max}
                                                step={ANSWER_TIME.step}
                                                value={timeValue}
                                                data-unset={answer.time == null || undefined}
                                                disabled={isRevealed}
                                                style={{ '--fill': answer.time == null ? '0%' : fill(timeValue, ANSWER_TIME) }}
                                                onChange={(e) => setAnswer({ time: Math.round(Number(e.target.value) * 10) / 10 })}
                                                onPointerUp={(e) => { if (answer.time == null) setAnswer({ time: Math.round(Number(e.currentTarget.value) * 10) / 10 }); }}
                                                onKeyUp={(e) => { if (answer.time == null) setAnswer({ time: Math.round(Number(e.currentTarget.value) * 10) / 10 }); }}
                                                aria-label="Reverb time in seconds"
                                                aria-valuetext={answer.time == null ? 'not set' : `${answer.time.toFixed(1)} seconds`}
                                            />
                                            <span className={bench.value} data-unset={answer.time == null || undefined}>{answer.time == null ? 'not set' : <>{answer.time.toFixed(1)}<small>s</small></>}</span>
                                        </span>
                                    </span>
                                    {isRevealed ? <Truth text={`${round.time.toFixed(1)} s`} /> : null}
                                    {isRevealed ? <Mark ok={marks.time} why={answer.time == null ? 'not set' : marks.time ? `within ${TIME_TOL} s` : `out by ${Math.abs(answer.time - round.time).toFixed(1)} s`} /> : null}
                                </div>

                                <div className={styles.tr} role="row" data-revealed={isRevealed || undefined}>
                                    <span role="rowheader" className={styles.th}>Wet level %</span>
                                    <span role="cell" className={styles.td}>
                                        <span className={styles.slider}>
                                            <input
                                                type="range"
                                                className={bench.range}
                                                min={ANSWER_WET.min}
                                                max={ANSWER_WET.max}
                                                step={ANSWER_WET.step}
                                                value={wetValue}
                                                data-unset={answer.wet == null || undefined}
                                                disabled={isRevealed}
                                                style={{ '--fill': answer.wet == null ? '0%' : fill(wetValue, ANSWER_WET) }}
                                                onChange={(e) => setAnswer({ wet: Math.round(Number(e.target.value)) })}
                                                onPointerUp={(e) => { if (answer.wet == null) setAnswer({ wet: Math.round(Number(e.currentTarget.value)) }); }}
                                                onKeyUp={(e) => { if (answer.wet == null) setAnswer({ wet: Math.round(Number(e.currentTarget.value)) }); }}
                                                aria-label="Wet level in per cent"
                                                aria-valuetext={answer.wet == null ? 'not set' : `${answer.wet} per cent`}
                                            />
                                            <span className={bench.value} data-unset={answer.wet == null || undefined}>{answer.wet == null ? 'not set' : <>{answer.wet}<small>%</small></>}</span>
                                        </span>
                                    </span>
                                    {isRevealed ? <Truth text={pct(round.wet)} /> : null}
                                    {isRevealed ? <Mark ok={marks.wet} why={answer.wet == null ? 'not set' : marks.wet ? `within ${WET_TOL} points` : `out by ${Math.abs(answer.wet - round.wet)} points`} /> : null}
                                </div>
                            </div>

                            <div className={styles.actions}>
                                {!isRevealed ? (
                                    <button type="button" className={styles.primary} onClick={reveal}>Reveal</button>
                                ) : (
                                    <>
                                        <span className={styles.roundScore}><b>{marks.total}</b> of 3 this round</span>
                                        <button type="button" className={styles.primary} onClick={nextRound}>
                                            {idx < ROUNDS_PER_SET - 1 ? 'Next round' : 'See my lean'}
                                        </button>
                                    </>
                                )}
                                <span className={styles.running}>{revealedCount ? `${scoreSoFar} of ${revealedCount * 3} so far` : 'Type must match. Time counts within 0.5 s. Wet counts within 10 points.'}</span>
                            </div>
                        </section>
                    ) : null}

                    {/* ---- 3. the lean ---- */}
                    {finished && lean ? (
                        <section className={styles.card} aria-labelledby="lean-h" data-lean>
                            <h2 id="lean-h" className={styles.h2}><span className={styles.num}>3</span>Which way you lean</h2>
                            <p className={styles.score}><b>{lean.score}</b> out of {lean.outOf}</p>
                            <div className={styles.leanLines}>
                                {leanSentences(lean).map((l) => <p key={l}>{l}</p>)}
                            </div>
                            <p className={styles.thumb}><span className={bench.eyebrow}>Rule of thumb</span>{RULE_OF_THUMB}</p>
                            <table className={styles.recap}>
                                <thead>
                                    <tr><th>Round</th><th>The answer</th><th>Yours</th><th>Marks</th></tr>
                                </thead>
                                <tbody>
                                    {rounds.map((r, i) => {
                                        const a = answers[i];
                                        return (
                                            <tr key={r.n}>
                                                <td>{r.n}</td>
                                                <td>{TYPE_LABEL[r.type]}, {r.time.toFixed(1)} s, {pct(r.wet)}</td>
                                                <td>{a.type ? TYPE_LABEL[a.type] : '-'}, {a.time == null ? '-' : `${a.time.toFixed(1)} s`}, {a.wet == null ? '-' : pct(a.wet)}</td>
                                                <td>{markRound(a, r).total} of 3</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            <div className={styles.actions}>
                                <button type="button" className={styles.primary} onClick={nextSet}>Next set</button>
                                <span className={styles.running}>The next set is the same for everyone on code {code}.</span>
                            </div>
                        </section>
                    ) : null}
                </div>

                {/* ---- the tail, after Reveal only ---- */}
                {rounds && !finished ? (
                    <section className={styles.stage} aria-label="The reverb tail">
                        {isRevealed ? (
                            <>
                                <TailPicture truth={round} answer={answer} />
                                <div className={styles.legend} aria-hidden="true">
                                    <span><i style={{ background: 'var(--hit)' }} />dry</span>
                                    <span><i style={{ background: 'var(--gen-1)' }} />the answer&apos;s tail</span>
                                    {answer.type && answer.time != null && answer.wet != null ? <span><i data-dash style={{ borderColor: 'var(--gold-bright)' }} />yours</span> : null}
                                </div>
                            </>
                        ) : (
                            <p className={styles.stageWait}>The tail is drawn here after Reveal.</p>
                        )}
                    </section>
                ) : null}

                <footer className={styles.foot}><Legal /></footer>
            </div>
        </div>
    );
}

function Ladder({ label, sub, rungs, text, nowId, onPress }) {
    return (
        <div className={styles.ladder}>
            <div className={styles.ladderHead}>
                <span className={bench.eyebrow}>{label}</span>
                <span className={styles.ladderSub}>{sub}</span>
            </div>
            <div className={styles.rungs} role="group" aria-label={label}>
                {rungs.map((r) => (
                    <button key={r.id} type="button" className={styles.rung} aria-pressed={nowId === r.id} onClick={() => onPress(r)}>
                        <svg width="10" height="10" viewBox="0 0 12 12" aria-hidden="true">
                            {nowId === r.id ? <rect width="12" height="12" rx="1.5" fill="currentColor" /> : <path d="M2 1.2v9.6L11 6z" fill="currentColor" />}
                        </svg>
                        {text(r)}
                    </button>
                ))}
            </div>
        </div>
    );
}

const Truth = ({ text }) => <span role="cell" className={styles.truth}>{text}</span>;
const Mark = ({ ok, why }) => (
    <span role="cell" className={styles.mark} data-ok={ok}>
        <b>{ok ? 1 : 0}</b>
        <span>{why}</span>
    </span>
);

// ---- the tail: the bench's own tailShape() for the true settings, with the
// pupil's answer drawn over it as a dashed envelope. Static: redrawn on a
// resize or a new round, never per frame.
function TailPicture({ truth, answer }) {
    const canvasRef = useRef(null);
    const truthState = useMemo(() => soundState(truth), [truth]);
    const imp = useMemo(
        () => impulse({ type: truthState.type, time: truthState.time, damping: truthState.damping, stereo: 'stereo' }, MODEL_RATE),
        [truthState],
    );
    const mine = answer.type && answer.time != null && answer.wet != null
        ? soundState({ type: answer.type, time: Math.max(0.2, answer.time), wet: answer.wet })
        : null;
    const mineKey = mine ? `${mine.type}|${mine.time}|${mine.wet}` : '';

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return undefined;
        const css = getComputedStyle(canvas.parentElement);
        const v = (name, fallback) => css.getPropertyValue(name).trim() || fallback;
        const col = {
            dry: v('--hit', '#f6f3ec'),
            tail: v('--gen-1', '#7fb39b'),
            gold: v('--gold-bright', '#f0d48a'),
            mine: v('--gold-bright', '#f0d48a'),
            ink: 'rgba(255, 255, 255, 0.62)',
            faint: 'rgba(255, 255, 255, 0.38)',
            grid: 'rgba(255, 255, 255, 0.08)',
            gridStrong: 'rgba(255, 255, 255, 0.2)',
        };
        const monoFace = v('--mono', 'monospace');

        function draw() {
            const g = canvas.getContext('2d');
            const dpr = window.devicePixelRatio || 1;
            const w = canvas.clientWidth;
            const h = canvas.clientHeight;
            if (!w || !h) return;
            canvas.width = Math.round(w * dpr);
            canvas.height = Math.round(h * dpr);
            g.setTransform(dpr, 0, 0, dpr, 0, 0);
            g.clearRect(0, 0, w, h);
            const narrow = w < 520;
            const padL = narrow ? 44 : 46;
            const padR = narrow ? 14 : 24;
            const top = 40;
            const bottom = h - 30;
            const box = { x0: padL, y0: top, x1: w - padR, y1: bottom };
            const span = (s) => (s.predelay / 1000) + (s.type === 'reversed' ? s.time : 1.2 * s.time);
            const tWin = Math.max(0.6, Math.max(span(truthState), mine ? span(mine) : 0) * 1.06);
            const t = tailShape(truthState, box, imp, tWin);
            const small = `${narrow ? 9.5 : 10}px ${monoFace}`;
            const mono = `${narrow ? 10.5 : 11.5}px ${monoFace}`;

            // dB grid, the -60 dB line named
            g.font = small;
            g.textAlign = 'right';
            for (let db = 0; db >= DB_FLOOR; db -= 12) {
                const y = Math.round(t.yOf(db)) + 0.5;
                const named = db === DB_RT60;
                g.strokeStyle = named ? col.gridStrong : col.grid;
                g.setLineDash(named ? [4, 4] : []);
                g.beginPath();
                g.moveTo(padL, y);
                g.lineTo(w - padR, y);
                g.stroke();
                g.setLineDash([]);
                g.fillStyle = named ? col.ink : col.faint;
                g.fillText(named ? (narrow ? '-60' : '-60 dB') : `${db}`, padL - 6, y + 3.5);
            }
            // time axis
            const step = tWin > 2.5 ? 0.5 : tWin > 1 ? 0.2 : 0.1;
            g.textAlign = 'center';
            g.fillStyle = col.faint;
            let lastX = -99;
            for (let ts = 0; ts <= tWin + 1e-6; ts += step) {
                const x = Math.round(t.xOf(ts)) + 0.5;
                if (x - lastX < (narrow ? 40 : 34)) continue;
                lastX = x;
                g.fillText(ts === 0 ? '0' : ts >= 1 ? `${Number(ts.toFixed(1))} s` : `${Math.round(ts * 1000)} ms`, x, bottom + 16);
            }

            // the tail as its reflections, the envelope dotted over it
            g.strokeStyle = col.tail;
            g.lineWidth = 1;
            g.globalAlpha = 0.85;
            g.beginPath();
            for (const [bx, by] of t.bars) {
                const x = Math.round(bx) + 0.5;
                g.moveTo(x, t.baseY);
                g.lineTo(x, by);
            }
            g.stroke();
            g.globalAlpha = 1;
            g.lineWidth = 1.4;
            g.setLineDash([2, 5]);
            g.beginPath();
            t.points.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
            g.stroke();
            g.setLineDash([]);
            // first reflections
            g.strokeStyle = col.gold;
            g.lineWidth = 1.6;
            for (const tap of t.taps) {
                g.beginPath();
                g.moveTo(Math.round(tap.x) + 0.5, t.baseY);
                g.lineTo(Math.round(tap.x) + 0.5, tap.y);
                g.stroke();
            }
            // the dry event
            g.fillStyle = col.dry;
            g.fillRect(t.dryX - 3, t.dryY, 6, t.baseY - t.dryY);

            // the reverb time, bracketed at the -60 dB crossing
            const cx = t.handle.x;
            g.strokeStyle = col.tail;
            g.lineWidth = 1;
            g.beginPath();
            g.moveTo(t.gapX1, t.floorY + 12); g.lineTo(cx, t.floorY + 12);
            g.moveTo(t.gapX1, t.floorY + 7); g.lineTo(t.gapX1, t.floorY + 17);
            g.moveTo(cx, t.floorY + 7); g.lineTo(cx, t.floorY + 17);
            g.stroke();
            {
                const label = `${TYPE_LABEL[truth.type].toLowerCase()} · ${secs(truth.time)} · ${truth.wet}% wet`;
                g.font = mono;
                g.textAlign = 'center';
                const lx = Math.max(padL + 70, Math.min(w - padR - 70, (t.gapX1 + cx) / 2));
                const lw = g.measureText(label).width;
                g.fillStyle = 'rgba(23, 23, 43, 0.88)';
                g.fillRect(lx - lw / 2 - 5, t.floorY + 17, lw + 10, 15);
                g.fillStyle = col.tail;
                g.fillText(label, lx, t.floorY + 28);
            }

            // the pupil's answer, dashed, on the same axes
            if (mine) {
                const m = tailShape(mine, box, null, tWin);
                g.strokeStyle = col.mine;
                g.lineWidth = 1.6;
                g.setLineDash([7, 5]);
                g.beginPath();
                m.points.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
                g.stroke();
                g.setLineDash([]);
                const peak = m.points.reduce((a, p) => (p[1] < a[1] ? p : a), m.points[0]);
                g.font = mono;
                g.textAlign = 'left';
                g.fillStyle = col.mine;
                const yours = `yours: ${TYPE_LABEL[mine.type].toLowerCase()} · ${secs(mine.time)} · ${mine.wet}% wet`;
                const yw = g.measureText(yours).width;
                const yx = Math.min(w - padR - yw, Math.max(padL + 12, peak[0] + 10));
                g.fillText(yours, yx, Math.max(top - 8, peak[1] - 8));
            }
        }
        draw();
        const ro = new ResizeObserver(draw);
        ro.observe(canvas);
        return () => ro.disconnect();
    }, [imp, truthState, truth, mineKey]); // eslint-disable-line react-hooks/exhaustive-deps

    return <canvas ref={canvasRef} role="img" aria-label={`The reverb tail in decibels against time: ${TYPE_LABEL[truth.type]}, ${secs(truth.time)}, ${truth.wet}% wet${mine ? `, with your answer dashed over it` : ''}`} />;
}
