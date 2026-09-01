# Audio credits — `public/bench-audio/`

Every sound a bench plays is listed here with where it came from. The Bench Standard (§3 law 5) allows real recordings and AI-generated audio only; no synthesised loops. Files are mp3, mono or stereo as generated, normalised to about -3 dBFS.

## delay/

| File | What | Origin | First used |
|---|---|---|---|
| `808-kick.mp3`, `808-snare.mp3`, `808-hat.mp3`, `808-openhat.mp3` | Electronic drum one-shots | Generated with ElevenLabs sound generation for the Beat Machine (workshops `/beat-machine/`), July 2026; QC'd by the real-audio pipeline (peak, onset, spectral centroid), trimmed to 3 ms pre-onset | Beat Machine; Delay bench |
| `funk-kick.mp3`, `funk-snare.mp3`, `funk-hat.mp3`, `funk-openhat.mp3` | Acoustic-kit drum one-shots | Same pipeline and date as above | Beat Machine; Delay bench |
| `vocal-phrase.mp3` | 7.4 s a-cappella vocal phrase, dry | Generated with ElevenLabs music (a-cappella prompt) for the Pitch Repair Shop, July 2026; this is the untuned `vocal-raw` take | Pitch Repair; Delay bench |
| `stab-brass.mp3`, `stab-guitar.mp3`, `stab-vox.mp3` | One-second one-shots, dry | Generated with ElevenLabs sound generation for Inside the Echo, August 2026; envelope-verified dry | Inside the Echo; Delay bench |

All of it was generated on Mike's own ElevenLabs account; nothing here is a third-party recording with a licence to track. Commercial use rights follow that account's plan terms, which Mike holds. If a file is replaced, update this table in the same commit.

## eq/ (no folder: the EQ bench reads `delay/`)

The EQ bench (2026-08-27) plays the same four sources as the Delay bench, straight from `delay/` above: the funk kit, the 808 kit, the vocal phrase and the brass and guitar stabs. Nothing new was generated for it.

## dynamics/ (no folder: the Dynamics bench reads `delay/`)

The Dynamics bench (2026-08-28) plays the same four sources as the Delay and EQ benches, straight from `delay/` above. Nothing new was generated for it.

## edit/ (no folder: the Edit bench reads `delay/`)

The Edit bench (2026-08-28) cuts two of the files above: `vocal-phrase.mp3` (the splice) and `funk-openhat.mp3` (the trim, for its ringing tail). Both are stand-ins until Mike records a sung phrase and a cymbal for it; when they arrive they go in an `edit/` folder and this table names them.

## balance/

| File | What | Origin | First used |
|---|---|---|---|
| `kites-vocal.mp3`, `kites-bvox.mp3`, `kites-drums.mp3`, `kites-bass.mp3`, `kites-synth.mp3` | Five time-aligned stems, bars 22 to 25 (9.6 s at 100 bpm) of "Paper Kites", indie pop with a female vocal | Generated with Suno on Mike's account for the C3 Aural Trainer, July 2026 (`_sandbox/c3-aural-trainer/SUNO-BRIEF.md`); stems exported from Suno (Lead Vocals, Backing Vocals, Drums, Bass, Synth + Keyboard summed), cut on the drums' beat grid and sealed with 4 ms edge fades on 29 Aug 2026 (scratchpad `balance/cut.py`); one pack-wide gain, so the stems at unity are the track as released | Balance Desk |

Suno's paid plans grant the subscriber commercial-use rights to their generations, which is what the paid site needs. The Balance Desk's "supplied" trims are applied in the bench, not in the files: the files are the release. Mike's next Suno track lands here as a second song.

## lane/

| File | What | Origin | First used |
|---|---|---|---|
| `groove-drums.mp3`, `groove-bass.mp3`, `groove-guitar.mp3`, `groove-keys.mp3` | Four time-aligned stems, bars 18 to 21 (9.32 s at 103 bpm) of "Dry Groove", an instrumental funk groove | Generated with Suno on Mike's account for the C3 Aural Trainer, July 2026 (`_sandbox/c3-aural-trainer/SUNO-BRIEF.md`); stems exported from Suno (Drums + Percussion summed, Bass, Guitar, Keyboard), cut on the drums' beat grid and sealed with 4 ms edge fades on 29 Aug 2026 (scratchpad `auto/cut.py`); one pack-wide clip guard, no other processing | Automation Lane |

