'use client';

import { useState, useEffect, useMemo } from 'react';
import { saveQuizResponse, getNextAttemptNumber } from '@/lib/quiz-persistence';

const TOPIC_ID = 'levels-metering-assessment';

// Question bank. Order is fixed (no shuffling) so feedback maps 1:1 to the worksheet.
// Question types:
//   'mcq'      → choose one of options[]; correctIndex is the right answer
//   'vu'       → click on the VU meter to identify a dB value; correctDb (+ tolerance)
//   'short'    → free-text self-assessed; keyPoints listed in feedback
const QUESTIONS = [
    {
        id: 'lm-q1-db-scale-spacing',
        type: 'mcq',
        question: 'Why are the numbers on a dB scale not evenly spaced?',
        options: [
            'The meter is broken.',
            'The scale is logarithmic — each step represents a ratio, not an addition.',
            'The numbers are random.',
            'To save space.',
        ],
        correctIndex: 1,
        explanation: 'The dB scale is logarithmic: equal dB differences correspond to equal ratios (multiplications), not equal absolute differences. That is why the gaps compress as you approach 0 dB.',
    },
    {
        id: 'lm-q2-plus-6-db-voltage',
        type: 'mcq',
        question: '+6 dB represents what change in voltage?',
        options: [
            'Adding 6 V.',
            'Doubling.',
            'Multiplying by 6.',
            'Multiplying by 10.',
        ],
        correctIndex: 1,
        explanation: '+6 dB always doubles voltage, because 20 × log₁₀(2) ≈ 6. The ratio is what matters — doubling 0.1 V to 0.2 V is the same +6 dB as 1 V to 2 V.',
    },
    {
        id: 'lm-q3-rms-clipping',
        type: 'mcq',
        question: 'Why is RMS metering unsuitable for preventing clipping?',
        options: [
            'RMS is inaccurate.',
            'RMS shows an average over time, so brief peaks that clip are averaged out and not displayed.',
            'RMS is too slow.',
            'RMS only measures bass.',
        ],
        correctIndex: 1,
        explanation: 'RMS averages the signal over a window (typically ~300 ms). A short transient that exceeds 0 dBFS will clip, but the RMS reading will not reveal it. Use a peak meter (or peak-hold) to catch clipping.',
    },
    {
        id: 'lm-q4-snare-clip-scenario',
        type: 'mcq',
        question: 'A snare hit peaks at +2 dBFS for 5 ms but its RMS reads -12 dBFS. Will it clip?',
        options: [
            'No, because RMS is below 0.',
            'Yes, because the peak exceeds 0 dBFS.',
            'Only if monitored loud.',
            'Only on vinyl.',
        ],
        correctIndex: 1,
        explanation: 'Anything above 0 dBFS clips, regardless of the RMS level. The RMS sitting at -12 dBFS is irrelevant — the 5 ms transient at +2 dBFS chops the waveform flat at the digital ceiling.',
    },
    {
        id: 'lm-q5-zero-vu-dbfs',
        type: 'mcq',
        question: '0 VU on a meter typically corresponds to what dBFS value in a modern digital system?',
        options: [
            '0 dBFS.',
            '-6 dBFS.',
            '-18 dBFS.',
            '-40 dBFS.',
        ],
        correctIndex: 2,
        // Also accept -20 dBFS — but the canonical exam answer is -18 dBFS.
        explanation: '0 VU is usually calibrated to about -18 dBFS (some studios use -20 dBFS). That gives roughly 18 dB of headroom above the average level before clipping.',
    },
    {
        id: 'lm-q6-digital-ceiling',
        type: 'mcq',
        question: 'What is the digital ceiling in a 16-bit or 24-bit system?',
        options: [
            '-6 dBFS.',
            '0 dBFS.',
            '+6 dBFS.',
            '-18 dBFS.',
        ],
        correctIndex: 1,
        explanation: '0 dBFS = decibels relative to Full Scale. It is the loudest sample value the format can represent. Anything beyond 0 dBFS clips.',
    },
    {
        id: 'lm-q7-clipping-consequence',
        type: 'short',
        question: 'State one consequence of clipping.',
        sampleAnswer: 'The waveform is chopped flat at the maximum sample value, introducing audible distortion (harshness or unpleasant crackle) and loss of clarity on transients.',
        keyPoints: ['distortion / harshness', 'loss of clarity on transients', 'waveform chopped flat', 'unpleasant crackle', 'added high-frequency harmonics'],
        // Lightweight self-assessment: did your answer mention any of these?
        explanation: 'Award yourself the mark if your answer mentioned distortion, harshness, the waveform being chopped flat, added harmonics, or loss of clarity on transients.',
    },
    {
        id: 'lm-q8-plus-20-db-voltage',
        type: 'mcq',
        question: 'How much extra voltage is +20 dB?',
        options: [
            '×2',
            '×5',
            '×10',
            '×100',
        ],
        correctIndex: 2,
        explanation: '+20 dB = ×10 voltage (because 20 × log₁₀(10) = 20). For comparison, +20 dB power = ×100. The voltage and power ratios are different — learn the shortcuts.',
    },
    {
        id: 'lm-q9-rms-perceived-loudness',
        type: 'mcq',
        question: 'An engineer wants to know if a mix is loud enough perceptually. Which meter should they use?',
        options: [
            'Peak.',
            'RMS.',
            'Both equally.',
            'Neither.',
        ],
        correctIndex: 1,
        explanation: 'RMS reflects perceived loudness because human hearing also averages over time. Peak meters tell you about clipping risk; RMS tells you how loud something will sound.',
    },
    {
        id: 'lm-q10-vu-reading',
        type: 'vu',
        // The needle is positioned at -3 dB on the VU face. Student clicks the
        // matching tick mark on the scale.
        question: 'The needle on the VU meter is pointing here. What dB value does it indicate? Click the matching tick on the scale.',
        correctDb: -3,
        explanation: 'The needle is sitting on -3 dB. Remember: 0 VU is calibrated to around -18 dBFS, leaving headroom above it. -6 dB halves voltage (amplitude); -3 dB halves power — do not confuse them.',
    },
];

