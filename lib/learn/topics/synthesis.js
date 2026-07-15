// Subtractive Synthesis Course — Row-based content for inline animated explanations
// Each row: heading + description (left) paired with an animated diagram (right)
// Five-chapter course skeleton (Task 12) — content rewrites land in Tasks 13-17.

export const SYNTHESIS_CHAPTERS = [
    {
        id: 'waveforms',
        chapterNumber: 1,
        title: 'Sound & Waveforms',
        subtitle: 'Chapter 1 — Topic 1.3',
        description: 'How oscillators generate the raw waveforms that subtractive synthesis starts from.',
        estimatedTime: '10–15 minutes',

        rows: [
            // Placeholder: existing oscillators row moved here temporarily.
            // Content rewrite for Chapter 1 lands in Task 13.
            {
                id: 'oscillators',
                heading: 'Oscillators & Waveforms',
                description: 'The oscillator generates the raw waveform — the starting material. Sawtooth waves contain all harmonics (bright, buzzy). Square waves have only odd harmonics (hollow, reedy). Triangle waves are mellow with weak upper harmonics. Sine waves are pure — just the fundamental.',
                animation: 'oscillator-waveforms',
                interactive: 'waveform-text',
                assessment: {
                    id: 'oscillators',
                    question: 'You want to create a hollow, clarinet-like tone. Which oscillator waveform would be the best starting point and why?',
                    options: [
                        { text: 'Sawtooth wave — it has the most harmonics so it\'s the best starting point', correct: false, feedback: 'Sawtooth has all harmonics including evens, which gives a bright buzzy quality, not hollow.' },
                        { text: 'Square wave — it contains only odd harmonics, which gives that hollow, woody quality similar to clarinet', correct: true, feedback: 'Clarinet is a closed-pipe instrument that emphasises odd harmonics, matching square wave\'s harmonic content.' },
                        { text: 'Sine wave — it\'s the purest and most natural sounding', correct: false, feedback: 'Sine has no harmonics at all — you can\'t filter it into a clarinet-like tone.' },
                    ],
                },
            },
        ],
    },
    {
        id: 'subtractive',
        chapterNumber: 2,
        title: 'Subtractive Synthesis',
        subtitle: 'Chapter 2 — Topic 1.3',
        description: 'How subtractive synthesisers shape sound by removing frequencies with filters, and the signal path that connects the stages.',
        estimatedTime: '15–20 minutes',

        rows: [
            {
                id: 'what-is-subtractive',
                heading: 'What is Subtractive Synthesis?',
                description: 'Start with a harmonically rich waveform and remove frequencies using filters. Unlike additive synthesis (which builds up from sine waves), subtractive synthesis sculpts sound by taking away — like carving a sculpture from a block of stone.',
                animation: 'subtractive-concept',
                assessment: {
                    id: 'what-is-subtractive',
                    question: 'A producer wants to create a warm pad sound. They start with a sine wave and wonder why it sounds thin no matter what filter settings they use. What\'s the fundamental problem?',
                    options: [
                        { text: 'The filter cutoff is set too high', correct: false, feedback: 'Even with the filter wide open, a sine wave has no harmonics.' },
                        { text: 'A sine wave has no harmonics to filter — subtractive synthesis needs a harmonically rich starting waveform', correct: true, feedback: 'Sine is pure fundamental only — there\'s nothing for the filter to sculpt.' },
                        { text: 'They need to add reverb to make it sound warmer', correct: false, feedback: 'Reverb adds space but doesn\'t create the harmonic content that warmth requires.' },
                    ],
                },
            },
            {
                id: 'filters',
                heading: 'Filters',
                description: 'Filters remove frequencies above, below, or around a cutoff point. A low-pass filter lets low frequencies through and cuts highs — sweeping the cutoff down darkens the sound. High-pass does the opposite. Band-pass lets through only a narrow range.',
                animation: 'filter-types',
                assessment: {
                    id: 'filters',
                    question: 'A synth patch sounds too bright and harsh. You apply a low-pass filter but the sound becomes muffled and loses all character. What should you adjust?',
                    options: [
                        { text: 'Switch to a high-pass filter instead', correct: false, feedback: 'High-pass removes lows, which wouldn\'t fix brightness — it would make it thinner.' },
                        { text: 'Raise the filter cutoff frequency — it\'s set too low, cutting into the frequencies that give the sound its character', correct: true, feedback: 'Find the sweet spot where harshness is reduced but fundamental character remains.' },
                        { text: 'Remove the filter and use EQ instead', correct: false, feedback: 'You don\'t need to remove the filter — just adjust the cutoff to the right frequency.' },
                    ],
                },
            },
            {
                id: 'signal-flow',
                heading: 'Signal Flow',
                description: 'The complete signal path: oscillator generates the waveform, filter shapes the tone, amplifier controls the volume. Each stage can be modulated by its own envelope or LFO. Understanding this chain is key to programming any subtractive synth — from a Minimoog to a VST plugin.',
                animation: 'synth-signal-flow',
                assessment: {
                    id: 'signal-flow',
                    question: 'A synth pad sounds good but feels static and lifeless. Based on the signal flow, where would you add modulation to create movement?',
                    options: [
                        { text: 'Turn up the master volume — louder sounds feel more alive', correct: false, feedback: 'Volume doesn\'t add movement or tonal variation — it just makes the same static sound louder.' },
                        { text: 'Route an LFO to the filter cutoff — this creates rhythmic or gentle tonal sweeping that adds life', correct: true, feedback: 'Modulating the filter creates continuously changing tone, adding the organic movement missing from a static patch.' },
                        { text: 'Add more oscillators at different pitches', correct: false, feedback: 'More oscillators add thickness/detuning but not the time-varying movement an LFO provides.' },
                    ],
                },
            },
        ],
    },
    {
        id: 'envelopes',
        chapterNumber: 3,
        title: 'Envelopes',
        subtitle: 'Chapter 3 — Topic 1.3',
        description: 'How ADSR envelopes shape filter cutoff and amplitude over time to give a patch movement and character.',
        estimatedTime: '10–15 minutes',

        rows: [
            {
                id: 'filter-envelope',
                heading: 'Filter Envelope (ADSR)',
                description: 'An envelope controls how the filter cutoff changes over time. Attack opens the filter (bright start), Decay brings it partway back, Sustain holds a level while the key is held, Release closes the filter when the key is released. This creates movement — the classic "wah" of analogue synths.',
                animation: 'filter-envelope',
                assessment: {
                    id: 'filter-envelope',
                    question: 'How would you set the filter ADSR to create a classic \'quack\' bass sound that starts bright and quickly darkens?',
                    options: [
                        { text: 'Slow attack, long decay, high sustain, long release — for a gradual build', correct: false, feedback: 'This would create a slow swell, the opposite of a percussive quack.' },
                        { text: 'Zero attack, fast decay, low sustain, short release — the filter opens immediately then quickly closes', correct: true, feedback: 'The instant open followed by fast close creates the percussive \'quack\' that defines acid bass and funk synth tones.' },
                        { text: 'Fast attack, no decay, full sustain, no release — keep the filter open throughout', correct: false, feedback: 'With no decay the filter stays open — you\'d get a constant bright tone with no \'quack\' movement.' },
                    ],
                },
            },
            {
                id: 'amp-envelope',
                heading: 'Amplitude Envelope (ADSR)',
                description: 'The amplitude envelope shapes the volume over time. A fast attack with no sustain creates percussive hits. Slow attack creates swells. Long release adds tail. Every acoustic instrument has a natural amplitude envelope — synthesisers let you design your own.',
                animation: 'amp-envelope',
                assessment: {
                    id: 'amp-envelope',
                    question: 'You want to create a string-like swell that fades in slowly. Which ADSR parameter is most important to adjust?',
                    options: [
                        { text: 'Attack time — a slow attack creates the gradual volume swell that characterises bowed strings', correct: true, feedback: 'The attack phase controls how quickly the sound reaches full volume — slow attack = gradual swell.' },
                        { text: 'Sustain level — set it very high so the sound is loud', correct: false, feedback: 'Sustain controls the held level, but without slow attack the sound still hits instantly.' },
                        { text: 'Release time — a long release creates the swelling effect', correct: false, feedback: 'Release only affects what happens after the key is released, not the initial swell.' },
                    ],
                },
            },
        ],
    },
    {
        id: 'lfo-modulation',
        chapterNumber: 4,
        title: 'LFO Modulation',
        subtitle: 'Chapter 4 — Topic 1.3',
        description: 'How a low-frequency oscillator modulates pitch, filter cutoff and amplitude to add movement to a patch.',
        estimatedTime: '10–15 minutes',

        rows: [
            // Placeholder row — full content lands in Task 16.
            {
                id: 'lfos',
                heading: 'LFOs',
                description: 'A low-frequency oscillator (LFO) modulates another parameter — pitch, filter cutoff or amplitude — at a rate too slow to hear as pitch itself, creating vibrato, wah or tremolo.',
                animation: 'synth-signal-flow',
            },
        ],
    },
    {
        id: 'fm-synthesis',
        chapterNumber: 5,
        title: 'FM Synthesis',
        subtitle: 'Chapter 5 — Topic 1.3',
        description: 'How frequency modulation synthesis uses one oscillator to modulate another, producing complex, bell-like and metallic timbres beyond subtractive synthesis.',
        estimatedTime: '15–20 minutes',
        outroResourceId: 'operator-image-explorer',

        rows: [
            // Placeholder row — full content lands in Task 17.
            {
                id: 'fm-basics',
                heading: 'Frequency Modulation',
                description: 'FM synthesis uses one oscillator (the modulator) to rapidly modulate the frequency of another (the carrier), generating complex sidebands and timbres that subtractive synthesis can\'t easily produce.',
                animation: 'subtractive-concept',
            },
        ],
    },
];
