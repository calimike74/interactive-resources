// The Piano Roll (1.5). Built 2026-08-30 to the Bench Standard
// (Planning-and-Admin/Interactive-Resources-Upgrade/BENCH-STANDARD.md),
// seventh bench after Delay, EQ, Dynamics, Edit, the Balance Desk and the
// Automation Lane: the MIDI file the practical paper hands over, on the
// roll, with the papers' own opening questions as presets. It replaces the
// MIDI Pitch Bend & Controller page (that id is a retired stub now; see
// app/midi-pitch-bend-controller/page.js).

const pianoRoll = {
    id: 'piano-roll',
    title: 'Piano Roll',
    description: 'The MIDI file the paper hands you, on the roll: four bars of drums or bass with the velocity lane beneath, drawn the way your DAW draws them. Drag notes, set the quantise value and strength, fix the drum sounds, set the bend range, draw the bar; read the list editor and the bytes on the wire; work to the papers\' own questions.',
    topic: '1.5 Sequencing',
    relatedTopics: ['1.3 Synthesis', '2.5 Numeracy', '1.6 Audio Editing', '1.8 Automation'],
    type: 'interactive',
    kind: 'bench',
    icon: '',
    estimatedTime: '10-15 minutes',
    learningObjectives: [
        'Read a velocity in decimal and in binary off the list editor, and say why 127 is the ceiling',
        'Name the most appropriate quantise value for a part, and hear what a coarser one does to a roll or a triplet',
        'Fix a drum file assigned to the wrong sounds on the kit, without moving a note',
        'Set a pitch bend range to match an example, and say what changed and what did not',
        'Read the three bytes of a Note On and the two data bytes of a pitch bend',
    ],
    prepFor: ['midi-binary-assessment'],
    component: 'PianoRoll',
    keywords: ['midi', 'piano roll', 'list editor', 'velocity', 'binary', 'quantise', 'quantize', 'triplet', 'drum map', 'pitch bend', 'range', 'lsb', 'msb', 'status byte', 'data byte', 'note on', 'sequencing', 'ticks'],
    difficulty: 'foundation',
};

export default pianoRoll;
