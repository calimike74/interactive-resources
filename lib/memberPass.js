/**
 * WO-12 — the interactive-resources half of the "silent member handoff".
 * A signed-in member arrives here with `?pass=<token>` on the URL (minted
 * by grades-dashboard at click-time — see that repo's lib/resourcesPass.js
 * and lib/member/resourcesPass.js). This file redeems that pass against
 * grades-dashboard's verify endpoint. On success, GateKeeper.jsx produces
 * the SAME persisted-unlock token the classroom passcode path already
 * produces (lib/gate.js's own deriveToken) — there is no second unlock
 * state to keep in step with the first.
 *
 * No shared cross-site URL config exists in this repo (the precedent —
 * lib/quiz-persistence.js, ReturnRail.jsx, AuthGate.js on the dashboard
 * side — is a literal https:// string per call site), so this file follows
 * the same convention rather than inventing a new indirection layer.
 */
const GRADES_DASHBOARD_BASE = 'https://grades.musictechstudio.co.uk';

/** Reads ?pass= off a URL string. Null if absent or the string isn't a
 *  parseable URL. */
export function readPassParam(href) {
    try {
        return new URL(href).searchParams.get('pass');
    } catch {
        return null;
    }
}

/** Strips ?pass= from the address bar without a navigation — same
 *  history.replaceState idiom ReturnRail.jsx already uses for ?from=studio,
 *  so a copied/shared link never carries a spent pass. */
export function stripPassParam() {
    if (typeof window === 'undefined') return;
    try {
        const url = new URL(window.location.href);
        url.searchParams.delete('pass');
        window.history.replaceState(null, '', url.pathname + url.search + url.hash);
    } catch {
        // no-op — worst case the spent param lingers visibly in the bar
    }
}

/**
 * Redeems a pass against grades-dashboard. Never throws: any failure
 * (network, malformed response, tampered/expired pass) resolves false —
 * GateKeeper falls through to the normal gate on false, per WO-12's
 * "no error drama".
 */
export async function verifyMemberPass(pass) {
    if (!pass) return false;
    try {
        const res = await fetch(`${GRADES_DASHBOARD_BASE}/api/member/resources-pass?action=verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pass }),
        });
        if (!res.ok) return false;
        const data = await res.json();
        return data?.valid === true;
    } catch {
        return false;
    }
}
