import { supabase } from '@/lib/supabase';

/**
 * Save a section assessment response to Supabase.
 */
export async function saveSectionResponse({
  studentToken,
  topicId,
  sectionId,
  questionId,
  selectedIndex,
  correct,
  timeTakenMs,
}) {
  const { data, error } = await supabase
    .from('section_responses')
    .insert({
      student_token: studentToken,
      topic_id: topicId,
      section_id: sectionId,
      question_id: questionId,
      selected_index: selectedIndex,
      correct,
      time_taken_ms: timeTakenMs,
    })
    .select();

  if (error) {
    console.error('Failed to save section response:', error);
    return false;
  }
  return true;
}

/**
 * Get all responses for a student on a specific topic.
 * Used to show which sections they've already answered.
 */
export async function getTopicResponses(studentToken, topicId) {
  const { data, error } = await supabase
    .from('section_responses')
    .select('section_id, correct')
    .eq('student_token', studentToken)
    .eq('topic_id', topicId);

  if (error) {
    console.error('Failed to fetch topic responses:', error);
    return [];
  }
  return data;
}