export default function LevelsMeteringAssessment() {
    const [student, setStudent] = useState(null);
    const [authChecked, setAuthChecked] = useState(false);
    const [attemptNumber, setAttemptNumber] = useState(null);
    const [questionIndex, setQuestionIndex] = useState(0);
    const [responses, setResponses] = useState([]);
    const [currentAnswer, setCurrentAnswer] = useState(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [finished, setFinished] = useState(false);
    const [shortSelfMark, setShortSelfMark] = useState(null);

    const questions = QUESTIONS;
    const current = questions[questionIndex];
    const total = questions.length;

    // Check localStorage for revision auth (same key family as /revise)
    useEffect(() => {
        const token = localStorage.getItem('revision_token');
        const studentId = localStorage.getItem('revision_student_id');
        const studentName = localStorage.getItem('revision_student_name');
        if (token && studentId && studentName) {
            setStudent({ token, studentId, studentName });
        }
        setAuthChecked(true);
    }, []);

    useEffect(() => {
        if (student) {
            getNextAttemptNumber(student.token, TOPIC_ID)
                .then(setAttemptNumber)
                .catch(() => setAttemptNumber(1));
        }
    }, [student]);

    function submitMcq(idx) {
        const correct = idx === current.correctIndex;
        recordResponse({
            answerValue: current.options[idx],
            answerDisplay: current.options[idx],
            correct,
            selected: idx,
        });
    }

    function submitVu(dbValue) {
        const tolerance = 0.5;
        const correct = Math.abs(dbValue - current.correctDb) <= tolerance;
        recordResponse({
            answerValue: `${dbValue} dB`,
            answerDisplay: `${dbValue} dB`,
            correct,
            selected: dbValue,
        });
    }

    function submitShort(text) {
        // Self-assessed — correct stays null until the student picks Got it / Review.
        recordResponse({
            answerValue: text,
            answerDisplay: text,
            correct: null,
            selected: text,
        });
    }

    function recordResponse({ answerValue, answerDisplay, correct, selected }) {
        setCurrentAnswer(selected);
        setIsCorrect(correct === true);
        setShowFeedback(true);
        setResponses(prev => [...prev, {
            questionId: current.id,
            type: current.type,
            answer: answerDisplay,
            correct,
        }]);

        if (student && attemptNumber) {
            saveQuizResponse({
                token: student.token,
                topicId: TOPIC_ID,
                questionId: current.id,
                questionType: current.type,
                answer: String(answerValue),
                correct,
                attemptNumber,
                mode: 'revision',
            });
        }
    }

    function applyShortSelfMark(gotIt) {
        // Update the last response with the self-assessed mark and persist a follow-up
        // row so the teacher dashboard sees a definitive correct/incorrect value.
        setShortSelfMark(gotIt);
        setResponses(prev => {
            const copy = [...prev];
            const last = copy[copy.length - 1];
            if (last) last.correct = gotIt;
            return copy;
        });
        if (student && attemptNumber) {
            saveQuizResponse({
                token: student.token,
                topicId: TOPIC_ID,
                questionId: current.id + '-self',
                questionType: 'short-self',
                answer: gotIt ? 'self-marked correct' : 'self-marked review',
                correct: gotIt,
                attemptNumber,
                mode: 'revision',
            });
        }
    }

    function nextQuestion() {
        if (questionIndex + 1 >= total) {
            setFinished(true);
            return;
        }
        setQuestionIndex(i => i + 1);
        setCurrentAnswer(null);
        setShowFeedback(false);
        setIsCorrect(false);
        setShortSelfMark(null);
    }

    function restart() {
        setQuestionIndex(0);
        setResponses([]);
        setCurrentAnswer(null);
        setShowFeedback(false);
        setIsCorrect(false);
        setFinished(false);
        setShortSelfMark(null);
        if (student) {
            getNextAttemptNumber(student.token, TOPIC_ID)
                .then(setAttemptNumber)
                .catch(() => setAttemptNumber((attemptNumber || 1) + 1));
        }
    }

    if (!authChecked) {
        return <div className="min-h-screen bg-stone-50" />;
    }

    if (!student) {
        return (
            <div className="min-h-screen bg-stone-50 px-4 py-12">
                <div className="mx-auto max-w-2xl rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
                    <h1 className="text-2xl font-semibold text-stone-900">Levels & Metering Assessment</h1>
                    <p className="mt-3 text-stone-600">
                        This quiz saves your responses so your teacher can see what to revise with you.
                        Sign in via the revision page first, then return to this assessment.
                    </p>
                    <a
                        href="/revise/numeracy"
                        className="mt-6 inline-block rounded-lg bg-amber-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-800"
                    >
                        Go to revision sign-in
                    </a>
                    <p className="mt-4 text-xs text-stone-500">
                        (You can still try the quiz without signing in — but your results won&apos;t be saved.)
                    </p>
                    <button
                        type="button"
                        onClick={() => setStudent({ token: null, studentId: null, studentName: 'Guest' })}
                        className="mt-2 text-xs text-stone-500 underline"
                    >
                        Continue as guest
                    </button>
                </div>
            </div>
        );
    }

    if (finished) {
        return <ResultsScreen responses={responses} questions={questions} student={student} onRestart={restart} />;
    }

    return (
        <div className="min-h-screen bg-stone-50 px-4 py-8">
            <div className="mx-auto max-w-2xl">
                <Header student={student} />

                <ProgressBar progress={questionIndex + 1} total={total} type={current.type} />

                <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
                    <h2 className="text-lg font-semibold leading-snug text-stone-900 sm:text-xl">
                        {current.question}
                    </h2>

                    {current.type === 'mcq' && (
                        <McqOptions
                            options={current.options}
                            correctIndex={current.correctIndex}
                            selectedIndex={currentAnswer}
                            showFeedback={showFeedback}
                            onSelect={submitMcq}
                        />
                    )}

                    {current.type === 'vu' && (
                        <VuMeterQuestion
                            correctDb={current.correctDb}
                            selected={currentAnswer}
                            showFeedback={showFeedback}
                            onSelect={submitVu}
                        />
                    )}

                    {current.type === 'short' && (
                        <ShortAnswer
                            showFeedback={showFeedback}
                            onSubmit={submitShort}
                            sampleAnswer={current.sampleAnswer}
                            keyPoints={current.keyPoints}
                            shortSelfMark={shortSelfMark}
                            onSelfMark={applyShortSelfMark}
                        />
                    )}

                    {showFeedback && (
                        <FeedbackPanel
                            type={current.type}
                            isCorrect={isCorrect}
                            explanation={current.explanation}
                        />
                    )}

                    {showFeedback && (current.type !== 'short' || shortSelfMark !== null) && (
                        <button
                            type="button"
                            onClick={nextQuestion}
                            className="mt-5 w-full rounded-lg bg-amber-700 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-amber-800"
                        >
                            {questionIndex + 1 >= total ? 'See results' : 'Next question'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

function Header({ student }) {
    return (
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Topic 2.6 + 2.5</p>
                <h1 className="text-xl font-semibold text-stone-900">Levels &amp; Metering Assessment</h1>
            </div>
            {student?.studentName && (
                <span className="text-sm text-stone-500">{student.studentName}</span>
            )}
        </header>
    );
}

function ProgressBar({ progress, total, type }) {
    const label = type === 'mcq' ? 'Multiple choice'
        : type === 'vu' ? 'Read the meter'
        : 'Short answer';
    return (
        <div>
            <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-stone-600">Question {progress} of {total}</span>
                <span className="text-sm text-stone-500">{label}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-200">
                <div
                    className="h-full rounded-full bg-amber-700 transition-[width] ease-house"
                    style={{ width: `${(progress / total) * 100}%` }}
                />
            </div>
        </div>
    );
}

function McqOptions({ options, correctIndex, selectedIndex, showFeedback, onSelect }) {
    return (
        <div className="mt-6 flex flex-col gap-3">
            {options.map((option, i) => {
                let classes = 'border-stone-200 bg-white hover:border-stone-400';
                if (showFeedback) {
                    if (i === correctIndex) classes = 'border-emerald-500 bg-emerald-50';
                    else if (i === selectedIndex) classes = 'border-rose-500 bg-rose-50';
                    else classes = 'border-stone-200 bg-white opacity-60';
                } else if (i === selectedIndex) {
                    classes = 'border-amber-600 bg-amber-50';
                }

                let badgeClasses = 'bg-stone-100 text-stone-600';
                if (showFeedback && i === correctIndex) badgeClasses = 'bg-emerald-500 text-white';
                else if (showFeedback && i === selectedIndex) badgeClasses = 'bg-rose-500 text-white';

                return (
                    <button
                        key={i}
                        type="button"
                        onClick={() => !showFeedback && onSelect(i)}
                        disabled={showFeedback}
                        className={`flex items-start gap-3 rounded-lg border-2 px-5 py-4 text-left text-base text-stone-800 transition ${classes} ${showFeedback ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                        <span className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ${badgeClasses}`}>
                            {String.fromCharCode(65 + i)}
                        </span>
                        <span>{option}</span>
                    </button>
                );
            })}
        </div>
    );
}

function FeedbackPanel({ type, isCorrect, explanation }) {
    let wrapper, heading, headingText;
    if (type === 'short') {
        wrapper = 'border-sky-400 bg-sky-50';
        heading = 'text-sky-700';
        headingText = 'Review your answer';
    } else if (isCorrect) {
        wrapper = 'border-emerald-500 bg-emerald-50';
        heading = 'text-emerald-700';
        headingText = 'Correct!';
    } else {
        wrapper = 'border-rose-500 bg-rose-50';
        heading = 'text-rose-700';
        headingText = 'Not quite.';
    }
    return (
        <div className={`mt-6 rounded-lg border-2 p-5 ${wrapper}`}>
            <p className={`mb-2 text-base font-semibold ${heading}`}>{headingText}</p>
            <p className="text-sm leading-relaxed text-stone-700">{explanation}</p>
        </div>
    );
}

function ShortAnswer({ showFeedback, onSubmit, sampleAnswer, keyPoints, shortSelfMark, onSelfMark }) {
    const [value, setValue] = useState('');

    function handleSubmit(e) {
        e.preventDefault();
        if (value.trim() && !showFeedback) {
            onSubmit(value.trim());
        }
    }

    return (
        <div className="mt-6">
            <form onSubmit={handleSubmit}>
                <textarea aria-label="Response"
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    disabled={showFeedback}
                    placeholder="Type your answer..."
                    rows={3}
                    className="w-full rounded-lg border-2 border-stone-200 bg-white p-4 text-base leading-relaxed text-stone-800 focus:border-amber-600 focus:outline-none disabled:bg-stone-100"
                />
                {!showFeedback && (
                    <button
                        type="submit"
                        disabled={!value.trim()}
                        className="mt-3 rounded-lg bg-amber-700 px-5 py-2.5 text-base font-semibold text-white transition hover:bg-amber-800 disabled:bg-stone-300"
                    >
                        Submit
                    </button>
                )}
            </form>

            {showFeedback && (
                <div className="mt-4 rounded-lg bg-stone-100 p-4">
                    <p className="mb-2 text-sm font-semibold text-stone-700">Sample answer</p>
                    <p className="mb-4 text-sm italic leading-relaxed text-stone-700">{sampleAnswer}</p>
                    <p className="mb-2 text-xs uppercase tracking-wide text-stone-500">Key points the examiner accepts</p>
                    <div className="mb-4 flex flex-wrap gap-2">
                        {keyPoints.map((point, i) => (
                            <span key={i} className="rounded-md bg-white px-2 py-1 text-xs text-stone-700">{point}</span>
                        ))}
                    </div>

                    {shortSelfMark === null && (
                        <div>
                            <p className="mb-2 text-sm font-medium text-stone-700">Did you cover at least one of those points?</p>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => onSelfMark(true)}
                                    className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                                >
                                    Yes — got it
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onSelfMark(false)}
                                    className="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
                                >
                                    No — needs review
                                </button>
                            </div>
                        </div>
                    )}

                    {shortSelfMark === true && (
                        <p className="text-sm font-medium text-emerald-700">Marked correct.</p>
                    )}
                    {shortSelfMark === false && (
                        <p className="text-sm font-medium text-rose-700">Flagged for review.</p>
                    )}
                </div>
            )}
        </div>
    );
}

/**
 * Clickable SVG VU meter.
 *
 * The needle is drawn pointing at -3 dB (the canonical reading for this question).
 * Students click any of the labelled tick marks (-20, -10, -7, -5, -3, -1, 0, +1, +3)
 * and the assessment scores against `correctDb`.
 *
 * Geometry: arc spans 120° (from -60° to +60° relative to vertical) with the needle
 * pivoting from a centre point at the bottom-middle of the meter.
 */
function VuMeterQuestion({ correctDb, selected, showFeedback, onSelect }) {
    const ticks = useMemo(() => ([
        { db: -20, angle: -55 },
        { db: -10, angle: -38 },
        { db: -7, angle: -28 },
        { db: -5, angle: -18 },
        { db: -3, angle: -9 },
        { db: -1, angle: -3 },
        { db: 0, angle: 0 },
        { db: 1, angle: 8 },
        { db: 3, angle: 22 },
    ]), []);

    // Centre of needle pivot and arc radius (within a 400 × 220 viewBox)
    const cx = 200;
    const cy = 200;
    const rOuter = 160;
    const rInner = 145;
    const rLabel = 128;
    const needleLen = 140;

    // The fixed needle position for this question (always points to -3 dB so it
    // matches the question wording). If we ever need to randomise, swap in the
    // tick's angle here.
    const needleDb = -3;
    const needleAngle = ticks.find(t => t.db === needleDb).angle;
    const needleRad = (needleAngle - 90) * Math.PI / 180; // -90 because 0° on our arc points straight up
    const needleX = cx + needleLen * Math.cos(needleRad);
    const needleY = cy + needleLen * Math.sin(needleRad);

    function polarToCartesian(angleDeg, radius) {
        const rad = (angleDeg - 90) * Math.PI / 180;
        return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
    }

    return (
        <div className="mt-6">
            <div className="rounded-xl bg-amber-50 p-4">
                <svg viewBox="0 0 400 220" className="mx-auto w-full max-w-md">
                    {/* Meter face */}
                    <rect x="20" y="40" width="360" height="170" rx="8" fill="#fef3c7" stroke="#92400e" strokeWidth="2" />

                    {/* Arc */}
                    <path
                        d={`M ${polarToCartesian(-58, rOuter).x} ${polarToCartesian(-58, rOuter).y} A ${rOuter} ${rOuter} 0 0 1 ${polarToCartesian(58, rOuter).x} ${polarToCartesian(58, rOuter).y}`}
                        fill="none"
                        stroke="#78716c"
                        strokeWidth="1.5"
                    />

                    {/* Red overload zone (0 dB → +3 dB) */}
                    <path
                        d={`M ${polarToCartesian(0, rOuter).x} ${polarToCartesian(0, rOuter).y} A ${rOuter} ${rOuter} 0 0 1 ${polarToCartesian(22, rOuter).x} ${polarToCartesian(22, rOuter).y} L ${polarToCartesian(22, rInner).x} ${polarToCartesian(22, rInner).y} A ${rInner} ${rInner} 0 0 0 ${polarToCartesian(0, rInner).x} ${polarToCartesian(0, rInner).y} Z`}
                        fill="#dc2626"
                        opacity="0.6"
                    />

                    {/* Tick marks + clickable labels */}
                    {ticks.map(({ db, angle }) => {
                        const outer = polarToCartesian(angle, rOuter);
                        const inner = polarToCartesian(angle, rInner);
                        const label = polarToCartesian(angle, rLabel);

                        const isSelected = selected === db;
                        const isCorrectTick = showFeedback && db === correctDb;
                        const isWrongPick = showFeedback && isSelected && db !== correctDb;

                        let labelFill = '#1c1917';
                        let labelClasses = 'cursor-pointer hover:fill-amber-700';
                        if (isCorrectTick) { labelFill = '#047857'; labelClasses = ''; }
                        else if (isWrongPick) { labelFill = '#b91c1c'; labelClasses = ''; }

                        const labelText = db > 0 ? `+${db}` : `${db}`;

                        return (
                            <g key={db}>
                                <line
                                    x1={outer.x} y1={outer.y}
                                    x2={inner.x} y2={inner.y}
                                    stroke={isCorrectTick ? '#047857' : isWrongPick ? '#b91c1c' : '#44403c'}
                                    strokeWidth={isCorrectTick || isWrongPick || isSelected ? 3 : 1.5}
                                />
                                <text
                                    x={label.x}
                                    y={label.y + 4}
                                    textAnchor="middle"
                                    fontSize="13"
                                    fontWeight={isSelected || isCorrectTick ? 700 : 500}
                                    fill={labelFill}
                                    className={labelClasses}
                                    onClick={() => !showFeedback && onSelect(db)}
                                >
                                    {labelText}
                                </text>
                                {/* Larger transparent hit target for easier clicking on touch */}
                                {!showFeedback && (
                                    <circle
                                        cx={label.x}
                                        cy={label.y}
                                        r="14"
                                        fill="transparent"
                                        className="cursor-pointer"
                                        onClick={() => onSelect(db)}
                                    />
                                )}
                            </g>
                        );
                    })}

                    {/* "VU" label */}
                    <text x="200" y="180" textAnchor="middle" fontSize="14" fontWeight="600" fill="#92400e" letterSpacing="0.2em">VU</text>

                    {/* Needle */}
                    <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke="#1c1917" strokeWidth="2.5" strokeLinecap="round" />
                    <circle cx={cx} cy={cy} r="6" fill="#1c1917" />
                </svg>
                <p className="mt-2 text-center text-xs text-stone-500">Click the dB value on the scale that matches the needle position.</p>
            </div>
        </div>
    );
}

function ResultsScreen({ responses, questions, student, onRestart }) {
    const scored = responses.filter(r => r.correct !== null);
    const correctCount = scored.filter(r => r.correct === true).length;
    const totalScored = scored.length;
    const percentage = totalScored > 0 ? Math.round((correctCount / totalScored) * 100) : 0;

    const scoreColour = percentage >= 80 ? 'text-emerald-600 border-emerald-500'
        : percentage >= 60 ? 'text-amber-600 border-amber-500'
        : 'text-rose-600 border-rose-500';

    return (
        <div className="min-h-screen bg-stone-50 px-4 py-12">
            <div className="mx-auto max-w-2xl rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Topic 2.6 + 2.5</p>
                <h1 className="mt-1 text-2xl font-bold text-stone-900">Quiz complete</h1>

                <div className="my-6 text-center">
                    <div className={`mx-auto flex h-24 w-24 items-center justify-center rounded-full border-4 ${scoreColour}`}>
                        <span className="text-3xl font-bold">{percentage}%</span>
                    </div>
                    <p className="mt-3 text-sm text-stone-600">
                        {correctCount} of {totalScored} scored questions correct
                        {scored.length < responses.length && ` · ${responses.length - scored.length} self-assessed`}
                    </p>
                    {student?.studentName === 'Guest' && (
                        <p className="mt-1 text-xs text-stone-500">Guest mode — results were not saved.</p>
                    )}
                </div>

                <h2 className="mb-3 text-base font-semibold text-stone-900">Question breakdown</h2>
                <ul className="mb-6 flex flex-col gap-2">
                    {questions.map((q, i) => {
                        const r = responses[i];
                        const ok = r?.correct === true;
                        const wrong = r?.correct === false;
                        const icon = ok ? '✓' : wrong ? '✗' : '—';
                        const badge = ok ? 'bg-emerald-100 text-emerald-700'
                            : wrong ? 'bg-rose-100 text-rose-700'
                            : 'bg-sky-100 text-sky-700';
                        const truncated = q.question.length > 90 ? q.question.slice(0, 90) + '…' : q.question;
                        return (
                            <li key={q.id} className="flex items-center gap-3 rounded-md bg-stone-50 px-3 py-2">
                                <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${badge}`}>{icon}</span>
                                <span className="flex-1 text-sm text-stone-700">{truncated}</span>
                                <span className="text-xs uppercase tracking-wider text-stone-500">{q.type}</span>
                            </li>
                        );
                    })}
                </ul>

                <div className="flex gap-3">
                    <a
                        href="/"
                        className="flex-1 rounded-lg bg-stone-100 px-5 py-3 text-center text-base font-medium text-stone-700 hover:bg-stone-200"
                    >
                        Back to resources
                    </a>
                    <button
                        type="button"
                        onClick={onRestart}
                        className="flex-1 rounded-lg bg-amber-700 px-5 py-3 text-base font-semibold text-white hover:bg-amber-800"
                    >
                        Try again
                    </button>
                </div>
            </div>
        </div>
    );
}
