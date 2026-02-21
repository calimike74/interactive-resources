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
export async function saveQuizResponse({ studentId, topicId, questionId, questionType, answer, correct, attemptNumber }) {
    const { error } = await supabase
        .from('quiz_responses')
        .insert({
            student_id: studentId,
            topic_id: topicId,
            question_id: questionId,
            question_type: questionType,
            answer: String(answer),
            correct,
            attempt_number: attemptNumber,
        });

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
