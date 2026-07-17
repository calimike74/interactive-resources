// Recording & Production Course — single-chapter version (Task 5, learn-rollout-wave3).
// Mapped to Pearson Edexcel Component 4 specification 1.1 Recording.
// Sourced exclusively from: lib/topics.js's `recording` topic specSummary
// block (read-only, not modified or staged here) — "DAW software and audio
// interface hardware in a recording workflow", "Signal flow from source ->
// mic -> preamp -> converter -> DAW -> monitors", "File formats, bit depth,
// sample rate and their production trade-offs", "Input monitoring, buffer
// size and latency when tracking" — the exam-vocabulary skeleton every row
// is anchored to; components/resources/MixingProduction.jsx (its "Mixdown:
// the final stereo master" / "Headroom and gain staging" Learn-tab sections
// and its quiz's export-format question: 24-bit WAV at the session sample
// rate vs 128 kbps MP3 mono / 16-bit FLAC down-sampled to 22.05 kHz / 8-bit
// raw PCM); components/resources/StereoPanning.jsx and
// lib/resources/stereo-recording-essay.js (checked directly — neither
// contains signal-chain, converter/interface, buffer or latency content;
// StereoPanning.jsx's own material is about stereo MIC TECHNIQUE placement
// and phase, not the general recording chain this chapter teaches, and
// stereo-recording-essay.js is a 25-line resource-config stub with no prose
// content of its own — both checked and found to contribute nothing usable
// to this chapter beyond confirming the outro pairing). Row anatomy copies
// lib/learn/topics/distortion.js / midi.js exactly: heading, description
// (<=~70 words), animation, assessment, no audio/interactive (the brief
// places none for this topic).
//
// SOURCING FLAG — this chapter leans more heavily on the specSummary
// vocabulary skeleton than distortion.js/midi.js did, because the three
// named component/resource sources are thin on this chapter's specific
// content (confirmed by direct read + targeted grep for "buffer", "latency",
// "preamp", "converter", "interface", "monitor" across all three — see
// notes below):
//
// Row 1 (the-chain) note: lib/topics.js's specSummary states the chain
// itself verbatim ("Signal flow from source -> mic -> preamp -> converter ->
// DAW -> monitors") and names "DAW software and audio interface hardware".
// No named source explains what each individual stage DOES to the signal
// (mic = transducer; preamp = level boost; converter = the analogue/digital
// boundary; DAW = records/processes; monitors = playback). That per-stage
// description is standard, uncontested recording-engineering fact, not a
// verbatim quote from any named source. Flagged in the task report.
//
// Row 2 (captured-quality) note: specSummary names "File formats, bit depth,
// sample rate and their production trade-offs" directly. MixingProduction.jsx
// gives real, usable material for the quality/size/editability trade-off —
// its own Learn-tab content ("Bounce as a high-resolution WAV (24-bit, the
// session sample rate)... The mixdown is what gets handed to mastering or
// distributed") and its quiz question ("Which export format and resolution
// is appropriate for handing a final mixdown to a mastering engineer?" —
// correct answer "24-bit WAV at the session sample rate", distractors
// "128 kbps MP3, mono", "16-bit FLAC down-sampled to 22.05 kHz", "8-bit raw
// PCM") — but that source material is about MIXDOWN EXPORT, not the initial
// tracking/capture settings this row teaches. The underlying trade-off
// (uncompressed/high-resolution keeps more data and stays editable;
// compressed/low-resolution formats are smaller but lose data permanently)
// is the same principle either side of the session, so this row and its
// assessment generalise that source material from an export context to a
// capture context. Flagged in the task report.
//
// Row 3 (hearing-yourself) note: specSummary names "Input monitoring, buffer
// size and latency when tracking" as a vocabulary bullet only. NONE of the
// three named sources (confirmed by direct read of MixingProduction.jsx and
// StereoPanning.jsx in full, and stereo-recording-essay.js's 25-line config
// stub) explain buffer size, latency, or direct monitoring — those mechanics
// (small buffer = short round trip = low latency but more frequent CPU
// interrupts; large buffer = the opposite; direct monitoring bypasses the
// buffer by routing the interface's input straight to its own output) are
// standard, uncontested audio-interface operation, not sourced from any
// named source passage beyond the one vocabulary bullet. Flagged prominently
// in the task report — this is the row with the thinnest sourcing in the
// chapter.
//
// Expansion note (captured-quality row): the brief's cross-link instruction
// names a "digital-analogue chapter" that does not exist yet (it lands in a
// later wave-3 task). Per the self-containment law, the expansion below
// names only "the Digital & Analogue lesson" (topic name, no chapter number,
// no route) exactly as instructed, sidestepping any URL dependency on a
// course that has not shipped yet.

