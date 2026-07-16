// Pre-generated expansions for key terms across all learn topics.
// Instant, no API call, no cost. Matched by longest substring.

const SYNTHESIS_EXPANSIONS = [
  // --- What Is Sound? ---
  { trigger: "pressure waves", content: "A vibrating object pushes and pulls the air molecules around it, creating alternating regions of higher and lower air pressure that travel outward. This travelling pattern of pressure change is a sound wave — it's what reaches your ear (or a microphone) and gets interpreted as sound." },
  { trigger: "cycles per second", content: "Frequency is measured in Hertz (Hz) — the number of complete vibration cycles happening every second. A 110 Hz tone completes 110 full cycles per second. The faster the cycle repeats, the higher the frequency, and the higher the pitch you hear." },
  { trigger: "vibration swings", content: "Amplitude is how far the vibration moves from its resting position — a bigger swing means a bigger pressure wave. This is independent of frequency: you can have a slow, wide swing (low pitch, loud) or a fast, narrow swing (high pitch, quiet), or any combination." },

  // --- The Harmonic Series ---
  { trigger: "whole-number multiples", content: "Harmonics sit at exact integer multiples of the fundamental frequency: 1×, 2×, 3×, 4× and so on. A 110 Hz fundamental has harmonics at 220 Hz, 330 Hz, 440 Hz, 550 Hz — never at fractional multiples like 1.5× or 2.7×. This whole-number relationship is what makes the harmonics sound related to (and blend with) the fundamental, rather than clashing with it." },
  { trigger: "raw material that gives an instrument its timbre", content: "Two notes can share an identical fundamental frequency (the same pitch) and still sound completely different, because the balance of harmonics above that fundamental differs. Which harmonics are present, and how loud each one is relative to the others, is what your ear reads as an instrument's characteristic sound — its timbre." },

  // --- Timbre ---
  { trigger: "identical fundamental frequency", content: "When two instruments play ‘the same note’, they're producing the same fundamental frequency — that's literally what makes it the same pitch. Everything about how the instruments differ audibly happens in the harmonics stacked above that shared fundamental." },
  { trigger: "harmonic recipe", content: "Think of harmonic content like a recipe: the fundamental sets the base note, and each harmonic is an ingredient added on top at its own quantity (amplitude). Change the recipe — more of some harmonics, less of others — and the result tastes (sounds) like a different instrument, even though the base note never changed." },

  // --- What is Subtractive Synthesis ---
  { trigger: "harmonically rich waveform", content: "A waveform that contains multiple harmonics beyond the fundamental frequency. Sawtooth and square waves are harmonically rich \u2014 a sawtooth contains every harmonic (1st, 2nd, 3rd, etc.) while a square wave contains only odd harmonics. The more harmonics present, the more material the filter has to work with." },
  { trigger: "remove frequencies using filters", content: "Filters attenuate (reduce the volume of) frequencies above, below, or around a set point called the cutoff frequency. This is the \u2018subtractive\u2019 part \u2014 you start with a complex sound and carve away what you don\u2019t want, rather than building up from simple components." },
  { trigger: "additive synthesis", content: "Additive synthesis builds complex timbres by layering individual sine waves at different frequencies and amplitudes. Each sine wave represents a single harmonic. While powerful, it requires many oscillators to create rich sounds \u2014 subtractive synthesis achieves similar results more efficiently by starting rich and filtering down." },
  { trigger: "carving a sculpture", content: "This analogy captures the core philosophy: a sculptor starts with a solid block of marble (the harmonically rich waveform) and removes material (frequencies) to reveal the shape (timbre) within. The filter is the chisel." },

  // --- Oscillators & Waveforms ---
  { trigger: "sawtooth waves contain all harmonics", content: "A sawtooth wave contains every harmonic of the fundamental \u2014 the 2nd harmonic at half the amplitude, the 3rd at a third, and so on. This gives it a bright, buzzy, string-like quality. It\u2019s the most common starting point in subtractive synthesis because it gives the filter the most material to shape." },
  { trigger: "square waves have only odd harmonics", content: "Square waves contain the 1st, 3rd, 5th, 7th harmonics and so on \u2014 no even harmonics at all. This creates a hollow, woody, clarinet-like tone. The absence of even harmonics is why it sounds distinctly different from a sawtooth despite having a similar brightness." },
  { trigger: "triangle waves", content: "Triangle waves also contain only odd harmonics like square waves, but they fall off much faster in amplitude \u2014 the 3rd harmonic is nine times quieter than the fundamental. This makes them sound softer and more mellow, closer to a sine wave but with subtle harmonic content." },
  { trigger: "sine waves are pure", content: "A sine wave is a single frequency with no harmonics at all \u2014 it\u2019s the simplest possible waveform. Because there are no harmonics to filter, sine waves are rarely used as the main oscillator in subtractive synthesis. However, they\u2019re useful for sub-bass layers and as modulation sources (LFOs)." },

  // --- Filters ---
  { trigger: "low-pass filter", content: "A low-pass filter (LPF) allows frequencies below the cutoff point to pass through while progressively attenuating frequencies above it. The rate of attenuation is measured in dB/octave \u2014 a 12dB/octave slope is gentle, while a 24dB/octave slope (common in Moog-style synths) is much steeper and more dramatic." },
  { trigger: "cutoff point", content: "The cutoff frequency is where the filter begins to attenuate. It\u2019s not a hard wall \u2014 frequencies near the cutoff are only slightly reduced, with attenuation increasing further away. The cutoff is usually the most important parameter on a subtractive synth and is often mapped to a large knob for real-time control." },
  { trigger: "high-pass does the opposite", content: "A high-pass filter (HPF) removes frequencies below the cutoff while letting highs through. It\u2019s used to thin out sounds, remove low-end rumble, or create tinny, telephone-like effects. In mixing, high-pass filters are commonly applied to vocals and guitars to keep the low end clear for bass and kick drum." },
  { trigger: "band-pass lets through only a narrow range", content: "A band-pass filter combines low-pass and high-pass behaviour \u2014 it attenuates both above and below a centre frequency, letting only a narrow band through. The width of this band is controlled by the Q or resonance parameter. Narrow band-pass filtering creates nasal, vocal-like qualities." },
  { trigger: "sweeping the cutoff down darkens the sound", content: "As you lower the cutoff frequency, more and more harmonics are filtered out, making the sound progressively duller and darker. This sweeping motion \u2014 especially when controlled by an envelope or LFO \u2014 is one of the most characteristic sounds of subtractive synthesis." },

  // --- Resonance ---
  { trigger: "narrow band of frequencies right at the cutoff", content: "This is what resonance (often labelled Q) does: instead of the filter rolling off smoothly, it raises a peak in the frequency response right where the cutoff sits, emphasising those harmonics rather than removing them evenly. That\u2019s why a resonant filter sounds \u2018vocal\u2019 or \u2018whistling\u2019 \u2014 a narrow range of harmonics rings out louder than the rest." },
  { trigger: "self-oscillates", content: "Pushed far enough, the resonance peak becomes self-sustaining and the filter starts generating its own tone even with no input signal \u2014 a fixed-pitch sound that ignores whatever notes are being played. The exam mark-scheme phrase for this is a \u2018fixed-pitch scream that ignores the notes\u2019." },
  { trigger: "classic squelch of acid house basslines", content: "This sound \u2014 high resonance riding just below self-oscillation while an envelope sweeps the cutoff \u2014 is the classic acid patch: hold the cutoff still, raise resonance in stages toward self-oscillation, then let the filter envelope sweep the cutoff for the squelch." },

  // --- What Is an Envelope? ---
  { trigger: "plays once per note", content: "An envelope fires exactly once per note — the moment a key goes down it starts the Attack stage, runs through Decay and Sustain while the key is held, and only begins Release when the key lifts. That's different from an LFO, which cycles continuously and ignores whether a key is held at all: an envelope is a one-shot per-note event, an LFO is a repeating background wobble." },
  { trigger: "Attack, Decay, Sustain, Release", content: "Three of the four ADSR stages are times — Attack, Decay and Release all measure how long something takes. Sustain is different in kind: it's a level, not a time — the height a note holds at for as long as the key stays down. Mixing this up (describing sustain as a duration) is the single most commonly dropped mark in the whole topic." },
  { trigger: "static value", content: "Without any modulation, a synth parameter just sits wherever its knob is left — a single fixed number that never moves for the whole note. Turning that fixed number into something that changes over time is exactly what modulation sources like envelopes are for." },

  // --- Filter Envelope ---
  { trigger: "envelope controls how the filter cutoff changes", content: "Without an envelope, the filter cutoff stays at a fixed position and the tone never changes. The envelope adds movement by automatically sweeping the cutoff over time when a note is played. The envelope amount control determines how far the cutoff sweeps." },
  { trigger: "attack opens the filter", content: "The attack phase controls how quickly the filter cutoff rises to its maximum envelope amount after a key is pressed. Zero attack means the filter opens instantly (bright immediately). A slow attack means the brightness gradually increases \u2014 useful for pad sounds that slowly bloom." },
  { trigger: "decay brings it partway back", content: "After reaching the attack peak, the decay phase brings the filter cutoff back down to the sustain level. A short decay creates percussive pluck sounds \u2014 the brightness flashes briefly then settles. A long decay creates a slow, gradual darkening." },
  { trigger: "sustain holds a level", content: "The sustain parameter sets the filter cutoff level that\u2019s maintained while the key is held down, after the attack and decay phases complete. Unlike the other ADSR parameters, sustain is a level (not a time). A low sustain with fast decay creates short, percussive filter effects." },
  { trigger: "release closes the filter", content: "When the key is released, the release phase controls how quickly the filter cutoff returns to its resting position. A short release snaps the filter shut immediately. A long release lets the brightness tail off gradually, which works well for ambient pads and evolving textures." },
  { trigger: "classic wah of analogue synths", content: "The \u2018wah\u2019 sound comes from a fast attack followed by a medium decay with moderate resonance \u2014 the filter briefly opens wide (bright) then closes back down. This is the signature sound of classic analogue synths like the Minimoog and Roland SH-101, and is fundamental to acid bass lines." },

  // --- Amplitude Envelope ---
  { trigger: "amplitude envelope shapes the volume", content: "While the filter envelope controls brightness over time, the amplitude envelope controls loudness over time. Together they define the complete character of a note \u2014 a piano-like sound needs fast attack, immediate decay, no sustain and short release, while a string pad needs slow attack, full sustain and long release." },
  { trigger: "fast attack with no sustain creates percussive hits", content: "With zero attack time the sound reaches full volume instantly. Combined with zero sustain, the sound immediately begins to fade after the decay phase \u2014 creating short, punchy hits like drum sounds, plucks, or stabs. The decay time controls how long the hit rings out." },
  { trigger: "slow attack creates swells", content: "A slow attack means the volume gradually increases from silence to full level. This removes the initial transient, creating smooth fade-ins. String pads, ambient textures, and cinematic swells all use slow attack times. The attack time might be anywhere from 100ms to several seconds." },
  { trigger: "long release adds tail", content: "Release time determines how long the sound takes to fade to silence after the key is released. A long release creates a reverb-like tail where notes ring out and overlap. This is essential for pad sounds but would make a bass line sound muddy \u2014 matching release time to the musical context is important." },
  { trigger: "natural amplitude envelope", content: "Every acoustic instrument has a characteristic amplitude envelope. A piano has a fast attack (hammer strike), no sustain (the note decays naturally), and moderate release (damper pedal). A violin bowed note has a slow attack, steady sustain, and gradual release. Synthesisers let you design envelopes that don\u2019t exist in nature." },

  // --- Envelope Recipes ---
  { trigger: "instant attack, fast decay and zero sustain", content: "Each stage does its job here: instant attack means the note reaches full level immediately, with no fade-in, so it feels struck rather than played. Fast decay drops it back down quickly, giving a snappy, plucked front edge. Zero sustain means there's no held level at all, so once decay finishes the note has nothing left to hold onto and dies away rather than ringing." },
  { trigger: "slow attack, high sustain and long release", content: "A slow attack fades the note in gradually rather than starting instantly \u2014 the classic pad quality of a sound that seems to bloom into existence. High sustain keeps it near full volume for as long as the key is held, and a long release lets it ring on and overlap into whatever comes next, exactly the atmosphere a pad is used for." },
  { trigger: "keeps the low end tight", content: "A short release cuts a note's tail off quickly once the key lifts, rather than letting it ring on. This matters more for bass parts than most other sounds: overlapping low-frequency tails build up energy and muddy a mix, so a stab that gets out of the way promptly leaves room for the next note to read clearly." },

  // --- Signal Flow ---
  { trigger: "oscillator generates the waveform, filter shapes the tone, amplifier controls the volume", content: "This three-stage chain \u2014 oscillator, filter, amplifier \u2014 is the fundamental architecture of every subtractive synthesiser. The signal flows in one direction: generation, then tonal shaping, then volume shaping. Each stage has its own modulation sources (envelopes, LFOs) that add movement and expression." },
  { trigger: "modulated by its own envelope or LFO", content: "Modulation means automatically changing a parameter over time. An envelope changes it once per note (triggered by key press). An LFO (Low Frequency Oscillator) changes it continuously in a repeating cycle \u2014 for example, routing an LFO to pitch creates vibrato, routing it to the filter creates a rhythmic wah effect, and routing it to amplitude creates tremolo." },
  { trigger: "LFO", content: "A Low Frequency Oscillator generates a waveform too slow to hear (typically below about 20 Hz) used purely for modulation. It cycles continuously regardless of key presses. Common LFO shapes include sine (smooth wobble), square (on/off switching), and sample-and-hold (random stepped values). LFO rate and depth are the key controls." },
  { trigger: "Minimoog", content: "The Minimoog Model D (1970) was one of the first portable, integrated synthesisers and defined the subtractive synthesis architecture still used today. Its three oscillators, 24dB/octave ladder filter, and straightforward signal flow made it accessible to performers. Its warm, fat sound remains a benchmark for analogue synthesis." },
  { trigger: "signal path", content: "The signal path describes the order in which audio passes through each processing stage. In subtractive synthesis: oscillator \u2192 filter \u2192 amplifier \u2192 output. Changing this order would produce completely different results \u2014 for example, placing the amplifier before the filter would mean the envelope shapes volume before tonal shaping occurs." },

  // --- What Is an LFO? ---
  { trigger: "falls below the range of hearing", content: "An LFO's rate typically sits under about 20 Hz \u2014 roughly the lower edge of human pitch perception. Because its own cycle never rises into the audible range, you can't hear the LFO directly; you only hear its effect on whatever parameter it's aimed at." },
  { trigger: "control signal", content: "Calling the LFO a control signal (rather than an audio signal) is the key distinction: it doesn't join the audio path or come out of the speakers, it just steers another parameter's value over time. Treating the LFO as something audible \u2014 \u2018good for bass because it's low frequency\u2019 \u2014 is a commonly flagged misconception." },

  // --- Rate and Depth ---
  { trigger: "Rate sets how fast the cycle turns", content: "Rate is measured in Hz, the same unit as an audio oscillator's frequency \u2014 but because an LFO's rate stays under the audible threshold, you feel it as a tempo of movement (a slow swell versus a fast flutter) rather than hearing it as a pitch." },
  { trigger: "Depth sets how far the parameter swings from its centre position", content: "Depth is an amount, not a speed \u2014 it scales how far each cycle pushes the target parameter away from its resting (centre) value. Rate and depth are independent controls: a patch can have a fast, shallow wobble or a slow, wide one, in any combination." },

  // --- LFO Targets ---
  { trigger: "Destination decides the name", content: "The exam rewards naming both halves: the target parameter AND the resulting effect. \u2018Add an LFO\u2019 on its own earns nothing \u2014 pitch \u2192 vibrato, amplitude \u2192 tremolo, filter cutoff \u2192 wah are the three named destinations this course covers." },
  { trigger: "pulsing rise and fall in volume", content: "Tremolo is the amplitude case: the LFO drives the amplifier stage up and down in a steady cycle, so the note's volume visibly rises and falls while its pitch and tone stay untouched. It's the volume equivalent of vibrato." },

  // --- LFO vs Envelope ---
  { trigger: "triggered once at key-down", content: "This is the same one-shot behaviour envelopes always have: the moment a key goes down the shape starts, runs through its stages while held, and only completes on release \u2014 then it waits, silent, for the next key-down to fire it again." },
  { trigger: "repeating movement or a single shaped gesture", content: "This is the practical decision every patch design makes: reach for an LFO when a parameter should keep moving for as long as the note (or patch) runs, reach for an envelope when it should move once, shaped, and then hold or stop." },

  // --- Carrier and Modulator ---
  { trigger: "audio rate", content: "Audio rate means the modulator's frequency has been pushed up into the range the ear hears as pitch — typically above roughly 20 Hz — rather than sitting below it like an LFO. At LFO rates the same modulation is heard as vibrato; at audio rate it stops sounding like movement and generates entirely new frequencies (sidebands) instead." },
  { trigger: "sidebands", content: "Sidebands are new frequency components created by the modulation itself — they don't exist in either the carrier or the modulator alone. They appear in pairs above and below the carrier frequency, spaced according to the modulator's frequency, and it's their presence (not a filter) that gives FM synthesis its complex, sometimes metallic timbres." },
  { trigger: "modulation depth", content: "Modulation depth (also called the modulation index) sets how far the modulator pushes the carrier's frequency on each cycle. The deeper the modulation, the wider that frequency swing, and the more — and stronger — sidebands appear around the carrier. That's heard as the sound growing brighter and more complex: depth does the job a filter's cutoff does in subtractive synthesis." },

  // --- Operators and Algorithms ---
  { trigger: "is called an operator", content: "Calling the unit an operator (rather than just an oscillator) reflects that it's a package: an oscillator paired with its own envelope. On Ableton's Operator, each of the four operators has its own waveform, tuning and level controls plus a dedicated ADSR, and any operator can be set to modulate another or to sound on its own." },
  { trigger: "stack in a chain", content: "Stacking operators in a chain means one operator's output is routed to modulate the next operator's frequency, which can in turn modulate the next again. Each link in the chain adds another layer of sidebands, which is why chained (stacked) algorithms tend to produce denser, more complex timbres than a single modulator-carrier pair." },
  { trigger: "run in parallel", content: "Running operators in parallel means each one is routed straight to the output rather than into another operator's frequency input — so no operator modulates any other. Parallel operators simply add their own tones together, like layering extra oscillators in a subtractive synth, rather than generating sidebands." },

  // --- Modulator:Carrier Ratios ---
  { trigger: "whole-number ratios", content: "A whole-number ratio (1:1, 2:1, 3:1 and so on) places every sideband exactly on a multiple of the carrier frequency — the same positions the carrier's own natural harmonics would occupy. Because the new content lines up with a familiar harmonic series, the ear reads the result as musical and 'in tune' rather than clashing." },
  { trigger: "non-integer ratios", content: "A non-integer ratio (2.37:1, 1.41:1 and so on) places sidebands at frequencies that don't line up with the carrier's harmonic series at all. The ear can't relate these frequencies to a familiar pitch structure, which is heard as inharmonic, clangorous or bell-like — exactly the character FM is famous for." },

  // --- FM in Practice ---
  { trigger: "DX7", content: "The DX7 (1980s) was an early digital FM synthesiser, and its factory patches for electric piano and bell sounds became some of the most widely used FM tones of the decade. FM's exam-relevant home today is Ableton's Operator, which uses the same carrier/modulator/algorithm principles." },
  { trigger: "sideband content", content: "'Sideband content' is shorthand for everything the modulation adds beyond the plain carrier tone — the whole cluster of new frequencies generated around it. Different instrument characters come from shaping that content differently: which ratio is used, how strong (deep) the modulation is, and how each operator's envelope shapes it over time." },
];