The second Suno song on the estate, untouched until the Automation Lane needed a loop whose parts all play in every bar. The bench applies its own fixed balance in the graph (`SONG.mixTrim`: the guitar and keys sit 15 dB under the rhythm section in the release, and a lane on a part you cannot hear teaches nothing); the files are the raw stems. The vocal stems of the same generation (a single phrase and a backing-vocal tail) are not used.

## midi/

| File | What | Origin | First used |
|---|---|---|---|
| `acoustic-kick.mp3`, `acoustic-snare.mp3`, `acoustic-chat.mp3`, `acoustic-ohat.mp3`, `acoustic-ride.mp3`, `acoustic-crash.mp3`, `acoustic-htom.mp3`, `acoustic-ltom.mp3` | Acoustic rock-kit one-shots: the eight sounds the papers' drum-map task names (kick, snare, closed and open hi-hat, ride, crash, two toms) | Generated with ElevenLabs sound generation on Mike's account, 30 Aug 2026, two takes a sound (scratchpad `midi/gen.mjs`); QC'd by numbers (peak, first-hit length, ring to −54 dB, spectral centroid against a band per sound) and cut to the first hit, 3 ms before the onset, sealed with 1 ms and 15 ms edge fades, normalised to −3 dBFS (`midi/qc2.py`); the kick took a third batch of prompts before a take passed | Piano Roll |
| `electronic-kick.mp3`, `electronic-snare.mp3`, `electronic-chat.mp3`, `electronic-ohat.mp3`, `electronic-ride.mp3`, `electronic-crash.mp3`, `electronic-htom.mp3`, `electronic-ltom.mp3` | 1980s drum-machine one-shots, the same eight sounds | Same pipeline and date; the low tom took a second batch | Piano Roll |

A new bench brings its own audio (Mike, 28 Aug 2026), so nothing from `delay/` is reused here. The bass part is not a file: it is the papers' own square-wave synth (2020, 2023 and 2026 Q2: "use a square wave", "match the pitch bend range", "copy the velocity sensitive filtering"), built from an oscillator in the bench with `synthesis` declared, the one place the Bench Standard admits one.

## scope/

| File | What | Origin | First used |
|---|---|---|---|
| `cello.mp3`, `bass.mp3`, `voice.mp3` | Three sustained notes, sealed into seamless loops: a bowed cello (173.8 Hz, F3), a plucked electric bass (103.8 Hz, G#2), a sung vowel (260 Hz, C4) | Generated with ElevenLabs sound generation on Mike's account, 30 Aug 2026 (scratchpad `scope/gen.mjs`); pitch measured per 100 ms frame and the take with the steadiest pitch kept (`scope/qc.py`); cut at rising zero crossings to the steady window, the tail crossfaded into the head over 60 ms (equal power), normalised to −3 dBFS (`scope/loop.py`) | Oscilloscope |

The four waveforms (sine, square, saw, triangle) are oscillators, the paper's own object for this topic ("identify the waveform", "draw a saw wave one octave lower"), built in the bench with `synthesis` declared. Nothing from the other folders is reused.

## laser/ (workshops `/laser/`: the bench's own `audio/master.wav`, not `public/bench-audio/`)

| File | What | Origin | First used |
|---|---|---|---|
| `_sandbox/laser-explorer/audio/master.wav` | 8 bars (15.70 s at 122.28 bpm), bars 16 to 23 of "Glass Arcade", 1980s-style synth-pop with bright hi-hats; 44.1 kHz 16-bit stereo PCM, the CD format itself | Generated with Suno on Mike's account, 1 Sep 2026, from `_sandbox/laser-explorer/SUNO-BRIEF.md`, after Mike heard the previous synthesised loop on the live bench and called it bad; the 48 kHz release cut on its own measured tempo and downbeat, the tail crossfaded 20 ms into the pre-roll so the loop wraps into the downbeat, requantised to 16 bits with TPDF dither (`tools/cut-master.py`, every number in its docstring); shipped at the release's level, the bench normalises to 0.9 peak on load | Inside the Laser |

The third Suno song on the estate, and the first shipped as WAV rather than mp3: a bench about what digital formats throw away cannot start from a lossy file. The full release stays in `audio/source/` (gitignored, 17 MB) and in Mike's Suno library.
