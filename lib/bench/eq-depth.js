// The EQ bench's three levels, as three jobs (the pattern set on the Delay
// bench, 27 Aug 2026):
//
//   Core       the bench SHOWS: names what you hear and says what to try.
//   A-level    the bench JUDGES: the band you touched, the way the paper
//              does: setting, effect on this part, verdict, change, each
//              part tagged with the half of the mark it earns (AO3 names,
//              AO4 judges: Q6 is 5 + 15).
//   Extension  the bench OPENS THE MACHINE: what a filter is doing to the
//              signal, and why the numbers are the numbers. Not on the paper.
//
// Pure functions over the model's numbers; EqBench renders them.

import { BANDS, BAND_IDS, hasGain, hasQ, hasSlope, bandwidthOctaves, slopeFacts, peakOf, regionOf, snapOctave, fmtHz, fmtDb, OCTAVE_Q, bellsShown } from './eq-model.js';

export const DEPTH_LINES = {
    core: 'the bench names what you are hearing and tells you what to try, one band at a time.',
    alevel: 'the bench now judges the band you touch the way the paper does: setting, effect on this part, verdict, change, with the half of the mark each part earns. Move a dial or drag a dot.',
    extension: 'the bench opens the machine: what a filter does to the signal and why the numbers are the numbers. Move a dial or drag a dot.',
};

export const DEPTH_TEACH = {
    alevel: 'Write it in that order in the exam. Naming the band, its frequency and its gain or slope is AO3; what it does to this part, whether it suits, and what you would change are AO4, and 15 of the 20 marks are AO4.',
    extension: "None of this is asked on the paper. It is why the A-level answers are true, and where a producer's ear starts.",
};

const seg = (ao, text) => ({ ao, text });
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// What the chosen band is, in the words the answer needs.
export function bandFacts(state) {
    const id = state.band;
    const b = state[id];
    const def = BANDS[id];
    const hz = hasQ(id) && state.graphic ? snapOctave(b.hz, def.hzMin, def.hzMax) : b.hz;
    const q = hasQ(id) ? (state.graphic ? OCTAVE_Q : b.q) : null;
    const facts = { id, def, on: b.on, hz, gain: hasGain(id) ? b.gain : 0, q, slope: hasSlope(id) ? b.slope : null, region: regionOf(hz) };
    if (hasQ(id)) facts.bw = bandwidthOctaves(q);
    if (hasSlope(id)) facts.slopeFacts = slopeFacts(id, { ...state, [id]: { ...b, on: true } });
    return facts;
}

// The setting, named (AO3).
function nameIt(f) {
    if (hasSlope(f.id)) return `${cap(f.def.name)} at ${fmtHz(f.hz)}, ${f.slope} dB/oct: ${fmtDb(f.slopeFacts.atCutoffDb)} at the cutoff and ${fmtDb(f.slopeFacts.octaveDb)} an octave ${f.id === 'hpf' ? 'below' : 'above'}.`;
    if (hasQ(f.id)) return `${cap(f.def.name)} ${fmtDb(f.gain)} at ${fmtHz(f.hz)}, Q ${f.q.toFixed(1)}: a ${f.gain >= 0 ? 'boost' : 'cut'} ${f.bw.toFixed(1)} octaves wide in the ${f.region.name}.`;
    return `${cap(f.def.name)} ${fmtDb(f.gain)} from ${fmtHz(f.hz)}: everything ${f.id === 'low' ? 'below' : 'above'} the corner ${f.gain >= 0 ? 'lifted' : 'lowered'} by that much.`;
}

