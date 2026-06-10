import { supabase } from './supabase';

/**
 * All read functions call the SECURITY DEFINER RPC `get_my_quiz_responses`
 * which validates the student token server-side and returns only that
 * student's rows. The `quiz_responses` table itself has RLS enabled with
 * no policy, so direct anon SELECT is denied — students can only see their
 * own data via the RPC.
 */
async function fetchMyResponses({ token, topicId = null, limit = null }) {
    if (!token) return [];
    const { data, error } = await supabase.rpc('get_my_quiz_responses', {
        p_token: token,
        p_topic_id: topicId,
        p_limit: limit,
    });
    if (error) {
        console.error('get_my_quiz_responses error:', error);
        return [];
    }
    return data || [];
}

/**
 * Get the next attempt number for the current student + topic.
 * Returns 1 if no previous attempts exist.
 * Uses Math.max over all rows rather than relying on RPC ordering.
 */
export async function getNextAttemptNumber(token, topicId) {
    const rows = await fetchMyResponses({ token, topicId });
    if (rows.length === 0) return 1;
    return Math.max(...rows.map(r => r.attempt_number)) + 1;
}

/**
 * Save a single quiz response via authenticated API route.
 * Server derives student_id from the token — never trust the client.
 */
export async function saveQuizResponse({ token, topicId, questionId, questionType, answer, correct, attemptNumber, timeTakenMs, mode }) {
    if (!token) {
        console.error('saveQuizResponse: missing token');
        return;
    }

    try {
        const res = await fetch('https://grades.musictechstudio.co.uk/api/external/quiz-response', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                token,
                topicId,
                questionId,
                questionType,
                answer: String(answer),
                correct,
                attemptNumber,
                timeTakenMs,
                mode,
            }),
        });
        if (!res.ok) {
            console.error('Failed to save quiz response:', res.status, await res.text());
        }
    } catch (err) {
        console.error('Failed to save quiz response:', err);
    }
}

/**
 * Load quiz history for the current student + topic.
 * Returns an array of attempt summaries.
 */
export async function getQuizHistory(token, topicId) {
    const rows = await fetchMyResponses({ token, topicId });
    if (rows.length === 0) return [];

    // Group by attempt_number (RPC returns DESC; order doesn't matter for grouping)
    const attempts = {};
    rows.forEach(row => {
        const n = row.attempt_number;
        if (!attempts[n]) attempts[n] = { attemptNumber: n, total: 0, correct: 0, scored: 0, date: row.created_at };
        attempts[n].total++;
        if (row.correct !== null) {
            attempts[n].scored++;
            if (row.correct) attempts[n].correct++;
        }
        if (row.created_at > attempts[n].date) attempts[n].date = row.created_at;
    });

    return Object.values(attempts)
        .sort((a, b) => a.attemptNumber - b.attemptNumber)
        .map(a => ({
            attemptNumber: a.attemptNumber,
            total: a.total,
            correct: a.correct,
            scored: a.scored,
            percentage: a.scored > 0 ? Math.round((a.correct / a.scored) * 100) : null,
            date: a.date,
        }));
}

/**
 * Get per-question performance data for spaced repetition.
 * Returns a Map of questionId → { lastCorrect, lastAttemptedAt, timesWrong, timesCorrect }
 */
export async function getQuestionPerformance(token, topicId) {
    const rows = await fetchMyResponses({ token, topicId });
    if (rows.length === 0) return new Map();

    // Sort ascending so the "last" values reflect the latest attempt
    const sorted = [...rows].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    const map = new Map();
    sorted.forEach(row => {
        const existing = map.get(row.question_id) || { timesCorrect: 0, timesWrong: 0 };
        if (row.correct === true) existing.timesCorrect++;
        else if (row.correct === false) existing.timesWrong++;
        existing.lastCorrect = row.correct;
        existing.lastAttemptedAt = row.created_at;
        map.set(row.question_id, existing);
    });

    return map;
}

