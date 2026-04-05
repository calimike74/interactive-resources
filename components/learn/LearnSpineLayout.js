'use client';

import { useState, useRef } from 'react';
import diagrams from './diagrams';
import ExpandableText from './ExpandableText';
import SectionAssessment from './SectionAssessment';

export default function LearnSpineLayout({ topic, token, answeredSections }) {
    const topicColor = topic.color || '#f97316';
    const [assessmentState, setAssessmentState] = useState({});
    const spineTrackRef = useRef(null);
    const spineFillRef = useRef(null);

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
        <div style={{
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
                    left: '50%',
                    top: 0,
                    bottom: 0,
                    width: '2px',
                    background: '#e5e7eb',
                    transform: 'translateX(-50%)',
                    zIndex: 1,
                }}
            />

            {/* Spine fill (scroll-driven, starts at 0) */}
            <div
                ref={spineFillRef}
                style={{
                    position: 'absolute',
                    left: '50%',
                    top: 0,
                    width: '2px',
                    height: 0,
                    background: `linear-gradient(to bottom, ${topicColor}, #1a1a2e)`,
                    transform: 'translateX(-50%)',
                    zIndex: 2,
                }}
            />

            {/* Sections */}
            {topic.rows.map((row, i) => {
                const isOdd = i % 2 === 0;
                const DiagramComponent = diagrams[row.animation];
                const alreadyAnswered = answeredSections?.includes(row.id);
                const state = assessmentState[i] || { show: false, animating: false };

                return (
                    <div
                        key={row.id}
                        style={{
                            display: 'flex',
                            flexDirection: isOdd ? 'row' : 'row-reverse',
                            marginBottom: '100px',
                            position: 'relative',
                            zIndex: 3,
                            minHeight: '200px',
                        }}
                    >
                        {/* Text side */}
                        <div style={{
                            flex: 1,
                            maxWidth: 'calc(50% - 48px)',
                            paddingRight: isOdd ? '32px' : undefined,
                            paddingLeft: isOdd ? undefined : '32px',
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
                            left: '50%',
                            top: '16px',
                            transform: 'translate(-50%, 0)',
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            border: '2px solid #e5e7eb',
                            background: '#f5f4f2',
                            color: '#bbb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            zIndex: 4,
                        }}>
                            {i + 1}
                        </div>

                        {/* Diagram side */}
                        <div style={{
                            flex: 1,
                            maxWidth: 'calc(50% - 48px)',
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
                justifyContent: 'center',
            }}>
                {/* Centre dot */}
                <div style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    background: topicColor,
                    position: 'relative',
                    zIndex: 2,
                }} />

                {/* Ripple rings */}
                {ringSizes.map((size, ri) => (
                    <div
                        key={ri}
                        style={{
                            position: 'absolute',
                            width: `${size}px`,
                            height: `${size}px`,
                            borderRadius: '50%',
                            border: `1.5px solid ${topicColor}`,
                            opacity: 0,
                        }}
                    />
                ))}
            </div>

            {/* Complete message */}
            <div style={{
                textAlign: 'center',
                paddingBottom: '4rem',
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
                    {answeredSections?.length || 0} of {topic.rows.length} sections covered
                </p>
            </div>

            {/* Placeholder keyframes for ripple animation (Task 4) */}
            <style>{`
                @keyframes spine-ripple {
                    0% { opacity: 0; transform: scale(0.8); }
                    50% { opacity: 0.3; }
                    100% { opacity: 0; transform: scale(1); }
                }
            `}</style>
        </div>
    );
}
