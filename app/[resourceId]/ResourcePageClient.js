'use client';

import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getResource, resourceExists } from '@/lib/resources';
import { getTopicForResource, withComponentPrefix } from '@/lib/topics';
import { theme, typography, borderRadius, spacing, transitions, glass } from '@/lib/theme';
import { useStudioReturn } from '@/lib/studio-return';
import ExaminerHintBadge from '@/components/ui/ExaminerHintBadge';
import GateKeeper from '@/components/GateKeeper';

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
import CompressorCurvePractice from '@/components/resources/CompressorCurvePractice';
import EssayScaffoldPractice from '@/components/resources/EssayScaffoldPractice';
import DigitalAnalogue from '@/components/resources/DigitalAnalogue';
import AudioLeadsFlashcards from '@/components/resources/AudioLeadsFlashcards';
import CombinedDistortionLab from '@/components/resources/CombinedDistortionLab';
import StereoPanning from '@/components/resources/StereoPanning';
import ADCExplorer from '@/components/resources/ADCExplorer';
import SignalChainBuilder from '@/components/resources/SignalChainBuilder';
import SignalChainEurorack from '@/components/resources/SignalChainEurorack';
import CompressorImageExplorer from '@/components/resources/CompressorImageExplorer';
import CompressorAssessment from '@/components/resources/CompressorAssessment';
import GateImageExplorer from '@/components/resources/GateImageExplorer';
import GateAssessment from '@/components/resources/GateAssessment';
import AutoFilterImageExplorer from '@/components/resources/AutoFilterImageExplorer';
import AutoFilterAssessment from '@/components/resources/AutoFilterAssessment';
import EQ8ImageExplorer from '@/components/resources/EQ8ImageExplorer';
import EQ8Assessment from '@/components/resources/EQ8Assessment';
import ReverbImageExplorer from '@/components/resources/ReverbImageExplorer';
import ReverbAssessment from '@/components/resources/ReverbAssessment';
import DelayImageExplorer from '@/components/resources/DelayImageExplorer';
import DelayAssessment from '@/components/resources/DelayAssessment';
import DelayFlashcards from '@/components/resources/DelayFlashcards';
import OperatorImageExplorer from '@/components/resources/OperatorImageExplorer';
import OperatorAssessment from '@/components/resources/OperatorAssessment';
import PatchBaySimulator from '@/components/resources/PatchBaySimulator';
import SamplingPlayground from '@/components/resources/SamplingPlayground';
import ReadThenQuiz from '@/components/resources/ReadThenQuiz/ReadThenQuiz';
import WaveformExplorer from '@/components/resources/WaveformExplorer';
import WaveformDrawingAssessment from '@/components/resources/WaveformDrawingAssessment';
import DelayBench from '@/components/resources/DelayBench';
import BPMDelayCalculator from '@/components/resources/BPMDelayCalculator';
import DigitalAudioAssessment from '@/components/resources/DigitalAudioAssessment';
import PitchSynthMonitorsAssessment from '@/components/resources/PitchSynthMonitorsAssessment';
import LevelsMeteringAssessment from '@/components/resources/LevelsMeteringAssessment';
import MIDIBinaryAssessment from '@/components/resources/MIDIBinaryAssessment';
import AcousticsPsychoacoustics from '@/components/resources/AcousticsPsychoacoustics';
import MixingProduction from '@/components/resources/MixingProduction';
import ProductionAnalysis from '@/components/resources/ProductionAnalysis';
import AdditiveSynthExplorer from '@/components/resources/AdditiveSynthExplorer';

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
    'CompressorCurvePractice': CompressorCurvePractice,
    'EssayScaffoldPractice': EssayScaffoldPractice,
    'DigitalAnalogue': DigitalAnalogue,
    'AudioLeadsFlashcards': AudioLeadsFlashcards,
    'CombinedDistortionLab': CombinedDistortionLab,
    'StereoPanning': StereoPanning,
    'ADCExplorer': ADCExplorer,
    'SignalChainBuilder': SignalChainBuilder,
    'SignalChainEurorack': SignalChainEurorack,
    'CompressorImageExplorer': CompressorImageExplorer,
    'CompressorAssessment': CompressorAssessment,
    'GateImageExplorer': GateImageExplorer,
    'GateAssessment': GateAssessment,
    'AutoFilterImageExplorer': AutoFilterImageExplorer,
    'AutoFilterAssessment': AutoFilterAssessment,
    'EQ8ImageExplorer': EQ8ImageExplorer,
    'EQ8Assessment': EQ8Assessment,
    'ReverbImageExplorer': ReverbImageExplorer,
    'ReverbAssessment': ReverbAssessment,
    'DelayImageExplorer': DelayImageExplorer,
    'DelayAssessment': DelayAssessment,
    'DelayFlashcards': DelayFlashcards,
    'OperatorImageExplorer': OperatorImageExplorer,
    'OperatorAssessment': OperatorAssessment,
    'PatchBaySimulator': PatchBaySimulator,
    'SamplingPlayground': SamplingPlayground,
    'ReadThenQuiz': ReadThenQuiz,
    'WaveformExplorer': WaveformExplorer,
    'WaveformDrawingAssessment': WaveformDrawingAssessment,
    'DelayBench': DelayBench,
    'BPMDelayCalculator': BPMDelayCalculator,
    'DigitalAudioAssessment': DigitalAudioAssessment,
    'PitchSynthMonitorsAssessment': PitchSynthMonitorsAssessment,
    'LevelsMeteringAssessment': LevelsMeteringAssessment,
    'MIDIBinaryAssessment': MIDIBinaryAssessment,
    'AcousticsPsychoacoustics': AcousticsPsychoacoustics,
    'MixingProduction': MixingProduction,
    'ProductionAnalysis': ProductionAnalysis,
    'AdditiveSynthExplorer': AdditiveSynthExplorer,
    // Add more as resources are added:
    // 'ADSRInteractive': ADSRInteractive,
};

