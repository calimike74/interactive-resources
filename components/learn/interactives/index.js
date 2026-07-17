import CutoffSlider from './CutoffSlider';
import ResonanceKnob from './ResonanceKnob';
import ADSRShaper from './ADSRShaper';
import LFODepthDial from './LFODepthDial';
import FMRatioSlider from './FMRatioSlider';
import EQSweepKnob from './EQSweepKnob';
import ThresholdSlider from './ThresholdSlider';
import DelayTimeSlider from './DelayTimeSlider';
import FeedbackDial from './FeedbackDial';
import ReverbMixSlider from './ReverbMixSlider';
import ReverbDecaySlider from './ReverbDecaySlider';
import BitDepthSlider from './BitDepthSlider';
import RepitchSlider from './RepitchSlider';
import DriveSlider from './DriveSlider';

const interactives = {
    'cutoff-slider': CutoffSlider,
    'resonance-knob': ResonanceKnob,
    'adsr-shaper': ADSRShaper,
    'lfo-depth-dial': LFODepthDial,
    'fm-ratio-slider': FMRatioSlider,
    'eq-sweep': EQSweepKnob,
    'threshold': ThresholdSlider,
    'delay-time': DelayTimeSlider,
    'feedback': FeedbackDial,
    'reverb-mix': ReverbMixSlider,
    'reverb-decay': ReverbDecaySlider,
    'bit-depth': BitDepthSlider,
    'repitch': RepitchSlider,
    'drive': DriveSlider,
};

export default interactives;