const EQ_EXPANSIONS = [
  // --- What EQ Solves ---
  { trigger: "mix of frequencies", content: "Every sound \u2014 a voice, a guitar, a snare drum \u2014 is made up of multiple frequencies vibrating simultaneously. The fundamental frequency determines the pitch, while the upper harmonics (overtones) determine the tone colour or timbre. EQ lets you adjust these individual frequency components independently." },
  { trigger: "boost or cut specific frequency ranges", content: "Boosting adds gain (volume) at a chosen frequency, making that part of the sound louder. Cutting reduces gain, making it quieter. The key skill in EQ is knowing which frequencies to target \u2014 for example, 200\u2013400 Hz adds warmth, 2\u20135 kHz adds presence, and 8\u201312 kHz adds air and sparkle." },
  { trigger: "tonal balance", content: "Tonal balance refers to how evenly the energy of a sound or mix is distributed across the frequency spectrum. A well-balanced mix has appropriate levels of bass, midrange, and treble. EQ is the primary tool for correcting imbalances \u2014 for example, a mix that sounds muddy has too much energy in the low-mids (200\u2013500 Hz)." },
  { trigger: "fixing problems or enhancing character", content: "Corrective EQ removes unwanted resonances, rumble, or harshness \u2014 typically using cuts. Creative EQ shapes the tone to achieve a desired character \u2014 typically using boosts. A common approach: cut to fix, boost to enhance. Cuts are generally safer because they reduce rather than add energy." },

  // --- Graphic EQ ---
  { trigger: "graphic EQ splits the frequency spectrum into fixed bands", content: "Each band is centred at a predetermined frequency that cannot be changed. A 10-band graphic EQ typically has bands at octave intervals: 31 Hz, 62 Hz, 125 Hz, 250 Hz, 500 Hz, 1 kHz, 2 kHz, 4 kHz, 8 kHz, and 16 kHz. A 31-band uses third-octave spacing for finer control. The \u2018graphic\u2019 name comes from the slider positions visually representing the EQ curve." },
  { trigger: "slider that boosts or cuts", content: "Each slider typically offers \u00b112 dB of boost or cut. The physical position of the slider shows the gain at that frequency \u2014 pushed up means boost, pulled down means cut, centred means flat (no change). This visual feedback makes graphic EQs intuitive for quick adjustments, especially in live sound." },
  { trigger: "visual \"graph\" of your EQ curve", content: "When you look at a graphic EQ from left to right, the slider positions trace out the shape of the frequency response curve. This makes it immediately obvious what the EQ is doing \u2014 sliders up on the right means treble boost, sliders down in the middle means a mid scoop. This visual clarity is why it\u2019s called \u2018graphic\u2019." },

  // --- Frequency Bands & Spacing ---
  { trigger: "octave intervals", content: "An octave is a doubling of frequency. Starting from 125 Hz: one octave up is 250 Hz, then 500 Hz, 1 kHz, 2 kHz, 4 kHz, 8 kHz, and 16 kHz. This logarithmic spacing matches how we perceive pitch \u2014 each octave sounds like the same \u2018distance\u2019 even though the frequency gap gets larger." },
  { trigger: "third-octave intervals", content: "Third-octave spacing divides each octave into three bands, giving roughly 31 bands across the audible range. The bands are spaced by a factor of approximately 1.26 (the cube root of 2). This gives much finer control than octave spacing \u2014 for example, between 1 kHz and 2 kHz you get bands at 1 kHz, 1.25 kHz, and 1.6 kHz instead of just one." },
  { trigger: "more bands means finer control", content: "With 31 bands you can target a much narrower frequency range than with 10 bands. However, more bands doesn\u2019t mean better sound quality \u2014 it means more precise control. For broad tonal shaping, 10 bands is often sufficient. For feedback suppression or room correction, 31 bands gives the precision needed." },

  // --- Parametric EQ ---
  { trigger: "parametric EQ gives you full control", content: "Unlike a graphic EQ where the frequencies are fixed, a parametric EQ lets you sweep each band to any frequency you choose. Combined with adjustable gain and Q (bandwidth), this means you can target exactly the frequency causing a problem and adjust it with surgical precision. This is why parametric EQ is the standard in recording and mixing." },
  { trigger: "choose any frequency", content: "The frequency control (sometimes called \u2018sweep\u2019) lets you dial in any frequency within the band\u2019s range. In practice, you often sweep through the range while listening \u2014 boosting temporarily to find a problem frequency, then cutting it once located. This \u2018boost and sweep\u2019 technique is a fundamental EQ skill." },
  { trigger: "gain (boost/cut)", content: "The gain control determines how much louder (boost) or quieter (cut) the chosen frequency becomes, measured in decibels (dB). Most parametric EQs offer \u00b112 to \u00b118 dB range. In mixing, subtle adjustments of 1\u20133 dB are common. Large boosts above 6 dB usually indicate a problem better solved at the source." },
  { trigger: "Q (bandwidth)", content: "Q (Quality factor) controls how wide or narrow the EQ band is. A low Q value (0.5\u20131) creates a wide, gentle curve affecting many frequencies. A high Q value (5\u201310+) creates a narrow, precise notch targeting a specific frequency. The Q value is technically the centre frequency divided by the bandwidth \u2014 higher Q = narrower band." },
  { trigger: "fully sweepable", content: "Each band can be set to any frequency within its range, unlike graphic EQ where the frequencies are fixed. \u2018Sweepable\u2019 means you can continuously adjust the centre frequency \u2014 useful for the \u2018boost and sweep\u2019 technique where you temporarily boost a band and sweep through frequencies to find problems by ear." },

  // --- Q Factor ---
  { trigger: "low Q = wide and gentle", content: "A Q of 0.5 to 1.0 affects a broad range of frequencies around the target. This is useful for gentle tonal shaping \u2014 adding overall warmth, brightening a mix, or shaping the general character of a sound. Most musical EQ decisions use relatively low Q values because they sound more natural." },
  { trigger: "high Q = narrow and precise", content: "A Q of 5 to 10+ affects a very narrow range, sometimes called a \u2018notch\u2019. This is used for surgical corrections \u2014 removing a specific resonance, eliminating feedback at a precise frequency, or notching out mains hum at 50/60 Hz. High Q cuts are precise; high Q boosts can sound unnatural and resonant." },
  { trigger: "key parameter that graphic EQ lacks", content: "On a graphic EQ, the Q of each band is fixed by the manufacturer (typically 1 octave wide). You cannot make a band narrower or wider. This means if a problem frequency sits between two bands, you have to adjust both \u2014 affecting wanted frequencies in the process. Parametric EQ\u2019s adjustable Q solves this entirely." },

  // --- Signal Routing ---
  { trigger: "parallel routing", content: "In parallel routing, the input signal is split and sent to all EQ bands simultaneously. Each band processes its own copy of the signal, and the results are summed together. This approach introduces less phase interaction between bands and is the standard architecture for graphic EQs." },
  { trigger: "series routing", content: "In series routing, the signal passes through each EQ band one after another \u2014 the output of band 1 feeds band 2, which feeds band 3, and so on. Each band processes the already-modified signal. This is the standard architecture for parametric EQs. The downside is that each band adds phase shift, which accumulates." },
  { trigger: "linear-phase EQs", content: "A linear-phase EQ applies the same amount of time delay to all frequencies, avoiding the phase smearing that conventional (minimum-phase) EQs introduce. This preserves transient sharpness and stereo imaging. The trade-off is higher latency and pre-ringing artefacts. Linear-phase EQ is mainly used in mastering where phase accuracy matters most." },
  { trigger: "cumulative phase shift", content: "Every conventional EQ band introduces a small amount of phase shift around its centre frequency \u2014 frequencies near the cut/boost point arrive slightly earlier or later relative to others. With multiple bands in series, these phase shifts accumulate and can smear transients (making them less sharp) or subtly alter the stereo image." },

  // --- When to Use Each ---
  { trigger: "graphic EQ excels at quick, broad tonal adjustments", content: "In live sound, a graphic EQ on the main outputs lets the engineer quickly shape the room response \u2014 pull down frequencies that are feeding back or booming. DJs use graphic EQ for instant tonal control. The physical sliders give immediate tactile and visual feedback that parametric knobs can\u2019t match in a fast-paced environment." },
  { trigger: "parametric EQ is the tool for precise, surgical work", content: "In a recording studio or DAW, parametric EQ is the standard because you need to target exact frequencies on individual tracks. Removing a vocal resonance at 3.2 kHz, notching out guitar amp buzz at 180 Hz, or adding air to a cymbal at 12 kHz \u2014 all require the frequency, gain, and Q control that only parametric provides." },
  { trigger: "most DAWs default to parametric", content: "Every major DAW (Ableton Live, Logic Pro, Pro Tools, FL Studio) includes a parametric EQ as its primary EQ plugin. Ableton\u2019s EQ Eight, Logic\u2019s Channel EQ, and Pro Tools\u2019 built-in EQ III are all parametric. The visual frequency display shows the combined EQ curve in real time, making it easy to see and adjust." },

  // --- EQ course (Task 3, learn-rollout-wave1): Chapter 1 spectrum, new rows ---
  { trigger: "a logarithmic axis", content: "On a logarithmic axis, equal spacing represents equal ratios rather than equal differences \u2014 the gap from 100 Hz to 200 Hz (an octave) takes up the same width as the gap from 5 kHz to 10 kHz (also an octave). A linear axis would instead give equal Hz differences equal width, squashing almost the entire musical range below 1 kHz into a sliver at the left-hand edge." },
  { trigger: "the range most equipment reproduces", content: "Most microphones, speakers and headphones are designed and specified around the 20 Hz\u201320 kHz range because that's where the payoff is \u2014 extending response further costs money and design complexity for content most listeners can't hear anyway. The exam credits this as a separate reason from the hearing-range point: one is about ears, the other about hardware design choices." },
  { trigger: "sub-bass sits below that", content: "Sub-bass is felt in the chest and through the floor as much as it's heard as pitch \u2014 the lowest fundamentals of kick drums and sub-bass synth patches live here. Because it's hard to judge accurately on small speakers, mixing engineers often check this region on headphones, a subwoofer, or a spectrum analyser rather than trusting their ears alone." },
  { trigger: "Low-mids (200\u2013500 Hz)", content: "The low-mid range is where \u2018boxiness\u2019, \u2018mud\u2019 and \u2018congestion\u2019 live \u2014 too much energy here makes a mix sound thick and undefined even when the bass and treble both sound fine in isolation, because this is where the bodies of most instruments (guitars, pianos, vocals) overlap and stack up." },
  { trigger: "Presence (2\u20135 kHz)", content: "The presence range is where consonants, pick attack and vocal intelligibility live \u2014 boosting it makes a source feel closer and more forward in a mix, which is why it's a common target for creative EQ. Overdo it and the same boost reads as harsh or fatiguing rather than present." },
  { trigger: "Corrective EQ removes problems", content: "Corrective EQ is diagnostic: you're identifying something specific that's wrong (a resonance, rumble, hum) and removing just that, using the minimum cut that solves the problem. The test for whether a move is corrective is whether you could point to the exact issue it's fixing." },
  { trigger: "Creative EQ shapes character on purpose", content: "Creative EQ isn't fixing anything broken \u2014 it's an aesthetic choice, the same way choosing a different microphone or amp would be. A high-shelf boost for \u2018air\u2019, or a resonant filter sweep automated across a breakdown, are creative moves: nothing was wrong beforehand, the engineer just wanted a different character." },

  // --- EQ course: Chapter 2 filters, new rows ---
  { trigger: "already fallen by 3 dB", content: "3 dB down is defined as the half-power point \u2014 the signal carries half its original power at that frequency. This is why the cut-off isn't where a filter \u2018begins\u2019: at the stated cut-off frequency, the filter has already measurably reduced the signal, and the roll-off continues beyond it according to the slope." },
  { trigger: "Each filter pole contributes 6 dB per octave", content: "A \u2018pole\u2019 is a stage of filtering inside the circuit or plugin \u2014 each one adds another 6 dB/octave of roll-off. Stacking poles is how steeper slopes are built: two poles give 12 dB/octave, four poles give 24 dB/octave, and so on. More poles also means a slightly more complex phase response." },
  { trigger: "48 dB per octave is close to a brick wall", content: "A \u2018brick wall\u2019 filter is the theoretical ideal: everything on the passing side of the cut-off passes completely untouched, and everything on the other side is removed entirely, with an infinitely steep drop. Real filters can only approximate this \u2014 48 dB/octave gets close enough that the term is used descriptively, common in mastering and anti-aliasing applications." },
  { trigger: "corner frequency", content: "A shelf's \u2018corner\u2019 is the point where its boost or cut has reached roughly half its final value, not the -3 dB point used to define a cut-off filter \u2014 the two ideas look similar on a graph but are measured differently. Past the corner, a shelf holds flat at its set gain rather than continuing to roll off." },
  { trigger: "mains hum at 50 Hz", content: "Mains electricity in the UK runs at 50 Hz (60 Hz in the US), and poor grounding or interference can leak this frequency \u2014 plus its harmonics at 100 Hz, 150 Hz and so on \u2014 into a recording as a persistent hum. Because the fundamental and each harmonic are narrow and predictable, a stack of narrow notches removes them without touching anything else." },
  { trigger: "telephone effect", content: "The \u2018telephone\u2019 or \u2018radio\u2019 effect narrows a sound down to a band-pass window roughly 300 Hz\u20133 kHz, mimicking the limited frequency range of old telephone lines. It's a common creative move for a breakdown, a flashback moment, or a lo-fi transition \u2014 a deliberate, dramatic narrowing rather than a subtle tonal adjustment." },

  // --- EQ course: Chapter 4 eq-at-work, new rows ---
  { trigger: "sweep a narrow, high-Q boost", content: "Boosting first, rather than cutting straight away, is the key move: a high-Q boost exaggerates whatever's already there, so a problem frequency becomes obviously louder and easier to identify by ear as you sweep past it. Once located, flipping that same narrow band into a cut removes precisely what you just heard ringing." },
  { trigger: "not in solo", content: "Listening in solo isolates a track from everything else, which is useful for finding problems but misleading for making final decisions \u2014 a frequency that sounds essential alone might be completely masked, or unnecessary, once the rest of the mix is playing. EQ decisions should always be checked back in the full mix context." },
  { trigger: "Matching tasks", content: "A matching task gives you a reference section and asks you to make another section sound the same, using EQ. The graded failure modes are consistent: reaching for the fader instead of the EQ (that's a volume fix, not a tone fix), and touching audio outside the bars the task actually specifies." },
];