// Dynamic Resource Page
// Loads the appropriate resource component based on URL
export default function ResourcePageClient() {
    const params = useParams();
    const pathname = usePathname();
    const resourceId = params.resourceId;
    const t = theme.light;

    // The one way out of a bench (Mike, 2026-08-20). It used to be this
    // site's own topic index, with a Home crumb beside it — see
    // lib/studio-return.js for why both are gone. Hooks run before the
    // resourceExists bail-out below, as the rules of hooks require.
    const back = useStudioReturn(pathname);

    // Check if resource exists
    if (!resourceExists(resourceId)) {
        return <ResourceNotFound resourceId={resourceId} theme={t} back={back} />;
    }

    const resource = getResource(resourceId);
    const parentTopic = getTopicForResource(resourceId);
    const ResourceComponent = resourceComponents[resource.component];
    const hasRecap = Boolean(resource.learningObjectives?.length);

    // Related assessment: link internally, and only when the prepFor slug
    // resolves to a real registered resource. No dead pill is better than
    // any dead link — the external assessment subdomain this used to point
    // at has no DNS record.
    const prepForId = resource.prepFor && resource.prepFor.length > 0 ? resource.prepFor[0] : null;
    const assessmentHref = prepForId && resourceExists(prepForId) ? `/${prepForId}` : null;

    // Handle missing component
    if (!ResourceComponent) {
        return <ComponentNotFound resource={resource} theme={t} back={back} />;
    }

    // A bench (Bench Standard, 2026-08-21) fills the viewport and draws its
    // own header strip, with the way home inside it. No site header above
    // it, no recap footer below: one screen, nothing to scroll to.
    if (resource.kind === 'bench') {
        return (
            <main>
                <GateKeeper resourceId={resource.id} title={resource.title}>
                    <ResourceComponent back={back} resource={resource} />
                </GateKeeper>
            </main>
        );
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
                    background: glass.bg,
                    backdropFilter: 'blur(' + glass.blur + ')',
                    WebkitBackdropFilter: 'blur(' + glass.blur + ')',
                    borderBottom: `1px solid ${glass.border}`,
                    boxShadow: glass.shadow,
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
                    {/* The way out: home to the studio, never into this site */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing[4] }}>
                        <a
                            href={back.href}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: spacing[2],
                                color: t.text.secondary,
                                textDecoration: 'none',
                                fontSize: typography.size.sm,
                                padding: `${spacing[2]} ${spacing[3]}`,
                                borderRadius: glass.radiusPill,
                                background: glass.bg,
                                backdropFilter: 'blur(8px)',
                                WebkitBackdropFilter: 'blur(8px)',
                                border: '1px solid ' + glass.border,
                                boxShadow: glass.iconShadow,
                                transition: `all ${transitions.fast}`,
                            }}
                        >
                            {back.label}
                        </a>

                        {/* Topic badge + examiner hint */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                            <span
                                style={{
                                    background: 'rgba(37, 99, 235, 0.12)',
                                    color: t.accent.info,
                                    padding: `${spacing[1]} ${spacing[3]}`,
                                    borderRadius: borderRadius.full,
                                    fontSize: typography.size.xs,
                                    fontWeight: typography.weight.medium,
                                    backdropFilter: 'blur(8px)',
                                    border: '1px solid rgba(37, 99, 235, 0.2)',
                                }}
                            >
                                {withComponentPrefix(resource.topic)}
                            </span>
                            {parentTopic && (
                                <ExaminerHintBadge
                                    topicCode={parentTopic.specRef}
                                    position="bottom"
                                />
                            )}
                        </div>
                    </div>

                    {/* Related assessment link */}
                    {assessmentHref && (
                        <Link
                            href={assessmentHref}
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
                        </Link>
                    )}
                </div>
            </header>

            {/* No breadcrumb here on purpose: its Home crumb led to the
                Interactive Resources front page, and its topic crumb to that
                site's resource index. See lib/studio-return.js. */}

            {/* Resource Content — gated when the September soft gate is on and
                this resource is not in the free set; see lib/gate.js. */}
            <main>
                <GateKeeper resourceId={resource.id} title={resource.title}>
                    <ResourceComponent />
                </GateKeeper>
            </main>

            {/* Footer. Only drawn when it has something to say: with the
                repeated way home gone, a bench with no recap and no
                assessment would otherwise end on an empty ruled band. */}
            {(hasRecap || assessmentHref) && (
            <footer
                style={{
                    background: glass.bg,
                    backdropFilter: 'blur(' + glass.blur + ')',
                    WebkitBackdropFilter: 'blur(' + glass.blur + ')',
                    borderTop: `1px solid ${glass.border}`,
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
                    {hasRecap && (
                        <div style={{ marginBottom: assessmentHref ? spacing[6] : 0 }}>
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

                    {/* Next steps. No way home repeated here (Mike, 2026-08-20):
                        the header is sticky, so its "Back to your studio" is
                        already on screen at the bottom of the page. Saying it
                        twice a scroll apart is one time too many. */}
                    {assessmentHref && (
                        <div
                            style={{
                                display: 'flex',
                                gap: spacing[4],
                                flexWrap: 'wrap',
                            }}
                        >
                            <Link
                                href={assessmentHref}
                                style={{
                                    padding: `${spacing[3]} ${spacing[5]}`,
                                    background: glass.bgPrimary,
                                    backdropFilter: 'blur(' + glass.blur + ')',
                                    WebkitBackdropFilter: 'blur(' + glass.blur + ')',
                                    boxShadow: glass.shadowPrimary,
                                    border: '1px solid ' + glass.border,
                                    color: t.text.inverse,
                                    borderRadius: borderRadius.lg,
                                    textDecoration: 'none',
                                    fontSize: typography.size.sm,
                                    fontWeight: typography.weight.medium,
                                }}
                            >
                                Ready? Take the Assessment →
                            </Link>
                        </div>
                    )}
                </div>
            </footer>
            )}
        </div>
    );
}

// 404 - Resource not found
function ResourceNotFound({ resourceId, theme: t, back }) {
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
                    background: glass.bg,
                    backdropFilter: 'blur(' + glass.blur + ')',
                    WebkitBackdropFilter: 'blur(' + glass.blur + ')',
                    border: '1px solid ' + glass.border,
                    borderRadius: borderRadius['2xl'],
                    padding: spacing[10],
                    maxWidth: '480px',
                    textAlign: 'center',
                    boxShadow: glass.shadowHover,
                }}
            >
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
                <a
                    href={back.href}
                    style={{
                        display: 'inline-block',
                        padding: `${spacing[3]} ${spacing[6]}`,
                        background: glass.bgPrimary,
                        backdropFilter: 'blur(' + glass.blur + ')',
                        WebkitBackdropFilter: 'blur(' + glass.blur + ')',
                        boxShadow: glass.shadowPrimary,
                        border: '1px solid ' + glass.border,
                        color: t.text.inverse,
                        borderRadius: borderRadius.lg,
                        textDecoration: 'none',
                        fontWeight: typography.weight.medium,
                    }}
                >
                    {back.label}
                </a>
            </div>
        </div>
    );
}

// Component not yet implemented
function ComponentNotFound({ resource, theme: t, back }) {
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
                    background: glass.bg,
                    backdropFilter: 'blur(' + glass.blur + ')',
                    WebkitBackdropFilter: 'blur(' + glass.blur + ')',
                    border: '1px solid ' + glass.border,
                    borderRadius: borderRadius['2xl'],
                    padding: spacing[10],
                    maxWidth: '480px',
                    textAlign: 'center',
                    boxShadow: glass.shadowHover,
                }}
            >
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
                <a
                    href={back.href}
                    style={{
                        display: 'inline-block',
                        padding: `${spacing[3]} ${spacing[6]}`,
                        background: glass.bgPrimary,
                        backdropFilter: 'blur(' + glass.blur + ')',
                        WebkitBackdropFilter: 'blur(' + glass.blur + ')',
                        boxShadow: glass.shadowPrimary,
                        border: '1px solid ' + glass.border,
                        color: t.text.inverse,
                        borderRadius: borderRadius.lg,
                        textDecoration: 'none',
                        fontWeight: typography.weight.medium,
                    }}
                >
                    {back.label}
                </a>
            </div>
        </div>
    );
}
