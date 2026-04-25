'use client';
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import { useEffect, useState, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

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

    useEffect(() => {
        const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
        if (!key) return;

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
    }, []);

    if (!ready) return <>{children}</>;
    return (
        <PostHogProvider client={posthog}>
            <PostHogPageview />
            {children}
        </PostHogProvider>
    );
}
