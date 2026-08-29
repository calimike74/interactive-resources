// The Balance Desk's three levels, as three jobs (the pattern set on the
// Delay bench, 27 Aug 2026):
//
//   Core       the bench SHOWS: names what you hear and says what to try.
//   A-level    the bench JUDGES the way the paper does: the fault it heard,
//              the line of the scheme the mix sits on, the change, each part
//              tagged with the half of the mark it earns.
//   Extension  the bench OPENS THE MACHINE: what the examiner did to the
//              files, why a fader is not a level, what masking is and what
//              mono does to a pan.
//
// Every examiner's sentence quoted here is from the 9MT0 mark schemes and
// Principal Examiner reports as held in the vault's per-question files
// (1.13 Balance and Blend/05 - Assessment Tools/Past Paper Questions):
// 2018 AS Q5(e), 2019 A Q5(f), 2020 A Q5(f), 2022 A Q5(f), 2023 A Q5(g),
// 2024 A Q5(g), 2024 AS Q5(e), 2025 A Q5(e). Pure functions over the
// model's numbers; BalanceDesk renders them.

import { STEMS, SONGS, BAND_SHORT, band, faults, hierarchy, masking, pairOf, delta, bandWords, panWord, sendWord, deltaWord, fmtDb, FLOOR } from './balance-model.js';

export const DEPTH_LINES = {
    core: 'the bench names what you are hearing and tells you what to try, one fader at a time. The stage is the mix as a plan: each block is a part, left to right is its pan, taller is louder for the ear, higher up is further back in the reverb. Hold the button in the play column to hear the reference on the same beat.',
    alevel: "the bench now judges the mix the way the paper does: the fault it can hear, the line of the 2025 scheme your balance sits on, and the change, with the half of the mark each part earns. Under the plan, every part's live spectrum on one axis: where two ride together, the shaded region is the paper's masking.",
    extension: 'the bench opens the machine: what the examiner did to each file before you got it, why a fader at unity is not a level, how the ear weights what it hears, what masking is in a spectrum, and what folding the mix to mono does to every pan.',
};

export const DEPTH_TEACH = {
    alevel: 'Write it in that order: the fault and its region are AO3; what it does, the line it sits on and the change are AO4, as is the practical mark.',
    extension: 'None of this is on the paper. It is why the A-level judgements are true, and where a mix engineer starts.',
};

const seg = (ao, text) => ({ ao, text });
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const said = (id) => STEMS[id].said;

// ---- Core: the hearing line and the next move -----------------------------
export function hearingLine(state) {
    const h = hierarchy(state);
    const fs = faults(state);
    const top = said(h.top);
    if (fs.some((f) => f.kind === 'missing')) {
        const m = fs.find((f) => f.kind === 'missing');
        return `You are hearing the mix with ${said(m.stem)} gone: the fader is at the floor. The paper's bottom line is "not all tracks present"; bring it back before anything else.`;
    }
    if (state.presetId === 'supplied') {
        return `You are hearing the five files as the examiner sent them, every fader at unity: ${top} on top, the vocal somewhere behind the bass and the synth. Nothing about the fader positions tells you that; only listening does.`;
    }
    if (fs.length === 0) return `You are hearing the balance the track was released with: the vocal on top, the drums driving under it, the bass present, the backing vocals and the synth blended behind. Hold the reference and nothing should change.`;
    const bits = [];
    if (!h.vocalOnTop) bits.push(`the vocal is not on top, ${top} is`);
    const loud = fs.filter((f) => f.kind === 'loud' || f.kind === 'dominant').map((f) => said(f.stem));
    const quiet = fs.filter((f) => f.kind === 'quiet' || f.kind === 'buried').map((f) => said(f.stem));
    if (loud.length) bits.push(`${loud.join(' and ')} ${loud.length > 1 ? 'sit' : 'sits'} over where ${loud.length > 1 ? 'they were' : 'it was'} released`);
    if (quiet.length) bits.push(`${quiet.join(' and ')} ${quiet.length > 1 ? 'are' : 'is'} under`);
    const mk = fs.find((f) => f.kind === 'masking');
    if (mk) bits.push(`${said(mk.stem)} and ${said(mk.with)} share ${bandWords(mk.bands)}`);
    const pc = fs.find((f) => f.kind === 'offCentre');
    if (pc) bits.push(`${said(pc.stem)} has left the centre`);
    const w = fs.find((f) => f.kind === 'washed');
    if (w) bits.push('the vocal is washed back in the reverb');
    return `You are hearing a mix where ${bits.join('; ')}.`;
}

