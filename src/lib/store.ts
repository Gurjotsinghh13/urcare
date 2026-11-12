// Unified URCARE Data Store
// Connects with Supabase database when credentials exist, with robust fallback
import { generateSeedData, DEMO_USERS } from './seed-data';
import { 
  UserProfile, 
  Bed, 
  Patient, 
  TemperatureRecord, 
  DoctorVisit, 
  TreatmentNote, 
  DischargeRequest, 
  DischargeRecord, 
  PatientOutcome, 
  AppNotification, 
  FacilitySettings,
  AuditLog,
  UserRole
} from './types';
import { 
  TOTAL_BEDS, 
  dateKey, 
  calculateFeverFreeStreak, 
  isDischargeEligible,
  canDoctorPerformVisit,
  canAdmitPatient,
  validateTemperature
} from './rules';

// Global memory state for immediate reactivity & fallback
interface StoreState {
  users: UserProfile[];
  settings: FacilitySettings;
  beds: Bed[];
  patients: Patient[];
  temperatureRecords: TemperatureRecord[];
  doctorVisits: DoctorVisit[];
  treatmentNotes: TreatmentNote[];
  dischargeRequests: DischargeRequest[];
  dischargeRecords: DischargeRecord[];
  patientOutcomes: PatientOutcome[];
  historicalOutcomes: Array<{
    patient_id: string;
    outcome_type: 'recovered' | 'deceased';
    outcome_date: string;
    admission_date: string;
    cause_of_death?: string;
  }>;
  notifications: AppNotification[];
  auditLogs: AuditLog[];
}

let memoryState: StoreState | null = null;

export function getStore(): StoreState {
  if (!memoryState) {
    resetStore();
  }
  return memoryState!;
}

export function resetStore(): StoreState {
  const seed = generateSeedData();
  const profiles: UserProfile[] = seed.users.map((u) => ({
    id: u.id,
    email: u.email,
    full_name: u.full_name,
    role: u.role,
    phone: u.phone,
    is_active: u.is_active,
    created_at: new Date().toISOString(),
  }));

  memoryState = {
    users: profiles,
    settings: seed.settings,
    beds: seed.beds,
    patients: seed.patients,
    temperatureRecords: seed.temperatureRecords,
    doctorVisits: seed.doctorVisits,
    treatmentNotes: seed.treatmentNotes,
    dischargeRequests: seed.dischargeRequests,
    dischargeRecords: seed.dischargeRecords,
    patientOutcomes: seed.patientOutcomes,
    historicalOutcomes: seed.historicalOutcomes,
    notifications: seed.notifications,
    auditLogs: [],
  };

  return memoryState;
}

