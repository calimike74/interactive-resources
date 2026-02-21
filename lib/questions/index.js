import eqQuestions from './eq.json';
import synthesisQuestions from './synthesis.json';
import dynamicsQuestions from './dynamics.json';
import midiQuestions from './midi.json';
import samplingQuestions from './sampling.json';
import mixingQuestions from './mixing.json';
import reverbQuestions from './reverb.json';
import recordingQuestions from './recording.json';
import numeracyQuestions from './numeracy.json';

const banks = {
    eq: eqQuestions,
    synthesis: synthesisQuestions,
    dynamics: dynamicsQuestions,
    midi: midiQuestions,
    sampling: samplingQuestions,
    mixing: mixingQuestions,
    reverb: reverbQuestions,
    recording: recordingQuestions,
    numeracy: numeracyQuestions,
};

export function getQuestions(topicId) {
    return banks[topicId]?.questions || [];
}

export function getAvailableTopics() {
    return Object.keys(banks);
}
