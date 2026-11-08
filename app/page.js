// The Explore home (8 Nov 2026). The front door's menu sends "Explore" here, so this
// page now wears the Music Tech Studio design system (paper, Bebas Neue, Public Sans,
// Explore teal for wayfinding) instead of the old "Interactive Resources" hub look.
// Every tool is listed under its topic, so nothing hides behind a hover, and a topic
// without a bench yet is named once, still linked.

import { getAllTopicDefs } from '@/lib/topics';
import { getResource } from '@/lib/resources';
import CommandPalette from '@/components/CommandPalette';
import s from './explore-home.module.css';

export const metadata = {
    title: { absolute: 'Explore: benches you play | Music Tech Studio' },
    description: 'Benches for every topic of the Edexcel A level in Music Technology: machines drawn on screen that you play, with the real devices in Live and quick quizzes beside them.',
    alternates: { canonical: '/' },
};

const MEMBER_TOPICS = 'https://member.musictechstudio.co.uk/member/topics/';

// resources topic id -> member chapter slug (as the front door's /topics links them)
const CHAPTER = {
    'software-hardware': 'software-hardware', microphones: 'microphones', synthesis: 'synthesis',
    sampling: 'sampling', midi: 'sequencing', 'audio-editing': 'audio-editing',
    'pitch-rhythm-correction': 'pitch-correction', automation: 'automation', dynamics: 'dynamic-processing',
    stereo: 'stereo', eq: 'eq-filters', delay: 'delay', distortion: 'distortion', modulation: 'modulation',
    reverb: 'reverb', 'balance-and-blend': 'balance-blend', mastering: 'mastering', acoustics: 'acoustics',
    'monitor-speakers': 'monitor-speakers', 'leads-and-signals': 'signals', 'digital-analogue': 'digital-analogue',
    numeracy: 'numeracy', levels: 'levels',
};

// What kind of thing a tool is, in words. Benches first, quizzes last.
const KINDS = {
    bench: { label: 'Bench', order: 0 },
    sandbox: { label: 'Explorer', order: 1 },
    interface: { label: 'In Live', order: 2 },
    practice: { label: 'Practice', order: 3 },
    retrieval: { label: 'Quiz', order: 4 },
};
const kindOf = (r) => KINDS[r.kind] || KINDS.sandbox;

const AREAS = [
    { num: '1', name: 'Making and shaping sound', test: (t) => t.specRef.startsWith('1.') && t.id !== 'general' },
    { num: '2', name: 'How sound works', test: (t) => t.specRef.startsWith('2.') },
    { num: '+', name: 'Across every topic', test: (t) => t.id === 'general' },
];

const ROOMS = [
    { name: 'The Map Room', href: '/map-room', desc: 'The whole of Component 4 drawn as one map, every idea in its place.', members: true },
    { name: 'The Library', href: 'https://member.musictechstudio.co.uk/the-library', desc: 'Every book behind the course, with the reading list as a shelf.' },
    { name: 'The Reading Room', href: 'https://member.musictechstudio.co.uk/reading-room', desc: 'Take a volume down from the shelf and turn it over.' },
];

const BOOKS = [
    { name: 'The Story of the Studio', href: '/story-of-the-studio', desc: 'How recording grew up, 1930 to now. 82 pages, free.' },
    { name: 'The Story of Synthesis', href: '/story-of-synthesis', desc: 'A century of electronic sound. 69 pages, free.' },
    { name: 'The History of Recorded Music', href: '/recording-history', desc: 'Five eras as a listening playlist, with every "first" checked.' },
];

function toolsFor(topic) {
    return topic.resourceIds
        .map((id) => getResource(id))
        .filter((r) => r && !r.hidden)
        .sort((a, b) => kindOf(a).order - kindOf(b).order);
}

