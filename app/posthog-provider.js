'use client';
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import { useEffect, useState, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { getConsent, onConsentChange } from '@/lib/consent';

function PostHogPageview() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const prevPath = useRef(null);

    useEffect(() => {
        const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
        if (prevPath.current !== url) {
            posthog.capture('$pageview', { $current_url: window.location.origin + url });
            prevPath.current = url;
        }
    }, [pathname, searchParams]);

    return null;
}

export function PHProvider({ children }) {
    const [ready, setReady] = useState(false);
    const initialised = useRef(false);

    useEffect(() => {
        const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
        if (!key) return;

        const init = () => {
            if (initialised.current) return;
            initialised.current = true;
            posthog.init(key, {
                api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com',
                capture_pageview: false,
                capture_pageleave: true,
                cross_subdomain_cookie: true,
                session_recording: {
                    maskAllInputs: true,
                    maskTextSelector: '[data-student]',
                },
                loaded: () => {
                    posthog.capture('posthog_heartbeat', { host: window.location.host });
                    setReady(true);
                },
            });
        };

        if (getConsent() === 'all') init();

        const off = onConsentChange((value) => {
            if (value === 'all') {
                if (!initialised.current) init();
                else if (posthog.opt_in_capturing) posthog.opt_in_capturing();
            } else if (value === 'essential' && initialised.current) {
                if (posthog.opt_out_capturing) posthog.opt_out_capturing();
                if (posthog.reset) posthog.reset();
            }
        });

        return off;
    }, []);

    if (!ready) return <>{children}</>;
    return (
        <PostHogProvider client={posthog}>
            <PostHogPageview />
            {children}
        </PostHogProvider>
    );
}
