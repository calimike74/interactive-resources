// Acoustics Flashcards Resource Configuration
// Interactive flashcard system for learning room acoustics and reverberation concepts

const acousticsFlashcards = {
    id: 'acoustics-flashcards',
    title: 'Room Acoustics Flashcards',
    description: 'Master room acoustics and reverberation concepts with interactive flashcards, visual diagrams, and spaced repetition tracking',
    topic: '1.12 Reverb',
    relatedTopics: [],
    type: 'interactive',
    icon: '',
    estimatedTime: '20-40 minutes',
    learningObjectives: [
        'Understand how reverberations provide spatial information',
        'Learn the three stages of reverb: direct sound, early reflections, late reflections',
        'Know how materials affect transmission, reflection, and absorption',
        'Understand RT60 and how to measure reverberation time',
        'Apply acoustic principles to room design and treatment'
    ],
    // Links to related assessments
    prepFor: [],
    // Component to render (matches export name in components/resources/)
    component: 'AcousticsFlashcards',
    // Metadata for search/filtering
    keywords: ['acoustics', 'reverb', 'reverberation', 'rt60', 'reflections', 'absorption', 'room', 'flashcards', 'early reflections', 'late reflections'],
    difficulty: 'foundation',
};

export default acousticsFlashcards;
