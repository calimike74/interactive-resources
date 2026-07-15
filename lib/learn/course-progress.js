// Chapter completion progress, stored per-topic in localStorage.
// storage is injectable for tests; defaults to window.localStorage and
// no-ops when unavailable (SSR / private browsing).

function defaultStorage() {
    if (typeof window === 'undefined') return null;
    try { return window.localStorage; } catch { return null; }
}

const key = (topicId) => `learn-progress:${topicId}`;

export function getProgress(topicId, storage = defaultStorage()) {
    if (!storage) return {};
    try {
        return JSON.parse(storage.getItem(key(topicId))) || {};
    } catch {
        return {};
    }
}

export function markChapterComplete(topicId, chapterId, storage = defaultStorage()) {
    if (!storage) return;
    const progress = getProgress(topicId, storage);
    if (progress[chapterId] === 'completed') return;
    progress[chapterId] = 'completed';
    try { storage.setItem(key(topicId), JSON.stringify(progress)); } catch { /* quota / private mode */ }
}

export function firstIncompleteChapter(topicId, chapterIds, storage = defaultStorage()) {
    const progress = getProgress(topicId, storage);
    return chapterIds.find(id => progress[id] !== 'completed') ?? null;
}
