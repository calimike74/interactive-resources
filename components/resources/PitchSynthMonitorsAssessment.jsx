'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { saveQuizResponse, getNextAttemptNumber } from '@/lib/quiz-persistence';

// ─────────────────────────────────────────────────────────────────────────────
// Topic id used for persistence + lookup against grades-dashboard
// ─────────────────────────────────────────────────────────────────────────────
const TOPIC_ID = 'pitch-synth-monitors-assessment';

// ─────────────────────────────────────────────────────────────────────────────
// Static MCQ bank — matches the worksheet 11 spec
// ─────────────────────────────────────────────────────────────────────────────
const SECTIONS = [
    {
        key: 'pitch',
        label: 'Pitch Correction',
        topic: '1.7 Pitch and Rhythm Correction',
        questions: [
            {
                id: 'psm-pitch-1',
                type: 'mcq',
                question: 'A vocal track has obvious robotic warbling. Which processor is most likely responsible?',
                options: [
                    'Compressor',
                    'Pitch correction',
                    'Reverb',
                    'EQ',
                ],
                correctIndex: 1,
                explanation: 'Robotic warbling is the signature artefact of an over-aggressive pitch correction plug-in snapping rapidly between scale degrees. Reject "pitch shift" — that is a different processor.',
            },
            {
                id: 'psm-pitch-2',
                type: 'mcq',
                question: 'Which response time setting on a pitch correction plug-in creates the "T-Pain effect"?',
                options: [
                    'Very fast (≈ 0 ms)',
                    'Slow (≈ 400 ms)',
                    'Medium (≈ 200 ms)',
                    'None — it is always natural',
                ],
                correctIndex: 0,
                explanation: 'A response time near zero snaps every pitch deviation instantly, producing the stepped robotic effect heard in Cher\'s "Believe" and T-Pain\'s vocal style. Slower settings (200–400 ms) preserve natural pitch movement.',
            },
            {
                id: 'psm-pitch-3',
                type: 'mcq',
                question: 'How does pitch correction differ from pitch shift?',
                options: [
                    'They are the same processor with different names',
                    'Pitch correction snaps notes to scale degrees; pitch shift transposes by a fixed interval',
                    'Pitch correction is for vocals only',
                    'Pitch shift is digital, pitch correction is analogue',
                ],
                correctIndex: 1,
                explanation: 'Pitch correction pulls existing notes towards the nearest scale degree (fixing tuning). Pitch shift transposes every note by the same interval regardless of original pitch (used for harmony or key change).',
            },
        ],
    },
    {
        key: 'synth',
        label: 'Synthesis',
        topic: '1.3 Synthesis',
        questions: [
            {
                id: 'psm-synth-1',
                type: 'mcq',
                question: 'An LFO is creating a continuous pitch wobble on a synth lead. What is it routed to?',
                options: ['Cutoff frequency', 'Pitch', 'Pulse width', 'Volume'],
                correctIndex: 1,
                explanation: 'LFO → pitch produces vibrato (a continuous pitch wobble). Memorise the routing table — these are pure recall marks in the exam.',
            },
            {
                id: 'psm-synth-2',
                type: 'mcq',
                question: 'An LFO routed to filter cutoff creates which effect?',
                options: ['Chorus', 'Tremolo', 'Vibrato', 'Wah-wah'],
                correctIndex: 3,
                explanation: 'LFO → cutoff = wah-wah / auto-filter sweep. The cutoff frequency moves up and down at the LFO\'s rate, opening and closing the filter rhythmically.',
            },
            {
                id: 'psm-synth-3',
                type: 'mcq',
                question: 'An LFO routed to amplitude creates which effect?',
                options: ['Chorus', 'Tremolo', 'Vibrato', 'Wah-wah'],
                correctIndex: 1,
                explanation: 'LFO → amplitude (volume) = tremolo (volume wobble). Do not confuse this with vibrato, which is a pitch wobble.',
            },
            {
                id: 'psm-synth-4',
                type: 'mcq',
                question: 'What are the four ADSR envelope stages, in order?',
                options: [
                    'Attack, Drone, Sustain, Reverb',
                    'Attack, Decay, Sustain, Release',
                    'Amplitude, Duration, Sound, Resolution',
                    'Attack, Delay, Sustain, Release',
                ],
                correctIndex: 1,
                explanation: 'Attack (rise to peak), Decay (fall to sustain level), Sustain (held level while note is pressed — note this is a level, not a time), Release (fade to silence after note off).',
            },
            {
                id: 'psm-synth-5',
                type: 'mcq',
                question: 'An envelope with attack = 0, decay = 0, sustain = 0 will cause:',
                options: [
                    'A click on note start and end',
                    'A pad sound',
                    'No sound at all',
                    'A long sustain',
                ],
                correctIndex: 0,
                explanation: 'Zero attack means the amplitude jumps instantly from silence to peak — an abrupt discontinuity heard as a click. With sustain = 0 and zero decay, it then jumps straight back to silence, creating a second click. Both note edges click.',
            },
            // Numeric drill is inserted here at runtime — see LFO_DRILL_PLACEHOLDER below
        ],
    },
    {
        key: 'monitors',
        label: 'Monitor Speakers',
        topic: '2.2 Monitor Speakers',
        questions: [
            {
                id: 'psm-mon-1',
                type: 'mcq',
                question: 'Why does a bass guitar part lose its low end on a mobile phone speaker?',
                options: [
                    'Phone speakers boost the low end',
                    'Phone speakers have a small driver that cannot reproduce low frequencies',
                    'Bluetooth strips bass',
                    'mp3 compression removes bass',
                ],
                correctIndex: 1,
                explanation: 'A small driver physically cannot move enough air to reproduce frequencies below ~300–500 Hz. The listener may only hear the bass harmonics, not the fundamental — so the bass sounds thin or absent.',
            },
            {
                id: 'psm-mon-2',
                type: 'mcq',
                question: 'What is the main strength of nearfield studio monitors for mixing?',
                options: [
                    'They are loud',
                    'They have a flat frequency response and full bandwidth',
                    'They have built-in EQ',
                    'They are cheap',
                ],
                correctIndex: 1,
                explanation: 'Nearfields are designed for critical listening: flat response across 20 Hz – 20 kHz means you hear the mix accurately without the speaker colouring it. This is what lets you make trustworthy EQ and balance decisions.',
            },
            {
                id: 'psm-mon-3',
                type: 'mcq',
                question: 'What is the main reason to check a mix on a phone speaker?',
                options: [
                    'It sounds better than nearfields',
                    'To check translation: most listeners hear music on similar devices',
                    'It is louder than monitors',
                    'It is a legal requirement',
                ],
                correctIndex: 1,
                explanation: 'Around 60–80% of listeners consume music through phone speakers, earbuds or laptop speakers. If the vocal disappears or the kick vanishes on a phone, the mix has failed to translate — and you fix it before bouncing.',
            },
        ],
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// LFO drill generator — random BPM (60–180) + random division
// f = 1 / (60 / BPM × divisionRatio)
//   crotchet  = 1   (one beat)
//   quaver    = 0.5
//   semiquaver = 0.25
// ─────────────────────────────────────────────────────────────────────────────
const DIVISIONS = [
    { name: 'crotchet', ratio: 1 },
    { name: 'quaver', ratio: 0.5 },
    { name: 'semiquaver', ratio: 0.25 },
];

function generateLfoDrill() {
    // BPM in 60–180, snapped to 5 to keep arithmetic tidy
    const bpm = 60 + 5 * Math.floor(Math.random() * 25); // 60, 65, … 180
    const division = DIVISIONS[Math.floor(Math.random() * DIVISIONS.length)];
    const periodSeconds = (60 / bpm) * division.ratio;
    const frequencyHz = 1 / periodSeconds;
    // Round to 2 dp for student comparison
    const target = Math.round(frequencyHz * 100) / 100;
    return {
        id: 'psm-synth-lfo-drill',
        type: 'numeric',
        section: 'synth',
        bpm,
        division,
        target,
        question: `At ${bpm} bpm, an LFO timed in ${division.name}s has what frequency in Hz?`,
        unit: 'Hz',
        // Worked example uses 120 bpm + quaver = 4 Hz so the student
        // sees the canonical worksheet example on a wrong answer.
        workedExample: () => {
            const beatSeconds = 60 / bpm;
            const noteSeconds = beatSeconds * division.ratio;
            return [
                `1 crotchet = 60 ÷ ${bpm} = ${beatSeconds.toFixed(4)} s`,
                `1 ${division.name} = ${beatSeconds.toFixed(4)} × ${division.ratio} = ${noteSeconds.toFixed(4)} s`,
                `f = 1 / period = 1 / ${noteSeconds.toFixed(4)} = ${target} Hz`,
            ];
        },
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Build the ordered question list (sections rendered sequentially).
// The synth section has the LFO drill appended as the last question.
// ─────────────────────────────────────────────────────────────────────────────
function buildQuestions(drill) {
    const list = [];
    SECTIONS.forEach(section => {
        section.questions.forEach(q => list.push({ ...q, section: section.key }));
        if (section.key === 'synth') {
            list.push(drill); // drill belongs to synth
        }
    });
    return list;
}

// ─────────────────────────────────────────────────────────────────────────────
// Numeric validator — accept within ±0.1 Hz to allow for student rounding
// ─────────────────────────────────────────────────────────────────────────────
function checkNumeric(input, target) {
    const parsed = parseFloat(String(input).replace(/[^0-9.\-]/g, ''));
    if (Number.isNaN(parsed)) return false;
    return Math.abs(parsed - target) <= 0.1;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export default function PitchSynthMonitorsAssessment() {
    // Token from localStorage — same convention as RevisePageClient
    const [token, setToken] = useState(null);
    const [attemptNumber, setAttemptNumber] = useState(1);

    // The LFO drill is generated once per session so the student sees one
    // calculation question per quiz attempt. Refreshing the page re-rolls it.
    const lfoDrill = useMemo(() => generateLfoDrill(), []);
    const questions = useMemo(() => buildQuestions(lfoDrill), [lfoDrill]);

    const [index, setIndex] = useState(0);
    const [responses, setResponses] = useState([]); // { qid, section, correct, answer }
    const [selectedMcq, setSelectedMcq] = useState(null);
    const [numericInput, setNumericInput] = useState('');
    const [showFeedback, setShowFeedback] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [finished, setFinished] = useState(false);
    const startTimeRef = useRef(Date.now());

    // Pull token + next attempt number on mount
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const t = window.localStorage.getItem('revision_token');
        if (t) {
            setToken(t);
            getNextAttemptNumber(t, TOPIC_ID)
                .then(n => setAttemptNumber(n || 1))
                .catch(() => setAttemptNumber(1));
        }
    }, []);

    const current = questions[index];
    const total = questions.length;
    const progressPct = Math.round((index / total) * 100);

    function handleSubmit(answer) {
        let correct = false;
        let answerString = '';

        if (current.type === 'mcq') {
            correct = answer === current.correctIndex;
            answerString = current.options[answer];
        } else if (current.type === 'numeric') {
            correct = checkNumeric(answer, current.target);
            answerString = String(answer);
        }

        setIsCorrect(correct);
        setShowFeedback(true);
        setResponses(prev => [...prev, {
            qid: current.id,
            section: current.section,
            correct,
            answer: answerString,
        }]);

        // Persist — fire and forget
        if (token) {
            saveQuizResponse({
                token,
                topicId: TOPIC_ID,
                questionId: current.id,
                questionType: current.type,
                answer: answerString,
                correct,
                attemptNumber,
                timeTakenMs: Date.now() - startTimeRef.current,
                mode: 'revision',
            });
        }
    }

    function handleNext() {
        if (index + 1 >= total) {
            setFinished(true);
        } else {
            setIndex(i => i + 1);
            setSelectedMcq(null);
            setNumericInput('');
            setShowFeedback(false);
            setIsCorrect(false);
            startTimeRef.current = Date.now();
        }
    }

    function handleRestart() {
        // Hard reload so a fresh LFO drill is rolled and attempt number bumps
        if (typeof window !== 'undefined') window.location.reload();
    }

    // ─── Results screen ────────────────────────────────────────────────────
    if (finished) {
        return <ResultsScreen responses={responses} questions={questions} onRestart={handleRestart} hasToken={!!token} />;
    }

    // ─── Quiz screen ───────────────────────────────────────────────────────
    const sectionMeta = SECTIONS.find(s => s.key === current.section);

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-8 sm:py-12">
            <div className="mx-auto max-w-2xl">
                <header className="mb-6">
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                        {sectionMeta?.label} · {sectionMeta?.topic}
                    </p>
                    <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
                        Pitch, Synthesis & Monitors — Revision
                    </h1>
                    {!token && (
                        <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-200">
                            Not signed in — your answers will not be saved to your dashboard. Use a /revise link from your teacher to track progress.
                        </p>
                    )}
                </header>

                {/* Progress bar */}
                <div className="mb-6">
                    <div className="mb-1 flex justify-between text-xs text-slate-500">
                        <span>Question {index + 1} of {total}</span>
                        <span>{progressPct}% through</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                            className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                            style={{ width: `${((index) / total) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Question card */}
                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
                    <h2 className="mb-6 text-lg font-semibold leading-snug text-slate-900 sm:text-xl">
                        {current.question}
                    </h2>

                    {current.type === 'mcq' && (
                        <McqOptions
                            options={current.options}
                            correctIndex={current.correctIndex}
                            selected={selectedMcq}
                            showFeedback={showFeedback}
                            onSelect={i => {
                                if (showFeedback) return;
                                setSelectedMcq(i);
                                handleSubmit(i);
                            }}
                        />
                    )}

                    {current.type === 'numeric' && (
                        <NumericForm
                            value={numericInput}
                            onChange={setNumericInput}
                            disabled={showFeedback}
                            unit={current.unit}
                            onSubmit={() => {
                                if (!numericInput.trim() || showFeedback) return;
                                handleSubmit(numericInput.trim());
                            }}
                        />
                    )}

                    {/* Feedback panel */}
                    {showFeedback && (
                        <div
                            className={
                                'mt-6 rounded-lg p-4 ring-1 ' +
                                (isCorrect
                                    ? 'bg-emerald-50 ring-emerald-200'
                                    : 'bg-rose-50 ring-rose-200')
                            }
                        >
                            <p className={'mb-2 text-sm font-semibold ' + (isCorrect ? 'text-emerald-800' : 'text-rose-800')}>
                                {isCorrect ? 'Correct.' : 'Not quite.'}
                            </p>
                            <p className="text-sm leading-relaxed text-slate-700">
                                {current.explanation || ''}
                            </p>

                            {/* Worked example for numeric on a wrong answer */}
                            {!isCorrect && current.type === 'numeric' && (
                                <div className="mt-3 rounded-md bg-white p-3 ring-1 ring-slate-200">
                                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Working
                                    </p>
                                    <ol className="space-y-1 text-sm font-mono text-slate-700">
                                        {current.workedExample().map((line, i) => (
                                            <li key={i}>{line}</li>
                                        ))}
                                    </ol>
                                    <p className="mt-2 text-xs text-slate-500">
                                        Correct answer: <span className="font-semibold text-slate-700">{current.target} Hz</span>
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Next button */}
                    {showFeedback && (
                        <button
                            onClick={handleNext}
                            className="mt-6 w-full rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
                        >
                            {index + 1 >= total ? 'See results' : 'Next question'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// MCQ options block
// ─────────────────────────────────────────────────────────────────────────────
function McqOptions({ options, correctIndex, selected, showFeedback, onSelect }) {
    return (
        <div className="space-y-3">
            {options.map((option, i) => {
                let classes = 'w-full rounded-lg border px-4 py-3 text-left text-sm transition';
                if (showFeedback) {
                    if (i === correctIndex) classes += ' border-emerald-400 bg-emerald-50 text-emerald-900';
                    else if (i === selected) classes += ' border-rose-400 bg-rose-50 text-rose-900';
                    else classes += ' border-slate-200 bg-white text-slate-500';
                } else {
                    classes += i === selected
                        ? ' border-slate-900 bg-slate-50 text-slate-900'
                        : ' border-slate-200 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50';
                }
                return (
                    <button
                        key={i}
                        disabled={showFeedback}
                        onClick={() => onSelect(i)}
                        className={classes}
                    >
                        <span className="mr-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
                            {String.fromCharCode(65 + i)}
                        </span>
                        {option}
                    </button>
                );
            })}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Numeric input form
// ─────────────────────────────────────────────────────────────────────────────
function NumericForm({ value, onChange, disabled, unit, onSubmit }) {
    return (
        <form
            onSubmit={e => { e.preventDefault(); onSubmit(); }}
            className="flex items-center gap-3"
        >
            <input
                type="text"
                inputMode="decimal"
                value={value}
                onChange={e => onChange(e.target.value)}
                disabled={disabled}
                placeholder="Frequency"
                className="flex-1 rounded-lg border border-slate-300 px-4 py-3 font-mono text-base text-slate-900 outline-none focus:border-slate-900 disabled:bg-slate-100"
            />
            {unit && <span className="text-sm font-medium text-slate-500">{unit}</span>}
            {!disabled && (
                <button
                    type="submit"
                    disabled={!value.trim()}
                    className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                    Check
                </button>
            )}
        </form>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Results screen — per-section breakdown
// ─────────────────────────────────────────────────────────────────────────────
function ResultsScreen({ responses, questions, onRestart, hasToken }) {
    const total = responses.length;
    const correct = responses.filter(r => r.correct).length;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

    // Per-section breakdown
    const sectionStats = SECTIONS.map(section => {
        const sectionResponses = responses.filter(r => r.section === section.key);
        const sectionCorrect = sectionResponses.filter(r => r.correct).length;
        const sectionTotal = sectionResponses.length;
        const sectionPct = sectionTotal > 0 ? Math.round((sectionCorrect / sectionTotal) * 100) : 0;
        return {
            ...section,
            correct: sectionCorrect,
            total: sectionTotal,
            pct: sectionPct,
        };
    });

    const scoreColour = pct >= 80 ? 'text-emerald-600 ring-emerald-300'
        : pct >= 60 ? 'text-amber-600 ring-amber-300'
        : 'text-rose-600 ring-rose-300';

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-8 sm:py-12">
            <div className="mx-auto max-w-2xl">
                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
                    <h2 className="mb-2 text-center text-2xl font-bold text-slate-900">
                        Quiz complete
                    </h2>
                    <p className="mb-6 text-center text-sm text-slate-500">
                        Pitch Correction, Synthesis & Monitor Speakers
                    </p>

                    {/* Score circle */}
                    <div className="mb-8 flex flex-col items-center">
                        <div className={'flex h-28 w-28 items-center justify-center rounded-full ring-4 ' + scoreColour}>
                            <span className={'text-4xl font-bold ' + scoreColour.split(' ')[0]}>
                                {pct}%
                            </span>
                        </div>
                        <p className="mt-3 text-sm text-slate-600">
                            {correct} of {total} correct
                        </p>
                        {!hasToken && (
                            <p className="mt-2 text-xs text-amber-700">
                                Not saved — sign in via /revise next time to track progress.
                            </p>
                        )}
                    </div>

                    {/* Per-section breakdown */}
                    <div className="mb-6">
                        <h3 className="mb-3 text-sm font-semibold text-slate-900">
                            By sub-section
                        </h3>
                        <div className="space-y-2">
                            {sectionStats.map(s => {
                                const barColour = s.pct >= 80 ? 'bg-emerald-500'
                                    : s.pct >= 60 ? 'bg-amber-500'
                                    : 'bg-rose-500';
                                return (
                                    <div key={s.key} className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200">
                                        <div className="mb-1 flex items-center justify-between text-sm">
                                            <span className="font-medium text-slate-800">{s.label}</span>
                                            <span className="font-mono text-slate-600">{s.correct}/{s.total} · {s.pct}%</span>
                                        </div>
                                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                                            <div
                                                className={'h-full rounded-full ' + barColour}
                                                style={{ width: `${s.pct}%` }}
                                            />
                                        </div>
                                        <p className="mt-1 text-xs text-slate-500">{s.topic}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Per-question list */}
                    <div className="mb-6">
                        <h3 className="mb-3 text-sm font-semibold text-slate-900">
                            Question breakdown
                        </h3>
                        <div className="space-y-1">
                            {questions.map((q, i) => {
                                const r = responses[i];
                                const icon = r?.correct ? '✓' : '✗';
                                const iconColour = r?.correct ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700';
                                return (
                                    <div key={q.id} className="flex items-center gap-3 rounded-md bg-slate-50 px-3 py-2">
                                        <span className={'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ' + iconColour}>
                                            {icon}
                                        </span>
                                        <span className="flex-1 text-sm text-slate-700">
                                            {q.question.length > 80 ? q.question.slice(0, 80) + '…' : q.question}
                                        </span>
                                        <span className="text-xs uppercase tracking-wider text-slate-400">
                                            {q.type}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <button
                        onClick={onRestart}
                        className="w-full rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
                    >
                        Try again (new LFO question)
                    </button>
                </div>
            </div>
        </div>
    );
}
