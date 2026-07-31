/* The room's second truth — the signal chain.
 *
 * In concept space the course hangs by its ideas; flip the layout and every
 * topic flies to its place in the studio chain, microphone to monitor. The
 * ten seconds of flight is itself the lesson: watch EQ leave its family and
 * land mid-chain. Anchors position topics only — concepts follow their
 * parent springs, so each station keeps its cloud.
 */

export const STUDIO_ANCHORS = {
    // sources, in parallel
    '1.2': { x: -1050, y: 260, z: 40 },     // Microphones
    '1.3': { x: -1050, y: 40, z: -60 },     // Synthesis
    '1.4': { x: -1050, y: -180, z: 60 },    // Sampling
    '1.5': { x: -1050, y: -400, z: -40 },   // Sequencing

    // into the desk
    '2.3': { x: -760, y: 200, z: -50 },     // Signals (the leads)
    '2.4': { x: -760, y: -40, z: 50 },      // Digital Analogue (conversion)
    '1.1': { x: -500, y: 60, z: 0 },        // Software and Hardware (the DAW)

    // editing inside the DAW
    '1.6': { x: -260, y: 200, z: 60 },      // Audio Editing
    '1.7': { x: -260, y: -80, z: -60 },     // Pitch and Rhythm Correction

    // the processing rack
    '1.11': { x: -20, y: 220, z: -40 },     // EQ
    '1.9': { x: -20, y: -60, z: 40 },       // Dynamic Processing
    '1.12d': { x: 240, y: 300, z: 50 },     // Delay
    '1.12r': { x: 240, y: 80, z: -50 },     // Reverb
    '1.12m': { x: 240, y: -140, z: 50 },    // Modulation
    '1.12x': { x: 240, y: -360, z: -50 },   // Distortion

    // rides and the mix
    '1.8': { x: 490, y: 40, z: 0 },         // Automation
    '1.13': { x: 730, y: 180, z: 40 },      // Balance and Blend
    '1.10': { x: 730, y: -80, z: -40 },     // Stereo

    // the end of the chain
    '1.14': { x: 980, y: 60, z: 0 },        // Mastering
    '2.6': { x: 980, y: 300, z: 40 },       // Levels (the meters above)
    '2.2': { x: 1230, y: 40, z: 0 },        // Monitor Speakers
    '2.1': { x: 1230, y: 300, z: -40 },     // Acoustics (the room around them)

    // the maths that touches everything, floating above the middle
    '2.5': { x: 0, y: 560, z: 0 },          // Numeracy
};

/* Ordered stations for anything that wants to narrate the chain. */
export const CHAIN_ORDER = [
    '1.2', '1.3', '1.4', '1.5', '2.3', '2.4', '1.1', '1.6', '1.7',
    '1.11', '1.9', '1.12d', '1.12r', '1.12m', '1.12x',
    '1.8', '1.13', '1.10', '1.14', '2.6', '2.2', '2.1', '2.5',
];