// High-pass verdicts by source: where the part's weight lives.
function judgeHpf(f, source, part) {
    const hz = f.hz;
    const slopeLine = f.slope >= 48 ? ' The 48 dB slope is a wall: right when a part must lose its low end entirely, and the paper\'s own word for it is very steep.' : f.slope === 24 ? ' The 24 dB slope clears faster and takes less from the octave above; use it when the low end must go.' : ' The 12 dB slope is the gentler, more natural one on a voice.';
    if (source === 'vocal') {
        if (hz < 60) return seg(4, `Below the voice entirely: it clears stand rumble and touches nothing you can hear. Safe, and the usual first move on a vocal.${slopeLine}`);
        if (hz <= 130) return seg(4, `Right: that is under a voice's fundamental, so plosives and rumble go and the voice stays whole.${slopeLine}`);
        if (hz <= 250) return seg(4, `It thins the voice: a low voice loses its body here. Defensible for a high voice, or to make room for a bass, if you say so; otherwise bring it back under 130 Hz.`);
        return seg(4, 'The voice has lost its body: wrong for a lead vocal unless it is a telephone effect on purpose. Say which, or bring it down to about 100 Hz.');
    }
    if (source === 'electronic') {
        if (hz <= 30) return seg(4, `Under the 808: it clears rumble and leaves the sub alone. Safe.${slopeLine}`);
        if (hz <= 70) return seg(4, 'It cuts into the 808 itself, whose fundamental sits around 40 to 60 Hz: the sub goes. Wrong, unless the mix is for small speakers and you say so.');
        return seg(4, 'The 808 has lost the thing it is for. Wrong: take it back under 30 Hz, or pick a different part to high-pass.');
    }
    if (source === 'drums') {
        if (hz <= 40) return seg(4, `It clears sub rumble only; the kick keeps its weight at 50 to 80 Hz. Safe.${slopeLine}`);
        if (hz <= 90) return seg(4, 'It starts eating the kick, whose weight sits at 50 to 80 Hz. Right only if a bass owns the low end and you say so; otherwise take it under 40 Hz.');
        return seg(4, 'The kick is gone and the kit is thin. Wrong for a full kit; right for a loop that sits over an 808, if you say why.');
    }
    if (hz < 150) return seg(4, `Below the stabs: nothing they carry is lost. Safe.${slopeLine}`);
    if (hz <= 400) return seg(4, `It starts thinning the stab's body: fine when the job is making room for a bass, say so.`);
    return seg(4, `The stabs are thin: a telephone move, not a correction. Right in a breakdown, wrong as a fix.`);
}

function judgeLpf(f, source, part) {
    const hz = f.hz;
    if (hz >= 12000) return seg(4, `It takes only the air: hiss and sheen. Safe, and a common move on a part that should sit back.`);
    if (hz >= 6000) return seg(4, `It darkens ${part}: right for a part that should sit behind the lead, wrong on the lead itself, which loses its edge.`);
    if (hz >= 2000) return seg(4, `Muffled, the sound of the next room. Right as a creative filter, a breakdown or a drop; wrong as a correction. Say which it is.`);
    return seg(4, `Telephone or radio: nothing above ${fmtHz(hz)}. A special effect, not a mix decision; with a high-pass it is a band-pass.`);
}

function judgeShelf(f, source, part) {
    const { id, gain, hz } = f;
    if (gain === 0) return seg(4, 'In, but at zero: the shelf is doing nothing. Set a gain, or take the band out.');
    if (id === 'low') {
        if (source === 'electronic') return gain > 0
            ? seg(4, 'More sub than most speakers can play: the meter goes up and a small speaker hears none of it. Wrong unless the mix is for a system that has it; a cut here makes room.')
            : seg(4, 'Taking sub out of the 808 is taking out the part. Wrong, unless it is to make room for a kick and you say so.');
        if (source === 'drums') return gain > 0
            ? seg(4, `Kick weight: ${gain <= 4 ? 'right, a few dB of weight without boom' : 'too much: past about 4 dB it booms on a small speaker and masks the bass'}.`)
            : seg(4, 'Less weight in the kit: right when a bass owns the low end and the kick only needs its click; wrong on a kit that has to carry the track.');
        if (source === 'vocal') return gain > 0
            ? seg(4, `Warmth: ${gain <= 2 ? 'a little is right on a thin voice' : 'more than about 2 dB muddies the voice and fights the bass'}.`)
            : seg(4, 'A low cut on the voice: right when it booms in the low mids; a high-pass does the same job more cleanly below 100 Hz.');
        return gain > 0 ? seg(4, 'Weight under the stabs: fine on their own, muddy against a bass. Say what else is in the mix.') : seg(4, 'Thins the stabs to make room: right in a full mix, say for what.');
    }
    // high shelf
    if (source === 'vocal') return gain > 0
        ? seg(4, `Air: ${gain <= 3 ? 'right, the voice opens up' : 'too much: sibilance and hiss come up with it, and the s sounds start to spit'}. Most mixes stop at +2 or +3.`)
        : seg(4, 'Takes the edge off a harsh or sibilant voice: right when it spits, wrong when the voice just needs to sit lower, which is a fader move.');
    if (source === 'drums') return gain > 0
        ? seg(4, `Hi-hat sizzle: ${gain <= 3 ? 'right, the cymbals open up' : 'harsh: the hats take over the top of the mix'}.`)
        : seg(4, 'Darker cymbals: right for a lo-fi or vintage feel, or when the hats fight a vocal; say which.');
    if (source === 'electronic') return gain > 0 ? seg(4, 'Lifts the click and the hats; there is little else up there on an 808. Fine, small.') : seg(4, 'Takes the click off the 808: rounder, and it disappears on a small speaker. A trade, say which way you want it.');
    return gain > 0 ? seg(4, 'Brighter stabs: right if they are buried, harsh past about 4 dB.') : seg(4, 'Softer stabs: right when they fight the vocal for the presence region.');
}

