// Diagram component registry — maps animation IDs from topic data to React components
import FrequencySpectrum from './FrequencySpectrum';
import GraphicEQ from './GraphicEQ';
import OctaveBands from './OctaveBands';
import ParametricEQ from './ParametricEQ';
import QFactor from './QFactor';
import Routing from './Routing';
import Comparison from './Comparison';
import SubtractiveConcept from './SubtractiveConcept';
import OscillatorWaveforms from './OscillatorWaveforms';
import FilterTypes from './FilterTypes';
import FilterEnvelope from './FilterEnvelope';
import AmpEnvelope from './AmpEnvelope';
import SynthSignalFlow from './SynthSignalFlow';
import DynamicRange from './DynamicRange';
import ThresholdRatio from './ThresholdRatio';
import AttackRelease from './AttackRelease';
import KneeTypes from './KneeTypes';
import MakeupGain from './MakeupGain';
import BeforeAfterCompression from './BeforeAfterCompression';

const diagrams = {
    'frequency-spectrum': FrequencySpectrum,
    'graphic-eq': GraphicEQ,
    'octave-bands': OctaveBands,
    'parametric-eq': ParametricEQ,
    'q-factor': QFactor,
    'routing': Routing,
    'comparison': Comparison,
    'subtractive-concept': SubtractiveConcept,
    'oscillator-waveforms': OscillatorWaveforms,
    'filter-types': FilterTypes,
    'filter-envelope': FilterEnvelope,
    'amp-envelope': AmpEnvelope,
    'synth-signal-flow': SynthSignalFlow,
    'dynamic-range': DynamicRange,
    'threshold-ratio': ThresholdRatio,
    'attack-release': AttackRelease,
    'knee-types': KneeTypes,
    'makeup-gain': MakeupGain,
    'before-after-compression': BeforeAfterCompression,
};

export default diagrams;
