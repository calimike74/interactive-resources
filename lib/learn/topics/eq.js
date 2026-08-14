// EQ Course — 4-chapter version (Task 3, learn-rollout-wave1).
// Legacy rows below (what-eq-solves, graphic-eq, frequency-bands, parametric-eq,
// q-factor, routing, comparison) are copied verbatim from the original single-lesson
// EQ_TOPIC: same heading/description/animation/assessment. New rows are marked in comments.

export const EQ_CHAPTERS = [
    {
        id: 'spectrum',
        chapterNumber: 1,
        title: 'The Frequency Spectrum',
        subtitle: 'Topic 1.11 – Component 4',
        description: 'The frequency axis EQ works on, the named zones within it, and the difference between fixing a problem and shaping a character.',
        estimatedTime: '15–20 minutes',
        examAnchor: {
            question: 'You are played an isolated bass part and asked to identify its frequency range by ear, without a spectrum analyser. State an appropriate frequency range for the bass, and explain how a mix described as "muddy" points to a different, neighbouring zone.',
            modelPoints: [
                'An appropriate frequency range for an isolated bass part is roughly 50–200 Hz: the region credited in the mark scheme for identifying bass by ear.',
                'A mix that sounds "muddy" points to the low-mid zone instead, roughly 200–500 Hz. Too much energy here, not in the bass itself, is what causes that congested quality.',
                'Bass and low-mids are neighbouring zones on the spectrum but cause different symptoms (a weak or boomy low end versus a boxy, congested mix) so naming the correct zone for each symptom matters.',
                'Naming a specific numeric range, not a vague word like "low" or "bassy", is what the mark scheme credits.',
            ],
            examTip: '2017 AS Q3(g) credited a bass frequency range of 50–200 Hz identified purely by ear. A specific numeric range earns the mark; a vague description does not.',
        },

        rows: [
            {
                id: 'what-eq-solves',
                heading: 'What EQ Solves',
                description: 'Every sound contains a mix of frequencies. Some are too loud, others too quiet. EQ lets you boost or cut specific frequency ranges to shape the tonal balance of a signal: fixing problems or enhancing character.',
                animation: 'frequency-spectrum',
                audio: { preset: 'eq-tone-flat', label: 'Play to hear the flat, unprocessed baseline tone: nothing boosted, nothing cut, nothing shaped yet.' },
                assessment: {
                    id: 'what-eq-solves',
                    question: 'A recording of an acoustic guitar sounds thin and lacks warmth. Which approach would be most appropriate?',
                    options: [
                        { text: 'Cut everything above 5 kHz to remove brightness', correct: false, feedback: 'Cutting highs would make it dull, not warm.' },
                        { text: 'Boost around 200–400 Hz to add body and warmth', correct: true, feedback: 'The low-mid range is where warmth lives for acoustic instruments.' },
                        { text: 'Boost at 10 kHz for more fullness', correct: false, feedback: '10 kHz adds air/shimmer, not warmth.' },
                    ],
                },
            },
            // --- new row ---
            {
                id: 'log-axis',
                heading: 'The Log Axis & the Hearing Range',
                description: 'EQ works across 20 Hz to 20 kHz: the hearing range, and also the range most equipment reproduces. Every frequency-response graph plots this on a logarithmic axis: Hz across the bottom, dB up the side. Log spacing matters because the ear hears in ratios: one octave, a doubling of frequency, sounds like the same step whether it\'s 50 to 100 Hz or 5 to 10 kHz.',
                animation: 'log-frequency-axis',
                assessment: {
                    id: 'log-axis',
                    question: 'A student is asked why an audio frequency-response graph almost always uses a logarithmic, not linear, frequency axis. Which explanation is correct?',
                    options: [
                        { text: "A logarithmic axis is used because equipment can't measure frequencies above 20 kHz accurately", correct: false, feedback: 'This confuses a measurement limit with the actual reason the axis is drawn logarithmically. The real reason is about how the ear perceives frequency, not the accuracy of any meter.' },
                        { text: "The ear hears frequency as ratios, not raw differences: one octave sounds like the same musical step whether it's low or high, so a log axis spaces those steps evenly", correct: true, feedback: "Exactly. A linear axis would squash almost the whole musical range below 1 kHz into a sliver on the left, because equal Hz steps don't correspond to equal musical steps; log spacing fixes that." },
                        { text: "It's purely a graphing convention with no acoustic basis, chosen because it's easier to draw", correct: false, feedback: "There's a real perceptual reason behind it, not just convenience, see the correct answer." },
                    ],
                },
            },
            // --- new row ---
            {
                id: 'frequency-map',
                heading: 'The Frequency Map',
                description: 'The spectrum splits into named zones rather than raw numbers. Bass runs roughly 50–200 Hz, sub-bass sits below that, felt as much as heard. Low-mids (200–500 Hz) is where boxiness and mud collect; the mids carry most instruments\' bodies. Presence (2–5 kHz) gives clarity and edge, air (8–12 kHz) gives shimmer. Source books disagree on the exact edges: treat these as approximate zones.',
                animation: 'frequency-map-zones',
                assessment: {
                    id: 'frequency-map',
                    question: 'A mix is described as boxy and congested, even though the bass and treble both sound fine in isolation. Which frequency zone is the most likely cause, and what would you do about it?',
                    options: [
                        { text: 'Sub-bass, below the bass range: cut it to fix the boxiness', correct: false, feedback: 'Sub-bass problems present as a weak or flabby low end, not boxiness: this is the wrong zone for this symptom.' },
                        { text: 'Low-mids, roughly 200–500 Hz: a narrow cut here typically clears boxiness without thinning the rest of the mix', correct: true, feedback: "That's the low-mid zone doing exactly what it does when there's too much energy in it: boxy and congested is its signature complaint." },
                        { text: 'Presence, roughly 2–5 kHz: boost this range to mask the boxiness with extra clarity', correct: false, feedback: "Boosting elsewhere doesn't remove the actual low-mid buildup: it just adds a second frequency to manage, and risks making the mix harsh on top of still being boxy underneath." },
                    ],
                },
            },
            // --- new row ---
            {
                id: 'boost-vs-cut',
                heading: 'Boost vs Cut Philosophy',
                description: 'Corrective EQ removes problems (rumble, resonance, harshness) using cuts, usually the minimum needed. Creative EQ shapes character on purpose (brightening, warming, adding air) usually using boosts. Cuts are generally the safer move: they remove energy that\'s already causing a problem, while a boost adds energy and can just as easily create a new one. The working rule: cut to fix, boost to enhance.',
                animation: 'boost-vs-cut-philosophy',
                audio: { preset: 'eq-presence-boost', label: 'Play to hear a presence boost push 3 kHz forward: brighter and more edgy, a creative EQ move.' },
                assessment: {
                    id: 'boost-vs-cut',
                    question: "A vocal recording has a harsh resonance around 3 kHz that's fatiguing to listen to. A student weighs two options: cut 4 dB at 3 kHz, or boost 4 dB at 8 kHz to add brightness elsewhere instead. Which is the better first move, and why?",
                    options: [
                        { text: 'Boost at 8 kHz: adding brightness higher up will mask the harshness lower down', correct: false, feedback: "Masking doesn't remove the actual problem frequency: it just adds a second frequency to manage, and the 3 kHz resonance is still there underneath." },
                        { text: 'Cut 4 dB at 3 kHz: this is corrective EQ, removing the actual problem frequency directly with the minimum cut needed', correct: true, feedback: 'Right. A resonance is a specific, locatable problem, and the corrective move is a direct cut at that frequency, not a boost somewhere else.' },
                        { text: 'Neither. A resonance like this can only be fixed by re-recording the vocal', correct: false, feedback: "EQ is a standard, legitimate corrective tool for exactly this kind of problem, re-recording isn't necessary." },
                    ],
                },
            },
        ],
    },
    {
        id: 'filters',
        chapterNumber: 2,
        title: 'Filters',
        subtitle: 'Topic 1.11 – Component 4',
        description: 'How high-pass, low-pass and shelving filters remove or shape frequencies, and the practical jobs they do in a mix.',
        estimatedTime: '15–20 minutes',
        examAnchor: {
            question: 'A vocal recording has audible rumble and proximity build-up in the low end, which must be removed without dulling the voice itself. Justify a suitable filter choice, including type and an appropriate cut-off frequency.',
            modelPoints: [
                'A high-pass filter is the correct choice: it removes energy below its cut-off while passing everything above it untouched, unlike a shelf, which would also reduce the wanted low-mid body of the voice.',
                'A cut-off in the range 80–120 Hz targets rumble and proximity build-up while sitting below most vocal fundamentals, so the tone of the voice is preserved.',
                'A steeper slope, such as 24 dB/octave, removes the rumble more completely within a narrow range just below the cut-off, without reaching up into frequencies that matter for the voice.',
                'The same move also reduces plosives, since their energy is concentrated in the same low-frequency region as rumble.',
            ],
            examTip: '2025 A Q4(c) credited this exact HPF chain: cuts low frequencies, cut-off anywhere in the 20–160 Hz range, reduces rumble, hum, plosives and proximity effect, makes space in the mix, without affecting vocal tone. That 20–160 Hz band is the full mark-scheme range; 80–120 Hz sits safely inside it as the reliable, textbook vocal answer. Naming the mechanism alongside the number is what separates full marks from partial credit.',
        },

        rows: [
            // --- new row ---
            {
                id: 'high-pass-low-pass',
                heading: 'High-Pass & Low-Pass Filters',
                description: "A filter removes part of the spectrum and lets the rest through: its name says what passes, not what's removed. A high-pass filter lets highs through and cuts lows below its cut-off; a low-pass filter does the reverse. The cut-off frequency is defined as the point where the signal has already fallen by 3 dB. It hasn't just started to cut there, it's already biting into the signal.",
                animation: 'high-pass-low-pass-filters',
                audio: { preset: 'eq-highpass', label: 'Play to hear a high-pass filter strip away everything below 300 Hz, leaving only the top end.' },
                assessment: {
                    id: 'high-pass-low-pass',
                    question: 'A student is asked to describe a high-pass filter set at 200 Hz. Which description is correct?',
                    options: [
                        { text: 'It removes frequencies above 200 Hz and lets frequencies below 200 Hz through', correct: false, feedback: "That's a low-pass filter, not a high-pass: you've swapped the two, the single most common mix-up in this topic." },
                        { text: 'It removes frequencies below 200 Hz and lets frequencies above 200 Hz through', correct: true, feedback: 'Correct. High-pass lets the highs pass and cuts the lows below the 200 Hz cut-off. The name always says what passes.' },
                        { text: 'It boosts frequencies above 200 Hz by a fixed amount', correct: false, feedback: "A filter removes or passes frequencies, it doesn't boost them: that's a shelving EQ move, a different tool entirely." },
                    ],
                },
            },
            // --- new row ---
            {
                id: 'filter-slope',
                heading: 'Slope: dB per Octave',
                description: 'Below the cut-off, a filter\'s steepness is measured in dB per octave: how much quieter the signal gets per doubling or halving of frequency. Each filter pole contributes 6 dB per octave, so 12 dB per octave is a standard slope; 24 dB per octave is steep; 48 dB per octave is close to a brick wall. A steeper slope removes frequencies faster, but too steep can sound unnatural.',
                animation: 'filter-slope-db-octave',
                assessment: {
                    id: 'filter-slope',
                    question: "Two low-pass filters share the same cut-off frequency: one at 12 dB/octave, the other at 48 dB/octave. Played back to back on a bright synth pad, what's the audible difference?",
                    options: [
                        { text: 'No audible difference: slope only matters for frequencies below 20 Hz', correct: false, feedback: 'Slope changes how quickly frequencies above the cut-off are removed across the whole audible range, not just below 20 Hz.' },
                        { text: 'The 48 dB/octave filter removes frequencies above the cut-off far more aggressively (closer to a brick wall) while 12 dB/octave rolls off more gently, letting more high content bleed through', correct: true, feedback: 'Exactly. Same cut-off, very different steepness: the 48 dB/octave slope sounds noticeably darker and more decisively filtered.' },
                        { text: 'The 12 dB/octave filter is louder overall because its gentler slope passes more total signal energy through', correct: false, feedback: "A gentler slope does let slightly more energy through near the cut-off, but this isn't heard as the filter being louder overall. The audible difference is in brightness above the cut-off, not level." },
                    ],
                },
            },
            // --- new row ---
            {
                id: 'shelving-filters',
                heading: 'Shelving Filters',
                description: 'A shelving filter alters everything beyond a corner frequency by the same fixed amount, rather than removing it. A low shelf boosts or cuts everything below its corner; a high shelf does the same above. Unlike a filter, which removes, a shelf holds its new level flat beyond the corner: useful for broad tonal moves, like warming up a dull recording or adding air across a whole mix.',
                animation: 'shelving-filters',
                audio: { preset: 'eq-low-shelf-boost', label: 'Play to hear a low-shelf boost pile weight below 200 Hz: warmer and thicker, edging toward boomy.' },
                assessment: {
                    id: 'shelving-filters',
                    question: 'A mix engineer wants a broad, gentle lift across the whole top end of a mix (from around 8 kHz upward) for extra air, without a hard cut-off anywhere. Which tool fits best?',
                    options: [
                        { text: 'A high-pass filter at 8 kHz', correct: false, feedback: "A high-pass filter would remove everything below 8 kHz entirely, gutting the mix. The opposite of adding air on top of what's already there." },
                        { text: 'A high shelf boost above 8 kHz', correct: true, feedback: 'Right. A shelf lifts or cuts broadly and smoothly beyond its corner, which is exactly the "add air without a hard edge" job.' },
                        { text: 'A high-Q parametric bell boost at 8 kHz', correct: false, feedback: 'A high-Q bell creates a narrow spike at 8 kHz rather than the broad, smooth lift wanted: right frequency area, wrong shape entirely.' },
                    ],
                },
            },
            // --- new row ---
            {
                id: 'practical-filter-uses',
                heading: 'Filters in Practice',
                description: 'Filters do practical jobs beyond textbook shapes. A high-pass filter below the source removes rumble and proximity build-up (typically 80–120 Hz on a vocal) while also taming plosives. A narrow notch removes mains hum at 50 Hz and its harmonics stacked above it. A band-pass filter, a high-pass and low-pass combined, creates a narrow telephone effect used creatively in breakdowns and transitions.',
                animation: 'practical-filter-uses',
                assessment: {
                    id: 'practical-filter-uses',
                    question: 'A location recording has persistent 50 Hz mains hum running underneath the whole track. Which filter approach removes it with the least damage to the rest of the recording?',
                    options: [
                        { text: 'A wide low-pass filter cutting everything above 200 Hz', correct: false, feedback: "That would remove far more than the hum: all the recording's upper content along with it." },
                        { text: 'A series of narrow notch filters at 50 Hz and its harmonics: 100 Hz, 150 Hz, and so on', correct: true, feedback: 'Right. Narrow notches target exactly the hum and its harmonic stack, leaving everything else in the recording untouched.' },
                        { text: 'A single wide band-pass filter centred at 50 Hz', correct: false, feedback: "A band-pass filter would keep only a narrow range around 50 Hz and remove everything else. The opposite of what's needed, since the hum is what has to go, not what has to stay." },
                    ],
                },
            },
        ],
    },
    {
        id: 'graphic-parametric',
        chapterNumber: 3,
        title: 'Graphic vs Parametric',
        subtitle: 'Topic 1.11 – Component 4',
        description: 'How graphic and parametric EQ shape the frequency content of audio signals, and when to reach for each.',
        estimatedTime: '15–20 minutes',
        examAnchor: {
            question: 'A live sound engineer needs to quickly tame feedback ringing at approximately 2.3 kHz during a soundcheck, while a mastering engineer later needs to remove a narrow resonance at exactly 3.2 kHz from a finished mix. Compare which EQ type suits each situation, and why.',
            modelPoints: [
                "The live engineer should reach for a graphic EQ: its fixed sliders give instant, tactile, visual control, which matters when time is short, even though the nearest band won't sit exactly on 2.3 kHz.",
                "A parametric EQ would let the live engineer target 2.3 kHz exactly, but sweeping to set frequency, gain and Q live takes time the situation doesn't allow.",
                'The mastering engineer should use a parametric EQ: frequency, gain and Q are all adjustable, so the band can be swept to exactly 3.2 kHz with a high Q for a narrow, surgical cut.',
                "A graphic EQ's fixed bands can't reach exactly 3.2 kHz, and its lack of adjustable Q means any cut would be broader than needed, affecting frequencies that don't need touching.",
            ],
            examTip: 'The mark scheme rewards a structural comparison (fixed bands and gain only, versus adjustable frequency, gain and Q) tied to context, speed against precision, not just naming "graphic" or "parametric". State which parameter each type is missing.',
        },

        rows: [
            {
                id: 'graphic-eq',
                heading: 'Graphic EQ',
                description: 'A graphic EQ splits the frequency spectrum into fixed bands, typically 10 or 31. Each band has a slider that boosts or cuts at that specific frequency. The slider positions give you a visual "graph" of your EQ curve. Quick to use, but you can only adjust the frequencies it gives you.',
                animation: 'graphic-eq',
                assessment: {
                    id: 'graphic-eq',
                    question: 'A live sound engineer needs to quickly reduce feedback at approximately 2.3 kHz. Why might a 10-band graphic EQ be a poor choice for this?',
                    options: [
                        { text: 'The fixed band spacing means there may not be a slider at exactly 2.3 kHz: cutting the nearest band would affect wanted frequencies too', correct: true, feedback: '10-band has octave spacing with 1 kHz and 2 kHz bands but not 2.3 kHz.' },
                        { text: 'Graphic EQs cannot cut frequencies, only boost', correct: false, feedback: 'They can both boost and cut.' },
                        { text: 'Graphic EQs are too slow for live use', correct: false, feedback: "They're popular in live sound for speed: the issue is precision." },
                    ],
                },
            },
            {
                id: 'frequency-bands',
                heading: 'Frequency Bands & Spacing',
                description: 'Bands are spaced at octave intervals (10-band) or third-octave intervals (31-band). An octave means doubling the frequency: so bands go 125Hz, 250Hz, 500Hz, 1kHz, 2kHz, 4kHz. More bands means finer control, but the frequencies are still fixed.',
                animation: 'octave-bands',
                assessment: {
                    id: 'frequency-bands',
                    question: 'A 31-band graphic EQ has bands at third-octave intervals. Compared to a 10-band, what practical advantage does this give you?',
                    options: [
                        { text: 'It sounds better because more bands means higher audio quality', correct: false, feedback: "Number of bands doesn't change audio quality." },
                        { text: 'It lets you make narrower, more targeted adjustments because the bands are closer together', correct: true, feedback: 'Third-octave = bands ~1.26x apart vs 2x.' },
                        { text: 'It allows you to choose any frequency you want', correct: false, feedback: "Both are fixed: that's what parametric is for." },
                    ],
                },
            },
            {
                id: 'parametric-eq',
                heading: 'Parametric EQ',
                description: 'A parametric EQ gives you full control over each band: choose any frequency, set the gain (boost/cut), and adjust the Q (bandwidth). Typically 4–7 bands, each fully sweepable. More surgical than graphic EQ: you target exactly the frequency you need.',
                animation: 'parametric-eq',
                assessment: {
                    id: 'parametric-eq',
                    question: 'A vocal recording has an unpleasant resonance at exactly 3.2 kHz. Which EQ type and approach would give you the most precise fix?',
                    options: [
                        { text: 'Graphic EQ: pull down the 3 kHz and 4 kHz sliders', correct: false, feedback: 'Too wide, would lose presence.' },
                        { text: 'Parametric EQ: set a narrow band at 3.2 kHz with a high Q and cut', correct: true, feedback: 'Parametric lets you target exactly 3.2 kHz with narrow Q.' },
                        { text: 'Parametric EQ: set a wide band at 3.2 kHz with a low Q and cut', correct: false, feedback: 'Low Q = wide cut, would remove good frequencies too.' },
                    ],
                },
            },
            {
                id: 'comparison',
                heading: 'When to Use Each',
                description: 'Graphic EQ excels at quick, broad tonal adjustments: live sound, DJ monitoring, room correction. Parametric EQ is the tool for precise, surgical work: removing resonances, shaping individual tracks in a mix, mastering. Most DAWs default to parametric because of its flexibility.',
                animation: 'comparison',
                assessment: {
                    id: 'comparison',
                    question: 'A DJ at a live event needs to quickly cut bass frequencies that are causing the room to boom. Which EQ type and why?',
                    options: [
                        { text: 'Parametric EQ: the DJ needs to find the exact resonant frequency first', correct: false, feedback: 'Sweeping parametric takes too much time during live performance.' },
                        { text: 'Graphic EQ: the DJ can instantly grab the low-frequency sliders and pull them down without precise settings', correct: true, feedback: 'Speed matters in live, graphic sliders give immediate visual and tactile feedback.' },
                        { text: "Neither. Room acoustics can't be fixed with EQ", correct: false, feedback: 'EQ can absolutely reduce room resonances.' },
                    ],
                },
            },
        ],
    },
    {
        id: 'eq-at-work',
        chapterNumber: 4,
        title: 'Q & EQ Decisions',
        subtitle: 'Topic 1.11 – Component 4',
        description: 'Q factor, signal routing, and the sweep-and-cut technique for finding and fixing problem frequencies in a real mix.',
        estimatedTime: '15–20 minutes',
        outroResourceId: 'eq8-image-explorer',
        examAnchor: {
            question: 'A vocal recording has a nasal, boxy quality caused by a resonance around 400 Hz, alongside low-end rumble below 100 Hz that needs removing without affecting the voice. Describe an EQ chain that fixes both, stating specific parameter values.',
            modelPoints: [
                'A high-pass filter with a cut-off around 80–100 Hz removes the rumble while sitting below the vocal fundamental, so the tone of the voice is preserved.',
                'A narrow parametric cut at 400 Hz with a high Q, around 8–10, removes the boxy resonance surgically, without removing the wider low-mid warmth around it.',
                'The cut at 400 Hz should be a moderate amount, around 3–6 dB. Enough to tame the resonance without making the voice sound thin.',
                'The two moves target different problems at different points on the spectrum, applied low end first and then the specific resonance, rather than one broad, vague cut.',
            ],
            examTip: 'Model answers pair every setting with a value and a reason: "cut at 400 Hz" alone earns less than "cut 4 dB at 400 Hz with a high Q, because that\'s where the boxiness sits". The 2023 A Q6 examiner report notes candidates losing marks for not defining parameters they clearly knew.',
        },

        rows: [
            {
                id: 'q-factor',
                heading: 'Q Factor (Bandwidth)',
                description: 'Q controls how wide or narrow the EQ band is. Low Q = wide and gentle, affecting many frequencies around the target. High Q = narrow and precise, targeting a specific frequency. This is the key parameter that graphic EQ lacks.',
                animation: 'q-factor',
                assessment: {
                    id: 'q-factor',
                    question: 'You want to gently brighten an entire mix during mastering. Should you use a high Q or low Q boost around 10 kHz?',
                    options: [
                        { text: 'High Q: a narrow boost is always more precise and therefore better', correct: false, feedback: 'Narrow boost creates unnatural peak.' },
                        { text: 'Low Q: a wide, gentle boost affects a broad range of high frequencies naturally', correct: true, feedback: 'Mastering needs subtle broad adjustments.' },
                        { text: "Q doesn't matter for mastering: any setting works", correct: false, feedback: 'Q matters enormously in mastering.' },
                    ],
                },
            },
            {
                id: 'routing',
                heading: 'Signal Routing',
                description: 'Graphic EQ uses parallel routing: all bands process the signal simultaneously. Parametric EQ uses series routing: the signal passes through each band in sequence. Series routing means each band adds cumulative phase shift, which is why linear-phase EQs exist for mastering.',
                animation: 'routing',
                assessment: {
                    id: 'routing',
                    question: 'A mastering engineer chooses a linear-phase EQ over a standard parametric EQ. What problem are they trying to avoid?',
                    options: [
                        { text: 'The cumulative phase shift that series-routed parametric EQ bands introduce, which can smear transients', correct: true, feedback: 'Series routing adds phase shift per band.' },
                        { text: 'The noise floor of analogue EQ circuits', correct: false, feedback: 'This is about digital processing modes.' },
                        { text: 'The latency of parallel processing in graphic EQs', correct: false, feedback: 'Graphic uses parallel not series.' },
                    ],
                },
            },
            // --- new row ---
            {
                id: 'sweep-and-cut',
                heading: 'The Sweep-and-Cut Technique',
                description: "To find a resonance you can hear but can't name, sweep a narrow, high-Q boost across the spectrum until the offending frequency rings out louder than everything around it. Once you've located it, flip that boost into a cut at the exact same frequency. It's the single most useful EQ technique in production, taught under a different name in every source book.",
                animation: 'sweep-and-cut-technique',
                interactive: 'eq-sweep',
                assessment: {
                    id: 'sweep-and-cut',
                    question: "A student can hear an unpleasant ringing resonance somewhere in a snare recording but can't identify the exact frequency by ear alone. Using the sweep-and-cut technique, what should they do first?",
                    options: [
                        { text: 'Apply a wide, low-Q cut across the whole upper-mid range to be safe', correct: false, feedback: 'Too broad: this removes wanted content across a wide range without ever locating the actual problem frequency.' },
                        { text: 'Sweep a narrow, high-Q boost across the spectrum until the resonance rings out loudest, note that frequency, then flip the boost into a cut at the same point', correct: true, feedback: "That's the technique exactly: boosting first exaggerates the problem so it's easy to hear and locate, then the same narrow band becomes the cut." },
                        { text: 'Cut at several likely-sounding frequencies (200 Hz, 1 kHz, 4 kHz) and keep whichever sounds best', correct: false, feedback: "That's trial and error, not sweep-and-cut: it skips the step of actually locating the frequency, so it's slower and less precise." },
                    ],
                },
            },
            // --- new row ---
            {
                id: 'mix-context-decisions',
                heading: 'EQ Decisions in a Mix',
                description: 'Every EQ decision happens in the context of the whole mix, not in solo: a thin part may already have room reserved elsewhere, so cutting the wrong track creates a new problem. Clearing rumble below an instrument\'s range with a high-pass filter is a classic mix-context decision. Matching tasks mark you down for reaching for volume instead of EQ, or changing audio outside the stated bars.',
                animation: 'eq-mix-context-decisions',
                assessment: {
                    id: 'mix-context-decisions',
                    question: "A student is set a matching task: make the second verse's guitar tone match the brighter first verse, using EQ only. After adjusting, the second verse is louder but the tone is barely more consistent. What's gone wrong?",
                    options: [
                        { text: 'They should have used volume automation instead: that would have matched the sections better', correct: false, feedback: 'The task specifically asks for tone matching via EQ: volume changes loudness, not the frequency balance the task is testing.' },
                        { text: 'They likely reached for gain rather than genuinely matching the EQ curve: a documented failure mode, since matching tone needs frequency-specific adjustment, not an overall level change', correct: true, feedback: "Exactly the trap the mark scheme flags: louder isn't the same as tonally matched; the fix has to change the balance between frequencies, not just the overall level." },
                        { text: 'The task is impossible: EQ can only be applied to a whole track, not to one section of it', correct: false, feedback: "EQ can be automated or applied to a defined clip or region: this isn't a real limitation." },
                    ],
                },
            },
        ],
    },
];
