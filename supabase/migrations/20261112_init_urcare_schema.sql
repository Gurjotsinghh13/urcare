-- URCARE: Smart Quarantine Facility Management System
-- Schema Migration: Complete 12 Tables with Constraints, Indexes, RLS and Functions

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS & HELPERS
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 3. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'doctor', 'nurse', 'manager')),
    phone TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. FACILITY SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.facility_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_name TEXT NOT NULL DEFAULT 'URCARE Quarantine Center',
    capacity INTEGER NOT NULL DEFAULT 80 CHECK (capacity > 0),
    fever_threshold NUMERIC(4, 2) NOT NULL DEFAULT 38.00,
    require_doctor_approval BOOLEAN NOT NULL DEFAULT true,
    days_required_fever_free INTEGER NOT NULL DEFAULT 3,
    timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    min_outcome_sample INTEGER NOT NULL DEFAULT 20,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES public.profiles(id)
);

-- 5. BEDS TABLE
CREATE TABLE IF NOT EXISTS public.beds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bed_number INTEGER NOT NULL UNIQUE CHECK (bed_number BETWEEN 1 AND 80),
    ward TEXT NOT NULL DEFAULT 'Ward 1',
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance')),
    current_patient_id UUID,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. PATIENTS TABLE
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_code TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    age INTEGER NOT NULL CHECK (age >= 0 AND age <= 130),
    gender TEXT NOT NULL CHECK (gender IN ('M', 'F', 'Other')),
    admission_date DATE NOT NULL DEFAULT CURRENT_DATE,
    bed_id UUID REFERENCES public.beds(id),
    status TEXT NOT NULL DEFAULT 'admitted' CHECK (status IN ('admitted', 'discharge_eligible', 'discharge_approved', 'discharged', 'deceased')),
    emergency_contact TEXT,
    medical_history TEXT,
    admission_notes TEXT,
    discharged_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add foreign key constraint for beds.current_patient_id to patients(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_beds_patient'
  ) THEN
    ALTER TABLE public.beds 
    ADD CONSTRAINT fk_beds_patient 
    FOREIGN KEY (current_patient_id) REFERENCES public.patients(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 7. TEMPERATURE RECORDS TABLE
CREATE TABLE IF NOT EXISTS public.temperature_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    recorded_by UUID NOT NULL REFERENCES public.profiles(id),
    temp_celsius NUMERIC(4, 2) NOT NULL CHECK (temp_celsius >= 34.0 AND temp_celsius <= 42.0),
    measurement_date DATE NOT NULL DEFAULT CURRENT_DATE,
    measurement_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_fever BOOLEAN NOT NULL DEFAULT false,
    is_routine BOOLEAN NOT NULL DEFAULT true,
    reason_for_extra TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for daily temperature lookups
CREATE INDEX IF NOT EXISTS idx_temp_patient_date ON public.temperature_records(patient_id, measurement_date);

-- 8. DOCTOR VISITS TABLE
CREATE TABLE IF NOT EXISTS public.doctor_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.profiles(id),
    temperature_record_id UUID REFERENCES public.temperature_records(id),
    visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    visit_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    clinical_observations TEXT NOT NULL,
    treatment_plan TEXT NOT NULL,
    follow_up_instructions TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_visits_patient_date ON public.doctor_visits(patient_id, visit_date);

-- 9. TREATMENT NOTES TABLE
CREATE TABLE IF NOT EXISTS public.treatment_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id),
    author_role TEXT NOT NULL CHECK (author_role IN ('admin', 'doctor', 'nurse', 'manager')),
    note_type TEXT NOT NULL DEFAULT 'general' CHECK (note_type IN ('general', 'medication', 'vital', 'doctor_instruction', 'nursing_care')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. DISCHARGE REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.discharge_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    eligible_since DATE NOT NULL DEFAULT CURRENT_DATE,
    streak_count INTEGER NOT NULL DEFAULT 3,
    doctor_id UUID REFERENCES public.profiles(id),
    doctor_status TEXT NOT NULL DEFAULT 'pending' CHECK (doctor_status IN ('pending', 'approved', 'deferred')),
    doctor_notes TEXT,
    deferral_reason TEXT,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_at TIMESTAMPTZ
);

-- 11. DISCHARGES TABLE
CREATE TABLE IF NOT EXISTS public.discharges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    discharge_request_id UUID REFERENCES public.discharge_requests(id),
    finalized_by UUID NOT NULL REFERENCES public.profiles(id),
    discharge_date DATE NOT NULL DEFAULT CURRENT_DATE,
    discharge_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    discharge_summary TEXT NOT NULL,
    outcome TEXT NOT NULL DEFAULT 'recovered' CHECK (outcome IN ('recovered', 'transferred')),
    bed_released_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. PATIENT OUTCOMES TABLE