function Topic({ topic }) {
    const tools = toolsFor(topic);
    const chapter = CHAPTER[topic.id];
    return (
        <li className={s.topic}>
            <a className={s.pic} href={`/topic/${topic.id}`} tabIndex={-1} aria-hidden="true">
                <img src={`/explore/${topic.id}.webp`} alt="" width="132" height="132" loading="lazy" />
            </a>
            <div>
                <div className={s.topicHead}>
                    <h3 className={s.topicName}><a href={`/topic/${topic.id}`}>{topic.name}</a></h3>
                    <span className={s.spec}>{topic.specRef}</span>
                </div>
                {chapter ? (
                    <p className={s.read}><a href={MEMBER_TOPICS + chapter}>Read the chapters</a> first, free.</p>
                ) : null}
                <ul className={s.tools}>
                    {tools.map((r) => {
                        const k = kindOf(r);
                        return (
                            <li key={r.id}>
                                <a href={`/${r.id}`}>
                                    <span className={s.toolName}>{r.title}</span>
                                    <span className={`${s.kind} ${k.label === 'Bench' ? s.kindBench : ''}`}>{k.label}</span>
                                </a>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </li>
    );
}

export default function ExploreHome() {
    const topics = getAllTopicDefs();
    const withTools = topics.filter((t) => toolsFor(t).length > 0);
    const without = topics.filter((t) => toolsFor(t).length === 0);
    const toolCount = withTools.reduce((n, t) => n + toolsFor(t).length, 0);

    return (
        <div className={s.page}>
            <main className={s.wrap}>
                <header className={s.hero}>
                    <h1 className={`${s.display} ${s.title}`}>Turn a control.<br />Hear it change.</h1>
                    <div>
                        <p className={s.lede}>
                            {toolCount} tools on {withTools.length} topics of the Edexcel A level. A bench is the machine
                            drawn on screen, and you play it: every control makes a sound, and the drawing moves with it.
                        </p>
                        <ul className={s.key}>
                            <li><span className={`${s.kind} ${s.kindBench}`}>Bench</span><span><b>A machine to play</b>, drawn the way the paper draws it</span></li>
                            <li><span className={s.kind}>Explorer</span><span><b>One idea</b> to try out</span></li>
                            <li><span className={s.kind}>In Live</span><span><b>The real device</b> in Ableton Live, control by control</span></li>
                            <li><span className={s.kind}>Quiz</span><span><b>Check yourself</b> in a few minutes</span></li>
                        </ul>
                        <CommandPalette />
                    </div>
                </header>

                {AREAS.map((area) => {
                    const list = withTools.filter(area.test);
                    if (!list.length) return null;
                    return (
                        <section key={area.num} className={s.area} aria-labelledby={`area-${area.num}`}>
                            <div className={s.areaHead}>
                                <span className={`${s.display} ${s.areaNum}`} aria-hidden="true">{area.num}</span>
                                <h2 id={`area-${area.num}`} className={`${s.display} ${s.areaName}`}>{area.name}</h2>
                                <span className={s.areaCount}>{list.length} {list.length === 1 ? 'topic' : 'topics'}</span>
                            </div>
                            <ol className={s.topics}>
                                {list.map((t) => <Topic key={t.id} topic={t} />)}
                            </ol>
                        </section>
                    );
                })}

                {without.length ? (
                    <section className={s.coming} aria-labelledby="coming-h">
                        <h2 id="coming-h" className={`${s.display} ${s.comingHead}`}>Benches coming</h2>
                        <div>
                            <p className={s.comingText}>These topics have no bench yet. Their chapters are already free to read.</p>
                            <ul className={s.comingList}>
                                {without.map((t) => (
                                    <li key={t.id}>
                                        <a href={CHAPTER[t.id] ? MEMBER_TOPICS + CHAPTER[t.id] : `/topic/${t.id}`}>
                                            {t.name} <span className={s.spec}>{t.specRef}</span>
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </section>
                ) : null}

                <div className={s.also}>
                    <section aria-labelledby="rooms-h">
                        <h2 id="rooms-h" className={`${s.display} ${s.alsoHead}`}>More rooms</h2>
                        <ul className={s.alsoList}>
                            {ROOMS.map((r) => (
                                <li key={r.name}>
                                    <a href={r.href}>{r.name}</a>
                                    {r.members ? <span className={s.members}>For members</span> : null}
                                    <p>{r.desc}</p>
                                </li>
                            ))}
                        </ul>
                    </section>
                    <section aria-labelledby="books-h">
                        <h2 id="books-h" className={`${s.display} ${s.alsoHead}`}>Free books</h2>
                        <ul className={s.alsoList}>
                            {BOOKS.map((b) => (
                                <li key={b.name}>
                                    <a href={b.href}>{b.name}</a>
                                    <p>{b.desc}</p>
                                </li>
                            ))}
                        </ul>
                    </section>
                </div>
            </main>
        </div>
    );
}
