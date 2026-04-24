-- Essay Responses — cohort column
-- Run this in the Supabase SQL Editor

-- Cohort ('upper-sixth' | 'lower-sixth') — needed to disambiguate students
-- who appear in both cohorts (e.g. Charlie) and to filter submissions per class.
ALTER TABLE essay_responses
    ADD COLUMN IF NOT EXISTS cohort TEXT;
