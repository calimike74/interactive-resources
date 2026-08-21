'use client';

import { useCallback, useState } from 'react';
import styles from './bench.module.css';
import { benchSans } from './fonts';
import { BenchDrawer, DrawerHandle } from './BenchDrawer';
import { ModeToggle } from './BenchBits';

// The viewport grid every bench lives in: header strip / stage + console /
// transport, with the drawer handle down the right edge. The frame owns
// the way home (the site's single back link, see lib/studio-return.js),
// the topic code, the bench's name, its one orientation sentence, the
// Student / Teacher toggle and the drawer. Benches fill the three slots.
//
// Laws it enforces by construction (BENCH-STANDARD §3): one viewport, no
// hero, controls beside the stage, white plate on the greige ground, the
// member room's tokens.

export default function BenchFrame({
    code,
    title,
    orientation,
    back,
    mode,
    onMode,
    stage,
    console: consoleSlot,
    transport,
    drawerTabs,
    synthesis = false,
}) {
    const [drawer, setDrawer] = useState(null);
    const [opener, setOpener] = useState(null);
    const onDrawer = useCallback((id, el) => { setDrawer(id); if (el) setOpener(el); }, []);

    return (
        <div className={`${styles.scope} ${benchSans.variable}`} data-bench-frame data-synthesis={synthesis ? 'true' : undefined}>
            <div className={styles.frame}>
                <header className={styles.head}>
                    {back ? <a className={styles.back} href={back.href}>{back.label}</a> : null}
                    <span className={styles.code}>{code}</span>
                    <span className={styles.title}>{title}</span>
                    <span className={styles.orient}>{orientation}</span>
                    <div className={styles.headRight}>
                        <ModeToggle mode={mode} onChange={onMode} />
                    </div>
                </header>
                <section className={styles.stage} aria-label="Stage">{stage}</section>
                <section className={styles.console} aria-label="Controls">{consoleSlot}</section>
                {transport}
                <DrawerHandle tabs={drawerTabs} open={drawer} onChange={onDrawer} />
            </div>
            <BenchDrawer tabs={drawerTabs} open={drawer} onChange={onDrawer} opener={opener} />
        </div>
    );
}
