/* Effect catalogue, preset chains, and diagnostic scenarios.
   Identical data structure to v1 — only the visualisations changed. */

window.EFFECTS = {
  hpf:        { name: 'High-pass filter',     category: 'eq',         params: '80 Hz · 24 dB/oct',      what: 'Removes low frequencies below a chosen cutoff. The slope (often 12 or 24 dB/octave) decides how steeply.', use: 'Cleans rumble, mic-stand thumps, traffic noise, and low-frequency build-up that masks the rest of the mix. Often the first effect in any chain.', spec: '1.11 EQ' },
  lpf:        { name: 'Low-pass filter',      category: 'eq',         params: '10 kHz · 12 dB/oct',     what: 'Removes high frequencies above a chosen cutoff. Used sparingly on full signals — more common on specific elements.', use: 'Tames harshness on hi-hats, dulls a too-bright synth, or carves space for vocals by pulling air off other instruments.', spec: '1.11 EQ' },
  peq:        { name: 'Parametric EQ',        category: 'eq',         params: '3 bands · Freq Q Gain',  what: 'Boosts or cuts a band of frequencies with a chosen centre, gain and Q (bandwidth). Surgical when narrow, musical when wide.', use: 'Carves out problem frequencies (narrow cut) or adds character (broad boost). The workhorse EQ in every modern session.', spec: '1.11 EQ' },
  shelving:   { name: 'Shelving EQ',          category: 'eq',         params: '+3 dB @ 10 kHz shelf',   what: 'Boosts or cuts everything above (high-shelf) or below (low-shelf) a turnover point. Broader than a parametric boost.', use: 'Adding air to a vocal (+2 dB high-shelf at 10 kHz). Adding warmth to a bass (+2 dB low-shelf at 200 Hz).', spec: '1.11 EQ' },
  deesser:    { name: 'De-esser',             category: 'dynamics',   params: '5–9 kHz · band',         what: 'A compressor that only triggers on sibilant frequencies (typically 5–9 kHz). Reduces "S" and "T" without dulling the whole vocal.', use: 'Almost always on lead vocals. Sits early in the chain so later compression doesn\'t exaggerate the sibilance.', spec: '1.9 Dynamic processing' },
  gate:       { name: 'Noise gate',           category: 'dynamics',   params: '−24 dB · hold · release', what: 'Closes when the signal drops below a threshold; opens when it rises above. Removes bleed and silence between hits.', use: 'Tightens drums (close the snare gate between hits), removes amp hiss between guitar phrases, cleans up bleed.', spec: '1.9 Dynamic processing' },
  comp:       { name: 'Compressor',           category: 'dynamics',   params: '4:1 · 5 ms · 80 ms',     what: 'Reduces the level of anything above the threshold by the ratio. Controls dynamic range, glues the signal together.', use: 'On almost everything in a modern mix. Sits after the gate / de-esser, before time-based effects, so it shapes the dry signal.', spec: '1.9 Dynamic processing' },
  mbcomp:     { name: 'Multiband compressor', category: 'dynamics',   params: '200 Hz / 2 kHz · 2:1',   what: 'Splits the signal into frequency bands, compresses each one separately, then recombines. Frequency-specific dynamic control.', use: 'Taming a muddy low end without dulling the highs. Reining in a peaky 4 kHz presence band on vocals while leaving the rest alone.', spec: '1.9 Dynamic processing' },
  limiter:    { name: 'Limiter',              category: 'dynamics',   params: '∞:1 · −0.3 dBFS',        what: 'A compressor with a very high ratio (∞:1) and fast attack. Stops the signal exceeding a ceiling.', use: 'Last effect before output. Catches stray peaks; on mastering chains, raises perceived loudness by reducing crest factor.', spec: '1.9 Dynamic processing' },
  saturation: { name: 'Saturation',           category: 'colour',     params: 'Tape · drive · mix',     what: 'Adds harmonic distortion — even harmonics for warmth, odd for grit. Modelled on tape, tube, or transformer characteristics.', use: 'Glues a bass to the kick. Adds harmonic body to a thin vocal. Used sparingly so it colours rather than distorts.', spec: 'Production technique' },
  chorus:     { name: 'Chorus',               category: 'modulation', params: '0.5 Hz · 8 ms · mix',    what: 'Short, modulated delay mixed with the dry signal. The pitch modulation creates a sense of multiple voices.', use: 'Widens a guitar, thickens a vocal harmony, adds movement to a static synth pad.', spec: '1.12 (modulation cousin)' },
  slap:       { name: 'Slap delay',           category: 'time',       params: '90 ms · 0 fb · mono',    what: 'A single short delay (60–120 ms) with little or no feedback. Reads as a single distinct echo.', use: 'Classic on rockabilly vocals and electric guitars. Used in modern pop to push a dry vocal further back without long-tail reverb.', spec: '1.12 Delay' },
  tape:       { name: 'Tape delay',           category: 'time',       params: '⅛ note · 35% fb · HPF',  what: 'Delay with wow, flutter, and frequency loss on each repeat — models analogue tape recirculation.', use: 'Adds character to vocals and guitars. The "ageing" of each repeat means feedback can be pushed higher without becoming harsh.', spec: '1.12 Delay' },
  plate:      { name: 'Plate reverb',         category: 'time',       params: 'RT60 1.8 s · pre 25 ms', what: 'Reverb modelled on a vibrating metal plate — bright, dense, no early reflections. Sits forward in the mix.', use: 'The classic vocal reverb. Adds size without pushing the vocal far back, because there are no obvious room reflections.', spec: '1.12 (reverb)' },
  room:       { name: 'Room reverb',          category: 'time',       params: 'RT60 0.8 s · early ref.',what: 'Reverb with clear early reflections that suggest a small-to-medium physical space.', use: 'On drums for natural space. On full mixes to glue elements into one acoustic environment.', spec: '1.12 (reverb)' },
  chamber:    { name: 'Chamber reverb',       category: 'time',       params: 'RT60 1.2 s · dense',     what: 'Reverb modelled on a small reverberant room (the original 1950s–60s technique used a literal echo chamber). Dense, warm, mid-decayed — less bright than plate, more intimate than hall.', use: 'Period-appropriate vocal reverb for 1950s–60s mixes (Sinatra, early Beatles). Edexcel 2025 C3 Q3(d) names chamber and plate as period-distinguishing reverb choices.', spec: '1.12 (reverb)' },
  hall:       { name: 'Hall reverb',          category: 'time',       params: 'RT60 3 s · aux send',    what: 'Reverb modelled on a large reverberant space — long RT60, slow build-up, slow decay. Furthest-sounding of the reverb types.', use: 'Orchestral, classical, choral. Used as an aux send so multiple sections share one believable acoustic; rarely as an insert on a single channel.', spec: '1.12 (reverb)' },
  flanger:    { name: 'Flanger',              category: 'modulation', params: '0.2 Hz · 60% fb',        what: 'A short delayed copy (1–5 ms) modulated by an LFO is mixed with the dry signal. The variable comb-filter notches create the swept-jet aesthetic.', use: 'Classic on electric guitars and pad synths for movement. Subtle settings (low depth, slow rate) add chorus-like width to acoustic guitar; aggressive settings give the rotary jet sound of late-sixties psychedelia.', spec: '1.12 (modulation cousin)' },
  phaser:     { name: 'Phaser',               category: 'modulation', params: '4-stage · 0.3 Hz',       what: 'A network of all-pass filters whose centre frequencies are modulated by an LFO. The result is a series of moving notches in the spectrum — unlike a flanger\'s evenly-spaced comb, these notches are non-harmonic.', use: 'Synth leads, Rhodes electric piano, funk guitar. The 4-stage analogue phaser is the warm classic; modern digital phasers offer many more stages for more pronounced sweep.', spec: '1.12 (modulation cousin)' },
  transient_shaper: { name: 'Transient shaper', category: 'dynamics', params: 'Attack +4 · Sustain 0',  what: 'Splits the envelope into attack and sustain. Two knobs let you boost or cut each independently, regardless of input level — different to a compressor, which always reacts to level.', use: 'Sharpens drum hits without needing the right compressor settings. Brings out the pick attack on acoustic guitar. Pulls back the body of a too-thick snare. The producer\'s second compressor.', spec: '1.9 Dynamic processing' },
  auto_pan:   { name: 'Auto-pan',             category: 'modulation', params: 'Sine · ¼-note rate',     what: 'An LFO drives the panning position automatically — typically a sine for smooth movement, a square for hard L/R alternation. Rate often synced to song tempo.', use: 'Movement on otherwise static elements (pads, hi-hats, FX returns). Stereo width without phase trickery. In a mono-summed mix it disappears, so it\'s decoration not foundation.', spec: '2.3 Signals (stereo image)' },
  tremolo:    { name: 'Tremolo',              category: 'modulation', params: '5 Hz · 40% depth · sin', what: 'An LFO directly modulates the amplitude of the signal — not the pitch (vibrato) and not the delay time (chorus/flanger). Result is a rhythmic level wobble whose shape depends on the LFO waveform (sine for smooth, square for chop).', use: 'Surf-rock Fender Twin guitar, Wurlitzer electric piano (the wobble IS the instrument), helicopter chop on synth pads. Slow + shallow for breathing movement, fast + deep for the choppy classic sound. Rate-synced to song tempo so it sits with the groove rather than fighting it.', spec: '1.12 (modulation cousin)' },
};

