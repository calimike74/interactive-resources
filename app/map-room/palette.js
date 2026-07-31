/* The Map Room after dark — colour system.
 *
 * Ground: Botanical Press dark mode (BRAND.md) with a temperature drift —
 * cool pine at the top of the room, warm lamplight at the base. Never flat.
 * Topic inks: one pigment per topic, grouped into five curriculum families.
 * Practical families run warm; theory runs cool petrol — the warm-anchor /
 * cool-accent balance from the liked-sites palette DNA. Shared ideas are
 * brass pins: warm cream, lit slightly brighter than everything else.
 */

export const ROOM = {
    // background gradient stops, top to bottom (cool -> warm-dark)
    bgTop: '#0E1712',
    bgMid: '#15201A',
    bgBase: '#1F2A1C',
    lamp: 'rgba(226, 188, 96, 0.09)',   // warm pool of light at the base
    fog: '#121B15',
    ink: '#F2EBE0',          // cream text on dark
    inkSoft: '#BCC2A8',      // supporting text (dark-mode field-soft)
    paper: '#F8F2E8',        // index cards stay warm paper
    paperInk: '#1F2A1C',
    line: '#D4C9B4',
    field: '#3A4A35',
    sienna: '#D4724F',       // lifted for dark
    mustard: '#E2BC60',      // lifted for dark
    brass: '#F2E2B8',        // shared-idea pins
};

export const FAMILIES = [
    { key: 'capture', label: 'Capture', swatch: '#D4724F' },
    { key: 'creating', label: 'Creating sound', swatch: '#DBA83F' },
    { key: 'shaping', label: 'Shaping sound', swatch: '#8FBF8A' },
    { key: 'mix', label: 'The mix', swatch: '#D48A7F' },
    { key: 'theory', label: 'Theory', swatch: '#6FA3B8' },
];

/* One ink per topic, keyed by spec number (node.parent). Hues walk within
 * each family so neighbouring clusters stay distinct without turning into
 * a rainbow — all dusty, all lifted for a dark ground, no indigo, no neon. */
export const TOPIC_INKS = {
    // Capture — coppers and siennas
    '1.1': { ink: '#D4724F', family: 'capture' },   // Software and Hardware
    '1.2': { ink: '#E0906A', family: 'capture' },   // Microphones

    // Creating sound — ambers, golds, honey
    '1.3': { ink: '#E8C468', family: 'creating' },  // Synthesis
    '1.4': { ink: '#DBA83F', family: 'creating' },  // Sampling
    '1.5': { ink: '#C79549', family: 'creating' },  // Sequencing
    '1.6': { ink: '#E5B98C', family: 'creating' },  // Audio Editing
    '1.7': { ink: '#D19C2E', family: 'creating' },  // Pitch and Rhythm Correction
    '1.8': { ink: '#BC8B55', family: 'creating' },  // Automation

    // Shaping sound — sages, jades, leaf greens
    '1.9': { ink: '#8FBF8A', family: 'shaping' },   // Dynamic Processing
    '1.10': { ink: '#A9CE9C', family: 'shaping' },  // Stereo
    '1.11': { ink: '#79B07C', family: 'shaping' },  // EQ
    '1.12d': { ink: '#94C4A8', family: 'shaping' }, // Delay
    '1.12r': { ink: '#B7D2B0', family: 'shaping' }, // Reverb
    '1.12m': { ink: '#6FA476', family: 'shaping' }, // Modulation
    '1.12x': { ink: '#8AB08F', family: 'shaping' }, // Distortion

    // The mix — clay and rose
    '1.13': { ink: '#D48A7F', family: 'mix' },      // Balance and Blend
    '1.14': { ink: '#C46A62', family: 'mix' },      // Mastering

    // Theory — petrol and harbour blues (the cool counterpoint)
    '2.1': { ink: '#6FA3B8', family: 'theory' },    // Acoustics
    '2.2': { ink: '#8FB8C4', family: 'theory' },    // Monitor Speakers
    '2.3': { ink: '#5C93A8', family: 'theory' },    // Signals
    '2.4': { ink: '#7FAEA8', family: 'theory' },    // Digital Analogue
    '2.5': { ink: '#9CC2CE', family: 'theory' },    // Numeracy
    '2.6': { ink: '#4F8296', family: 'theory' },    // Levels
};

export function topicInk(parent) {
    return TOPIC_INKS[parent]?.ink ?? ROOM.inkSoft;
}

export function topicFamily(parent) {
    const key = TOPIC_INKS[parent]?.family;
    return FAMILIES.find((f) => f.key === key) ?? null;
}

/* ---------- small colour maths (hex in, hex/rgb out) ---------- */

export function hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function mixHex(a, b, t) {
    const [ar, ag, ab] = hexToRgb(a);
    const [br, bg, bb] = hexToRgb(b);
    const c = (x, y) => Math.round(x + (y - x) * t);
    return `#${((1 << 24) | (c(ar, br) << 16) | (c(ag, bg) << 8) | c(ab, bb)).toString(16).slice(1)}`;
}

/* Concept nodes carry a quiet echo of their topic's ink; dimmed edges and
 * dimmed nodes sink toward the fog rather than toward black. */
export function conceptInk(parent) {
    return mixHex(topicInk(parent), '#8A9282', 0.45);
}

export function dimmed(hex, amount = 0.82) {
    return mixHex(hex, ROOM.fog, amount);
}
