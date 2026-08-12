// The MIDI Exam Bench — the pen-and-paper twin of the WO-06 flagship.
// Third build of the INTERACTIVE-BAR run (2026-08-12): three escalating
// levels of the exact MIDI arithmetic the written paper asks for, every
// item marked instantly by lib/midi/engine.js (whose conventions match the
// flagship page byte for byte).

const midiExamBench = {
    id: 'midi-exam-bench',
    title: 'The MIDI Exam Bench',
    description:
        'Three escalating levels of the exact MIDI arithmetic the paper asks for — 7-bit binary and velocity, quantise values and milliseconds, LSB/MSB splits and pitch-bend maths — marked instantly, working shown.',
    topic: '1.5 Sequencing',
    relatedTopics: ['2.5 Numeracy'],
    type: 'interactive',
    kind: 'practice',
    icon: '',
    estimatedTime: '20-30 minutes',
    learningObjectives: [
        'Convert velocity values between decimal and 7-bit binary, and explain the 127 ceiling',
        'Choose appropriate quantise values and convert note divisions to milliseconds at any tempo',
        'Split and combine 14-bit pitch-bend values into MSB/LSB data bytes',
        'Calculate the sounding pitch offset from a bend value and range setting',
    ],
    prepFor: ['midi-binary-assessment'],
    component: 'MIDIExamBench',
    keywords: [
        'MIDI',
        'sequencing',
        'velocity',
        'binary',
        '7-bit',
        '14-bit',
        'LSB',
        'MSB',
        'pitch bend',
        'quantise',
        'quantize',
        'BPM',
        'milliseconds',
    ],
    difficulty: 'intermediate',
};

export default midiExamBench;
