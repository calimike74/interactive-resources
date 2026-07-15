const midiBinaryAssessment = {
    id: 'midi-binary-assessment',
    title: 'MIDI, Binary & Numeracy Assessment',
    description: 'Drill the recurring C4 exam question types — decimal/binary conversion, 7-bit and 14-bit MIDI ranges, pitch bend, and MIDI message identification. Based on Worksheet 8 (Pre-exam Revision Pack).',
    topic: '1.5 Sequencing',
    relatedTopics: ['2.5 Numeracy'],
    type: 'practice',
    kind: 'retrieval',
    icon: '',
    estimatedTime: '15-20 minutes',
    learningObjectives: [
        'Convert decimal values 0–127 to and from 7-bit binary',
        'Explain why MIDI note velocity is limited to the range 0–127',
        'Identify the value of pitch bend at its centre position (8192) and the number of bytes used to transmit it',
        'Distinguish MIDI message types from MIDI parameters (e.g. velocity is not a message)',
        'Recall why MIDI note length has no effect on a one-shot drum sample',
    ],
    prepFor: [],
    component: 'MIDIBinaryAssessment',
    keywords: ['midi', 'binary', 'numeracy', 'sequencing', '7-bit', '14-bit', 'pitch bend', 'velocity', 'note on', 'note off', 'lsb', 'msb', 'control change', 'cc', 'program change', 'aftertouch', 'assessment', 'quiz', 'revision', 'c4', 'exam'],
    difficulty: 'foundation',
};

export default midiBinaryAssessment;
