// MIDI & Sequencing Course — single-chapter version (Task 4, learn-rollout-wave3).
// Mapped to Pearson Edexcel Component 4 specification 1.5 Sequencing.
// Sourced exclusively from: lib/topics.js's `midi` topic specSummary block
// (real-time vs step input, quantise/swing/snap vocabulary, editing
// vocabulary, MIDI data-byte vocabulary — the exam-vocabulary skeleton every
// row is anchored to — read-only, not modified or staged here),
// components/resources/MIDIBinaryAssessment.jsx (velocity is 7-bit/128
// values/0-127, pitch bend is 14-bit/8192 centre/2 bytes, the MIDI-message
// vs MIDI-parameter distinction, the channel-voice-vs-meta-event split in
// its Q9 explanation) and components/resources/MIDIPitchBendController.jsx
// (the status-byte-plus-two-data-bytes structure worked through for pitch
// bend specifically, the 7-bit/128-value vs 14-bit/16,384-value comparison,
// the CC1/CC7/CC10/CC11/CC74 controller cards, and "velocity is NOT a CC").
// Row anatomy copies lib/learn/topics/distortion.js exactly (the freshest
// single-chapter exemplar): heading, description (<=~70 words), animation,
// assessment, no audio/interactive (the brief places none for this topic).
//
// Row 1 note: MIDIPitchBendController.jsx only works through the
// status-byte-plus-two-data-bytes structure for its own worked example
// (pitch bend: status E0h, then LSB and MSB). Neither named source states
// the Note On/Note Off status-and-two-data-byte breakdown by name or gives
// its status-byte hex value. This row generalises the source's own
// architecture (one status byte identifying what happened and the channel,
// followed by data bytes carrying the details) from its pitch-bend worked
// example to Note On, using Note On's data-byte contents (note number,
// velocity) that ARE named in both sources (specSummary's "note on/off,
// pitch" and MIDIBinaryAssessment's velocity questions) — but without
// inventing a specific Note On status-byte hex value, since neither source
// gives one. Flagged in the task report. "Why a MIDI file is tiny and
// editable" is not stated verbatim in either source; it follows directly
// from the instructions-not-audio distinction both sources make (MIDI
// messages vs recorded sound), but the tiny-file/editable framing itself is
// this row's own extension. Flagged in the task report.
//
// Row 2 note: the specSummary bullet gives the two input methods by name
// ("Real-time input via MIDI keyboard and non-real-time input via step grid
// / pencil") but neither named source explains *when* each wins. The "when
// each wins" reasoning (real-time for playable/expressive parts, step input
// for parts too fast/complex/precise to perform live) is a reasonable,
// standard extension of that vocabulary, not sourced verbatim. Flagged in
// the task report.
//
// Row 3 note: sourced directly from the specSummary's own wording ("Quantise
// — hard values, swing/percentage, snap/grid" and "Editing — velocity, note
// length, piano roll and list editor, looping, duplicating"). The specific
// mechanics of *how* a percentage-strength or swing setting moves a note
// (partway to the grid; only the off-beat subdivisions) are not spelled out
// in either named source and are a standard-practice extension. Flagged in
// the task report.
//
// Row 4 note: sourced closely from MIDIPitchBendController.jsx (LSB/MSB,
// 14-bit, 128 vs 16,384, the CC cards) and MIDIBinaryAssessment.jsx (pitch
// bend centre 8192, 2 bytes). "Tempo as data" is named in the specSummary
// ("...pitch bend, LSB/MSB, tempo") but neither named source explains tempo
// storage beyond naming it as an example of a MIDI meta-event (from
// MIDIBinaryAssessment's Q9 explanation, which distinguishes channel-voice
// messages sent live from meta-events like tempo stored in the file) — kept
// to that one-clause treatment in the row text for that reason.
//
// Expansion note: the LSB/MSB arithmetic expansion (row 4) restates
// MIDIPitchBendController.jsx's own get14BitBytes() logic (lsb = value &
// 0x7F, msb = (value >> 7) & 0x7F) as division/remainder arithmetic instead
// of bitwise operators, for numeracy accessibility — verified equivalent
// arithmetically (worked for the centre value 8192 in the expansion text:
// 64 x 128 + 0 = 8192) but is a paraphrase, not a verbatim quote of the
// source's code. Flagged in the task report.

