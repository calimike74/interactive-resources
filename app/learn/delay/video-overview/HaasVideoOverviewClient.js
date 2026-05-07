'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import NotesPanel from '@/components/learn/NotesPanel';
import VideoCheckpointPlayer from '@/components/learn/VideoCheckpointPlayer';
import AuthGate from '@/app/revise/[topicId]/AuthGate';
import { theme, typography, borderRadius, spacing } from '@/lib/theme';

const TOPIC_COLOUR = '#14b8a6';
const VIDEO_ID = 'haas-effect-1.12';
const YOUTUBE_ID = 'Spyf2IYgZpI';

const CHECKPOINTS = [
    {
        id: 'q1-source-location',
        timestamp: 36,
        question: 'What does the precedence effect (Haas effect) help your brain do?',
        options: [
            'Ignore reverb in noisy rooms',
            'Locate the source/direction of a sound',
            'Make sounds appear louder',
            'Reduce background noise',
        ],
        correctIndex: 1,
        explanation: 'Your brain uses the very first arrival to anchor the perceived source location, treating later reflections as part of the same event.',
    },
    {
        id: 'q2-transient-fusion-5ms',
        timestamp: 87,
        question: 'For a short transient (snare hit, click), the second sound must arrive within how many milliseconds for the brain to fuse them?',
        options: ['5 ms', '10 ms', '25 ms', '40 ms'],
        correctIndex: 0,
        explanation: 'Transients have a much tighter fusion window than vocals because there is less audio information to integrate.',
    },
    {
        id: 'q3-vocal-fusion-40ms',
        timestamp: 107,
        question: 'What is the approximate fusion window for human vocals?',
        options: ['5 ms', '10 ms', '40 ms', '100 ms'],
        correctIndex: 2,
        explanation: 'Speech and vocals have more audio information for the brain to integrate, so the fusion window stretches to roughly 40 ms before an echo is heard.',
    },
    {
        id: 'q4-loudness-override-15db',
        timestamp: 148,
        question: 'How much louder must a delayed signal be to override the precedence effect and steal the perceived source position?',
        options: ['3 dB', '6 dB', '10 dB', '15 dB'],
        correctIndex: 3,
        explanation: 'Below this threshold, timing wins over loudness — the brain trusts the first arrival even if a later signal is significantly louder.',
    },
    {
        id: 'q5-worked-example-20ms-12db',
        timestamp: 177,
        question: 'You duplicate a vocal, delay the copy by 20 ms, and boost the copy by 12 dB. Which one determines the perceived location?',
        options: [
            'The delayed (boosted) track',
            'The original (first arrival)',
            'The louder track always wins',
            'The two cancel each other out',
        ],
        correctIndex: 1,
        explanation: '20 ms is well under the 40 ms vocal fusion limit AND 12 dB is under the 15 dB override threshold — so timing wins.',
    },
    {
        id: 'q6-stereo-width-25ms',
        timestamp: 213,
        question: 'An engineer pans a mono vocal hard left, duplicates it, applies a 25 ms delay, and pans the copy hard right at the same volume. What does the listener hear?',
        options: [
            'A clear echo on the right',
            'A single, wider vocal',
            'Two distinct vocals',
            'Phase cancellation / silence',
        ],
        correctIndex: 1,
        explanation: '25 ms is within the fusion window, so the brain merges them into one wide-feeling vocal — this is artificial stereo width.',
    },
];

export default function HaasVideoOverviewClient() {
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
                            display: 'inline-block',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '9999px',
                            background: `${TOPIC_COLOUR}15`,
                            color: TOPIC_COLOUR,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                        }}>
                            Topic 1.12
                        </span>
                        <span style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '9999px',
                            background: '#6366f115',
                            color: '#6366f1',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                        }}>
                            Video + Checkpoints
                        </span>
                    </div>

                    <h1 style={{
                        fontSize: '2rem',
                        fontWeight: 700,
                        color: t.text.primary,
                        marginTop: '0.5rem',
                        lineHeight: 1.2,
                    }}>
                        The Haas Effect — Video Overview
                    </h1>
                    <p style={{
                        fontSize: typography.size.base,
                        color: t.text.secondary,
                        marginTop: '0.5rem',
                        lineHeight: 1.5,
                        maxWidth: '640px',
                    }}>
                        Watch the video. It will pause six times to ask you a quick question — answer and the video continues.
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
                            topicColour={TOPIC_COLOUR}
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
                            accentColor={TOPIC_COLOUR}
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
                                    color: TOPIC_COLOUR,
                                    textDecoration: 'none',
                                    fontWeight: 500,
                                }}
                            >
                                Done watching → Back to Delay
                            </Link>
                        </div>

                        <NotesPanel storageKey="learn-notes-delay-haas-video" />
                    </>
                )}
            </main>
        </div>
    );
}
