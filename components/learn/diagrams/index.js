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
import DynamicRangeGap from './DynamicRangeGap';
import AutomaticFaderConcept from './AutomaticFaderConcept';
import CompressorTransferCurve from './CompressorTransferCurve';
import PumpingEnvelope from './PumpingEnvelope';
import LimiterCeiling from './LimiterCeiling';
import GateExpanderFamily from './GateExpanderFamily';
import SidechainTriggerTarget from './SidechainTriggerTarget';
import SidechainPumpingRelease from './SidechainPumpingRelease';
import TapeEchoDarkening from './TapeEchoDarkening';
import BpmToMsFamily from './BpmToMsFamily';
import DottedTripletMultipliers from './DottedTripletMultipliers';
import PingPongCrossedFeedback from './PingPongCrossedFeedback';
import ClapTimeline from './ClapTimeline';
import PreDelayGap from './PreDelayGap';
import DistanceRdRatio from './DistanceRdRatio';
import Rt60DecayCurve from './Rt60DecayCurve';
import DampingDarkensTail from './DampingDarkensTail';
import AbsorbVsDiffuse from './AbsorbVsDiffuse';
import TransductionChain from './TransductionChain';
import SpringReverbMechanism from './SpringReverbMechanism';
import PlateReverbMechanism from './PlateReverbMechanism';
import CombAllpassNetwork from './CombAllpassNetwork';
import ImpulseResponseFingerprint from './ImpulseResponseFingerprint';
import ParameterBridge from './ParameterBridge';
import SendVsInsertRouting from './SendVsInsertRouting';
import PrePostFaderTap from './PrePostFaderTap';
import ReverbFadeAutomation from './ReverbFadeAutomation';
import SamplerRecordStoreTrigger from './SamplerRecordStoreTrigger';
import SamplerLineage from './SamplerLineage';
import WhySampleDrums from './WhySampleDrums';
import PlaybackModes from './PlaybackModes';
import SampleRateGrid from './SampleRateGrid';
import AliasingFoldback from './AliasingFoldback';
import BitDepthStaircase from './BitDepthStaircase';
import ZeroCrossingCut from './ZeroCrossingCut';
import TruncateAndFade from './TruncateAndFade';
import LoopPointJoin from './LoopPointJoin';
import RootNoteMap from './RootNoteMap';
import SpeedPitchLink from './SpeedPitchLink';
import KeyZonesVelocityLayers from './KeyZonesVelocityLayers';
import PitchTimeMatrix from './PitchTimeMatrix';
import ReverseEnvelope from './ReverseEnvelope';
import ChopResequence from './ChopResequence';
import ClippingShapes from './ClippingShapes';
import DriveToneLevelChain from './DriveToneLevelChain';
import OddEvenHarmonics from './OddEvenHarmonics';
import MidiMessageAnatomy from './MidiMessageAnatomy';
import RealtimeVsStepInput from './RealtimeVsStepInput';
import QuantiseGridSnap from './QuantiseGridSnap';
import PitchBendResolution from './PitchBendResolution';

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
    'dynamic-range-gap': DynamicRangeGap,
    'automatic-fader-concept': AutomaticFaderConcept,
    'compressor-transfer-curve': CompressorTransferCurve,
    'pumping-envelope': PumpingEnvelope,
    'limiter-ceiling': LimiterCeiling,
    'gate-expander-family': GateExpanderFamily,
    'sidechain-trigger-target': SidechainTriggerTarget,
    'sidechain-pumping-release': SidechainPumpingRelease,
    'tape-echo-darkening': TapeEchoDarkening,
    'bpm-to-ms-family': BpmToMsFamily,
    'dotted-triplet-multipliers': DottedTripletMultipliers,
    'pingpong-crossed-feedback': PingPongCrossedFeedback,
    'clap-timeline': ClapTimeline,
    'pre-delay-gap': PreDelayGap,
    'distance-rd-ratio': DistanceRdRatio,
    'rt60-decay-curve': Rt60DecayCurve,
    'damping-darkens-tail': DampingDarkensTail,
    'absorb-vs-diffuse': AbsorbVsDiffuse,
    'transduction-chain': TransductionChain,
    'spring-reverb-mechanism': SpringReverbMechanism,
    'plate-reverb-mechanism': PlateReverbMechanism,
    'comb-allpass-network': CombAllpassNetwork,
    'impulse-response-fingerprint': ImpulseResponseFingerprint,
    'parameter-bridge': ParameterBridge,
    'send-vs-insert-routing': SendVsInsertRouting,
    'pre-post-fader-tap': PrePostFaderTap,
    'reverb-fade-automation': ReverbFadeAutomation,
    'sampler-record-store-trigger': SamplerRecordStoreTrigger,
    'sampler-lineage': SamplerLineage,
    'why-sample-drums': WhySampleDrums,
    'playback-modes': PlaybackModes,
    'sample-rate-grid': SampleRateGrid,
    'aliasing-foldback': AliasingFoldback,
    'bit-depth-staircase': BitDepthStaircase,
    'zero-crossing-cut': ZeroCrossingCut,
    'truncate-and-fade': TruncateAndFade,
    'loop-point-join': LoopPointJoin,
    'root-note-map': RootNoteMap,
    'speed-pitch-link': SpeedPitchLink,
    'key-zones-velocity-layers': KeyZonesVelocityLayers,
    'pitch-time-matrix': PitchTimeMatrix,
    'reverse-envelope': ReverseEnvelope,
    'chop-resequence': ChopResequence,
    'clipping-shapes': ClippingShapes,
    'drive-tone-level-chain': DriveToneLevelChain,
    'odd-even-harmonics': OddEvenHarmonics,
    'midi-message-anatomy': MidiMessageAnatomy,
    'realtime-vs-step-input': RealtimeVsStepInput,
    'quantise-grid-snap': QuantiseGridSnap,
    'pitch-bend-resolution': PitchBendResolution,
};

export default diagrams;
