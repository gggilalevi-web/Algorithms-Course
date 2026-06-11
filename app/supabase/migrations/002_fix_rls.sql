-- Allow logged-in users to insert their own enrollments
-- (needed for email-callback flow and select-topics page)
create policy "enrollments_user_insert" on enrollments
  for insert
  with check (user_id = auth.uid());

-- Allow users to delete their own enrollments
-- (needed for topic de-selection)
create policy "enrollments_user_delete" on enrollments
  for delete
  using (user_id = auth.uid());

-- Fix full-course unique constraint (NULL != NULL in SQL, so the original
-- unique(user_id, topic_id) allows multiple full-course rows per user)
create unique index if not exists enrollment_full_course_unique
  on enrollments (user_id)
  where is_full_course = true;
