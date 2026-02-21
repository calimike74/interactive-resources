'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getResource, resourceExists } from '@/lib/resources';
import { getTopicForResource } from '@/lib/topics';
import { theme, typography, borderRadius, spacing, transitions } from '@/lib/theme';

// Resource components registry
// Add new components here as they're created
import EQFilterBridge from '@/components/resources/EQFilterBridge';
import OctavePeriodTrainer from '@/components/resources/OctavePeriodTrainer';
import MIDIPitchBendController from '@/components/resources/MIDIPitchBendController';
import FilterRolloffVisualization from '@/components/resources/FilterRolloffVisualization';
import AcousticsFlashcards from '@/components/resources/AcousticsFlashcards';
import DoubleTrackingExplorer from '@/components/resources/DoubleTrackingExplorer';
import GraphicParametricEQ from '@/components/resources/GraphicParametricEQ';
import RevealExplorer from '@/components/resources/RevealExplorer';
import EQAssessmentPrototype from '@/components/resources/EQAssessmentPrototype';
import EssayScaffold from '@/components/resources/EssayScaffold';
import SubtractiveSynthExplorer from '@/components/resources/SubtractiveSynthExplorer';
import StereoRecordingEssay from '@/components/resources/StereoRecordingEssay';
import CompressorExplorer from '@/components/resources/CompressorExplorer';
import EssayScaffoldPractice from '@/components/resources/EssayScaffoldPractice';

const resourceComponents = {
    'EQFilterBridge': EQFilterBridge,
    'OctavePeriodTrainer': OctavePeriodTrainer,
    'MIDIPitchBendController': MIDIPitchBendController,
    'FilterRolloffVisualization': FilterRolloffVisualization,
    'AcousticsFlashcards': AcousticsFlashcards,
    'DoubleTrackingExplorer': DoubleTrackingExplorer,
    'GraphicParametricEQ': GraphicParametricEQ,
    'RevealExplorer': RevealExplorer,
    'EQAssessmentPrototype': EQAssessmentPrototype,
    'EssayScaffold': EssayScaffold,
    'SubtractiveSynthExplorer': SubtractiveSynthExplorer,
    'StereoRecordingEssay': StereoRecordingEssay,
    'CompressorExplorer': CompressorExplorer,
    'EssayScaffoldPractice': EssayScaffoldPractice,
    // Add more as resources are added:
    // 'ADSRInteractive': ADSRInteractive,
};

// Dynamic Resource Page
// Loads the appropriate resource component based on URL
export default function ResourcePageClient() {
    const params = useParams();
    const resourceId = params.resourceId;
    const t = theme.light;

    // Check if resource exists
    if (!resourceExists(resourceId)) {
        return <ResourceNotFound resourceId={resourceId} theme={t} />;
    }

    const resource = getResource(resourceId);
    const parentTopic = getTopicForResource(resourceId);
    const backHref = parentTopic ? `/topic/${parentTopic.id}` : '/';
    const backLabel = parentTopic ? `← ${parentTopic.name}` : '← Back to Resources';
    const ResourceComponent = resourceComponents[resource.component];

    // Handle missing component
    if (!ResourceComponent) {
        return <ComponentNotFound resource={resource} theme={t} />;
    }

    return (
        <div
            style={{
                minHeight: '100vh',
                background: t.bg.secondary,
                fontFamily: typography.fontFamily,
            }}
        >
            {/* Navigation Header */}
            <header
                style={{
                    background: t.bg.primary,
                    borderBottom: `1px solid ${t.border.subtle}`,
                    padding: `${spacing[4]} ${spacing[8]}`,
                    position: 'sticky',
                    top: 0,
                    zIndex: 100,
                }}
            >
                <div
                    style={{
                        maxWidth: '1200px',
                        margin: '0 auto',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: spacing[4],
                    }}
                >
                    {/* Back link and breadcrumb */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing[4] }}>
                        <Link
                            href={backHref}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: spacing[2],
                                color: t.text.secondary,
                                textDecoration: 'none',
                                fontSize: typography.size.sm,
                                padding: `${spacing[2]} ${spacing[3]}`,
                                borderRadius: borderRadius.md,
                                background: t.bg.tertiary,
                                transition: `all ${transitions.fast}`,
                            }}
                        >
                            {backLabel}
                        </Link>

                        {/* Topic badge */}
                        <span
                            style={{
                                background: t.accent.infoLight,
                                color: t.accent.info,
                                padding: `${spacing[1]} ${spacing[3]}`,
                                borderRadius: borderRadius.full,
                                fontSize: typography.size.xs,
                                fontWeight: typography.weight.medium,
                            }}
                        >
                            {resource.topic}
                        </span>
                    </div>

                    {/* Related assessment link */}
                    {resource.prepFor && resource.prepFor.length > 0 && (
                        <a
                            href={`https://waveform-assessment.vercel.app/${resource.prepFor[0]}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: spacing[2],
                                color: t.accent.primary,
                                textDecoration: 'none',
                                fontSize: typography.size.sm,
                                fontWeight: typography.weight.medium,
                            }}
                        >
                            Take the Assessment →
                        </a>
                    )}
                </div>
            </header>

            {/* Resource Content */}
            <main>
                <ResourceComponent />
            </main>

            {/* Footer */}
            <footer
                style={{
                    background: t.bg.primary,
                    borderTop: `1px solid ${t.border.subtle}`,
                    padding: `${spacing[8]} ${spacing[8]}`,
                }}
            >
                <div
                    style={{
                        maxWidth: '800px',
                        margin: '0 auto',
                    }}
                >
                    {/* Learning objectives recap */}
                    {resource.learningObjectives && resource.learningObjectives.length > 0 && (
                        <div style={{ marginBottom: spacing[6] }}>
                            <h3
                                style={{
                                    fontSize: typography.size.lg,
                                    fontWeight: typography.weight.semibold,
                                    color: t.text.primary,
                                    marginBottom: spacing[3],
                                }}
                            >
                                What you learned
                            </h3>
                            <ul
                                style={{
                                    listStyle: 'none',
                                    padding: 0,
                                    margin: 0,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: spacing[2],
                                }}
                            >
                                {resource.learningObjectives.map((objective, index) => (
                                    <li
                                        key={index}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: spacing[2],
                                            color: t.text.secondary,
                                            fontSize: typography.size.sm,
                                        }}
                                    >
                                        <span style={{ color: t.accent.success }}>✓</span>
                                        {objective}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Next steps */}
                    <div
                        style={{
                            display: 'flex',
                            gap: spacing[4],
                            flexWrap: 'wrap',
                        }}
                    >
                        <Link
                            href={backHref}
                            style={{
                                padding: `${spacing[3]} ${spacing[5]}`,
                                background: t.bg.tertiary,
                                color: t.text.primary,
                                borderRadius: borderRadius.lg,
                                textDecoration: 'none',
                                fontSize: typography.size.sm,
                                fontWeight: typography.weight.medium,
                            }}
                        >
                            {backLabel}
                        </Link>

                        {resource.prepFor && resource.prepFor.length > 0 && (
                            <a
                                href={`https://waveform-assessment.vercel.app/${resource.prepFor[0]}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    padding: `${spacing[3]} ${spacing[5]}`,
                                    background: t.accent.primary,
                                    color: t.text.inverse,
                                    borderRadius: borderRadius.lg,
                                    textDecoration: 'none',
                                    fontSize: typography.size.sm,
                                    fontWeight: typography.weight.medium,
                                }}
                            >
                                Ready? Take the Assessment →
                            </a>
                        )}
                    </div>
                </div>
            </footer>
        </div>
    );
}

