// The Synth bench's three levels, as three jobs (the pattern set on the
// Delay bench, 27 Aug 2026):
//
//   Core       the bench SHOWS: names what you hear (the waves, the filter,
//              the envelope, the LFO) and says what to try.
//   A-level    the bench JUDGES the way Q6 does: the synth as sections in
//              signal order, each judged for the part it is playing, the
//              scheme's line with its year when a paper's task is set.
//   Extension  the bench OPENS THE MACHINE: control signals in time, the
//              envelope asking and the amplifier and cutoff obeying, the LFO
//              drawn to scale as an oscillator too slow to hear.
//
// Every scheme line quoted here is from the 9MT0/04 and 9MT0/41 mark
// schemes and Principal Examiner reports as extracted from the vault's
// exam PDFs (2019 Q6, 2020 Q2(b), 2022 AS Q2, 2023 Q2(d), 2023 AS Q3,
// 2024 Q6, 2024 AS Q2(c), 2025 Q3(a)). Pure functions over the model;
// SynthBench renders them.

import {
    WAVES, OSC2, FILTERS, LFO_TARGETS, LFO_SHAPES, VOICES, GLIDES, ARPS, PARTS, SECTIONS, SECTION_IDS, TASKS, GRADE_WORD, BPM, SUB_OCTS,
    fmtHz, fmtMs, fmtRate, octaveSaid, lfoOn, lfoSwing, lfoWord, envOctaves, resDb, readings, verdict, judgeAll, gateMs, noteName, homeMidi,
    waveOf, sourceSaid, pwmOn, harmonicsSaid,
} from './synth-model.js';

export const DEPTH_LINES = {
    core: 'the bench names what you hear and tells you what to try. The stage is the wave leaving the synth beside its harmonics, the filter drawn over them in gold: drag its dot and the Cutoff slider follows. The keys at the foot play the voice, and so do A to K.',
    alevel: 'the bench now judges the patch the way Q6 does: the synth as sections in signal order, each judged for the part it plays, and the scheme\'s own line with its year when a paper\'s task is set. Touch a section and the line judges it.',
    extension: 'the bench opens the machine: one note drawn in time. The envelope is a control signal that asks; the amplifier and the cutoff obey it; the LFO is an oscillator drawn to scale, too slow to hear, moving what it points at.',
};

export const DEPTH_TEACH = {
    alevel: 'Write it in that order: name the section and its setting (AO3), then its impact on the sound and whether that suits the part (AO4).',
    extension: 'The 2024 report: candidates "mistakenly thought that the LFO was something audible rather than a control signal". This stage is the answer.',
};

const seg = (ao, text) => ({ ao, text });
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// ---- Core: the hearing line and the next move --------------------------------------
// The VCO and its mix in one phrase: "two square waves 12 cents apart",
// "a saw wave with a square sub-oscillator an octave down, doubled 14 cents apart".
const WAVE_WORD = { square: 'square', saw: 'saw', tri: 'triangle', sine: 'sine' };
export function oscSaid(state) {
    const s = state;
    const base = sourceSaid(s);
    const single = (s.pulse > 0) !== (s.saw > 0) && s.sub === 0 && s.noise === 0;
    const w = WAVE_WORD[waveOf(s)];
    if (s.osc2 === 'pair') {
        const apart = s.detune > 0 ? `${s.detune} cents apart` : 'in unison';
        return single && w ? `two ${w} waves ${apart}` : `${base}, doubled ${apart}`;
    }
    if (s.osc2 === 'fifth') return single && w ? `two ${w} waves a fifth apart` : `${base}, with a second VCO a fifth above`;
    return base;
}
export function hearingLine(state) {
    const r = readings(state);
    const p = PARTS[state.part];
    const osc = oscSaid(state);
    const filt = state.bypass ? 'with the filter open' : `through a ${FILTERS[state.filter].name} at ${fmtHz(state.cutoff)}${state.res >= 40 ? ', resonant' : ''}`;
    const env = state.vca === 'gate' ? 'The VCA is on Gate, so each note is full the moment the key is down' : state.attack >= 200 ? `Each note swells in over ${fmtMs(state.attack)}` : `Each note starts in ${fmtMs(state.attack)}`;
    const rel = state.vca === 'gate' ? 'and stops dead when it lifts' : state.release >= 800 ? `and rings for ${fmtMs(state.release)} after the key lifts` : `and stops ${fmtMs(state.release)} after the key lifts`;
    const lfo = lfoOn(state) ? ` The LFO adds ${lfoWord(state)} at ${fmtRate(state.lfoRate)}${pwmOn(state) ? ', and moves the pulse width' : ''}.` : pwmOn(state) ? ` The LFO moves the pulse width at ${fmtRate(state.lfoRate)}: the even harmonics come and go.` : '';
    return `You are hearing ${p.said} on ${osc}${state.octave !== 0 ? ` ${octaveSaid(state.octave)}` : ''}, ${filt}: ${r.brightness}. ${env} ${rel}.${lfo}`;
}

