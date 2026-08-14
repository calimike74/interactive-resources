'use client';

import Link from 'next/link';
import { typography, borderRadius, spacing, glass, editorial as ED } from '@/lib/theme';
import { getTopic, withComponentPrefix } from '@/lib/topics';

/**
 * The honest empty state for a spec topic with no interactive tools yet.
 *
 * Mike's ruling, 2026-08-12: every C4 spec topic gets a visible band; the
 * ones with nothing built read as a roadmap, not a hole — "if a teacher saw
 * this in the next ten days and thought, 'Okay, that's coming.'" No
 * apology-speak, no empty shelf.
 *
 * Scoped to the Explore door deliberately — a topic can have this state for
 * its tools while its Walkthrough and Practice quiz are already live (1.4
 * Sampling has five Learn chapters and a full question bank), so this never
 * claims the whole topic is empty, only that the tools are still being built.
 */
export default function InBuildBand({ topic }) {
    const nearest = topic.nearestLiveTopicId ? getTopic(topic.nearestLiveTopicId) : null;

    return (
        <div
            style={{
                background: glass.bg,
                backdropFilter: `blur(${glass.blur})`,
                WebkitBackdropFilter: `blur(${glass.blur})`,
                borderRadius: borderRadius.xl,
                border: `1px solid ${ED.rule}`,
                padding: `${spacing[7]} ${spacing[7]}`,
                boxShadow: glass.shadow,
            }}
        >
            <span
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontFamily: ED.mono,
                    fontSize: '10px',
                    fontWeight: 600,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: '#a8541a',
                    background: 'rgba(168, 84, 26, 0.09)',
                    border: '1px solid rgba(168, 84, 26, 0.22)',
                    borderRadius: borderRadius.full,
                    padding: '5px 12px',
                    marginBottom: spacing[4],
                }}
            >
                <span aria-hidden="true" style={{ fontSize: '13px', lineHeight: 1 }}>●</span>
                In build: arriving this term
            </span>

            {topic.specSummary && topic.specSummary.length > 0 && (
                <>
                    <h3
                        style={{
                            fontFamily: ED.serif,
                            fontStyle: 'italic',
                            fontWeight: 400,
                            fontSize: '19px',
                            color: ED.ink,
                            margin: `0 0 ${spacing[3]}`,
                        }}
                    >
                        What {withComponentPrefix(topic.specRef)} {topic.name} covers
                    </h3>
                    <ul
                        style={{
                            listStyle: 'none',
                            padding: 0,
                            margin: `0 0 ${spacing[5]} 0`,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: spacing[2],
                        }}
                    >
                        {topic.specSummary.map((item, i) => (
                            <li
                                key={i}
                                style={{
                                    display: 'flex',
                                    gap: spacing[3],
                                    color: ED.inkSoft,
                                    fontFamily: ED.sans,
                                    fontSize: '14px',
                                    lineHeight: 1.55,
                                }}
                            >
                                <span aria-hidden="true" style={{ color: ED.accent, flexShrink: 0 }}>→</span>
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </>
            )}

            <p
                style={{
                    fontFamily: ED.sans,
                    fontSize: '13px',
                    color: ED.inkFade,
                    margin: 0,
                    paddingTop: spacing[4],
                    borderTop: `1px dashed ${ED.ruleSoft}`,
                }}
            >
                The interactive tools for this topic are still being built. The exam content above is the
                real spec: nothing here is a placeholder for the sake of it.
                {nearest && (
                    <>
                        {' '}Meanwhile,{' '}
                        <Link
                            href={`/topic/${nearest.id}`}
                            style={{ color: ED.accent, fontWeight: 600, textDecoration: 'none' }}
                        >
                            {withComponentPrefix(nearest.specRef)} {nearest.name} →
                        </Link>
                    </>
                )}
            </p>
        </div>
    );
}
