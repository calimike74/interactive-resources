// Acoustics & Psychoacoustics Resource Configuration
// Topics 2.1 + 2.2 — first interactive resource for the acoustics spec area.

const acousticsPsychoacoustics = {
    id: 'acoustics-psychoacoustics',
    title: 'Acoustics & Psychoacoustics',
    description: 'Hear the contours, feel the masking, treat the room. Interactive equal-loudness curve at variable listening levels, frequency-masking lab with masker/target controls, and a small mixing-room treatment simulator (absorbers, bass traps, diffusers) with RT60 and modal-evenness readouts. Synthesised Edexcel-style questions cover all four spec areas.',
    topic: '2.1 Acoustics & Psychoacoustics',
    relatedTopics: ['2.2 Hearing & Perception', '1.6 Mixing & Production', '1.12 Reverb'],
    type: 'interactive',
    icon: '👂',
    estimatedTime: '20-30 minutes',
    learningObjectives: [
        'Describe the human hearing range and the equal-loudness contours, and explain their mixing implications',
        'Identify the threshold of hearing and threshold of pain, and the SPL danger zone',
        'Explain frequency and temporal masking and their effect on mix decisions',
        'Distinguish reflection, absorption, and diffusion as treatments for room acoustics',
        'Explain the role of bass traps in controlling low-frequency room modes',
        'Define RT60 and link it to typical room types',
    ],
    prepFor: [],
    component: 'AcousticsPsychoacoustics',
    keywords: ['acoustics', 'psychoacoustics', 'hearing range', 'threshold of hearing', 'threshold of pain', 'equal-loudness', 'Fletcher-Munson', 'phon', 'masking', 'frequency masking', 'temporal masking', 'absorption', 'diffusion', 'bass trap', 'room mode', 'RT60', 'reverberation time', '2.1', '2.2'],
    difficulty: 'intermediate',
};

export default acousticsPsychoacoustics;
