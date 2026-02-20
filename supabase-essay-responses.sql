-- Essay Responses table
-- Run this in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS essay_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    resource_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    content TEXT NOT NULL,
    word_count INTEGER DEFAULT 0,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Allow public read/write (matches grades-dashboard pattern)
ALTER TABLE essay_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert" ON essay_responses
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public select" ON essay_responses
    FOR SELECT USING (true);

-- Index for teacher queries
CREATE INDEX idx_essay_responses_resource ON essay_responses(resource_id);
CREATE INDEX idx_essay_responses_submitted ON essay_responses(submitted_at DESC);
