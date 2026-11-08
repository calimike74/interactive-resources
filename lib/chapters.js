// Explore topic id -> its free chapter on the member site (as the front door's /topics links them).
export const MEMBER_TOPICS = 'https://member.musictechstudio.co.uk/member/topics/';

const CHAPTER = {
    'software-hardware': 'software-hardware', microphones: 'microphones', synthesis: 'synthesis',
    sampling: 'sampling', midi: 'sequencing', 'audio-editing': 'audio-editing',
    'pitch-rhythm-correction': 'pitch-correction', automation: 'automation', dynamics: 'dynamic-processing',
    stereo: 'stereo', eq: 'eq-filters', delay: 'delay', distortion: 'distortion', modulation: 'modulation',
    reverb: 'reverb', 'balance-and-blend': 'balance-blend', mastering: 'mastering', acoustics: 'acoustics',
    'monitor-speakers': 'monitor-speakers', 'leads-and-signals': 'signals', 'digital-analogue': 'digital-analogue',
    numeracy: 'numeracy', levels: 'levels',
};

export function chapterUrl(topicId) {
    return CHAPTER[topicId] ? MEMBER_TOPICS + CHAPTER[topicId] : null;
}

// What kind of thing a tool is, in words. Benches first, quizzes last.
export const KINDS = {
    bench: { label: 'Bench', order: 0 },
    sandbox: { label: 'Explorer', order: 1 },
    interface: { label: 'In Live', order: 2 },
    practice: { label: 'Practice', order: 3 },
    retrieval: { label: 'Quiz', order: 4 },
};
export const kindOf = (r) => KINDS[r.kind] || KINDS.sandbox;
