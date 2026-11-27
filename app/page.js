// The Explore home (8 Nov 2026). The front door's menu sends "Explore" here, so this
// page now wears the Music Tech Studio design system (paper, Bebas Neue, Public Sans,
// Explore teal for wayfinding) instead of the old "Interactive Resources" hub look.
// Every tool is listed under its topic, so nothing hides behind a hover, and a topic
// without a bench yet is named once, still linked.

import { getAllTopicDefs } from '@/lib/topics';
import { getResource } from '@/lib/resources';
import { chapterUrl, kindOf, isHandsOn } from '@/lib/chapters';
import CommandPalette from '@/components/CommandPalette';
import s from './explore-home.module.css';

export const metadata = {
    title: { absolute: 'Explore: benches you play | Music Tech Studio' },
    description: 'Benches for the Edexcel A level in Music Technology: machines drawn on screen that you play, every control making a sound.',
    alternates: { canonical: '/' },
};

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
        .filter((r) => r && !r.hidden && isHandsOn(r))
        .sort((a, b) => kindOf(a).order - kindOf(b).order);
}

function Topic({ topic }) {
    const tools = toolsFor(topic);
    const chapter = chapterUrl(topic.id);
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
                    <p className={s.read}><a href={chapter}>Read the chapters</a> first, free.</p>
                ) : null}
                <ul className={s.tools}>
                    {tools.map((r) => {
                        return (
                            <li key={r.id}>
                                <a href={`/${r.id}`}>
                                    <span className={s.toolName}>{r.title}</span>
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
                    <div>
                        <h1 className={`${s.display} ${s.title}`}>Turn a control.<br />Hear it change.</h1>
                        <p className={s.lede}>
                            {toolCount} benches on {withTools.length} topics of the Edexcel A level. A bench is the machine
                            drawn the way the paper draws it, and you play it: every control makes a sound, and the drawing
                            moves with it.
                        </p>
                        <CommandPalette />
                    </div>
                    {/* one real bench on the right, as Figures and Lessons show their real thing (Mike, 24 Nov 2026) */}
                    <a className={s.shot} href="/dynamics-bench">
                        <img src="/explore-hero-dynamics.webp" width="1600" height="828"
                            alt="The Dynamics bench: a compressor's transfer curve beside two bars of drums, with the threshold, ratio, attack and release knobs below" />
                        <span className={s.shotCap}><span>Dynamics bench, 1.9</span><span className={s.shotGo}>Play it</span></span>
                    </a>
                </header>

                {AREAS.map((area) => {
                    const list = withTools.filter(area.test);
                    if (!list.length) return null;
                    return (
                        <section key={area.num} className={s.area} aria-labelledby={`area-${area.num}`}>
                            {/* header.bar + .inner: the ball (public/ball.js) moves this clear of itself while it sticks */}
                            <header className={`${s.areaHead} bar`}>
                                <div className={`${s.areaInner} inner`}>
                                    <span className={`${s.display} ${s.areaNum}`} aria-hidden="true">{area.num}</span>
                                    <h2 id={`area-${area.num}`} className={`${s.display} ${s.areaName}`}>{area.name}</h2>
                                    <span className={s.areaCount}>{list.length} {list.length === 1 ? 'topic' : 'topics'}</span>
                                </div>
                            </header>
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
                                        <a href={chapterUrl(t.id) || `/topic/${t.id}`}>
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
