'use client';

import React, { useState, useRef, useEffect } from 'react';
import { theme, typography, borderRadius, spacing, transitions } from '@/lib/theme';

// ============================================
// CONTROL DEFINITIONS
// ============================================
const EQ_CONTROLS = [
    {
        id: 'frequency',
        label: 'Frequency Control',
        shortLabel: 'FREQ',
        x: 100,
        color: '#22d3ee',
        question: 'What does the Frequency control do on this EQ band?',
        maxMarks: 4,
    },
    {
        id: 'gain',
        label: 'Gain Control',
        shortLabel: 'GAIN',
        x: 220,
        color: '#f97316',
        question: 'Explain the purpose of the Gain control.',
        maxMarks: 4,
    },
    {
        id: 'q',
        label: 'Q (Bandwidth) Control',
        shortLabel: 'Q',
        x: 340,
        color: '#C99F44',
        question: 'What does Q control? How does high Q differ from low Q?',
        maxMarks: 5,
    },
    {
        id: 'output',
        label: 'Output Level Control',
        shortLabel: 'OUT',
        x: 460,
        color: '#10b981',
        question: 'Why might you adjust the output level after EQ processing?',
        maxMarks: 2,
    },
];

// ============================================
// LABEL WITH LINE COMPONENT
// ============================================
const LabelWithLine = ({ x, label, number, color, isAnswered, isActive, onClick }) => {
    const labelWidth = 140;

    return (
        <g onClick={onClick} style={{ cursor: 'pointer' }}>
            {/* Label box */}
            <rect
                x={x - labelWidth/2}
                y={0}
                width={labelWidth}
                height={44}
                rx={8}
                fill={isActive ? color : isAnswered ? '#22c55e' : '#1f2937'}
                stroke={isActive ? color : isAnswered ? '#22c55e' : '#374151'}
                strokeWidth={isActive ? 2 : 1}
            />

            {/* Number circle */}
            <circle
                cx={x - labelWidth/2 + 18}
                cy={22}
                r={12}
                fill={isActive || isAnswered ? 'rgba(255,255,255,0.2)' : '#374151'}
            />
            <text
                x={x - labelWidth/2 + 18}
                y={27}
                textAnchor="middle"
                fontSize="12"
                fill="white"
                fontWeight="bold"
            >
                {isAnswered ? '✓' : number}
            </text>

            {/* Label text */}
            <text
                x={x + 8}
                y={26}
                textAnchor="middle"
                fontSize="11"
                fill="white"
                fontWeight="500"
            >
                {label}
            </text>

            {/* Vertical line down */}
            <line
                x1={x}
                y1={44}
                x2={x}
                y2={70}
                stroke={isActive ? color : isAnswered ? '#22c55e' : '#4b5563'}
                strokeWidth={2}
            />

            {/* Bracket bottom */}
            <path
                d={`M ${x - 20} 70 L ${x} 70 L ${x} 80 M ${x} 70 L ${x + 20} 70`}
                stroke={isActive ? color : isAnswered ? '#22c55e' : '#4b5563'}
                strokeWidth={2}
                fill="none"
            />
        </g>
    );
};

// ============================================
// SIMPLE KNOB COMPONENT
// ============================================
const SimpleKnob = ({ x, y, label, color, isAnswered, isActive, onClick }) => {
    return (
        <g onClick={onClick} style={{ cursor: 'pointer' }}>
            {/* Knob shadow */}
            <ellipse
                cx={x + 2}
                cy={y + 2}
                rx={28}
                ry={28}
                fill="rgba(0,0,0,0.3)"
            />

            {/* Knob body */}
            <circle
                cx={x}
                cy={y}
                r={28}
                fill="#1f2937"
                stroke={isActive ? color : isAnswered ? '#22c55e' : '#374151'}
                strokeWidth={isActive ? 3 : 2}
            />

            {/* Inner ring */}
            <circle
                cx={x}
                cy={y}
                r={20}
                fill="#111827"
            />

            {/* Colored accent */}
            <circle
                cx={x}
                cy={y}
                r={24}
                fill="none"
                stroke={color}
                strokeWidth={3}
                strokeDasharray="40 200"
                strokeDashoffset={-20}
                opacity={0.6}
            />

            {/* Pointer */}
            <line
                x1={x}
                y1={y}
                x2={x}
                y2={y - 18}
                stroke={color}
                strokeWidth={3}
                strokeLinecap="round"
            />

            {/* Label below */}
            <text
                x={x}
                y={y + 48}
                textAnchor="middle"
                fontSize="11"
                fill="#9ca3af"
                fontWeight="600"
            >
                {label}
            </text>
        </g>
    );
};

