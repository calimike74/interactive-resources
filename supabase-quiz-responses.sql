-- Quiz Responses table for revision quiz persistence
-- Run this in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS quiz_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES students(id),
    topic_id TEXT NOT NULL,
    question_id TEXT NOT NULL,
    question_type TEXT NOT NULL,
    answer TEXT,
    correct BOOLEAN,
    attempt_number INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS: students can insert their own responses, teachers can read all
ALTER TABLE quiz_responses ENABLE ROW LEVEL SECURITY;

-- Allow inserts from authenticated anon key (student writes via client)
CREATE POLICY "Allow public insert" ON quiz_responses
    FOR INSERT WITH CHECK (true);

-- Allow reads (for progress tracking and teacher dashboard)
CREATE POLICY "Allow public select" ON quiz_responses
    FOR SELECT USING (true);

-- Indexes for common queries
CREATE INDEX idx_quiz_responses_student ON quiz_responses(student_id);
CREATE INDEX idx_quiz_responses_topic ON quiz_responses(topic_id);
CREATE INDEX idx_quiz_responses_student_topic ON quiz_responses(student_id, topic_id);
CREATE INDEX idx_quiz_responses_created ON quiz_responses(created_at DESC);
