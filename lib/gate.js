/**
 * September soft gate — a classroom passcode lock for the non-free
 * interactives on this site.
 *
 * WHY THIS IS A CLIENT-SIDE CHECK, NOT AUTHENTICATION
 *
 * next.config.mjs sets `output: 'export'` — this site is a static export.
 * There is no server at request time: no server actions, no route handlers,
 * no middleware, no httpOnly cookies. Everything Vercel serves is a file
 * that was already rendered at build time, so there is nowhere to run a
 * real server-side check when a page loads.
 *
 * What follows is therefore a classroom courtesy lock, not a security
 * boundary: the expected passcode digest ships inside the JavaScript
 * bundle, and a student who opens devtools can read GATE_DIGEST directly,
 * or simply call `localStorage.setItem(...)` with a forged token. That is
 * an accepted trade-off for a low-value shared classroom passcode — the
 * alternative is moving the site off static export, which is Mike's call,
 * not this file's. What this file does guarantee (see tests/gate.test.mjs)
 * is that the digest comparison and token derivation are correct, and that
 * the gate stays inert unless BOTH switches below are deliberately set.
 *
 * TWO INDEPENDENT SWITCHES — the gate only ever engages if both are true:
 *
 *  1. NEXT_PUBLIC_GATE_ENABLED=true   (a flag Mike sets in Vercel)
 *  2. NEXT_PUBLIC_GATE_DIGEST is set  (a passcode Mike has chosen)
 *
 * Off by default: with no env vars set at all, both read as falsy and every
 * resource behaves exactly as it does today. September flow: Mike generates
 * a digest for the term's passcode, sets both env vars in Vercel, redeploys.
 * Before Sherborne teaching resumes, not during — see the plan doc.
 *
 * To generate a digest for a chosen passcode, open a browser console on any
 * page of this site (or Node 20+, which has WebCrypto as a global) and run:
 *
 *   async function digest(passcode) {
 *     const data = new TextEncoder().encode('mts-resources-gate-2026' + passcode);
 *     const buf = await crypto.subtle.digest('SHA-256', data);
 *     return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
 *   }
 *   await digest('the-chosen-passcode');
 *
 * That must match SALT below — keep the two in step if SALT ever changes.
 */

import { isResourceFree } from './access.js';

/** Not a secret — just stops a leaked digest being a bare SHA-256(passcode)
 *  that a rainbow table could reverse in seconds. Changing this invalidates
 *  every previously-generated GATE_DIGEST. */
export const SALT = 'mts-resources-gate-2026';

/** Bump this to force every browser to re-enter the passcode on next visit,
 *  independent of SALT — use it if the passcode changes mid-term. */
const TOKEN_VERSION = 'v1';

export const GATE_COOKIE_NAME = 'mts_gate';
export const GATE_STORAGE_KEY = 'mts_gate_token';
export const GATE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

/**
 * Read live from process.env on every call rather than freezing the value
 * at module load. Two reasons: it keeps this file testable without module
 * cache tricks (a test just sets process.env and calls the function), and
 * it matches how Next.js actually handles NEXT_PUBLIC_* — the bundler
 * inlines the literal `process.env.NEXT_PUBLIC_*` text wherever it appears
 * in code it compiles, function wrapper or not, so this is still baked into
 * the static build exactly as the plan requires.
 */
export function isGateEnabled() {
    return process.env.NEXT_PUBLIC_GATE_ENABLED === 'true';
}

export function getGateDigest() {
    return process.env.NEXT_PUBLIC_GATE_DIGEST || '';
}

/** Both switches must be set. A flag flip alone, or a digest alone, never
 *  locks a single student out by accident. */
export function isGateActive() {
    return isGateEnabled() && getGateDigest().length > 0;
}

/** Is this resource exempt from the gate regardless of gate state?
 *  Delegates to lib/access.js — the free list has exactly one home, and
 *  this file does not duplicate or override it. */
export function isResourceExempt(resourceId) {
    return isResourceFree(resourceId);
}

async function sha256Hex(text, subtle) {
    const bytes = new TextEncoder().encode(text);
    const hashBuffer = await subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * Hash a candidate passcode the same way GATE_DIGEST was generated.
 * `subtle` is injected — window.crypto.subtle in the browser, node:crypto's
 * webcrypto.subtle in tests — so this needs no DOM to run or test.
 */
export async function digestPasscode(passcode, subtle) {
    return sha256Hex(SALT + passcode, subtle);
}

/** Does a candidate passcode match the configured digest? Gate-inert always
 *  passes, since there is nothing configured to check against. */
export async function checkPasscode(passcode, subtle) {
    if (!isGateActive()) return true;
    if (!passcode) return false;
    const digest = await digestPasscode(passcode, subtle);
    return digest === getGateDigest();
}

/**
 * The token stored client-side to remember a correct entry. Derived from
 * the digest and a version string — never the passcode itself, and never
 * the raw digest reused verbatim, so a leaked token doesn't double as a
 * leaked digest.
 */
export async function deriveToken(subtle) {
    return sha256Hex(`${getGateDigest()}:${TOKEN_VERSION}`, subtle);
}

/** Does a stored token match what the current digest + version would
 *  produce? Gate-inert always passes. */
export async function isTokenValid(token, subtle) {
    if (!isGateActive()) return true;
    if (!token) return false;
    const expected = await deriveToken(subtle);
    return token === expected;
}