function judgeBell(f, source, part) {
    const { gain, q, hz, region, bw } = f;
    const big = Math.abs(gain) >= 8;
    const boost = gain > 0;
    if (gain === 0) return seg(4, 'In, but at zero: the band is doing nothing. Set a gain, or take it out.');
    const narrow = q >= 4;
    const wide = q <= 0.7;
    let line;
    if (boost) {
        if (region.id === 'presence') line = source === 'vocal'
            ? (gain <= 4 ? 'Presence: the voice comes forward without getting louder. Right, this is where intelligibility lives.' : 'Harsh: the ear is most sensitive here, and a boost this size makes the voice spit and tire the listener. Bring it under +4, or cut instead.')
            : source === 'drums' ? (gain <= 4 ? 'Snare crack and stick: right, the kit cuts through.' : 'Too much: the snare turns brittle and the hats sting.') : (gain <= 4 ? 'Attack on the part: right if it is buried.' : 'Harsh: the ear is most sensitive here.');
        else if (region.id === 'lowmid') line = 'A boost in the low mids adds mud and boxiness: the paper\'s answers cut here, they do not boost. Turn it into a cut of a few dB.';
        else if (region.id === 'mid') line = 'A boost in the mids adds honk, the nasal, cardboard quality. Right only to find where a sound honks before you cut it there.';
        else if (region.id === 'bass') line = source === 'electronic' || source === 'drums' ? (gain <= 4 ? 'Weight where the kick lives: right, a few dB.' : 'Boomy: past a few dB the low end masks everything above it.') : 'Weight under a part that does not carry weight: it muddies against the bass. A cut here makes room instead.';
        else if (region.id === 'sub') line = 'A boost in the sub lifts what a small speaker cannot play and the meter can: wrong on almost everything but an 808.';
        else if (region.id === 'sibilance') line = source === 'vocal' ? 'The s and t sounds get louder: this is the region a de-esser cuts. Wrong as a boost on a voice.' : 'Top of the hats and the click: fine, small.';
        else line = gain <= 3 ? 'Air: sheen, and the hiss that comes with it. Fine, small.' : 'Hiss and harshness: past about 3 dB the noise comes up with the sheen.';
        if (big) line += ` A boost of ${fmtDb(gain)} also eats ${Math.abs(gain).toFixed(0)} dB of headroom, and usually means the source needs a different take or microphone, not more EQ.`;
        if (narrow) line += ' Narrow and boosted, the band rings: a boost is usually wide.';
    } else {
        if (region.id === 'lowmid') line = Math.abs(gain) <= 6 ? 'The classic mud cut: a few dB out of the low mids cleans a busy part without thinning it. Right, and credited when named with the frequency.' : 'A cut that deep hollows the part out. Two to four dB does the job.';
        else if (region.id === 'presence') line = source === 'vocal' ? 'Pulls the voice back and softens it: right only if it is harsh; otherwise the voice loses intelligibility, and a fader move is what you wanted.' : 'Softens the attack: right when the part fights the vocal here.';
        else if (region.id === 'mid') line = 'A cut where a sound honks: right if you found the frequency by sweeping first; say that you did.';
        else if (region.id === 'bass') line = source === 'electronic' ? 'A cut in the 808\'s own range: wrong unless a kick needs the room.' : 'Makes room for the bass or the kick: right in a full mix, say for what.';
        else if (region.id === 'sub') line = 'A cut in the sub does what a high-pass does, less cleanly. Use the HPF.';
        else if (region.id === 'sibilance') line = source === 'vocal' ? 'A static de-esser: right when the s sounds spit, though a real de-esser only cuts when they do.' : 'Takes the top off the hats: fine.';
        else line = 'Less air: darker, calmer; right on a part that should sit back.';
        if (narrow) line += ' Narrow, this is surgical: right for one ringing frequency or a hum, and the paper wants the frequency named.';
        if (wide) line += ' Wide, this is a tonal tilt, closer to a shelf than a notch.';
    }
    return seg(4, line);
}

