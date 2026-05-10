'use client';

const COOKIE_NAME = 'mts_consent';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function domainAttr() {
    if (typeof window === 'undefined') return '';
    const host = window.location.hostname;
    if (host.endsWith('musictechstudio.co.uk')) return '; domain=.musictechstudio.co.uk';
    if (host.endsWith('mikelehnert.co.uk')) return '; domain=.mikelehnert.co.uk';
    return '';
}

export function getConsent() {
    if (typeof document === 'undefined') return null;
    const m = document.cookie.match(new RegExp(`(^|;\\s*)${COOKIE_NAME}=([^;]+)`));
    return m ? m[2] : null;
}

export function setConsent(value) {
    if (typeof document === 'undefined') return;
    if (value !== 'all' && value !== 'essential') return;
    document.cookie = `${COOKIE_NAME}=${value}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax${domainAttr()}`;
    window.dispatchEvent(new CustomEvent('mts:consent', { detail: value }));
}

export function clearConsent() {
    if (typeof document === 'undefined') return;
    document.cookie = `${COOKIE_NAME}=; path=/; max-age=0${domainAttr()}`;
    window.dispatchEvent(new CustomEvent('mts:consent', { detail: null }));
}

export function onConsentChange(handler) {
    if (typeof window === 'undefined') return () => {};
    const wrapped = (e) => handler(e.detail);
    window.addEventListener('mts:consent', wrapped);
    return () => window.removeEventListener('mts:consent', wrapped);
}

export function openCookiePreferences() {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('mts:open-cookie-preferences'));
}