// 404 - Resource not found
function ResourceNotFound({ resourceId, theme: t }) {
    return (
        <div
            style={{
                minHeight: '100vh',
                background: t.bg.secondary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: spacing[8],
                fontFamily: typography.fontFamily,
            }}
        >
            <div
                style={{
                    background: t.bg.primary,
                    borderRadius: borderRadius['2xl'],
                    padding: spacing[10],
                    maxWidth: '480px',
                    textAlign: 'center',
                    boxShadow: t.shadow.lg,
                }}
            >
                <div style={{ fontSize: '4rem', marginBottom: spacing[4] }}>🔍</div>
                <h1
                    style={{
                        fontSize: typography.size['2xl'],
                        fontWeight: typography.weight.bold,
                        color: t.text.primary,
                        marginBottom: spacing[2],
                    }}
                >
                    Resource Not Found
                </h1>
                <p
                    style={{
                        color: t.text.secondary,
                        marginBottom: spacing[6],
                    }}
                >
                    We couldn't find a resource with ID "{resourceId}".
                </p>
                <Link
                    href="/"
                    style={{
                        display: 'inline-block',
                        padding: `${spacing[3]} ${spacing[6]}`,
                        background: t.accent.primary,
                        color: t.text.inverse,
                        borderRadius: borderRadius.lg,
                        textDecoration: 'none',
                        fontWeight: typography.weight.medium,
                    }}
                >
                    Browse All Resources
                </Link>
            </div>
        </div>
    );
}

// Component not yet implemented
function ComponentNotFound({ resource, theme: t }) {
    return (
        <div
            style={{
                minHeight: '100vh',
                background: t.bg.secondary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: spacing[8],
                fontFamily: typography.fontFamily,
            }}
        >
            <div
                style={{
                    background: t.bg.primary,
                    borderRadius: borderRadius['2xl'],
                    padding: spacing[10],
                    maxWidth: '480px',
                    textAlign: 'center',
                    boxShadow: t.shadow.lg,
                }}
            >
                <div style={{ fontSize: '4rem', marginBottom: spacing[4] }}>🚧</div>
                <h1
                    style={{
                        fontSize: typography.size['2xl'],
                        fontWeight: typography.weight.bold,
                        color: t.text.primary,
                        marginBottom: spacing[2],
                    }}
                >
                    Coming Soon
                </h1>
                <p
                    style={{
                        color: t.text.secondary,
                        marginBottom: spacing[6],
                    }}
                >
                    "{resource.title}" is being prepared and will be available soon.
                </p>
                <Link
                    href="/"
                    style={{
                        display: 'inline-block',
                        padding: `${spacing[3]} ${spacing[6]}`,
                        background: t.accent.primary,
                        color: t.text.inverse,
                        borderRadius: borderRadius.lg,
                        textDecoration: 'none',
                        fontWeight: typography.weight.medium,
                    }}
                >
                    Browse Available Resources
                </Link>
            </div>
        </div>
    );
}
