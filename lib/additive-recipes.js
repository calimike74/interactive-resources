/**
 * The eight-harmonic recipes behind the Additive Synth Explorer, and the shared
 * harmonic palette.
 *
 * These sit in lib/ rather than inside the component for one reason: the claims
 * they make are checkable, and a claim that can be checked should be. "Hollow is
 * odd harmonics only" and "buzzy is every harmonic, falling" are statements about
 * physics that a student will be marked on. tests/additive-recipes.test.mjs
 * asserts them, and a React component in a .jsx file cannot be imported by the
 * node test runner.
 *
 * The same array drives the drawing, the bars and the eight oscillators, so the
 * picture and the sound cannot drift apart.
 */

export const HARMONIC_COUNT = 8;

/**
 * One colour per harmonic, so a harmonic keeps its identity across every display
 * on the site.
 *
 * HARM is the darker set, for light backgrounds (slider dots and accents).
 * HARM_STAGE is the brighter set, for the warm-dark stage.
 *
 * Both are verbatim from the approved lab tool. HARM_STAGE is also the exact
 * array in components/resources/HarmonicSpectrum.jsx, so H1 is the same orange
 * on the additive and subtractive tools — the test below pins that.
 */
export const HARM = ['#C15B34', '#D5892B', '#B89322', '#5F8A34', '#2C8E7E', '#3877B8', '#665CB8', '#A94E8E'];
export const HARM_STAGE = ['#F08A57', '#F4A83E', '#EACB4F', '#A9CE5E', '#48CDB6', '#5FAAF0', '#9E90F2', '#E585C4'];

/**
 * amp[i] = strength of harmonic i+1, 0..1. sign[i] = phase, +1 or -1, set so the
 * classic shapes draw the right way up.
 *
 * Each recipe is named for how it SOUNDS, not for its waveform. A student meets
 * the sound first and the label second — the waveform name is in the description,
 * where it arrives as an explanation rather than as a prerequisite.
 */
export const SOUNDS = {
    pure: {
        label: 'Pure',
        sub: 'one clean tone',
        amp: [1, 0, 0, 0, 0, 0, 0, 0],
        sign: [1, 1, 1, 1, 1, 1, 1, 1],
        desc: 'One clean tone: just the base note, nothing stacked on top. The simplest sound there is.',
    },
    warm: {
        label: 'Warm',
        sub: 'full and rounded',
        amp: [1, 0.5, 0.3, 0.16, 0.08, 0.04, 0.02, 0.01],
        sign: [1, 1, 1, 1, 1, 1, 1, 1],
        desc: 'Strong low harmonics with the top gently rolled off, full, rounded and mellow.',
    },
    hollow: {
        label: 'Hollow',
        sub: 'woody, like a clarinet',
        amp: [1, 0, 1 / 3, 0, 1 / 5, 0, 1 / 7, 0],
        sign: [1, 1, 1, 1, 1, 1, 1, 1],
        desc: 'Odd harmonics only: the woody, hollow sound of a square wave, close to a clarinet.',
    },
    buzzy: {
        label: 'Buzzy',
        sub: 'brassy sawtooth',
        amp: [1, 1 / 2, 1 / 3, 1 / 4, 1 / 5, 1 / 6, 1 / 7, 1 / 8],
        sign: [1, -1, 1, -1, 1, -1, 1, -1],
        desc: 'Every harmonic present: the buzzy, brassy edge of a sawtooth wave.',
    },
    bright: {
        label: 'Bright',
        sub: 'brilliant top end',
        amp: [1, 1 / Math.sqrt(2), 1 / Math.sqrt(3), 1 / Math.sqrt(4), 1 / Math.sqrt(5), 1 / Math.sqrt(6), 1 / Math.sqrt(7), 1 / Math.sqrt(8)],
        sign: [1, 1, 1, 1, 1, 1, 1, 1],
        desc: 'Lots of energy up top: the harmonics fade slowly, so the sound is brilliant and edgy.',
    },
};

/** Display order of the sound cards: simplest first, brightest last. */
export const SOUND_ORDER = ['pure', 'warm', 'hollow', 'buzzy', 'bright'];

/**
 * The waveform's height above the centre line at a given phase, for a recipe.
 *
 * This is the single function that turns eight numbers into a shape. The circles
 * on the stage are the same sum drawn as a chain rather than as a curve, which is
 * why the chain's tip and the pen always agree.
 */
export function waveVal(amp, sign, phase) {
    let v = 0;
    for (let i = 0; i < HARMONIC_COUNT; i++) {
        if (!amp[i]) continue;
        v += amp[i] * sign[i] * Math.sin((i + 1) * phase);
    }
    return v;
}

/**
 * The harmonic content of each ideal oscillator waveform, normalised so the
 * fundamental is 1. Used by the subtractive explorer's circle display.
 *
 *   sine      the fundamental alone
 *   square    odd harmonics at 1/n, all in phase
 *   sawtooth  every harmonic at 1/n, alternating
 *   triangle  odd harmonics at 1/n^2, alternating every other one
 *
 * Phase is returned in radians rather than as a +1/-1 sign, because a filter's
 * phase response is a continuous angle and the two have to add. Drawing
 * magnitude only would put a curve on screen that disagreed with the
 * oscilloscope measuring the same sound two panes away.
 */
/**
 * How much of the pane one full chain of circles is allowed to fill.
 *
 * This looked like a rendering detail and was in fact the whole promise. The
 * first version divided by the sum of the harmonics being drawn, which
 * renormalises every frame: close the filter, the surviving harmonics sum to
 * less, and the picture scales UP to fill the space again. So the one thing the
 * display exists to show — the filter eating the circles — was the one thing it
 * could not show. The outer circles vanished while the fundamental grew to
 * replace them, and the wave never lost any height.
 *
 * Anchoring the divisor on the UNFILTERED waveform makes "close the cutoff and
 * the circles shrink" literally true, and the traced wave loses amplitude with
 * them, which is what a low-pass really does to the sound.
 *
 * The live sum still counts, but only when it is the larger of the two:
 * resonance can push a harmonic well above its unfiltered strength (Q of 20 is
 * about +26dB), and without that term the chain would draw straight off the
 * edge of the canvas.
 */
export function chainScaleDivisor(idealAmp, amp, minimum = 0.35) {
    let ideal = 0;
    let live = 0;
    for (let i = 0; i < HARMONIC_COUNT; i++) {
        ideal += idealAmp[i] || 0;
        live += amp[i] || 0;
    }
    return Math.max(minimum, ideal, live);
}

export function idealHarmonics(type) {
    const amp = new Array(HARMONIC_COUNT).fill(0);
    const phase = new Array(HARMONIC_COUNT).fill(0);
    for (let n = 1; n <= HARMONIC_COUNT; n++) {
        const i = n - 1;
        if (type === 'sine') {
            if (n === 1) amp[i] = 1;
        } else if (type === 'square') {
            if (n % 2 === 1) amp[i] = 1 / n;
        } else if (type === 'sawtooth') {
            amp[i] = 1 / n;
            if (n % 2 === 0) phase[i] = Math.PI;
        } else if (type === 'triangle') {
            if (n % 2 === 1) {
                amp[i] = 1 / (n * n);
                if ((((n - 1) / 2) % 2) === 1) phase[i] = Math.PI;
            }
        }
    }
    return { amp, phase };
}