const COMPRESSION_EXPANSIONS = [
  // --- What Compression Solves ---
  { trigger: "dynamic range", content: "Dynamic range is the difference in decibels between the quietest and loudest parts of a signal. A whisper might be at -40 dBFS and a shout at -6 dBFS \u2014 that\u2019s 34 dB of dynamic range. In recorded music, too much dynamic range means quiet parts disappear and loud parts clip. Compression narrows this gap to a more manageable range." },
  { trigger: "if a vocal is too dynamic", content: "Vocals are one of the most dynamic sources in music \u2014 the level can change dramatically between consonants and vowels, between verses and choruses, or between speaking and singing. Without compression, a mix engineer would need to ride the vocal fader constantly. Compression automates this, keeping the vocal consistently audible without manual adjustment." },
  { trigger: "more consistent and controlled", content: "After compression, the difference between the quietest and loudest parts is smaller. This means the signal sits more steadily in a mix, maintaining its position relative to other instruments. The listener doesn\u2019t need to adjust their volume, and the vocal (or any compressed source) remains present and intelligible throughout." },

  // --- Threshold & Ratio ---
  { trigger: "threshold sets the level where compression begins", content: "The threshold is set in dBFS (decibels relative to full scale). Any signal below this level passes through completely unchanged \u2014 the compressor is transparent. The moment the signal rises above the threshold, the compressor engages and starts reducing gain according to the ratio. Setting the threshold lower means more of the signal gets compressed." },
  { trigger: "ratio determines how much compression", content: "The ratio describes the relationship between input level above threshold and output level above threshold. At 2:1, a signal 10 dB above threshold comes out 5 dB above. At 4:1, it comes out 2.5 dB above. At 10:1, it comes out 1 dB above. A ratio of \u221e:1 (infinity to one) is a limiter \u2014 nothing above threshold gets through." },
  { trigger: "4:1 ratio", content: "A 4:1 ratio is a moderate compression setting commonly used on vocals. It means for every 4 dB the signal exceeds the threshold, only 1 dB passes through \u2014 so 3 dB are removed. If a vocal peaks 12 dB above threshold at 4:1, only 3 dB comes out above threshold, meaning 9 dB of gain reduction." },
  { trigger: "higher ratios mean more aggressive compression", content: "Low ratios (1.5:1 to 3:1) are gentle \u2014 used for transparent dynamic control. Medium ratios (4:1 to 8:1) are noticeable \u2014 used for vocals, drums, bass. High ratios (10:1 to 20:1) are aggressive \u2014 used for heavy compression effects or parallel compression. Infinity:1 is limiting \u2014 used for brick-wall peak control." },

  // --- Attack & Release ---
  { trigger: "attack controls how quickly the compressor responds", content: "Attack time is measured in milliseconds (ms). A fast attack (0.1\u20131 ms) clamps down on the signal almost instantly \u2014 catching every transient. A slow attack (10\u201330+ ms) lets the initial transient pass through before compression engages. The choice depends on whether you want to control or preserve the transient punch." },
  { trigger: "fast attack clamps down immediately", content: "A fast attack catches the very beginning of a sound \u2014 the transient. This is useful for taming harsh peaks (like an aggressive snare hit) or controlling sibilance on vocals. However, fast attack on drums can make them sound flat and lifeless because the initial \u2018snap\u2019 that gives drums their punch is compressed away." },
  { trigger: "slow attack lets the initial transient through", content: "By setting a slower attack (10\u201330 ms), the compressor doesn\u2019t engage until after the transient has already passed. The result: the punch and snap of the sound is preserved, but the sustained body that follows is compressed. This is the standard approach for drum bus compression and bass guitar." },
  { trigger: "release controls how quickly compression stops", content: "Release time determines how long the compressor takes to return to unity gain (no compression) after the signal drops below the threshold. A fast release (50\u2013100 ms) recovers quickly, which can cause \u2018pumping\u2019 if too aggressive. A slow release (200\u2013500 ms) provides smoother, more transparent recovery. Auto-release adjusts dynamically based on the signal." },

  // --- Knee ---
  { trigger: "hard knee applies the full ratio instantly", content: "With hard knee, the compressor is either off (below threshold) or fully on (above threshold) with no transition zone. The moment the signal crosses the threshold, the full ratio kicks in. This gives precise, predictable control but can sound abrupt, especially on dynamic material like vocals or acoustic instruments." },
  { trigger: "soft knee gradually increases the ratio", content: "Soft knee creates a gradual transition zone around the threshold where the ratio increases progressively from 1:1 (no compression) to the set ratio. This means compression starts gently below the threshold and reaches full ratio above it. The result is a smoother, more musical onset of compression that\u2019s harder to hear." },

  // --- Make-Up Gain ---
  { trigger: "make-up gain boosts the entire signal", content: "After the compressor has reduced the peaks, the overall signal level is lower than the original. Make-up gain (sometimes called output gain) adds a fixed amount of gain to the compressed signal. This raises everything \u2014 the tamed peaks and the quiet parts alike. The net effect: peaks are controlled AND the quiet parts are now louder." },
  { trigger: "makes things sound \"louder\"", content: "Our ears perceive loudness based on average level, not peak level. By reducing peaks and then boosting with make-up gain, the average level increases while peak level stays similar. This is the fundamental principle behind the loudness war \u2014 more compression + more make-up gain = higher average level = perceived as \u2018louder\u2019 even though the peaks haven\u2019t changed." },

  // --- Before & After ---
  { trigger: "wide dynamic range goes through the compressor", content: "The uncompressed signal might have 20\u201330 dB of dynamic range \u2014 dramatic volume differences that are hard to control in a mix. After compression with appropriate threshold, ratio, attack, and release settings, that range might be reduced to 6\u201310 dB. The signal is now more predictable and easier to balance against other mix elements." },
  { trigger: "sits better in a mix", content: "An uncompressed vocal might disappear in quiet phrases and overpower everything in loud ones. After compression, the vocal maintains a more consistent level relative to the backing track. This \u2018sitting in the mix\u2019 means the listener hears every word without any one phrase being too loud or too quiet." },
];

