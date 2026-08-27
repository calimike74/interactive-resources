// The benches' shared sources: the estate's own real recordings (see
// docs/audio-credits.md), sequenced live from these patterns so the tempo
// is exact and what is drawn is what is booked. First cut for the Delay
// bench (which keeps its own copy); the EQ bench reads these.

const AUDIO = '/bench-audio/delay';
export const FILES = {
    'funk-kick': `${AUDIO}/funk-kick.mp3`,
    'funk-snare': `${AUDIO}/funk-snare.mp3`,
    'funk-hat': `${AUDIO}/funk-hat.mp3`,
    'funk-openhat': `${AUDIO}/funk-openhat.mp3`,
    '808-kick': `${AUDIO}/808-kick.mp3`,
    '808-snare': `${AUDIO}/808-snare.mp3`,
    '808-hat': `${AUDIO}/808-hat.mp3`,
    '808-openhat': `${AUDIO}/808-openhat.mp3`,
    vocal: `${AUDIO}/vocal-phrase.mp3`,
    'stab-brass': `${AUDIO}/stab-brass.mp3`,
    'stab-guitar': `${AUDIO}/stab-guitar.mp3`,
};

// Patterns in 16ths over two bars (the vocal phrase runs four).
export const PATTERNS = {
    drums: {
        label: 'Drums',
        said: 'the drums',
        bars: 2,
        steps: [
            ...[0, 10, 16, 26].map((s) => ({ s, name: 'funk-kick', g: 1 })),
            ...[4, 12, 20, 28].map((s) => ({ s, name: 'funk-snare', g: 0.9 })),
            ...[0, 4, 8, 12, 16, 20, 24, 28].map((s) => ({ s, name: 'funk-hat', g: 0.35 })),
            { s: 14, name: 'funk-openhat', g: 0.45 },
            { s: 30, name: 'funk-openhat', g: 0.45 },
        ],
    },
    electronic: {
        label: '808',
        said: 'the 808',
        bars: 2,
        steps: [
            ...[0, 4, 8, 12, 16, 20, 24, 28].map((s) => ({ s, name: '808-kick', g: 1 })),
            ...[4, 12, 20, 28].map((s) => ({ s, name: '808-snare', g: 0.8 })),
            ...Array.from({ length: 8 }, (_, i) => ({ s: i * 4 + 2, name: '808-hat', g: 0.35 })),
            { s: 30, name: '808-openhat', g: 0.5 },
        ],
    },
    vocal: { label: 'Vocal', said: 'the vocal', bars: 4, steps: [{ s: 0, name: 'vocal', g: 1, phrase: true }] },
    stab: { label: 'Stab', said: 'the stabs', bars: 2, steps: [{ s: 0, name: 'stab-brass', g: 1 }, { s: 16, name: 'stab-guitar', g: 1 }] },
};
export const SOURCE_IDS = ['drums', 'electronic', 'vocal', 'stab'];

// Books one bar of a pattern through the scheduler's playBuffer.
export function scheduleBar(pattern, { bar, barStart, beatSec, playBuffer }) {
    const local = bar % pattern.bars;
    const sixteenth = beatSec / 4;
    for (const step of pattern.steps) {
        if (Math.floor(step.s / 16) !== local) continue;
        playBuffer(step.name, barStart + (step.s % 16) * sixteenth, { gain: step.g });
    }
    return local === 0;
}