CREATE TABLE IF NOT EXISTS public.patient_outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL UNIQUE REFERENCES public.patients(id) ON DELETE CASCADE,
    outcome_type TEXT NOT NULL CHECK (outcome_type IN ('recovered', 'deceased')),
    outcome_date DATE NOT NULL DEFAULT CURRENT_DATE,
    cause_of_death TEXT,
    notes TEXT,
    recorded_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_role TEXT CHECK (target_role IN ('admin', 'doctor', 'nurse', 'manager', 'all')),
    target_user_id UUID REFERENCES public.profiles(id),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('temp_pending', 'visit_pending', 'high_temp', 'discharge_eligible', 'discharge_approved', 'discharge_completed', 'capacity_warning', 'benchmark_warning')),
    is_read BOOLEAN NOT NULL DEFAULT false,
    link TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facility_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.temperature_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discharge_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discharges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Profiles
CREATE POLICY "Public profiles are viewable by authenticated users"
ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert and update profiles"
ON public.profiles FOR ALL TO authenticated
USING (public.get_user_role(auth.uid()) = 'admin' OR auth.uid() = id);

-- Policy: Facility Settings
CREATE POLICY "Facility settings viewable by authenticated"
ON public.facility_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Facility settings editable by doctor or admin"
ON public.facility_settings FOR ALL TO authenticated
USING (public.get_user_role(auth.uid()) IN ('admin', 'doctor'));

-- Policy: Beds
CREATE POLICY "Beds viewable by authenticated"
ON public.beds FOR SELECT TO authenticated USING (true);

CREATE POLICY "Beds modifiable by admin"
ON public.beds FOR ALL TO authenticated
USING (public.get_user_role(auth.uid()) = 'admin');

-- Policy: Patients
CREATE POLICY "Patients viewable by authenticated"
ON public.patients FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage patients"
ON public.patients FOR ALL TO authenticated
USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Doctors and nurses can update patient clinical status"
ON public.patients FOR UPDATE TO authenticated
USING (public.get_user_role(auth.uid()) IN ('admin', 'doctor', 'nurse'));

-- Policy: Temperature Records
CREATE POLICY "Temperature records viewable by authenticated"
ON public.temperature_records FOR SELECT TO authenticated USING (true);

CREATE POLICY "Nurses and doctors can record temperatures"
ON public.temperature_records FOR INSERT TO authenticated
WITH CHECK (public.get_user_role(auth.uid()) IN ('nurse', 'doctor', 'admin'));

-- Policy: Doctor Visits
CREATE POLICY "Doctor visits viewable by authenticated"
ON public.doctor_visits FOR SELECT TO authenticated USING (true);

CREATE POLICY "Doctors can create doctor visits"
ON public.doctor_visits FOR INSERT TO authenticated
WITH CHECK (public.get_user_role(auth.uid()) IN ('doctor', 'admin'));

-- Policy: Treatment Notes
CREATE POLICY "Treatment notes viewable by authenticated"
ON public.treatment_notes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Clinical staff can insert notes"
ON public.treatment_notes FOR INSERT TO authenticated
WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'doctor', 'nurse'));

-- Policy: Discharge Requests
CREATE POLICY "Discharge requests viewable by authenticated"
ON public.discharge_requests FOR SELECT TO authenticated USING (true);

CREATE POLICY "Doctors and admins can update discharge requests"
ON public.discharge_requests FOR ALL TO authenticated
USING (public.get_user_role(auth.uid()) IN ('admin', 'doctor'));

-- Policy: Discharges
CREATE POLICY "Discharges viewable by authenticated"
ON public.discharges FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can finalize discharges"
ON public.discharges FOR INSERT TO authenticated
WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

-- Policy: Patient Outcomes
CREATE POLICY "Patient outcomes viewable by authenticated"
ON public.patient_outcomes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Doctors and Admins can record patient outcomes"
ON public.patient_outcomes FOR INSERT TO authenticated
WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'doctor'));

-- Policy: Notifications
CREATE POLICY "Notifications viewable by target or role"
ON public.notifications FOR SELECT TO authenticated
USING (
  target_user_id = auth.uid() OR 
  target_role = 'all' OR 
  target_role = public.get_user_role(auth.uid())
);

CREATE POLICY "Notifications updatable by target user"
ON public.notifications FOR UPDATE TO authenticated
USING (
  target_user_id = auth.uid() OR 
  target_role = 'all' OR 
  target_role = public.get_user_role(auth.uid())
);

CREATE POLICY "Notifications insertable by authenticated"
ON public.notifications FOR INSERT TO authenticated
WITH CHECK (true);

-- Policy: Audit Logs
CREATE POLICY "Audit logs viewable by admin and manager"
ON public.audit_logs FOR SELECT TO authenticated
USING (public.get_user_role(auth.uid()) IN ('admin', 'manager'));

CREATE POLICY "Audit logs insertable by authenticated"
ON public.audit_logs FOR INSERT TO authenticated
WITH CHECK (true);
