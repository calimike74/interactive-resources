'use client';

// ════════════════════════════════════════════════════════════════════
// DigitalAudioAssessment — 2.4 Digital and Analogue / 2.5 Numeracy / 2.3 Signals
//
// Drills the question patterns from worksheet 09-Worksheet-Digital-Audio.md:
//   - File-size calculations (ratio shortcut + formula from scratch)
//   - Lossy vs lossless taxonomy and format ranking
//   - ADC location in the signal chain
//   - Audio artefacts (mp3 / aliasing / analogue tape features)
//
// Includes a "File Size Calculator" mini-tool that walks students through
// the formula before they tackle the from-scratch numeric question.
// Responses persist via saveQuizResponse → grades-dashboard (mode: 'revision').
// ════════════════════════════════════════════════════════════════════

import { useState, useEffect, useMemo } from 'react';
import { saveQuizResponse, getNextAttemptNumber } from '@/lib/quiz-persistence';

const TOPIC_ID = 'digital-audio-assessment';

// ──────────────────────────────────────────────────────────────────────
// Question bank — drawn directly from worksheet 09 + answer key
// ──────────────────────────────────────────────────────────────────────
const QUESTIONS = [
    {
        id: 'da-q1',
        type: 'numeric',
        section: 'File size — ratio shortcut',
        question: 'A 10 MB mono 44.1 kHz 16-bit .wav file is converted to stereo (everything else unchanged). What is the new file size in MB?',
        answer: 20,
        tolerance: 0,
        unit: 'MB',
        explanation: 'Only the channel count changed: ×2 (mono → stereo). 10 MB × 2 = 20 MB.',
    },
    {
        id: 'da-q2',
        type: 'numeric',
        section: 'File size — multi-property ratio',
        question: 'Starting from the same 10 MB mono 44.1 kHz 16-bit .wav, convert to stereo, 88.2 kHz, 24-bit. New file size in MB?',
        answer: 60,
        tolerance: 0,
        unit: 'MB',
        explanation: 'Three multipliers: ×2 channels × ×2 sample rate (44.1 → 88.2) × ×1.5 bit depth (16 → 24) = ×6. 10 MB × 6 = 60 MB.',
    },
    {
        id: 'da-q3',
        type: 'mcq',
        section: 'Format ranking',
        question: 'Rank these audio formats from BEST to WORST sound quality: (A) AAC 320 kbps, (B) AIFF 44.1 kHz 4-bit, (C) CD (44.1 kHz 16-bit stereo), (D) mp3 160 kbps.',
        options: [
            'C, A, D, B',
            'A, C, D, B',
            'C, A, B, D',
            'B, C, A, D',
        ],
        correctIndex: 0,
        explanation: 'CD (C) is uncompressed PCM at full bandwidth — best. AAC at 320 kbps (A) is near-transparent lossy. mp3 at 160 kbps (D) has audible artefacts. AIFF at 4-bit (B) is worst because bit depth destroys dynamic range — uncompressed does NOT guarantee best.',
    },
    {
        id: 'da-q4',
        type: 'mcq',
        section: 'Compression type',
        question: 'What type of data compression is used by AAC files?',
        options: [
            'Bit crusher',
            'Dynamic compression',
            'Lossless compression',
            'Lossy compression',
        ],
        correctIndex: 3,
        explanation: 'AAC (along with mp3 and Ogg Vorbis) uses a psychoacoustic model to discard data deemed inaudible — this is lossy compression. Dynamic compression is a mix tool, not a file-format process.',
    },
    {
        id: 'da-q5',
        type: 'mcq',
        section: 'Lossy → uncompressed conversion',
        question: 'A file downloaded as AAC is converted to .wav. How does the conversion affect the audio?',
        options: [
            'File size is decreased',
            'Sound quality is significantly improved',
            'Sound quality is significantly reduced',
            'There is no significant difference in sound quality',
        ],
        correctIndex: 3,
        explanation: 'Once data has been discarded by lossy compression, converting back to .wav cannot restore it. The .wav file is now larger but contains the same already-compressed audio.',
    },
    {
        id: 'da-q6',
        type: 'short',
        section: 'Audio artefacts',
        question: 'Define what an audio artefact is.',
        sampleAnswer: 'An unwanted sonic material caused by editing, processing or a digital process — a sound introduced into the signal that was not present in the original. Aliasing is an example.',
        keyPoints: ['unwanted', 'caused by editing/processing/digital process', 'not in original signal', 'aliasing accepted as example'],
        explanation: 'Marker note: do NOT write "noise picked up from the room" — that is capture noise, not an artefact. Examples accepted in the mark scheme include aliasing, pre-echo and warbling from mp3 compression.',
    },
    {
        id: 'da-q7',
        type: 'mcq',
        section: 'mp3 artefacts',
        question: 'Name one unwanted sound that mp3 data compression introduces into a vocal phrase.',
        options: [
            'Hiss',
            'Pre-echo',
            'Wow',
            'Rumble',
        ],
        correctIndex: 1,
        explanation: 'Pre-echo (also accept warbling, swirling highs, smeared transients) is a classic mp3 artefact caused by transient signals leaking across the codec\'s analysis window. Hiss = analogue tape, wow = tape speed variation, rumble = low-frequency capture noise.',
    },
    {
        id: 'da-q8',
        type: 'cloze',
        section: 'Lossy compression — define',
        question: 'Complete the sentence: "Lossy compression ___ some of the data, so there is a ___ in sound quality. A benefit of lossy compression is that the file size would be ___ than an uncompressed file."',
        blanks: [
            { id: 'b1', options: ['removes', 'discards', 'adds', 'amplifies'], correctIndex: 1, accept: [0] },
            { id: 'b2', options: ['reduction', 'improvement', 'loss', 'gain'], correctIndex: 0, accept: [2] },
            { id: 'b3', options: ['smaller', 'larger', 'identical', 'higher quality'], correctIndex: 0 },
        ],
        explanation: 'Lossy compression discards (or removes) data, causing a reduction (or loss) in sound quality; the benefit is a smaller file. Both "removes" and "discards" earn the first mark; both "reduction" and "loss" earn the second.',
    },
    {
        id: 'da-q9',
        type: 'mcq',
        section: 'ADC location',
        question: 'Where in the signal chain does the ADC sit when recording a vocalist into a DAW?',
        options: [
            'Before the microphone',
            'Before the preamp',
            'Between the preamp and the DAW (inside the audio interface)',
            'After the speakers',
        ],
        correctIndex: 2,
        explanation: 'The ADC (Analogue-to-Digital Converter) lives inside the audio interface, between the preamp output and the USB/Thunderbolt cable to the computer. It converts continuous analogue voltage into discrete digital samples.',
    },
    {
        id: 'da-q10',
        type: 'mcq',
        section: 'Analogue tape features',
        question: 'A vocal was recorded using analogue tape. Identify ONE feature of analogue tape that you might hear in the recording.',
        options: [
            'Aliasing',
            'Hiss',
            'Quantisation',
            'Lossy compression',
        ],
        correctIndex: 1,
        explanation: 'Tape hiss is the classic analogue feature — a constant high-frequency noise floor. Wow, flutter and tape saturation are also acceptable in the mark scheme. Aliasing and quantisation are DIGITAL artefacts; lossy compression is a digital file process.',
    },
    {
        id: 'da-q11',
        type: 'numeric',
        section: 'File size — from scratch (after the mini-tool)',
        question: 'A 60-second mono .wav at 44.1 kHz, 16-bit. Calculate the file size in MB. (Use 1 MB = 1,000,000 bytes.)',
        answer: 5.292,
        tolerance: 0.1,
        unit: 'MB',
        explanation: 'Working: 44,100 × 16 × 1 × 60 ÷ 8 = 5,292,000 bytes = 5.292 MB. Tolerance ±0.1 MB to allow for rounding.',
    },
];

