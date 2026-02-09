// EQ Frequency Analysis - Essay Scaffold Exercise
// Uses the existing eq-photo.png / eq-annotated.png pair

const eqFrequencyAnalysis = {
    id: 'eq-frequency-analysis',
    title: 'Graphic EQ Frequency Band Analysis',
    description: 'Analyse a graphic equaliser image, identifying frequency bands and evaluating their musical impact.',
    baseImage: '/eq-photo.png',
    revealImage: '/eq-annotated.png',

    // Rectangular zones defined as percentage of image dimensions (0-1)
    // { x, y, width, height } where x,y is top-left corner
    zones: [
        {
            id: 'sub-bass',
            label: 'Sub-Bass',
            bounds: { x: 0.02, y: 0.1, width: 0.14, height: 0.8 },
            range: '20-60 Hz',
            scaffold: {
                question: 'What happens to the sound when this frequency range is boosted or cut?',
                sentenceStarter: 'The sub-bass region (20-60 Hz) controls the lowest audible frequencies, which means...',
                evaluationPrompt: 'Why might an engineer choose to cut sub-bass frequencies in a vocal recording?',
            },
        },
        {
            id: 'bass',
            label: 'Bass',
            bounds: { x: 0.16, y: 0.1, width: 0.14, height: 0.8 },
            range: '60-250 Hz',
            scaffold: {
                question: 'Which instruments primarily occupy this frequency range?',
                sentenceStarter: 'The bass region (60-250 Hz) provides the foundation of a mix because...',
                evaluationPrompt: 'How does excessive bass energy affect the clarity of a mix, and what does this tell us about frequency masking?',
            },
        },
        {
            id: 'low-mid',
            label: 'Low Mid',
            bounds: { x: 0.30, y: 0.1, width: 0.14, height: 0.8 },
            range: '250 Hz - 2 kHz',
            scaffold: {
                question: 'What tonal quality does this range add to instruments like guitar and vocals?',
                sentenceStarter: 'The low-mid range (250 Hz - 2 kHz) is often described as providing warmth and body, which is significant because...',
                evaluationPrompt: 'Why is the low-mid range sometimes called the "mud" region, and how does this relate to the concept of a balanced mix?',
            },
        },
        {
            id: 'upper-mid',
            label: 'Upper Mid',
            bounds: { x: 0.44, y: 0.1, width: 0.18, height: 0.8 },
            range: '2-7 kHz',
            scaffold: {
                question: 'How does this frequency range affect the perceived presence and intelligibility of vocals?',
                sentenceStarter: 'The upper-mid range (2-7 kHz) is critical for presence and clarity because the human ear is most sensitive to...',
                evaluationPrompt: 'Evaluate the relationship between the 3-4 kHz presence peak and vocal intelligibility. Why is this musically important?',
            },
        },
        {
            id: 'high',
            label: 'High / Treble',
            bounds: { x: 0.62, y: 0.1, width: 0.14, height: 0.8 },
            range: '7-12 kHz',
            scaffold: {
                question: 'What sonic characteristic does boosting this range add to a recording?',
                sentenceStarter: 'The high frequency range (7-12 kHz) adds brightness and definition to a sound, which affects the listener\'s perception by...',
                evaluationPrompt: 'How does the amount of high-frequency content differ between analogue and digital recordings, and why does this matter?',
            },
        },
        {
            id: 'air',
            label: 'Air / Brilliance',
            bounds: { x: 0.76, y: 0.1, width: 0.22, height: 0.8 },
            range: '12-20 kHz',
            scaffold: {
                question: 'Why is this range sometimes called "air", and what effect does it have?',
                sentenceStarter: 'The air band (12-20 kHz) adds a sense of openness and space to a recording because...',
                evaluationPrompt: 'Consider why older listeners may not perceive this range. What does this tell us about the limitations of relying solely on EQ for a polished mix?',
            },
        },
    ],

    // Essay structure template
    essaySections: [
        {
            id: 'introduction',
            label: 'Introduction',
            placeholder: 'Introduce the stimulus image and state what you will analyse...',
            guidance: 'Briefly describe what the image shows and outline the key areas you will discuss.',
        },
        {
            id: 'ao3-description',
            label: 'AO3 - Description & Analysis',
            placeholder: 'Describe what you observe in the image. Use technical terminology...',
            guidance: 'Identify and describe specific features. Use accurate technical vocabulary. Refer to specific frequency ranges, slider positions, or labelled features.',
        },
        {
            id: 'ao4-evaluation',
            label: 'AO4 - Evaluation & Justification',
            placeholder: 'Evaluate the significance of what you described. Explain WHY it matters...',
            guidance: 'Every description must be paired with evaluation. Explain the musical or technical significance. Use phrases like "this is significant because...", "this affects the sound by..."',
        },
        {
            id: 'conclusion',
            label: 'Conclusion',
            placeholder: 'Summarise your key findings and overall evaluation...',
            guidance: 'Draw together your main points. Make a final evaluative judgement about the overall impact.',
        },
    ],

    // Self-assessment checklist
    selfAssessment: [
        { id: 'technical-vocab', label: 'I used accurate technical vocabulary throughout' },
        { id: 'ao3-ao4-paired', label: 'Every AO3 description is paired with an AO4 evaluation' },
        { id: 'frequency-ranges', label: 'I referenced specific frequency ranges (in Hz or kHz)' },
        { id: 'musical-impact', label: 'I explained the musical impact, not just the technical effect' },
        { id: 'structure', label: 'My response has a clear introduction, body, and conclusion' },
        { id: 'connectives', label: 'I used evaluative connectives (therefore, this suggests, consequently)' },
    ],
};

export default eqFrequencyAnalysis;
