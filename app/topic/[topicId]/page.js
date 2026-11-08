// An Explore topic page (8 Nov 2026), in the Music Tech Studio look to match the Explore
// home: the drawing and the topic name, what the spec asks, every tool on the topic with
// its kind, then the quiz. Replaces the Fraunces italic hero, the glass grid and "C4 · 1.3".
import { notFound } from 'next/navigation';
import { getAllTopicIds, getTopic } from '@/lib/topics';
import { getResource, resourceExists } from '@/lib/resources';
import { hasLearnContent } from '@/lib/learn/topics';
import { hasReviseContent } from '@/lib/questions';
import { chapterUrl, kindOf } from '@/lib/chapters';
import QuizProgress from '@/components/explore/QuizProgress';
import h from '../../explore-home.module.css';
import s from './topic.module.css';

export function generateStaticParams() {
    return getAllTopicIds().map(id => ({ topicId: id }));
}

function toolsFor(topic) {
    return topic.resourceIds
        .filter(id => resourceExists(id))
        .map(id => getResource(id))
        .filter(r => r && !r.hidden)
        .sort((a, b) => kindOf(a).order - kindOf(b).order);
}

export async function generateMetadata({ params }) {
    const { topicId } = await params;
    const topic = getTopic(topicId);
    if (!topic) return { title: 'Topic not found' };

    const hasAnyContent = toolsFor(topic).length > 0 || hasLearnContent(topicId) || hasReviseContent(topicId);
    return {
        title: `${topic.name} (${topic.specRef}): Explore`,
        description: topic.description,
        alternates: { canonical: `/topic/${topicId}` },
        // Placeholder topics have nothing to show yet: keep them out of search indexes
        ...(hasAnyContent ? {} : { robots: { index: false, follow: false } }),
    };
}

export default async function TopicPage({ params }) {
    const { topicId } = await params;
    const topic = getTopic(topicId);
    if (!topic) notFound();

    const tools = toolsFor(topic);
    const chapter = chapterUrl(topic.id);
    const walkthrough = hasLearnContent(topic.id);
    const quiz = hasReviseContent(topic.id);
    const nearest = topic.nearestLiveTopicId ? getTopic(topic.nearestLiveTopicId) : null;
    const spec = topic.specSummary || [];

    return (
        <div className={h.page}>
            <main className={h.wrap}>
                <a className={s.back} href="/">← All of Explore</a>

                <header className={s.hero}>
                    <img className={s.pic} src={`/explore/${topic.id}.webp`} alt="" width="200" height="200" />
                    <div className={s.heroText}>
                        <p className={s.eyebrow}>Explore · Topic {topic.specRef}</p>
                        <h1 className={`${h.display} ${s.title}`}>{topic.name}</h1>
                        <p className={s.lede}>{topic.description}</p>
                        {chapter ? (
                            <p className={s.read}><a href={chapter}>Read the chapters</a> first, free.</p>
                        ) : null}
                    </div>
                </header>

                <div className={s.body}>
                    <section aria-labelledby="tools-h" className={s.main}>
                        <h2 id="tools-h" className={`${h.display} ${s.head}`}>
                            {tools.length ? `${tools.length} ${tools.length === 1 ? 'tool' : 'tools'}` : 'No bench yet'}
                        </h2>
                        {tools.length ? (
                            <ul className={s.tools}>
                                {tools.map(r => {
                                    const k = kindOf(r);
                                    return (
                                        <li key={r.id}>
                                            <a href={`/${r.id}`} className={s.tool}>
                                                <span className={s.toolTop}>
                                                    <span className={s.toolName}>{r.title}</span>
                                                    <span className={`${h.kind} ${k.label === 'Bench' ? h.kindBench : ''}`}>{k.label}</span>
                                                </span>
                                                {r.description ? <span className={s.toolDesc}>{r.description}</span> : null}
                                                {r.estimatedTime ? <span className={s.time}>{r.estimatedTime}</span> : null}
                                            </a>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <p className={s.none}>
                                The tools for this topic are still being built.
                                {chapter ? <> The <a href={chapter}>chapters</a> are already free to read.</> : null}
                                {nearest ? <> Meanwhile, try <a href={`/topic/${nearest.id}`}>{nearest.name}</a>.</> : null}
                            </p>
                        )}

                        {walkthrough || quiz ? (
                            <>
                                <h2 className={`${h.display} ${s.head} ${s.headGap}`}>Check yourself</h2>
                                {quiz ? <QuizProgress topicId={topic.id} /> : null}
                                <ul className={s.tools}>
                                    {walkthrough ? (
                                        <li><a href={`/learn/${topic.id}`} className={s.tool}>
                                            <span className={s.toolTop}><span className={s.toolName}>Walkthrough</span><span className={h.kind}>Step by step</span></span>
                                            <span className={s.toolDesc}>Animated diagrams with a quick question after each step.</span>
                                        </a></li>
                                    ) : null}
                                    {quiz ? (
                                        <>
                                            <li><a href={`/revise/${topic.id}`} className={s.tool}>
                                                <span className={s.toolTop}><span className={s.toolName}>Practice questions</span><span className={h.kind}>Quiz</span></span>
                                                <span className={s.toolDesc}>Multiple choice, calculations and short answers, marked as you go.</span>
                                            </a></li>
                                            <li><a href={`/exam/${topic.id}`} className={s.tool}>
                                                <span className={s.toolTop}><span className={s.toolName}>Exam mode</span><span className={h.kind}>Timed</span></span>
                                                <span className={s.toolDesc}>Every question once, against the clock, with no going back to change an answer.</span>
                                            </a></li>
                                        </>
                                    ) : null}
                                </ul>
                            </>
                        ) : null}
                    </section>

                    {spec.length ? (
                        <aside aria-labelledby="spec-h" className={s.side}>
                            <h2 id="spec-h" className={s.sideHead}>What the spec asks</h2>
                            <ul className={s.spec}>
                                {spec.map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                        </aside>
                    ) : null}
                </div>
            </main>
        </div>
    );
}
