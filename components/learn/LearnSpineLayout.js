'use client';

import { useState, useRef, useEffect } from 'react';
import diagrams from './diagrams';
import interactives from './interactives';
import ExpandableText from './ExpandableText';
import AudioBlock from './AudioBlock';
import SectionAssessment from './SectionAssessment';
import ChapterOutro from './ChapterOutro';
import ExamAnchor from './ExamAnchor';
import { markChapterComplete } from '@/lib/learn/course-progress';
import { editorial as ED } from '@/lib/theme';

export default function LearnSpineLayout({ topic, token, answeredSections, parentTopicId, outro }) {
    const topicColor = ED.accent;
    const [assessmentState, setAssessmentState] = useState({});
    const closeTimerRef = useRef(null);
    const spineTrackRef = useRef(null);
    const spineFillRef = useRef(null);
    const containerRef = useRef(null);
    const sectionRefs = useRef([]);
    const [activeIndexes, setActiveIndexes] = useState(new Set());
    const [hasBeenVisible, setHasBeenVisible] = useState(new Set());
    const [rippleFired, setRippleFired] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
    const rafRef = useRef(null);
    const rippleZoneRef = useRef(null);

    // Mobile detection
    useEffect(() => {
        const mq = window.matchMedia('(max-width: 768px)');
        setIsMobile(mq.matches);
        const handler = (e) => setIsMobile(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    // Reduced-motion detection
    useEffect(() => {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        setPrefersReducedMotion(mq.matches);
        const handler = (e) => setPrefersReducedMotion(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    // IntersectionObserver for section activation
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                setActiveIndexes((prev) => {
                    const next = new Set(prev);
                    entries.forEach((entry) => {
                        const idx = Number(entry.target.dataset.sectionIndex);
                        if (entry.isIntersecting) {
                            next.add(idx);
                        } else {
                            next.delete(idx);
                        }
                    });
                    return next;
                });
                // Track which sections have ever been visible (for diagram persistence)
                setHasBeenVisible((prev) => {
                    const next = new Set(prev);
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            next.add(Number(entry.target.dataset.sectionIndex));
                        }
                    });
                    return next.size !== prev.size ? next : prev;
                });
            },
            { rootMargin: '-35% 0px -15% 0px' }
        );

        const refs = sectionRefs.current;
        refs.forEach((el) => {
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, [topic.rows.length]);

    // Scroll listener for spine fill
    useEffect(() => {
        const onScroll = () => {
            rafRef.current = requestAnimationFrame(() => {
                const container = containerRef.current;
                const fill = spineFillRef.current;
                if (!container || !fill) return;
                const rect = container.getBoundingClientRect();
                const rippleZone = rippleZoneRef.current;
                // Fill stops at the centre of the ripple dot
                const dotY = rippleZone
                    ? rippleZone.getBoundingClientRect().top - rect.top + rippleZone.offsetHeight / 2
                    : rect.height;
                // Container-anchored scroll progress: 0 when top of container enters viewport, 1 at bottom
                const containerTop = rect.top + window.scrollY;
                const containerHeight = container.offsetHeight;
                const scrolled = window.scrollY - containerTop;
                const scrollable = containerHeight - window.innerHeight;
                const progress = scrollable > 0 ? Math.max(0, Math.min(1, scrolled / scrollable)) : 0;
                fill.style.height = (Math.min(1, progress) * dotY) + 'px';
            });
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll(); // initial

        return () => {
            window.removeEventListener('scroll', onScroll);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, []);

    // Ripple trigger: fire when scrolled near the bottom of the page
    const rippleFiredRef = useRef(false);
    useEffect(() => {
        if (rippleFiredRef.current) return;
        const checkRipple = () => {
            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            if (maxScroll > 0 && window.scrollY / maxScroll >= 0.92) {
                rippleFiredRef.current = true;
                setRippleFired(true);
                markChapterComplete(parentTopicId, topic.id);
            }
        };
        window.addEventListener('scroll', checkRipple, { passive: true });
        return () => window.removeEventListener('scroll', checkRipple);
    }, []);

    // Cleanup the close timer on unmount to avoid state updates on an unmounted component
    useEffect(() => {
        return () => { if (closeTimerRef.current) clearTimeout(closeTimerRef.current); };
    }, []);

    const handleToggleAssessment = (i) => {
        const current = assessmentState[i] || { show: false, animating: false };
        if (!current.show) {
            setAssessmentState((prev) => ({
                ...prev,
                [i]: { show: true, animating: false },
            }));
            requestAnimationFrame(() => {
                setAssessmentState((prev) => ({
                    ...prev,
                    [i]: { show: true, animating: true },
                }));
            });
        } else {
            setAssessmentState((prev) => ({
                ...prev,
                [i]: { show: true, animating: false },
            }));
            closeTimerRef.current = setTimeout(() => {
                setAssessmentState((prev) => ({
                    ...prev,
                    [i]: { show: false, animating: false },
                }));
            }, 300);
        }
    };

    return (
        <div ref={containerRef} style={{
            position: 'relative',
            maxWidth: '1140px',
            margin: '0 auto',
            padding: '3rem 1.5rem 0',
        }}>
            {/* Spine track — height set dynamically to stop at ripple dot */}
            <div
                ref={spineTrackRef}
                style={{
                    position: 'absolute',
                    left: isMobile ? '24px' : '50%',
                    top: 0,
                    bottom: 0,
                    width: '2px',
                    background: '#e5e7eb',
                    transform: isMobile ? 'none' : 'translateX(-50%)',
                    zIndex: 1,
                }}
            />
            {/* A second track segment below the ripple zone is intentionally omitted —
                the grey line stops at the ripple dot */}

            {/* Spine fill (scroll-driven, starts at 0) */}
            <div
                ref={spineFillRef}
                style={{
                    position: 'absolute',
                    left: isMobile ? '24px' : '50%',
                    top: 0,
                    width: '2px',
                    height: 0,
                    background: `linear-gradient(to bottom, ${topicColor}, ${ED.ink})`,
                    transform: isMobile ? 'none' : 'translateX(-50%)',
                    transition: 'height 0.12s ease-out',
                    zIndex: 2,
                }}
            />

            {/* Sections */}
            {topic.rows.map((row, i) => {
                const isLeft = i % 2 === 0;
                const DiagramComponent = diagrams[row.animation];
                const priorResponse = answeredSections?.find(s => s.id === row.id);
                const alreadyAnswered = !!priorResponse;
                const state = assessmentState[i] || { show: false, animating: false };
                const isActive = activeIndexes.has(i);

                const textBlock = (
                    <div key={`text-${i}`} style={{
                        opacity: isActive ? 1 : 0.6,
                        transform: (isActive || prefersReducedMotion) ? 'translateY(0)' : 'translateY(24px)',
                        transition: prefersReducedMotion ? 'opacity 0.5s ease' : 'opacity 0.5s ease, transform 0.5s ease',
                    }}>
                        <div style={{ position: 'relative', minHeight: state.show ? '200px' : 'auto' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                <div style={{
                                    display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '9999px',
                                    background: topicColor + '20', color: topicColor, fontSize: '0.7rem',
                                    fontWeight: 600, letterSpacing: '0.025em', textTransform: 'uppercase',
                                }}>
                                    {String(i + 1).padStart(2, '0')}
                                </div>
                                {row.assessment && (
                                    <button type="button" onClick={() => handleToggleAssessment(i)} style={{
                                        width: '24px', height: '24px', borderRadius: '50%',
                                        border: `1.5px solid ${alreadyAnswered ? '#059669' : topicColor}`,
                                        background: alreadyAnswered ? '#D1FAE5' : state.show ? topicColor + '15' : 'transparent',
                                        color: alreadyAnswered ? '#059669' : topicColor, fontSize: '0.7rem', fontWeight: 700,
                                        cursor: 'pointer', transition: 'all 150ms ease', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center', padding: 0, fontFamily: 'inherit',
                                    }} title={alreadyAnswered ? 'Already answered' : 'Check your understanding'}>
                                        {alreadyAnswered ? '\u2713' : state.show ? '\u00d7' : '?'}
                                    </button>
                                )}
                            </div>
                            <div style={{
                                opacity: state.show ? 0 : 1, transform: state.show ? 'translateY(-8px)' : 'translateY(0)',
                                transition: 'opacity 0.25s ease, transform 0.25s ease',
                                pointerEvents: state.show ? 'none' : 'auto',
                                position: state.show ? 'absolute' : 'relative', width: '100%',
                            }}>
                                <h3 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#1A1A2E', lineHeight: 1.25, marginBottom: '0.75rem' }}>
                                    {row.heading}
                                </h3>
                                <ExpandableText text={row.description} topicColor={topicColor} topicId={topic.id} studentToken={token} />
                                {row.audio && <AudioBlock preset={row.audio.preset} params={row.audio.params} label={row.audio.label} />}
                                {row.interactive && interactives[row.interactive] && (() => {
                                    const Interactive = interactives[row.interactive];
                                    return <Interactive />;
                                })()}
                            </div>
                            {row.assessment && state.show && (
                                <div style={{
                                    transformOrigin: 'top left',
                                    transform: state.animating ? 'scale(1)' : 'scale(0.85)',
                                    opacity: state.animating ? 1 : 0,
                                    transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease',
                                }}>
                                    <SectionAssessment assessment={row.assessment} topicId={topic.id} sectionId={row.id}
                                        topicColor={topicColor} studentToken={token} alreadyAnswered={alreadyAnswered}
                                        priorCorrect={priorResponse?.correct} onComplete={() => {}} />
                                </div>
                            )}
                        </div>
                    </div>
                );

                const diagramBlock = (
                    <div key={`diagram-${i}`} style={{
                        opacity: isActive ? 1 : 0.6,
                        transform: (isActive || prefersReducedMotion) ? 'translateY(0)' : 'translateY(24px)',
                        transition: prefersReducedMotion ? 'opacity 0.5s ease' : 'opacity 0.5s ease, transform 0.5s ease',
                        ...(isMobile ? { marginTop: '16px' } : {}),
                    }}>
                        <div style={{
                            background: '#fafafa', borderRadius: '0.75rem',
                            border: '1px solid #E5E7EB', aspectRatio: '480 / 280', overflow: 'hidden',
                        }}>
                            {DiagramComponent && hasBeenVisible.has(i) && <DiagramComponent />}
                        </div>
                    </div>
                );

                const nodeBlock = (
                    <div key={`node-${i}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{
                            width: '56px', height: '56px', borderRadius: '50%',
                            border: `3px solid ${isActive ? topicColor : '#e5e7eb'}`,
                            background: isActive ? topicColor : '#f5f4f2',
                            color: isActive ? '#fff' : '#bbb',
                            boxShadow: isActive ? `0 0 0 8px ${topicColor}20, 0 0 0 16px ${topicColor}10` : 'none',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1rem', fontWeight: 700, zIndex: 4,
                            transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                            transform: isActive ? 'scale(1.05)' : 'scale(1)',
                        }}>
                            {i + 1}
                        </div>
                    </div>
                );

                if (isMobile) {
                    return (
                        <div key={row.id} ref={el => sectionRefs.current[i] = el} data-section-index={i}
                            style={{ display: 'flex', flexDirection: 'column', marginBottom: '60px', position: 'relative', zIndex: 3, paddingLeft: '48px' }}>
                            <div style={{ position: 'absolute', left: '0px', top: '0', transform: 'translate(-50%, 0)' }}>
                                {nodeBlock}
                            </div>
                            {textBlock}
                            {diagramBlock}
                        </div>
                    );
                }

                return (
                    <div key={row.id} ref={el => sectionRefs.current[i] = el} data-section-index={i}
                        style={{
                            display: 'grid', gridTemplateColumns: '1fr 120px 1fr',
                            marginBottom: '100px', position: 'relative', zIndex: 3,
                            minHeight: '200px', alignItems: 'center',
                        }}>
                        {isLeft ? textBlock : diagramBlock}
                        {nodeBlock}
                        {isLeft ? diagramBlock : textBlock}
                    </div>
                );
            })}

            {topic.examAnchor && <ExamAnchor anchor={topic.examAnchor} />}

            {/* Ripple zone — full-width bowl wave effect */}
            <div ref={rippleZoneRef} style={{
                position: 'relative',
                height: '400px',
                overflow: 'hidden',
                marginLeft: '-50vw',
                marginRight: '-50vw',
                left: '50%',
                right: '50%',
                width: '100vw',
            }}>
                {/* Centre dot on the spine */}
                <div style={{
                    position: 'absolute',
                    left: '50%',
                    top: '40px',
                    transform: 'translateX(-50%)',
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    background: rippleFired ? topicColor : '#e5e7eb',
                    boxShadow: rippleFired ? `0 0 16px ${topicColor}66` : 'none',
                    zIndex: 5,
                    transition: 'background 0.4s ease, box-shadow 0.4s ease',
                }} />

                {/* Bowl wave arcs */}
                {[1, 2, 3, 4, 5].map((n) => (
                    <div key={n} style={{
                        position: 'absolute',
                        left: '50%',
                        top: '40px',
                        transform: 'translateX(-50%)',
                        width: `${n * 40}%`,
                        height: `${n * 70}px`,
                        borderRadius: '0 0 50% 50%',
                        border: 'none',
                        borderBottom: `2px solid ${topicColor}`,
                        opacity: 0,
                        ...(rippleFired ? {
                            animation: 'bowl-wave 2s ease-out forwards',
                            animationDelay: `${n * 0.15}s`,
                        } : {
                            animation: 'none',
                        }),
                    }} />
                ))}

                {/* Gradient wash behind waves */}
                <div style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: '40px',
                    height: '360px',
                    background: rippleFired
                        ? `radial-gradient(ellipse 80% 100% at 50% 0%, ${topicColor}12 0%, ${topicColor}08 40%, transparent 70%)`
                        : 'none',
                    opacity: rippleFired ? 1 : 0,
                    transition: 'opacity 1.5s ease 0.3s',
                    pointerEvents: 'none',
                }} />
            </div>

            {/* Complete message */}
            <div style={{
                textAlign: 'center',
                paddingBottom: '4rem',
                marginTop: '-2rem',
                opacity: rippleFired ? 1 : 0,
                transform: rippleFired ? 'translateY(0)' : 'translateY(10px)',
                transition: 'opacity 0.6s ease 1.2s, transform 0.6s ease 1.2s',
            }}>
                <h3 style={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    color: '#1A1A2E',
                    marginBottom: '0.5rem',
                }}>
                    You've reached the end of the lesson
                </h3>
                {answeredSections?.length > 0 && (
                    <p style={{
                        fontSize: '0.95rem',
                        color: '#6B7280',
                    }}>
                        {answeredSections.length} of {topic.rows.filter(r => r.assessment).length} questions answered
                    </p>
                )}
            </div>

            {/* Chapter outro — next chapter or explore/revise, fades in with the ripple */}
            <div style={{
                opacity: rippleFired ? 1 : 0,
                transform: rippleFired ? 'translateY(0)' : 'translateY(10px)',
                transition: 'opacity 0.6s ease 1.2s, transform 0.6s ease 1.2s',
            }}>
                <ChapterOutro outro={outro} />
            </div>

            {/* Keyframes for bowl wave ripple */}
            <style>{`
                @keyframes bowl-wave {
                    0% {
                        opacity: 0;
                        transform: translateX(-50%) scaleX(0.3) scaleY(0.3);
                    }
                    30% {
                        opacity: 0.6;
                    }
                    100% {
                        opacity: 0;
                        transform: translateX(-50%) scaleX(1) scaleY(1);
                    }
                }
            `}</style>
        </div>
    );
}