// A-level: judge the band the student touched last, the way the paper does.
export function judge({ state, last = 'preset', part = 'the part' }) {
    const f = bandFacts(state);
    const source = state.source;
    switch (last) {
        case 'source':
            return [seg(4, `Now ${part}. The paper judges an EQ against its part: a voice wants a high-pass below its fundamental, a cut where it booms and a little presence; a kit wants its weight kept and its boxiness cut; an 808 wants the sub left alone; stabs want room made for the voice.`)];
        case 'graphic':
            return state.graphic
                ? [seg(3, `Graphic: every bell is locked to an octave centre (${fmtHz(f.hz)} here) and an octave wide; only its gain moves.`), seg(4, 'Quick to read, and unable to put a narrow cut at 350 Hz: that is the difference the paper asks for. A parametric chooses frequency and width; a graphic only chooses gain.')]
                : [seg(3, 'Parametric: every bell is free in frequency, gain and Q.'), seg(4, 'That freedom is the point: one ringing frequency can be cut narrowly and its neighbours left alone. A graphic EQ cannot do that, and the paper credits you for saying so.')];
        case 'bells': {
            const n = bellsShown(state);
            if (n === 1) return [seg(3, 'One bell: a single parametric band, free in frequency, gain and Q.'), seg(4, 'Enough to find and cut one problem. Most answers need two, a cut where the part is muddy and a boost where it is missing, and they go in different bells.')];
            if (n === 2) return [seg(3, 'Two bells: two parametric bands in series, each with its own frequency, gain and Q.'), seg(4, 'The pair the paper credits on a voice: a cut in the low mids where it booms and a boost in the presence where it needs to come forward. Set one to cut and the other to boost, and name both.')];
            return [seg(3, 'Three bells: three parametric bands in series.'), seg(4, 'A cut, a boost, and one spare for a ringing frequency. Past this an EQ answer is a list, not a judgement: say what each bell is for, or take one out.')];
        }
        case 'match':
            return state.match
                ? [seg(3, `Level match on: the output is pulled down by the curve's biggest boost (${fmtDb(-Math.max(0, peakOf(state).maxDb))}).`), seg(4, 'A boost sounds better partly because it is louder. Matched, you judge the tone alone, which is how to compare two settings honestly.')]
                : [seg(3, 'Level match off: a boost makes the part louder as well as brighter.'), seg(4, 'Louder always sounds better at first. Before you decide a boost is right, match the level and listen again.')];
        case 'preset':
            return judgePreset(state, f, part);
        case 'in':
            if (!f.on) return [seg(3, `${cap(f.def.name)} out.`), seg(4, 'The curve loses it: press In and listen for what came back. Naming what a band changes, not just that it is there, is where the marks are.')];
            break;
        default:
            break;
    }
    if (!f.on) return [seg(3, `${cap(f.def.name)} is out.`), seg(4, `Press In to hear it: an EQ answer describes a setting that is doing something to ${part}.`)];
    const name = seg(3, nameIt(f));
    if (f.id === 'hpf') return [name, judgeHpf(f, source, part)];
    if (f.id === 'lpf') return [name, judgeLpf(f, source, part)];
    if (hasQ(f.id)) return [name, judgeBell(f, source, part)];
    return [name, judgeShelf(f, source, part)];
}

