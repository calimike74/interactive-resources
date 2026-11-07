'use client';

import { useCallback, useState } from 'react';
import styles from './bench.module.css';
import { benchSans, benchSerif } from './fonts';
import { BenchDrawer, DrawerHandle } from './BenchDrawer';
import { DepthToggle, ModeToggle } from './BenchBits';

// The viewport grid every bench lives in (Mike's pick from Claude Design,
// 21 Aug 2026, "3A the explorable bench" with 3B's depth switch):
//
//   head      : the way home, topic code, the bench's name, Core / A-level /
//               Extension, Student / Teacher
//   stage     : the dark panel the picture is sized to, with the compact
//               drawer tabs down its right edge
//   bar       : presets, the bench's one line to the student, More
//   console   : the band of instruments beneath
//
// The frame owns the way home (lib/studio-return.js), the two toggles and
// the drawer. Benches fill the slots. The orientation sentence is the
// bench's to place (on the stage, where the eye is), so the frame only
// receives it for the record.
//
// Laws it enforces by construction (BENCH-STANDARD §3): one viewport, no
// hero, nothing hidden behind a tab, the member room's tokens.

// The topic code in the head opens that topic's free chapters (Gemini review, 7 Nov:
// "1.9 Dynamics" was plain text, so a student could not get from the bench to the reading).
const MEMBER_TOPICS = 'https://member.musictechstudio.co.uk/member/topics/';
const CODE_TOPIC = {
    '1.3 Synthesis': 'synthesis', '1.5 Sequencing': 'sequencing', '1.6 Editing': 'audio-editing',
    '1.8 Automation': 'automation', '1.9 Dynamics': 'dynamic-processing', '1.11 EQ': 'eq-filters',
    '1.12 Delay': 'delay', '1.12 Reverb': 'reverb', '1.13 Balance': 'balance-blend',
    '2.1 Acoustics': 'acoustics', '2.4 Digital and Analogue': 'digital-analogue', '2.5 Numeracy': 'numeracy',
};

export default function BenchFrame({
    code,
    title,
    orientation,
    back,
    mode,
    onMode,
    depth,
    onDepth,
    stage,
    bar,
    more,
    console: consoleSlot,
    drawerTabs,
    synthesis = false,
}) {
    const [drawer, setDrawer] = useState(null);
    const [opener, setOpener] = useState(null);
    const onDrawer = useCallback((id, el) => { setDrawer(id); if (el) setOpener(el); }, []);

    return (
        <div className={`${styles.scope} ${benchSans.variable} ${benchSerif.variable}`} data-bench-frame data-mode={mode} data-depth={depth} data-synthesis={synthesis ? 'true' : undefined}>
            <div className={styles.frame}>
                <header className={styles.head}>
                    {back ? <a className={styles.back} href={back.href}>{back.label}</a> : null}
                    {CODE_TOPIC[code]
                        ? <a className={styles.code} href={MEMBER_TOPICS + CODE_TOPIC[code]} title="Read this topic's chapters">{code}</a>
                        : <span className={styles.code}>{code}</span>}
                    <span className={styles.title}>{title}</span>
                    <div className={styles.headRight}>
                        {mode === 'teacher' ? <span className={styles.hint}><span className={styles.hintMouse}>hover</span><span className={styles.hintTouch}>tap</span> anything for the why</span> : null}
                        <DepthToggle depth={depth} onChange={onDepth} />
                        <ModeToggle mode={mode} onChange={onMode} />
                    </div>
                </header>
                <section className={styles.stage} aria-label="Stage">{stage}</section>
                <DrawerHandle tabs={drawerTabs} open={drawer} onChange={onDrawer} />
                <div className={styles.bar}>
                    <div className={styles.barRow}>{bar}</div>
                    {more ? <div className={styles.moreRow} data-more-row>{more}</div> : null}
                </div>
                <section className={styles.console} aria-label="Controls">{consoleSlot}</section>
            </div>
            <BenchDrawer tabs={drawerTabs} open={drawer} onChange={onDrawer} opener={opener} />
        </div>
    );
}
