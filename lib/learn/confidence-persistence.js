import { supabase } from '@/lib/supabase';

/**
 * Save or update a student's confidence rating on a key term.
 * Uses upsert — if they change their mind, the rating is updated.
 */
export async function saveConfidence({ studentToken, topicId, termTrigger, confidence }) {
    const { error } = await supabase
        .from('term_confidence')
        .upsert(
            {
                student_token: studentToken,
                topic_id: topicId,
                term_trigger: termTrigger,
                confidence,
                updated_at: new Date().toISOString(),
            },
            { onConflict: 'student_token,topic_id,term_trigger' }
        );

    if (error) {
        console.error('Failed to save term confidence:', error);
        return false;
    }
    return true;
}

/**
 * Load all confidence ratings for a student on a topic.
 * Returns a Map of termTrigger -> confidence.
 */
export async function getStudentConfidence(studentToken, topicId) {
    const { data, error } = await supabase
        .from('term_confidence')
        .select('term_trigger, confidence')
        .eq('student_token', studentToken)
        .eq('topic_id', topicId);

    if (error) {
        console.error('Failed to fetch term confidence:', error);
        return new Map();
    }
    return new Map(data.map((r) => [r.term_trigger, r.confidence]));
}

/**
 * Get aggregated confidence data for a topic (teacher view).
 * Returns all ratings grouped by term with counts.
 */
export async function getTopicConfidenceReport(topicId) {
    const { data, error } = await supabase
        .from('term_confidence')
        .select('term_trigger, confidence, student_token')
        .eq('topic_id', topicId);

    if (error) {
        console.error('Failed to fetch topic confidence report:', error);
        return [];
    }

    // Group by term
    const termMap = {};
    for (const row of data) {
        if (!termMap[row.term_trigger]) {
            termMap[row.term_trigger] = { term: row.term_trigger, gotIt: 0, confused: 0, students: new Set() };
        }
        const entry = termMap[row.term_trigger];
        entry.students.add(row.student_token);
        if (row.confidence === 'got-it') entry.gotIt++;
        else if (row.confidence === 'confused') entry.confused++;
    }

    return Object.values(termMap).map((t) => ({
        term: t.term,
        gotIt: t.gotIt,
        confused: t.confused,
        totalStudents: t.students.size,
    }));
}