// Data Access API
export const StoreAPI = {
  // Profiles & Auth
  getUsers: () => getStore().users,
  getUserById: (id: string) => getStore().users.find((u) => u.id === id),
  getUserByEmail: (email: string) => getStore().users.find((u) => u.email.toLowerCase() === email.toLowerCase()),
  
  // Settings
  getSettings: () => getStore().settings,
  updateSettings: (partial: Partial<FacilitySettings>, user: UserProfile) => {
    const s = getStore();
    s.settings = { ...s.settings, ...partial, updated_at: new Date().toISOString(), updated_by: user.id };
    StoreAPI.logAudit(user, 'UPDATE_SETTINGS', 'facility_settings', s.settings.id, partial);
    return s.settings;
  },

  // Beds
  getBeds: () => getStore().beds,
  getAvailableBeds: () => getStore().beds.filter((b) => b.status === 'available'),
  getOccupiedBedsCount: () => getStore().beds.filter((b) => b.status === 'occupied').length,

  // Patients
  getPatients: () => getStore().patients,
  getPatientById: (id: string) => getStore().patients.find((p) => p.id === id || p.patient_code === id),
  getAdmittedPatients: () => getStore().patients.filter((p) => 
    p.status === 'admitted' || p.status === 'discharge_eligible' || p.status === 'discharge_approved'
  ),

  admitPatient: (patientData: {
    full_name: string;
    age: number;
    gender: 'M' | 'F' | 'Other';
    bed_number: number;
    medical_history?: string;
    emergency_contact?: string;
    admission_notes?: string;
  }, user: UserProfile) => {
    const s = getStore();
    const occupied = StoreAPI.getOccupiedBedsCount();
    const capacityCheck = canAdmitPatient(occupied, s.settings.capacity);
    if (!capacityCheck.allowed) {
      throw new Error(capacityCheck.reason);
    }

    const bed = s.beds.find((b) => b.bed_number === patientData.bed_number);
    if (!bed) {
      throw new Error(`Bed ${patientData.bed_number} does not exist.`);
    }
    if (bed.status !== 'available') {
      throw new Error(`Bed ${patientData.bed_number} is already occupied or in maintenance.`);
    }

    // Auto generate patient code URC-10XX
    const nextNum = 1000 + s.patients.length + 1;
    const patientCode = `URC-${nextNum}`;
    const newId = `p-${Date.now()}`;
    const today = dateKey();

    const newPatient: Patient = {
      id: newId,
      patient_code: patientCode,
      full_name: patientData.full_name,
      age: patientData.age,
      gender: patientData.gender,
      admission_date: today,
      bed_id: bed.id,
      bed_number: bed.bed_number,
      status: 'admitted',
      medical_history: patientData.medical_history,
      emergency_contact: patientData.emergency_contact,
      admission_notes: patientData.admission_notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    bed.status = 'occupied';
    bed.current_patient_id = newId;
    s.patients.unshift(newPatient);

    // Initial note
    s.treatmentNotes.push({
      id: `note-${Date.now()}`,
      patient_id: newId,
      author_id: user.id,
      author_name: user.full_name,
      author_role: user.role,
      note_type: 'general',
      content: `Patient admitted to Bed ${bed.bed_number}. ${patientData.admission_notes || ''}`,
      created_at: new Date().toISOString(),
    });

    StoreAPI.logAudit(user, 'ADMIT_PATIENT', 'patient', newId, { patientCode, bed: bed.bed_number });
    return newPatient;
  },

  // Temperatures
  getTemperatures: (patientId?: string) => {
    const s = getStore();
    if (patientId) {
      return s.temperatureRecords.filter((r) => r.patient_id === patientId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return s.temperatureRecords;
  },

  recordTemperature: (data: {
    patient_id: string;
    temp_celsius: number;
    notes?: string;
    reason_for_extra?: string;
    is_routine?: boolean;
  }, user: UserProfile) => {
    const s = getStore();
    const patient = s.patients.find((p) => p.id === data.patient_id);
    if (!patient) throw new Error('Patient not found.');

    const today = dateKey();
    const isRoutine = data.is_routine ?? true;

    // Check duplicate routine measurement
    if (isRoutine) {
      const existingToday = s.temperatureRecords.find(
        (r) => r.patient_id === data.patient_id && r.measurement_date === today && r.is_routine
      );
      if (existingToday) {
        throw new Error(
          `Temperature has already been recorded for this patient today (${existingToday.temp_celsius}°C at ${existingToday.measurement_time.substring(11, 16)}). To record an unscheduled check, mark as non-routine and provide clinical justification.`
        );
      }
    }

    const validation = validateTemperature(data.temp_celsius, s.settings.fever_threshold);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const newRecord: TemperatureRecord = {
      id: `temp-${Date.now()}`,
      patient_id: data.patient_id,
      recorded_by: user.id,
      recorded_by_name: user.full_name,
      temp_celsius: validation.value!,
      measurement_date: today,
      measurement_time: new Date().toISOString(),
      is_fever: validation.isFever!,
      is_routine: isRoutine,
      reason_for_extra: data.reason_for_extra,
      notes: data.notes,
      created_at: new Date().toISOString(),
    };

    s.temperatureRecords.push(newRecord);

    // Notification on High Fever
    if (validation.isFever) {
      s.notifications.unshift({
        id: `notif-${Date.now()}`,
        target_role: 'doctor',
        title: `High Fever Alert: Bed ${patient.bed_number} (${patient.full_name})`,
        message: `High temperature ${validation.value}°C recorded by ${user.full_name}. Immediate doctor review required.`,
        type: 'high_temp',
        is_read: false,
        link: `/patients/${patient.id}`,
        created_at: new Date().toISOString(),
      });
    }

    // Check 3-day fever-free streak
    const allPatientTemps = s.temperatureRecords.filter((r) => r.patient_id === data.patient_id);
    const streak = calculateFeverFreeStreak(allPatientTemps, today, s.settings.fever_threshold);

    if (streak >= s.settings.days_required_fever_free && patient.status === 'admitted') {
      patient.status = 'discharge_eligible';
      // Create discharge request
      s.dischargeRequests.unshift({
        id: `disch-req-${Date.now()}`,
        patient_id: patient.id,
        eligible_since: today,
        streak_count: streak,
        doctor_status: 'pending',
        requested_at: new Date().toISOString(),
      });

      s.notifications.unshift({
        id: `notif-streak-${Date.now()}`,
        target_role: 'doctor',
        title: `Discharge Eligibility: Bed ${patient.bed_number} (${patient.full_name})`,
        message: `Patient has completed ${streak} consecutive fever-free days. Please review and approve discharge readiness.`,
        type: 'discharge_eligible',
        is_read: false,
        link: `/discharges`,
        created_at: new Date().toISOString(),
      });
    }

    StoreAPI.logAudit(user, 'RECORD_TEMPERATURE', 'temperature_record', newRecord.id, {
      patient: patient.patient_code,
      temp: validation.value,
      isFever: validation.isFever,
    });

    return newRecord;
  },

  // Doctor Visits & Rounds
  getDoctorVisits: (patientId?: string) => {
    const s = getStore();
    if (patientId) {
      return s.doctorVisits.filter((v) => v.patient_id === patientId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return s.doctorVisits;
  },

  recordDoctorVisit: (data: {
    patient_id: string;
    clinical_observations: string;
    treatment_plan: string;
    follow_up_instructions?: string;
  }, user: UserProfile) => {
    const s = getStore();
    const patient = s.patients.find((p) => p.id === data.patient_id);
    if (!patient) throw new Error('Patient not found.');

    const today = dateKey();
    const todayTemp = s.temperatureRecords.find(
      (r) => r.patient_id === data.patient_id && r.measurement_date === today
    );

    // Business Rule: Prerequisite check! Doctor CANNOT complete visit before nurse records temperature
    const canVisit = canDoctorPerformVisit(Boolean(todayTemp));
    if (!canVisit.allowed) {
      throw new Error(canVisit.reason);
    }

    // Check duplicate visit today
    const existingVisitToday = s.doctorVisits.find(
      (v) => v.patient_id === data.patient_id && v.visit_date === today
    );
    if (existingVisitToday) {
      throw new Error('Doctor routine visit has already been conducted for this patient today.');
    }

    const newVisit: DoctorVisit = {
      id: `visit-${Date.now()}`,
      patient_id: data.patient_id,
      doctor_id: user.id,
      doctor_name: user.full_name,
      temperature_record_id: todayTemp?.id,
      temperature_reading: todayTemp?.temp_celsius,
      visit_date: today,
      visit_time: new Date().toISOString(),
      clinical_observations: data.clinical_observations,
      treatment_plan: data.treatment_plan,
      follow_up_instructions: data.follow_up_instructions,
      created_at: new Date().toISOString(),
    };

    s.doctorVisits.push(newVisit);

    // Add treatment note
    s.treatmentNotes.push({
      id: `note-doc-${Date.now()}`,
      patient_id: data.patient_id,
      author_id: user.id,
      author_name: user.full_name,
      author_role: 'doctor',
      note_type: 'doctor_instruction',
      content: `Doctor Rounds: ${data.clinical_observations} | Plan: ${data.treatment_plan}`,
      created_at: new Date().toISOString(),
    });

    StoreAPI.logAudit(user, 'RECORD_DOCTOR_VISIT', 'doctor_visit', newVisit.id, {
      patient: patient.patient_code,
    });

    return newVisit;
  },

  // Discharge Workflow
  getDischargeRequests: () => getStore().dischargeRequests,
  
  reviewDischargeRequest: (data: {
    request_id: string;
    doctor_status: 'approved' | 'deferred';
    doctor_notes?: string;
    deferral_reason?: string;
  }, user: UserProfile) => {
    const s = getStore();
    const req = s.dischargeRequests.find((r) => r.id === data.request_id);
    if (!req) throw new Error('Discharge request not found.');

    const patient = s.patients.find((p) => p.id === req.patient_id);
    if (!patient) throw new Error('Patient not found.');

    req.doctor_id = user.id;
    req.doctor_name = user.full_name;
    req.doctor_status = data.doctor_status;
    req.doctor_notes = data.doctor_notes;
    req.deferral_reason = data.deferral_reason;
    req.reviewed_at = new Date().toISOString();

    if (data.doctor_status === 'approved') {
      patient.status = 'discharge_approved';
      s.notifications.unshift({
        id: `notif-appr-${Date.now()}`,
        target_role: 'admin',
        title: `Discharge Approved: Bed ${patient.bed_number} (${patient.full_name})`,
        message: `Dr. ${user.full_name} approved discharge. Awaiting administrator final sign-off.`,
        type: 'discharge_approved',
        is_read: false,
        link: `/discharges`,
        created_at: new Date().toISOString(),
      });
    } else {
      patient.status = 'admitted';
      s.notifications.unshift({
        id: `notif-def-${Date.now()}`,
        target_role: 'admin',
        title: `Discharge Deferred: Bed ${patient.bed_number} (${patient.full_name})`,
        message: `Discharge deferred by Dr. ${user.full_name}. Reason: ${data.deferral_reason || 'Clinical observation needed'}`,
        type: 'discharge_eligible',
        is_read: false,
        link: `/discharges`,
        created_at: new Date().toISOString(),
      });
    }

    StoreAPI.logAudit(user, 'REVIEW_DISCHARGE_REQUEST', 'discharge_request', req.id, {
      patient: patient.patient_code,
      status: data.doctor_status,
    });

    return req;
  },

  finalizeDischarge: (data: {
    patient_id: string;
    discharge_summary: string;
  }, user: UserProfile) => {
    const s = getStore();
    const patient = s.patients.find((p) => p.id === data.patient_id);
    if (!patient) throw new Error('Patient not found.');

    if (patient.status !== 'discharge_approved') {
      throw new Error('Patient discharge has not been approved by a physician yet.');
    }

    const today = dateKey();
    const nowIso = new Date().toISOString();

    // Release bed
    const bed = s.beds.find((b) => b.id === patient.bed_id || b.bed_number === patient.bed_number);
    if (bed) {
      bed.status = 'available';
      bed.current_patient_id = null;
      bed.updated_at = nowIso;
    }

    patient.status = 'discharged';
    patient.discharged_at = nowIso;
    patient.bed_id = null;
    patient.bed_number = null;
    patient.updated_at = nowIso;

    // Discharge Record
    const dischargeRecord: DischargeRecord = {
      id: `disch-rec-${Date.now()}`,
      patient_id: patient.id,
      finalized_by: user.id,
      finalized_by_name: user.full_name,
      discharge_date: today,
      discharge_time: nowIso,
      discharge_summary: data.discharge_summary,
      outcome: 'recovered',
      bed_released_at: nowIso,
      created_at: nowIso,
    };
    s.dischargeRecords.unshift(dischargeRecord);

    // Patient Outcome (Recovered)
    const outcome: PatientOutcome = {
      id: `outcome-${Date.now()}`,
      patient_id: patient.id,
      outcome_type: 'recovered',
      outcome_date: today,
      notes: data.discharge_summary,
      recorded_by: user.id,
      recorded_by_name: user.full_name,
      created_at: nowIso,
    };
    s.patientOutcomes.unshift(outcome);

    s.notifications.unshift({
      id: `notif-final-${Date.now()}`,
      target_role: 'all',
      title: `Patient Discharged: ${patient.full_name}`,
      message: `Discharge finalized by ${user.full_name}. Bed freed and patient safely discharged.`,
      type: 'discharge_completed',
      is_read: false,
      link: `/patients/${patient.id}`,
      created_at: nowIso,
    });

    StoreAPI.logAudit(user, 'FINALIZE_DISCHARGE', 'patient', patient.id, {
      patient: patient.patient_code,
      bedFreed: bed?.bed_number,
    });

    return dischargeRecord;
  },

  recordDeathOutcome: (data: {
    patient_id: string;
    cause_of_death: string;
    notes?: string;
  }, user: UserProfile) => {
    const s = getStore();
    const patient = s.patients.find((p) => p.id === data.patient_id);
    if (!patient) throw new Error('Patient not found.');

    const today = dateKey();
    const nowIso = new Date().toISOString();

    // Release bed
    const bed = s.beds.find((b) => b.id === patient.bed_id || b.bed_number === patient.bed_number);
    if (bed) {
      bed.status = 'available';
      bed.current_patient_id = null;
      bed.updated_at = nowIso;
    }

    patient.status = 'deceased';
    patient.discharged_at = nowIso;
    patient.bed_id = null;
    patient.bed_number = null;
    patient.updated_at = nowIso;

    const outcome: PatientOutcome = {
      id: `outcome-death-${Date.now()}`,
      patient_id: patient.id,
      outcome_type: 'deceased',
      outcome_date: today,
      cause_of_death: data.cause_of_death,
      notes: data.notes,
      recorded_by: user.id,
      recorded_by_name: user.full_name,
      created_at: nowIso,
    };
    s.patientOutcomes.unshift(outcome);

    StoreAPI.logAudit(user, 'RECORD_DEATH_OUTCOME', 'patient_outcome', outcome.id, {
      patient: patient.patient_code,
      cause: data.cause_of_death,
    });

    return outcome;
  },

  // Treatment Notes
  getTreatmentNotes: (patientId: string) => {
    return getStore().treatmentNotes.filter((n) => n.patient_id === patientId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  addTreatmentNote: (data: {
    patient_id: string;
    content: string;
    note_type?: 'general' | 'medication' | 'vital' | 'doctor_instruction' | 'nursing_care';
  }, user: UserProfile) => {
    const s = getStore();
    const newNote: TreatmentNote = {
      id: `note-${Date.now()}`,
      patient_id: data.patient_id,
      author_id: user.id,
      author_name: user.full_name,
      author_role: user.role,
      note_type: data.note_type || 'general',
      content: data.content,
      created_at: new Date().toISOString(),
    };
    s.treatmentNotes.unshift(newNote);
    return newNote;
  },

  // Notifications
  getNotifications: (role?: UserRole, userId?: string) => {
    const s = getStore();
    return s.notifications.filter((n) => {
      if (!role && !userId) return true;
      if (n.target_role === 'all') return true;
      if (role && n.target_role === role) return true;
      if (userId && n.target_user_id === userId) return true;
      return false;
    });
  },

  markNotificationRead: (id: string) => {
    const notif = getStore().notifications.find((n) => n.id === id);
    if (notif) notif.is_read = true;
  },

  // Audit
  logAudit: (user: UserProfile, action: string, entity_type: string, entity_id?: string, details?: any) => {
    const s = getStore();
    s.auditLogs.unshift({
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      user_id: user.id,
      user_email: user.email,
      action,
      entity_type,
      entity_id,
      details,
      created_at: new Date().toISOString(),
    });
  },
  getAuditLogs: () => getStore().auditLogs,
};