function judgePreset(state, f, part) {
    switch (state.presetId) {
        case 'flat':
            return [seg(3, 'Flat: every band at zero.'), seg(4, `This is ${part} as recorded. Every EQ decision is measured against it: hold the dry button whenever you are not sure a move helped.`)];
        case 'vocal':
            return [seg(3, 'Vocal clean-up: high-pass at 100 Hz, a 4 dB cut at 350 Hz (Q 1.5), a 2 dB high shelf from 8 kHz.'), seg(4, 'The three moves the paper credits on a voice, in the usual order: clear the rumble below it, take the boom out of the low mids, open the top a little. Judge each band, then ask what you would change.')];
        case 'cutboost':
            return [seg(3, 'Cut and boost: high-pass at 100 Hz, a 4 dB cut at 350 Hz (Q 1.5) in the first bell, a 3 dB boost at 3 kHz (Q 1.0) in the second, on the vocal.'), seg(4, 'The two moves that go together on a voice: cut where it is muddy, boost where it is missing. The cut is the bigger number and the boost the smaller; that is the proportion the paper credits, and the order to write it in: the problem, the cut, then the lift. Hold dry and ask which of the two you would miss first.')];
        case 'drums':
            return [seg(3, 'Drum weight: high-pass at 35 Hz, a 3 dB low shelf from 80 Hz, a 3 dB cut at 400 Hz, a 2 dB high shelf from 8 kHz.'), seg(4, 'Weight kept and added, boxiness cut, cymbals opened: a kit that carries a track. Against a bass, the shelf is the first thing to question.')];
        case 'telephone':
            return [seg(3, 'Telephone: a high-pass at 500 Hz and a low-pass at 3 kHz, both 24 dB/oct, with a 3 dB lift at 1.5 kHz.'), seg(4, 'A high-pass and a low-pass together are a band-pass: a special effect, not a correction. Right for a breakdown or an intro; the paper wants it named and its purpose said.')];
        case 'toomuch':
            return [seg(3, 'Too much: a 12 dB boost at 3 kHz with a Q of 4, on the vocal.'), seg(4, "The ear's most sensitive region, boosted by 12 dB, narrow enough to ring: harsh, and it eats 12 dB of headroom. Cut it, widen it, or move it; judging this and saying what you would change is the whole of a Q6 answer.")];
        case 'paper2023':
            return [
                seg(3, "The 2023 paper's vocal EQ: a 4 dB low shelf from 120 Hz, 4 dB at 3 kHz, a 4 dB high shelf from 8 kHz. Every band boosted."),
                seg(4, 'Most candidates saw that the mid and high boosts add brightness and bring the vocal forward. Very few said what boosting the lows does to plosives and the proximity effect, and very few noticed that boosting everything raises the level and risks distortion. Judge all three, then take the low shelf out and match the level.'),
            ];
        case 'paper2024':
            return [
                seg(3, `The 2024 paper's high-pass: 48 dB/oct at 400 Hz on the bass part, ${fmtDb(f.slopeFacts ? f.slopeFacts.atCutoffDb : -12)} at the cutoff and everything an octave below it gone.`),
                seg(4, 'The paper asked for the drawing: a curve that starts on the axis between 200 Hz and 1 kHz, steeper than 45 degrees, reaching −20 dB, with no boosts or cuts anywhere else. Most candidates drew the slope; those on 2 marks put the cutoff too low or too high, or drew it too shallow. On the 808 you can hear why 48 dB/oct is "very steep".'),
            ];
        default:
            return judge({ state, last: 'band', part });
    }
}

