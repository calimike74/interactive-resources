import { test } from 'node:test';
import assert from 'node:assert/strict';
import { safeStudioOrigin, memberTopicHref, STUDIO_URL } from '../lib/studio-return.js';

// The defect this file exists to catch (2026-08-20). The bench's way home
// hard-coded member.musictechstudio.co.uk, but the member area also answers
// on grades.musictechstudio.co.uk — where the school's student token links
// point — and BOTH credentials that open it (the Supabase auth cookie and
// the school pass) are host-only. A Sherborne pass student who opened a
// bench from grades. came back to member., where their cookie does not
// exist, and met the sign-in wall. Same member area, wrong host.

test('a member-area host is kept', () => {
    assert.equal(
        safeStudioOrigin('https://grades.musictechstudio.co.uk'),
        'https://grades.musictechstudio.co.uk',
    );
    assert.equal(
        safeStudioOrigin('https://member.musictechstudio.co.uk'),
        'https://member.musictechstudio.co.uk',
    );
});

test('a dev server is kept, so the flow is walkable locally', () => {
    assert.equal(safeStudioOrigin('http://localhost:3000'), 'http://localhost:3000');
    assert.equal(safeStudioOrigin('http://127.0.0.1:3457'), 'http://127.0.0.1:3457');
});

test('anything else is refused — `home` arrives on the URL and is not trusted', () => {
    for (const hostile of [
        'https://evil.example',
        'https://member.musictechstudio.co.uk.evil.example',
        'https://musictechstudio.co.uk',            // the public front door is not the member area
        'http://member.musictechstudio.co.uk',      // downgrade
        'https://member.musictechstudio.co.uk/member/topics/delay', // an origin, not a URL
        'javascript:alert(1)',
        '//evil.example',
        '',
        null,
        undefined,
    ]) {
        assert.equal(safeStudioOrigin(hostile), null, `should refuse ${hostile}`);
    }
});

test('the way home lands on the host the member came from', () => {
    assert.equal(
        memberTopicHref('/acoustics-flashcards', 'reverb', 'https://grades.musictechstudio.co.uk'),
        'https://grades.musictechstudio.co.uk/member/topics/reverb',
    );
});

test('a refused or absent host falls back to the advertised one', () => {
    assert.equal(
        memberTopicHref('/delay-effects', 'delay', 'https://evil.example'),
        `${STUDIO_URL}/member/topics/delay`,
    );
    assert.equal(
        memberTopicHref('/delay-effects', 'delay', null),
        `${STUDIO_URL}/member/topics/delay`,
    );
});

// Mike, 2026-08-20: "there's no hero on the very top, which there was ...
// make sure that the page is at the very top." The return used to carry
// #explore, which dropped him below the topic's hero.
test('no fragment: a member comes back to the top of their topic page', () => {
    const href = memberTopicHref('/synth-bench', 'synthesis', null);
    assert.ok(!href.includes('#'), `expected no fragment, got ${href}`);
    assert.equal(href, `${STUDIO_URL}/member/topics/synthesis`);
});

// ?back= names the member topic; the registry is only a fallback, and it is
// wrong for reverb on purpose — see the module's own note.
test('the named topic wins over what the bench is filed under', () => {
    assert.equal(
        memberTopicHref('/acoustics-flashcards', 'reverb', null),
        `${STUDIO_URL}/member/topics/reverb`,
    );
    // Without it, the registry files this bench under Acoustics — which is
    // why inference alone is not good enough for a reverb student.
    assert.equal(
        memberTopicHref('/acoustics-flashcards', null, null),
        `${STUDIO_URL}/member/topics/acoustics`,
    );
});
