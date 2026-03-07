// Compression Topic — Row-based content for inline animated explanations
// Each row: heading + description (left) paired with an animated diagram (right)

export const COMPRESSION_TOPIC = {
    id: 'compression',
    title: 'Compression',
    subtitle: 'Topic 1.9 — Component 4',
    description: 'How compressors control dynamic range using threshold, ratio, attack, release, and make-up gain.',
    color: '#e85d75',

    rows: [
        {
            id: 'what-compression-solves',
            heading: 'What Compression Solves',
            description: 'Audio signals have a dynamic range — the gap between the quietest and loudest moments. In a mix, if a vocal is too dynamic, quiet words get lost and loud ones overpower everything. A compressor reduces this gap, making the signal more consistent and controlled.',
            animation: 'dynamic-range',
            assessment: {
                id: 'what-compression-solves',
                question: 'A podcast host speaks quietly then laughs loudly into the mic. Without compression, a listener constantly adjusts their volume. What specifically is the compressor solving here?',
                options: [
                    { text: 'Making the quiet parts louder by boosting the entire signal', correct: false, feedback: 'That\'s just turning up the volume — it would make the loud laughs even louder too.' },
                    { text: 'Reducing the dynamic range — bringing the loud laughs closer in level to the quiet speech', correct: true, feedback: 'The compressor tames the peaks so the gap between quiet and loud is smaller, removing the need for manual volume adjustment.' },
                    { text: 'Removing the low frequencies from the laughter', correct: false, feedback: 'EQ removes frequencies — compression controls dynamics regardless of frequency content.' },
                ],
            },
        },
        {
            id: 'threshold-ratio',
            heading: 'Threshold & Ratio',
            description: 'The threshold sets the level where compression begins — signals below it pass through untouched. The ratio determines how much compression is applied above the threshold. A 4:1 ratio means for every 4 dB the input goes above threshold, only 1 dB comes out. Higher ratios mean more aggressive compression.',
            animation: 'threshold-ratio',
            assessment: {
                id: 'threshold-ratio',
                question: 'A vocal peaks at -6 dBFS. You set the threshold at -18 dBFS with a 3:1 ratio. How much gain reduction is applied to the loudest peak?',
                options: [
                    { text: '4 dB — divide the signal above threshold by the ratio', correct: false, feedback: '12 \u00F7 3 = 4 dB is the output above threshold, not the gain reduction. Gain reduction is 12 - 4 = 8 dB.' },
                    { text: '8 dB — the peak is 12 dB above threshold, and at 3:1 only 4 dB passes through (12 - 4 = 8 dB reduction)', correct: true, feedback: '12 dB above threshold \u00F7 3 = 4 dB output above threshold, so 12 - 4 = 8 dB of gain reduction.' },
                    { text: '12 dB — everything above the threshold is compressed', correct: false, feedback: 'At 3:1 the signal isn\'t eliminated, it\'s reduced. Only an infinity:1 ratio (limiter) would reduce all 12 dB.' },
                ],
            },
        },
        {
            id: 'attack-release',
            heading: 'Attack & Release',
            description: 'Attack controls how quickly the compressor responds once the signal crosses the threshold. A fast attack clamps down immediately (good for controlling transients). A slow attack lets the initial transient through (preserves punch). Release controls how quickly compression stops after the signal drops below threshold.',
            animation: 'attack-release',
            assessment: {
                id: 'attack-release',
                question: 'A drum bus compressor is set with a very fast attack. The drums sound controlled but have lost their punch. What would you change?',
                options: [
                    { text: 'Increase the ratio for more compression', correct: false, feedback: 'More compression would reduce punch even further — the issue is timing, not amount.' },
                    { text: 'Slow down the attack — let the initial transient pass through before compression engages', correct: true, feedback: 'The transient is the \'hit\' — fast attack clamps it down, slow attack preserves the punch while still controlling sustain.' },
                    { text: 'Speed up the release to recover faster', correct: false, feedback: 'Release affects recovery after compression, not whether the initial transient passes through.' },
                ],
            },
        },
        {
            id: 'knee',
            heading: 'Hard Knee vs Soft Knee',
            description: 'The knee determines how the compressor transitions into compression around the threshold. Hard knee applies the full ratio instantly at the threshold — precise but can sound obvious. Soft knee gradually increases the ratio as the signal approaches the threshold — more transparent and musical sounding.',
            animation: 'knee-types',
            assessment: {
                id: 'knee',
                question: 'You\'re compressing a lead vocal in a ballad and want the compression to be as invisible as possible. Would you choose hard or soft knee?',
                options: [
                    { text: 'Hard knee — precise control is always better for vocals', correct: false, feedback: 'Hard knee applies the full ratio instantly at threshold, which can sound abrupt on exposed vocals.' },
                    { text: 'Soft knee — it gradually increases the ratio as the signal approaches the threshold, making the onset of compression smoother', correct: true, feedback: 'The gradual transition makes compression less audible, which is ideal for exposed vocals in a ballad.' },
                    { text: 'It doesn\'t matter — knee only affects loud signals', correct: false, feedback: 'Knee affects how compression transitions around the threshold, which is exactly where a vocal sits most of the time.' },
                ],
            },
        },
        {
            id: 'makeup-gain',
            heading: 'Make-Up Gain',
            description: 'Compression reduces the level of loud peaks, which lowers the overall signal level. Make-up gain boosts the entire signal back up after compression. The result: the peaks are controlled but the quiet parts are now louder relative to them. This is how compression makes things sound "louder" without actually increasing peak levels.',
            animation: 'makeup-gain',
            assessment: {
                id: 'makeup-gain',
                question: 'After compressing a vocal, the peaks are controlled but the track sounds quieter in the mix. What do you do, and why does this make the vocal seem \'louder\' overall?',
                options: [
                    { text: 'Remove the compressor — it\'s making the vocal too quiet', correct: false, feedback: 'The compressor is doing its job reducing peaks — removing it brings back the dynamic range problem.' },
                    { text: 'Apply make-up gain — peaks are now controlled, so boosting the level raises the quiet parts closer to the peaks, increasing average loudness', correct: true, feedback: 'With peaks tamed, make-up gain lifts everything including the quiet parts, making the overall signal feel louder and more present.' },
                    { text: 'Increase the ratio to compress more — this will make it louder', correct: false, feedback: 'Higher ratio means more gain reduction, which would make it even quieter without make-up gain.' },
                ],
            },
        },
        {
            id: 'before-after',
            heading: 'Before & After',
            description: 'The full picture: an uncompressed signal with wide dynamic range goes through the compressor. Peaks above the threshold are reduced by the ratio. Attack and release shape the timing. Make-up gain restores the overall level. The output is more consistent, sits better in a mix, and feels more polished.',
            animation: 'before-after-compression',
            assessment: {
                id: 'before-after',
                question: 'A mix engineer A/B compares their compressed drum bus with the uncompressed version. The compressed version sounds louder and \'better\'. How can they make a fair comparison?',
                options: [
                    { text: 'Turn up the uncompressed version to match', correct: false, feedback: 'Turning up the uncompressed version would just make the peaks louder and potentially clip — the point is to match average loudness, which means turning the compressed version down.' },
                    { text: 'Match the perceived loudness by turning down the compressed version before comparing', correct: true, feedback: 'Compression + make-up gain increases average level, so our ears perceive it as better simply because it\'s louder — level-matching reveals the actual tonal and dynamic changes.' },
                    { text: 'The comparison is already fair — the compressor made it genuinely louder', correct: false, feedback: 'Louder always sounds \'better\' to our ears — this is a well-known psychoacoustic bias. Fair comparison requires level-matching to judge the actual processing, not just the volume difference.' },
                ],
            },
        },
    ],
};