// Combine all expansions into a single searchable list
export const ALL_EXPANSIONS = [...SYNTHESIS_EXPANSIONS, ...EQ_EXPANSIONS, ...COMPRESSION_EXPANSIONS];

/**
 * Find a pre-generated expansion matching the selected text.
 * Returns the content string or null.
 */
export function findExpansion(selectedText) {
  const lower = selectedText.toLowerCase();
  let bestMatch = null;
  for (const exp of ALL_EXPANSIONS) {
    if (lower.includes(exp.trigger.toLowerCase())) {
      if (!bestMatch || exp.trigger.length > bestMatch.trigger.length) {
        bestMatch = exp;
      }
    }
  }
  return bestMatch?.content ?? null;
}

/**
 * Given words array, return a Set of indices that are part of expandable trigger phrases.
 */
export function getExpandableWordIndices(words) {
  const indices = new Set();
  const fullText = words.join(' ').toLowerCase();
  for (const exp of ALL_EXPANSIONS) {
    const trigger = exp.trigger.toLowerCase();
    let searchFrom = 0;
    while (true) {
      const pos = fullText.indexOf(trigger, searchFrom);
      if (pos === -1) break;
      let charCount = 0;
      for (let i = 0; i < words.length; i++) {
        const wordStart = charCount;
        const wordEnd = charCount + words[i].length;
        if (wordEnd > pos && wordStart < pos + trigger.length) {
          indices.add(i);
        }
        charCount = wordEnd + 1;
      }
      searchFrom = pos + 1;
    }
  }
  return indices;
}
