import eqQuestions from './eq.json';
import synthesisQuestions from './synthesis.json';
import dynamicsQuestions from './dynamics.json';
import midiQuestions from './midi.json';
import samplingQuestions from './sampling.json';
import reverbQuestions from './reverb.json';
import microphonesQuestions from './microphones.json';
import acousticsQuestions from './acoustics.json';
import softwareHardwareQuestions from './software-hardware.json';
import numeracyQuestions from './numeracy.json';
import delayQuestions from './delay.json';
import distortionQuestions from './distortion.json';
import digitalAnalogueQuestions from './digital-analogue.json';
import leadsAndSignalsQuestions from './leads-and-signals.json';

const banks = {
    eq: eqQuestions,
    synthesis: synthesisQuestions,
    dynamics: dynamicsQuestions,
    midi: midiQuestions,
    sampling: samplingQuestions,
    reverb: reverbQuestions,
    microphones: microphonesQuestions,
    acoustics: acousticsQuestions,
    'software-hardware': softwareHardwareQuestions,
    numeracy: numeracyQuestions,
    delay: delayQuestions,
    distortion: distortionQuestions,
    'digital-analogue': digitalAnalogueQuestions,
    'leads-and-signals': leadsAndSignalsQuestions,
};

export function getQuestions(topicId) {
    return banks[topicId]?.questions || [];
}

export function getAvailableTopics() {
    return Object.keys(banks);
}

/**
 * Check if a topic has revision questions available.
 */
export function hasReviseContent(topicId) {
    return topicId in banks;
}
