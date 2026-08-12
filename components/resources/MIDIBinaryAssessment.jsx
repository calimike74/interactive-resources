'use client';

import { useState, useEffect, useMemo } from 'react';
import { saveQuizResponse, getNextAttemptNumber } from '@/lib/quiz-persistence';

// ============================================
// QUESTION BANK
// ============================================
// Drawn from Worksheet 8 — MIDI, Binary & Numeracy (Pre-exam Revision Pack).
// Source of truth: Assessment-and-Grades/A-level/C4-2025-Intervention-Pack/08-Worksheet-MIDI-Binary.md
const QUESTIONS = [
    {
        id: 'q1-decimal-to-binary-98',
        type: 'text',
        prompt: 'Convert decimal 98 to 7-bit binary.',
        hint: '64 + 32 + 2 = 98. Place values left-to-right: 64, 32, 16, 8, 4, 2, 1.',
        explanation: '98 = 64 + 32 + 2, so bits at place values 64, 32 and 2 are set: 1100010.',
        // Accept with or without a leading zero — the mark scheme allows either.
        validate: (raw) => {
            const cleaned = String(raw).replace(/\s+/g, '');
            return cleaned === '1100010' || cleaned === '01100010';
        },
        canonicalAnswer: '1100010',
    },
    {
        id: 'q2-decimal-to-binary-65',
        type: 'text',
        prompt: 'Convert decimal 65 to 7-bit binary.',
        hint: '65 = 64 + 1. Only two bits are set.',
        explanation: '65 = 64 + 1, so the bits at place values 64 and 1 are set: 1000001.',
        validate: (raw) => {
            const cleaned = String(raw).replace(/\s+/g, '');
            return cleaned === '1000001' || cleaned === '01000001';
        },
        canonicalAnswer: '1000001',
    },
    {
        id: 'q3-binary-to-decimal-1010101',
        type: 'text',
        prompt: 'Convert binary 1010101 to decimal.',
        hint: 'Add the place values where the bit is 1: 64 + 16 + 4 + 1.',
        explanation: '1010101 → 64 + 16 + 4 + 1 = 85.',
        validate: (raw) => String(raw).trim() === '85',
        canonicalAnswer: '85',
    },
    {
        id: 'q4-bits-for-velocity',
        type: 'mcq',
        prompt: 'How many bits does MIDI use for note velocity?',
        options: ['4', '7', '8', '16'],
        correctIndex: 1,
        explanation: '7 bits gives 2⁷ = 128 possible values, which is exactly the velocity range 0–127.',
    },
    {
        id: 'q5-why-velocity-cap-127',
        type: 'mcq',
        prompt: 'Why can note velocity not exceed 127?',
        options: [
            'Because higher values cause distortion',
            'Because 2⁷ = 128 values and counting starts at 0',
            'Because MIDI is an old protocol',
            'Because 127 is loud enough',
        ],
        correctIndex: 1,
        explanation: '7 bits = 128 possible values (0 to 127). Counting from 0 makes 127 the maximum.',
    },
    {
        id: 'q6-pitch-bend-centre',
        type: 'mcq',
        prompt: 'What is the pitch bend value at its centre position?',
        options: ['1', '127', '8192', '32768'],
        correctIndex: 2,
        explanation: 'Pitch bend uses 14 bits (0–16383). The centre is half of 16384, which is 8192.',
    },
    {
        id: 'q7-pitch-bend-bytes',
        type: 'mcq',
        prompt: 'How many bytes does MIDI use to transmit pitch bend?',
        options: ['1', '2', '7', '14'],
        correctIndex: 1,
        explanation: 'Pitch bend uses 2 bytes (14 bits of data, split across LSB and MSB).',
    },
    {
        id: 'q8-not-a-midi-message',
        type: 'mcq',
        prompt: 'Which of the following is NOT a MIDI message?',
        options: ['Velocity', 'Pitch Bend', 'Program Change', 'Aftertouch'],
        correctIndex: 0,
        explanation: 'Velocity is a parameter inside a Note On message — not a message type in its own right.',
    },
    {
        id: 'q9-three-other-midi-messages',
        type: 'multi',
        prompt: 'Select THREE MIDI messages other than Note On / Note Off.',
        instruction: 'Pick exactly three. Any three valid messages from the list will be marked correct.',
        options: [
            { id: 'pitch-bend', label: 'Pitch Bend', valid: true },
            { id: 'cc1-mod', label: 'Control Change — CC1 Modulation', valid: true },
            { id: 'cc64-sustain', label: 'Control Change — CC64 Sustain', valid: true },
            { id: 'program-change', label: 'Program Change', valid: true },
            { id: 'aftertouch', label: 'Aftertouch', valid: true },
            { id: 'tempo', label: 'Tempo', valid: true },
            { id: 'time-sig', label: 'Time Signature', valid: true },
            { id: 'key-sig', label: 'Key Signature', valid: true },
            { id: 'track-name', label: 'Track Name', valid: true },
            { id: 'sysex', label: 'SysEx', valid: true },
            { id: 'velocity', label: 'Velocity', valid: false },
            { id: 'note-on', label: 'Note On', valid: false },
        ],
        requiredCount: 3,
        explanation: 'Velocity and Note On are traps — velocity is a parameter inside Note On, and the question excludes Note On / Note Off. Any three of: Pitch Bend, CC1, CC64, Program Change, Aftertouch (channel-voice messages sent live over the MIDI cable) — or Tempo, Time Signature, Key Signature, Track Name (meta-events stored inside a Standard MIDI File rather than transmitted live). At A-Level all count as MIDI data, but it is worth knowing that the meta-events live in the file, not on the wire.',
    },
    {
        id: 'q10-drum-note-length',
        type: 'mcq',
        prompt: 'Why does the length of a MIDI note make no difference to a drum sound?',
        options: [
            'MIDI ignores note length',
            'Drum sounds are one-shot samples that play to their full length regardless of Note Off',
            'The drum machine truncates everything',
            'Sample rate handles it',
        ],
        correctIndex: 1,
        explanation: 'Drum hits are one-shot samples — once triggered, they play to their natural length and ignore Note Off.',
    },
];

