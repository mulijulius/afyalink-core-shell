-- ============================================================
-- AfyaLink HMS — Clinical Tables Migration
-- Project : fcetorcatklhkelqqplc
-- Created : 2026-06-17
-- ============================================================

-- ── Enums ────────────────────────────────────────────────────
CREATE TYPE public.gender           AS ENUM ('Male', 'Female');
CREATE TYPE public.triage_level     AS ENUM ('Red', 'Orange', 'Yellow', 'Green', 'Blue');
CREATE TYPE public.queue_status     AS ENUM ('Waiting', 'Triaged', 'In Consult', 'Done', 'Did Not Wait');
CREATE TYPE public.lab_priority     AS ENUM ('Routine', 'Urgent', 'STAT');
CREATE TYPE public.lab_order_status AS ENUM ('Pending', 'Collected', 'Processing', 'Completed');
CREATE TYPE public.result_flag      AS ENUM ('Normal', 'High', 'Low');
CREATE TYPE public.payment_method   AS ENUM ('M-Pesa', 'NHIF', 'Cash', 'Insurance');
CREATE TYPE public.payment_status   AS ENUM ('Paid', 'Pending', 'Failed');
CREATE TYPE public.claim_status     AS ENUM ('Submitted', 'Approved', 'Rejected');
CREATE TYPE public.referral_urgency AS ENUM ('Routine', 'Urgent', 'Emergency');
CREATE TYPE public.referral_status  AS ENUM ('Pending', 'Received', 'Completed', 'No Feedback');

-- ── 1. PATIENTS ───────────────────────────────────────────────
CREATE TABLE public.patients (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  national_id  TEXT        NOT NULL UNIQUE,
  full_name    TEXT        NOT NULL,
  dob          DATE        NOT NULL,
  gender       public.gender NOT NULL,
  phone        TEXT,
  county       TEXT,
  sub_county   TEXT,
  blood_group  TEXT,
  allergies    TEXT[]      NOT NULL DEFAULT '{}',
  nhif_no      TEXT,
  nok_name     TEXT,
  nok_phone    TEXT,
  created_by   UUID        REFERENCES auth.users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.patients TO authenticated;
GRANT ALL ON public.patients TO service_role;

CREATE POLICY "approved_users_read_patients" ON public.patients
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY "clinicians_nurses_admins_insert_patients" ON public.patients
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'Clinician') OR
    public.has_role(auth.uid(), 'Nurse') OR
    public.has_role(auth.uid(), 'Admin')
  );

CREATE POLICY "clinicians_nurses_admins_update_patients" ON public.patients
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'Clinician') OR
    public.has_role(auth.uid(), 'Nurse') OR
    public.has_role(auth.uid(), 'Admin')
  );

-- ── 2. VISITS ─────────────────────────────────────────────────
CREATE TABLE public.visits (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      UUID        NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  visit_date      DATE        NOT NULL DEFAULT CURRENT_DATE,
  diagnosis       TEXT,
  notes           TEXT,
  clinician_id    UUID        REFERENCES auth.users(id),
  clinician_name  TEXT,
  department      TEXT        NOT NULL DEFAULT 'OPD',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.visits TO authenticated;
GRANT ALL ON public.visits TO service_role;

CREATE POLICY "approved_users_read_visits" ON public.visits
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY "clinicians_admins_insert_visits" ON public.visits
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'Clinician') OR
    public.has_role(auth.uid(), 'Admin')
  );

-- ── 3. OPD QUEUE ──────────────────────────────────────────────
CREATE TABLE public.opd_queue (
  id             UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_no       TEXT              NOT NULL,
  patient_id     UUID              REFERENCES public.patients(id),
  patient_name   TEXT              NOT NULL,
  check_in_time  TIMESTAMPTZ       NOT NULL DEFAULT now(),
  triage         public.triage_level NOT NULL DEFAULT 'Green',
  assigned_to    TEXT,
  status         public.queue_status NOT NULL DEFAULT 'Waiting',
  checked_in_by  UUID              REFERENCES auth.users(id),
  updated_at     TIMESTAMPTZ       NOT NULL DEFAULT now()
);
ALTER TABLE public.opd_queue ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.opd_queue TO authenticated;
GRANT ALL ON public.opd_queue TO service_role;