export function nextMove(state) {
    const fs = faults(state);
    if (!fs.length) return 'hold the reference and listen for any part that moves; then press Drums too quiet and hear the most common fault in nine years of reports';
    const m = fs.find((f) => f.kind === 'missing');
    if (m) return `bring ${said(m.stem)} back up off the floor`;
    const w = fs.find((f) => f.kind === 'washed');
    if (w) return 'turn the vocal\'s send down until it comes to the front again';
    const pc = fs.find((f) => f.kind === 'offCentre');
    if (pc) return `bring ${said(pc.stem)} back to the centre; the low end and the lead belong there`;
    const byLevel = fs.filter((f) => ['loud', 'quiet', 'dominant', 'buried'].includes(f.kind)).sort((a, b) => Math.abs(b.by) - Math.abs(a.by));
    if (byLevel.length) {
        const f = byLevel[0];
        const dir = f.by > 0 ? 'down' : 'up';
        return `${dir === 'up' ? 'push' : 'pull'} ${said(f.stem)} ${dir}, about ${Math.round(Math.abs(f.by))} dB, then hold the reference and check`;
    }
    const u = fs.find((f) => f.kind === 'under');
    if (u) return `lift the vocal until it sits clear of ${said(u.over)}, or ease ${said(u.over)} down`;
    const mk = fs.find((f) => f.kind === 'masking');
    if (mk) return `pan ${said(mk.stem)} and ${said(mk.with)} apart, or ease the one that matters less down in ${bandWords(mk.bands)}`;
    return 'hold the reference and compare';
}

// ---- A-level: the judge -----------------------------------------------------
const QUOTES = {
    drums2018: '"Mix level of drums was the most common problem, being too quiet" (2018)',
    listen2019: '"the candidate needed to listen (rather than look at fader positions) to earn credit" (2019, and every A-level report since)',
    cd2019: '"leave the bass and backing vocals too loud as on the original CD" (2019)',
    drums2020: '"Vocals sit on top of mix and drums are equal or louder" (2020 scheme)',
    bass2022: '"leave the bass too quiet" (2022)',
    synth2023: '"the chorus synth was too loud, or the drums too quiet" (2023)',
    guitar2024: '"one part being under or over balanced" (2024)',
    as2024: '"vocals lead; all parts clear; bass present; minimal masking; stable levels" (2024 AS scheme)',
    two2025: '"synth over vocals at start of chorus" (2025 scheme, the two-mark example)',
};