const PRESET_MOVES = {
    bass: 'slide Detune to zero and hear the two saws collapse into one; then slide Sub to zero and hear the weight go',
    pad: 'slide Attack down to 5 ms: the same chords become a stab; slide it back past 500 ms and the pad swells again',
    stab: 'push Sustain up to 100 % and every stab lasts as long as the key; the envelope is the difference between a stab and a pad',
    lead: 'press the Saw slider\'s name and take the wave through Tri to Sine: the harmonics thin to one and the filter runs out of work',
    as2023: 'turn Detune to zero and hear the two squares collapse into one; then turn it past 30 and hear detune become out of tune',
    as2024: 'drag the gold dot to the right and watch the saws\' harmonics come back as the keys brighten past the example',
    a2025: 'switch to Extension and watch the LFO lane: the wobble on the cutoff is that slow wave, not a sound',
    fills2023: 'turn Release down to 10 ms and hear the tail the 2020 report says only the best candidates noticed',
    judgeBass: 'switch to A-level and touch ENV: a 600 ms attack on a bass is the fault, and the sections say so',
    judgePad: 'switch to A-level, press Poly in the More row, then set the VCA to Env: the chord\'s four notes come back, and stop stopping dead',
};
export function nextMove(state) {
    if (state.presetId && PRESET_MOVES[state.presetId]) return PRESET_MOVES[state.presetId];
    if (state.shape === 'sine' && state.saw > 0) return 'press the slider\'s name to set the wave back to Saw and watch the harmonics return for the filter to work on';
    if (state.saw === 0 && state.pulse > 0) return 'raise Saw in the source mixer and watch the even harmonics fill in for the filter to work on';
    if (!pwmOn(state) && state.pulse > 0) return 'set PW by LFO and watch the pulse breathe on the WAVE screen as its even harmonics come and go';
    if (!lfoOn(state)) return 'turn the LFO\'s Depth up with Pitch chosen and hear vibrato at 5 Hz';
    return 'switch to A-level and read each section\'s verdict for the part';
}

// ---- A-level: the judge -----------------------------------------------------------------
const PE = {
    sections2024: '"Candidates who divided up their writing into subheadings, one for each synthesiser section, provided the most concise and structured writing yielding highest marks" (2024)',
    fast2024: '"The most common AO4 marks were for describing the fast attack and release" (2024)',
    lfo2024: '"Very commonly, candidates mistakenly thought that the LFO was something audible rather than a control signal" (2024)',
    lfo2019: '"a surprising number of candidates ... thought that the LFO was for audible bass, rather than a control signal" (2019)',
    filter2024: '"many learners misidentified it as a boost/cut rather than an LPF and would discuss what resonance was but didn\'t discuss its impact on the sound" (2024)',
    filterEnv2019: '"only the top performing candidates noticed that the envelope parameters were routed to the filter cutoff and not the amplitude" (2019)',
    pwm2024: '"It was very rare to see candidates that fully understood that the LFO was controlling the pulse width modulation of a pulse wave" (2024)',
    pwm2019: '"many candidates thought that this was a square wave and did not appreciate that the pulse width was being modulated by the LFO" (2019)',
    gate2019: 'candidates confused "the VCA gate (disabling the envelope) with a noise gate designed to cut out background noise" (2019)',
    sub2024: '"Candidates were often successful in discussing the sub-oscillator" (2024)',
    octave2023: 'the 2023 AS report\'s common issues: no detune, and the wrong octave, one octave too high',
    chords2022: 'a monophonic patch "did not play the complete chords" (2022 AS)',
    release2020: '"Only the best candidates noticed that the release was very short, many leaving an audible tail presumably from a preset" (2020)',
};

