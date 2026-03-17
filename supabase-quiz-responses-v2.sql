-- Migration: Add time_taken_ms and mode columns to quiz_responses
-- Run this against your Supabase project before deploying exam mode.
-- Backward compatible — existing rows default to mode='revision', time_taken_ms=NULL.

ALTER TABLE quiz_responses ADD COLUMN IF NOT EXISTS time_taken_ms INTEGER;
ALTER TABLE quiz_responses ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'revision';

-- Optional: index for filtering by mode (useful for progress dashboard queries)
CREATE INDEX IF NOT EXISTS idx_quiz_responses_mode ON quiz_responses (mode);
