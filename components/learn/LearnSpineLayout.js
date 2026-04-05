'use client';

import { useState, useRef, useEffect } from 'react';
import diagrams from './diagrams';
import ExpandableText from './ExpandableText';
import SectionAssessment from './SectionAssessment';

export default function LearnSpineLayout({ topic, token, answeredSections }) {
    const topicColor = topic.color || '#f97316';
    const [assessmentState, setAssessmentState] = useState({});
    const spineTrackRef = useRef(null);
    const spineFillRef = useRef(null);
    const containerRef = useRef(null);
    const sectionRefs = useRef([]);
    const [activeIndexes, setActiveIndexes] = useState(new Set());
    const [rippleFired, setRippleFired] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Mobile detection
    useEffect(() => {
        const mq = window.matchMedia('(max-width: 768px)');
        setIsMobile(mq.matches);
        const handler = (e) => setIsMobile(e.matches);
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
            },
            { rootMargin: '-45% 0px -45% 0px' }
        );

        const refs = sectionRefs.current;
        refs.forEach((el) => {
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, [topic.rows.length]);

    // Scroll listener for spine fill
    useEffect(() => {
        let rafId;
        const onScroll = () => {
            rafId = requestAnimationFrame(() => {
                const container = containerRef.current;
                const fill = spineFillRef.current;
                if (!container || !fill) return;
                const rect = container.getBoundingClientRect();
                const trigger = window.innerHeight * 0.55;
                const progress = Math.min(1, Math.max(0, (trigger - rect.top) / rect.height));
                fill.style.height = (progress * rect.height) + 'px';
            });
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll(); // initial

        return () => {
            window.removeEventListener('scroll', onScroll);
            if (rafId) cancelAnimationFrame(rafId);
        };
    }, []);

    // Ripple trigger: fire when all sections active
    useEffect(() => {
        if (activeIndexes.size === topic.rows.length && topic.rows.length > 0) {
            setRippleFired(true);
        } else {
            setRippleFired(false);
        }
    }, [activeIndexes, topic.rows.length]);

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
            setTimeout(() => {
                setAssessmentState((prev) => ({
                    ...prev,
                    [i]: { show: false, animating: false },
                }));
            }, 300);
        }
    };

    const ringSizes = [70, 130, 200, 280, 370, 470, 580];

    return (
        <div ref={containerRef} style={{
            position: 'relative',
            maxWidth: '960px',
            margin: '0 auto',
            padding: '3rem 1.5rem 0',
        }}>
            {/* Spine track */}
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

            {/* Spine fill (scroll-driven, starts at 0) */}
            <div
                ref={spineFillRef}
                style={{
                    position: 'absolute',
                    left: isMobile ? '24px' : '50%',
                    top: 0,
                    width: '2px',
                    height: 0,
                    background: `linear-gradient(to bottom, ${topicColor}, #1a1a2e)`,
                    transform: isMobile ? 'none' : 'translateX(-50%)',
                    transition: 'height 0.12s ease-out',
                    zIndex: 2,
                }}
            />

            {/* Sections */}
            {topic.rows.map((row, i) => {
                const isOdd = i % 2 === 0;
                const DiagramComponent = diagrams[row.animation];
                const alreadyAnswered = answeredSections?.includes(row.id);
                const state = assessmentState[i] || { show: false, animating: false };
                const isActive = activeIndexes.has(i);

                return (
                    <div
                        key={row.id}
                        ref={el => sectionRefs.current[i] = el}
                        data-section-index={i}
                        style={{
                            display: 'flex',
                            flexDirection: isMobile ? 'column' : (isOdd ? 'row' : 'row-reverse'),
                            marginBottom: isMobile ? '60px' : '100px',
                            position: 'relative',
                            zIndex: 3,
                            minHeight: isMobile ? 'auto' : '200px',
                            ...(isMobile ? { paddingLeft: '48px' } : {}),
                        }}
                    >
                        {/* Text side */}
                        <div style={{
                            flex: 1,
                            maxWidth: isMobile ? '100%' : 'calc(50% - 48px)',
                            paddingRight: isMobile ? undefined : (isOdd ? '32px' : undefined),
                            paddingLeft: isMobile ? undefined : (isOdd ? undefined : '32px'),
                            opacity: isActive ? 1 : 0.25,
                            transform: isActive ? 'translateY(0)' : 'translateY(24px)',
                            transition: 'opacity 0.5s ease, transform 0.5s ease',
                        }}>
                            <div style={{
                                position: 'relative',
                                minHeight: state.show ? '200px' : 'auto',
                            }}>
                                {/* Section number badge + assessment toggle */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    marginBottom: '0.75rem',
                                }}>
                                    <div style={{
                                        display: 'inline-block',
                                        padding: '0.2rem 0.6rem',
                                        borderRadius: '9999px',
                                        background: topicColor + '12',
                                        color: topicColor,
                                        fontSize: '0.7rem',
                                        fontWeight: 600,
                                        letterSpacing: '0.025em',
                                        textTransform: 'uppercase',
                                    }}>
                                        {String(i + 1).padStart(2, '0')}
                                    </div>

                                    {row.assessment && (
                                        <button
                                            onClick={() => handleToggleAssessment(i)}
                                            style={{
                                                width: '24px',
                                                height: '24px',
                                                borderRadius: '50%',
                                                border: `1.5px solid ${alreadyAnswered ? '#059669' : topicColor}`,
                                                background: alreadyAnswered ? '#D1FAE5' : state.show ? topicColor + '15' : 'transparent',
                                                color: alreadyAnswered ? '#059669' : topicColor,
                                                fontSize: '0.7rem',
                                                fontWeight: 700,
                                                cursor: 'pointer',
                                                transition: 'all 150ms ease',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                padding: 0,
                                                fontFamily: 'inherit',
                                            }}
                                            title={alreadyAnswered ? 'Already answered' : 'Check your understanding'}
                                        >
                                            {alreadyAnswered ? '\u2713' : state.show ? '\u00d7' : '?'}
                                        </button>
                                    )}
                                </div>

                                {/* Text description (crossfades out when assessment shown) */}
                                <div style={{
                                    opacity: state.show ? 0 : 1,
                                    transform: state.show ? 'translateY(-8px)' : 'translateY(0)',
                                    transition: 'opacity 0.25s ease, transform 0.25s ease',
                                    pointerEvents: state.show ? 'none' : 'auto',
                                    position: state.show ? 'absolute' : 'relative',
                                    width: '100%',
                                }}>
                                    <h3 style={{
                                        fontSize: '1.375rem',
                                        fontWeight: 700,
                                        color: '#1A1A2E',
                                        lineHeight: 1.25,
                                        marginBottom: '0.75rem',
                                    }}>
                                        {row.heading}
                                    </h3>

                                    <ExpandableText
                                        text={row.description}
                                        topicColor={topicColor}
                                        topicId={topic.id}
                                        studentToken={token}
                                    />
                                </div>

                                {/* Assessment (scales in) */}
                                {row.assessment && state.show && (
                                    <div style={{
                                        transformOrigin: 'top left',
                                        transform: state.animating ? 'scale(1)' : 'scale(0.85)',
                                        opacity: state.animating ? 1 : 0,
                                        transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease',
                                    }}>
                                        <SectionAssessment
                                            assessment={row.assessment}
                                            topicId={topic.id}
                                            sectionId={row.id}
                                            topicColor={topicColor}
                                            studentToken={token}
                                            alreadyAnswered={alreadyAnswered}
                                            onComplete={() => {}}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Node on spine */}
                        <div style={{
                            position: 'absolute',
                            left: isMobile ? '0px' : '50%',
                            top: '16px',
                            transform: isActive ? 'translate(-50%, 0) scale(1.1)' : 'translate(-50%, 0)',
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            border: `2px solid ${isActive ? topicColor : '#e5e7eb'}`,
                            background: isActive ? topicColor : '#f5f4f2',
                            color: isActive ? '#fff' : '#bbb',
                            boxShadow: isActive ? `0 0 0 5px ${topicColor}25` : 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            zIndex: 4,
                            transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        }}>
                            {i + 1}
                        </div>

                        {/* Diagram side */}
                        <div style={{
                            flex: 1,
                            maxWidth: isMobile ? '100%' : 'calc(50% - 48px)',
                            marginTop: isMobile ? '16px' : undefined,
                            opacity: isActive ? 1 : 0.25,
                            transform: isActive ? 'translateY(0)' : 'translateY(24px)',
                            transition: 'opacity 0.5s ease, transform 0.5s ease',
                        }}>
                            <div style={{
                                background: '#fafafa',
                                borderRadius: '0.75rem',
                                border: '1px solid #E5E7EB',
                                aspectRatio: '480 / 280',
                                overflow: 'hidden',
                            }}>
                                {DiagramComponent && <DiagramComponent />}
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* Ripple zone */}
            <div style={{
                height: '300px',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: isMobile ? 'flex-start' : 'center',
                paddingLeft: isMobile ? '18px' : undefined,
            }}>
                {/* Centre dot */}
                <div style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    background: rippleFired ? topicColor : '#e5e7eb',
                    boxShadow: rippleFired ? `0 0 12px ${topicColor}66` : 'none',
                    position: 'relative',
                    zIndex: 2,
                    transition: 'background 0.4s ease, box-shadow 0.4s ease',
                }} />

                {/* Ripple rings */}
                {ringSizes.map((size, ri) => (
                    <div
                        key={ri}
                        style={{
                            position: 'absolute',
                            left: '50%',
                            top: '50%',
                            width: `${size}px`,
                            height: `${size}px`,
                            borderRadius: '50%',
                            border: `1.5px solid ${topicColor}`,
                            transform: 'translate(-50%, -50%) scale(0)',
                            opacity: 0,
                            ...(rippleFired ? {
                                animation: 'spine-ripple 2.2s ease-out forwards',
                                animationDelay: `${ri * 0.12}s`,
                            } : {
                                animation: 'none',
                            }),
                        }}
                    />
                ))}
            </div>

            {/* Complete message */}
            <div style={{
                textAlign: 'center',
                paddingBottom: '4rem',
                opacity: rippleFired ? 1 : 0,
                transform: rippleFired ? 'translateY(0)' : 'translateY(10px)',
                transition: 'opacity 0.6s ease 1s, transform 0.6s ease 1s',
            }}>
                <h3 style={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    color: '#1A1A2E',
                    marginBottom: '0.5rem',
                }}>
                    Topic complete
                </h3>
                <p style={{
                    fontSize: '0.95rem',
                    color: '#6B7280',
                }}>
                    {topic.rows.length} of {topic.rows.length} sections covered
                </p>
            </div>

            {/* Keyframes for ripple animation */}
            <style>{`
                @keyframes spine-ripple {
                    0% { transform: translate(-50%, -50%) scale(0); border-color: ${topicColor}4D; }
                    100% { transform: translate(-50%, -50%) scale(1); border-color: ${topicColor}00; }
                }
            `}</style>
        </div>
    );
}
