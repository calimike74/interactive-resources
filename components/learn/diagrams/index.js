'use client';

// Diagram component registry — maps animation IDs from topic data to React components
import FrequencySpectrum from './FrequencySpectrum';
import GraphicEQ from './GraphicEQ';
import OctaveBands from './OctaveBands';
import ParametricEQ from './ParametricEQ';
import QFactor from './QFactor';
import Routing from './Routing';
import Comparison from './Comparison';
import SubtractiveConcept from './SubtractiveConcept';
import WhatIsSound from './WhatIsSound';
import HarmonicSeries from './HarmonicSeries';
import TimbreComparison from './TimbreComparison';
import OscillatorWaveforms from './OscillatorWaveforms';
import FilterTypes from './FilterTypes';
import Resonance from './Resonance';
import FilterEnvelope from './FilterEnvelope';
import AmpEnvelope from './AmpEnvelope';
import EnvelopeConcept from './EnvelopeConcept';
import EnvelopeRecipes from './EnvelopeRecipes';
import SynthSignalFlow from './SynthSignalFlow';
import LfoBasics from './LfoBasics';
import LfoTargets from './LfoTargets';
import LfoVsEnvelope from './LfoVsEnvelope';
import DynamicRange from './DynamicRange';
import ThresholdRatio from './ThresholdRatio';
import AttackRelease from './AttackRelease';
import KneeTypes from './KneeTypes';
import MakeupGain from './MakeupGain';
import BeforeAfterCompression from './BeforeAfterCompression';
import DelayBasics from './DelayBasics';
import DelayTime from './DelayTime';
import FeedbackRepeats from './FeedbackRepeats';
import DelayPanEQ from './DelayPanEQ';
import Slapback from './Slapback';
import TimedDelay from './TimedDelay';
import PingPong from './PingPong';
import ADT from './ADT';
import FmConcept from './FmConcept';
import FmOperators from './FmOperators';
import FmRatios from './FmRatios';
import FmInPractice from './FmInPractice';
import LogFrequencyAxis from './LogFrequencyAxis';
import FrequencyMapZones from './FrequencyMapZones';
import BoostVsCutPhilosophy from './BoostVsCutPhilosophy';
import HighPassLowPassFilters from './HighPassLowPassFilters';
import FilterSlopeDbOctave from './FilterSlopeDbOctave';
import ShelvingFilters from './ShelvingFilters';
import PracticalFilterUses from './PracticalFilterUses';
import SweepAndCutTechnique from './SweepAndCutTechnique';
import EqMixContextDecisions from './EqMixContextDecisions';

// Thin wrapper: reuses LfoBasics' canvas with a faster wobble and a wider swing so the
// "Rate and Depth" row shows a visibly different diagram instead of an empty panel or a
// mislabelled copy of the "What Is an LFO?" diagram.
const LfoRateDepth = () => <LfoBasics title="Rate and Depth" cycles={5} lfoAmp={0.44} />;

const diagrams = {
    'frequency-spectrum': FrequencySpectrum,
    'graphic-eq': GraphicEQ,
    'octave-bands': OctaveBands,
    'parametric-eq': ParametricEQ,
    'q-factor': QFactor,
    'routing': Routing,
    'comparison': Comparison,
    'subtractive-concept': SubtractiveConcept,
    'what-is-sound': WhatIsSound,
    'harmonic-series': HarmonicSeries,
    'timbre-comparison': TimbreComparison,
    'oscillator-waveforms': OscillatorWaveforms,
    'filter-types': FilterTypes,
    'resonance': Resonance,
    'filter-envelope': FilterEnvelope,
    'amp-envelope': AmpEnvelope,
    'envelope-concept': EnvelopeConcept,
    'envelope-recipes': EnvelopeRecipes,
    'synth-signal-flow': SynthSignalFlow,
    'lfo-basics': LfoBasics,
    'lfo-rate-depth': LfoRateDepth,
    'lfo-targets': LfoTargets,
    'lfo-vs-envelope': LfoVsEnvelope,
    'dynamic-range': DynamicRange,
    'threshold-ratio': ThresholdRatio,
    'attack-release': AttackRelease,
    'knee-types': KneeTypes,
    'makeup-gain': MakeupGain,
    'before-after-compression': BeforeAfterCompression,
    'delay-basics': DelayBasics,
    'delay-time': DelayTime,
    'feedback-repeats': FeedbackRepeats,
    'pan-eq': DelayPanEQ,
    'slapback': Slapback,
    'timed-delay': TimedDelay,
    'ping-pong': PingPong,
    'adt': ADT,
    'fm-concept': FmConcept,
    'fm-operators': FmOperators,
    'fm-ratios': FmRatios,
    'fm-in-practice': FmInPractice,
    'log-frequency-axis': LogFrequencyAxis,
    'frequency-map-zones': FrequencyMapZones,
    'boost-vs-cut-philosophy': BoostVsCutPhilosophy,
    'high-pass-low-pass-filters': HighPassLowPassFilters,
    'filter-slope-db-octave': FilterSlopeDbOctave,
    'shelving-filters': ShelvingFilters,
    'practical-filter-uses': PracticalFilterUses,
    'sweep-and-cut-technique': SweepAndCutTechnique,
    'eq-mix-context-decisions': EqMixContextDecisions,
};

export default diagrams;