const SECTION_OF_LAST = { osc: 'osc', pulse: 'osc', saw: 'osc', shape: 'osc', sub: 'osc', noise: 'osc', width: 'osc', pwm: 'osc', subOct: 'osc', octave: 'osc', detune: 'osc', osc2: 'osc', filter: 'filter', cutoff: 'filter', res: 'filter', envAmt: 'filter', stage: 'filter', env: 'env', attack: 'env', decay: 'env', sustain: 'env', release: 'env', lfo: 'lfo', lfoTarget: 'lfo', lfoRate: 'lfo', lfoDepth: 'lfo', lfoShape: 'lfo', voices: 'voices', vca: 'voices', glide: 'voices', arp: 'voices', level: 'voices' };
export const sectionOfLast = (last) => SECTION_OF_LAST[last] || null;

function settingOf(state, section) {
    const s = state;
    if (section === 'osc') return `${oscSaid(s)}, ${octaveSaid(s.octave)}: ${harmonicsSaid(s)}`;
    if (section === 'filter') return `a ${FILTERS[s.filter].name} at ${fmtHz(s.cutoff)}, resonance ${s.res} % (a ${resDb(s.res) > 0 ? '+' : ''}${resDb(s.res).toFixed(0)} dB peak at the cutoff)${s.envAmt > 0 ? `, the envelope lifting the cutoff ${envOctaves(s).toFixed(1)} octaves at its peak` : ', no filter envelope'}`;
    if (section === 'env') return `attack ${fmtMs(s.attack)}, decay ${fmtMs(s.decay)}, sustain ${s.sustain} %, release ${fmtMs(s.release)}; attack, decay and release are times, sustain is a level`;
    if (section === 'lfo') return lfoOn(s) ? `${LFO_SHAPES[s.lfoShape].said} wave at ${fmtRate(s.lfoRate)} on ${LFO_TARGETS[s.lfoTarget].said}, depth ${s.lfoDepth} %: ${lfoWord(s)}` : 'the LFO at zero depth: nothing modulated';
    return `the VCA on ${s.vca === 'gate' ? 'Gate, the key alone switching the note on and off' : 'Env, the envelope shaping the note'}; ${VOICES[s.voices].said}, ${GLIDES[s.glide].said}${s.arp === 'up' ? `, ${ARPS.up.said}` : ''}`;
}

export function judge({ state, last }) {
    const s = state;
    const task = s.task ? TASKS[s.task] : null;
    const job = PARTS[s.part].job;
    const v = verdict(s);
    // a paper's task: the scheme's points
    if (task && s.task !== 'judge') {
        const pts = v.points;
        const set = pts.map((p) => p.said).join('; ');
        if (v.ok) {
            return [
                seg(3, `${cap(PARTS[s.part].said)} as set: ${set}.`),
                seg(4, `As directed: ${task.scheme} (${task.source}). Every point the scheme names is in place.`),
            ];
        }
        const m = v.missed[0];
        return [
            seg(3, `${cap(PARTS[s.part].said)} as set: ${set}.`),
            seg(4, `Not yet: ${m.said}, where the scheme wants ${m.name}. ${task.scheme} (${task.source}).${s.task === 'as2023' && m.id === 'octave' ? ` ${cap(PE.octave2023)}.` : ''}`),
        ];
    }
    // the Q6 idiom: a section, judged for the job
    const all = judgeAll(s);
    const section = sectionOfLast(last);
    if (!section) {
        const poor = SECTION_IDS.filter((id) => all[id].grade === 'poor');
        const partly = SECTION_IDS.filter((id) => all[id].grade === 'partly');
        const good = SECTION_IDS.filter((id) => all[id].grade === 'good');
        const names = (ids) => ids.map((id) => SECTIONS[id].name).join(', ');
        const worst = poor[0] || partly[0];
        return [
            seg(3, `${cap(job)}, judged by section: ${good.length ? `the ${names(good)} suit${good.length === 1 ? 's' : ''} it` : 'no section suits it outright'}${partly.length ? `; the ${names(partly)} partly` : ''}${poor.length ? `; the ${names(poor)} ${poor.length === 1 ? 'does' : 'do'} not` : ''}.`),
            seg(4, worst ? `${cap(SECTIONS[worst].name)} first: ${all[worst].why}. The 2024 report, on the bass question, credited answers written section by section, under subheadings; the 2019 pad question was marked the same way.` : `Every section suits ${job}. The 2024 report, on the bass question, credited answers written section by section, under subheadings; the 2019 pad question was marked the same way.`),
        ];
    }
    const g = all[section];
    const better = betterSetting(s, section, g.grade);
    return [
        seg(3, `${SECTIONS[section].label}, the ${SECTIONS[section].name}: ${settingOf(s, section)}.`),
        seg(4, `${cap(GRADE_WORD[g.grade])} ${job}: ${g.why}.${better ? ` ${better}` : ''}${evidence(s, section)}`),
    ];
}

