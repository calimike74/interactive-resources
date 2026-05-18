'use client';

import { useState, useEffect, useRef } from 'react';
import { getNextAttemptNumber, saveQuizResponse } from '@/lib/quiz-persistence';

// ============================================
// QUESTION BANK
// Matched to 07-Worksheet-Waveform-Drawing.md (C4 Intervention Pack)
// ============================================
const QUESTIONS = [
    {
        id: 'wd-q1-freq-from-period',
        type: 'mcq',
        prompt: 'A waveform completes one cycle in 2 ms. What is its frequency?',
        options: ['0.5 Hz', '2 Hz', '500 Hz', '2000 Hz'],
        correctIndex: 2,
        explanation: 'Convert 2 ms to seconds (0.002 s), then f = 1 / T = 1 / 0.002 = 500 Hz. Always convert ms → s before dividing.',
    },
    {
        id: 'wd-q2-period-from-freq',
        type: 'numeric',
        prompt: 'A waveform has frequency 250 Hz. State its period in milliseconds.',
        unit: 'ms',
        answer: 4,
        tolerance: 0.01,
        acceptableAnswers: [4, '4'],
        explanation: 'T = 1 / f = 1 / 250 = 0.004 s = 4 ms.',
    },
    {
        id: 'wd-q3-polarity-inversion',
        type: 'mcq',
        prompt: 'What happens when a wave is added to a copy of itself with polarity inverted?',
        options: [
            'Volume doubles',
            'Phase cancellation — the two waves cancel to silence',
            'The wave shifts in time',
            'The wave becomes louder',
        ],
        correctIndex: 1,
        explanation: 'A polarity-inverted copy is mirrored across the zero line. Every positive sample meets a matching negative sample, so the sum is zero — total phase cancellation.',
    },
    {
        id: 'wd-q4-octave-up',
        type: 'mcq',
        prompt: 'An A note at 440 Hz is transposed one octave up. What is the new frequency?',
        options: ['220 Hz', '440 Hz', '880 Hz', '1760 Hz'],
        correctIndex: 2,
        explanation: 'One octave up doubles the frequency: 440 × 2 = 880 Hz. (One octave down would halve it to 220 Hz; two octaves up would give 1760 Hz.)',
    },
    {
        id: 'wd-q5-polarity-scenario',
        type: 'short',
        prompt: 'Name one situation in a recording session where you must check the polarity of signals. Give a specific example.',
        // Keywords the answer should contain (any one is enough for a positive match)
        keywords: [
            'snare', 'kick', 'overhead', 'overheads', 'DI', 'amp', 'mic\'d', 'micd',
            'multi-mic', 'multi mic', 'two mics', 'top and bottom', 'in and out',
            'stereo room', 'room mic',
        ],
        sampleAnswer: 'Multi-mic recording of one source — e.g. a snare drum captured with a top mic and a bottom mic. The two mics see the drumhead moving in opposite directions, so the bottom mic must be polarity-flipped or the low end cancels out.',
        explanation: 'Accept any multi-mic scenario: snare top + bottom, kick in + out, DI + mic\'d amp, drum overheads, stereo room mics. The mark is for naming a realistic scenario AND explaining that the signals can cancel low-end if polarity is wrong.',
    },
    {
        id: 'wd-q6-time-axis',
        type: 'mcq',
        prompt: 'Which axis on a waveform graph represents time?',
        options: [
            'Vertical (y)',
            'Horizontal (x)',
            'Diagonal',
            'Either — it depends on the DAW',
        ],
        correctIndex: 1,
        explanation: 'Time always runs along the horizontal (x) axis. Amplitude (voltage / displacement / level / dB) is on the vertical (y) axis. Always include units in your axis labels.',
    },
    {
        id: 'wd-q7-cycles-in-window',
        type: 'numeric',
        prompt: 'A square wave shows 4 complete cycles in 8 ms. State its frequency in Hz.',
        unit: 'Hz',
        answer: 500,
        tolerance: 0.5,
        acceptableAnswers: [500, '500'],
        explanation: 'Period = 8 ms ÷ 4 cycles = 2 ms per cycle. Convert: 2 ms = 0.002 s. f = 1 / 0.002 = 500 Hz.',
    },
    {
        id: 'wd-q8-period-1khz',
        type: 'mcq',
        prompt: 'What is the period of a 1 kHz tone?',
        options: ['1 s', '1 ms', '1 μs', '1000 ms'],
        correctIndex: 1,
        explanation: '1 kHz = 1000 Hz. T = 1 / 1000 = 0.001 s = 1 ms. Useful shortcut to memorise: 1 kHz ↔ 1 ms.',
    },
    {
        id: 'wd-q9-waveform-id',
        type: 'mcq',
        prompt: 'Which of these diagrams shows a square wave with a period of 1 ms (over a 5 ms window)?',
        // SVG-based diagram options — see WaveformOptionDiagram below
        diagramOptions: ['saw-2ms', 'square-1ms', 'sine-1ms', 'square-2ms'],
        correctIndex: 1,
        explanation: 'A square wave with period 1 ms completes 5 full cycles in a 5 ms window, with sharp vertical jumps between two flat levels. The saw wave ramps; the sine wave curves; the 2 ms square only fits 2.5 cycles.',
    },
];

