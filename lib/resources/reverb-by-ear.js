// Reverb by ear (1.12). Built 2026-09-29 for the Upper Sixth: calibration
// ladders, then five blind rounds on the Reverb bench's own vocal, answered
// in the exam's reverb table and marked the way it is marked, then the
// pupil's lean. A `?set=CODE` gives a whole class the same rounds.
// Sound, model and vocal are the Reverb bench's (lib/bench/reverb-model.js);
// the draw and the marking are lib/bench/reverb-by-ear.js.

const reverbByEar = {
    id: 'reverb-by-ear',
    title: 'Reverb by ear',
    description: 'Five blind rounds on a vocal through a real reverb. Name the type, the reverb time and the wet level in the exam\'s own table, press Reveal, and see the true settings, the marks and the tail. After five rounds the page tells you which way you lean: too short or too long, too wet or too dry. Two ladders first tune your ear to reverb time and wet level.',
    topic: '1.12 Reverb',
    relatedTopics: ['2.1 Acoustics'],
    type: 'interactive',
    kind: 'bench',
    icon: '',
    estimatedTime: '10-15 minutes',
    learningObjectives: [
        'Judge a vocal reverb\'s type, reverb time and wet level by ear, the way the listening paper asks',
        'Hear what 1, 2 and 3 seconds of reverb time and 10, 30 and 60 per cent wet sound like on one vocal',
        'Know which way your own judgement leans, and correct for it',
    ],
    component: 'ReverbByEar',
    keywords: ['reverb', 'by ear', 'listening', 'blind', 'reverb time', 'RT60', 'wet level', 'wet', 'dry', 'room', 'hall', 'plate', 'vocal reverb', 'calibration'],
    difficulty: 'foundation',
};

export default reverbByEar;
