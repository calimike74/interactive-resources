'use client';

import { useState, useEffect } from 'react';
import { getTopicConfidenceReport } from '@/lib/learn/confidence-persistence';

const TOPICS = [
    { id: 'synthesis', label: 'Subtractive Synthesis', color: '#1a1a6e' },
    { id: 'eq', label: 'Equalisation', color: '#f97316' },
    { id: 'compression', label: 'Compression', color: '#e85d75' },
    { id: 'delay', label: 'Delay', color: '#14b8a6' },
];

export default function ConfidenceDashboard() {
    const [activeTopic, setActiveTopic] = useState('synthesis');
    const [report, setReport] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        getTopicConfidenceReport(activeTopic).then((data) => {
            // Sort: most confused first
            data.sort((a, b) => b.confused - a.confused || b.totalStudents - a.totalStudents);
            setReport(data);
            setLoading(false);
        });
    }, [activeTopic]);

    const topic = TOPICS.find((t) => t.id === activeTopic);
    const totalStudents = new Set(report.flatMap((r) => Array(r.totalStudents).fill(0).map((_, i) => i))).size;
    const totalRatings = report.reduce((sum, r) => sum + r.gotIt + r.confused, 0);

    return (
        <div style={{
            minHeight: '100vh',
            background: '#f5f4f2',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}>
            <header style={{
                padding: '2rem 1.5rem 1.5rem',
                background: 'white',
                borderBottom: '1px solid #E5E7EB',
            }}>
                <div style={{ maxWidth: '960px', margin: '0 auto' }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                        Teacher View
                    </p>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1A1A2E', margin: 0 }}>
                        Term Confidence
                    </h1>
                    <p style={{ fontSize: '0.9375rem', color: '#6B7280', marginTop: '0.5rem' }}>
                        See which key terms your students understand and which need more support.
                    </p>

                    {/* Topic tabs */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '1.25rem' }}>
                        {TOPICS.map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setActiveTopic(t.id)}
                                style={{
                                    padding: '6px 16px',
                                    borderRadius: '9999px',
                                    fontSize: '0.8125rem',
                                    fontWeight: 500,
                                    border: activeTopic === t.id ? `2px solid ${t.color}` : '2px solid #E5E7EB',
                                    background: activeTopic === t.id ? t.color + '10' : 'white',
                                    color: activeTopic === t.id ? t.color : '#6B7280',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                }}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <main style={{ maxWidth: '960px', margin: '0 auto', padding: '1.5rem' }}>
                {/* Summary stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '1.5rem' }}>
                    <StatCard label="Total ratings" value={totalRatings} color="#6B7280" />
                    <StatCard
                        label="Terms with confusion"
                        value={report.filter((r) => r.confused > 0).length}
                        color="#D97706"
                    />
                    <StatCard
                        label="Terms fully understood"
                        value={report.filter((r) => r.confused === 0 && r.gotIt > 0).length}
                        color="#059669"
                    />
                </div>

                {loading ? (
                    <p style={{ color: '#9CA3AF', textAlign: 'center', padding: '3rem 0' }}>Loading...</p>
                ) : report.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '4rem 2rem',
                        background: 'white',
                        borderRadius: '12px',
                        border: '1px solid #E5E7EB',
                    }}>
                        <p style={{ fontSize: '1.125rem', color: '#374151', fontWeight: 500 }}>No confidence data yet</p>
                        <p style={{ fontSize: '0.875rem', color: '#9CA3AF', marginTop: '0.5rem' }}>
                            Students will see "I get it" and "Still confused" buttons when they expand key terms.
                            <br />Data will appear here as they interact with the content.
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {report.map((term) => (
                            <TermRow key={term.term} term={term} topicColor={topic.color} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

function StatCard({ label, value, color }) {
    return (
        <div style={{
            background: 'white',
            borderRadius: '10px',
            border: '1px solid #E5E7EB',
            padding: '16px 20px',
        }}>
            <p style={{ fontSize: '0.75rem', color: '#9CA3AF', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                {label}
            </p>
            <p style={{ fontSize: '1.75rem', fontWeight: 700, color, marginTop: '4px' }}>
                {value}
            </p>
        </div>
    );
}

function TermRow({ term, topicColor }) {
    const total = term.gotIt + term.confused;
    const gotItPct = total > 0 ? Math.round((term.gotIt / total) * 100) : 0;
    const confusedPct = total > 0 ? Math.round((term.confused / total) * 100) : 0;

    // Determine urgency
    const isUrgent = term.confused > term.gotIt;
    const isGood = term.confused === 0 && term.gotIt > 0;

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: '16px',
            alignItems: 'center',
            background: 'white',
            borderRadius: '10px',
            border: isUrgent ? '1px solid #FEF3C7' : '1px solid #E5E7EB',
            padding: '14px 20px',
            borderLeft: isUrgent ? '4px solid #F59E0B' : isGood ? '4px solid #10B981' : '4px solid #E5E7EB',
        }}>
            <div>
                <p style={{
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    color: '#1A1A2E',
                    marginBottom: '6px',
                }}>
                    {term.term}
                </p>

                {/* Stacked bar */}
                <div style={{ display: 'flex', height: '6px', borderRadius: '3px', overflow: 'hidden', background: '#F3F4F6' }}>
                    {gotItPct > 0 && (
                        <div style={{ width: `${gotItPct}%`, background: '#10B981', transition: 'width 0.3s ease' }} />
                    )}
                    {confusedPct > 0 && (
                        <div style={{ width: `${confusedPct}%`, background: '#F59E0B', transition: 'width 0.3s ease' }} />
                    )}
                </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', whiteSpace: 'nowrap' }}>
                <span style={{ fontSize: '0.8125rem', color: '#059669', fontWeight: 500 }}>
                    {term.gotIt} &#10003;
                </span>
                <span style={{ fontSize: '0.8125rem', color: '#D97706', fontWeight: 500 }}>
                    {term.confused} ?
                </span>
            </div>
        </div>
    );
}