// ============================================
// MAIN COMPONENT
// ============================================
export default function MIDIBinaryAssessment() {
    const [student, setStudent] = useState(null);
    const [attemptNumber, setAttemptNumber] = useState(null);
    const [questionIndex, setQuestionIndex] = useState(0);
    const [responses, setResponses] = useState([]);
    const [currentInput, setCurrentInput] = useState('');
    const [multiSelected, setMultiSelected] = useState([]);
    const [mcqIndex, setMcqIndex] = useState(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [finished, setFinished] = useState(false);

    // Mini-trainer state (binary drill — three drills woven into the run)
    const [trainerSeeds] = useState(() => [
        Math.floor(Math.random() * 128),
        Math.floor(Math.random() * 128),
    ]);
    const [trainerInputs, setTrainerInputs] = useState({});
    const [trainerFeedback, setTrainerFeedback] = useState({});

    // Build the question run: insert two mini-trainer drills near the end
    const allQuestions = useMemo(() => {
        const trainers = trainerSeeds.map((decimal, i) => ({
            id: `trainer-${i + 1}-${decimal}`,
            type: 'trainer',
            prompt: `Mini-trainer: convert decimal ${decimal} to 7-bit binary.`,
            decimal,
            hint: 'Work from the largest place value (64) down. If it fits, write 1 and subtract. If not, write 0.',
        }));
        // Insert trainers as questions 11 and 12
        return [...QUESTIONS, ...trainers];
    }, [trainerSeeds]);

    // Read auth token from localStorage (matches the /revise pattern).
    // No token = anonymous; we still let students take the quiz, just don't save.
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const token = localStorage.getItem('revision_token');
        const studentId = localStorage.getItem('revision_student_id');
        const studentName = localStorage.getItem('revision_student_name');
        if (token && studentId) {
            setStudent({ token, studentId, studentName });
        }
    }, []);

    useEffect(() => {
        if (!student) return;
        getNextAttemptNumber(student.token, 'midi-binary-assessment')
            .then(setAttemptNumber)
            .catch(() => setAttemptNumber(1));
    }, [student]);

    const current = allQuestions[questionIndex];
    const total = allQuestions.length;
    const progress = questionIndex + 1;

    function resetInput() {
        setCurrentInput('');
        setMultiSelected([]);
        setMcqIndex(null);
        setShowFeedback(false);
        setIsCorrect(false);
    }

    function decimalToBinary7Bit(n) {
        return n.toString(2).padStart(7, '0');
    }

    function evaluate(question, answer) {
        if (question.type === 'mcq') {
            return answer === question.correctIndex;
        }
        if (question.type === 'text') {
            return question.validate(answer);
        }
        if (question.type === 'multi') {
            if (!Array.isArray(answer) || answer.length !== question.requiredCount) return false;
            return answer.every((id) => {
                const opt = question.options.find((o) => o.id === id);
                return opt && opt.valid;
            });
        }
        if (question.type === 'trainer') {
            const cleaned = String(answer).replace(/\s+/g, '');
            const expected = decimalToBinary7Bit(question.decimal);
            return cleaned === expected || cleaned === expected.padStart(8, '0');
        }
        return false;
    }

    function handleSubmit() {
        let answer;
        if (current.type === 'mcq') {
            if (mcqIndex === null) return;
            answer = mcqIndex;
        } else if (current.type === 'multi') {
            if (multiSelected.length !== current.requiredCount) return;
            answer = multiSelected;
        } else {
            if (!currentInput.trim()) return;
            answer = currentInput.trim();
        }

        const correct = evaluate(current, answer);
        setIsCorrect(correct);
        setShowFeedback(true);

        const recordedAnswer =
            current.type === 'mcq'
                ? current.options[answer]
                : current.type === 'multi'
                ? answer
                      .map((id) => current.options.find((o) => o.id === id)?.label)
                      .filter(Boolean)
                      .join('; ')
                : String(answer);

        setResponses((prev) => [
            ...prev,
            {
                questionId: current.id,
                type: current.type,
                prompt: current.prompt,
                answer: recordedAnswer,
                correct,
                explanation: current.explanation || current.hint,
            },
        ]);

        // Fire-and-forget save
        if (student && attemptNumber) {
            saveQuizResponse({
                token: student.token,
                topicId: 'midi-binary-assessment',
                questionId: current.id,
                questionType: current.type,
                answer: recordedAnswer,
                correct,
                attemptNumber,
                mode: 'revision',
            });
        }
    }

    function handleNext() {
        if (questionIndex + 1 >= total) {
            setFinished(true);
            return;
        }
        setQuestionIndex((i) => i + 1);
        resetInput();
    }

    function handleRestart() {
        setQuestionIndex(0);
        setResponses([]);
        setFinished(false);
        resetInput();
    }

    // ============================================
    // RESULTS SCREEN
    // ============================================
    if (finished) {
        const scored = responses.filter((r) => r.correct !== null);
        const correctCount = scored.filter((r) => r.correct).length;
        const percentage = scored.length > 0 ? Math.round((correctCount / scored.length) * 100) : 0;
        const bandColour =
            percentage >= 80
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : percentage >= 60
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-rose-50 border-rose-300 text-rose-900';

        return (
            <div className="min-h-[60vh] bg-cream py-10 px-4 sm:px-6">
            <div className="mx-auto max-w-3xl text-ink">
                <header className="mb-6">
                    <h1 className="font-[family-name:var(--font-fraunces)] text-3xl font-medium text-ink">MIDI, Binary & Numeracy — Results</h1>
                    <p className="mt-2 text-xs sm:text-sm font-[family-name:var(--font-jbmono)] uppercase tracking-wide text-sienna-600">1.5 Sequencing + 2.5 Numeracy</p>
                </header>

                <div className={`mb-6 rounded-2xl border-2 p-6 ${bandColour}`}>
                    <p className="text-sm font-medium uppercase tracking-wide opacity-80">Score</p>
                    <p className="mt-1 text-5xl font-bold">
                        {correctCount}
                        <span className="text-2xl opacity-60"> / {scored.length}</span>
                    </p>
                    <p className="mt-2 text-lg font-medium">{percentage}%</p>
                </div>

                <h2 className="mb-3 text-xl font-semibold text-ink">Per-question feedback</h2>
                <ul className="space-y-3">
                    {responses.map((r, i) => (
                        <li
                            key={r.questionId}
                            className={`rounded-xl border p-4 ${
                                r.correct
                                    ? 'border-emerald-200 bg-emerald-50'
                                    : 'border-rose-200 bg-rose-50'
                            }`}
                        >
                            <div className="mb-1 flex items-start justify-between gap-3">
                                <p className="text-sm font-semibold text-ink">
                                    Q{i + 1}. {r.prompt}
                                </p>
                                <span
                                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                                        r.correct
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-rose-600 text-white'
                                    }`}
                                >
                                    {r.correct ? 'Correct' : 'Wrong'}
                                </span>
                            </div>
                            <p className="text-sm text-ink/70">
                                <span className="font-medium">Your answer:</span> {r.answer}
                            </p>
                            {r.explanation && (
                                <p className="mt-2 text-sm text-ink/60">
                                    <span className="font-medium">Why:</span> {r.explanation}
                                </p>
                            )}
                        </li>
                    ))}
                </ul>

                <div className="mt-8 flex flex-wrap gap-3">
                    <button type="button"
                        onClick={handleRestart}
                        className="rounded-full bg-sienna-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sienna-600"
                    >
                        Try again
                    </button>
                </div>
            </div>
            </div>
        );
    }

    // ============================================
    // QUESTION SCREEN
    // ============================================
    return (
        <div className="min-h-[60vh] bg-cream py-10 px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-ink">
            <header className="mb-6">
                <h1 className="font-[family-name:var(--font-fraunces)] text-2xl font-medium text-ink sm:text-3xl">
                    MIDI, Binary & Numeracy Assessment
                </h1>
                <p className="mt-2 text-xs sm:text-sm font-[family-name:var(--font-jbmono)] uppercase tracking-wide text-sienna-600">
                    1.5 Sequencing + 2.5 Numeracy — exam-style practice questions
                </p>
            </header>

            {/* Progress bar */}
            <div className="mb-6">
                <div className="mb-2 flex items-center justify-between text-xs text-ink/60">
                    <span className="font-medium">
                        Question {progress} of {total}
                    </span>
                    <span className="uppercase tracking-wide">
                        {current.type === 'mcq'
                            ? 'Multiple choice'
                            : current.type === 'multi'
                            ? 'Select three'
                            : current.type === 'trainer'
                            ? 'Mini-trainer'
                            : 'Type your answer'}
                    </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
                    <div
                        className="h-full bg-sienna-500 transition-[width] duration-300 ease-house"
                        style={{ width: `${(progress / total) * 100}%` }}
                    />
                </div>
            </div>

            {/* Question card */}
            <div className="rounded-2xl border border-line bg-paper p-6 sm:p-8 shadow-[0_1px_0_rgba(43,36,24,0.04),0_18px_40px_-24px_rgba(43,36,24,0.22)]">
                <h2 className="mb-5 text-lg font-semibold leading-snug text-ink sm:text-xl">
                    {current.prompt}
                </h2>

                {current.instruction && (
                    <p className="-mt-2 mb-4 text-sm text-ink/60">{current.instruction}</p>
                )}

                {/* MCQ input */}
                {current.type === 'mcq' && (
                    <div className="space-y-2">
                        {current.options.map((opt, i) => {
                            const isSelected = mcqIndex === i;
                            const showResult = showFeedback;
                            const isAnswer = i === current.correctIndex;
                            const baseClass =
                                'w-full text-left rounded-xl border p-3 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sienna-500';
                            let styling = 'border-line bg-paper hover:border-sienna-200 hover:bg-sienna-50';
                            if (showResult && isAnswer) {
                                styling = 'border-emerald-400 bg-emerald-50 text-emerald-900';
                            } else if (showResult && isSelected && !isAnswer) {
                                styling = 'border-rose-400 bg-rose-50 text-rose-900';
                            } else if (isSelected) {
                                styling = 'border-sienna-500 bg-sienna-50';
                            }
                            return (
                                <button type="button"
                                    key={i}
                                    disabled={showFeedback}
                                    onClick={() => setMcqIndex(i)}
                                    className={`${baseClass} ${styling}`}
                                >
                                    <span className="mr-2 font-semibold">
                                        {String.fromCharCode(65 + i)}.
                                    </span>
                                    {opt}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Multi-select input */}
                {current.type === 'multi' && (
                    <div className="space-y-2">
                        {current.options.map((opt) => {
                            const isSelected = multiSelected.includes(opt.id);
                            const canSelect =
                                isSelected || multiSelected.length < current.requiredCount;
                            const showResult = showFeedback;
                            let styling = 'border-line bg-paper';
                            if (showResult && isSelected && opt.valid) {
                                styling = 'border-emerald-400 bg-emerald-50';
                            } else if (showResult && isSelected && !opt.valid) {
                                styling = 'border-rose-400 bg-rose-50';
                            } else if (isSelected) {
                                styling = 'border-sienna-500 bg-sienna-50';
                            } else if (!canSelect) {
                                styling = 'border-line bg-cream opacity-50';
                            } else {
                                styling = 'border-line bg-paper hover:border-sienna-200 hover:bg-sienna-50';
                            }
                            return (
                                <label
                                    key={opt.id}
                                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${styling}`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        disabled={showFeedback || (!isSelected && !canSelect)}
                                        onChange={() => {
                                            if (showFeedback) return;
                                            if (isSelected) {
                                                setMultiSelected((sel) =>
                                                    sel.filter((id) => id !== opt.id),
                                                );
                                            } else if (multiSelected.length < current.requiredCount) {
                                                setMultiSelected((sel) => [...sel, opt.id]);
                                            }
                                        }}
                                        className="h-4 w-4 accent-sienna-500"
                                    />
                                    <span className="text-sm text-ink">{opt.label}</span>
                                </label>
                            );
                        })}
                        <p className="mt-2 text-xs text-ink/50">
                            Selected: {multiSelected.length} / {current.requiredCount}
                        </p>
                    </div>
                )}

                {/* Text / trainer input */}
                {(current.type === 'text' || current.type === 'trainer') && (
                    <div>
                        <input aria-label="Input"
                            type="text"
                            inputMode="numeric"
                            autoComplete="off"
                            spellCheck={false}
                            value={currentInput}
                            onChange={(e) => setCurrentInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !showFeedback) handleSubmit();
                            }}
                            disabled={showFeedback}
                            placeholder={
                                current.type === 'trainer'
                                    ? 'Type 7 binary digits, e.g. 1100100'
                                    : 'Type your answer…'
                            }
                            className="w-full rounded-xl border border-line bg-paper px-4 py-3 font-[family-name:var(--font-jbmono)] text-base text-ink shadow-sm focus:border-sienna-500 focus:outline-none focus:ring-2 focus:ring-sienna-200 disabled:bg-cream"
                        />
                        {current.type === 'trainer' && (
                            <p className="mt-2 text-xs text-ink/50">
                                Tip: place values left-to-right are 64, 32, 16, 8, 4, 2, 1.
                            </p>
                        )}
                    </div>
                )}

                {/* Feedback */}
                {showFeedback && (
                    <div
                        className={`mt-5 rounded-xl border p-4 ${
                            isCorrect
                                ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                                : 'border-rose-300 bg-rose-50 text-rose-900'
                        }`}
                    >
                        <p className="text-sm font-semibold">
                            {isCorrect ? 'Correct.' : 'Not quite.'}
                        </p>
                        {!isCorrect && current.type === 'trainer' && (
                            <p className="mt-1 text-sm">
                                The answer is{' '}
                                <span className="font-mono font-semibold">
                                    {decimalToBinary7Bit(current.decimal)}
                                </span>
                                . Worked example: start from 64 and subtract each place value that
                                fits — anything that doesn't fit becomes a 0.
                            </p>
                        )}
                        {!isCorrect && current.type !== 'trainer' && current.canonicalAnswer && (
                            <p className="mt-1 text-sm">
                                Expected:{' '}
                                <span className="font-mono font-semibold">
                                    {current.canonicalAnswer}
                                </span>
                                .
                            </p>
                        )}
                        {current.explanation && (
                            <p className="mt-2 text-sm">{current.explanation}</p>
                        )}
                        {!isCorrect && current.hint && current.type === 'trainer' && (
                            <p className="mt-1 text-xs italic opacity-80">Hint: {current.hint}</p>
                        )}
                    </div>
                )}

                {/* Action button */}
                <div className="mt-6 flex justify-end">
                    {!showFeedback ? (
                        <button type="button"
                            onClick={handleSubmit}
                            disabled={
                                (current.type === 'mcq' && mcqIndex === null) ||
                                (current.type === 'multi' &&
                                    multiSelected.length !== current.requiredCount) ||
                                ((current.type === 'text' || current.type === 'trainer') &&
                                    !currentInput.trim())
                            }
                            className="rounded-full bg-sienna-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sienna-600 disabled:cursor-not-allowed disabled:bg-line disabled:text-ink/40"
                        >
                            Check answer
                        </button>
                    ) : (
                        <button type="button"
                            onClick={handleNext}
                            className="rounded-full bg-field-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-field-600"
                        >
                            {questionIndex + 1 >= total ? 'See results' : 'Next question'}
                        </button>
                    )}
                </div>
            </div>

            {!student && (
                <p className="mt-4 text-center text-xs text-ink/50">
                    Sign in via the revision portal to save your score.
                </p>
            )}
        </div>
        </div>
    );
}
