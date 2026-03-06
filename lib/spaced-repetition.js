/**
 * Spaced repetition question prioritisation.
 * Pure function — takes questions + performance data, returns reordered array.
 */

const STALE_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

/**
 * Reorder questions based on past performance.
 *
 * Priority buckets (shown first → last):
 * 1. Wrong last time — most urgent to re-learn
 * 2. Never attempted — unknown gaps
 * 3. Correct but stale (>7 days) — spaced repetition decay
 * 4. Recently correct — lowest priority
 *
 * Within each bucket, questions are shuffled randomly.
 *
 * @param {Array} questions - Array of question objects with .id
 * @param {Map} performanceMap - Map of questionId → { lastCorrect, lastAttemptedAt, timesWrong, timesCorrect }
 * @returns {Array} Reordered questions array
 */
export function prioritiseQuestions(questions, performanceMap) {
    if (!performanceMap || performanceMap.size === 0) {
        return shuffle(questions);
    }

    const now = Date.now();
    const wrongLastTime = [];
    const neverAttempted = [];
    const correctButStale = [];
    const recentlyCorrect = [];

    questions.forEach(q => {
        const perf = performanceMap.get(q.id);

        if (!perf) {
            neverAttempted.push(q);
        } else if (perf.lastCorrect === false) {
            wrongLastTime.push(q);
        } else if (perf.lastCorrect === true) {
            const lastDate = new Date(perf.lastAttemptedAt).getTime();
            if (now - lastDate > STALE_THRESHOLD_MS) {
                correctButStale.push(q);
            } else {
                recentlyCorrect.push(q);
            }
        } else {
            // null (self-assessed) — treat as never attempted
            neverAttempted.push(q);
        }
    });

    return [
        ...shuffle(wrongLastTime),
        ...shuffle(neverAttempted),
        ...shuffle(correctButStale),
        ...shuffle(recentlyCorrect),
    ];
}
