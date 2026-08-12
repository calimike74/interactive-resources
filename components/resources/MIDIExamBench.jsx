'use client';

import { useState } from 'react';
import Callout from '@/components/Callout';
import { toBinary7, fromBinary7, split14, combine14, bendSemitones, divisionMs } from '@/lib/midi/engine';

// ═══════════════════════════════════════════════════════════════════════════
// The MIDI Exam Bench — 1.5 Sequencing
//
// The written paper examines MIDI in six of the last seven years, and what
// it asks for is overwhelmingly NUMERIC: binary/decimal velocity tables,
// why 127 is the ceiling, quantise values, millisecond conversions,
// LSB/MSB splits, pitch-bend arithmetic. This bench drills exactly those
// demands in three escalating levels, every item marked by the same maths
// module the tests pin down (lib/midi/engine.js — its conventions match
// the WO-06 flagship page byte for byte). The AUDIBLE side of pitch bend
// lives on the flagship page; this bench is deliberately the pen-and-paper
// side, because that is what the exam hall asks for.
// ═══════════════════════════════════════════════════════════════════════════

const FRAUNCES = 'font-[family-name:var(--font-fraunces)]';
const MONO = 'font-[family-name:var(--font-jbmono)]';
const CARD_SHADOW = 'shadow-[0_1px_0_rgba(43,36,24,0.04),0_18px_40px_-24px_rgba(43,36,24,0.22)]';

// ─── Item primitives ────────────────────────────────────────────────────────

function ResultLine({ ok, answerText }) {
    return (
        <p className={`mt-2 text-sm leading-snug ${ok ? 'text-field-700' : 'text-sienna-700'}`}>
            {ok ? 'Right. ' : 'Not quite — '}
            <span className="text-ink/70">{answerText}</span>
        </p>
    );
}

function NumericItem({ prompt, placeholder, checker, answerText, onMarked }) {
    const [value, setValue] = useState('');
    const [result, setResult] = useState(null);
    const check = () => {
        if (result !== null) return;
        const ok = checker(value.trim());
        setResult(ok);
        onMarked(ok);
    };
    return (
        <div className="rounded-xl border border-line bg-paper p-4">
            <p className="text-sm leading-relaxed text-ink/85">{prompt}</p>
            <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
                <input
                    type="text"
                    inputMode="text"
                    value={value}
                    placeholder={placeholder}
                    disabled={result !== null}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && check()}
                    className={`${MONO} w-40 rounded-lg border border-line bg-cream/50 px-3 py-1.5 text-sm text-ink outline-none focus:border-field-600`}
                    aria-label={prompt}
                />
                <button
                    type="button"
                    onClick={check}
                    disabled={result !== null || value.trim() === ''}
                    className="rounded-full bg-field-600 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-field-700 disabled:opacity-40"
                >
                    Check
                </button>
            </div>
            {result !== null && <ResultLine ok={result} answerText={answerText} />}
        </div>
    );
}

function MCQItem({ prompt, options, correctIx, explanation, onMarked }) {
    const [picked, setPicked] = useState(null);
    const pick = (ix) => {
        if (picked !== null) return;
        setPicked(ix);
        onMarked(ix === correctIx);
    };
    return (
        <div className="rounded-xl border border-line bg-paper p-4">
            <p className="text-sm leading-relaxed text-ink/85">{prompt}</p>
            <div className="mt-2.5 grid gap-2">
                {options.map((o, ix) => (
                    <button
                        key={o}
                        type="button"
                        onClick={() => pick(ix)}
                        disabled={picked !== null}
                        className={`rounded-lg border px-3 py-2 text-left text-sm leading-snug transition-colors ${
                            picked === null
                                ? 'border-line text-ink/80 hover:border-ink/40'
                                : ix === correctIx
                                  ? 'border-field-600 bg-field-100 text-field-700'
                                  : ix === picked
                                    ? 'border-sienna-600 bg-sienna-100 text-sienna-700'
                                    : 'border-line text-ink/45'
                        }`}
                    >
                        {o}
                    </button>
                ))}
            </div>
            {picked !== null && <ResultLine ok={picked === correctIx} answerText={explanation} />}
        </div>
    );
}

// ─── Level scaffolding ─────────────────────────────────────────────────────

