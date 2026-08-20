'use client';

import { useEffect, useState } from 'react';
import { getAllTopicDefs } from '@/lib/topics';

/**
 * The thread back to Music Tech Studio, and the single source of truth for
 * where "back" goes from any page on this site.
 *
 * Mike, 2026-08-20, walking Explore as a student: a bench opened from a
 * topic's Explore band used to arrive wearing this site's own furniture —
 * a Home crumb to the Interactive Resources front page and a back-link to
 * its topic index. Two taps and a member is browsing a second, older
 * product nobody meant to sell them. This site is being retired; nothing
 * should invite a student into it.
 *
 * So resource pages now carry exactly one way out, and it leads home to the
 * studio (for a member) or to the front door (for anyone else). The rest of
 * this site is still reachable by typing a URL — retiring it is not the same
 * as sealing it.
 */

export const STUDIO_URL = 'https://member.musictechstudio.co.uk';
export const FRONT_DOOR_URL = 'https://musictechstudio.co.uk';

/** Set when a member arrives from the studio; per-tab, see useStudioArrival. */
export const STUDIO_KEY = 'mts-from-studio';
/** The member topic slug they left from, when the link named one (?back=). */
export const STUDIO_BACK_KEY = 'mts-studio-back';
/** Set when the member dismisses the rail. Deliberately NOT the same key:
 *  hiding the rail must not also forget that this tab belongs to a member,
 *  or the next bench they open would offer them the public front door. */
export const RAIL_DISMISSED_KEY = 'mts-rail-dismissed';

/**
 * This site's topic ids → the member course's topic slugs. A FALLBACK only:
 * member links name their origin with ?back=, which is exact. Inference is
 * not — the member course's Reverb topic sends students to a bench this site
 * files under Acoustics, so guessing from the registry would land a reverb
 * student on the wrong topic page. Topics with no member page (general,
 * recording) are simply absent and fall back to the topic map.
 */
export const MEMBER_SLUGS = {
    delay: 'delay',
    'digital-analogue': 'digital-analogue',
    distortion: 'distortion',
    dynamics: 'dynamic-processing',
    eq: 'eq-filters',
    'leads-and-signals': 'signals',
    midi: 'sequencing',
    numeracy: 'numeracy',
    reverb: 'reverb',
    sampling: 'sampling',
    synthesis: 'synthesis',
};

/**
 * Which topic is this page about? Topic routes name it directly; resource
 * pages are looked up through the topic registry's resourceIds.
 */
export function topicIdFromPath(pathname) {
    const parts = (pathname || '').replace(/\.html$/, '').split('/').filter(Boolean);
    if (parts.length === 2 && ['topic', 'learn', 'revise'].includes(parts[0])) {
        return parts[1];
    }
    if (parts.length === 1) {
        const hit = getAllTopicDefs().find((t) => t.resourceIds.includes(parts[0]));
        return hit ? hit.id : null;
    }
    return null;
}

/**
 * A member topic slug is a route segment on the member site and nothing else.
 * Validated rather than trusted: `back` arrives on the URL, and the host it
 * is pasted onto is fixed above, so the worst a hostile value can do is name
 * a member page that does not exist.
 */
const SLUG_RE = /^[a-z0-9-]{1,40}$/;

/**
 * The member's own page for this topic, at the Explore band they left from.
 * `backSlug` is what the link said; the registry lookup is the fallback for
 * links that predate ?back= and for this site's own topic pages.
 */
export function memberTopicHref(pathname, backSlug) {
    const named = backSlug && SLUG_RE.test(backSlug) ? backSlug : null;
    const topicId = named ? null : topicIdFromPath(pathname);
    const slug = named || (topicId ? MEMBER_SLUGS[topicId] : null);
    return slug ? `${STUDIO_URL}/member/topics/${slug}#explore` : `${STUDIO_URL}/member/map`;
}

/**
 * Did this tab arrive from the studio?
 *
 * Members carry ?from=studio on the URL (appended in the member site's
 * lib/revision/resource-links.js). The marker is captured into sessionStorage
 * — per-tab, so it follows the member around for this visit and a fresh
 * public visit never sees it — and then stripped from the address bar so a
 * copied or shared link doesn't spread it.
 *
 * Safe to call from more than one component: whichever effect runs first
 * captures and strips, the other reads the stored flag.
 */
export function useStudioArrival() {
    const [arrival, setArrival] = useState({
        fromStudio: false,
        backSlug: null,
        railDismissed: false,
    });

    useEffect(() => {
        try {
            const url = new URL(window.location.href);
            if (url.searchParams.get('from') === 'studio') {
                sessionStorage.setItem(STUDIO_KEY, '1');
                const back = url.searchParams.get('back');
                if (back && SLUG_RE.test(back)) sessionStorage.setItem(STUDIO_BACK_KEY, back);
                url.searchParams.delete('from');
                url.searchParams.delete('back');
                window.history.replaceState(null, '', url.pathname + url.search + url.hash);
            }
            setArrival({
                fromStudio: sessionStorage.getItem(STUDIO_KEY) === '1',
                backSlug: sessionStorage.getItem(STUDIO_BACK_KEY),
                railDismissed: sessionStorage.getItem(RAIL_DISMISSED_KEY) === '1',
            });
        } catch {
            /* storage unavailable — treat as a public visit */
        }
    }, []);

    return arrival;
}

/**
 * Where "back" goes from `pathname`, and what the button should say.
 *
 * A member goes home to the topic they left. Everyone else goes to the front
 * door: a stranger who found a free bench through search gets one clear way
 * on, and still no way into the retired site's index.
 *
 * Renders the public wording until the arrival effect has run, so the button
 * never flashes a members-only destination at a stranger.
 */
export function useStudioReturn(pathname) {
    const { fromStudio, backSlug } = useStudioArrival();

    return fromStudio
        ? { fromStudio: true, href: memberTopicHref(pathname, backSlug), label: '← Back to your studio' }
        : { fromStudio: false, href: FRONT_DOOR_URL, label: '← Music Tech Studio' };
}
