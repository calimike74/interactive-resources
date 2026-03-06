import { supabase } from './supabase';

/**
 * Get the next attempt number for a student + topic combination.
 * Returns 1 if no previous attempts exist.
 */
export async function getNextAttemptNumber(studentId, topicId) {
    const { data, error } = await supabase
        .from('quiz_responses')
        .select('attempt_number')
        .eq('student_id', studentId)
        .eq('topic_id', topicId)
        .order('attempt_number', { ascending: false })
        .limit(1);

    if (error || !data || data.length === 0) return 1;
    return data[0].attempt_number + 1;
}

/**
 * Save a single quiz response to Supabase.
 * Called after each question is answered.
 */
export async function saveQuizResponse({ studentId, topicId, questionId, questionType, answer, correct, attemptNumber, timeTakenMs, mode }) {
    const row = {
        student_id: studentId,
        topic_id: topicId,
        question_id: questionId,
        question_type: questionType,
        answer: String(answer),
        correct,
        attempt_number: attemptNumber,
    };
    if (timeTakenMs != null) row.time_taken_ms = timeTakenMs;
    if (mode) row.mode = mode;

    const { error } = await supabase
        .from('quiz_responses')
        .insert(row);

    if (error) {
        console.error('Failed to save quiz response:', error);
    }
}

/**
 * Load quiz history for a student + topic.
 * Returns an array of attempt summaries: { attemptNumber, total, correct, percentage, date }
 */
export async function getQuizHistory(studentId, topicId) {
    const { data, error } = await supabase
        .from('quiz_responses')
        .select('attempt_number, correct, created_at')
        .eq('student_id', studentId)
        .eq('topic_id', topicId)
        .order('attempt_number', { ascending: true })
        .order('created_at', { ascending: true });

    if (error || !data || data.length === 0) return [];

    // Group by attempt_number
    const attempts = {};
    data.forEach(row => {
        const n = row.attempt_number;
        if (!attempts[n]) attempts[n] = { attemptNumber: n, total: 0, correct: 0, scored: 0, date: row.created_at };
        attempts[n].total++;
        if (row.correct !== null) {
            attempts[n].scored++;
            if (row.correct) attempts[n].correct++;
        }
        // Keep latest timestamp for this attempt
        if (row.created_at > attempts[n].date) attempts[n].date = row.created_at;
    });

    return Object.values(attempts).map(a => ({
        attemptNumber: a.attemptNumber,
        total: a.total,
        correct: a.correct,
        scored: a.scored,
        percentage: a.scored > 0 ? Math.round((a.correct / a.scored) * 100) : 0,
        date: a.date,
    }));
}

/**
 * Get per-question performance data for spaced repetition.
 * Returns a Map of questionId → { lastCorrect, lastAttemptedAt, timesWrong, timesCorrect }
 */
export async function getQuestionPerformance(studentId, topicId) {
    const { data, error } = await supabase
        .from('quiz_responses')
        .select('question_id, correct, created_at')
        .eq('student_id', studentId)
        .eq('topic_id', topicId)
        .order('created_at', { ascending: true });

    if (error || !data || data.length === 0) return new Map();

    const map = new Map();
    data.forEach(row => {
        const existing = map.get(row.question_id) || { timesCorrect: 0, timesWrong: 0 };
        if (row.correct === true) existing.timesCorrect++;
        else if (row.correct === false) existing.timesWrong++;
        // Always update to latest — data is ordered ascending
        existing.lastCorrect = row.correct;
        existing.lastAttemptedAt = row.created_at;
        map.set(row.question_id, existing);
    });

    return map;
}

/**
 * Load progress summary for a student + topic (for topic page card).
 * Returns { attempts, bestScore, lastDate } or null if no history.
 */
export async function getQuizProgress(studentId, topicId) {
    const history = await getQuizHistory(studentId, topicId);
    if (history.length === 0) return null;

    const bestScore = Math.max(...history.map(h => h.percentage));
    const lastAttempt = history[history.length - 1];

    return {
        attempts: history.length,
        bestScore,
        lastDate: lastAttempt.date,
        lastScore: lastAttempt.percentage,
    };
}

/**
 * Get progress across all topics for a student (for progress dashboard).
 * Returns a Map of topicId → { attempts, bestScore, lastDate, lastScore, recentTrend }
 */
export async function getAllTopicProgress(studentId) {
    const { data, error } = await supabase
        .from('quiz_responses')
        .select('topic_id, attempt_number, correct, created_at, mode')
        .eq('student_id', studentId)
        .order('created_at', { ascending: true });

    if (error || !data || data.length === 0) return new Map();

    // Group by topic_id, then by attempt_number
    const topicAttempts = {};
    data.forEach(row => {
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
        const attemptList = Object.values(attempts).map(a => ({
            ...a,
            percentage: a.scored > 0 ? Math.round((a.correct / a.scored) * 100) : 0,
        }));
        const bestScore = Math.max(...attemptList.map(a => a.percentage));
        const last = attemptList[attemptList.length - 1];

        // Recent trend: compare last two attempts
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
 * Get recent quiz activity for a student (for progress dashboard timeline).
 * Returns array of { topicId, attemptNumber, score, date, mode }
 */
export async function getRecentActivity(studentId, limit = 20) {
    // Fetch enough rows to group into attempt sessions
    const { data, error } = await supabase
        .from('quiz_responses')
        .select('topic_id, attempt_number, correct, created_at, mode')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(limit * 12);

    if (error || !data || data.length === 0) return [];

    // Group into attempt sessions (unique topic_id + attempt_number)
    const sessions = {};
    data.forEach(row => {
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
        // Keep latest date
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