function Level({ number, title, intro, open, onOpen, tally, total, children }) {
    return (
        <section className="mt-12">
            <p className={`${MONO} text-xs uppercase tracking-wide text-sienna-600`}>Level {number}</p>
            <div className="mt-1 flex flex-wrap items-baseline justify-between gap-3">
                <h2 className={`${FRAUNCES} text-2xl font-medium text-ink sm:text-3xl`}>{title}</h2>
                {open && (
                    <span className={`${MONO} text-sm ${tally.marked === total ? (tally.right === total ? 'text-field-700' : 'text-sienna-700') : 'text-ink/50'}`}>
                        {tally.right}/{total}
                    </span>
                )}
            </div>
            <p className="mt-3 max-w-[65ch] text-base leading-relaxed text-ink/75">{intro}</p>
            {open ? (
                <div className="mt-4 grid gap-3">{children}</div>
            ) : (
                <button
                    type="button"
                    onClick={onOpen}
                    className="mt-4 rounded-full border border-field-600 bg-field-100 px-5 py-2 text-sm font-semibold text-field-700 transition-colors hover:bg-field-600 hover:text-white"
                >
                    Open level {number}
                </button>
            )}
        </section>
    );
}

function useTally() {
    const [tally, setTally] = useState({ marked: 0, right: 0 });
    const onMarked = (ok) => setTally((t) => ({ marked: t.marked + 1, right: t.right + (ok ? 1 : 0) }));
    return [tally, onMarked];
}

// ─── Hero (engine-computed: the split of 8192, the number the paper loves) ──

const HERO_SPLIT = split14(8192);
const HERO_MSB_BITS = toBinary7(HERO_SPLIT.msb);
const HERO_LSB_BITS = toBinary7(HERO_SPLIT.lsb);