export function judge({ state, last }) {
    const b = band(state);
    const fs = b.faults;
    const h = hierarchy(state);
    const lineTag = `The ${b.band === 3 ? 'three' : b.band === 2 ? 'two' : b.band === 1 ? 'one' : 'zero'}-mark line: ${BAND_SHORT[b.band]}.`;

    // presets the paper wrote
    if (state.presetId === 'reference') {
        return [
            seg(3, `The reference: the vocal on top for the ear, the drums equal under it, the bass present, backing vocals and synth blended behind, nothing shared beyond the release.`),
            seg(4, `${lineTag} Every fader here undoes a trim the desk never showed you: listen, not look (2019 report, and every one since).`),
        ];
    }
    if (state.presetId === 'supplied') {
        return [
            seg(3, `As supplied: every fader at unity and the balance wrong, because the files were trimmed first. Bass and synth over the release, vocal and drums under: ${said(h.top)} is on top, not the vocal.`),
            seg(4, `${lineTag} Lift the vocal until it is clear, bring the drums up to meet it, pull the rest back: listen, not look (2019 report).`),
        ];
    }
    if (state.presetId === 'drums') {
        return [
            seg(3, `Drums too quiet: everything at the release except the drums, ${fmtDb(delta(state, 'drums'))} under. The drive has gone; the vocal is on top only because nothing pushes under it.`),
            seg(4, `${lineTag} ${QUOTES.drums2018}: push them up until they are equal to the vocal or louder.`),
        ];
    }
    if (state.presetId === 'cd') {
        return [
            seg(3, `As on the CD: the bass ${fmtDb(delta(state, 'bass'))} and the backing vocals ${fmtDb(delta(state, 'bvox'))} over the release. The backing vocals crowd the lead in ${bandWords((pairOf(state, 'bvox') || { bands: [] }).bands) || 'the low mids'}; the low end swamps the kick.`),
            seg(4, `${lineTag} Candidates ${QUOTES.cd2019}: a file that arrives loud should not stay loud. Pull both back until the lead is the only voice on top.`),
        ];
    }
    if (state.presetId === 'synth') {
        return [
            seg(3, `Synth over the vocal: the synth ${fmtDb(delta(state, 'synth'))} over the release, the vocal ${fmtDb(delta(state, 'vocal'))} under, both in the centre, both living in ${bandWords((pairOf(state, 'synth') || { bands: [] }).bands) || 'the low mids'}: the pad masks the lead.`),
            seg(4, `${lineTag} ${QUOTES.two2025}. Pull the synth back first; if it still crowds the vocal, pan it off centre or ease it down where the vocal lives.`),
        ];
    }
    if (state.presetId === 'buried') {
        return [
            seg(3, `Vocal buried: every other part at the release, the lead ${fmtDb(delta(state, 'vocal'))} under, so ${said(h.top)} is on top and the words are gone.`),
            seg(4, `${lineTag} One part barely audible costs two of the three marks whatever the rest does; the 2023 report called it "a noticeable improvement" when candidates stopped burying the vocal.`),
        ];
    }

    // the control that was touched
    const kind = last ? last.split(':')[0] : 'fader';
    const stem = last && last.includes(':') ? last.split(':')[1] : null;
    if (kind === 'pan' && stem) {
        const p = state.pan[stem];
        const pc = fs.find((f) => f.kind === 'offCentre' && f.stem === stem);
        const mk = fs.find((f) => f.kind === 'masking');
        const relieved = !mk && masking(state).worst && masking(state).worst.apart >= 0.3 && [masking(state).worst.a, masking(state).worst.b].includes(stem);
        return [
            seg(3, `${cap(said(stem))} panned ${panWord(p)}.${pc ? ` The ${stem === 'bass' ? 'low end' : 'lead'} has left the centre, where a mono-compatible mix keeps it.` : relieved ? ` It and ${said([masking(state).worst.a, masking(state).worst.b].find((x) => x !== stem))} now sit apart in the stereo field: the region they shared is no longer a fight.` : ' A pan makes space sideways; the level and the region are unchanged.'}`),
            seg(4, `${lineTag}${pc ? ` Bring ${said(stem)} back to the centre; the separation belongs to the backing vocals and the synth.` : relieved ? ' Panning the pair apart resolved the masking without a fader moving: "making space", in the scheme\'s word.' : ' Pan the parts that fight for a region apart; keep the vocal, the bass and the kick in the middle.'}`),
        ];
    }
    if (kind === 'send' && stem) {
        const sd = state.send[stem];
        const w = fs.find((f) => f.kind === 'washed');
        return [
            seg(3, `${cap(said(stem))}'s send at ${Math.round(sd * 100)}%: ${sendWord(sd)}. Reverb is depth: more of it sits a part further back without its fader moving.${w ? ' The lead has been pushed behind the band.' : ''}`),
            seg(4, `${lineTag}${w ? ' Bring the vocal\'s send down: the lead lives at the front, the room belongs to the parts behind it.' : stem === 'synth' || stem === 'bvox' ? ' The right use of the send: a pad or the backing vocals set back stop competing with the lead without getting quiet.' : ' Depth is the fourth of the paper\'s tools after level, pan and frequency; spend it on the parts that sit behind.'}`),
        ];
    }
    if (kind === 'mono') {
        const mk = masking(state).worst;
        return [
            seg(3, `${state.mono ? 'Folded to mono' : 'Back in stereo'}: ${state.mono ? 'every pan is back in the centre, so the space a pan made is gone and parts that shared a region share it again' : 'the parts that were panned apart sit apart again'}.${mk && mk.apart >= 0.3 ? ` ${cap(said(mk.a))} and ${said(mk.b)} were panned apart; in mono ${state.mono ? 'they fight' : 'they fought'} for ${bandWords(mk.bands)}.` : ''}`),
            seg(4, `${lineTag} A mix that only works in stereo is not mono-compatible: fix what returns with a fader or an EQ, not a pan.`),
        ];
    }
    // a fader (or nothing yet)
    const target = stem || (fs.length ? fs[0].stem : 'vocal');
    const d = delta(state, target);
    const f = fs.find((x) => x.stem === target);
    const mk = fs.find((x) => x.kind === 'masking');
    const parts = [];
    parts.push(`${cap(said(target))} at ${fmtDb(state.fader[target])} on the fader is ${deltaWord(d)} for the ear${state.fader[target] <= FLOOR ? ', which is gone' : ''}.`);
    if (f && (f.kind === 'under')) parts.push(`${cap(said(h.top))} is on top instead.`);
    else if (!f && !h.vocalOnTop) parts.push(`The vocal is still not on top: ${said(h.top)} is.`);
    else if (!f && fs.length) parts.push(`${cap(said(fs[0].stem))} is the part still off: ${deltaWord(delta(state, fs[0].stem))}.`);
    if (mk) parts.push(`${cap(said(mk.stem))} and ${said(mk.with)} share ${bandWords(mk.bands)}.`);
    const change = fs.length === 0 ? `Nothing to change: ${QUOTES.as2024}.`
        : f && f.kind === 'dominant' ? `Pull ${said(target)} back by about ${Math.round(d)} dB: one part too dominant is the one-mark line.`
            : f && f.kind === 'buried' ? `Lift ${said(target)} by about ${Math.round(-d)} dB: one part barely audible is the one-mark line.`
                : f && f.kind === 'loud' ? `Ease ${said(target)} down by about ${Math.round(d)} dB and hold the reference to check: ${QUOTES.guitar2024} is the two-mark line.`
                    : f && f.kind === 'quiet' ? `Bring ${said(target)} up by about ${Math.round(-d)} dB: ${target === 'drums' ? QUOTES.drums2018 : target === 'bass' ? `candidates ${QUOTES.bass2022}` : QUOTES.guitar2024}.`
                        : f && f.kind === 'under' ? `Lift the vocal until it sits clear of ${said(f.over)}: ${QUOTES.drums2020}.`
                            : `${cap(nextMove(state))}.`;
    return [seg(3, parts.join(' ')), seg(4, `${lineTag} ${change}`)];
}

