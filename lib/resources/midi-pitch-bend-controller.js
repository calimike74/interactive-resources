// MIDI Pitch Bend Controller Resource Configuration
// Interactive guide for understanding MIDI pitch bend data and controllers

const midiPitchBendController = {
    id: 'midi-pitch-bend-controller',
    title: 'MIDI Pitch Bend & Controller',
    description: 'Interactive guide exploring 14-bit pitch bend data, MIDI byte structure, and common CC controllers for A-Level Music Technology',
    topic: '1.5 Sequencing',
    relatedTopics: ['1.3 Synthesis'],
    type: 'interactive',
    kind: 'sandbox',
    icon: '',
    estimatedTime: '20-30 minutes',
    learningObjectives: [
        'Understand how MIDI transmits pitch bend using 14-bit resolution',
        'Learn the three-byte structure of pitch bend messages (Status, LSB, MSB)',
        'Explore pitch bend range settings in a synthesiser',
        'Understand common MIDI CC controllers (Modulation, Volume, Pan, Expression, Filter Cutoff)'
    ],
    // Links to related assessments
    prepFor: [],
    // Component to render (matches export name in components/resources/)
    component: 'MIDIPitchBendController',
    // Metadata for search/filtering
    keywords: ['midi', 'pitch bend', 'controller', 'cc', 'modulation', 'sequencing', '14-bit', 'lsb', 'msb', 'envelope'],
    difficulty: 'foundation',
};

export default midiPitchBendController;
