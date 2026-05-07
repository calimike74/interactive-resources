// BPM & Delay Time Calculator Resource Configuration
// Focused tool for deriving delay time (ms) from tempo and note value.
// Pairs alongside delay-effects (broader explorer) and the topic 1.12 Delay materials.

const bpmDelayCalculator = {
    id: 'bpm-delay-calculator',
    title: 'BPM & Delay Time Calculator',
    description: 'Derive delay times in milliseconds from BPM and note value — the way Edexcel expects on paper, the way every plugin does it under the hood. Live calculator, audible metronome with synced echo, exam-style practice with worked solutions, and a genre-paired BPM reference.',
    topic: '2.5 Numeracy',
    relatedTopics: ['1.12 Delay'],
    type: 'interactive',
    icon: '🧮',
    estimatedTime: '15-25 minutes',
    learningObjectives: [
        'Derive delay time in ms from BPM using the formula 60,000 ÷ BPM × note value',
        'Apply the formula to dotted, triplet, and standard note divisions accurately',
        'Distinguish dotted (×1.5) from triplet (×2/3) note values without confusion',
        'Use tap tempo to find a song\'s BPM by ear',
        'Interpret tempo-sync settings on hardware and plugin delays',
    ],
    prepFor: [],
    component: 'BPMDelayCalculator',
    keywords: ['BPM', 'delay time', 'tempo', 'note value', 'dotted', 'triplet', 'calculator', 'tempo sync', 'milliseconds', 'quarter note', 'eighth note', 'sixteenth note', 'metronome', 'tap tempo', 'numeracy'],
    difficulty: 'foundation',
};

export default bpmDelayCalculator;