const SECTION_BEFORE_TOOL = 'da-q11'; // show calculator mini-tool just before this question

// ──────────────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────────────
export default function DigitalAudioAssessment() {
    const [token, setToken] = useState(null);
    const [authChecked, setAuthChecked] = useState(false);
    const [attemptNumber, setAttemptNumber] = useState(null);
    const [questionIndex, setQuestionIndex] = useState(0);
    const [showFeedback, setShowFeedback] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [responses, setResponses] = useState([]);
    const [finished, setFinished] = useState(false);
    const [showCalculator, setShowCalculator] = useState(false);
    const [calculatorAcknowledged, setCalculatorAcknowledged] = useState(false);

    // Read auth token from localStorage (same convention as RevisePageClient)
    useEffect(() => {
        const t = typeof window !== 'undefined' ? localStorage.getItem('revision_token') : null;
        if (t) {
            setToken(t);
            getNextAttemptNumber(t, TOPIC_ID)
                .then(setAttemptNumber)
                .catch(() => setAttemptNumber(1));
        }
        setAuthChecked(true);
    }, []);

    const current = QUESTIONS[questionIndex];
    const total = QUESTIONS.length;
    const progress = questionIndex + 1;

    // Pop the calculator helper just before the from-scratch numeric question
    useEffect(() => {
        if (current?.id === SECTION_BEFORE_TOOL && !calculatorAcknowledged) {
            setShowCalculator(true);
        }
    }, [current, calculatorAcknowledged]);

    function recordResponse(question, answer, correctValue, answerForDb) {
        setResponses(prev => [...prev, {
            questionId: question.id,
            type: question.type,
            answer,
            correct: correctValue,
        }]);

        if (token && attemptNumber) {
            saveQuizResponse({
                token,
                topicId: TOPIC_ID,
                questionId: question.id,
                questionType: question.type,
                answer: answerForDb,
                correct: correctValue,
                attemptNumber,
                mode: 'revision',
            });
        }
    }

    function submitMcq(index) {
        const correct = index === current.correctIndex;
        setIsCorrect(correct);
        setShowFeedback(true);
        recordResponse(current, index, correct, current.options[index]);
    }

    function submitNumeric(rawValue) {
        const parsed = parseFloat(rawValue);
        const correct = !isNaN(parsed) && Math.abs(parsed - current.answer) <= (current.tolerance || 0);
        setIsCorrect(correct);
        setShowFeedback(true);
        recordResponse(current, rawValue, correct, String(rawValue));
    }

    function submitShort(text) {
        // Short answers are self-assessed — store as correct: null
        setIsCorrect(false);
        setShowFeedback(true);
        recordResponse(current, text, null, text);
    }

    function submitCloze(selections) {
        // selections: array of selected indices, one per blank
        const blankResults = current.blanks.map((b, i) => {
            const chosen = selections[i];
            const accept = [b.correctIndex, ...(b.accept || [])];
            return accept.includes(chosen);
        });
        const correct = blankResults.every(Boolean);
        setIsCorrect(correct);
        setShowFeedback(true);
        const answerString = selections.map((s, i) => current.blanks[i].options[s]).join(' | ');
        recordResponse(current, selections, correct, answerString);
    }

    function nextQuestion() {
        if (questionIndex + 1 >= QUESTIONS.length) {
            setFinished(true);
        } else {
            setQuestionIndex(prev => prev + 1);
            setShowFeedback(false);
            setIsCorrect(false);
        }
    }

    function restart() {
        setQuestionIndex(0);
        setShowFeedback(false);
        setIsCorrect(false);
        setResponses([]);
        setFinished(false);
        setCalculatorAcknowledged(false);
        setShowCalculator(false);
    }

    // ──────────────────────────────────────────────────────────────────
    // Render
    // ──────────────────────────────────────────────────────────────────
    if (!authChecked) {
        return <div className="min-h-[60vh]" />;
    }

    if (finished) {
        return <ResultsScreen responses={responses} questions={QUESTIONS} onRestart={restart} />;
    }

    return (
        <div className="min-h-screen bg-stone-50 py-8 px-4 sm:px-6">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <header className="mb-6">
                    <p className="text-xs font-semibold tracking-widest uppercase text-amber-700 mb-1">
                        2.4 Digital and Analogue · 2.5 Numeracy · 2.3 Signals
                    </p>
                    <h1 className="text-2xl sm:text-3xl font-bold text-stone-900">
                        Digital Audio Assessment
                    </h1>
                    <p className="text-sm text-stone-600 mt-1">
                        File size, compression, ADC location and audio artefacts.
                    </p>
                    {!token && (
                        <p className="mt-3 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                            Not signed in — your answers will not be saved. Sign in on the revision dashboard first if you want this attempt logged.
                        </p>
                    )}
                </header>

                {/* Progress */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2 text-sm">
                        <span className="font-medium text-stone-700">
                            Question {progress} of {total}
                        </span>
                        <span className="text-stone-500 text-xs uppercase tracking-wide">
                            {questionTypeLabel(current.type)}
                        </span>
                    </div>
                    <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-amber-600 transition-all duration-300"
                            style={{ width: `${(progress / total) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Calculator mini-tool — pops before the from-scratch numeric */}
                {showCalculator && (
                    <FileSizeCalculator
                        onClose={() => { setShowCalculator(false); setCalculatorAcknowledged(true); }}
                    />
                )}

                {/* Question card */}
                <div className="bg-white border border-stone-200 rounded-xl shadow-sm p-6 sm:p-8">
                    <p className="text-xs font-semibold tracking-wider uppercase text-stone-500 mb-3">
                        {current.section}
                    </p>
                    <h2 className="text-lg sm:text-xl font-semibold text-stone-900 leading-snug mb-6">
                        {current.question}
                    </h2>

                    {current.type === 'mcq' && (
                        <McqOptions
                            options={current.options}
                            correctIndex={current.correctIndex}
                            showFeedback={showFeedback}
                            selectedIndex={lastSelectedIndex(responses, current.id)}
                            onSelect={submitMcq}
                        />
                    )}

                    {current.type === 'numeric' && (
                        <NumericInput
                            unit={current.unit}
                            showFeedback={showFeedback}
                            onSubmit={submitNumeric}
                        />
                    )}

                    {current.type === 'short' && (
                        <ShortAnswer
                            showFeedback={showFeedback}
                            onSubmit={submitShort}
                            sampleAnswer={current.sampleAnswer}
                            keyPoints={current.keyPoints}
                        />
                    )}

                    {current.type === 'cloze' && (
                        <ClozeInput
                            blanks={current.blanks}
                            showFeedback={showFeedback}
                            onSubmit={submitCloze}
                        />
                    )}

                    {showFeedback && (
                        <FeedbackPanel
                            type={current.type}
                            isCorrect={isCorrect}
                            explanation={current.explanation}
                        />
                    )}

                    {showFeedback && (
                        <button
                            onClick={nextQuestion}
                            className="mt-5 w-full py-3 px-6 bg-amber-700 hover:bg-amber-800 text-white rounded-lg font-semibold transition-colors"
                        >
                            {questionIndex + 1 >= QUESTIONS.length ? 'See Results' : 'Next Question'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// Pull the most recent answer for a given question id so MCQ feedback can highlight it
function lastSelectedIndex(responses, questionId) {
    for (let i = responses.length - 1; i >= 0; i--) {
        if (responses[i].questionId === questionId && typeof responses[i].answer === 'number') {
            return responses[i].answer;
        }
    }
    return null;
}

function questionTypeLabel(type) {
    if (type === 'mcq') return 'Multiple Choice';
    if (type === 'numeric') return 'Calculation';
    if (type === 'short') return 'Short Answer';
    if (type === 'cloze') return 'Fill the gaps';
    return type;
}

// ──────────────────────────────────────────────────────────────────────
// File size calculator mini-tool
// ──────────────────────────────────────────────────────────────────────
function FileSizeCalculator({ onClose }) {
    const [sampleRate, setSampleRate] = useState(44100);
    const [bitDepth, setBitDepth] = useState(16);
    const [channels, setChannels] = useState(2);
    const [duration, setDuration] = useState(60);

    const bytes = useMemo(() => {
        return (sampleRate * bitDepth * channels * duration) / 8;
    }, [sampleRate, bitDepth, channels, duration]);

    const mb = bytes / 1_000_000;

    return (
        <div className="mb-6 bg-amber-50 border-2 border-amber-300 rounded-xl p-5 sm:p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                    <p className="text-xs font-semibold tracking-widest uppercase text-amber-800 mb-1">
                        File-size calculator
                    </p>
                    <h3 className="text-lg font-semibold text-stone-900">
                        Try the formula before the next question
                    </h3>
                </div>
                <button
                    onClick={onClose}
                    className="text-stone-500 hover:text-stone-800 text-2xl leading-none"
                    aria-label="Close calculator"
                >
                    ×
                </button>
            </div>

            <p className="text-sm text-stone-700 mb-4">
                Change the inputs and watch the formula step through. Then close this and try
                the next question without the calculator.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-4">
                <NumberField label="Sample rate (Hz)" value={sampleRate} onChange={setSampleRate} options={[22050, 44100, 48000, 88200, 96000, 192000]} />
                <NumberField label="Bit depth (bits)" value={bitDepth} onChange={setBitDepth} options={[4, 8, 16, 24, 32]} />
                <NumberField label="Channels" value={channels} onChange={setChannels} options={[1, 2, 4, 8, 16]} />
                <NumberField label="Duration (seconds)" value={duration} onChange={setDuration} options={[10, 30, 60, 180, 240, 600]} />
            </div>

            {/* Step-through */}
            <div className="bg-white rounded-lg p-4 border border-amber-200 font-mono text-xs sm:text-sm space-y-2">
                <p className="text-stone-500">bytes = (sample rate × bit depth × channels × duration) ÷ 8</p>
                <p className="text-stone-800">
                    bytes = ({sampleRate.toLocaleString()} × {bitDepth} × {channels} × {duration}) ÷ 8
                </p>
                <p className="text-stone-800">
                    bytes = {(sampleRate * bitDepth * channels * duration).toLocaleString()} ÷ 8
                </p>
                <p className="text-stone-800">
                    bytes = {bytes.toLocaleString()}
                </p>
                <p className="text-amber-800 font-bold text-base">
                    file size = {mb.toFixed(3)} MB
                </p>
            </div>

            <p className="text-xs text-stone-600 mt-3 italic">
                Exam convention: 1 MB = 1,000,000 bytes (decimal MB).
            </p>

            <button
                onClick={onClose}
                className="mt-4 w-full py-2.5 px-4 bg-amber-700 hover:bg-amber-800 text-white rounded-lg font-semibold transition-colors"
            >
                Got it — try the question
            </button>
        </div>
    );
}

function NumberField({ label, value, onChange, options }) {
    return (
        <label className="block">
            <span className="block text-xs font-semibold text-stone-700 mb-1">{label}</span>
            <select
                value={value}
                onChange={e => onChange(Number(e.target.value))}
                className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
                {options.map(opt => (
                    <option key={opt} value={opt}>{opt.toLocaleString()}</option>
                ))}
            </select>
        </label>
    );
}

// ──────────────────────────────────────────────────────────────────────
// Question type renderers
// ──────────────────────────────────────────────────────────────────────
function McqOptions({ options, correctIndex, selectedIndex, showFeedback, onSelect }) {
    return (
        <div className="flex flex-col gap-2.5">
            {options.map((option, i) => {
                let stateClasses = 'bg-white border-stone-300 text-stone-800 hover:bg-stone-50';
                if (showFeedback) {
                    if (i === correctIndex) {
                        stateClasses = 'bg-emerald-50 border-emerald-500 text-emerald-900';
                    } else if (i === selectedIndex && i !== correctIndex) {
                        stateClasses = 'bg-rose-50 border-rose-500 text-rose-900';
                    } else {
                        stateClasses = 'bg-stone-50 border-stone-200 text-stone-600';
                    }
                } else if (i === selectedIndex) {
                    stateClasses = 'bg-amber-50 border-amber-500 text-amber-900';
                }

                return (
                    <button
                        key={i}
                        onClick={() => !showFeedback && onSelect(i)}
                        disabled={showFeedback}
                        className={`text-left px-5 py-4 border-2 rounded-lg transition-colors disabled:cursor-default flex items-start gap-3 ${stateClasses}`}
                    >
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-stone-200 text-stone-700 text-xs font-bold flex items-center justify-center mt-0.5">
                            {String.fromCharCode(65 + i)}
                        </span>
                        <span className="text-sm sm:text-base leading-snug">{option}</span>
                    </button>
                );
            })}
        </div>
    );
}

function NumericInput({ unit, showFeedback, onSubmit }) {
    const [value, setValue] = useState('');

    function handleSubmit(e) {
        e.preventDefault();
        if (value.trim() && !showFeedback) onSubmit(value.trim());
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <input
                type="text"
                inputMode="decimal"
                value={value}
                onChange={e => setValue(e.target.value)}
                disabled={showFeedback}
                placeholder="Your answer"
                className="flex-1 px-4 py-3 text-lg border-2 border-stone-300 rounded-lg font-mono disabled:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            {unit && (
                <span className="text-sm font-medium text-stone-500 whitespace-nowrap text-center sm:text-left">
                    {unit}
                </span>
            )}
            {!showFeedback && (
                <button
                    type="submit"
                    disabled={!value.trim()}
                    className="px-6 py-3 bg-amber-700 hover:bg-amber-800 disabled:bg-stone-300 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
                >
                    Check
                </button>
            )}
        </form>
    );
}

function ShortAnswer({ showFeedback, onSubmit, sampleAnswer, keyPoints }) {
    const [value, setValue] = useState('');

    function handleSubmit(e) {
        e.preventDefault();
        if (value.trim() && !showFeedback) onSubmit(value.trim());
    }

    return (
        <div>
            <form onSubmit={handleSubmit}>
                <textarea
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    disabled={showFeedback}
                    placeholder="Type your answer..."
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-stone-300 rounded-lg text-base leading-relaxed disabled:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-y"
                />
                {!showFeedback && (
                    <button
                        type="submit"
                        disabled={!value.trim()}
                        className="mt-3 px-6 py-3 bg-amber-700 hover:bg-amber-800 disabled:bg-stone-300 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
                    >
                        Submit
                    </button>
                )}
            </form>

            {showFeedback && (
                <div className="mt-4">
                    <p className="text-sm font-semibold text-stone-700 mb-1">Sample answer:</p>
                    <p className="text-sm text-stone-700 italic leading-relaxed mb-3">{sampleAnswer}</p>
                    <p className="text-xs text-stone-500 mb-1">Key points to include:</p>
                    <div className="flex flex-wrap gap-2">
                        {keyPoints.map((point, i) => (
                            <span key={i} className="px-2 py-1 bg-stone-100 text-stone-700 text-xs rounded-md">
                                {point}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function ClozeInput({ blanks, showFeedback, onSubmit }) {
    const [selections, setSelections] = useState(Array(blanks.length).fill(null));

    function setSelection(blankIndex, optionIndex) {
        setSelections(prev => {
            const next = [...prev];
            next[blankIndex] = optionIndex;
            return next;
        });
    }

    function handleSubmit() {
        if (selections.every(s => s !== null) && !showFeedback) {
            onSubmit(selections);
        }
    }

    const allChosen = selections.every(s => s !== null);

    return (
        <div className="space-y-4">
            {blanks.map((blank, bi) => {
                const accept = [blank.correctIndex, ...(blank.accept || [])];
                return (
                    <div key={blank.id}>
                        <p className="text-xs font-semibold text-stone-700 mb-2">
                            Blank {bi + 1}
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {blank.options.map((opt, oi) => {
                                let cls = 'bg-white border-stone-300 text-stone-800 hover:bg-stone-50';
                                if (showFeedback) {
                                    if (accept.includes(oi)) {
                                        cls = 'bg-emerald-50 border-emerald-500 text-emerald-900';
                                    } else if (selections[bi] === oi) {
                                        cls = 'bg-rose-50 border-rose-500 text-rose-900';
                                    } else {
                                        cls = 'bg-stone-50 border-stone-200 text-stone-500';
                                    }
                                } else if (selections[bi] === oi) {
                                    cls = 'bg-amber-50 border-amber-500 text-amber-900';
                                }
                                return (
                                    <button
                                        key={oi}
                                        onClick={() => !showFeedback && setSelection(bi, oi)}
                                        disabled={showFeedback}
                                        className={`px-3 py-2 border-2 rounded-md text-sm font-medium transition-colors disabled:cursor-default ${cls}`}
                                    >
                                        {opt}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );
            })}

            {!showFeedback && (
                <button
                    onClick={handleSubmit}
                    disabled={!allChosen}
                    className="w-full px-6 py-3 bg-amber-700 hover:bg-amber-800 disabled:bg-stone-300 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
                >
                    Check answers
                </button>
            )}
        </div>
    );
}

// ──────────────────────────────────────────────────────────────────────
// Feedback panel
// ──────────────────────────────────────────────────────────────────────
function FeedbackPanel({ type, isCorrect, explanation }) {
    if (type === 'short') {
        return (
            <div className="mt-6 p-4 rounded-lg border border-sky-300 bg-sky-50">
                <p className="font-semibold text-sky-900 mb-1">Review your answer</p>
                <p className="text-sm text-stone-700 leading-relaxed">{explanation}</p>
            </div>
        );
    }

    const bg = isCorrect ? 'bg-emerald-50 border-emerald-300' : 'bg-rose-50 border-rose-300';
    const heading = isCorrect ? 'text-emerald-800' : 'text-rose-800';
    const label = isCorrect ? 'Correct!' : 'Not quite.';

    return (
        <div className={`mt-6 p-4 rounded-lg border ${bg}`}>
            <p className={`font-semibold mb-1 ${heading}`}>{label}</p>
            <p className="text-sm text-stone-700 leading-relaxed">{explanation}</p>
        </div>
    );
}

// ──────────────────────────────────────────────────────────────────────
// Results screen
// ──────────────────────────────────────────────────────────────────────
function ResultsScreen({ responses, questions, onRestart }) {
    const scored = responses.filter(r => r.correct !== null);
    const correctCount = scored.filter(r => r.correct).length;
    const totalScored = scored.length;
    const shortCount = responses.filter(r => r.correct === null).length;
    const percentage = totalScored > 0 ? Math.round((correctCount / totalScored) * 100) : 0;

    const scoreColor = percentage >= 80 ? 'text-emerald-700 border-emerald-500'
        : percentage >= 60 ? 'text-amber-700 border-amber-500'
        : 'text-rose-700 border-rose-500';

    // Section breakdown
    const sectionRollup = useMemo(() => {
        const out = {};
        questions.forEach((q, i) => {
            const r = responses[i];
            if (!out[q.section]) out[q.section] = { total: 0, correct: 0, selfAssessed: 0 };
            out[q.section].total++;
            if (r?.correct === true) out[q.section].correct++;
            if (r?.correct === null) out[q.section].selfAssessed++;
        });
        return Object.entries(out);
    }, [responses, questions]);

    return (
        <div className="min-h-screen bg-stone-50 py-8 px-4 sm:px-6">
            <div className="max-w-2xl mx-auto bg-white border border-stone-200 rounded-xl shadow-sm p-6 sm:p-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 text-center mb-2">
                    Assessment complete
                </h2>
                <p className="text-center text-stone-500 text-sm mb-6">
                    Digital Audio · 2.4 / 2.5 / 2.3
                </p>

                {/* Score circle */}
                <div className="flex flex-col items-center mb-8">
                    <div className={`w-28 h-28 rounded-full border-4 flex items-center justify-center ${scoreColor}`}>
                        <span className="text-3xl font-bold">{percentage}%</span>
                    </div>
                    <p className="mt-3 text-stone-700 text-sm">
                        {correctCount} of {totalScored} auto-scored questions correct
                        {shortCount > 0 && ` · ${shortCount} self-assessed`}
                    </p>
                </div>

                {/* Per-section breakdown */}
                <div className="mb-8">
                    <h3 className="text-base font-semibold text-stone-900 mb-3">By section</h3>
                    <div className="space-y-2">
                        {sectionRollup.map(([section, stats]) => {
                            const scoreable = stats.total - stats.selfAssessed;
                            const pct = scoreable > 0 ? Math.round((stats.correct / scoreable) * 100) : null;
                            return (
                                <div key={section} className="flex items-center justify-between bg-stone-50 rounded-md px-3 py-2 text-sm">
                                    <span className="text-stone-700">{section}</span>
                                    <span className="font-mono text-stone-900 font-semibold">
                                        {pct !== null ? `${stats.correct}/${scoreable}` : `${stats.total} reviewed`}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Per-question breakdown */}
                <div className="mb-8">
                    <h3 className="text-base font-semibold text-stone-900 mb-3">Question breakdown</h3>
                    <div className="space-y-2">
                        {questions.map((q, i) => {
                            const r = responses[i];
                            const icon = r?.correct === true ? '✓' : r?.correct === false ? '✗' : '—';
                            const colour = r?.correct === true ? 'bg-emerald-100 text-emerald-700'
                                : r?.correct === false ? 'bg-rose-100 text-rose-700'
                                : 'bg-sky-100 text-sky-700';
                            return (
                                <div key={q.id} className="flex items-center gap-3 px-3 py-2 bg-stone-50 rounded-md text-sm">
                                    <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-bold flex-shrink-0 ${colour}`}>
                                        {icon}
                                    </span>
                                    <span className="flex-1 text-stone-700">
                                        {q.question.length > 80 ? q.question.slice(0, 80) + '…' : q.question}
                                    </span>
                                    <span className="text-xs uppercase tracking-wide text-stone-500">
                                        {q.type}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <button
                    onClick={onRestart}
                    className="w-full py-3 px-6 bg-amber-700 hover:bg-amber-800 text-white rounded-lg font-semibold transition-colors"
                >
                    Try again
                </button>
            </div>
        </div>
    );
}