function betterSetting(s, section, grade) {
    if (grade === 'good') return '';
    const part = s.part;
    if (section === 'env') {
        if (part === 'bass') return 'Bring the attack under 20 ms and the release under 300 ms.';
        if (part === 'pad') return 'Take the attack past 500 ms and the release past 1 s, with the sustain high.';
        if (part === 'lead') return 'Keep the attack under 60 ms and the release under 500 ms.';
        return 'Keep the attack short and the release under 600 ms.';
    }
    if (section === 'osc') {
        if (waveOf(s) === 'none' || waveOf(s) === 'noise') return 'Raise Pulse or Saw in the source mixer.';
        if (waveOf(s) === 'sine' || waveOf(s) === 'tri') return 'Press the slider\'s name to set the wave to Saw, or raise Pulse.';
        if (part === 'bass') return s.octave > 0 ? 'Set the Range to 8\' or 16\'.' : 'Raise Pulse or Saw, and bring the Sub up beneath them.';
        if (part === 'pad') return 'Choose Pair in the More row and push Detune to 8 to 15 cents, or set PW by LFO.';
        if (part === 'keys') return 'Raise Saw and take Pulse down, in a pair with a slight detune.';
        return 'Raise Pulse or Saw.';
    }
    if (section === 'filter') {
        if (s.filter === 'hpf' && part === 'bass') return 'Choose LPF and set the cutoff between 300 Hz and 2 kHz.';
        if (s.res > 70) return 'Bring the resonance under 40 %.';
        if (part === 'keys') return 'Choose LPF with the cutoff above 1 kHz.';
        return 'Choose LPF and move the cutoff into the middle of the harmonics.';
    }
    if (section === 'lfo') {
        if (s.lfoTarget === 'pitch') return 'For vibrato: 4 to 7 Hz at a depth under 25 %.';
        if (s.lfoTarget === 'cutoff') return 'Slow it under 4 Hz, or bring the depth under 40 %.';
        return 'Bring the depth down, or point the LFO at the cutoff.';
    }
    if (s.vca === 'gate' && part !== 'bass') return `Set the VCA to Env${s.voices === 'mono' && part !== 'lead' ? ', and press Poly in the More row' : ''}.`;
    if (s.vca === 'gate') return 'Raise Env in the VCF, or set the VCA to Env.';
    if (part === 'pad' || part === 'keys') return 'Press Poly in the More row.';
    return 'Press Mono in the More row.';
}

function evidence(s, section) {
    if (section === 'osc' && pwmOn(s)) return ` ${cap(PE.pwm2024)}.`;
    if (section === 'osc' && s.sub > 0 && s.part === 'bass') return ` ${PE.sub2024}.`;
    if (section === 'voices' && s.vca === 'gate') return ` ${cap(PE.gate2019)}.`;
    if (section === 'lfo' && !lfoOn(s) && pwmOn(s)) return ` ${cap(PE.pwm2019)}.`;
    if (section === 'lfo' && lfoOn(s)) return ` ${PE.lfo2024}.`;
    if (section === 'env' && s.part === 'bass') return ` ${PE.fast2024}.`;
    if (section === 'filter' && s.envAmt > 0) return ` ${PE.filterEnv2019}.`;
    if (section === 'filter') return ` ${PE.filter2024}.`;
    if (section === 'voices' && (s.part === 'pad' || s.part === 'keys') && s.voices === 'mono') return ` ${cap(PE.chords2022)}.`;
    if (section === 'osc' && s.part === 'bass' && s.octave > 0) return ` ${cap(PE.octave2023)}.`;
    return '';
}

