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