// Extension: open the machine behind the control the student touched last.
export function open({ state, last = 'preset', part = 'the part' }) {
    const f = bandFacts(state);
    switch (last) {
        case 'source':
            return `${cap(part)}: an EQ can only shape what is there. Boosting 60 Hz on a hi-hat lifts noise, because the hat has nothing at 60 Hz; the 808 has almost nothing above 200 Hz, so a high shelf on it moves only the click. Hold the dry button and read the green shape before you reach for a band.`;
        case 'graphic':
            return state.graphic
                ? 'A graphic EQ is a bank of bells at fixed centres, an octave or a third of an octave apart, each with the same Q. The sliders draw the curve the way a picture would, which is where the name comes from. Locked frequency and width is the whole difference; the maths of each band is the parametric band you just left.'
                : 'Parametric means the parameters are free: frequency, gain and Q on every band. The bell is the same biquad a graphic EQ uses; the graphic just fixes two of the three numbers.';
        case 'bells':
            return 'Bells in series add: each is a biquad, their responses add in dB, and where two overlap the curve is their sum, not either one. A cut at 350 Hz and a boost at 3 kHz sit three octaves apart and hardly touch; two bells an octave apart add most of their gain to each other in between. The order of the bells in the chain changes nothing, because linear filters commute.';
        case 'match':
            return 'Louder sounds better: a level difference of 1 dB reads as an improvement in blind tests, which is why every serious comparison matches levels first. The trim here is the curve\'s peak in dB, so the loudest frequency after EQ is no louder than before it.';
        case 'preset':
            return openPreset(state, f, part);
        case 'in':
            return f.on
                ? `${cap(f.def.name)} in: the bands are in series, so their responses add in dB and multiply as gains. The order they sit in does not change the curve at all (a chain of linear filters commutes); in a digital EQ working in floating point it does not change the headroom either.`
                : `${cap(f.def.name)} out: a band at zero gain is an identity, b0 = 1 and nothing else, so it costs no phase and no level. Bypass in a digital EQ is the same as gain zero; in an analogue one the circuit stays in the path.`;
        case 'slope':
            return `${f.slope} dB/oct is a ${{ 12: 'second', 24: 'fourth', 48: 'eighth' }[f.slope] || 'second'}-order filter: ${{ 12: 'one biquad section', 24: 'two biquad sections in series', 48: 'four biquad sections in series' }[f.slope] || 'one biquad section'}. Each section is 12 dB per octave far from the cutoff and 3 dB down at it, so the corner sits ${fmtDb(f.slopeFacts.atCutoffDb)}${f.slope === 24 ? ', the Linkwitz-Riley shape a crossover uses' : f.slope === 12 ? ', the Butterworth shape' : ''}. The steeper the filter, the more phase it costs around the corner: the dotted line.`;
        case 'q':
            return `Q is centre frequency over bandwidth: Q ${f.q.toFixed(1)} at ${fmtHz(f.hz)} means the half-power points sit ${f.bw.toFixed(2)} octaves apart, at ${fmtHz(f.hz / Math.pow(2, f.bw / 2))} and ${fmtHz(f.hz * Math.pow(2, f.bw / 2))}. Octaves, not hertz: the same Q at 200 Hz spans a few dozen hertz and at 4 kHz spans hundreds, because the ear hears ratios.`;
        case 'gain':
            if (!hasGain(f.id)) return 'A filter has no gain of its own because it is defined by where it stops passing, not by how much it adds: its response is 0 dB in the passband and falls at the slope beyond the cutoff. Give it resonance (raise its Q) and it does peak at the corner: that is the synth filter of 1.3.';
            return `${fmtDb(f.gain)}: ${Math.abs(f.gain) >= 6 ? 'six dB is twice the amplitude, and the ear hears it as about half as loud again, nowhere near double' : 'a few dB is a ratio of amplitudes, not an amount of loudness'}. Boosts and cuts are not symmetric for the ear: a cut is much harder to hear than the same boost, which is why the rule is cut what is wrong, boost what is missing.`;
        case 'hz':
        case 'band':
        default:
            if (hasSlope(f.id)) return `${fmtHz(f.hz)} is the point where the filter is already ${fmtDb(f.slopeFacts.atCutoffDb)}: the roll-off starts before the number on the dial, not at it. An octave ${f.id === 'hpf' ? 'below' : 'above'} it is ${fmtDb(f.slopeFacts.octaveDb)}, two octaves about double that. The scale of the dial is logarithmic because every octave is the same distance to the ear.`;
            if (hasQ(f.id)) return `A bell at ${fmtHz(f.hz)}: the biquad's centre. Its half-power points sit at ${fmtHz(f.hz / Math.pow(2, f.bw / 2))} and ${fmtHz(f.hz * Math.pow(2, f.bw / 2))}, and the boost tails off beyond them but never quite to zero: a bell has no edges, which is why two of them overlapping add rather than meet. ${f.region.name}: ${f.region.line}.`;
            return `A shelf from ${fmtHz(f.hz)}: the corner sits at half the gain (${fmtDb(f.gain / 2)}), and the full ${fmtDb(f.gain)} arrives about an octave ${f.id === 'low' ? 'below' : 'above'} it. A shelf is a bell with one side removed, which is why it has a corner and no width control.`;
    }
}