// ---- Extension: the machine -----------------------------------------------------------
export function open({ state, last }) {
    const s = state;
    const section = sectionOfLast(last);
    const gate = gateMs(s);
    const swing = lfoSwing(s);
    const envLine = `The envelope is a control signal: at key-down it rises to full in ${fmtMs(s.attack)}, falls to ${s.sustain} % over ${fmtMs(s.decay)}, holds there while the key is down (${fmtMs(gate)} for this part), and falls to nothing in ${fmtMs(s.release)} after key-up. It is never heard; ${s.vca === 'gate' ? 'with the VCA on Gate the amplifier ignores it and follows the key alone, full then nothing, so the envelope shapes only what else it is routed to' : 'the amplifier obeys it, so the note has that shape'}.`;
    const filterLine = s.envAmt > 0
        ? `The same envelope lifts the cutoff ${envOctaves(s).toFixed(1)} octaves at its peak, from ${fmtHz(s.cutoff)} to ${fmtHz(s.cutoff * 2 ** envOctaves(s))}, so every note opens bright and closes: the routing the 2019 report says only the top candidates noticed.`
        : `The cutoff sits at ${fmtHz(s.cutoff)} and the envelope is not routed to it, so the brightness does not change through the note.`;
    const pwLine = pwmOn(s) ? ` It also moves the pulse width between ${s.width} % and ${100 - s.width} % at the same rate, so the even harmonics come and go: the modulation the 2024 report says it was very rare to see understood.` : '';
    const lfoLine = lfoOn(s)
        ? `The LFO is ${LFO_SHAPES[s.lfoShape].said} wave at ${fmtRate(s.lfoRate)}, one cycle every ${fmtMs(1000 / s.lfoRate)}: too slow to hear as a note, drawn to scale on the bottom lane. It moves ${LFO_TARGETS[s.lfoTarget].said} ${s.lfoTarget === 'amp' ? `by ${Math.round(swing * 100)} % of the level` : `${Math.round(swing)} cents either way`}; that movement is what you hear, never the LFO itself.${pwLine}`
        : pwmOn(s)
            ? `The LFO is ${LFO_SHAPES[s.lfoShape].said} wave at ${fmtRate(s.lfoRate)}, pointed at no dial, but PW is set to LFO, so it moves the pulse width between ${s.width} % and ${100 - s.width} %: the even harmonics come and go, and that is what you hear, never the LFO itself.`
            : `The LFO is at zero depth: the bottom lane is flat and nothing moves. Turn Depth up and the lane draws a wave slow enough to count, and the lane it points at wobbles with it.`;
    const voiceLine = `${s.voices === 'mono' ? `Mono: each note cuts the last, ${s.glide !== 'off' ? `and the pitch slides to it over ${GLIDES[s.glide].ms} ms, which is portamento` : 'with no slide between them'}.` : 'Poly: each note has its own envelope and filter, so a chord is several of these timelines at once.'}${s.arp === 'up' ? ' The arpeggiator steps through each chord\'s notes in sixteenths, so a chord becomes a line and every note is this timeline again.' : ''}`;
    if (section === 'lfo') return `${lfoLine} ${envLine}`;
    if (section === 'filter') return `${filterLine} ${lfoOn(s) && s.lfoTarget === 'cutoff' ? lfoLine : envLine}`;
    if (section === 'voices') return `${voiceLine} ${envLine}`;
    return `${envLine} ${lfoOn(s) || pwmOn(s) ? lfoLine : filterLine}`;
}

// The note the stage names while it plays.
export const noteLine = (midi) => `${noteName(midi)} · ${fmtHz(440 * 2 ** ((midi - 69) / 12))}`;
export const homeNote = (state) => noteLine(homeMidi(state));
export { BPM, OSC2 };