// ---- Extension: the machine -----------------------------------------------
export function open({ state, last }) {
    const s = SONGS[state.song];
    const kind = last ? last.split(':')[0] : 'fader';
    const stem = last && last.includes(':') ? last.split(':')[1] : 'vocal';
    if (kind === 'mono') {
        return `Mono is the sum of left and right. Every pan comes back to the centre, so the separation a pan bought is spent, and any two parts that share a region fight for it again. Nothing panned cancels in a mono fold unless the two sides are out of phase; what returns is the masking. That is the mono-compatibility check, and a mix that passes it was balanced with faders and EQ, not with pans.`;
    }
    if (kind === 'send') {
        return `The send takes a copy of ${said(stem)} after its fader into one shared reverb, so the part is heard twice: dry from the front, and reverberant from the room behind it. More send is not quieter; it is further away, because the ear reads the ratio of direct to reverberant sound as distance. Pre-fade sends break that link and the desk's are post-fade on purpose.`;
    }
    if (kind === 'pan') {
        return `A pan is two gains: ${said(stem)} at ${panWord(state.pan[stem])} is a little less in one channel and a little more in the other, following an equal-power law so the level for the ear holds as it moves. Two parts in the same region can be told apart by the ear when they arrive from different places; that is why panning them apart relieves masking without either getting quieter.`;
    }
    const sup = s.supplied[stem];
    const d = delta(state, stem);
    return `${cap(said(stem))}'s file was trimmed ${fmtDb(sup)} before you got it, so the fader at unity was never a level: what you hear is the file, plus the trim, plus your fader, weighted the way the ear weights each band (the low end counts for less). At ${fmtDb(state.fader[stem])} the part sits ${fmtDb(d)} from the release. The ladder below draws all four numbers for every part; the bass was mastered as loud as it would go and the vocal was left quiet, exactly as the 2025 paper did it.`;
}