// ============================================
// INLINE INPUT POPOVER
// ============================================
const InlinePopover = ({ control, number, response, onResponseChange, onSave, onClose }) => {
    const inputRef = useRef(null);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSave();
        }
        if (e.key === 'Escape') {
            onClose();
        }
    };

    if (!control) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.3)',
                    zIndex: 998,
                }}
            />

            {/* Popover - centered */}
            <div
                style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 999,
                    width: '90%',
                    maxWidth: '480px',
                }}
            >
                {/* Container */}
                <div
                    style={{
                        background: '#1f2937',
                        borderRadius: '16px',
                        padding: '20px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                        border: `2px solid ${control.color}`,
                    }}
                >
                    {/* Header */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginBottom: '16px',
                        }}
                    >
                        <div
                            style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: control.color,
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '16px',
                                fontWeight: '700',
                            }}
                        >
                            {number}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ color: '#f3f4f6', fontWeight: '600', fontSize: '15px' }}>
                                {control.label}
                            </div>
                            <div style={{ color: '#9ca3af', fontSize: '12px' }}>
                                {control.maxMarks} marks available
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#6b7280',
                                fontSize: '24px',
                                cursor: 'pointer',
                                padding: '4px',
                            }}
                        >
                            ×
                        </button>
                    </div>

                    {/* Question */}
                    <div
                        style={{
                            color: '#e5e7eb',
                            fontSize: '14px',
                            marginBottom: '16px',
                            lineHeight: '1.5',
                        }}
                    >
                        {control.question}
                    </div>

                    {/* Input + Save row */}
                    <div
                        style={{
                            display: 'flex',
                            gap: '10px',
                            alignItems: 'stretch',
                        }}
                    >
                        <textarea
                            ref={inputRef}
                            value={response}
                            onChange={(e) => onResponseChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type your answer..."
                            rows={2}
                            style={{
                                flex: 1,
                                background: '#111827',
                                border: '1px solid #374151',
                                borderRadius: '10px',
                                padding: '12px',
                                color: '#f3f4f6',
                                fontSize: '14px',
                                fontFamily: 'inherit',
                                resize: 'none',
                                outline: 'none',
                            }}
                        />
                        <button
                            onClick={onSave}
                            disabled={!response.trim()}
                            style={{
                                background: response.trim() ? '#3b82f6' : '#374151',
                                border: 'none',
                                borderRadius: '10px',
                                padding: '12px 24px',
                                color: response.trim() ? 'white' : '#6b7280',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: response.trim() ? 'pointer' : 'not-allowed',
                                transition: 'all 0.15s ease',
                            }}
                        >
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

// ============================================
// MAIN COMPONENT
// ============================================
export default function EQAssessmentPrototype() {
    const t = theme.light;
    const [activeControl, setActiveControl] = useState(null);
    const [activeIndex, setActiveIndex] = useState(null);
    const [responses, setResponses] = useState({});
    const [currentResponse, setCurrentResponse] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const answeredCount = Object.keys(responses).filter(k => responses[k]?.trim()).length;
    const totalControls = EQ_CONTROLS.length;

    const handleControlClick = (control, index) => {
        setActiveControl(control);
        setActiveIndex(index);
        setCurrentResponse(responses[control.id] || '');
    };

    const handleSaveAnswer = () => {
        if (activeControl && currentResponse.trim()) {
            setResponses(prev => ({
                ...prev,
                [activeControl.id]: currentResponse.trim()
            }));
            setActiveControl(null);
            setActiveIndex(null);
            setCurrentResponse('');
        }
    };

    const handleSubmitAll = () => {
        const submission = {
            timestamp: new Date().toISOString(),
            visual_type: 'parametric_eq',
            responses: EQ_CONTROLS.map(control => ({
                control_id: control.id,
                control_label: control.label,
                question: control.question,
                response: responses[control.id] || '',
                max_marks: control.maxMarks,
            })),
            total_possible_marks: EQ_CONTROLS.reduce((sum, c) => sum + c.maxMarks, 0),
        };

        console.log('=== SUBMISSION DATA ===');
        console.log(JSON.stringify(submission, null, 2));
        setSubmitted(true);
    };

    return (
        <div
            style={{
                maxWidth: '900px',
                margin: '0 auto',
                padding: spacing[6],
                fontFamily: typography.fontFamily,
            }}
        >
            {/* Hero with video background */}
            <div style={{
                position: 'relative',
                overflow: 'hidden',
                width: '100vw',
                marginLeft: 'calc(-50vw + 50%)',
                marginBottom: spacing[6],
                minHeight: '180px',
            }}>
                <video
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
                    src="/eq-hero.mp4"
                />
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to bottom, rgba(26,26,46,0.4) 0%, rgba(26,26,46,0.7) 100%)',
                }} />
                <div style={{
                    position: 'relative',
                    textAlign: 'center',
                    padding: `${spacing[8]} ${spacing[6]} ${spacing[6]}`,
                }}>
                    <h1 style={{
                        fontSize: typography.size['2xl'],
                        fontWeight: typography.weight.bold,
                        color: '#ffffff',
                        marginBottom: spacing[2],
                        textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    }}>
                        Parametric EQ Assessment
                    </h1>
                    <p style={{
                        fontSize: typography.size.base,
                        color: 'rgba(255,255,255,0.85)',
                        textShadow: '0 1px 4px rgba(0,0,0,0.2)',
                    }}>
                        Click on each labelled control to answer the question
                    </p>
                </div>
            </div>

            {/* Progress */}
            <div
                style={{
                    background: t.bg.secondary,
                    borderRadius: borderRadius.xl,
                    padding: spacing[4],
                    marginBottom: spacing[6],
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <div>
                    <span style={{ fontSize: typography.size.sm, color: t.text.tertiary }}>Progress: </span>
                    <span style={{ fontSize: typography.size.lg, fontWeight: typography.weight.semibold, color: t.text.primary }}>
                        {answeredCount}/{totalControls}
                    </span>
                </div>
                <div
                    style={{
                        width: '200px',
                        height: '8px',
                        background: t.bg.tertiary,
                        borderRadius: borderRadius.full,
                        overflow: 'hidden',
                    }}
                >
                    <div
                        style={{
                            width: `${(answeredCount / totalControls) * 100}%`,
                            height: '100%',
                            background: answeredCount === totalControls ? '#22c55e' : '#3b82f6',
                            transition: 'width 0.3s ease',
                        }}
                    />
                </div>
            </div>

            {/* EQ Visual with Labels */}
            <div
                style={{
                    background: '#f8fafc',
                    borderRadius: '16px',
                    padding: '24px',
                    marginBottom: spacing[6],
                    border: '1px solid #e2e8f0',
                }}
            >
                <svg width="100%" height="320" viewBox="0 0 560 320">
                    {/* Labels with lines at top */}
                    {EQ_CONTROLS.map((control, index) => (
                        <LabelWithLine
                            key={control.id}
                            x={control.x}
                            label={control.label}
                            number={index + 1}
                            color={control.color}
                            isAnswered={!!responses[control.id]?.trim()}
                            isActive={activeControl?.id === control.id}
                            onClick={() => handleControlClick(control, index)}
                        />
                    ))}

                    {/* EQ Unit body */}
                    <rect
                        x={20}
                        y={100}
                        width={520}
                        height={200}
                        rx={12}
                        fill="linear-gradient(180deg, #e5e7eb 0%, #d1d5db 100%)"
                        stroke="#9ca3af"
                        strokeWidth={1}
                    />

                    {/* Gradient overlay for metallic look */}
                    <defs>
                        <linearGradient id="metalGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f3f4f6" />
                            <stop offset="50%" stopColor="#e5e7eb" />
                            <stop offset="100%" stopColor="#d1d5db" />
                        </linearGradient>
                    </defs>
                    <rect
                        x={20}
                        y={100}
                        width={520}
                        height={200}
                        rx={12}
                        fill="url(#metalGradient)"
                    />

                    {/* Top edge highlight */}
                    <line
                        x1={30}
                        y1={102}
                        x2={530}
                        y2={102}
                        stroke="rgba(255,255,255,0.6)"
                        strokeWidth={2}
                    />

                    {/* Display screen */}
                    <rect
                        x={40}
                        y={120}
                        width={200}
                        height={60}
                        rx={4}
                        fill="#0f172a"
                    />
                    <text x={140} y={145} textAnchor="middle" fontSize="10" fill="#3b82f6">PARAMETRIC EQ</text>
                    <text x={140} y={165} textAnchor="middle" fontSize="14" fill="#22d3ee" fontWeight="600">BAND 1</text>

                    {/* Knobs */}
                    {EQ_CONTROLS.map((control, index) => (
                        <SimpleKnob
                            key={control.id}
                            x={control.x}
                            y={220}
                            label={control.shortLabel}
                            color={control.color}
                            isAnswered={!!responses[control.id]?.trim()}
                            isActive={activeControl?.id === control.id}
                            onClick={() => handleControlClick(control, index)}
                        />
                    ))}

                    {/* Brand */}
                    <text x={500} y={290} textAnchor="end" fontSize="12" fill="#6b7280" fontWeight="600">EQ-4</text>
                </svg>
            </div>

            {/* Submit Section */}
            {!submitted ? (
                <div style={{ textAlign: 'center' }}>
                    <button
                        onClick={handleSubmitAll}
                        disabled={answeredCount === 0}
                        style={{
                            background: answeredCount === totalControls ? '#22c55e' : answeredCount > 0 ? '#3b82f6' : t.bg.tertiary,
                            border: 'none',
                            borderRadius: borderRadius.xl,
                            padding: `${spacing[4]} ${spacing[8]}`,
                            fontSize: typography.size.lg,
                            fontWeight: typography.weight.semibold,
                            color: answeredCount > 0 ? 'white' : t.text.tertiary,
                            cursor: answeredCount > 0 ? 'pointer' : 'not-allowed',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        {answeredCount === totalControls
                            ? 'Submit All Answers'
                            : answeredCount > 0
                                ? `Submit (${answeredCount}/${totalControls} answered)`
                                : 'Answer at least one question'}
                    </button>
                    <p style={{ fontSize: typography.size.sm, color: t.text.tertiary, marginTop: spacing[2] }}>
                        Total: {EQ_CONTROLS.reduce((sum, c) => sum + c.maxMarks, 0)} marks
                    </p>
                </div>
            ) : (
                <div
                    style={{
                        background: '#22c55e15',
                        border: '2px solid #22c55e',
                        borderRadius: borderRadius.xl,
                        padding: spacing[6],
                        textAlign: 'center',
                    }}
                >
                    <h3 style={{ fontSize: typography.size.xl, fontWeight: typography.weight.semibold, color: '#22c55e', marginBottom: spacing[2] }}>
                        Submitted
                    </h3>
                    <p style={{ color: t.text.secondary }}>
                        Check the browser console to see the data structure.
                    </p>
                </div>
            )}

            {/* Input Popover */}
            {activeControl && (
                <InlinePopover
                    control={activeControl}
                    number={activeIndex + 1}
                    response={currentResponse}
                    onResponseChange={setCurrentResponse}
                    onSave={handleSaveAnswer}
                    onClose={() => {
                        setActiveControl(null);
                        setActiveIndex(null);
                        setCurrentResponse('');
                    }}
                />
            )}
        </div>
    );
}
