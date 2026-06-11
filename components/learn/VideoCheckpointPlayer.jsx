'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { theme, typography, borderRadius, spacing, transitions } from '@/lib/theme';

const GRADES_API = 'https://grades.musictechstudio.co.uk/api/external/video-engagement';
const POLL_INTERVAL_MS = 250;
const REWIND_SECONDS = 2;       // seek back this far on resume so cut words aren't lost
const FADE_MS = 1500;           // duration of volume fade-in on resume
const FADE_STEPS = 30;          // ~50ms per step for a smooth ramp

let ytApiPromise = null;
function loadYouTubeApi() {
    if (typeof window === 'undefined') return Promise.resolve(null);
    if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
    if (ytApiPromise) return ytApiPromise;

    ytApiPromise = new Promise(resolve => {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const prevReady = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
            if (prevReady) prevReady();
            resolve(window.YT);
        };
        document.head.appendChild(tag);
    });
    return ytApiPromise;
}

export default function VideoCheckpointPlayer({
    videoId,
    youtubeId,
    checkpoints,
    studentToken,
    accentColor = '#14b8a6',
}) {
    const t = theme.light;
    const containerRef = useRef(null);
    const playerRef = useRef(null);
    const pollRef = useRef(null);
    const triggeredRef = useRef(new Set());
    const checkpointsRef = useRef(checkpoints);
    const answeredIdsRef = useRef(null);
    const fadeRef = useRef(null);
    const dialogRef = useRef(null);
    const lastTimeRef = useRef(0);
    const preFocusRef = useRef(null);

    const [activeCheckpoint, setActiveCheckpoint] = useState(null);
    const [selectedIndex, setSelectedIndex] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [answeredIds, setAnsweredIds] = useState(() => {
        if (typeof window === 'undefined') return new Set();
        try {
            const stored = localStorage.getItem(`video-engagement-answered-${videoId}`);
            return stored ? new Set(JSON.parse(stored)) : new Set();
        } catch {
            return new Set();
        }
    });

    // Keep refs in sync so polling can read the latest values
    // without re-running the effect that creates the player.
    useEffect(() => { checkpointsRef.current = checkpoints; }, [checkpoints]);
    useEffect(() => { answeredIdsRef.current = answeredIds; }, [answeredIds]);

    const persistAnswered = useCallback((ids) => {
        try {
            localStorage.setItem(`video-engagement-answered-${videoId}`, JSON.stringify([...ids]));
        } catch {}
    }, [videoId]);

    useEffect(() => {
        let cancelled = false;

        const stopPolling = () => {
            if (pollRef.current) {
                clearInterval(pollRef.current);
                pollRef.current = null;
            }
        };

        const startPolling = () => {
            stopPolling();
            pollRef.current = setInterval(() => {
                const player = playerRef.current;
                if (!player || typeof player.getCurrentTime !== 'function') return;

                const time = player.getCurrentTime();
                const cps = checkpointsRef.current || [];
                const answered = answeredIdsRef.current || new Set();

                // If the user seeked backward, un-trigger any checkpoint that is now
                // ahead of the current position so it can re-fire on the rewind.
                // A jump of more than 1 s backward counts as a deliberate seek.
                if (time < lastTimeRef.current - 1) {
                    for (const cp of cps) {
                        if (triggeredRef.current.has(cp.id) && !answered.has(cp.id) && cp.timestamp > time) {
                            triggeredRef.current.delete(cp.id);
                        }
                    }
                }
                lastTimeRef.current = time;

                for (const cp of cps) {
                    if (triggeredRef.current.has(cp.id)) continue;
                    if (answered.has(cp.id)) {
                        triggeredRef.current.add(cp.id);
                        continue;
                    }
                    if (time >= cp.timestamp) {
                        triggeredRef.current.add(cp.id);
                        if (fadeRef.current) {
                            clearInterval(fadeRef.current);
                            fadeRef.current = null;
                        }
                        // Capture focus target before pausing so we can restore it on close
                        if (typeof document !== 'undefined') {
                            preFocusRef.current = document.activeElement;
                        }
                        player.pauseVideo();
                        setActiveCheckpoint(cp);
                        setSelectedIndex(null);
                        setSubmitted(false);
                        break;
                    }
                }
            }, POLL_INTERVAL_MS);
        };

        loadYouTubeApi().then(YT => {
            if (cancelled || !YT || !containerRef.current) return;
            playerRef.current = new YT.Player(containerRef.current, {
                videoId: youtubeId,
                playerVars: {
                    rel: 0,
                    modestbranding: 1,
                    playsinline: 1,
                },
                events: {
                    onStateChange: (event) => {
                        if (event.data === YT.PlayerState.PLAYING) {
                            startPolling();
                        } else {
                            stopPolling();
                        }
                    },
                },
            });
        });
        return () => {
            cancelled = true;
            stopPolling();
            if (fadeRef.current) {
                clearInterval(fadeRef.current);
                fadeRef.current = null;
            }
            if (playerRef.current && typeof playerRef.current.destroy === 'function') {
                playerRef.current.destroy();
            }
            playerRef.current = null;
        };
    }, [youtubeId]);

    const submitAnswer = useCallback(async () => {
        if (selectedIndex === null || !activeCheckpoint || submitted) return;
        const cp = activeCheckpoint;
        const isCorrect = selectedIndex === cp.correctIndex;

        setSubmitted(true);

        // Mark answered locally so a refresh doesn't re-pop the question
        const nextAnswered = new Set(answeredIds);
        nextAnswered.add(cp.id);
        setAnsweredIds(nextAnswered);
        persistAnswered(nextAnswered);

        if (studentToken) {
            try {
                await fetch(GRADES_API, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        token: studentToken,
                        videoId,
                        questionId: cp.id,
                        timestampSeconds: Math.round(cp.timestamp),
                        selectedAnswer: cp.options[selectedIndex],
                        isCorrect,
                    }),
                });
            } catch (err) {
                // Engagement signal is non-critical — don't interrupt the student
                console.error('video-engagement save failed:', err);
            }
        }
    }, [selectedIndex, activeCheckpoint, submitted, answeredIds, persistAnswered, studentToken, videoId]);

    const continueVideo = useCallback(() => {
        const cp = activeCheckpoint;
        setActiveCheckpoint(null);
        setSelectedIndex(null);
        setSubmitted(false);

        // Restore focus to whatever held it before the modal opened (WCAG 2.4.3)
        const restored = preFocusRef.current;
        preFocusRef.current = null;
        if (restored && typeof restored.focus === 'function') {
            restored.focus();
        }

        const player = playerRef.current;
        if (!player || typeof player.playVideo !== 'function' || !cp) return;

        // Capture the user's current volume so we can fade back to it.
        const targetVolume = typeof player.getVolume === 'function'
            ? player.getVolume()
            : 100;

        // Rewind a couple of seconds so cut-off words aren't lost.
        const resumeTime = Math.max(0, cp.timestamp - REWIND_SECONDS);
        if (typeof player.seekTo === 'function') {
            player.seekTo(resumeTime, true);
        }

        // Mute, play, then fade volume back in over FADE_MS.
        if (typeof player.setVolume === 'function') {
            player.setVolume(0);
        }
        player.playVideo();

        if (fadeRef.current) {
            clearInterval(fadeRef.current);
        }
        let step = 0;
        fadeRef.current = setInterval(() => {
            step++;
            const v = Math.min(targetVolume, (targetVolume * step) / FADE_STEPS);
            if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
                playerRef.current.setVolume(v);
            }
            if (step >= FADE_STEPS) {
                clearInterval(fadeRef.current);
                fadeRef.current = null;
            }
        }, FADE_MS / FADE_STEPS);
    }, [activeCheckpoint]);

    const completedCount = answeredIds.size;
    const totalCount = checkpoints.length;
    const isCorrect = activeCheckpoint && selectedIndex === activeCheckpoint.correctIndex;

    // Escape key closes modal; move focus into dialog on open
    useEffect(() => {
        if (!activeCheckpoint) return;
        function onKeyDown(e) {
            if (e.key === 'Escape') continueVideo();
        }
        window.addEventListener('keydown', onKeyDown);
        // Move focus into the dialog so screen readers announce it
        if (dialogRef.current) dialogRef.current.focus();
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [activeCheckpoint, continueVideo]);

    return (
        <div style={{ position: 'relative' }}>
            {/* Player frame */}
            <div style={{
                borderRadius: borderRadius.xl,
                overflow: 'hidden',
                boxShadow: t.shadow.lg,
                border: `1px solid ${t.border.subtle}`,
                background: '#000',
            }}>
                <div style={{
                    position: 'relative',
                    width: '100%',
                    paddingBottom: '56.25%',
                }}>
                    <div
                        ref={containerRef}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                        }}
                    />
                </div>
            </div>

            {/* Progress strip */}
            <div style={{
                marginTop: spacing[3],
                padding: `${spacing[2]} ${spacing[4]}`,
                background: 'white',
                border: `1px solid ${t.border.subtle}`,
                borderRadius: borderRadius.lg,
                fontSize: typography.size.sm,
                color: t.text.secondary,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>
                        Checkpoints answered: <strong style={{ color: accentColor }}>{completedCount}</strong> / {totalCount}
                    </span>
                </div>
                <div style={{ fontSize: typography.size.xs, color: t.text.tertiary, marginTop: spacing[1] }}>
                    Pauses for a question — answer to continue.
                </div>
            </div>

            {/* Question modal */}
            {activeCheckpoint && (
                <div
                    ref={dialogRef}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="cp-question"
                    tabIndex={-1}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(15, 23, 42, 0.6)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: spacing[4],
                        zIndex: 1000,
                    }}
                >
                    <div style={{
                        background: 'white',
                        borderRadius: borderRadius.xl,
                        padding: spacing[6],
                        maxWidth: '560px',
                        width: '100%',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
                    }}>
                        <div style={{
                            fontSize: typography.size.xs,
                            fontWeight: 600,
                            color: accentColor,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            marginBottom: spacing[2],
                        }}>
                            Checkpoint at {formatTimestamp(activeCheckpoint.timestamp)}
                        </div>
                        <h3 id="cp-question" style={{
                            fontSize: typography.size.lg,
                            fontWeight: typography.weight.semibold,
                            color: t.text.primary,
                            lineHeight: 1.4,
                            margin: 0,
                            marginBottom: spacing[4],
                        }}>
                            {activeCheckpoint.question}
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
                            {activeCheckpoint.options.map((opt, i) => {
                                const isSelected = selectedIndex === i;
                                const showCorrect = submitted && i === activeCheckpoint.correctIndex;
                                const showWrong = submitted && isSelected && !showCorrect;

                                let borderColor = t.border.medium;
                                let bg = 'white';
                                let color = t.text.primary;
                                if (showCorrect) {
                                    borderColor = '#16a34a';
                                    bg = '#16a34a12';
                                    color = '#14532d';
                                } else if (showWrong) {
                                    borderColor = '#dc2626';
                                    bg = '#dc262612';
                                    color = '#7f1d1d';
                                } else if (isSelected) {
                                    borderColor = accentColor;
                                    bg = accentColor + '12';
                                }

                                return (
                                    <button type="button"
                                        key={i}
                                        onClick={() => !submitted && setSelectedIndex(i)}
                                        disabled={submitted}
                                        style={{
                                            textAlign: 'left',
                                            padding: `${spacing[3]} ${spacing[4]}`,
                                            border: `1.5px solid ${borderColor}`,
                                            borderRadius: borderRadius.lg,
                                            background: bg,
                                            color,
                                            fontSize: typography.size.base,
                                            fontFamily: 'inherit',
                                            cursor: submitted ? 'default' : 'pointer',
                                            transition: `all ${transitions.fast}`,
                                        }}
                                    >
                                        {opt}
                                    </button>
                                );
                            })}
                        </div>

                        {submitted && (
                            <div style={{
                                marginTop: spacing[4],
                                padding: spacing[3],
                                borderRadius: borderRadius.lg,
                                background: isCorrect ? '#16a34a12' : '#f59e0b12',
                                borderLeft: `4px solid ${isCorrect ? '#16a34a' : '#f59e0b'}`,
                                fontSize: typography.size.sm,
                                color: t.text.secondary,
                                lineHeight: 1.5,
                            }}>
                                {isCorrect
                                    ? 'Correct.'
                                    : `The answer is "${activeCheckpoint.options[activeCheckpoint.correctIndex]}". `}
                                {activeCheckpoint.explanation && (
                                    <span>{activeCheckpoint.explanation}</span>
                                )}
                            </div>
                        )}

                        <div style={{
                            marginTop: spacing[5],
                            display: 'flex',
                            justifyContent: 'flex-end',
                        }}>
                            {!submitted ? (
                                <button type="button"
                                    onClick={submitAnswer}
                                    disabled={selectedIndex === null}
                                    style={{
                                        padding: `${spacing[3]} ${spacing[5]}`,
                                        background: selectedIndex !== null ? accentColor : t.bg.tertiary,
                                        color: selectedIndex !== null ? 'white' : t.text.tertiary,
                                        border: 'none',
                                        borderRadius: borderRadius.lg,
                                        fontSize: typography.size.base,
                                        fontWeight: typography.weight.semibold,
                                        cursor: selectedIndex !== null ? 'pointer' : 'default',
                                        fontFamily: 'inherit',
                                    }}
                                >
                                    Submit
                                </button>
                            ) : (
                                <button type="button"
                                    onClick={continueVideo}
                                    style={{
                                        padding: `${spacing[3]} ${spacing[5]}`,
                                        background: accentColor,
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: borderRadius.lg,
                                        fontSize: typography.size.base,
                                        fontWeight: typography.weight.semibold,
                                        cursor: 'pointer',
                                        fontFamily: 'inherit',
                                    }}
                                >
                                    Continue video →
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function formatTimestamp(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}