function Hero() {
    return (
        <div className="relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #24301F 0%, #1F2A1C 45%, #1A241A 100%)' }}>
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                    background:
                        'radial-gradient(90% 60% at 20% 0%, rgba(220,200,146,0.08), transparent 60%), radial-gradient(70% 50% at 90% 100%, rgba(160,82,45,0.10), transparent 60%)',
                }}
            />
            <div className="relative mx-auto flex max-w-3xl flex-col gap-8 px-4 py-12 sm:px-6 sm:py-14 md:flex-row md:items-center md:justify-between">
                <div className="max-w-lg">
                    <p className={`${MONO} text-xs uppercase tracking-[0.18em] text-[#DCC892]`}>C4 · 1.5 Sequencing · an exam bench</p>
                    <h1 className={`${FRAUNCES} mt-2 text-4xl font-medium text-[#F2EBE0] sm:text-[2.75rem] sm:leading-tight`}>The MIDI Exam Bench</h1>
                    <p className="mt-3 text-base leading-relaxed text-[#F2EBE0]/75">
                        MIDI numbers appear on six of the last seven papers. Three levels of the exact arithmetic they
                        ask for — marked as you go, no mercy, no calculator needed.
                    </p>
                </div>
                <div className={`${MONO} shrink-0 rounded-2xl border border-[rgba(242,235,224,0.2)] bg-[rgba(242,235,224,0.06)] p-5 text-[#F2EBE0]`}>
                    <p className="text-[11px] uppercase tracking-wide text-[#F2EBE0]/60">pitch bend · centre</p>
                    <p className="mt-1 text-3xl font-bold">8192</p>
                    <div className="mt-3 flex gap-3 text-[13px]">
                        <div>
                            <p className="text-[10px] text-[#F2EBE0]/55">MSB {HERO_SPLIT.msb}</p>
                            <p className="tracking-[0.12em] text-[#DCC892]">{HERO_MSB_BITS}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-[#F2EBE0]/55">LSB {HERO_SPLIT.lsb}</p>
                            <p className="tracking-[0.12em] text-[#DCC892]">{HERO_LSB_BITS}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── The page ───────────────────────────────────────────────────────────────

const L1_TOTAL = 4;
const L2_TOTAL = 4;
const L3_TOTAL = 5;

export default function MIDIExamBench() {
    const [t1, mark1] = useTally();
    const [t2, mark2] = useTally();
    const [t3, mark3] = useTally();
    const [open2, setOpen2] = useState(false);
    const [open3, setOpen3] = useState(false);

    const grand = t1.right + t2.right + t3.right;
    const grandMarked = t1.marked + t2.marked + t3.marked;
    const grandTotal = L1_TOTAL + L2_TOTAL + L3_TOTAL;

    return (
        <div className="min-h-screen bg-cream">
            <Hero />
            <div className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
                <section className="pt-8">
                    <p className="max-w-[65ch] text-base leading-relaxed text-ink/75">
                        This bench is the pen-and-paper twin of the{' '}
                        <a href="/midi-pitch-bend-controller" className="font-semibold text-field-700 underline decoration-field-500/40 underline-offset-2 hover:decoration-field-500">
                            MIDI Pitch Bend &amp; Controllers page
                        </a>{' '}
                        — that page lets you hear and see the data; this one drills the arithmetic the exam hall asks
                        for, at exam speed. Everything is marked instantly, with the working shown.
                    </p>
                    <Callout type="tip" title="This is not hypothetical revision">
                        The 2021 paper&rsquo;s drum question asked candidates to complete a MIDI velocity decimal/binary
                        table and explain why note velocity cannot exceed 127 — exactly the level-one items below. Its
                        bass question opened with quantise-value and pitch-bend-range multiple choice: levels two and
                        three. Six of the last seven papers touch this topic family.
                    </Callout>
                </section>

                <Level
                    number="1"
                    title="The 7-bit world — velocity and controllers"
                    intro="Every ordinary MIDI data byte carries seven usable bits, so its values run 0–127. Binary↔decimal conversion inside that range is a stated exam skill."
                    open
                    tally={t1}
                    total={L1_TOTAL}
                >
                    <NumericItem
                        prompt="A snare hit is recorded at velocity 100. Write 100 as a 7-bit binary value."
                        placeholder="e.g. 0110010"
                        checker={(v) => /^[01]{1,7}$/.test(v) && fromBinary7(v) === 100}
                        answerText={`100 = ${toBinary7(100)}. Work down from the top bit: 64 + 32 + 4 = 100.`}
                        onMarked={mark1}
                    />
                    <NumericItem
                        prompt="A velocity arrives as binary 0111111. What is it in decimal?"
                        placeholder="decimal value"
                        checker={(v) => Number(v) === fromBinary7('0111111')}
                        answerText="0111111 = 32 + 16 + 8 + 4 + 2 + 1 = 63."
                        onMarked={mark1}
                    />
                    <MCQItem
                        prompt="Why can a note's velocity never exceed 127? (A real 2021 exam question.)"
                        options={[
                            'A MIDI data byte reserves its top bit as a status flag, leaving 7 data bits — a maximum of 2⁷ − 1 = 127.',
                            'Computers store all audio values in 8 bits, which maxes out at 127.',
                            'The DAW rounds any higher value down to protect the speakers.',
                            'Values above 127 are reserved for note-off messages.',
                        ]}
                        correctIx={0}
                        explanation="In the MIDI protocol the first bit of every byte says whether it is a status byte or a data byte, so data bytes keep 7 usable bits: 0–127."
                        onMarked={mark1}
                    />
                    <NumericItem
                        prompt="Complete the table row: velocity 1010000 in decimal is —"
                        placeholder="decimal value"
                        checker={(v) => Number(v) === fromBinary7('1010000')}
                        answerText="1010000 = 64 + 16 = 80."
                        onMarked={mark1}
                    />
                </Level>

                <Level
                    number="2"
                    title="Quantise and time — the milliseconds behind the grid"
                    intro="Quantise values are note divisions; delay and groove questions turn them into milliseconds. The only formula you need: one beat = 60,000 ÷ BPM milliseconds."
                    open={open2 || t1.marked >= 2}
                    onOpen={() => setOpen2(true)}
                    tally={t2}
                    total={L2_TOTAL}
                >
                    <MCQItem
                        prompt="A hi-hat part plays constant semiquavers but was recorded loosely. Which quantise value tightens it without destroying the pattern?"
                        options={['1/4', '1/8', '1/16', '1/64']}
                        correctIx={2}
                        explanation="Semiquavers sit on the 1/16 grid. Coarser values (1/4, 1/8) would drag hits onto the wrong beats; much finer (1/64) barely moves anything."
                        onMarked={mark2}
                    />
                    <NumericItem
                        prompt="At 120 BPM, how long is one semiquaver, in milliseconds?"
                        placeholder="ms"
                        checker={(v) => Math.abs(Number(v) - divisionMs(120, 16)) <= 1}
                        answerText="One beat = 60,000 ÷ 120 = 500 ms; a semiquaver is a quarter of that: 125 ms."
                        onMarked={mark2}
                    />
                    <NumericItem
                        prompt="A dotted-quaver delay at 90 BPM — how many milliseconds?"
                        placeholder="ms"
                        checker={(v) => Math.abs(Number(v) - divisionMs(90, 8, 'dotted')) <= 2}
                        answerText="Quaver at 90 BPM = 333 ms; dotted = 1.5× = 500 ms."
                        onMarked={mark2}
                    />
                    <MCQItem
                        prompt="A producer quantises a live drummer's MIDI performance to 1/16 at 100% strength. What is the musical cost?"
                        options={[
                            'The natural push-and-pull of the performance is flattened onto the grid.',
                            'The notes become quieter because quantise reduces velocity.',
                            'The tempo of the track slows down slightly.',
                            'Nothing — quantise only affects note length.',
                        ]}
                        correctIx={0}
                        explanation="Hard quantise moves every hit exactly onto the grid, removing the human timing (swing, push, drag) that made the performance feel alive. Partial strength or groove quantise preserves some of it."
                        onMarked={mark2}
                    />
                </Level>

                <Level
                    number="3"
                    title="The 14-bit world — pitch bend arithmetic"
                    intro="Pitch bend gets two data bytes — 16,384 steps, centred on 8192 — so a glide is smooth instead of audibly stepped. The paper asks for the split, the combination and the sounding result."
                    open={open3 || t2.marked >= 2}
                    onOpen={() => setOpen3(true)}
                    tally={t3}
                    total={L3_TOTAL}
                >
                    <NumericItem
                        prompt="Split the centre value 8192 into its two data bytes. Enter as MSB,LSB (two numbers, comma between)."
                        placeholder="e.g. 32,64"
                        checker={(v) => {
                            const m = v.match(/^(\d{1,3})\s*,\s*(\d{1,3})$/);
                            if (!m) return false;
                            const s = split14(8192);
                            return Number(m[1]) === s.msb && Number(m[2]) === s.lsb;
                        }}
                        answerText="8192 = MSB 64, LSB 0 — binary 1000000 0000000. The flagship page's wheel shows this exact split at rest."
                        onMarked={mark3}
                    />
                    <NumericItem
                        prompt="A pitch-bend message arrives with MSB 96, LSB 0. What 14-bit value is that?"
                        placeholder="value"
                        checker={(v) => Number(v) === combine14(96, 0)}
                        answerText="MSB × 128 + LSB = 96 × 128 = 12,288."
                        onMarked={mark3}
                    />
                    <NumericItem
                        prompt="Bend range is set to ±2 semitones and the wheel is pushed to the maximum, 16,383. How many semitones does the note rise?"
                        placeholder="semitones"
                        checker={(v) => Math.abs(Number(v) - bendSemitones(16383, 2)) <= 0.1}
                        answerText="Full upward travel = the full range: +2 semitones."
                        onMarked={mark3}
                    />
                    <NumericItem
                        prompt="Bend range ±12, value 4096. What is the sounding offset, in semitones? (Sign matters.)"
                        placeholder="e.g. -3"
                        checker={(v) => Math.abs(Number(v) - bendSemitones(4096, 12)) <= 0.2}
                        answerText="4096 is halfway below centre: (4096 − 8192) ÷ 8192 × 12 = −6 semitones."
                        onMarked={mark3}
                    />
                    <MCQItem
                        prompt="Why does pitch bend get 14 bits when velocity manages fine with 7?"
                        options={[
                            'A bend is a continuous glide — with only 128 steps the pitch would move in audible jumps, so it gets 16,384.',
                            'Pitch is a more important parameter than loudness.',
                            'Fourteen bits allow the bend to go both up and down.',
                            'Older synthesisers required two bytes for compatibility.',
                        ]}
                        correctIx={0}
                        explanation="Velocity is one value per note, but a bend sweeps continuously through its range — coarse steps would be heard as zipper noise. Direction comes from being centred on 8192, not from the extra bits themselves."
                        onMarked={mark3}
                    />
                </Level>

                <section className="mt-12 rounded-2xl border border-line bg-paper p-5">
                    <p className={`${FRAUNCES} text-2xl text-ink`}>
                        {grandMarked === grandTotal ? `${grand}/${grandTotal} across the bench` : `${grand} so far — ${grandTotal - grandMarked} item${grandTotal - grandMarked === 1 ? '' : 's'} unanswered`}
                    </p>
                    <p className="mt-2 max-w-[65ch] text-sm leading-relaxed text-ink/70">
                        Anything you dropped, redo from its level — the paper re-asks these in barely-disguised forms.
                        When the arithmetic feels automatic, hear what the numbers actually do on the{' '}
                        <a href="/midi-pitch-bend-controller" className="font-semibold text-field-700 underline decoration-field-500/40 underline-offset-2 hover:decoration-field-500">
                            flagship pitch-bend page
                        </a>
                        , then{' '}
                        <a href="/revise/midi" className="font-semibold text-field-700 underline decoration-field-500/40 underline-offset-2 hover:decoration-field-500">
                            take the MIDI revision quiz
                        </a>
                        .
                    </p>
                </section>
            </div>
        </div>
    );
}
