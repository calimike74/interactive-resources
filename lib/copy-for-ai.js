/**
 * Copy for AI — Interactive Resources
 * Production-focused prompt builder for students to paste into any AI assistant.
 */

export const PRODUCTION_MODES = [
    {
        key: 'ableton',
        label: 'In Ableton',
        description: 'Apply in your DAW',
    },
    {
        key: 'explain',
        label: 'Explain settings',
        description: 'What these do & why',
    },
    {
        key: 'experiment',
        label: 'What to try next',
        description: 'Experiment ideas',
    },
];

function getProductionPrompt(mode, toolName) {
    switch (mode) {
        case 'ableton':
            return `Show me how to recreate these ${toolName} settings in Ableton Live 12. Name the specific plugin I should use (e.g. Compressor, EQ Eight, Wavetable), walk me through the signal routing, and tell me exactly where each parameter maps in the Ableton UI.`;
        case 'explain':
            return `Explain what each of these ${toolName} settings does to the sound and why these values work well together. Use simple language and give me a real-world analogy for each parameter.`;
        case 'experiment':
            return `Based on my current ${toolName} settings, suggest 3 variations I should try next. For each variation, tell me which parameters to change, what sonic difference I should listen for, and what genre or production context it works best in.`;
        default:
            return `Help me understand these ${toolName} settings and how to apply them in Ableton Live 12.`;
    }
}

/**
 * Build markdown for compressor settings.
 */
export function buildCompressorCopyMarkdown({ threshold, ratio, attack, release, knee, makeupGain, source, presetName, quizResults, mode = 'ableton' }) {
    const lines = [];

    lines.push('# Context');
    lines.push("I'm an A-Level Music Technology student using Ableton Live 12.");
    lines.push("I'm experimenting with compression settings in an interactive tool.");
    lines.push('');

    lines.push('# My Compressor Settings');
    if (presetName) lines.push(`Preset: ${presetName}`);
    lines.push(`- Source: ${source || 'drums'}`);
    lines.push(`- Threshold: ${threshold} dB`);
    lines.push(`- Ratio: ${ratio}:1`);
    lines.push(`- Attack: ${attack} ms`);
    lines.push(`- Release: ${release} ms`);
    lines.push(`- Knee: ${knee} dB`);
    lines.push(`- Makeup Gain: ${makeupGain} dB`);
    lines.push('');

    if (quizResults) {
        appendQuizResults(lines, quizResults);
    }

    lines.push('# What I need help with');
    lines.push(getProductionPrompt(mode, 'compressor'));

    return lines.join('\n');
}

/**
 * Build markdown for EQ settings.
 */
export function buildEQCopyMarkdown({ bands, gains, presetName, quizResults, mode = 'ableton' }) {
    const lines = [];

    lines.push('# Context');
    lines.push("I'm an A-Level Music Technology student using Ableton Live 12.");
    lines.push("I'm experimenting with EQ settings in an interactive tool.");
    lines.push('');

    lines.push('# My EQ Settings');
    if (presetName) lines.push(`Preset: ${presetName}`);
    lines.push('| Band | Gain |');
    lines.push('|------|------|');
    bands.forEach((band, i) => {
        const gain = gains[i];
        if (gain !== 0) {
            lines.push(`| ${band.label} Hz | ${gain > 0 ? '+' : ''}${gain} dB |`);
        }
    });
    const flat = gains.every(g => g === 0);
    if (flat) lines.push('| (all bands) | 0 dB (flat) |');
    lines.push('');

    if (quizResults) {
        appendQuizResults(lines, quizResults);
    }

    lines.push('# What I need help with');
    lines.push(getProductionPrompt(mode, 'EQ'));

    return lines.join('\n');
}

/**
 * Build markdown for synth settings.
 */
export function buildSynthCopyMarkdown({ waveform, filterType, cutoff, resonance, attack, decay, sustain, release, octave, presetName, quizResults, mode = 'ableton' }) {
    const lines = [];

    lines.push('# Context');
    lines.push("I'm an A-Level Music Technology student using Ableton Live 12.");
    lines.push("I'm experimenting with subtractive synthesis in an interactive tool.");
    lines.push('');

    lines.push('# My Synth Settings');
    if (presetName) lines.push(`Preset: ${presetName}`);
    lines.push(`- Waveform: ${waveform}`);
    lines.push(`- Octave: ${octave >= 0 ? '+' : ''}${octave}`);
    lines.push(`- Filter: ${filterType}, cutoff ${cutoff} Hz, resonance ${resonance}`);
    lines.push(`- Envelope: A=${attack}s, D=${decay}s, S=${sustain}, R=${release}s`);
    lines.push('');

    if (quizResults) {
        appendQuizResults(lines, quizResults);
    }

    lines.push('# What I need help with');
    lines.push(getProductionPrompt(mode, 'synthesizer'));

    return lines.join('\n');
}

function appendQuizResults(lines, quizResults) {
    const wrong = quizResults.filter(r => !r.correct);
    if (wrong.length === 0) return;

    lines.push('# Quiz Questions I Got Wrong');
    for (const r of wrong) {
        lines.push(`- **Q:** ${r.question}`);
        lines.push(`  - My answer: ${r.studentAnswer}`);
        lines.push(`  - Correct: ${r.correctAnswer}`);
        if (r.explanation) lines.push(`  - ${r.explanation}`);
    }
    lines.push('');
}
