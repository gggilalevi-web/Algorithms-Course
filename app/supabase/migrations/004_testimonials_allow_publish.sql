-- Add allow_publish to testimonials.
-- Default true = student consents to publication.
-- When false, the testimonial is stored but never shown publicly.
alter table testimonials
  add column if not exists allow_publish boolean not null default true;
