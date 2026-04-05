'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import LearnTopicRow from './LearnTopicRow';
import LearnSpineLayout from './LearnSpineLayout';
import { getTopicResponses } from '@/lib/learn/section-persistence';

export default function LearnTopicPage({ topic, parentTopicId }) {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [answeredSections, setAnsweredSections] = useState([]);

    useEffect(() => {
        if (!token) return;
        getTopicResponses(token, topic.id).then((responses) => {
            setAnsweredSections(responses.map(r => r.section_id));
        });
    }, [token, topic.id]);

    return (
        <div style={{
            minHeight: '100vh',
            background: '#f5f4f2',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        }}>
            {/* Header */}
            <header style={{
                padding: '3rem 1.5rem 2.5rem',
                background: 'white',
                borderBottom: '1px solid #E5E7EB',
            }}>
                <div style={{ maxWidth: '960px', margin: '0 auto' }}>
                    <Link href={`/learn/${parentTopicId}`} style={{
                        fontSize: '0.8125rem',
                        color: '#6B7280',
                        textDecoration: 'none',
                    }}>
                        &larr; Back to lessons
                    </Link>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginTop: '0.75rem',
                    }}>
                        <div style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '9999px',
                            background: topic.color + '15',
                            color: topic.color,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                        }}>
                            {topic.subtitle}
                        </div>
                    </div>

                    <h1 style={{
                        fontSize: '2rem',
                        fontWeight: 700,
                        color: '#1A1A2E',
                        marginTop: '0.5rem',
                        lineHeight: 1.2,
                    }}>
                        {topic.title}
                    </h1>
                    <p style={{
                        fontSize: '1.0625rem',
                        color: '#6B7280',
                        marginTop: '0.5rem',
                        lineHeight: 1.5,
                        maxWidth: '640px',
                    }}>
                        {topic.description}
                    </p>

                    <div style={{
                        marginTop: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem',
                    }}>
                        <span style={{ fontSize: '0.8125rem', color: '#9CA3AF' }}>
                            {topic.rows.length} sections
                        </span>
                        <ExpandableHint color={topic.color} />
                    </div>
                </div>
            </header>

            {/* Content rows */}
            {topic.id === 'eq' ? (
                <LearnSpineLayout
                    topic={topic}
                    token={token}
                    answeredSections={answeredSections}
                />
            ) : (
                <main style={{
                    maxWidth: '960px',
                    margin: '0 auto',
                    padding: '1rem 1.5rem 4rem',
                }}>
                    {topic.rows.map((row, i) => (
                        <LearnTopicRow
                            key={row.id}
                            row={row}
                            index={i}
                            topicColor={topic.color}
                            topicId={topic.id}
                            studentToken={token}
                            answeredSections={answeredSections}
                        />
                    ))}
                </main>
            )}
        </div>
    );
}

function ExpandableHint({ color }) {
    const fullText = 'Highlight underlined terms to expand them';
    const [charIdx, setCharIdx] = useState(0);
    const [visible, setVisible] = useState(true);
    const timerRef = useRef(null);

    useEffect(() => {
        // Start typing after a short delay
        const startDelay = setTimeout(() => {
            timerRef.current = setInterval(() => {
                setCharIdx((c) => {
                    if (c >= fullText.length) {
                        clearInterval(timerRef.current);
                        // Fade out after a pause
                        setTimeout(() => setVisible(false), 4000);
                        return c;
                    }
                    return c + 1;
                });
            }, 40);
        }, 800);

        return () => {
            clearTimeout(startDelay);
            clearInterval(timerRef.current);
        };
    }, []);

    return (
        <span style={{
            fontSize: '0.75rem',
            color: '#9CA3AF',
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
            minHeight: '1.2em',
            display: 'inline-flex',
            alignItems: 'center',
            opacity: visible ? 1 : 0,
            transition: 'opacity 1s ease',
        }}>
            {fullText.slice(0, charIdx)}
            {charIdx < fullText.length && (
                <span style={{
                    display: 'inline-block',
                    width: '1.5px',
                    height: '0.9em',
                    background: color,
                    marginLeft: '1px',
                    verticalAlign: 'text-bottom',
                    animation: 'blink 1s step-end infinite',
                }} />
            )}
            <style>{`
                @keyframes blink {
                    50% { opacity: 0; }
                }
            `}</style>
        </span>
    );
}
