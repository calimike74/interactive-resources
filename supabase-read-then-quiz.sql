-- supabase-read-then-quiz.sql
-- Read-Then-Quiz response storage

CREATE TABLE read_then_quiz_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    topic_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    scaffold_level TEXT NOT NULL CHECK (scaffold_level IN ('full','medium','minimal','independent')),
    open_ended_response TEXT,
    mcq_answers JSONB,
    mcq_score INTEGER,
    mcq_total INTEGER,
    reading_time_seconds INTEGER,
    total_time_seconds INTEGER,
    submitted_at TIMESTAMPTZ DEFAULT NOW()
);
