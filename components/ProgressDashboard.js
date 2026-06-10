'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { theme, typography, borderRadius, spacing, transitions, editorial as ED } from '@/lib/theme';
import { getAllTopicProgress, getRecentActivity } from '@/lib/quiz-persistence';
import { getAllTopicDefs } from '@/lib/topics';
import AuthGate from '@/app/revise/[topicId]/AuthGate';

export default function ProgressDashboard() {
    const t = theme.light;
    const [student, setStudent] = useState(null);
    const [authChecked, setAuthChecked] = useState(false);
    const [progressMap, setProgressMap] = useState(null);
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);

    const topics = getAllTopicDefs();

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
        if (!student) return;
        setLoading(true);

        Promise.all([
            getAllTopicProgress(student.token),
            getRecentActivity(student.token, 10),
        ]).then(([progress, activity]) => {
            setProgressMap(progress);
            setRecentActivity(activity);
        }).catch(console.error)
          .finally(() => setLoading(false));
    }, [student]);

    if (!authChecked) return null;

    if (!student) {
        return (
            <div style={{ maxWidth: '480px', margin: '0 auto' }}>
                <AuthGate
                    onAuthenticated={setStudent}
                />
            </div>
        );
    }

    if (loading || !progressMap) {
        return (
            <div style={{
                background: t.bg.primary,
                borderRadius: borderRadius.xl,
                border: `1px solid ${t.border.subtle}`,
                padding: `${spacing[12]} ${spacing[6]}`,
                textAlign: 'center',
            }}>
                <p style={{ color: t.text.tertiary, fontSize: typography.size.sm }}>
                    Loading your progress...
                </p>
            </div>
        );
    }

    // Compute summary stats
    const attemptedTopics = topics.filter(topic => progressMap.has(topic.id));
    const totalAttempts = Array.from(progressMap.values()).reduce((sum, p) => sum + p.attempts, 0);
    const allScores = Array.from(progressMap.values()).map(p => ({
        score: p.lastScore,
        attempts: p.attempts,
    }));
    const weightedSum = allScores.reduce((sum, s) => sum + s.score * s.attempts, 0);
    const weightedCount = allScores.reduce((sum, s) => sum + s.attempts, 0);
    const avgScore = weightedCount > 0 ? Math.round(weightedSum / weightedCount) : 0;

    // Sort topics: weakest first (attempted), then unattempted
    const sortedTopics = [...topics].sort((a, b) => {
        const pa = progressMap.get(a.id);
        const pb = progressMap.get(b.id);
        if (!pa && !pb) return 0;
        if (!pa) return 1;
        if (!pb) return -1;
        return pa.bestScore - pb.bestScore;
    });

    // Weak areas: bottom 3 topics with attempts
    const weakAreas = attemptedTopics
        .map(topic => ({ ...topic, progress: progressMap.get(topic.id) }))
        .sort((a, b) => a.progress.bestScore - b.progress.bestScore)
        .slice(0, 3);

    // Topic colour lookup
    const topicMap = Object.fromEntries(topics.map(t => [t.id, t]));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[6] }}>
            {/* Student name header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{
                    fontSize: typography.size.sm,
                    color: t.text.tertiary,
                }}>
                    Logged in as <strong style={{ color: t.text.secondary }}>{student.studentName}</strong>
                </p>
                <button type="button"
                    onClick={() => {
                        localStorage.removeItem('revision_token');
                        localStorage.removeItem('revision_student_id');
                        localStorage.removeItem('revision_student_name');
                        setStudent(null);
                        setProgressMap(null);
                        setRecentActivity([]);
                    }}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: t.text.tertiary,
                        fontSize: typography.size.xs,
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        fontFamily: 'inherit',
                        padding: 0,
                    }}
                >
                    sign out
                </button>
            </div>

            {/* Summary Row */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: spacing[4],
            }}>
                <StatCard
                    value={`${attemptedTopics.length} / ${topics.length}`}
                    label="Topics attempted"
                    t={t}
                />
                <StatCard
                    value={String(totalAttempts)}
                    label="Total attempts"
                    t={t}
                />
                <StatCard
                    value={totalAttempts > 0 ? `${avgScore}%` : '—'}
                    label="Average score"
                    valueColor={totalAttempts > 0
                        ? (avgScore >= 70 ? t.accent.success : avgScore >= 40 ? t.accent.warning : t.accent.error)
                        : t.text.tertiary}
                    t={t}
                />
            </div>

            {/* Weak Areas — only if 3+ topics attempted */}
            {weakAreas.length >= 3 && (
                <div>
                    <h3 style={{
                        fontSize: typography.size.base,
                        fontWeight: typography.weight.semibold,
                        color: t.text.primary,
                        marginBottom: spacing[3],
                    }}>
                        Focus Areas
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
                        {weakAreas.map(({ id, name, progress }) => {
                            const scoreColor = progress.bestScore >= 70 ? t.accent.success
                                : progress.bestScore >= 40 ? t.accent.warning
                                : t.accent.error;
                            return (
                                <Link key={id} href={`/revise/${id}`} style={{ textDecoration: 'none' }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: spacing[3],
                                        padding: `${spacing[3]} ${spacing[4]}`,
                                        background: t.bg.primary,
                                        borderRadius: borderRadius.lg,
                                        border: `1px solid ${t.border.subtle}`,
                                        borderLeft: `4px solid ${scoreColor}`,
                                        transition: `all ${transitions.fast}`,
                                    }}>
                                        <span style={{
                                            fontSize: typography.size.lg,
                                            fontWeight: typography.weight.bold,
                                            color: scoreColor,
                                            minWidth: '48px',
                                            textAlign: 'center',
                                        }}>
                                            {progress.bestScore}%
                                        </span>
                                        <span style={{
                                            flex: 1,
                                            fontSize: typography.size.sm,
                                            color: t.text.secondary,
                                        }}>
                                            {name}
                                        </span>
                                        <span style={{
                                            fontSize: typography.size.xs,
                                            color: t.accent.primary,
                                            fontWeight: typography.weight.medium,
                                        }}>
                                            Revise →
                                        </span>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Topic Grid */}
            <div>
                <h3 style={{
                    fontSize: typography.size.base,
                    fontWeight: typography.weight.semibold,
                    color: t.text.primary,
                    marginBottom: spacing[3],
                }}>
                    All Topics
                </h3>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: spacing[3],
                }}>
                    {sortedTopics.map(topic => {
                        const progress = progressMap.get(topic.id);
                        return (
                            <TopicProgressCard
                                key={topic.id}
                                topic={topic}
                                progress={progress}
                                t={t}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Recent Activity Timeline */}
            {recentActivity.length > 0 && (
                <div>
                    <h3 style={{
                        fontSize: typography.size.base,
                        fontWeight: typography.weight.semibold,
                        color: t.text.primary,
                        marginBottom: spacing[3],
                    }}>
                        Recent Activity
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
                        {recentActivity.map((activity, i) => {
                            const topic = topicMap[activity.topicId];
                            if (!topic) return null;
                            const relTime = getRelativeTime(activity.date);
                            const scoreColor = activity.score != null
                                ? (activity.score >= 70 ? t.accent.success
                                    : activity.score >= 40 ? t.accent.warning
                                    : t.accent.error)
                                : t.text.tertiary;

                            return (
                                <div key={i} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: spacing[3],
                                    padding: `${spacing[2]} ${spacing[3]}`,
                                    background: t.bg.primary,
                                    borderRadius: borderRadius.md,
                                    border: `1px solid ${t.border.subtle}`,
                                }}>
                                    <span style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: borderRadius.full,
                                        background: ED.accent,
                                        flexShrink: 0,
                                    }} />
                                    <span style={{
                                        flex: 1,
                                        fontSize: typography.size.sm,
                                        color: t.text.secondary,
                                    }}>
                                        {topic.name}
                                    </span>
                                    {activity.score != null && (
                                        <span style={{
                                            fontSize: typography.size.sm,
                                            fontWeight: typography.weight.semibold,
                                            color: scoreColor,
                                        }}>
                                            {activity.score}%
                                        </span>
                                    )}
                                    {activity.mode === 'exam' && (
                                        <span style={{
                                            fontSize: typography.size.xs,
                                            color: t.accent.info,
                                            background: t.accent.infoLight,
                                            padding: `${spacing[0.5]} ${spacing[2]}`,
                                            borderRadius: borderRadius.full,
                                            fontWeight: typography.weight.medium,
                                        }}>
                                            exam
                                        </span>
                                    )}
                                    <span style={{
                                        fontSize: typography.size.xs,
                                        color: t.text.tertiary,
                                        whiteSpace: 'nowrap',
                                    }}>
                                        {relTime}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Empty state */}
            {attemptedTopics.length === 0 && (
                <div style={{
                    background: t.bg.primary,
                    borderRadius: borderRadius.xl,
                    border: `1px dashed ${t.border.medium}`,
                    padding: `${spacing[8]} ${spacing[6]}`,
                    textAlign: 'center',
                }}>
                    <p style={{
                        fontSize: typography.size.base,
                        color: t.text.secondary,
                        marginBottom: spacing[2],
                    }}>
                        No quiz attempts yet
                    </p>
                    <p style={{
                        fontSize: typography.size.sm,
                        color: t.text.tertiary,
                    }}>
                        Start a revision quiz from any topic page to see your progress here.
                    </p>
                </div>
            )}
        </div>
    );
}

function StatCard({ value, label, valueColor, t }) {
    return (
        <div style={{
            background: t.bg.primary,
            borderRadius: borderRadius.xl,
            border: `1px solid ${t.border.subtle}`,
            padding: `${spacing[5]} ${spacing[4]}`,
            textAlign: 'center',
            boxShadow: t.shadow.sm,
        }}>
            <p style={{
                fontSize: typography.size['2xl'],
                fontWeight: typography.weight.bold,
                color: valueColor || t.text.primary,
                lineHeight: 1,
                marginBottom: spacing[1],
            }}>
                {value}
            </p>
            <p style={{
                fontSize: typography.size.xs,
                color: t.text.tertiary,
            }}>
                {label}
            </p>
        </div>
    );
}

function TopicProgressCard({ topic, progress, t }) {
    const scoreColor = progress
        ? (progress.bestScore >= 70 ? t.accent.success
            : progress.bestScore >= 40 ? t.accent.warning
            : t.accent.error)
        : t.text.tertiary;

    const trendIcon = progress?.recentTrend === 'improving' ? '↑'
        : progress?.recentTrend === 'declining' ? '↓' : '';
    const trendColor = progress?.recentTrend === 'improving' ? t.accent.success
        : progress?.recentTrend === 'declining' ? t.accent.error : t.text.tertiary;

    return (
        <div style={{
            background: t.bg.primary,
            borderRadius: borderRadius.lg,
            border: `1px solid ${t.border.subtle}`,
            borderLeft: `2px solid ${ED.accentFaint}`,
            padding: `${spacing[4]} ${spacing[5]}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: spacing[3],
        }}>
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                    fontSize: typography.size.sm,
                    fontWeight: typography.weight.semibold,
                    color: t.text.primary,
                    marginBottom: spacing[0.5],
                }}>
                    {topic.name}
                </p>
                {progress ? (
                    <p style={{
                        fontSize: typography.size.xs,
                        color: t.text.tertiary,
                    }}>
                        {progress.attempts} attempt{progress.attempts !== 1 ? 's' : ''}
                    </p>
                ) : (
                    <p style={{
                        fontSize: typography.size.xs,
                        color: t.text.tertiary,
                        fontStyle: 'italic',
                    }}>
                        Not started
                    </p>
                )}
            </div>
            {progress && (
                <div style={{ textAlign: 'right' }}>
                    <span style={{
                        fontSize: typography.size.lg,
                        fontWeight: typography.weight.bold,
                        color: scoreColor,
                    }}>
                        {progress.bestScore}%
                    </span>
                    {trendIcon && (
                        <span style={{
                            fontSize: typography.size.xs,
                            color: trendColor,
                            marginLeft: spacing[1],
                            fontWeight: typography.weight.semibold,
                        }}>
                            {trendIcon}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}

function getRelativeTime(dateStr) {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diffMs = now - then;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
