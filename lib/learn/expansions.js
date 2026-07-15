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
  { trigger: "oscillator generates the raw waveform", content: "The oscillator is the sound source \u2014 it generates a repeating waveform at a specific pitch. In analogue synths, this is a voltage-controlled oscillator (VCO) where pitch is set by voltage. In digital synths, waveforms are calculated mathematically. Most subtractive synths offer at least two oscillators that can be mixed, detuned, or set to different intervals." },

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

  // --- Signal Flow ---
  { trigger: "oscillator generates the waveform, filter shapes the tone, amplifier controls the volume", content: "This three-stage chain \u2014 oscillator, filter, amplifier \u2014 is the fundamental architecture of every subtractive synthesiser. The signal flows in one direction: generation, then tonal shaping, then volume shaping. Each stage has its own modulation sources (envelopes, LFOs) that add movement and expression." },
  { trigger: "modulated by its own envelope or LFO", content: "Modulation means automatically changing a parameter over time. An envelope changes it once per note (triggered by key press). An LFO (Low Frequency Oscillator) changes it continuously in a repeating cycle \u2014 for example, routing an LFO to pitch creates vibrato, routing it to the filter creates a rhythmic wah effect, and routing it to amplitude creates tremolo." },
  { trigger: "LFO", content: "A Low Frequency Oscillator generates a waveform too slow to hear (typically 0.1Hz to 20Hz) used purely for modulation. It cycles continuously regardless of key presses. Common LFO shapes include sine (smooth wobble), square (on/off switching), and sample-and-hold (random stepped values). LFO rate and depth are the key controls." },
  { trigger: "Minimoog", content: "The Minimoog Model D (1970) was one of the first portable, integrated synthesisers and defined the subtractive synthesis architecture still used today. Its three oscillators, 24dB/octave ladder filter, and straightforward signal flow made it accessible to performers. Its warm, fat sound remains a benchmark for analogue synthesis." },
  { trigger: "signal path", content: "The signal path describes the order in which audio passes through each processing stage. In subtractive synthesis: oscillator \u2192 filter \u2192 amplifier \u2192 output. Changing this order would produce completely different results \u2014 for example, placing the amplifier before the filter would mean the envelope shapes volume before tonal shaping occurs." },
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