CREATE POLICY "approved_users_all_queue" ON public.opd_queue
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()));

-- ── 4. LAB ORDERS ─────────────────────────────────────────────
CREATE TABLE public.lab_orders (
  id               UUID                 PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no         TEXT                 NOT NULL UNIQUE,
  patient_id       UUID                 REFERENCES public.patients(id),
  patient_name     TEXT                 NOT NULL,
  national_id      TEXT,
  tests            TEXT[]               NOT NULL DEFAULT '{}',
  ordered_by       UUID                 REFERENCES auth.users(id),
  ordered_by_name  TEXT,
  priority         public.lab_priority  NOT NULL DEFAULT 'Routine',
  status           public.lab_order_status NOT NULL DEFAULT 'Pending',
  created_at       TIMESTAMPTZ          NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ          NOT NULL DEFAULT now()
);
ALTER TABLE public.lab_orders ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.lab_orders TO authenticated;
GRANT ALL ON public.lab_orders TO service_role;

CREATE POLICY "approved_users_all_lab_orders" ON public.lab_orders
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()));

-- ── 5. LAB RESULTS ────────────────────────────────────────────
CREATE TABLE public.lab_results (
  id               UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         UUID              NOT NULL REFERENCES public.lab_orders(id) ON DELETE CASCADE,
  test_name        TEXT              NOT NULL,
  result           TEXT              NOT NULL,
  reference_range  TEXT,
  flag             public.result_flag NOT NULL DEFAULT 'Normal',
  is_critical      BOOLEAN           NOT NULL DEFAULT false,
  verified_by      UUID              REFERENCES auth.users(id),
  verified_by_name TEXT,
  sample_id        TEXT,
  created_at       TIMESTAMPTZ       NOT NULL DEFAULT now()
);
ALTER TABLE public.lab_results ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.lab_results TO authenticated;
GRANT ALL ON public.lab_results TO service_role;

CREATE POLICY "approved_users_read_lab_results" ON public.lab_results
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY "lab_techs_admins_insert_results" ON public.lab_results
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'Lab Technician') OR
    public.has_role(auth.uid(), 'Admin')
  );

-- ── 6. PHARMACY DRUGS (inventory) ─────────────────────────────
CREATE TABLE public.pharmacy_drugs (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT        NOT NULL,
  category       TEXT        NOT NULL,
  stock          INTEGER     NOT NULL DEFAULT 0,
  unit           TEXT        NOT NULL DEFAULT 'tabs',
  reorder_level  INTEGER     NOT NULL DEFAULT 50,
  expiry_date    DATE,
  supplier       TEXT,
  updated_by     UUID        REFERENCES auth.users(id),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pharmacy_drugs ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.pharmacy_drugs TO authenticated;
GRANT ALL ON public.pharmacy_drugs TO service_role;

CREATE POLICY "approved_users_read_drugs" ON public.pharmacy_drugs
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY "pharmacists_admins_manage_drugs" ON public.pharmacy_drugs
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'Pharmacist') OR
    public.has_role(auth.uid(), 'Admin')
  );

-- ── 7. PRESCRIPTIONS / DISPENSING ────────────────────────────
CREATE TABLE public.prescriptions (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id            UUID        REFERENCES public.visits(id),
  patient_id          UUID        REFERENCES public.patients(id),
  patient_name        TEXT        NOT NULL,
  drug_id             UUID        REFERENCES public.pharmacy_drugs(id),
  drug_name           TEXT        NOT NULL,
  dose                TEXT        NOT NULL,
  quantity            TEXT        NOT NULL,
  prescribed_by       UUID        REFERENCES auth.users(id),
  prescribed_by_name  TEXT,
  dispensed           BOOLEAN     NOT NULL DEFAULT false,
  dispensed_by        UUID        REFERENCES auth.users(id),
  dispensed_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.prescriptions TO authenticated;
GRANT ALL ON public.prescriptions TO service_role;

CREATE POLICY "approved_users_read_prescriptions" ON public.prescriptions
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY "clinicians_admins_insert_prescriptions" ON public.prescriptions
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'Clinician') OR
    public.has_role(auth.uid(), 'Admin')
  );

