-- ============================================================
-- AfyaLink HMS — Add assigned_to_id to opd_queue
-- Created : 2026-06-23
-- ============================================================
-- Adds a UUID foreign-key column assigned_to_id to opd_queue
-- so we store both the doctor's user ID (for programmatic
-- filtering / joins) AND their display name (assigned_to text,
-- already present) for backwards-compatible display.
--
-- The column is nullable so existing rows are unaffected.
-- The CheckInDialog now sends assigned_to = full_name and we can
-- add assigned_to_id in a follow-up client update if desired;
-- this migration just makes the column available.
-- ============================================================

ALTER TABLE public.opd_queue
  ADD COLUMN IF NOT EXISTS assigned_to_id uuid
    REFERENCES public.profiles(id)
    ON DELETE SET NULL;

-- Index for fast lookup "show queue for doctor X"
CREATE INDEX IF NOT EXISTS opd_queue_assigned_to_id_idx
  ON public.opd_queue (assigned_to_id);

COMMENT ON COLUMN public.opd_queue.assigned_to_id IS
  'UUID of the assigned Doctor/Clinician profile. Nullable for backwards compatibility.';
