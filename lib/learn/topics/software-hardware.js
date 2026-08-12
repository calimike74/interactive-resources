// From Source to DAW — single-chapter version (WO-11 re-home, 2026-08-12).
// Mapped to Pearson Edexcel Component 4 specification 1.1 Software and
// Hardware — this is the same three-row chapter that previously shipped
// under lib/learn/topics/recording.js, keyed to the now-dissolved 'recording'
// band id (WO-02). Re-homed here after item-by-item classification against
// Professional/Curriculum-Topics/1.1 Software and Hardware/01 - Curriculum
// Materials/Unit 4 Section 1.1 Software-Hardware - Official Spec.md.
//
// RE-HOMING JUDGEMENT CALL (flagged per WO-11): WO-11 expected a 1.2
// Microphones / 2.1 Acoustics split for the orphaned recording content, by
// analogy with the question bank (which is genuinely 1.2/2.1-heavy — see
// microphones.json/acoustics.json). Checked directly against the 1.2 and 2.1
// spec extracts, none of this chapter's three rows teach 1.2 or 2.1 content:
//
// Row 1 (the-chain) — signal flow source -> mic -> preamp -> converter (ADC)
// -> DAW -> monitors. This is 1.1's own spec wording verbatim: "Hardware
// components in a studio setup ... signal chain: input -> processing ->
// output" and "Audio interfaces ... convert analogue audio signals to
// digital data (ADC)". Nothing here teaches microphone types, polar
// patterns, placement or phase (1.2), or room acoustics (2.1) — the mic is
// named only as the first link in a general chain.
//
// Row 2 (captured-quality) — sample rate, bit depth, WAV vs MP3. Matches
// 1.1's spec bullet verbatim: "Audio interfaces and their specifications:
// ... sample rate (44.1 kHz, 48 kHz, 96 kHz), bit depth (16-bit, 24-bit,
// 32-bit)". (Note: 2.4 Digital Analogue is an even tighter spec home for
// this row and already has its own live Learn chapter — but 2.4 is outside
// WO-11's authorised destinations (1.2 / 2.1 / 1.1 fallback), so this row
// stays under 1.1 per the WO's explicit fallback clause rather than being
// redirected to a band WO-11 didn't scope.)
//
// Row 3 (hearing-yourself) — buffer size, latency, direct monitoring while
// tracking. Matches 1.1's spec bullet verbatim: "System requirements and
// configuration ... Buffer size and latency management", and its Key
// Terminology table defines both Latency and Buffer Size. No 1.2/2.1 hook
// at all.
//
// Content, wording and exam anchor below are unchanged from recording.js —
// only the export name, this header, and the file's location moved.

export const SOFTWARE_HARDWARE_CHAPTERS = [
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
                description: 'While tracking, you monitor your own input through the DAW in real time — but audio has to pass through the buffer, and any plugins, before you hear it. A small buffer size keeps that added delay short, giving low latency, but forces the processor to work harder, refilling it far more often. Direct monitoring sidesteps the buffer entirely, routing the input straight to your headphones.',
                animation: 'buffer-latency-tradeoff',
                assessment: {
                    id: 'hearing-yourself',
                    question: "A vocalist tracking through the DAW hears a slight delay between singing and hearing themselves back. Reducing the buffer size fixes the delay, but introduces a new risk. What is that risk, and what alternative avoids the trade-off entirely?",
                    options: [
                        { text: "A smaller buffer forces the processor to refill it more often, raising CPU load and risking glitches under heavy plugin use; direct monitoring avoids the trade-off by routing the input signal straight through before it ever reaches the buffer", correct: true, feedback: 'Correct — shrinking the buffer trades latency for CPU headroom. Direct monitoring sidesteps that trade entirely, because the signal never goes through the buffer (or the DAW) on its way to the vocalist’s headphones.' },
                        { text: 'There is no risk — a smaller buffer only ever improves performance', correct: false, feedback: 'A smaller buffer does reduce latency, but it also means the processor has to service it far more often, which raises CPU load and can cause glitches or dropouts, especially with several plugins running.' },
                        { text: 'The fix is to increase the sample rate, which reduces latency the same way a smaller buffer does', correct: false, feedback: 'Sample rate and buffer size are different settings. Latency in this scenario is controlled by buffer size, not sample rate — raising the sample rate does not reduce the delay the buffer adds at all.' },
                    ],
                },
            },
        ],
    },
];