/**
 * Load progress summary for the current student + topic (for topic page card).
 * Returns { attempts, bestScore, lastDate, lastScore } or null if no history.
 */
export async function getQuizProgress(token, topicId) {
    const history = await getQuizHistory(token, topicId);
    if (history.length === 0) return null;

    const scoredPercentages = history.map(h => h.percentage).filter(p => p !== null);
    const bestScore = scoredPercentages.length > 0 ? Math.max(...scoredPercentages) : null;
    const lastAttempt = history[history.length - 1];

    return {
        attempts: history.length,
        bestScore,
        lastDate: lastAttempt.date,
        lastScore: lastAttempt.percentage,
    };
}

/**
 * Get progress across all topics for the current student.
 * Returns a Map of topicId → { attempts, bestScore, lastDate, lastScore, recentTrend }
 */
export async function getAllTopicProgress(token) {
    const rows = await fetchMyResponses({ token });
    if (rows.length === 0) return new Map();

    // Group by topic_id, then by attempt_number
    const topicAttempts = {};
    rows.forEach(row => {
        const tid = row.topic_id;
        if (!topicAttempts[tid]) topicAttempts[tid] = {};
        const n = row.attempt_number;
        if (!topicAttempts[tid][n]) topicAttempts[tid][n] = { total: 0, correct: 0, scored: 0, date: row.created_at, mode: row.mode };
        topicAttempts[tid][n].total++;
        if (row.correct !== null) {
            topicAttempts[tid][n].scored++;
            if (row.correct) topicAttempts[tid][n].correct++;
        }
        if (row.created_at > topicAttempts[tid][n].date) topicAttempts[tid][n].date = row.created_at;
    });

    const result = new Map();
    Object.entries(topicAttempts).forEach(([tid, attempts]) => {
        const attemptList = Object.values(attempts)
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .map(a => ({
                ...a,
                percentage: a.scored > 0 ? Math.round((a.correct / a.scored) * 100) : 0,
            }));
        const bestScore = Math.max(...attemptList.map(a => a.percentage));
        const last = attemptList[attemptList.length - 1];

        let recentTrend = 'stable';
        if (attemptList.length >= 2) {
            const prev = attemptList[attemptList.length - 2].percentage;
            const curr = last.percentage;
            if (curr > prev) recentTrend = 'improving';
            else if (curr < prev) recentTrend = 'declining';
        }

        result.set(tid, {
            attempts: attemptList.length,
            bestScore,
            lastDate: last.date,
            lastScore: last.percentage,
            recentTrend,
        });
    });

    return result;
}

/**
 * Get recent quiz activity for the current student (for progress dashboard timeline).
 * Returns array of { topicId, attemptNumber, score, date, mode }
 */
export async function getRecentActivity(token, limit = 20) {
    const rows = await fetchMyResponses({ token, limit: limit * 12 });
    if (rows.length === 0) return [];

    // Group into attempt sessions (unique topic_id + attempt_number)
    const sessions = {};
    rows.forEach(row => {
        const key = `${row.topic_id}:${row.attempt_number}`;
        if (!sessions[key]) {
            sessions[key] = {
                topicId: row.topic_id,
                attemptNumber: row.attempt_number,
                total: 0,
                correct: 0,
                scored: 0,
                date: row.created_at,
                mode: row.mode || 'revision',
            };
        }
        sessions[key].total++;
        if (row.correct !== null) {
            sessions[key].scored++;
            if (row.correct) sessions[key].correct++;
        }
        if (row.created_at > sessions[key].date) sessions[key].date = row.created_at;
    });

    return Object.values(sessions)
        .map(s => ({
            topicId: s.topicId,
            attemptNumber: s.attemptNumber,
            score: s.scored > 0 ? Math.round((s.correct / s.scored) * 100) : null,
            date: s.date,
            mode: s.mode,
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, limit);
}
