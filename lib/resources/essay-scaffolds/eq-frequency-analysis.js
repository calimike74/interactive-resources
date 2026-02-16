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

    // Essay sections organised by component/frequency region (not by AO)
    // Examiner reports: AO3 and AO4 must be integrated, not separated
    // Pattern: identify [AO3] → evaluate significance [AO4] within each section
    essaySections: [
        {
            id: 'low-frequencies',
            label: 'Low Frequencies (Sub-Bass & Bass)',
            placeholder: 'Identify specific features of the low frequency bands, then immediately evaluate their musical significance...',
            guidance: 'Name the frequency range and what you observe [AO3], then explain why it matters musically [AO4]. E.g. "The 60-250 Hz band is boosted by 3 dB, which adds warmth to the bass guitar but risks masking the kick drum\'s fundamental."',
        },
        {
            id: 'mid-frequencies',
            label: 'Mid Frequencies (Low Mid & Upper Mid)',
            placeholder: 'Describe the mid-range settings and evaluate their effect on clarity and presence...',
            guidance: 'For each observation, pair it with evaluation. E.g. "The 2-4 kHz region is slightly boosted [AO3], which increases vocal presence because the ear is most sensitive in this range [AO4]."',
        },
        {
            id: 'high-frequencies',
            label: 'High Frequencies (Treble & Air)',
            placeholder: 'Describe the high frequency characteristics and evaluate their contribution to the overall sound...',
            guidance: 'Include specific values where possible. E.g. "The sliders above 10 kHz are set to +2 dB [AO3], adding brightness and air that creates a sense of spaciousness in the mix [AO4]."',
        },
    ],

    // Examiner tip shown above the editor
    examinerTip: 'Do NOT separate AO3 and AO4. Every description should be immediately followed by evaluation. Use subheadings by component, not by assessment objective. Spend ~75% of your response on evaluation (AO4 = 15 marks, AO3 = 5 marks).',

    // Self-assessment checklist aligned to examiner report findings
    selfAssessment: [
        { id: 'ao3-ao4-integrated', label: 'Every description is immediately followed by an evaluation (not separated)' },
        { id: 'specific-values', label: 'I referenced specific frequency ranges and dB values, not vague language' },
        { id: 'musical-significance', label: 'I explained musical significance, not just technical effect' },
        { id: 'evaluation-heavy', label: 'My response is mostly evaluation (~75%), not just description' },
        { id: 'connectives', label: 'I used evaluative connectives (therefore, this suggests, consequently, which means)' },
        { id: 'no-generic', label: 'I started with technical points, not a generic introduction' },
    ],
};

export default eqFrequencyAnalysis;
