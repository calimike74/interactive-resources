'use client';

import { getHintsForTopic, hasHints } from '@/lib/examiner-hints';
import { withComponentPrefix } from '@/lib/topics';
import { theme, typography, spacing, borderRadius, editorial as ED } from '@/lib/theme';
import Popover from './Popover';

/**
 * Examiner hint badge — click to see curated examiner guidance for a topic.
 * Editorial style: single accent palette.
 *
 * @param {Object} props
 * @param {string} props.topicCode - Spec reference like '1.9'
 * @param {'top'|'bottom'|'left'|'right'} [props.position='top'] - Popover position
 */
export default function ExaminerHintBadge({ topicCode, position = 'top' }) {
    if (!hasHints(topicCode)) return null;

    const hints = getHintsForTopic(topicCode);
    const t = theme.light;
    const accentBg = ED.accentTint;
    const accentBorder = ED.accent;

    const badge = (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 22,
                height: 22,
                borderRadius: borderRadius.full,
                backgroundColor: accentBg,
                border: `1px solid ${accentBorder}40`,
                fontSize: typography.size.xs,
                fontWeight: typography.weight.semibold,
                color: accentBorder,
                lineHeight: 1,
                transition: 'background-color 150ms ease',
            }}
            title="Examiner hints available"
        >
            i
        </span>
    );

    return (
        <Popover trigger={badge} position={position}>
            {/* Flowbite header */}
            <div
                style={{
                    padding: `${spacing[2]} ${spacing[3]}`,
                    backgroundColor: accentBg,
                    borderBottom: `1px solid ${accentBorder}25`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <span
                    style={{
                        fontSize: typography.size.sm,
                        fontWeight: typography.weight.semibold,
                        color: t.text.primary,
                    }}
                >
                    Examiner says
                </span>
                <span
                    style={{
                        fontSize: typography.size.xs,
                        color: t.text.tertiary,
                        fontFamily: typography.fontFamilyMono,
                    }}
                >
                    {withComponentPrefix(topicCode)}
                </span>
            </div>

            {/* Body with hints */}
            <div style={{ padding: `${spacing[3]} ${spacing[3]}` }}>
                {hints.map((h, i) => (
                    <p
                        key={i}
                        style={{
                            margin: 0,
                            marginTop: i > 0 ? spacing[2] : 0,
                            paddingTop: i > 0 ? spacing[2] : 0,
                            borderTop: i > 0 ? `1px solid ${t.border.subtle}` : 'none',
                            fontSize: typography.size.sm,
                            lineHeight: typography.lineHeight.relaxed,
                            color: t.text.secondary,
                        }}
                    >
                        {h.hint}
                    </p>
                ))}
                <p
                    style={{
                        margin: 0,
                        marginTop: spacing[2],
                        paddingTop: spacing[2],
                        borderTop: `1px solid ${t.border.subtle}`,
                        fontSize: typography.size.xs,
                        fontStyle: 'italic',
                        color: t.text.tertiary,
                    }}
                >
                    From the 2025 Principal Examiner&rsquo;s reports (Edexcel 9MT0).
                </p>
            </div>
        </Popover>
    );
}
