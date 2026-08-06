'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { theme, typography, spacing, transitions } from '@/lib/theme';
import { getTopic, getTopicForResource } from '@/lib/topics';
import { getResource } from '@/lib/resources';
import { getLearnLesson } from '@/lib/learn/topics';

/**
 * Breadcrumb navigation component.
 * Resolves route segments to human-readable names using data registries.
 * Hidden on the home page (/).
 */
export default function Breadcrumbs() {
    const pathname = usePathname();
    const t = theme.light;

    // Don't render on home page
    if (!pathname || pathname === '/') return null;

    const crumbs = buildCrumbs(pathname);

    // Don't render if we only have "Home" (shouldn't happen given the / check, but safe)
    if (crumbs.length <= 1) return null;

    return (
        <nav
            aria-label="Breadcrumb"
            style={{
                maxWidth: '1200px',
                margin: '0 auto',
                padding: `${spacing[3]} ${spacing[6]}`,
            }}
        >
            <ol
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: spacing[1],
                    listStyle: 'none',
                    margin: 0,
                    padding: 0,
                    fontSize: typography.size.sm,
                    lineHeight: typography.lineHeight.normal,
                }}
            >
                {crumbs.map((crumb, index) => {
                    const isLast = index === crumbs.length - 1;
                    return (
                        <li
                            key={`${index}-${crumb.label}`}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: spacing[1],
                            }}
                        >
                            {index > 0 && (
                                <span
                                    aria-hidden="true"
                                    style={{
                                        color: t.text.tertiary,
                                        fontSize: '0.7em',
                                        userSelect: 'none',
                                    }}
                                >
                                    ›
                                </span>
                            )}
                            {isLast ? (
                                <span
                                    aria-current="page"
                                    style={{
                                        color: t.text.primary,
                                        fontWeight: typography.weight.semibold,
                                    }}
                                >
                                    {crumb.label}
                                </span>
                            ) : (
                                <BreadcrumbLink href={crumb.href} label={crumb.label} />
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}

function BreadcrumbLink({ href, label }) {
    const [hovered, setHovered] = useState(false);
    const t = theme.light;

    return (
        <Link
            href={href}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                color: t.text.tertiary,
                textDecoration: hovered ? 'underline' : 'none',
                transition: `color ${transitions.fast} ${transitions.easing}`,
            }}
        >
            {label}
        </Link>
    );
}

/**
 * Build breadcrumb segments from the current pathname.
 * Resolves topic names, resource titles, and lesson titles from data registries.
 */
function buildCrumbs(pathname) {
    const segments = pathname.split('/').filter(Boolean);
    const crumbs = [{ label: 'Home', href: '/' }];

    // /topic/[topicId]
    if (segments[0] === 'topic' && segments[1]) {
        const topic = getTopic(segments[1]);
        crumbs.push({
            label: topic ? topic.name : segments[1],
            href: `/topic/${segments[1]}`,
        });
        return crumbs;
    }

    // /learn/[topicId] or /learn/[topicId]/[lessonId]
    if (segments[0] === 'learn' && segments[1]) {
        const topic = getTopic(segments[1]);
        crumbs.push({ label: 'Walkthrough', href: '/' });

        if (topic) {
            crumbs.push({
                label: topic.name,
                href: `/learn/${segments[1]}`,
            });
        } else {
            crumbs.push({
                label: segments[1],
                href: `/learn/${segments[1]}`,
            });
        }

        // /learn/[topicId]/[lessonId]
        if (segments[2]) {
            const lesson = getLearnLesson(segments[1], segments[2]);
            crumbs.push({
                label: lesson ? lesson.title : segments[2],
                href: `/learn/${segments[1]}/${segments[2]}`,
            });
        }

        return crumbs;
    }

    // /revise/[topicId]
    if (segments[0] === 'revise' && segments[1]) {
        const topic = getTopic(segments[1]);
        crumbs.push({ label: 'Practice quiz', href: '/' });
        crumbs.push({
            label: topic ? topic.name : segments[1],
            href: `/revise/${segments[1]}`,
        });
        return crumbs;
    }

    // /[resourceId] — individual resource page
    if (segments.length === 1) {
        const resourceId = segments[0];
        const resource = getResource(resourceId);
        const parentTopic = getTopicForResource(resourceId);

        if (parentTopic) {
            crumbs.push({
                label: parentTopic.name,
                href: `/topic/${parentTopic.id}`,
            });
        }

        crumbs.push({
            label: resource ? resource.title : resourceId,
            href: `/${resourceId}`,
        });
        return crumbs;
    }

    // Fallback: just use raw segments
    let builtPath = '';
    for (const seg of segments) {
        builtPath += `/${seg}`;
        crumbs.push({ label: seg, href: builtPath });
    }

    return crumbs;
}
