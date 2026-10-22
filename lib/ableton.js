// Ableton's branding guidelines allow screenshots of Live in teaching materials, paid ones included, when they are
// credited and the site says it is independent (their reply, 22 Oct 2026). Every picture in /images/explorers/ableton-*
// is a Live screenshot, so both explorers credit it under the picture.
export const LIVE_SCREENSHOT_CREDIT = 'Screenshot of Ableton Live, used for teaching. Ableton and Live are trademarks of Ableton AG.';
export const TRADEMARK_LINE = 'Ableton and Live are trademarks of Ableton AG. Music Tech Studio is independent and is not affiliated with, authorised, sponsored or endorsed by Ableton AG.';
export const isLiveScreenshot = (src) => typeof src === 'string' && src.startsWith('/images/explorers/ableton-');