window.PRESETS = {
  vocal: {
    name: 'Bright vocal chain',
    narration: 'A lead vocal that needs to sit forward, sound polished, and stay clean. Filter out below the voice — control the sibilance before any compression exaggerates it — compress to even the dynamic range — shape the tone — then reverb last, so it sits on the shaped sound, not on raw breath noise.',
    chain: ['hpf', 'deesser', 'comp', 'peq', 'plate'],
    whyHere: {
      hpf:     'First. Removes mic-stand rumble and proximity boom before any dynamics processor sees it — otherwise the compressor wastes work pumping on inaudible low end. Cutoff 80–120 Hz, 12 or 24 dB/oct slope.',
      deesser: 'Before the compressor. Compression tightens dynamics, which makes any remaining sibilance more obvious. De-essing first means later compression doesn\'t amplify "S" sounds. Target the 5–10 kHz sibilance band with a threshold set so it only clamps the harshest consonants.',
      comp:    'Middle of the chain. Levels the dynamic range so the EQ that follows is shaping a consistent signal, not a moving target. Ratio 3:1 to 4:1, threshold to taste for 3–6 dB of gain reduction, attack 5–10 ms to let the consonant through, release 60–100 ms, make-up gain to restore level. 2025 C3 PEF flagged candidates who named the compressor without quoting these.',
      peq:     'After the compressor. Now that levels are even, you can hear what actually needs lifting — usually a small presence boost around 3 kHz (wide Q ~1) and a high-shelf at 10 kHz for air, with any 200–400 Hz mud cut on a narrow Q 4–6.',
      plate:   'Last. Reverb on the already-shaped voice. Putting reverb before compression would compress the reverb tail too, sucking the space out of the sound. RT60 around 1.5–2.5 s, pre-delay 20–40 ms, wet 15–25% — 2023 Q5(f) distinguishes reverb time from wet/dry balance.',
    },
  },
  bass: {
    name: 'Warm bass chain',
    narration: 'A bass guitar that needs to feel solid in the low end without losing definition. High-pass extreme sub that doesn\'t translate on most speakers — compress to tighten note-to-note variation — saturate to add harmonics that help bass cut through small speakers — then EQ the result.',
    chain: ['hpf', 'comp', 'saturation', 'peq'],
    whyHere: {
      hpf:        'First, cutoff around 30–40 Hz with a 24 dB/oct slope. Removes inaudible sub that eats headroom without contributing to the sound — phones, laptops and earbuds can\'t reproduce it anyway.',
      comp:       'Before saturation. Saturation reacts to input level — compressing first means each note enters the saturator at a similar level, so the harmonic character is consistent across the part. Ratio 4:1, attack 10–30 ms (let the pluck through), release ~100 ms, 4–6 dB gain reduction, make-up gain to taste.',
      saturation: 'Before the EQ. Saturation adds harmonics; EQ then chooses which of those new harmonics to emphasise. Moderate drive with a tape character setting for warmth — the new harmonics that help a bass translate to small speakers are typically in the 700 Hz – 2 kHz range.',
      peq:        'Last. Shapes the saturated tone. A small boost around 80 Hz with a wide Q (~0.7) for weight, a narrow Q 4–6 cut around 200–400 Hz to reduce mud, and a wide boost around 800 Hz–1 kHz to bring the bass forward on small speakers.',
    },
  },
  drums: {
    name: 'Aggressive drums chain',
    narration: 'A snare drum that needs to punch through a loud mix. High-pass first to clear sub-bass kick rumble before the gate detection circuit sees it — gate the remaining bleed — compress to add weight and sustain — EQ the sound, then a final limiter to catch peaks if the chain pushes hard.',
    chain: ['hpf', 'gate', 'comp', 'peq', 'limiter'],
    whyHere: {
      hpf:     'First — before the gate. Cutoff 60–80 Hz, slope 12–24 dB/octave. With the HPF in front, sub-bass kick rumble doesn\'t reach the gate\'s side-chain detection circuit, so the gate triggers cleanly on snare transients only.',
      gate:    'After the HPF. Removes hi-hat and remaining kick bleed in the snare track so later compression isn\'t triggered by anything except the snare hit. Threshold set just above the bleed level, hold 5–20 ms (so the gate doesn\'t snap shut mid-decay), release 30–50 ms.',
      comp:    'After the gate. Slow-ish attack around 10 ms lets the transient through before compression engages, then squashes the body — this is what makes the snare "fat". Ratio 4:1 to 8:1, release 60–100 ms (timed to the song\'s tempo), make-up gain to recover the level the gain reduction stole.',
      peq:     'After compression. Boost around 200 Hz (wide Q ~1) for body, narrow Q 4–6 cut around 400–600 Hz for box, wide boost around 5 kHz for crack. The compressor revealed the body of the sound that the EQ now sculpts.',
      limiter: 'Last. Catches the transient peaks that survived the slow compressor attack. Ceiling around −0.3 to −1.0 dBFS, release 100–300 ms — stops the snare clipping the buss if the kit is hitting hard, without changing the character of the hit.',
    },
  },
  orchestral: {
    name: 'Orchestral mix-bus',
    narration: 'A full orchestral stem that needs to glue without losing dynamic range. High-pass to remove rumble that doesn\'t translate, multiband compress to control band-specific resonances, transient-shape to give percussion attack without flattening the strings, gentle EQ. The hall reverb at the end of this chain represents an AUX SEND, not an insert — orchestral reverb is virtually always a send so multiple instrument groups share one believable acoustic.',
    chain: ['hpf', 'mbcomp', 'transient_shaper', 'peq', 'hall'],
    whyHere: {
      hpf:              'First. Low-end rumble from stage noise, HVAC and inaudible sub doesn\'t survive translation to smaller speakers — clear it now (cutoff 30–40 Hz, 12 dB/oct slope to stay gentle on the double-bass fundamentals) so the multiband compressor downstream has clean low end to react to.',
      mbcomp:           'Multiband, not full-band. Orchestral dynamics live in the differences between sections (brass roar vs string sotto voce). Crossovers around 200 Hz and 2 kHz, with each band on a mild ratio (~2:1) and only 1–2 dB of reduction — a full-band compressor crushes the contrast; multiband reins in a problematic frequency band without flattening the whole.',
      transient_shaper: 'Independent of input level. Percussion within the orchestra (timpani, snare, marimba) needs attack to cut through bowed strings — and a compressor at this stage would react to whatever\'s loudest, not whatever needs sharpening. A small positive attack (+2 to +4) and neutral or slightly negative sustain acts on envelope shape regardless of level.',
      peq:              'After dynamics. Now that levels are even, you can hear what actually needs lifting — usually a subtle high-shelf around 12 kHz (≤3 dB) for air and a narrow cut (Q 4–6) around 250 Hz for mud.',
      hall:             'On an aux send, NOT an insert. The 2020 C4 examiner report specifically criticises candidates who placed reverb as an insert when the convention is an aux. Sections feed this hall reverb at varying send levels so they share one acoustic environment — RT60 around 2.5–4 s, pre-delay 30–50 ms, wet level 20–30%.',
    },
  },
  electronic: {
    name: 'Electronic synth-stack',
    narration: 'A synth lead that needs movement, character and stereo width. High-pass to clear sub, phaser to add the sweep that defines the patch, compress to control any peaks the phaser introduces, EQ for placement, then flanger and auto-pan for the final layers of modulation. Tape delay last for tail and warmth.',
    chain: ['hpf', 'phaser', 'comp', 'peq', 'flanger', 'auto_pan', 'tape'],
    whyHere: {
      hpf:       'First. Synths often carry inaudible sub that adds to total energy but nothing useful — clear it. Cutoff around 50–80 Hz, 24 dB/oct slope.',
      phaser:    'Before compression. The phaser\'s moving notches change the signal\'s perceived level over time; compressing after means the compressor smooths those level changes rather than fighting them on the way in. Rate 0.3–0.8 Hz, depth ~60%, feedback moderate, 4–6 stages for a warm sweep.',
      comp:      'Middle of the chain. Tames the phaser\'s amplitude movement and keeps the lead at a consistent perceived loudness — ratio 4:1, threshold for 3–5 dB gain reduction, fast attack 1–5 ms, release 50–80 ms, make-up gain to restore level.',
      peq:       'After dynamics. Carves the synth into the mix: narrow Q 4 cut around 400–600 Hz where it competes with vocals, wide Q ~1 boost of 2–3 dB around 3 kHz for presence.',
      flanger:   'After EQ. The flanger\'s comb filter interacts with whatever harmonic content the EQ has emphasised — placing it after the EQ means the flange aligns with the parts you wanted to bring forward. Rate ~0.2 Hz, low depth, feedback moderate for the swept-jet character.',
      auto_pan:  'After flanger. Adds stereo movement on top of the flanger\'s spectral movement. Sine waveshape, rate synced to a 1/4 note, narrow depth (~30%) — too much auto-pan distracts from the lead instead of supporting it.',
      tape:      'Last. Tape delay adds tail and ageing on the fully-processed signal — quaver or dotted-quaver sync, feedback 30–40% with an HPF on the return to keep the repeats out of the way of the dry signal, stereo or ping-pong offset for width.',
    },
  },
  hiphop: {
    name: 'Hip-hop vocal chain',
    narration: 'A rap vocal that needs precision, presence and rhythmic punch. High-pass for clarity, de-ess for sibilance, compress to even delivery, transient-shape to re-sharpen consonants the compressor softened, EQ for presence, phaser as a creative effect on the doubled vocal, and slap delay last for the classic rhythmic echo.',
    chain: ['hpf', 'deesser', 'comp', 'transient_shaper', 'peq', 'phaser', 'slap'],
    whyHere: {
      hpf:              'First. Removes proximity bass build-up from a rapper holding the mic close — a bigger problem on rap vocals than sung vocals because rappers articulate hard against the diaphragm. Cutoff 100–120 Hz, 24 dB/oct slope.',
      deesser:          'Before compression. The percussive delivery of rap means consonant transients dominate the spectrum; uncontrolled, they sound spitty when the rest of the chain emphasises them. Target the 6–9 kHz band with a threshold set so it engages only on the harshest "ts" and "ch" sounds.',
      comp:             'Middle. Levels the delivery — a rapper\'s dynamic range across a verse can be 15 dB; the chain after this expects something closer to 6 dB. Ratio 4:1, attack 5–10 ms, release 60–100 ms, threshold for 6–8 dB gain reduction, make-up gain to restore level. 2025 C3 PEF specifically flagged candidates who omitted these.',
      transient_shaper: 'After the compressor. The compressor flattened the dynamics; the transient shaper now re-sharpens the consonants without un-doing the level control — attack +3 to +5, sustain neutral or slightly negative. This is the trick that gives commercial rap vocals their forward-sitting clarity.',
      peq:              'After dynamics shaping. Carves the vocal: high-shelf around 8 kHz (≤4 dB) for air, narrow Q 4–6 cut around 300 Hz if the rap is muddy, subtle wide Q ~1 boost at 2.5 kHz for presence.',
      phaser:           'Creative, not surgical. Often used on a doubled vocal hard-panned opposite the dry — rate ~0.3 Hz, depth high, 4-stage analogue character. The phaser sweep gives the double a separate sonic identity so it reads as a counter-voice, not a duplicate.',
      slap:             'Last. Short slap delay 60–120 ms with little or no feedback, mono and slightly off-centre. Gives the classic rap-vocal-echo rhythm without the long tail of a reverb. Place it after everything else so it imprints the fully-processed sound, not the raw signal.',
    },
  },
  acoustic: {
    name: 'Acoustic singer-songwriter',
    narration: 'A voice-and-guitar arrangement that needs warmth, gentle width, and a believable space. High-pass for clarity, gentle compression, transient-shaping to bring out the pluck on the guitar, EQ for tonal balance, subtle flanger and auto-pan for organic stereo movement, then plate reverb for the singer-songwriter polish.',
    chain: ['hpf', 'comp', 'transient_shaper', 'peq', 'flanger', 'auto_pan', 'plate'],
    whyHere: {
      hpf:              'First. Removes the boomy proximity bass on a close-miked acoustic and any room rumble — both translate badly on small speakers. Cutoff 60–80 Hz, 12 dB/oct slope so the body of the guitar is preserved.',
      comp:             'Early. Ratio 2:1 or 3:1, 2–4 dB of gain reduction, attack 10–20 ms (lets the pluck through), release 80–120 ms, make-up gain to restore level — controls the dynamic spread of fingerstyle playing without flattening it. The character of the genre is dynamic; over-compression kills it.',
      transient_shaper: 'After compression. Brings back the pluck attack that the compressor softened — attack +2 to +4, sustain neutral. Independent of level means it sharpens quiet notes as much as loud ones, exactly what fingerstyle needs where the quiet phrases are the emotionally important ones.',
      peq:              'After dynamics. Wide Q ~0.7 boost around 80–100 Hz for warmth, narrow Q 4–6 cut around 200–300 Hz for boom, gentle high-shelf around 10 kHz (≤3 dB) for air.',
      flanger:          'Subtle. Low depth (5–10%) and slow rate (around 0.2 Hz), feedback minimal — almost a chorus, but the comb-filter character gives a particular kind of movement that\'s different from chorus.',
      auto_pan:         'After flanger, subtle. Sine waveshape, slow rate synced to a 1/2 or whole note, narrow depth (~20%). Adds breathing stereo width without becoming an obvious effect — the recording feels like it has more air than a static stereo image.',
      plate:            'Last. Plate is the singer-songwriter cliché for a reason: bright, dense, no obvious room reflections. RT60 around 1.8–2.5 s, pre-delay 20–30 ms, wet 10–20% — the song lives in its own polished space rather than a particular room.',
    },
  },
};

