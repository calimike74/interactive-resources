'use client';

import { useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getTopicData } from '@/lib/read-then-quiz/topics';
import { theme, typography, spacing, borderRadius, transitions } from '@/lib/theme';
import ReadingPhase from './ReadingPhase';
import OpenEndedPhase from './OpenEndedPhase';
import MCQPhase from './MCQPhase';
import ResultsPhase from './ResultsPhase';

const t = theme.light;

const SCAFFOLD_LEVELS = [
    { id: 'full', label: 'Full Support', description: 'Key terms, sentence starters, hints' },
    { id: 'medium', label: 'Medium', description: 'Key terms and sentence starters' },
    { id: 'minimal', label: 'Minimal', description: 'Questions only' },
    { id: 'independent', label: 'Independent', description: 'No scaffolds, deferred feedback' },
];

export default function ReadThenQuiz() {
    const { resourceId } = useParams();
    const topic = getTopicData(resourceId);

    const [phase, setPhase] = useState('entry');
    const [studentName, setStudentName] = useState('');
    const [scaffoldLevel, setScaffoldLevel] = useState('full');
    const [results, setResults] = useState({});
    const startTimeRef = useRef(null);

    const handleStartReading = useCallback(() => {
        startTimeRef.current = Date.now();
        setPhase('reading');
    }, []);

    const handleReadingComplete = useCallback(({ readingTimeSeconds }) => {
        setResults(prev => ({ ...prev, readingTimeSeconds }));
        setPhase('open-ended');
    }, []);

    const handleOpenEndedComplete = useCallback(({ openEndedResponse, wordCount }) => {
        setResults(prev => ({ ...prev, openEndedResponse, wordCount }));
        setPhase('mcq');
    }, []);

    const handleMCQComplete = useCallback(async ({ mcqAnswers, mcqScore, mcqTotal }) => {
        const totalTimeSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
        const finalResults = {
            ...results,
            mcqAnswers,
            mcqScore,
            mcqTotal,
            totalTimeSeconds,
        };
        setResults(finalResults);
        setPhase('results');

        await supabase.from('read_then_quiz_responses').insert({
            topic_id: topic.id,
            student_name: studentName.trim(),
            scaffold_level: scaffoldLevel,
            open_ended_response: finalResults.openEndedResponse,
            mcq_answers: mcqAnswers,
            mcq_score: mcqScore,
            mcq_total: mcqTotal,
            reading_time_seconds: finalResults.readingTimeSeconds,
            total_time_seconds: totalTimeSeconds,
        });
    }, [results, topic, studentName, scaffoldLevel]);

    if (!topic) {
        return (
            <div style={{ padding: spacing[8], textAlign: 'center', color: t.text.secondary }}>
                Topic data not found for this resource.
            </div>
        );
    }

    if (phase === 'entry') {
        const canStart = studentName.trim().length > 0;
        return (
            <div style={{ maxWidth: '480px', margin: '0 auto', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: spacing[3] }}>📖</div>
                <h2 style={{
                    fontSize: typography.size['2xl'],
                    fontWeight: typography.weight.bold,
                    color: t.text.primary,
                    marginBottom: spacing[2],
                }}>
                    Read &amp; Recall
                </h2>
                <p style={{
                    color: t.text.secondary,
                    fontSize: typography.size.sm,
                    lineHeight: typography.lineHeight.relaxed,
                    marginBottom: spacing[6],
                }}>
                    You&apos;ll read a short passage about {topic.title.toLowerCase()}, then answer questions from memory. The passage will disappear before the questions appear — so read carefully!
                </p>

                <div style={{
                    display: 'flex',
                    gap: spacing[3],
                    justifyContent: 'center',
                    marginBottom: spacing[6],
                }}>
                    <div style={{
                        background: t.bg.tertiary,
                        borderRadius: borderRadius.lg,
                        padding: `${spacing[3]} ${spacing[4]}`,
                        textAlign: 'center',
                    }}>
                        <div style={{ color: t.accent.primary, fontSize: typography.size.xs }}>Reading</div>
                        <div style={{ color: t.text.primary, fontWeight: typography.weight.semibold }}>
                            ~{Math.ceil(topic.passage.text.split(/\s+/).length / 200)} min
                        </div>
                    </div>
                    <div style={{
                        background: t.bg.tertiary,
                        borderRadius: borderRadius.lg,
                        padding: `${spacing[3]} ${spacing[4]}`,
                        textAlign: 'center',
                    }}>
                        <div style={{ color: t.accent.primary, fontSize: typography.size.xs }}>Questions</div>
                        <div style={{ color: t.text.primary, fontWeight: typography.weight.semibold }}>
                            1 written + {topic.mcq.length} MCQ
                        </div>
                    </div>
                </div>

                <div style={{ textAlign: 'left', marginBottom: spacing[4] }}>
                    <label style={{
                        display: 'block',
                        color: t.text.secondary,
                        fontSize: typography.size.sm,
                        marginBottom: spacing[2],
                    }}>
                        Your name
                    </label>
                    <input
                        type="text"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        placeholder="Enter your name..."
                        style={{
                            width: '100%',
                            padding: `${spacing[3]} ${spacing[4]}`,
                            borderRadius: borderRadius.lg,
                            border: `1px solid ${t.border.medium}`,
                            background: t.bg.primary,
                            color: t.text.primary,
                            fontSize: typography.size.base,
                            fontFamily: typography.fontFamily,
                            outline: 'none',
                            boxSizing: 'border-box',
                        }}
                    />
                </div>

                <div style={{ textAlign: 'left', marginBottom: spacing[6] }}>
                    <label style={{
                        display: 'block',
                        color: t.text.secondary,
                        fontSize: typography.size.sm,
                        marginBottom: spacing[2],
                    }}>
                        Support level
                    </label>
                    <div style={{ display: 'flex', gap: spacing[2], flexWrap: 'wrap' }}>
                        {SCAFFOLD_LEVELS.map(level => (
                            <button
                                key={level.id}
                                onClick={() => setScaffoldLevel(level.id)}
                                title={level.description}
                                style={{
                                    padding: `${spacing[2]} ${spacing[4]}`,
                                    borderRadius: borderRadius.lg,
                                    border: scaffoldLevel === level.id ? 'none' : `1px solid ${t.border.medium}`,
                                    background: scaffoldLevel === level.id ? t.accent.primary : t.bg.primary,
                                    color: scaffoldLevel === level.id ? 'white' : t.text.secondary,
                                    fontSize: typography.size.sm,
                                    fontWeight: typography.weight.medium,
                                    cursor: 'pointer',
                                    fontFamily: typography.fontFamily,
                                    transition: `all ${transitions.fast} ${transitions.easing}`,
                                }}
                            >
                                {level.label}
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    onClick={handleStartReading}
                    disabled={!canStart}
                    style={{
                        padding: `${spacing[3]} ${spacing[8]}`,
                        borderRadius: borderRadius.lg,
                        border: 'none',
                        background: canStart ? t.accent.primary : t.border.medium,
                        color: canStart ? 'white' : t.text.tertiary,
                        fontSize: typography.size.base,
                        fontWeight: typography.weight.semibold,
                        cursor: canStart ? 'pointer' : 'not-allowed',
                        fontFamily: typography.fontFamily,
                        transition: `all ${transitions.normal} ${transitions.easing}`,
                    }}
                >
                    Start Reading
                </button>
            </div>
        );
    }

    if (phase === 'reading') {
        return (
            <ReadingPhase
                passage={topic.passage}
                scaffoldLevel={scaffoldLevel}
                onComplete={handleReadingComplete}
            />
        );
    }

    if (phase === 'open-ended') {
        return (
            <OpenEndedPhase
                openEnded={topic.openEnded}
                scaffoldLevel={scaffoldLevel}
                onComplete={handleOpenEndedComplete}
            />
        );
    }

    if (phase === 'mcq') {
        return (
            <MCQPhase
                questions={topic.mcq}
                scaffoldLevel={scaffoldLevel}
                questionOffset={1}
                onComplete={handleMCQComplete}
            />
        );
    }

    if (phase === 'results') {
        return (
            <ResultsPhase
                results={results}
                questions={topic.mcq}
                scaffoldLevel={scaffoldLevel}
            />
        );
    }

    return null;
}
