// EQ Topic — Row-based content for inline animated explanations
// Each row: heading + description (left) paired with an animated diagram (right)

export const EQ_TOPIC = {
    id: 'eq',
    title: 'Equalisation',
    subtitle: 'Topic 1.11 — Component 4',
    description: 'How graphic and parametric EQ shape the frequency content of audio signals.',

    rows: [
        {
            id: 'what-eq-solves',
            heading: 'What EQ Solves',
            description: 'Every sound contains a mix of frequencies. Some are too loud, others too quiet. EQ lets you boost or cut specific frequency ranges to shape the tonal balance of a signal — fixing problems or enhancing character.',
            animation: 'frequency-spectrum',
            assessment: {
                id: 'what-eq-solves',
                question: 'A recording of an acoustic guitar sounds thin and lacks warmth. Which approach would be most appropriate?',
                options: [
                    { text: 'Cut everything above 5 kHz to remove brightness', correct: false, feedback: 'Cutting highs would make it dull, not warm.' },
                    { text: 'Boost around 200–400 Hz to add body and warmth', correct: true, feedback: 'The low-mid range is where warmth lives for acoustic instruments.' },
                    { text: 'Boost at 10 kHz for more fullness', correct: false, feedback: '10 kHz adds air/shimmer, not warmth.' },
                ],
            },
        },
        {
            id: 'graphic-eq',
            heading: 'Graphic EQ',
            description: 'A graphic EQ splits the frequency spectrum into fixed bands — typically 10 or 31. Each band has a slider that boosts or cuts at that specific frequency. The slider positions give you a visual "graph" of your EQ curve. Quick to use, but you can only adjust the frequencies it gives you.',
            animation: 'graphic-eq',
            assessment: {
                id: 'graphic-eq',
                question: 'A live sound engineer needs to quickly reduce feedback at approximately 2.3 kHz. Why might a 10-band graphic EQ be a poor choice for this?',
                options: [
                    { text: 'The fixed band spacing means there may not be a slider at exactly 2.3 kHz — cutting the nearest band would affect wanted frequencies too', correct: true, feedback: '10-band has octave spacing with 1 kHz and 2 kHz bands but not 2.3 kHz.' },
                    { text: 'Graphic EQs cannot cut frequencies, only boost', correct: false, feedback: 'They can both boost and cut.' },
                    { text: 'Graphic EQs are too slow for live use', correct: false, feedback: "They're popular in live sound for speed — the issue is precision." },
                ],
            },
        },
        {
            id: 'frequency-bands',
            heading: 'Frequency Bands & Spacing',
            description: 'Bands are spaced at octave intervals (10-band) or third-octave intervals (31-band). An octave means doubling the frequency — so bands go 125Hz, 250Hz, 500Hz, 1kHz, 2kHz, 4kHz. More bands means finer control, but the frequencies are still fixed.',
            animation: 'octave-bands',
            assessment: {
                id: 'frequency-bands',
                question: 'A 31-band graphic EQ has bands at third-octave intervals. Compared to a 10-band, what practical advantage does this give you?',
                options: [
                    { text: 'It sounds better because more bands means higher audio quality', correct: false, feedback: "Number of bands doesn't change audio quality." },
                    { text: 'It lets you make narrower, more targeted adjustments because the bands are closer together', correct: true, feedback: 'Third-octave = bands ~1.26x apart vs 2x.' },
                    { text: 'It allows you to choose any frequency you want', correct: false, feedback: "Both are fixed — that's what parametric is for." },
                ],
            },
        },
        {
            id: 'parametric-eq',
            heading: 'Parametric EQ',
            description: 'A parametric EQ gives you full control over each band: choose any frequency, set the gain (boost/cut), and adjust the Q (bandwidth). Typically 4–7 bands, each fully sweepable. More surgical than graphic EQ — you target exactly the frequency you need.',
            animation: 'parametric-eq',
            assessment: {
                id: 'parametric-eq',
                question: 'A vocal recording has an unpleasant resonance at exactly 3.2 kHz. Which EQ type and approach would give you the most precise fix?',
                options: [
                    { text: 'Graphic EQ — pull down the 3 kHz and 4 kHz sliders', correct: false, feedback: 'Too wide, would lose presence.' },
                    { text: 'Parametric EQ — set a narrow band at 3.2 kHz with a high Q and cut', correct: true, feedback: 'Parametric lets you target exactly 3.2 kHz with narrow Q.' },
                    { text: 'Parametric EQ — set a wide band at 3.2 kHz with a low Q and cut', correct: false, feedback: 'Low Q = wide cut, would remove good frequencies too.' },
                ],
            },
        },
        {
            id: 'q-factor',
            heading: 'Q Factor (Bandwidth)',
            description: 'Q controls how wide or narrow the EQ band is. Low Q = wide and gentle, affecting many frequencies around the target. High Q = narrow and precise, targeting a specific frequency. This is the key parameter that graphic EQ lacks.',
            animation: 'q-factor',
            assessment: {
                id: 'q-factor',
                question: 'You want to gently brighten an entire mix during mastering. Should you use a high Q or low Q boost around 10 kHz?',
                options: [
                    { text: 'High Q — a narrow boost is always more precise and therefore better', correct: false, feedback: 'Narrow boost creates unnatural peak.' },
                    { text: 'Low Q — a wide, gentle boost affects a broad range of high frequencies naturally', correct: true, feedback: 'Mastering needs subtle broad adjustments.' },
                    { text: "Q doesn't matter for mastering — any setting works", correct: false, feedback: 'Q matters enormously in mastering.' },
                ],
            },
        },
        {
            id: 'routing',
            heading: 'Signal Routing',
            description: 'Graphic EQ uses parallel routing — all bands process the signal simultaneously. Parametric EQ uses series routing — the signal passes through each band in sequence. Series routing means each band adds cumulative phase shift, which is why linear-phase EQs exist for mastering.',
            animation: 'routing',
            assessment: {
                id: 'routing',
                question: 'A mastering engineer chooses a linear-phase EQ over a standard parametric EQ. What problem are they trying to avoid?',
                options: [
                    { text: 'The cumulative phase shift that series-routed parametric EQ bands introduce, which can smear transients', correct: true, feedback: 'Series routing adds phase shift per band.' },
                    { text: 'The noise floor of analogue EQ circuits', correct: false, feedback: 'This is about digital processing modes.' },
                    { text: 'The latency of parallel processing in graphic EQs', correct: false, feedback: 'Graphic uses parallel not series.' },
                ],
            },
        },
        {
            id: 'comparison',
            heading: 'When to Use Each',
            description: 'Graphic EQ excels at quick, broad tonal adjustments — live sound, DJ monitoring, room correction. Parametric EQ is the tool for precise, surgical work — removing resonances, shaping individual tracks in a mix, mastering. Most DAWs default to parametric because of its flexibility.',
            animation: 'comparison',
            assessment: {
                id: 'comparison',
                question: 'A DJ at a live event needs to quickly cut bass frequencies that are causing the room to boom. Which EQ type and why?',
                options: [
                    { text: 'Parametric EQ — the DJ needs to find the exact resonant frequency first', correct: false, feedback: 'Sweeping parametric takes too much time during live performance.' },
                    { text: 'Graphic EQ — the DJ can instantly grab the low-frequency sliders and pull them down without precise settings', correct: true, feedback: 'Speed matters in live, graphic sliders give immediate visual and tactile feedback.' },
                    { text: "Neither — room acoustics can't be fixed with EQ", correct: false, feedback: 'EQ can absolutely reduce room resonances.' },
                ],
            },
        },
    ],
};
