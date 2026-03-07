'use client';

import { useState, useRef, useCallback } from 'react';
import Quiz from './Quiz';
import { saveSectionResponse } from '@/lib/learn/section-persistence';
import { theme, typography, spacing, borderRadius, transitions } from '@/lib/theme';

const t = theme.light;

export default function SectionAssessment({
  assessment,
  topicId,
  sectionId,
  topicColor,
  studentToken,
  alreadyAnswered,
  onComplete,
}) {
  const [completed, setCompleted] = useState(false);
  const [result, setResult] = useState(null);
  const startTimeRef = useRef(Date.now());

  const handleQuizComplete = useCallback(async ({ correct, selectedIndex }) => {
    const timeTaken = Date.now() - startTimeRef.current;

    setResult({ correct });
    setCompleted(true);

    if (studentToken) {
      await saveSectionResponse({
        studentToken,
        topicId,
        sectionId,
        questionId: assessment.id,
        selectedIndex,
        correct,
        timeTakenMs: timeTaken,
      });
    }

    if (onComplete) onComplete({ correct });
  }, [assessment.id, topicId, sectionId, studentToken, onComplete]);

  if (alreadyAnswered && !completed) {
    return (
      <div style={{
        padding: `${spacing[3]} ${spacing[4]}`,
        borderRadius: borderRadius.lg,
        background: t.accent.successLight,
        borderLeft: `4px solid ${t.accent.success}`,
        fontSize: typography.size.sm,
        color: t.accent.success,
        fontWeight: typography.weight.medium,
      }}>
        You've already answered this section's question.
      </div>
    );
  }

  if (completed && result) {
    return (
      <div style={{
        padding: `${spacing[3]} ${spacing[4]}`,
        borderRadius: borderRadius.lg,
        background: result.correct ? t.accent.successLight : t.accent.errorLight,
        borderLeft: `4px solid ${result.correct ? t.accent.success : t.accent.error}`,
        fontSize: typography.size.sm,
        color: result.correct ? t.accent.success : t.accent.error,
        fontWeight: typography.weight.medium,
      }}>
        {result.correct ? 'Well done — you applied that concept correctly.' : 'Good attempt — review the explanation above and try the next section.'}
      </div>
    );
  }

  return (
    <div style={{
      padding: spacing[5],
      borderRadius: borderRadius.xl,
      background: 'white',
      border: `1px solid ${t.border.subtle}`,
      boxShadow: t.shadow.sm,
    }}>
      <div style={{
        display: 'inline-block',
        padding: '0.2rem 0.6rem',
        borderRadius: borderRadius.full,
        background: topicColor + '12',
        color: topicColor,
        fontSize: typography.size.xs,
        fontWeight: typography.weight.semibold,
        marginBottom: spacing[3],
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}>
        Check Understanding
      </div>
      <Quiz data={assessment} onComplete={handleQuizComplete} />
    </div>
  );
}