const TOPIC_ID = 'waveform-drawing-assessment';

// ============================================
// MAIN COMPONENT
// ============================================
export default function WaveformDrawingAssessment() {
    const [token, setToken] = useState(null);
    const [authChecked, setAuthChecked] = useState(false);
    const [attemptNumber, setAttemptNumber] = useState(null);

    const [questionIndex, setQuestionIndex] = useState(0);
    const [currentAnswer, setCurrentAnswer] = useState(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [responses, setResponses] = useState([]);
    const [finished, setFinished] = useState(false);
    const [questionStartTime, setQuestionStartTime] = useState(null);

    // Pick up the revision token the same way RevisePageClient does.
    useEffect(() => {
        const t = typeof window !== 'undefined' ? localStorage.getItem('revision_token') : null;
        setToken(t);
        setAuthChecked(true);
    }, []);

    // Resolve the next attempt number once we know the token.
    useEffect(() => {
        if (!token) return;
        getNextAttemptNumber(token, TOPIC_ID)
            .then(setAttemptNumber)
            .catch(() => setAttemptNumber(1));
    }, [token]);

    // Reset the per-question timer whenever we move to a new question.
    useEffect(() => {
        if (!finished) setQuestionStartTime(Date.now());
    }, [questionIndex, finished]);

    if (!authChecked) {
        return <div className="min-h-[60vh] bg-slate-50" />;
    }

    const current = QUESTIONS[questionIndex];
    const total = QUESTIONS.length;
    const progress = questionIndex + 1;

    function gradeAnswer(answer) {
        if (current.type === 'mcq') {
            return answer === current.correctIndex;
        }
        if (current.type === 'numeric') {
            const parsed = parseFloat(answer);
            if (isNaN(parsed)) return false;
            return Math.abs(parsed - current.answer) <= (current.tolerance ?? 0);
        }
        if (current.type === 'short') {
            const lower = String(answer).toLowerCase();
            return current.keywords.some(kw => lower.includes(String(kw).toLowerCase()));
        }
        return false;
    }

    function answerToDisplay(answer) {
        if (current.type === 'mcq') return current.options?.[answer] ?? current.diagramOptions?.[answer] ?? String(answer);
        return String(answer);
    }

    function submitAnswer(answer) {
        const correct = gradeAnswer(answer);
        // Short answers are auto-scored on keyword presence, but we still surface
        // the sample answer for self-review so students learn the full mark scheme.
        setCurrentAnswer(answer);
        setIsCorrect(correct);
        setShowFeedback(true);

        const timeTakenMs = questionStartTime ? Date.now() - questionStartTime : null;

        setResponses(prev => [...prev, {
            questionId: current.id,
            type: current.type,
            answer,
            answerDisplay: answerToDisplay(answer),
            correct,
        }]);

        // Persist to Supabase via grades-dashboard (fire-and-forget).
        if (token && attemptNumber) {
            saveQuizResponse({
                token,
                topicId: TOPIC_ID,
                questionId: current.id,
                questionType: current.type,
                answer: answerToDisplay(answer),
                correct,
                attemptNumber,
                timeTakenMs,
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
    }

    function restart() {
        setQuestionIndex(0);
        setCurrentAnswer(null);
        setShowFeedback(false);
        setIsCorrect(false);
        setResponses([]);
        setFinished(false);
        // Bump attempt number so a new attempt is logged distinctly.
        if (token) {
            getNextAttemptNumber(token, TOPIC_ID)
                .then(setAttemptNumber)
                .catch(() => setAttemptNumber(n => (n || 1) + 1));
        }
    }

    if (finished) {
        return <ResultsScreen responses={responses} questions={QUESTIONS} onRestart={restart} />;
    }

    return (
        <div className="min-h-[60vh] bg-slate-50 py-8 px-4 sm:px-6">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">
                        Topic 2.5 Numeracy · Revision Drill
                    </p>
                    <h1 className="text-2xl font-semibold text-slate-900">
                        Waveform Drawing Assessment
                    </h1>
                    {!token && (
                        <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                            You aren&apos;t signed in to the revision dashboard, so your score won&apos;t be saved. You can still work through the questions.
                        </p>
                    )}
                </div>

                {/* Progress bar */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-slate-600">
                            Question {progress} of {total}
                        </span>
                        <span className="text-xs uppercase tracking-wider text-slate-500">
                            {current.type === 'mcq' ? 'Multiple choice'
                                : current.type === 'numeric' ? 'Calculation'
                                : 'Short answer'}
                        </span>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-emerald-600 transition-all duration-300"
                            style={{ width: `${(progress / total) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Question card */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
                    <h2 className="text-lg sm:text-xl font-semibold text-slate-900 leading-snug mb-6">
                        {current.prompt}
                    </h2>

                    {current.type === 'mcq' && !current.diagramOptions && (
                        <MCQOptions
                            options={current.options}
                            correctIndex={current.correctIndex}
                            selectedIndex={currentAnswer}
                            showFeedback={showFeedback}
                            onSelect={submitAnswer}
                        />
                    )}

                    {current.type === 'mcq' && current.diagramOptions && (
                        <DiagramOptions
                            diagramOptions={current.diagramOptions}
                            correctIndex={current.correctIndex}
                            selectedIndex={currentAnswer}
                            showFeedback={showFeedback}
                            onSelect={submitAnswer}
                        />
                    )}

                    {current.type === 'numeric' && (
                        <NumericInput
                            unit={current.unit}
                            showFeedback={showFeedback}
                            onSubmit={submitAnswer}
                        />
                    )}

                    {current.type === 'short' && (
                        <ShortAnswer
                            showFeedback={showFeedback}
                            onSubmit={submitAnswer}
                            sampleAnswer={current.sampleAnswer}
                        />
                    )}

                    {/* Feedback panel */}
                    {showFeedback && (
                        <FeedbackPanel
                            correct={isCorrect}
                            type={current.type}
                            explanation={current.explanation}
                            sampleAnswer={current.sampleAnswer}
                        />
                    )}

                    {/* Next button */}
                    {showFeedback && (
                        <button
                            type="button"
                            onClick={nextQuestion}
                            className="mt-6 w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-3 rounded-lg transition-colors"
                        >
                            {questionIndex + 1 >= total ? 'See results' : 'Next question'}
                        </button>
                    )}
                </div>

                <p className="text-xs text-slate-500 text-center mt-4">
                    Based on Worksheet 7 (C4 Intervention Pack) · drawn from 2019, 2023, 2024 and 2025 papers
                </p>
            </div>
        </div>
    );
}

// ============================================
// MULTIPLE CHOICE
// ============================================
function MCQOptions({ options, correctIndex, selectedIndex, showFeedback, onSelect }) {
    return (
        <div className="flex flex-col gap-3">
            {options.map((option, i) => {
                let classes = 'border-slate-200 bg-white text-slate-900 hover:border-emerald-400 hover:bg-emerald-50';
                let badgeClasses = 'bg-slate-100 text-slate-600';

                if (showFeedback) {
                    if (i === correctIndex) {
                        classes = 'border-emerald-500 bg-emerald-50 text-emerald-900';
                        badgeClasses = 'bg-emerald-600 text-white';
                    } else if (i === selectedIndex) {
                        classes = 'border-rose-500 bg-rose-50 text-rose-900';
                        badgeClasses = 'bg-rose-600 text-white';
                    } else {
                        classes = 'border-slate-200 bg-white text-slate-500';
                    }
                } else if (i === selectedIndex) {
                    classes = 'border-emerald-500 bg-emerald-50 text-emerald-900';
                    badgeClasses = 'bg-emerald-600 text-white';
                }

                return (
                    <button
                        key={i}
                        type="button"
                        onClick={() => !showFeedback && onSelect(i)}
                        disabled={showFeedback}
                        className={`flex items-center gap-3 text-left p-4 border-2 rounded-lg transition-colors ${classes} ${showFeedback ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold flex-shrink-0 ${badgeClasses}`}>
                            {String.fromCharCode(65 + i)}
                        </span>
                        <span className="text-base">{option}</span>
                    </button>
                );
            })}
        </div>
    );
}

// ============================================
// DIAGRAM OPTIONS (Q9 — waveform identification)
// ============================================
function DiagramOptions({ diagramOptions, correctIndex, selectedIndex, showFeedback, onSelect }) {
    return (
        <div className="grid grid-cols-2 gap-3">
            {diagramOptions.map((kind, i) => {
                let classes = 'border-slate-200 bg-white hover:border-emerald-400 hover:bg-emerald-50';

                if (showFeedback) {
                    if (i === correctIndex) {
                        classes = 'border-emerald-500 bg-emerald-50';
                    } else if (i === selectedIndex) {
                        classes = 'border-rose-500 bg-rose-50';
                    } else {
                        classes = 'border-slate-200 bg-white opacity-60';
                    }
                } else if (i === selectedIndex) {
                    classes = 'border-emerald-500 bg-emerald-50';
                }

                return (
                    <button
                        key={i}
                        type="button"
                        onClick={() => !showFeedback && onSelect(i)}
                        disabled={showFeedback}
                        className={`flex flex-col items-center gap-2 p-3 border-2 rounded-lg transition-colors ${classes} ${showFeedback ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                            {String.fromCharCode(65 + i)}
                        </span>
                        <WaveformOptionDiagram kind={kind} />
                    </button>
                );
            })}
        </div>
    );
}

// Small SVG previews of the four waveform options. 5 ms window, gridlines every 1 ms.
function WaveformOptionDiagram({ kind }) {
    const w = 180;
    const h = 80;
    const padX = 6;
    const padY = 10;
    const innerW = w - padX * 2;
    const innerH = h - padY * 2;
    const midY = h / 2;
    const top = padY;
    const bot = h - padY;

    // Build the path for each option.
    let path = '';
    if (kind === 'square-1ms') {
        // 5 cycles across 5 ms — each cycle = innerW / 5
        const cw = innerW / 5;
        let x = padX;
        let y = top;
        path = `M ${x} ${y}`;
        for (let i = 0; i < 5; i++) {
            const half = cw / 2;
            path += ` H ${x + half} V ${bot} H ${x + cw} V ${top}`;
            x += cw;
        }
    } else if (kind === 'square-2ms') {
        // 2.5 cycles across 5 ms — each cycle = innerW / 2.5
        const cw = innerW / 2.5;
        let x = padX;
        path = `M ${x} ${top}`;
        for (let i = 0; i < 3; i++) {
            const half = cw / 2;
            path += ` H ${Math.min(x + half, padX + innerW)} V ${bot} H ${Math.min(x + cw, padX + innerW)} V ${top}`;
            x += cw;
            if (x >= padX + innerW) break;
        }
    } else if (kind === 'saw-2ms') {
        // Saw wave, period 2 ms → 2.5 cycles
        const cw = innerW / 2.5;
        let x = padX;
        path = `M ${x} ${bot}`;
        for (let i = 0; i < 3; i++) {
            const end = Math.min(x + cw, padX + innerW);
            path += ` L ${end} ${top} L ${end} ${bot}`;
            x = end;
            if (x >= padX + innerW) break;
        }
    } else if (kind === 'sine-1ms') {
        // 5 cycles of sine across 5 ms
        const cycles = 5;
        const steps = 80;
        const amp = innerH / 2;
        const pts = [];
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const x = padX + t * innerW;
            const y = midY - Math.sin(t * cycles * 2 * Math.PI) * amp * 0.95;
            pts.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`);
        }
        path = pts.join(' ');
    }

    return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-20" aria-hidden="true">
            {/* Gridlines every 1 ms (5 divisions) */}
            {[1, 2, 3, 4].map(i => {
                const x = padX + (innerW / 5) * i;
                return <line key={i} x1={x} y1={top} x2={x} y2={bot} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="2 3" />;
            })}
            {/* Zero line */}
            <line x1={padX} y1={midY} x2={padX + innerW} y2={midY} stroke="#cbd5e1" strokeWidth="1" />
            {/* Waveform */}
            <path d={path} stroke="#047857" strokeWidth="2" fill="none" strokeLinejoin="miter" strokeLinecap="square" />
        </svg>
    );
}

// ============================================
// NUMERIC INPUT
// ============================================
function NumericInput({ unit, showFeedback, onSubmit }) {
    const [value, setValue] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        if (!showFeedback) inputRef.current?.focus();
    }, [showFeedback]);

    function handleSubmit(e) {
        e.preventDefault();
        if (value.trim() && !showFeedback) onSubmit(value.trim());
    }

    return (
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
            <input
                ref={inputRef}
                type="text"
                inputMode="decimal"
                value={value}
                onChange={e => setValue(e.target.value)}
                disabled={showFeedback}
                placeholder="Your answer"
                className="flex-1 px-4 py-3 text-lg font-mono border-2 border-slate-200 rounded-lg focus:border-emerald-500 focus:outline-none disabled:bg-slate-100"
            />
            {unit && (
                <span className="text-sm font-medium text-slate-600 whitespace-nowrap">{unit}</span>
            )}
            {!showFeedback && (
                <button
                    type="submit"
                    disabled={!value.trim()}
                    className="bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold px-5 py-3 rounded-lg transition-colors"
                >
                    Check
                </button>
            )}
        </form>
    );
}

// ============================================
// SHORT ANSWER
// ============================================
function ShortAnswer({ showFeedback, onSubmit }) {
    const [value, setValue] = useState('');

    function handleSubmit(e) {
        e.preventDefault();
        if (value.trim() && !showFeedback) onSubmit(value.trim());
    }

    return (
        <form onSubmit={handleSubmit}>
            <textarea
                value={value}
                onChange={e => setValue(e.target.value)}
                disabled={showFeedback}
                placeholder="Type your answer..."
                rows={4}
                className="w-full p-4 text-base border-2 border-slate-200 rounded-lg focus:border-emerald-500 focus:outline-none disabled:bg-slate-100 resize-y"
            />
            {!showFeedback && (
                <button
                    type="submit"
                    disabled={!value.trim()}
                    className="mt-3 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold px-5 py-3 rounded-lg transition-colors"
                >
                    Submit
                </button>
            )}
        </form>
    );
}

// ============================================
// FEEDBACK PANEL
// ============================================
function FeedbackPanel({ correct, type, explanation, sampleAnswer }) {
    const tone = correct
        ? 'border-emerald-300 bg-emerald-50'
        : 'border-rose-300 bg-rose-50';
    const headingTone = correct ? 'text-emerald-800' : 'text-rose-800';
    const heading = correct
        ? 'Correct'
        : type === 'short' ? 'Review your answer against the sample below' : 'Not quite';

    return (
        <div className={`mt-6 border rounded-lg p-4 ${tone}`}>
            <p className={`font-semibold mb-2 ${headingTone}`}>{heading}</p>
            <p className="text-sm text-slate-700 leading-relaxed">{explanation}</p>

            {type === 'short' && sampleAnswer && (
                <div className="mt-3 pt-3 border-t border-slate-200">
                    <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Sample answer</p>
                    <p className="text-sm italic text-slate-700 leading-relaxed">{sampleAnswer}</p>
                </div>
            )}
        </div>
    );
}

// ============================================
// RESULTS SCREEN
// ============================================
function ResultsScreen({ responses, questions, onRestart }) {
    const total = responses.length;
    const correctCount = responses.filter(r => r.correct).length;
    const percentage = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    const scoreColour = percentage >= 80 ? 'text-emerald-700 border-emerald-500'
        : percentage >= 60 ? 'text-amber-700 border-amber-500'
        : 'text-rose-700 border-rose-500';

    const headlineLabel = percentage >= 80 ? 'Strong — bank these marks in the exam.'
        : percentage >= 60 ? 'Getting there — review the missed questions below.'
        : 'Needs work — revisit the worksheet and try again.';

    return (
        <div className="min-h-[60vh] bg-slate-50 py-8 px-4 sm:px-6">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
                    <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">
                        Assessment complete
                    </h2>

                    <div className="flex flex-col items-center my-6">
                        <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full border-4 ${scoreColour}`}>
                            <span className="text-3xl font-bold">{percentage}%</span>
                        </div>
                        <p className="mt-3 text-sm text-slate-600">
                            {correctCount} of {total} correct
                        </p>
                        <p className="mt-1 text-sm text-slate-700 font-medium text-center">
                            {headlineLabel}
                        </p>
                    </div>

                    <h3 className="text-base font-semibold text-slate-900 mb-3 mt-6">
                        Question breakdown
                    </h3>
                    <ul className="flex flex-col gap-2">
                        {questions.map((q, i) => {
                            const r = responses[i];
                            const ok = r?.correct;
                            const icon = ok ? '✓' : '✗';
                            const iconClasses = ok
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-rose-100 text-rose-700';
                            return (
                                <li
                                    key={q.id}
                                    className="flex items-start gap-3 bg-slate-50 border border-slate-200 rounded-md p-3"
                                >
                                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold flex-shrink-0 ${iconClasses}`}>
                                        {icon}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-slate-800 leading-snug">
                                            {q.prompt}
                                        </p>
                                        {r && (
                                            <p className="text-xs text-slate-500 mt-1">
                                                Your answer: <span className="font-mono">{r.answerDisplay || String(r.answer)}</span>
                                            </p>
                                        )}
                                    </div>
                                    <span className="text-[10px] uppercase tracking-wider text-slate-500 flex-shrink-0">
                                        {q.type}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>

                    <button
                        type="button"
                        onClick={onRestart}
                        className="mt-6 w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-3 rounded-lg transition-colors"
                    >
                        Try again
                    </button>
                </div>
            </div>
        </div>
    );
}