window.DIAGNOSTICS = {
  smeared_vocal: {
    name: 'Smeared vocal',
    brief: 'A bright vocal chain that should sit forward in the mix is sounding washed out. The reverb pumps along with the singer\'s louder syllables. The effects are right; the order is wrong. Rearrange and click Diagnose.',
    brokenChain: ['hpf', 'deesser', 'plate', 'comp', 'peq'],
    faults: [
      { id: 'reverb_before_comp',
        detect: function (c) {
          const reverbs = ['plate', 'room'];
          const compIdx = c.indexOf('comp');
          if (compIdx === -1) return false;
          return reverbs.some(function (r) { const ri = c.indexOf(r); return ri !== -1 && ri < compIdx; });
        },
        examinerLanguage: 'Squashed amplitude envelope, loss of transient punch. The reverb sits on an insert before the compressor — the compressor flattens both the reverb tail and the dry signal together, removing the percussive attack the vocal needs. In examiner vocabulary (2019 Q5d, 2020 Q6), the reverb belongs on an aux send so the compressor acts on the dry signal only.',
        hint: 'Move the reverb to after the compressor and the EQ. Reverb sits on the fully-shaped dry signal.' },
    ],
    cleanMessage: 'Chain is clean. The reverb now sits on the fully-shaped dry signal — exactly the position an examiner would describe as industry standard for a polished vocal.',
  },
  muddy_drums: {
    name: 'Muddy drums',
    brief: 'The snare track is muddier than expected and the perceived loudness pumps on every kick hit. Reordering alone may not fix it — you might need to add an effect that isn\'t in the chain yet. Click Diagnose when you think you have it.',
    brokenChain: ['comp', 'peq', 'limiter'],
    faults: [
      { id: 'no_gate_or_hpf_first',
        detect: function (c) {
          if (c.length === 0) return false;
          const first = c[0];
          return first !== 'gate' && first !== 'hpf';
        },
        examinerLanguage: 'Low-mid frequency congestion (typically 200–400 Hz) and bleed from adjacent kit pieces triggering the compressor\'s gain reduction. Without a gate or HPF first, the compressor reacts to kick spill and rumble alongside the snare hits — perceived loudness drags around with the kick instead of staying snare-tight.',
        hint: 'Add a noise gate as the first effect in the chain. On the palette below, click Noise gate.' },
    ],
    cleanMessage: 'Chain is clean. With a gate at the front, the compressor reacts only to snare hits — the perceived loudness no longer drags around with the kick bleed.',
  },
  pumping_master: {
    name: 'Pumping master',
    brief: 'A mastering chain has the right effects but two are swapped. The mix is pumping — the loud parts crush the transients and the quieter parts feel sucked-out. Reorder and click Diagnose.',
    brokenChain: ['peq', 'limiter', 'comp'],
    faults: [
      { id: 'comp_after_limiter',
        detect: function (c) {
          const ci = c.indexOf('comp'); const li = c.indexOf('limiter');
          return ci !== -1 && li !== -1 && ci > li;
        },
        examinerLanguage: 'Pumping and breathing — the dynamic range has been crushed. The compressor is reading peaks that have already been limited to a fixed ceiling, so what is left is uniform loudness with no natural variation. 2025 C3 PEF names this directly as "confusion between the mixing and mastering stages of production": per-channel dynamic control belongs in mixing, broad ceiling-management belongs in mastering. The two cannot be reordered.',
        hint: 'The compressor needs to act before the limiter, not after. Move the limiter to the end of the chain.' },
    ],
    cleanMessage: 'Chain is clean. Compression now shapes the dynamics before the limiter catches the residual peaks — the order an examiner would describe as a correct mastering chain.',
  },
  harsh_bass: {
    name: 'Harsh bass',
    brief: 'A bass chain has saturation in the wrong place. The result has fizzy top-end harmonics that you can hear clearly on small speakers — but they\'re also masking the transient of each note. Reorder and click Diagnose.',
    brokenChain: ['hpf', 'comp', 'peq', 'saturation'],
    faults: [
      { id: 'saturation_after_eq',
        detect: function (c) {
          const si = c.indexOf('saturation'); const pi = c.indexOf('peq');
          return si !== -1 && pi !== -1 && si > pi;
        },
        examinerLanguage: 'Harmonic distortion in the upper frequencies, with transient detail masked by added overtones. Saturation generates new harmonics — integer multiples of the fundamental — on top of whatever you feed it. Placing the EQ before the saturation means the EQ cannot shape those newly-generated overtones, and the harshness propagates straight to the output.',
        hint: 'Move saturation before the EQ. The EQ then chooses which of the new harmonics to emphasise and which to cut.' },
    ],
    cleanMessage: 'Chain is clean. The EQ now sculpts the saturated harmonics rather than the saturation overwriting the EQ — that\'s where the small-speaker translation lives.',
  },
  choppy_vocal: {
    name: 'Choppy vocal',
    brief: 'A lead vocal has been treated like a snare drum — a noise gate first, before anything else. The result chops off the start and end of words. 2019 and 2020 Edexcel PEFs both flag "gating on the dry vocal" as a direct mark-loser. Click Diagnose to see how the failure mode is documented.',
    brokenChain: ['gate', 'hpf', 'deesser', 'peq', 'comp', 'plate'],
    faults: [
      { id: 'gate_on_vocal',
        detect: function (c) {
          return c.indexOf('gate') !== -1 && (c.indexOf('deesser') !== -1 || c.indexOf('plate') !== -1);
        },
        examinerLanguage: 'Audible join when the gate opens and closes — the gate\'s threshold removes vocal breathing and quiet consonants (f, s, th), then re-opens during the sustained part of the syllable. 2019 Q5d and 2020 Q5e both flag "gating on the dry vocal ruining the mix balance" as a direct mark-loser. Lead vocals are almost never gated; for breath control, use volume automation instead.',
        hint: 'Remove the noise gate from the chain (the × on its node). For breath control on lead vocals, ride the fader manually or use volume automation — never a gate.' },
    ],
    cleanMessage: 'Chain is clean. Without the noise gate, the vocal\'s breath and consonants survive intact — manual volume automation is the engineer\'s tool for breath control on lead vocals.',
  },
  seasick_chorus: {
    name: 'Seasick chorus on vocal',
    brief: 'A lead vocal has been fed into a chorus module that is set to behave like a vibrato pedal — fast rate, very deep modulation, mix pushed past unity. The result is a wobbly, pitched-up, "seasick" tone that obscures the lyric and clashes with anything tuned. The chain order is fine; the wrong choice is using chorus this aggressively on a featured vocal at all. Click Diagnose to see how an examiner would phrase it.',
    brokenChain: ['hpf', 'deesser', 'comp', 'peq', 'chorus', 'plate'],
    faults: [
      { id: 'chorus_on_lead_vocal',
        detect: function (c) {
          return c.indexOf('chorus') !== -1 && (c.indexOf('deesser') !== -1 || c.indexOf('plate') !== -1);
        },
        examinerLanguage: 'Audible pitch modulation on a sustained vocal note; perceived intonation drift; loss of lyric intelligibility. 2024 C3 PEF criticises "modulation applied to the lead vocal" where candidates added chorus to thicken a thin voice instead of fixing it with EQ and saturation. Chorus modulates a short delay line with an LFO — at depths beyond about 15% the pitch wobble becomes obvious and starts to argue with anything tuned in the arrangement. The conventional vocal-thickening tools are: a doubled vocal track (recorded twice, hard-panned), parallel saturation, or a high-shelf boost — not insert chorus on the lead.',
        hint: 'Remove the Chorus from the chain (the × on its node). For "thicker" lead vocal, double-track the part, add parallel saturation, or shelve-up 8–10 kHz — name the technique in your written answer.' },
    ],
    cleanMessage: 'Chain is clean. Without the chorus, the vocal stays present and tuned. In your written answer, name the alternative thickening techniques (double-tracking, parallel saturation, high-shelf air) so the examiner sees you knew why chorus was wrong here.',
  },
  glitchy_gate: {
    name: 'Glitchy gate',
    brief: 'A snare gate is misbehaving. Some hits trigger correctly, but the gate also opens on hi-hat spill — and on the hits it does catch, the decay is being chopped off. The fix is partly structural (in the chain) and partly parameter-tuning (which the prototype names but doesn\'t simulate). Click Diagnose to see what an examiner would flag.',
    brokenChain: ['gate', 'comp', 'peq'],
    faults: [
      { id: 'gate_without_hpf_first',
        detect: function (c) {
          var gi = c.indexOf('gate'); var hi = c.indexOf('hpf');
          return gi !== -1 && (hi === -1 || hi > gi);
        },
        examinerLanguage: 'Audible joins when the gate cycles; chopped decay; opening on the wrong source. 2022 Q5(c) verbatim flags "threshold too low so the hi-hats were triggering the gate too" — exactly this failure family. Two corrections are needed: (1) structural: put an HPF (cutoff 60–80 Hz, slope 24 dB/oct) BEFORE the gate so the gate\'s side-chain detection circuit doesn\'t see kick rumble; (2) parameter-tuning: threshold just above bleed level, hold 5–20 ms, release 30–50 ms.',
        hint: 'Add a high-pass filter and place it before the gate. Then in your written answer, note that threshold, hold and release also need correcting for the gate to stop chattering.' },
    ],
    cleanMessage: 'Chain now has an HPF before the gate. The gate triggers only on the cleaner, mid-and-up-band signal of the snare itself, not on kick rumble. The remaining work is parameter-tuning the gate — threshold just above bleed, hold 5–20 ms, release 30–50 ms.',
  },
};
