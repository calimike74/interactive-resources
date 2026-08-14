const dynamicCompression = {
    id: 'rtq-dynamic-compression',
    title: 'Dynamic Range Compression',
    topic: '1.9',
    hidePassageDuringQuiz: true,
    passage: {
        text: `A compressor is a dynamic processing tool that reduces the dynamic range of an audio signal. It works by attenuating the level of sounds that exceed a set threshold. The amount of gain reduction applied is determined by the ratio. For example, a 4:1 ratio means that for every 4dB the signal goes above the threshold, only 1dB will pass through the compressor's output.

Two critical time-based controls shape how the compressor responds. The attack time sets how quickly the compressor begins to act once the signal exceeds the threshold. A fast attack clamps down almost immediately, while a slow attack lets the initial transient through before compression begins. The release time determines how quickly the compressor stops reducing gain once the signal drops back below the threshold.

After compression, the overall signal level is typically lower because the peaks have been reduced. Make-up gain (sometimes called output gain) is used to bring the compressed signal back up to a usable level. This is why compression is often described as making quiet parts louder and loud parts quieter. The peaks are reduced, then the whole signal is boosted, narrowing the gap between the quietest and loudest moments.

Compression is used across almost every genre of recorded music. On vocals, it evens out the natural dynamic variation so that every word sits clearly in the mix. On drums, it can add punch by letting the transient through (slow attack) and then pulling down the sustain portion of the sound. On a mix bus, gentle compression can 'glue' the elements of a mix together, giving it a more cohesive and polished feel.`,
        keyTerms: [
            { term: 'threshold', definition: 'The level above which the compressor begins to reduce gain' },
            { term: 'ratio', definition: 'How much gain reduction is applied, expressed as input:output (e.g. 4:1)' },
            { term: 'attack', definition: 'How quickly the compressor responds once the signal exceeds the threshold' },
            { term: 'release', definition: 'How quickly the compressor stops acting once the signal drops below the threshold' },
            { term: 'make-up gain', definition: 'Output gain used to restore level after compression has reduced peaks' },
            { term: 'dynamic range', definition: 'The difference between the quietest and loudest parts of an audio signal' },
            { term: 'transient', definition: 'The initial, short-lived peak at the start of a sound (e.g. a drum hit)' },
        ],
    },
    openEnded: {
        prompt: 'In your own words, explain how a compressor affects the dynamic range of an audio signal. Include the role of at least two compressor controls in your answer.',
        sentenceStarters: [
            'A compressor works by...',
            'When the signal level goes above the threshold...',
            'The ratio setting controls...',
        ],
        guidingSubQuestions: [
            'What triggers the compressor to start reducing gain?',
            'How does the ratio determine the amount of compression?',
            'Why is make-up gain needed after compression?',
        ],
    },
    mcq: [
        {
            question: 'A signal peaks at 12dB above the threshold with a ratio of 4:1. How much of that 12dB excess passes through?',
            options: [
                '12dB: the ratio only affects signals below the threshold',
                '4dB: the excess is divided by the first number in the ratio',
                '3dB: the excess is divided by the first number in the ratio',
                '1dB: only 1dB of every 4dB is allowed through',
            ],
            correct: 2,
            hint: 'The ratio tells you the relationship between input level above threshold and output level above threshold. With 4:1, for every 4dB over, only 1dB gets through.',
            explanation: 'With a 4:1 ratio, the 12dB excess is divided by 4, so 3dB passes through. The output is 3dB above the threshold instead of 12dB.',
        },
        {
            question: 'A drummer wants to preserve the initial "crack" of the snare but reduce the ringing sustain. Which compressor setting is most important?',
            options: [
                'A high ratio to maximise gain reduction',
                'A slow attack time to let the transient through before compression begins',
                'A fast release time to stop compression before the sustain',
                'A low threshold to catch every part of the signal',
            ],
            correct: 1,
            hint: 'Think about what happens in the first few milliseconds of a drum hit. Which control determines whether the compressor acts on that initial peak?',
            explanation: 'A slow attack lets the initial transient pass through uncompressed, preserving the "crack". The compressor then engages to reduce the sustain that follows.',
        },
        {
            question: 'After applying heavy compression to a vocal, the signal sounds quieter than the original even though the dynamics are more even. What should you adjust?',
            options: [
                'Increase the ratio to compress more aggressively',
                'Lower the threshold to catch more of the signal',
                'Increase the make-up gain to restore the output level',
                'Shorten the release time so compression disengages faster',
            ],
            correct: 2,
            hint: 'Compression reduces peaks, which lowers the overall level. There is a specific control designed to compensate for this.',
            explanation: 'Make-up gain (output gain) compensates for the level lost during compression. After the peaks are reduced, make-up gain brings the overall signal back up to a usable level.',
        },
    ],
};

export default dynamicCompression;
