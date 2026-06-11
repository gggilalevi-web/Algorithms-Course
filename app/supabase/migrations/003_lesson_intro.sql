-- Add intro_text column to lessons table
-- This allows admins to add introductory text shown before each video
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS intro_text text;
