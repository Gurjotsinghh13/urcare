export type UserRole = 'admin' | 'doctor' | 'nurse' | 'manager';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export type BedStatus = 'available' | 'occupied' | 'maintenance';

export interface Bed {
  id: string;
  bed_number: number;
  ward: string;
  status: BedStatus;
  current_patient_id?: string | null;
  updated_at: string;
}

export type PatientStatus = 
  | 'admitted' 
  | 'discharge_eligible' 
  | 'discharge_approved' 
  | 'discharged' 
  | 'deceased';

export interface Patient {
  id: string;
  patient_code: string;
  full_name: string;
  age: number;
  gender: 'M' | 'F' | 'Other';
  admission_date: string;
  bed_id?: string | null;
  bed_number?: number | null;
  status: PatientStatus;
  emergency_contact?: string;
  medical_history?: string;
  admission_notes?: string;
  discharged_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TemperatureRecord {
  id: string;
  patient_id: string;
  recorded_by: string;
  recorded_by_name?: string;
  temp_celsius: number;
  measurement_date: string; // YYYY-MM-DD
  measurement_time: string; // ISO
  is_fever: boolean;
  is_routine: boolean;
  reason_for_extra?: string;
  notes?: string;
  created_at: string;
}

export interface DoctorVisit {
  id: string;
  patient_id: string;
  doctor_id: string;
  doctor_name?: string;
  temperature_record_id?: string;
  temperature_reading?: number;
  visit_date: string; // YYYY-MM-DD
  visit_time: string; // ISO
  clinical_observations: string;
  treatment_plan: string;
  follow_up_instructions?: string;
  created_at: string;
}

export interface TreatmentNote {
  id: string;
  patient_id: string;
  author_id: string;
  author_name?: string;
  author_role: UserRole;
  note_type: 'general' | 'medication' | 'vital' | 'doctor_instruction' | 'nursing_care';
  content: string;
  created_at: string;
}

export type DischargeDoctorStatus = 'pending' | 'approved' | 'deferred';

export interface DischargeRequest {
  id: string;
  patient_id: string;
  eligible_since: string;
  streak_count: number;
  doctor_id?: string | null;
  doctor_name?: string | null;
  doctor_status: DischargeDoctorStatus;
  doctor_notes?: string;
  deferral_reason?: string;
  requested_at: string;
  reviewed_at?: string | null;
}

export interface DischargeRecord {
  id: string;
  patient_id: string;
  discharge_request_id?: string;
  finalized_by: string;
  finalized_by_name?: string;
  discharge_date: string;
  discharge_time: string;
  discharge_summary: string;
  outcome: 'recovered' | 'transferred';
  bed_released_at: string;
  created_at: string;
}

export interface PatientOutcome {
  id: string;
  patient_id: string;
  outcome_type: 'recovered' | 'deceased';
  outcome_date: string;
  cause_of_death?: string;
  notes?: string;
  recorded_by: string;
  recorded_by_name?: string;
  created_at: string;
}

export interface AppNotification {
  id: string;
  target_role?: UserRole | 'all';
  target_user_id?: string;
  title: string;
  message: string;
  type: 
    | 'temp_pending' 
    | 'visit_pending' 
    | 'high_temp' 
    | 'discharge_eligible' 
    | 'discharge_approved' 
    | 'discharge_completed' 
    | 'capacity_warning' 
    | 'benchmark_warning';
  is_read: boolean;
  link?: string;
  created_at: string;
}

export interface FacilitySettings {
  id?: string;
  facility_name: string;
  capacity: number;
  fever_threshold: number;
  require_doctor_approval: boolean;
  days_required_fever_free: number;
  timezone: string;
  min_outcome_sample: number;
  updated_at?: string;
  updated_by?: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_email?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  created_at: string;
}
