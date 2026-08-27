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