CREATE POLICY "pharmacists_admins_dispense" ON public.prescriptions
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'Pharmacist') OR
    public.has_role(auth.uid(), 'Admin')
  );

-- ── 8. BILLING TRANSACTIONS ───────────────────────────────────
CREATE TABLE public.billing_transactions (
  id               UUID                  PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_no       TEXT                  NOT NULL UNIQUE,
  patient_id       UUID                  REFERENCES public.patients(id),
  patient_name     TEXT                  NOT NULL,
  visit_id         UUID                  REFERENCES public.visits(id),
  amount           NUMERIC(10,2)         NOT NULL,
  method           public.payment_method NOT NULL,
  status           public.payment_status NOT NULL DEFAULT 'Pending',
  items            JSONB                 NOT NULL DEFAULT '[]',
  recorded_by      UUID                  REFERENCES auth.users(id),
  transaction_date DATE                  NOT NULL DEFAULT CURRENT_DATE,
  created_at       TIMESTAMPTZ           NOT NULL DEFAULT now()
);
ALTER TABLE public.billing_transactions ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.billing_transactions TO authenticated;
GRANT ALL ON public.billing_transactions TO service_role;

CREATE POLICY "finance_admins_all_billing" ON public.billing_transactions
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'Finance Officer') OR
    public.has_role(auth.uid(), 'Admin')
  );

CREATE POLICY "all_roles_read_billing" ON public.billing_transactions
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()));

-- ── 9. NHIF CLAIMS ────────────────────────────────────────────
CREATE TABLE public.nhif_claims (
  id               UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_no         TEXT                NOT NULL UNIQUE,
  patient_id       UUID                REFERENCES public.patients(id),
  patient_name     TEXT                NOT NULL,
  visit_id         UUID                REFERENCES public.visits(id),
  amount           NUMERIC(10,2)       NOT NULL,
  visit_date       DATE                NOT NULL,
  submitted_date   DATE                NOT NULL DEFAULT CURRENT_DATE,
  status           public.claim_status NOT NULL DEFAULT 'Submitted',
  rejection_reason TEXT,
  submitted_by     UUID                REFERENCES auth.users(id),
  created_at       TIMESTAMPTZ         NOT NULL DEFAULT now()
);
ALTER TABLE public.nhif_claims ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.nhif_claims TO authenticated;
GRANT ALL ON public.nhif_claims TO service_role;

CREATE POLICY "finance_admins_all_claims" ON public.nhif_claims
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'Finance Officer') OR
    public.has_role(auth.uid(), 'Admin')
  );

-- ── 10. REFERRALS ─────────────────────────────────────────────
CREATE TABLE public.referrals (
  id                UUID                   PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_no            TEXT                   NOT NULL UNIQUE,
  patient_id        UUID                   REFERENCES public.patients(id),
  patient_name      TEXT                   NOT NULL,
  national_id       TEXT,
  sent_to           TEXT                   NOT NULL,
  urgency           public.referral_urgency NOT NULL DEFAULT 'Routine',
  status            public.referral_status  NOT NULL DEFAULT 'Pending',
  reason            TEXT                   NOT NULL,
  outcome           TEXT,
  referred_by       UUID                   REFERENCES auth.users(id),
  referred_by_name  TEXT,
  date_sent         DATE                   NOT NULL DEFAULT CURRENT_DATE,
  created_at        TIMESTAMPTZ            NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ            NOT NULL DEFAULT now()
);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;

CREATE POLICY "clinicians_admins_all_referrals" ON public.referrals
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'Clinician') OR
    public.has_role(auth.uid(), 'Admin')
  );

CREATE POLICY "approved_users_read_referrals" ON public.referrals
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()));

-- ── updated_at triggers ───────────────────────────────────────
CREATE TRIGGER patients_touch
  BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER queue_touch
  BEFORE UPDATE ON public.opd_queue
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER lab_order_touch
  BEFORE UPDATE ON public.lab_orders
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER drug_touch
  BEFORE UPDATE ON public.pharmacy_drugs
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER referral_touch
  BEFORE UPDATE ON public.referrals
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
