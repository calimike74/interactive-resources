'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import NotesPanel from '@/components/learn/NotesPanel';
import VideoCheckpointPlayer from '@/components/learn/VideoCheckpointPlayer';
import AuthGate from '@/app/revise/[topicId]/AuthGate';
import { theme, typography, borderRadius, spacing, editorial as ED } from '@/lib/theme';

const VIDEO_ID = 'adt-1.12';
const YOUTUBE_ID = 'YCJubmiPg5E';

// NOTE: Timestamps below are placeholders evenly spread across the 5:28 runtime.
// Re-watch and adjust each timestamp to land just AFTER the moment the question is answered in the video.
const CHECKPOINTS = [
    {
        id: 'q1-adt-acronym',
        timestamp: 45,
        question: 'What does ADT stand for?',
        options: [
            'Audio Delay Technique',
            'Automatic Double Tracking',
            'Analogue Delay Tape',
            'Augmented Doubling Time',
        ],
        correctIndex: 1,
        explanation: 'ADT = Automatic Double Tracking — a way to simulate the sound of a singer recording the same vocal twice without the singer having to do it.',
    },
    {
        id: 'q2-abbey-road-origin',
        timestamp: 100,
        question: 'Where and by whom was ADT invented in 1966?',
        options: [
            'Sun Studios — Sam Phillips',
            'Motown — Berry Gordy',
            'Abbey Road — Ken Townsend',
            'Decca Studios — George Martin',
        ],
        correctIndex: 2,
        explanation: 'Engineer Ken Townsend developed ADT at Abbey Road in 1966, reportedly because John Lennon disliked the labour of recording his vocals twice.',
    },
    {
        id: 'q3-short-delay-time',
        timestamp: 175,
        question: 'Roughly what delay time does ADT use to create the doubled-vocal effect?',
        options: [
            '1–5 ms',
            '30–50 ms',
            '100–150 ms',
            '250 ms or more',
        ],
        correctIndex: 1,
        explanation: 'ADT uses a short delay (~30–50 ms) — long enough to feel like a separate take, short enough that the brain still fuses it with the original rather than hearing a distinct echo.',
    },
    {
        id: 'q4-chorus-descendant',
        timestamp: 245,
        question: 'Modern ADT plug-ins add slight pitch and timing variation to the delayed copy. Which modern modulation effect is descended directly from ADT?',
        options: [
            'Reverb',
            'Compression',
            'Chorus',
            'Distortion',
        ],
        correctIndex: 2,
        explanation: 'Chorus is essentially ADT with modulation — a short delay whose time is varied by an LFO, producing the same thickening/widening character on a wider scale.',
    },
    {
        id: 'q5-musical-use-case',
        timestamp: 300,
        question: 'What is the main musical purpose of ADT on a vocal?',
        options: [
            'To create a clear, audible echo',
            'To thicken and widen the vocal without an audible echo',
            'To remove sibilance from the vocal',
            'To compress the dynamic range of the vocal',
        ],
        correctIndex: 1,
        explanation: 'ADT thickens and widens the vocal — it sits inside the fusion window, so the listener hears one bigger, fuller voice rather than two separate ones.',
    },
];

export default function ADTVideoOverviewClient() {
    const t = theme.light;
    const [student, setStudent] = useState(null);
    const [authChecked, setAuthChecked] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('revision_token');
        const studentId = localStorage.getItem('revision_student_id');
        const studentName = localStorage.getItem('revision_student_name');
        if (token && studentId && studentName) {
            setStudent({ token, studentId, studentName });
        }
        setAuthChecked(true);
    }, []);

    if (!authChecked) {
        return <div style={{ minHeight: '100vh', background: '#f5f4f2' }} />;
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: '#f5f4f2',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        }}>
            <Breadcrumbs />

            <header style={{
                padding: '3rem 1.5rem 2.5rem',
                background: 'white',
                borderBottom: `1px solid ${t.border.subtle}`,
            }}>
                <div style={{ maxWidth: '960px', margin: '0 auto' }}>
                    <Link href="/learn/delay" style={{
                        fontSize: typography.size.sm,
                        color: t.text.tertiary,
                        textDecoration: 'none',
                    }}>
                        ← Back to Delay
                    </Link>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginTop: '0.75rem',
                        flexWrap: 'wrap',
                    }}>
                        <span style={{
                            fontFamily: ED.mono,
                            fontSize: '11px',
                            fontWeight: 500,
                            letterSpacing: '0.18em',
                            textTransform: 'uppercase',
                            color: ED.inkFade,
                        }}>
                            Topic 1.12 · Video + Checkpoints
                        </span>
                    </div>

                    <h1 style={{
                        fontSize: '2rem',
                        fontWeight: 700,
                        color: t.text.primary,
                        marginTop: '0.5rem',
                        lineHeight: 1.2,
                    }}>
                        Automatic Double Tracking — Video Overview
                    </h1>
                    <p style={{
                        fontSize: typography.size.base,
                        color: t.text.secondary,
                        marginTop: '0.5rem',
                        lineHeight: 1.5,
                        maxWidth: '640px',
                    }}>
                        Watch the video. It will pause to ask a few quick questions — answer and the video continues.
                        This is not a test; it's so I can see you've engaged with the material before our next lesson.
                    </p>
                </div>
            </header>

            <main style={{
                maxWidth: '960px',
                margin: '0 auto',
                padding: `${spacing[8]} 1.5rem 4rem`,
                display: 'flex',
                flexDirection: 'column',
                gap: spacing[6],
            }}>
                {!student ? (
                    <div>
                        <p style={{
                            fontSize: typography.size.sm,
                            color: t.text.secondary,
                            marginBottom: spacing[4],
                            textAlign: 'center',
                        }}>
                            Enter your student token so your answers count toward your engagement record.
                        </p>
                        <AuthGate
                            onAuthenticated={(s) => setStudent(s)}
                        />
                    </div>
                ) : (
                    <>
                        <VideoCheckpointPlayer
                            videoId={VIDEO_ID}
                            youtubeId={YOUTUBE_ID}
                            checkpoints={CHECKPOINTS}
                            studentToken={student.token}
                            accentColor={ED.accent}
                        />

                        <div style={{
                            padding: `${spacing[3]} ${spacing[4]}`,
                            background: 'white',
                            border: `1px solid ${t.border.subtle}`,
                            borderRadius: borderRadius.lg,
                            fontSize: typography.size.sm,
                            color: t.text.secondary,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: spacing[2],
                        }}>
                            <span>Signed in as <strong>{student.studentName}</strong></span>
                            <Link
                                href="/learn/delay"
                                style={{
                                    fontSize: typography.size.sm,
                                    color: ED.accent,
                                    textDecoration: 'none',
                                    fontWeight: 500,
                                }}
                            >
                                Done watching → Back to Delay
                            </Link>
                        </div>

                        <NotesPanel storageKey="learn-notes-delay-adt-video" />
                    </>
                )}
            </main>
        </div>
    );
}