export const RECORDING_CHAPTERS = [
    {
        id: 'signal-path',
        chapterNumber: 1,
        title: 'From Source to DAW',
        subtitle: 'Topic 1.1 — Component 4',
        description: 'How a signal travels from source to speakers — the recording chain through mic, preamp and converter into the DAW, the file-format and quality settings you choose while capturing it, and the buffer-size and latency trade-off you manage while tracking and monitoring yourself.',
        estimatedTime: '10–15 minutes',
        outroResourceId: 'stereo-panning',
        examAnchor: {
            question: 'An exam question gives you six scrambled labels — source, mic, preamp, converter, DAW, monitors — and asks you to place them in the correct signal-flow order, then name which one converts the analogue signal into digital. What should the answer state?',
            modelPoints: [
                'The correct order is source → mic → preamp → converter → DAW → monitors — sound is generated, turned into an electrical signal, boosted, and only then turned into data.',
                'The converter, inside the audio interface, is the stage that turns the analogue electrical signal into digital numbers — everything before it in the chain is still analogue.',
                'The mic itself does not digitise anything — it only transduces sound into an electrical signal, which stays analogue until it reaches the converter.',
                'Naming every stage in the correct sequence is what separates full marks from a partial answer — dropping a stage, or reordering even one (for example placing the converter before the preamp), loses the sequence mark.',
            ],
            examTip: 'Walk the chain left to right and name every box — sequence marks are the easiest to drop.',
        },
        rows: [
            {
                id: 'the-chain',
                heading: 'The Recording Chain',
                description: "A recording signal travels through a fixed sequence of stages. The source (voice or instrument) produces sound; the mic acts as a transducer, turning that sound into an electrical signal; the preamp boosts it to a workable level. The converter — inside the audio interface — is where analogue becomes digital. The DAW records and processes that digital signal; the monitors let you hear it played back.",
                animation: 'recording-signal-flow',
                assessment: {
                    id: 'the-chain',
                    question: 'A student is asked which stage of the recording chain turns the analogue electrical signal into digital numbers. Which stage is it?',
                    options: [
                        { text: 'The converter, inside the audio interface — everything before it (source, mic, preamp) is still analogue, and everything after it (DAW, monitors) works with the digital signal', correct: true, feedback: 'Correct — the converter is specifically the analogue-to-digital boundary in the chain; every stage before it is electrical-but-analogue, every stage after it is data.' },
                        { text: 'The mic — it captures the sound, so it must also be what digitises it', correct: false, feedback: 'The mic only transduces sound into an electrical signal — that signal is still analogue. Digitising happens one stage later, at the converter.' },
                        { text: 'The DAW — software is where digital things happen', correct: false, feedback: 'By the time the signal reaches the DAW it is already digital. The conversion itself happens earlier, at the converter inside the audio interface, not inside the software.' },
                    ],
                },
            },
            {
                id: 'captured-quality',
                heading: 'Capturing the Signal',
                description: "Once digital, a recording's quality settings matter. Sample rate is how many measurements are taken per second — a higher rate captures higher frequencies more faithfully. Bit depth is how finely each measurement is stored — more bits means less quantisation noise. Recording as an uncompressed WAV file keeps every measurement intact for editing; compressed formats like MP3 discard data permanently to save space.",
                animation: 'sample-rate-grid',
                assessment: {
                    id: 'captured-quality',
                    question: 'Which combination of settings captures a recording with the least data loss, leaving the most room for editing afterwards?',
                    options: [
                        { text: 'An uncompressed WAV file at a standard bit depth and sample rate (for example 24-bit, 44.1 or 48 kHz) — every measurement is kept intact', correct: true, feedback: 'Correct — an uncompressed WAV file at a proper bit depth and sample rate preserves every measurement taken during capture, keeping the full dynamic range available for editing later.' },
                        { text: 'A 128 kbps MP3 — smaller files are always the safer choice for a recording session', correct: false, feedback: 'MP3 is a lossy, compressed format — it permanently discards data to shrink the file. That trade favours storage space over quality and editability, the opposite of what capturing a session for later work needs.' },
                        { text: 'An 8-bit file at a low sample rate — the smallest file is the easiest one to edit', correct: false, feedback: 'A small file here comes from throwing away resolution (fewer bits, fewer measurements per second), which adds quantisation noise and loses high-frequency detail — that makes a file harder to work with cleanly, not easier.' },
                    ],
                },
            },
            {
                id: 'hearing-yourself',
                heading: 'Hearing Yourself While Tracking',
                description: 'While tracking, you monitor your own input through the DAW in real time — but audio has to travel to the buffer, through any plugins, and back before you hear it. A small buffer size keeps that round trip short, giving low latency, but forces the processor to work harder, refilling it far more often. Direct monitoring sidesteps the buffer entirely, routing the input straight to your headphones.',
                animation: 'buffer-latency-tradeoff',
                assessment: {
                    id: 'hearing-yourself',
                    question: "A vocalist tracking through the DAW hears a slight delay between singing and hearing themselves back. Reducing the buffer size fixes the delay, but introduces a new risk. What is that risk, and what alternative avoids the trade-off entirely?",
                    options: [
                        { text: "A smaller buffer forces the processor to refill it more often, raising CPU load and risking glitches under heavy plugin use; direct monitoring avoids the trade-off by routing the input signal straight through before it ever reaches the buffer", correct: true, feedback: 'Correct — shrinking the buffer trades latency for CPU headroom. Direct monitoring sidesteps that trade entirely, because the signal never goes through the buffer (or the DAW) on its way to the vocalist’s headphones.' },
                        { text: 'There is no risk — a smaller buffer only ever improves performance', correct: false, feedback: 'A smaller buffer does reduce latency, but it also means the processor has to service it far more often, which raises CPU load and can cause glitches or dropouts, especially with several plugins running.' },
                        { text: 'The fix is to increase the sample rate, which reduces latency the same way a smaller buffer does', correct: false, feedback: 'Sample rate and buffer size are different settings. Latency in this scenario is controlled by buffer size, not sample rate — raising the sample rate does not sidestep the buffer round trip at all.' },
                    ],
                },
            },
        ],
    },
];
