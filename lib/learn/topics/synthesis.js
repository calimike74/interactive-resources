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
            {
                id: 'what-is-sound',
                heading: 'What Is Sound?',
                description: 'Sound begins as vibration — a speaker cone, a guitar string, vocal cords — pushing the air into pressure waves. How fast that vibration repeats is its frequency, and your ear hears frequency as pitch: more cycles per second, a higher note. How far the vibration swings is its amplitude, and your ear hears amplitude as loudness.',
                animation: 'what-is-sound',
                audio: { preset: 'waveform-sine', label: 'Hold to hear a pure sine tone' },
                assessment: {
                    id: 'what-is-sound',
                    question: 'A student records the same synth note twice — once played gently, once played hard — and the second take is clearly louder, but the note itself sounds identical in pitch both times. What changed between the two takes?',
                    options: [
                        { text: 'The frequency increased — playing harder makes the waveform cycle faster', correct: false, feedback: 'Playing harder doesn\'t speed up the cycle. Frequency (and therefore pitch) is set by the note played, not by how hard you hit it.' },
                        { text: 'The amplitude increased — playing harder makes the vibration swing further, which the ear hears as louder, while frequency (and pitch) stayed exactly the same', correct: true, feedback: 'That\'s the distinction: amplitude is the size of the vibration and controls loudness; frequency is the speed of the vibration and controls pitch. They\'re independent.' },
                        { text: 'Nothing physically changed — the perceived loudness difference is just an illusion', correct: false, feedback: 'There\'s a real physical difference: the second take genuinely has greater amplitude — a bigger pressure wave — not just a perceived one.' },
                    ],
                },
            },
            {
                id: 'harmonic-series',
                heading: 'The Harmonic Series',
                description: 'Most vibrating sources don\'t produce one pure frequency — they produce a fundamental (the pitch you name) plus harmonics stacked on top, at whole-number multiples of it: 2×, 3×, 4× and beyond. Which harmonics are present, and how loud each one is relative to the fundamental, is the raw material that gives an instrument its timbre.',
                animation: 'harmonic-series',
                assessment: {
                    id: 'harmonic-series',
                    question: 'A bass oscillator is tuned to a fundamental of 110 Hz. What frequency is its 3rd harmonic?',
                    options: [
                        { text: '220 Hz', correct: false, feedback: '220 Hz is the 2nd harmonic (110 × 2) — one multiple too low.' },
                        { text: '330 Hz', correct: true, feedback: 'Harmonics sit at whole-number multiples of the fundamental: 110 × 3 = 330 Hz is the 3rd harmonic.' },
                        { text: '440 Hz', correct: false, feedback: '440 Hz is the 4th harmonic (110 × 4) — one multiple too high.' },
                    ],
                },
            },
            {
                id: 'four-waveforms',
                heading: 'The Four Waveforms',
                description: 'Each waveform is a recipe of harmonics. Sawtooth waves contain all harmonics — bright and buzzy. Square waves have only odd harmonics — hollow and reedy. Triangle waves keep the odd harmonics but much quieter — soft and mellow. Sine waves are pure fundamental — no harmonics at all.',
                animation: 'oscillator-waveforms',
                audio: { preset: 'waveform-sawtooth', label: 'Hold to hear a sawtooth' },
                assessment: {
                    id: 'four-waveforms',
                    question: 'You want to create a hollow, clarinet-like tone. Which oscillator waveform would be the best starting point and why?',
                    options: [
                        { text: 'Sawtooth wave — it has the most harmonics so it\'s the best starting point', correct: false, feedback: 'Sawtooth has all harmonics including evens, which gives a bright buzzy quality, not hollow.' },
                        { text: 'Square wave — it contains only odd harmonics, which gives that hollow, woody quality similar to clarinet', correct: true, feedback: 'Clarinet is a closed-pipe instrument that emphasises odd harmonics, matching square wave\'s harmonic content.' },
                        { text: 'Sine wave — it\'s the purest and most natural sounding', correct: false, feedback: 'Sine has no harmonics at all — you can\'t filter it into a clarinet-like tone.' },
                    ],
                },
            },
            {
                id: 'timbre',
                heading: 'Timbre',
                description: 'Play the same note on a flute and a violin and they sound completely different — that\'s timbre. Both instruments produce the identical fundamental frequency, so the pitch matches exactly. What differs is the harmonic recipe stacked above it — which harmonics are present and how loud each one is. That recipe, not the pitch, is what your ear identifies as the instrument.',
                animation: 'timbre-comparison',
                assessment: {
                    id: 'timbre',
                    question: 'A flute and a violin both play A440 — the same 440 Hz fundamental. To the ear they still sound completely different. What accounts for the difference?',
                    options: [
                        { text: 'The fundamental frequency — the violin\'s A440 must actually sit slightly higher than the flute\'s', correct: false, feedback: 'Both instruments really are producing the same 440 Hz fundamental — that\'s what makes them the same pitch. The difference lies elsewhere.' },
                        { text: 'The amplitude — the violin is simply the louder of the two instruments', correct: false, feedback: 'Amplitude controls loudness, not the instrument\'s character — a quiet violin and a loud violin still sound like a violin.' },
                        { text: 'The harmonic content — each instrument stacks a different set and balance of harmonics above the shared 440 Hz fundamental, and that recipe is what we hear as timbre', correct: true, feedback: 'Same pitch, different harmonic recipe: that\'s the definition of timbre, and it\'s why identical notes on different instruments never sound the same.' },
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
        examAnchor: {
            question: 'A producer wants a bright pad that starts harmonically rich and mellows over the course of a long, sustained chord. Describe how they could create this using subtractive synthesis, referring to specific synthesiser parameters.',
            modelPoints: [
                'Oscillator set to a harmonically rich waveform (e.g. sawtooth) — essential, since a sine wave has no harmonics for a filter to remove.',
                'Signal routed through a low-pass filter to shape the tone.',
                'Filter envelope with a fast attack so the cutoff opens fully at note-on, then a slow decay down to a low sustain level, so the cutoff frequency falls gradually over the length of the note.',
                'Resonance raised to emphasise the harmonics at the cutoff as it sweeps, giving the movement a more pronounced character.',
                'Amplitude envelope with a slow attack (and sustained/long release) to create the swelling entry and held quality of a pad.',
            ],
            examTip: 'Name the parameters precisely, not the vibe — "the filter cutoff decreases" scores, "it gets darker" doesn\'t. Describing a filter in EQ terms ("boost the bass") is a recurring examiner-flagged error; subtractive filters remove frequencies, they don\'t boost them.',
        },

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
                audio: { preset: 'filter-sweep', label: 'Hold to hear a filter sweep' },
                interactive: 'cutoff-slider',
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
                id: 'resonance',
                heading: 'Resonance',
                description: 'Resonance (Q) boosts a narrow band of frequencies right at the cutoff, creating a peak instead of a smooth roll-off. Sweeping a resonant filter gives the classic squelch of acid house basslines. Push it to the extreme and the filter self-oscillates — ringing at a fixed pitch that ignores the notes being played.',
                animation: 'resonance',
                interactive: 'resonance-knob',
                assessment: {
                    id: 'resonance',
                    question: 'A student programs an acid bassline patch: sawtooth oscillator, low-pass filter, resonance pushed high, filter envelope sweeping the cutoff. As they turn the resonance knob further, the patch starts making a fixed-pitch tone that plays even when no key is held down. What\'s happening?',
                    options: [
                        { text: 'The oscillator has become detuned from the resonance setting', correct: false, feedback: 'Resonance doesn\'t touch oscillator tuning — it acts on the filter, not the pitch of the source waveform.' },
                        { text: 'The filter has self-oscillated — resonance has been pushed so high that the filter is now generating its own tone independent of the notes played', correct: true, feedback: 'That\'s self-oscillation: past a certain resonance level, the peak at the cutoff becomes self-sustaining and the filter rings at a fixed pitch of its own, ignoring the keyboard.' },
                        { text: 'The filter envelope has malfunctioned and is stuck at maximum cutoff', correct: false, feedback: 'Nothing has malfunctioned — self-oscillation is an expected, controllable behaviour of a resonant filter at extreme settings, not a fault.' },
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
        examAnchor: {
            question: 'A producer wants a synth patch that imitates a plucked guitar note. State and justify suitable ADSR settings for the amplitude envelope.',
            modelPoints: [
                'Fast/near-zero attack — the note needs to start instantly, the way a plucked string is set vibrating the moment it\'s released.',
                'Fast decay — the initial pluck transient dies away quickly, mirroring how a guitar string\'s loudest ring is right at the start.',
                'Zero/low sustain — a plucked note does not hold at a steady level while the key is held, unlike a bowed or blown instrument.',
                'Short-to-medium release — the note stops soon after the key is released, like a guitar string being damped by the player\'s hand.',
            ],
            examTip: 'Every ADSR stage needs a value AND a reason — naming "fast attack" without saying why earns half the mark; the justification is what separates a Level 2 answer from a Level 1 one.',
        },

        rows: [
            {
                id: 'what-is-an-envelope',
                heading: 'What Is an Envelope?',
                description: 'Most synth parameters sit at one fixed value — a filter cutoff parked at 2kHz stays there forever. An envelope replaces that static value with a shape that plays once per note, triggered the moment a key goes down. The standard shape has four stages — Attack, Decay, Sustain, Release, together known as ADSR — and it can drive amplitude, filter cutoff, or almost anything else.',
                animation: 'envelope-concept',
                assessment: {
                    id: 'what-is-an-envelope',
                    question: 'A patch has its filter cutoff parked at one fixed knob position — every note comes out with exactly the same brightness, no movement at all. A student wants the brightness to change automatically during each note. What should they do, and why does it work?',
                    options: [
                        { text: 'Route an envelope to the cutoff — instead of a static value, the cutoff will follow a four-stage ADSR shape that retriggers at the start of every note', correct: true, feedback: 'That\'s exactly what an envelope does: it replaces a fixed value with a shape (Attack, Decay, Sustain, Release) played once per note-on.' },
                        { text: 'Turn the cutoff knob further up — a higher fixed value will create more movement during the note', correct: false, feedback: 'A higher fixed cutoff is still a fixed value — the brightness would still never change during the note, just start brighter.' },
                        { text: 'Nothing can be done — filter cutoff can only ever be a single static setting', correct: false, feedback: 'Cutoff is exactly the kind of parameter envelopes are designed to move — routing an envelope to it is standard practice on any subtractive synth.' },
                    ],
                },
            },
            {
                id: 'amp-envelope',
                heading: 'Amplitude Envelope (ADSR)',
                description: 'The amplitude envelope shapes the volume over time. A fast attack with no sustain creates percussive hits. Slow attack creates swells. Long release adds tail. Every acoustic instrument has a natural amplitude envelope — synthesisers let you design your own.',
                animation: 'amp-envelope',
                audio: { preset: 'adsr-pluck', label: 'Hold to hear a plucky envelope' },
                interactive: 'adsr-shaper',
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
            {
                id: 'filter-envelope',
                heading: 'Filter Envelope (ADSR)',
                description: 'An envelope controls how the filter cutoff changes over time. Attack opens the filter (bright start), Decay brings it partway back, Sustain holds a level while the key is held, Release closes the filter when the key is released. This creates movement — the classic "wah" of analogue synths.',
                animation: 'filter-envelope',
                audio: { preset: 'adsr-swell', label: 'Hold to hear a slow swell' },
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
                id: 'envelope-recipes',
                heading: 'Envelope Recipes',
                description: 'Three familiar sounds, three ADSR shapes. A pad wants a slow attack, high sustain and long release — it blooms in and keeps ringing. A pluck wants an instant attack, fast decay and zero sustain — one snap, then silence. A bass stab wants a fast attack, medium decay and short release, which keeps the low end tight instead of smearing into the next note.',
                animation: 'envelope-recipes',
                assessment: {
                    id: 'envelope-recipes',
                    question: 'A sound designer needs three patches in one session: a swelling ambient pad, a plucked guitar-style hit, and a tight sub-bass stab that won\'t blur into the next note. Which ADSR combination suits the bass stab?',
                    options: [
                        { text: 'Fast attack so the note is instantly present, medium decay to give the transient some body, and a short release so the low end doesn\'t ring on top of the next note', correct: true, feedback: 'That\'s the bass stab recipe: fast attack, medium decay, short release — present immediately, then out of the way before the next note lands.' },
                        { text: 'Slow attack, high sustain, long release — for a bloom that keeps ringing', correct: false, feedback: 'That\'s the pad recipe — a bass stab needs to start immediately and get out of the way, not bloom and hang on.' },
                        { text: 'Instant attack, fast decay, zero sustain — with no held level at all', correct: false, feedback: 'That\'s the pluck recipe. A bass stab\'s short release (not zero sustain) is what keeps the low end tight without cutting the note off mid-decay.' },
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
