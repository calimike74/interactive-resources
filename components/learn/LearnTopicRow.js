'use client';

import { useEffect, useRef, useState } from 'react';
import diagrams from './diagrams';
import SectionAssessment from './SectionAssessment';

export default function LearnTopicRow({ row, index, topicColor, topicId, studentToken, answeredSections }) {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);
    const [showAssessment, setShowAssessment] = useState(false);
    const [animating, setAnimating] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    observer.unobserve(el);
                }
            },
            { threshold: 0.15 }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const handleToggleAssessment = () => {
        if (!showAssessment) {
            setShowAssessment(true);
            requestAnimationFrame(() => setAnimating(true));
        } else {
            setAnimating(false);
            setTimeout(() => setShowAssessment(false), 300);
        }
    };

    const DiagramComponent = diagrams[row.animation];
    const isReversed = index % 2 === 1;
    const alreadyAnswered = answeredSections?.includes(row.id);

    const textBlock = (
        <div style={{ position: 'relative', minHeight: showAssessment ? '200px' : 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
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
                    {String(index + 1).padStart(2, '0')}
                </div>
                {row.assessment && (
                    <button
                        onClick={handleToggleAssessment}
                        style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            border: `1.5px solid ${alreadyAnswered ? '#059669' : topicColor}`,
                            background: alreadyAnswered ? '#D1FAE5' : showAssessment ? topicColor + '15' : 'transparent',
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
                        {alreadyAnswered ? '\u2713' : showAssessment ? '\u00d7' : '?'}
                    </button>
                )}
            </div>

            <div style={{
                opacity: showAssessment ? 0 : 1,
                transform: showAssessment ? 'translateY(-8px)' : 'translateY(0)',
                transition: 'opacity 0.25s ease, transform 0.25s ease',
                pointerEvents: showAssessment ? 'none' : 'auto',
                position: showAssessment ? 'absolute' : 'relative',
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

                <p style={{
                    fontSize: '1rem',
                    color: '#374151',
                    lineHeight: 1.65,
                }}>
                    {row.description}
                </p>
            </div>

            {row.assessment && showAssessment && (
                <div style={{
                    transformOrigin: 'top left',
                    transform: animating ? 'scale(1)' : 'scale(0.85)',
                    opacity: animating ? 1 : 0,
                    transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease',
                }}>
                    <SectionAssessment
                        assessment={row.assessment}
                        topicId={topicId}
                        sectionId={row.id}
                        topicColor={topicColor}
                        studentToken={studentToken}
                        alreadyAnswered={alreadyAnswered}
                        onComplete={() => {}}
                    />
                </div>
            )}
        </div>
    );

    const diagramBlock = (
        <div style={{
            background: '#fafafa',
            borderRadius: '0.75rem',
            border: '1px solid #E5E7EB',
            aspectRatio: '480 / 280',
            overflow: 'hidden',
        }}>
            {DiagramComponent && visible && <DiagramComponent />}
        </div>
    );

    return (
        <div
            ref={ref}
            className="topic-row"
            style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1.2fr',
                gap: '2.5rem',
                alignItems: 'center',
                padding: '2.5rem 0',
                borderBottom: '1px solid #E5E7EB',
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(24px)',
                transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
            }}
        >
            {isReversed ? diagramBlock : textBlock}
            {isReversed ? textBlock : diagramBlock}
        </div>
    );
}
