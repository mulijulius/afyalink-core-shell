-- ============================================================
-- AfyaLink HMS — Doctor / Clinical Officer Role (2/2: tables & RLS)
-- Project : fcetorcatklhkelqqplc
-- Created : 2026-06-21
-- ============================================================
-- Requires 20260621000000_doctor_role_enum.sql to have already run
-- (and committed) so that the 'Doctor' value of public.app_role
-- exists and can be referenced below.
--
-- This migration:
--   1. Adds 'Doctor' wherever 'Clinician' currently has clinical
--      write access (patients, visits, prescriptions, referrals,
--      lab orders), so Doctors have the same OPD/consultation
--      capabilities as Clinicians.
--   2. Creates new tables for the consultation workflow:
--        - vitals_observations  (signs & symptoms / vital signs)
--        - diagnoses            (structured diagnosis records)
--        - medical_history      (longitudinal medical history)
--        - clinical_summaries   (doctor-authored medical summaries)
-- ============================================================

-- ── A. Extend existing RLS policies to include 'Doctor' ─────────
-- Postgres RLS policies can't be altered in place with new USING/
-- WITH CHECK clauses without DROP + CREATE, so we recreate the
-- policies that previously only covered Clinician/Admin.

-- patients: insert/update
DROP POLICY IF EXISTS "clinicians_nurses_admins_insert_patients" ON public.patients;
CREATE POLICY "clinicians_nurses_admins_insert_patients" ON public.patients
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'Clinician') OR
    public.has_role(auth.uid(), 'Doctor') OR
    public.has_role(auth.uid(), 'Nurse') OR
    public.has_role(auth.uid(), 'Admin')
  );

DROP POLICY IF EXISTS "clinicians_nurses_admins_update_patients" ON public.patients;
CREATE POLICY "clinicians_nurses_admins_update_patients" ON public.patients
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'Clinician') OR
    public.has_role(auth.uid(), 'Doctor') OR
    public.has_role(auth.uid(), 'Nurse') OR
    public.has_role(auth.uid(), 'Admin')
  );

-- visits: insert
DROP POLICY IF EXISTS "clinicians_admins_insert_visits" ON public.visits;
CREATE POLICY "clinicians_admins_insert_visits" ON public.visits
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'Clinician') OR
    public.has_role(auth.uid(), 'Doctor') OR
    public.has_role(auth.uid(), 'Admin')
  );

-- prescriptions: insert (doctors can prescribe)
DROP POLICY IF EXISTS "clinicians_admins_insert_prescriptions" ON public.prescriptions;
CREATE POLICY "clinicians_admins_insert_prescriptions" ON public.prescriptions
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'Clinician') OR
    public.has_role(auth.uid(), 'Doctor') OR
    public.has_role(auth.uid(), 'Admin')
  );

-- referrals: full access for clinicians/doctors/admins
DROP POLICY IF EXISTS "clinicians_admins_all_referrals" ON public.referrals;
CREATE POLICY "clinicians_admins_all_referrals" ON public.referrals
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'Clinician') OR
    public.has_role(auth.uid(), 'Doctor') OR
    public.has_role(auth.uid(), 'Admin')
  );

-- lab_orders already grants ALL to any approved user (approved_users_all_lab_orders),
-- so Doctor already has access there — no change needed.

-- lab_results: doctors only need read access, which all approved users already
-- have via approved_users_read_lab_results — no change needed there. Verification
-- (insert) stays restricted to Lab Technician/Admin.

-- ── B. VITALS / SIGNS & SYMPTOMS ─────────────────────────────────
CREATE TABLE public.vitals_observations (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id        UUID        NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  visit_id          UUID        REFERENCES public.visits(id) ON DELETE SET NULL,
  recorded_by       UUID        REFERENCES auth.users(id),
  recorded_by_name  TEXT,
  -- vital signs
  temperature_c     NUMERIC(4,1),
  pulse_bpm         INTEGER,
  resp_rate         INTEGER,
  bp_systolic       INTEGER,
  bp_diastolic      INTEGER,
  spo2_percent      INTEGER,
  weight_kg         NUMERIC(5,1),
  height_cm         NUMERIC(5,1),
  -- signs & symptoms (free text + structured tags)
  chief_complaint   TEXT,
  symptoms          TEXT[]      NOT NULL DEFAULT '{}',
  signs             TEXT,
  notes             TEXT,
  recorded_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vitals_observations ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.vitals_observations TO authenticated;
GRANT ALL ON public.vitals_observations TO service_role;

CREATE POLICY "approved_users_read_vitals" ON public.vitals_observations
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY "clinical_staff_insert_vitals" ON public.vitals_observations
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'Nurse') OR
    public.has_role(auth.uid(), 'Clinician') OR
    public.has_role(auth.uid(), 'Doctor') OR
    public.has_role(auth.uid(), 'Admin')
  );

