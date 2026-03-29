// Pre-generated expansions for key terms in the Subtractive Synthesis topic.
// Instant, no API call, no cost. Matched by longest substring.

export const SYNTHESIS_EXPANSIONS = [
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

/**
 * Find a pre-generated expansion matching the selected text.
 * Returns the content string or null.
 */
export function findExpansion(selectedText) {
  const lower = selectedText.toLowerCase();
  let bestMatch = null;
  for (const exp of SYNTHESIS_EXPANSIONS) {
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
  for (const exp of SYNTHESIS_EXPANSIONS) {
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
