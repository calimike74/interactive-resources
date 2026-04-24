-- Essay Responses — scaffold tracking additions
-- Run this in the Supabase SQL Editor AFTER supabase-essay-responses.sql

-- Final scaffold level the student had selected when they submitted.
-- (May already exist from the stereo-recording-essay rollout; the IF NOT EXISTS
--  guard makes this safe to run even if it does.)
ALTER TABLE essay_responses
    ADD COLUMN IF NOT EXISTS scaffold_level TEXT;

-- Every scaffold level the student actually opened during the session.
-- Stored as a text array so we can see e.g. ['full','medium','independent']
-- even if they ended up on Independent before submitting.
ALTER TABLE essay_responses
    ADD COLUMN IF NOT EXISTS scaffold_levels_used TEXT[] DEFAULT '{}';

-- Max support level the student ever opened, precomputed for easy querying.
-- Ranks: full=4, medium=3, minimal=2, independent=1.
ALTER TABLE essay_responses
    ADD COLUMN IF NOT EXISTS max_support_used TEXT;