CREATE POLICY "clinical_staff_update_vitals" ON public.vitals_observations
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'Nurse') OR
    public.has_role(auth.uid(), 'Clinician') OR
    public.has_role(auth.uid(), 'Doctor') OR
    public.has_role(auth.uid(), 'Admin')
  );

-- ── C. DIAGNOSES ──────────────────────────────────────────────────
CREATE TABLE public.diagnoses (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id          UUID        NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  visit_id            UUID        REFERENCES public.visits(id) ON DELETE SET NULL,
  diagnosis           TEXT        NOT NULL,
  diagnosis_type      TEXT        NOT NULL DEFAULT 'Provisional', -- 'Provisional' | 'Confirmed' | 'Differential'
  icd10_code          TEXT,
  notes               TEXT,
  diagnosed_by        UUID        REFERENCES auth.users(id),
  diagnosed_by_name   TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.diagnoses ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.diagnoses TO authenticated;
GRANT ALL ON public.diagnoses TO service_role;

CREATE POLICY "approved_users_read_diagnoses" ON public.diagnoses
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY "doctors_clinicians_admins_insert_diagnoses" ON public.diagnoses
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'Clinician') OR
    public.has_role(auth.uid(), 'Doctor') OR
    public.has_role(auth.uid(), 'Admin')
  );

CREATE POLICY "doctors_clinicians_admins_update_diagnoses" ON public.diagnoses
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'Clinician') OR
    public.has_role(auth.uid(), 'Doctor') OR
    public.has_role(auth.uid(), 'Admin')
  );

-- ── D. MEDICAL HISTORY ────────────────────────────────────────────
CREATE TABLE public.medical_history (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id        UUID        NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  category          TEXT        NOT NULL DEFAULT 'Condition', -- 'Condition' | 'Surgery' | 'Family' | 'Social' | 'Immunization' | 'Other'
  description       TEXT        NOT NULL,
  onset_date        DATE,
  status            TEXT        NOT NULL DEFAULT 'Active', -- 'Active' | 'Resolved' | 'Chronic'
  recorded_by       UUID        REFERENCES auth.users(id),
  recorded_by_name  TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.medical_history ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.medical_history TO authenticated;
GRANT ALL ON public.medical_history TO service_role;

CREATE POLICY "approved_users_read_medical_history" ON public.medical_history
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY "clinical_staff_insert_medical_history" ON public.medical_history
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'Nurse') OR
    public.has_role(auth.uid(), 'Clinician') OR
    public.has_role(auth.uid(), 'Doctor') OR
    public.has_role(auth.uid(), 'Admin')
  );

CREATE POLICY "clinical_staff_update_medical_history" ON public.medical_history
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'Nurse') OR
    public.has_role(auth.uid(), 'Clinician') OR
    public.has_role(auth.uid(), 'Doctor') OR
    public.has_role(auth.uid(), 'Admin')
  );

-- ── E. CLINICAL SUMMARIES ──────────────────────────────────────────
CREATE TABLE public.clinical_summaries (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id        UUID        NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  visit_id          UUID        REFERENCES public.visits(id) ON DELETE SET NULL,
  summary           TEXT        NOT NULL,
  authored_by       UUID        REFERENCES auth.users(id),
  authored_by_name  TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.clinical_summaries ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.clinical_summaries TO authenticated;
GRANT ALL ON public.clinical_summaries TO service_role;

CREATE POLICY "approved_users_read_clinical_summaries" ON public.clinical_summaries
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY "doctors_clinicians_admins_insert_summaries" ON public.clinical_summaries
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'Clinician') OR
    public.has_role(auth.uid(), 'Doctor') OR
    public.has_role(auth.uid(), 'Admin')
  );

CREATE POLICY "doctors_clinicians_admins_update_summaries" ON public.clinical_summaries
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'Clinician') OR
    public.has_role(auth.uid(), 'Doctor') OR
    public.has_role(auth.uid(), 'Admin')
  );

-- ── F. updated_at triggers ────────────────────────────────────────
CREATE TRIGGER medical_history_touch
  BEFORE UPDATE ON public.medical_history
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER clinical_summaries_touch
  BEFORE UPDATE ON public.clinical_summaries
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ── G. Indexes for common lookups ─────────────────────────────────
CREATE INDEX idx_vitals_patient_id      ON public.vitals_observations(patient_id);
CREATE INDEX idx_vitals_visit_id        ON public.vitals_observations(visit_id);
CREATE INDEX idx_diagnoses_patient_id   ON public.diagnoses(patient_id);
CREATE INDEX idx_diagnoses_visit_id     ON public.diagnoses(visit_id);
CREATE INDEX idx_medhistory_patient_id  ON public.medical_history(patient_id);
CREATE INDEX idx_summaries_patient_id   ON public.clinical_summaries(patient_id);