export const MIDI_CHAPTERS = [
    {
        id: 'notes-as-data',
        chapterNumber: 1,
        title: 'Notes as Data',
        subtitle: 'Topic 1.5 — Component 4',
        description: 'How a MIDI message carries instructions rather than sound — note on/off, pitch, velocity and channel — how real-time and step input get notes onto a track, how quantise and piano-roll editing turn a rough take into a clean one, and how controllers like pitch bend and the mod wheel go beyond the note itself.',
        estimatedTime: '15–20 minutes',
        outroResourceId: 'midi-pitch-bend-controller',
        examAnchor: {
            question: 'A three-byte MIDI Note On message is transmitted: a status byte, then two data bytes. Explain what each byte tells the receiving instrument, and state the numeric range each data byte can hold.',
            modelPoints: [
                'The status byte says what happened and on which channel — for a Note On message, that a key went down, on one of the 16 MIDI channels.',
                'The first data byte is the note number — which pitch was played.',
                'The second data byte is velocity — how hard the key was hit.',
                'Each data byte is 7-bit, so its value can only run from 0 to 127 (2^7 = 128 possible values) — naming which byte is which, and giving this range, is what separates full credit from a vague "MIDI sends note information" answer.',
            ],
            examTip: 'Status says what happened, data bytes say which note and how hard.',
        },
        rows: [
            {
                id: 'what-midi-carries',
                heading: 'Instructions, Not Audio',
                description: "A MIDI message is an instruction, not a recording: Note On (or Note Off) says a key moved, then two data bytes say which note (pitch) and how hard (velocity, 0–127) — plus a channel number for which of 16 instruments. Because nothing here is actual sound, a three-minute MIDI file can be a few kilobytes rather than megabytes, and every note stays editable long after it was played.",
                animation: 'midi-message-anatomy',
                assessment: {
                    id: 'what-midi-carries',
                    question: 'Why can a three-minute MIDI file be only a few kilobytes, while a three-minute audio recording of the same performance might be tens of megabytes?',
                    options: [
                        { text: 'A MIDI file stores instructions — note numbers, velocities, channels and timing — not recorded sound, so there is far less data to store, and every note stays editable afterwards', correct: true, feedback: "Correct — a MIDI file never contains sound itself, only the small set of numbers needed to describe each event, which is why it is tiny and every value can still be changed after the fact." },
                        { text: 'MIDI files use a much higher compression ratio than audio formats, throwing away inaudible frequencies the same way an MP3 does', correct: false, feedback: 'MIDI is not a compressed audio format — it never contains sound at all, so there is nothing to compress in the way an MP3 compresses a waveform.' },
                        { text: 'MIDI only stores the first note played and repeats it electronically for the rest of the file', correct: false, feedback: "MIDI stores an instruction for every note played, not just the first — that full note-by-note record is exactly what keeps the file editable." },
                    ],
                },
            },
            {
                id: 'two-ways-in',
                heading: 'Two Ways In',
                description: 'Notes can enter a sequencer two ways. Real-time input means playing a MIDI keyboard live, capturing every natural timing nuance and feel — ideal for parts you can actually play. Non-real-time input means drawing notes into a step grid or with a pencil tool one at a time — slower, but the only practical way to build parts too fast, too complex, or too precise to perform live.',
                animation: 'realtime-vs-step-input',
                assessment: {
                    id: 'two-ways-in',
                    question: 'A producer needs a mechanically exact, very fast hi-hat pattern that no drummer could physically play by hand. Which input method fits, and why?',
                    options: [
                        { text: 'Step input (the grid or pencil tool) — because it places each note directly at an exact position, it can create rhythms too fast or too precise for a live performance to capture', correct: true, feedback: 'Correct — step input builds a part one note at a time regardless of how fast or precise it is, which is exactly why it suits patterns no live performance could capture.' },
                        { text: 'Real-time input, because playing it live on a keyboard always captures a more natural feel', correct: false, feedback: 'A part this fast and exact is beyond what live playing can capture — real-time input is the right choice when you want a human feel, not when the part is physically unplayable.' },
                        { text: 'Neither — MIDI can only be entered by playing a keyboard in real time', correct: false, feedback: 'Step input (drawing notes into a grid or with a pencil tool) is precisely the non-real-time alternative to playing a keyboard live.' },
                    ],
                },
            },
            {
                id: 'quantise-and-edit',
                heading: 'Quantise & Edit',
                description: 'Quantise snaps recorded notes onto a strict rhythmic grid, fixing sloppy timing instantly — hard quantise moves every note fully onto the nearest grid line, while a swing or percentage strength setting pulls notes only part way there, keeping some human feel. From there, the piano roll edits everything else: velocity, note length, looping a phrase, and duplicating it across a track.',
                animation: 'quantise-grid-snap',
                assessment: {
                    id: 'quantise-and-edit',
                    question: "A student hard-quantises a recorded piano part and complains it now sounds 'robotic and stiff'. What change would keep the notes close to the grid but restore some human feel?",
                    options: [
                        { text: 'Reduce the quantise strength to a percentage rather than 100% (hard quantise), or apply swing — this pulls notes only part way to the grid instead of snapping them fully onto it', correct: true, feedback: 'Correct — a percentage strength or swing setting keeps most of the timing correction while leaving some of the original, human timing offset in place.' },
                        { text: 'Increase the velocity of every note so the part sounds more energetic', correct: false, feedback: 'Velocity controls loudness and dynamics, not timing — it cannot fix a rhythm that sounds stiff from being fully hard-quantised.' },
                        { text: 'Duplicate the part and loop it, so the repetition disguises the stiffness', correct: false, feedback: 'Looping repeats the exact same stiff timing over and over — it does not address the quantise strength that caused the problem.' },
                    ],
                },
            },
            {
                id: 'beyond-the-note',
                heading: 'Beyond the Note',
                description: 'Beyond notes, MIDI carries continuous controller data. Pitch bend uses two data bytes instead of one — an LSB and MSB combining for 14-bit resolution, 128 × 128 = 16,384 possible positions, smooth enough that no step is audible. The mod wheel and other CC (control change) messages stay 7-bit, 128 values each, fine for things like modulation depth. Tempo itself is stored as data too, not played.',
                animation: 'pitch-bend-resolution',
                assessment: {
                    id: 'beyond-the-note',
                    question: 'Why does pitch bend need two data bytes (LSB and MSB) when most MIDI CC messages like the mod wheel only need one?',
                    options: [
                        { text: "Pitch changes are audible enough that a single 7-bit byte's 128 steps would sound stepped or 'zippy'; combining two 7-bit bytes gives 14-bit resolution — 128 × 128 = 16,384 positions — smooth enough that no step is heard", correct: true, feedback: 'Correct — the ear is sensitive to pitch, so pitch bend trades one byte for two to get from 128 steps up to 16,384, removing the audible stepping a single byte would cause.' },
                        { text: 'Pitch bend needs a second byte purely to identify which of the 16 channels it is on', correct: false, feedback: 'Channel identification lives in the status byte for every message type — pitch bend’s second data byte exists for finer resolution, not channel routing.' },
                        { text: "It doesn't really need two bytes — it's a historical accident with no audible benefit", correct: false, feedback: 'The second byte gives a real, audible benefit: 16,384 steps versus 128 is the difference between a smooth bend and one with audible zipper-stepping.' },
                    ],
                },
            },
        ],
    },
];
