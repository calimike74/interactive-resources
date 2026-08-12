/**
 * Copy for AI — Interactive Resources
 * Production-focused prompt builder for students to paste into any AI assistant.
 */

export const PRODUCTION_MODES = [
    {
        key: 'daw',
        label: 'In your DAW',
        description: 'Apply these settings',
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

const LEARN_MODE_INSTRUCTIONS = `# Learning Instructions
IMPORTANT: Do NOT give me direct answers. You are my tutor, not my copilot.
- Start by asking me what I already know
- If I explain correctly, push me further with harder questions
- If I'm stuck, give hints and leading questions — not answers
- Only explain directly if I explicitly ask you to after attempting it myself
- Use the Feynman technique: if I can't explain it simply, I don't understand it
`;

function getProductionPrompt(mode, toolName, learnMode = false) {
    if (learnMode) {
        return getLearnProductionPrompt(mode, toolName);
    }
    switch (mode) {
        case 'daw':
            return `Show me how to recreate these ${toolName} settings in my DAW. Name the type of plugin I should look for (e.g. compressor, parametric EQ, subtractive synth), walk me through the signal routing, and tell me roughly where each parameter maps in a typical plugin UI.`;
        case 'explain':
            return `Explain what each of these ${toolName} settings does to the sound and why these values work well together. Use simple language and give me a real-world analogy for each parameter.`;
        case 'experiment':
            return `Based on my current ${toolName} settings, suggest 3 variations I should try next. For each variation, tell me which parameters to change, what sonic difference I should listen for, and what genre or production context it works best in.`;
        default:
            return `Help me understand these ${toolName} settings and how to apply them in my DAW.`;
    }
}

function getLearnProductionPrompt(mode, toolName) {
    switch (mode) {
        case 'daw':
            return `Before showing me, ask me which DAW and plugin I'd use for this ${toolName} and where each parameter maps. Guide me through finding the right settings myself.`;
        case 'explain':
            return `Ask me to explain what I think each ${toolName} parameter does to the sound. Correct misconceptions through questions, not lectures.`;
        case 'experiment':
            return `Ask me what I'm trying to achieve sonically with this ${toolName}. Then ask me which parameters I'd change and why, before suggesting alternatives.`;
        default:
            return `Ask me what I already know about these ${toolName} settings before helping me understand them.`;
    }
}

/**
 * Build markdown for compressor settings.
 */
export function buildCompressorCopyMarkdown({ threshold, ratio, attack, release, knee, makeupGain, source, presetName, quizResults, mode = 'daw', learnMode = false }) {
    const lines = [];

    lines.push('# Context');
    lines.push("I'm an A-Level Music Technology student.");
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

    if (learnMode) {
        lines.push(LEARN_MODE_INSTRUCTIONS);
    }

    lines.push('# What I need help with');
    lines.push(getProductionPrompt(mode, 'compressor', learnMode));

    return lines.join('\n');
}

/**
 * Build markdown for EQ settings.
 */
export function buildEQCopyMarkdown({ bands, gains, presetName, quizResults, mode = 'daw', learnMode = false }) {
    const lines = [];

    lines.push('# Context');
    lines.push("I'm an A-Level Music Technology student.");
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

    if (learnMode) {
        lines.push(LEARN_MODE_INSTRUCTIONS);
    }

    lines.push('# What I need help with');
    lines.push(getProductionPrompt(mode, 'EQ', learnMode));

    return lines.join('\n');
}

/**
 * Build markdown for synth settings.
 */
export function buildSynthCopyMarkdown({ waveform, filterType, cutoff, resonance, attack, decay, sustain, release, octave, presetName, quizResults, mode = 'daw', learnMode = false }) {
    const lines = [];

    lines.push('# Context');
    lines.push("I'm an A-Level Music Technology student.");
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

    if (learnMode) {
        lines.push(LEARN_MODE_INSTRUCTIONS);
    }

    lines.push('# What I need help with');
    lines.push(getProductionPrompt(mode, 'synthesiser', learnMode));

    return lines.join('\n');
}

/* ─── Flashcard decks ─────────────────────────────────────────────────── */

export const FLASHCARD_MODES = [
    { key: 'explain', label: 'Explain in depth', description: 'Extended, with links to related topics' },
    { key: 'quiz', label: 'Quiz me', description: 'Five questions across difficulty tiers' },
    { key: 'exam', label: 'Exam-style question', description: 'A-Level question with mark scheme' },
];

function getFlashcardPrompt(mode, learnMode) {
    if (learnMode) {
        switch (mode) {
            case 'explain':
                return "Before explaining, ask me what I already understand about this concept. Then correct and extend my understanding through Socratic questions — hints, not answers.";
            case 'quiz':
                return "Ask me 3–5 increasingly challenging questions on this concept. Wait for each answer. If I'm stuck, give hints rather than the solution.";
            case 'exam':
                return "Ask me to write an exam-style answer to this card first. Then critique my response against A-Level mark scheme criteria through questions, not direct correction.";
            default:
                return "Help me study this flashcard using the Feynman technique — ask me to explain it simply, correct any gaps by questioning me.";
        }
    }
    switch (mode) {
        case 'explain':
            return "Explain this concept in more depth for an A-Level Music Technology student. Link it to related topics on the specification (EQ, reverb, compression, modulation, mixing). Give two extended real-world production examples.";
        case 'quiz':
            return "Quiz me on this flashcard and the surrounding specification content. Ask five related questions of increasing difficulty, covering Foundation through Advanced A-Level requirements. Wait for my answer each time before giving feedback.";
        case 'exam':
            return "Write an A-Level Music Technology exam-style question on this topic (6–10 marks), Pearson Edexcel style. Provide a full mark scheme, then show an example top-band answer I can use as a model.";
        default:
            return "Help me understand this flashcard in more depth.";
    }
}

function escapeHtml(s) {
    return String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Build rich HTML for a single flashcard — used for the 'text/html' clipboard
 * payload so it pastes into OneNote / Word / Apple Notes as formatted rich
 * text (headings, accent-bar callouts, colours) rather than raw markdown.
 *
 * All styling is inline — OneNote strips <style> blocks and external CSS but
 * keeps inline style attributes.
 */
export function buildFlashcardCopyHtml(card, opts = {}) {
    const { topicRef = '1.12 Delay' } = opts;
    const difficultyLabel = ['', 'Foundation', 'Standard', 'Advanced'][card.difficulty] || '';
    const meta = [topicRef, card.category, difficultyLabel].filter(Boolean).join(' · ');

    const S = {
        wrap: "font-family: 'Segoe UI', -apple-system, Arial, sans-serif; color: #1A1A2E; line-height: 1.55; max-width: 640px;",
        title: "font-family: Georgia, 'Playfair Display', serif; font-size: 20px; font-weight: 600; color: #1A1A2E; margin: 0 0 12px 0; line-height: 1.3;",
        body: "font-size: 14px; margin: 0 0 14px 0; color: #1A1A2E;",
        blockInfo: "border-left: 3px solid #2563EB; padding: 10px 14px; background: #EEF3FC; margin: 0 0 10px 0;",
        blockTry: "border-left: 3px solid #D97706; padding: 10px 14px; background: #FCF5EC; margin: 0 0 10px 0;",
        blockLabel: "display: block; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.1em; color: #4A4F5A; font-weight: 600; margin-bottom: 4px;",
        blockText: "font-size: 13.5px; color: #1A1A2E;",
        meta: "font-size: 11.5px; color: #8B909A; margin: 18px 0 0 0; font-style: italic; border-top: 1px solid #E5E7EB; padding-top: 8px;",
    };

    const parts = [];
    parts.push(`<div style="${S.wrap}">`);
    parts.push(`<h2 style="${S.title}">${escapeHtml(card.question)}</h2>`);
    parts.push(`<p style="${S.body}">${escapeHtml(card.answer)}</p>`);
    if (card.practicalExample) {
        parts.push(`<div style="${S.blockInfo}"><span style="${S.blockLabel}">Practical example</span><span style="${S.blockText}">${escapeHtml(card.practicalExample)}</span></div>`);
    }
    if (card.furtherLearning) {
        parts.push(`<div style="${S.blockTry}"><span style="${S.blockLabel}">Try this</span><span style="${S.blockText}">${escapeHtml(card.furtherLearning)}</span></div>`);
    }
    if (meta) {
        parts.push(`<p style="${S.meta}">${escapeHtml(meta)}</p>`);
    }
    parts.push(`</div>`);
    return parts.join('');
}

/**
 * Plain-text version of a flashcard — clean, no markdown syntax. Used as the
 * 'text/plain' clipboard fallback for apps that don't accept HTML.
 */
export function buildFlashcardCopyText(card, opts = {}) {
    const { topicRef = '1.12 Delay' } = opts;
    const difficultyLabel = ['', 'Foundation', 'Standard', 'Advanced'][card.difficulty] || '';
    const meta = [topicRef, card.category, difficultyLabel].filter(Boolean).join(' · ');

    const out = [];
    out.push(card.question);
    out.push('');
    out.push(card.answer);
    out.push('');
    if (card.practicalExample) {
        out.push(`Practical example: ${card.practicalExample}`);
        out.push('');
    }
    if (card.furtherLearning) {
        out.push(`Try this: ${card.furtherLearning}`);
        out.push('');
    }
    if (meta) out.push(meta);
    return out.join('\n');
}

/**
 * Build markdown for a single flashcard — either plain notes (mode === 'notes')
 * or a context-rich prompt for an AI tutor (mode ∈ FLASHCARD_MODES).
 */
export function buildFlashcardCopyMarkdown(card, opts = {}) {
    const { mode = 'notes', learnMode = false, topicRef = '1.12 Delay' } = opts;
    const lines = [];
    const difficultyLabel = ['', 'Foundation', 'Standard', 'Advanced'][card.difficulty] || '';

    if (mode !== 'notes') {
        if (learnMode) {
            lines.push(LEARN_MODE_INSTRUCTIONS);
        }
        lines.push('# Context');
        lines.push("I'm an A-Level Music Technology student (Pearson Edexcel, Component 4).");
        lines.push(`Topic: ${topicRef}.`);
        lines.push('');
    }

    lines.push(`## ${card.question}`);
    lines.push('');
    lines.push(card.answer);
    lines.push('');
    if (card.practicalExample) {
        lines.push(`**Practical example.** ${card.practicalExample}`);
        lines.push('');
    }
    if (card.furtherLearning) {
        lines.push(`**Try this.** ${card.furtherLearning}`);
        lines.push('');
    }
    const meta = [topicRef, card.category, difficultyLabel].filter(Boolean).join(' · ');
    if (meta) lines.push(`_${meta}_`);

    if (mode !== 'notes') {
        lines.push('');
        lines.push('---');
        lines.push('');
        lines.push(getFlashcardPrompt(mode, learnMode));
    }

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