function openPreset(state, f, part) {
    switch (state.presetId) {
        case 'paper2023':
            return "Three boosts in series add where they overlap: the shelf from 120 Hz and the shelf from 8 kHz leave the bell at 3 kHz standing on its own, but the curve never drops below zero anywhere, so the whole vocal is louder. That is what the examiner meant by all of the frequencies being boosted: the peak of the curve is the headroom you spent, and a louder vocal into the next stage is where the distortion comes from.";
        case 'paper2024':
            return '48 dB/oct is an eighth-order filter: four biquad sections in series, each 3 dB down at the corner, so the cutoff sits 12 dB down and the roll-off is 48 dB for every octave below it. The phase turns through two full circles on the way, the dotted line. Very steep is the credited phrase, and the reason the drawing has to be steeper than 45 degrees on the paper\'s axes.';
        case 'telephone':
            return 'A high-pass and a low-pass in series make a band-pass: only what lies between the two cutoffs survives, an octave and a half here. The 3 kHz cutoff is close to the old telephone network\'s 300 to 3,400 Hz band, which is where the name comes from and why speech survives it: intelligibility lives in the mids.';
        case 'toomuch':
            return 'A 12 dB bell at Q 4 is nearly a resonator: feed it a click and it rings at 3 kHz. The RBJ bell\'s gain at the centre is exactly the number on the dial, but its half-power points are only a third of an octave apart, so it acts on one note\'s worth of frequencies and leaves the rest alone. That is what makes it ring rather than brighten.';
        case 'cutboost':
            return 'Two biquads three octaves apart: the −4 dB bell at 350 Hz and the +3 dB bell at 3 kHz each tail off long before they meet, so the curve between them sits near zero and the sum is the two bells side by side. Widen either past Q 0.5 and they start to add; read the gold line, not the dials, for what the pair does at 1 kHz.';
        case 'vocal':
            return 'Three biquads in series: a second-order high-pass, a bell, a high shelf. Their dB responses add, so the curve at any frequency is the sum of three curves; the phase the filters cost adds too, most of it around the 100 Hz cutoff where the high-pass is steepest.';
        case 'drums':
            return 'A shelf and a bell in the same region overlap: the +3 dB shelf from 80 Hz and the −3 dB bell at 400 Hz meet in the low mids, and the curve between them is their sum, not either one. Read the gold line, not the dials, for what the EQ is actually doing at 200 Hz.';
        case 'flat':
        default:
            return 'A flat band is an identity: b0 = 1, every other coefficient 0, so it passes the signal unchanged with no phase shift. The curve is the sum of the bands in dB; at zero everywhere the sum is zero, and the EQ is in the chain doing nothing at all, which is not the same as no EQ in an analogue desk, where the circuit is still in the path.';
    }
}

// Core, Teacher on: what the student is hearing, from the bands that are in.
export function hearingLine(state, part = 'the part') {
    const parts = [];
    for (const id of BAND_IDS) {
        const b = state[id];
        if (!b.on) continue;
        const hz = hasQ(id) && state.graphic ? snapOctave(b.hz) : b.hz;
        if (hasSlope(id)) parts.push(`a ${BANDS[id].name} at ${fmtHz(hz)}`);
        else if (b.gain === 0) continue;
        else if (hasQ(id)) parts.push(`a ${fmtDb(b.gain)} bell at ${fmtHz(hz)}`);
        else parts.push(`a ${fmtDb(b.gain)} ${BANDS[id].name} from ${fmtHz(hz)}`);
    }
    if (!parts.length) return `You are hearing ${part} with every band at zero: the EQ is in the chain and changing nothing.`;
    const list = parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
    return `You are hearing ${part} through ${list}.`;
}

// Core: the next thing to try, from where the student is.
export function nextMove(state) {
    if (!state.hpf.on) return 'press In on the HPF, choose the 808, and drag its dot up until the kick loses its weight';
    if (state.mid.gain === 0) return 'set the Mid band to +8 dB with a narrow Q and sweep the frequency slowly until the sound honks';
    if (state.mid.gain > 0) return 'turn that boost into a cut of 4 dB and hold the dry button to hear what left';
    if (bellsShown(state) === 1 && state.mid.gain < 0) return 'choose 2 bells, and use the second to add 3 dB of presence at 3 kHz while the first keeps its cut: a cut where the part is muddy, a boost where it is missing';
    if (!state.high.on && !state.low.on) return 'press In on the High shelf and add 2 dB from 8 kHz, then ask whether the hiss came up too';
    if (!state.lpf.on) return 'press Telephone and ask what a high-pass and a low-pass together are called';
    return 'open More, switch the Mid band to Graphic, and try to put a narrow cut at 350 Hz';
}
