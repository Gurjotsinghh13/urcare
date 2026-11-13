import { 
  TOTAL_BEDS, 
  DEFAULT_SETTINGS, 
  dateKey, 
  addDays 
} from './rules';
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
  FacilitySettings 
} from './types';

export const DEMO_USERS = [
  {
    id: '11111111-1111-4111-a111-111111111111',
    email: 'admin@urcare.demo',
    password: 'URcareDemo!2026',
    full_name: 'Dr. Sarah Jenkins (Administrator)',
    role: 'admin' as const,
    phone: '+1 (555) 019-2831',
    is_active: true,
  },
  {
    id: '22222222-2222-4222-a222-222222222222',
    email: 'doctor@urcare.demo',
    password: 'URcareDemo!2026',
    full_name: 'Dr. Marcus Vance (Attending Physician)',
    role: 'doctor' as const,
    phone: '+1 (555) 019-4822',
    is_active: true,
  },
  {
    id: '33333333-3333-4333-a333-333333333333',
    email: 'nurse@urcare.demo',
    password: 'URcareDemo!2026',
    full_name: 'Nurse Priya Sharma (Charge Nurse)',
    role: 'nurse' as const,
    phone: '+1 (555) 019-7819',
    is_active: true,
  },
  {
    id: '44444444-4444-4444-a444-444444444444',
    email: 'manager@urcare.demo',
    password: 'URcareDemo!2026',
    full_name: 'Elena Rostova (Operations Director)',
    role: 'manager' as const,
    phone: '+1 (555) 019-9941',
    is_active: true,
  },
];

export function generateSeedData() {
  const today = dateKey();
  const dMinus1 = addDays(today, -1);
  const dMinus2 = addDays(today, -2);
  const dMinus3 = addDays(today, -3);
  const dMinus4 = addDays(today, -4);
  const dMinus5 = addDays(today, -5);
  const dMinus6 = addDays(today, -6);
  const dMinus7 = addDays(today, -7);

  // 1. Settings
  const settings: FacilitySettings = {
    id: '00000000-0000-0000-0000-000000000001',
    facility_name: DEFAULT_SETTINGS.facilityName,
    capacity: TOTAL_BEDS,
    fever_threshold: DEFAULT_SETTINGS.feverThreshold,
    require_doctor_approval: DEFAULT_SETTINGS.requireDoctorApproval,
    days_required_fever_free: DEFAULT_SETTINGS.daysRequiredFeverFree,
    timezone: DEFAULT_SETTINGS.timezone,
    min_outcome_sample: DEFAULT_SETTINGS.minOutcomeSample,
    updated_at: new Date().toISOString(),
  };

  // 2. 80 Facility Beds distributed across 4 quarantine wards (20 beds per ward)
  const beds: Bed[] = [];
  for (let i = 1; i <= TOTAL_BEDS; i++) {
    const ward = i <= 20 ? 'Ward A (Respiratory)' : i <= 40 ? 'Ward B (Observation)' : i <= 60 ? 'Ward C (Step-down)' : 'Ward D (Isolation)';
    beds.push({
      id: `bed-${i}`,
      bed_number: i,
      ward,
      status: 'available',
      current_patient_id: null,
      updated_at: new Date().toISOString(),
    });
  }

  // 3. 20 Custom Fictional Patients covering all clinical scenarios
  const patientDefinitions = [
    // Scenario A: Temp taken today, normal, completed doctor visit
    { code: 'URC-5201', name: 'Evelyn Harper', age: 47, gender: 'F' as const, adm: dMinus6, bed: 3, status: 'admitted' as const, med: 'Mild allergic rhinitis, non-smoker' },
    { code: 'URC-5202', name: 'Julian Bradley', age: 31, gender: 'M' as const, adm: dMinus5, bed: 7, status: 'admitted' as const, med: 'No prior chronic conditions' },
    
    // Scenario B: Temp taken today, normal, waiting for doctor visit
    { code: 'URC-5203', name: 'Amara Okonjo', age: 36, gender: 'F' as const, adm: dMinus4, bed: 12, status: 'admitted' as const, med: 'Prior gestational diabetes, diet controlled' },
    { code: 'URC-5204', name: 'Vikram Singhania', age: 58, gender: 'M' as const, adm: dMinus4, bed: 18, status: 'admitted' as const, med: 'Mild hypertension, ACE inhibitor therapy' },
    
    // Scenario C: High Temperature today (Fever alert > 38.0°C)
    { code: 'URC-5205', name: 'Seraphina Rossi', age: 29, gender: 'F' as const, adm: dMinus3, bed: 24, status: 'admitted' as const, med: 'Acute febrile viral syndrome, productive cough' },
    { code: 'URC-5206', name: 'Henrik Lindqvist', age: 63, gender: 'M' as const, adm: dMinus2, bed: 29, status: 'admitted' as const, med: 'Moderate chronic bronchitis, higher clinical vulnerability' },

    // Scenario D: Pending temperature reading today (Nurse to-do)
    { code: 'URC-5207', name: 'Talia Al-Hashemi', age: 26, gender: 'F' as const, adm: dMinus2, bed: 34, status: 'admitted' as const, med: 'Mild pharyngitis and myalgia' },
    { code: 'URC-5208', name: 'Caleb Montgomery', age: 41, gender: 'M' as const, adm: dMinus1, bed: 42, status: 'admitted' as const, med: 'High-risk contact exposure quarantine, asymptomatic' },
    { code: 'URC-5209', name: 'Linnea Bergstrom', age: 33, gender: 'F' as const, adm: today, bed: 49, status: 'admitted' as const, med: 'Transferred from satellite triage center' },

    // Scenario E: 3 Consecutive Fever-Free Days -> Discharge Eligible (Awaiting Doctor Review)
    { code: 'URC-5210', name: 'Darius Sterling', age: 44, gender: 'M' as const, adm: dMinus7, bed: 55, status: 'discharge_eligible' as const, med: 'Afebrile for 4 days, clear breath sounds' },
    { code: 'URC-5211', name: 'Mei-Ling Zhou', age: 52, gender: 'F' as const, adm: dMinus6, bed: 61, status: 'discharge_eligible' as const, med: 'Normalized vital signs, ambulatory' },

    // Scenario F: Doctor Approved Discharge (Awaiting Administrator Finalization)
    { code: 'URC-5212', name: 'Alexander Brooks', age: 38, gender: 'M' as const, adm: dMinus7, bed: 67, status: 'discharge_approved' as const, med: 'Clinical review signed off by Dr. Vance, awaiting bed release' },
    { code: 'URC-5213', name: 'Camila Fernandez', age: 46, gender: 'F' as const, adm: dMinus6, bed: 72, status: 'discharge_approved' as const, med: '5 days afebrile, cleared for home release' },

    // Scenario G: Recovered & Discharged (Bed released)
    { code: 'URC-5214', name: 'Zachary Cole', age: 35, gender: 'M' as const, adm: dMinus7, bed: null, status: 'discharged' as const, med: 'Full recovery, negative PCR test, released yesterday' },
    { code: 'URC-5215', name: 'Miriam Goldmann', age: 59, gender: 'F' as const, adm: dMinus7, bed: null, status: 'discharged' as const, med: 'Safe discharge with follow-up instructions' },
    { code: 'URC-5216', name: 'Rohan Deshmukh', age: 32, gender: 'M' as const, adm: dMinus7, bed: null, status: 'discharged' as const, med: 'Discharged 2 days ago' },
    { code: 'URC-5217', name: 'Ingrid Halvorsen', age: 64, gender: 'F' as const, adm: dMinus7, bed: null, status: 'discharged' as const, med: 'Discharged 4 days ago after 7-day observation' },

    // Scenario H: Deceased Outcome (Clinical complications)
    { code: 'URC-5218', name: 'Cornelius Vanderbilt IV', age: 81, gender: 'M' as const, adm: dMinus7, bed: null, status: 'deceased' as const, med: 'Acute respiratory distress with multiorgan failure' },
    
    // Scenario I: Steady recovery (2 fever-free days, day 3 in progress)
    { code: 'URC-5219', name: 'Sienna Walker', age: 30, gender: 'F' as const, adm: dMinus5, bed: 15, status: 'admitted' as const, med: 'Day 2 afebrile, improving comfortably' },
    { code: 'URC-5220', name: 'Mateo Gutierrez', age: 53, gender: 'M' as const, adm: dMinus3, bed: 21, status: 'admitted' as const, med: 'Day 1 afebrile, vitals normalizing' },
  ];

  const patients: Patient[] = [];
  const temperatureRecords: TemperatureRecord[] = [];
  const doctorVisits: DoctorVisit[] = [];
  const treatmentNotes: TreatmentNote[] = [];
  const dischargeRequests: DischargeRequest[] = [];
  const dischargeRecords: DischargeRecord[] = [];
  const patientOutcomes: PatientOutcome[] = [];
  const notifications: AppNotification[] = [];

  const nurseUser = DEMO_USERS[2];
  const doctorUser = DEMO_USERS[1];
  const adminUser = DEMO_USERS[0];

  patientDefinitions.forEach((def, idx) => {
    const patientId = `p-${idx + 1}`;
    const bedObj = def.bed ? beds.find((b) => b.bed_number === def.bed) : null;
    if (bedObj && def.status !== 'discharged' && def.status !== 'deceased') {
      bedObj.status = 'occupied';
      bedObj.current_patient_id = patientId;
    }

    const patient: Patient = {
      id: patientId,
      patient_code: def.code,
      full_name: def.name,
      age: def.age,
      gender: def.gender,
      admission_date: def.adm,
      bed_id: bedObj ? bedObj.id : null,
      bed_number: def.bed,
      status: def.status,
      emergency_contact: `Emergency Contact (${def.name.split(' ')[0]}) - +1 (555) 01${idx + 30}`,
      medical_history: def.med,
      admission_notes: `Patient admitted to quarantine facility under standard clinical protocol.`,
      discharged_at: def.status === 'discharged' ? `${dMinus1}T14:30:00.000Z` : null,
      created_at: `${def.adm}T08:45:00.000Z`,
      updated_at: new Date().toISOString(),
    };
    patients.push(patient);

    // Initial admission nursing note
    treatmentNotes.push({
      id: `note-${idx}-1`,
      patient_id: patientId,
      author_id: nurseUser.id,
      author_name: nurseUser.full_name,
      author_role: 'nurse',
      note_type: 'nursing_care',
      content: `Patient admitted to Bed ${def.bed || 'Released'}. Baseline vitals recorded and isolation protocol established.`,
      created_at: `${def.adm}T09:15:00.000Z`,
    });

    // Populate Temperature history according to scenarios
    if (def.code === 'URC-5201' || def.code === 'URC-5202') {
      // Temp taken today, normal. Doctor visited today.
      [dMinus3, dMinus2, dMinus1, today].forEach((day, dIdx) => {
        const tempVal = dIdx === 0 ? 38.3 : 36.6 + (dIdx * 0.1);
        const tempId = `temp-${def.code}-${day}`;
        temperatureRecords.push({
          id: tempId,
          patient_id: patientId,
          recorded_by: nurseUser.id,
          recorded_by_name: nurseUser.full_name,
          temp_celsius: parseFloat(tempVal.toFixed(1)),
          measurement_date: day,
          measurement_time: `${day}T07:15:00.000Z`,
          is_fever: tempVal >= 38.0,
          is_routine: true,
          notes: 'Patient resting comfortably. Vitals stable.',
          created_at: `${day}T07:15:00.000Z`,
        });

        // Doctor visit
        doctorVisits.push({
          id: `visit-${def.code}-${day}`,
          patient_id: patientId,
          doctor_id: doctorUser.id,
          doctor_name: doctorUser.full_name,
          temperature_record_id: tempId,
          temperature_reading: parseFloat(tempVal.toFixed(1)),
          visit_date: day,
          visit_time: `${day}T09:15:00.000Z`,
          clinical_observations: 'Bilateral lung fields clear. Oxygen saturation 99% on ambient room air. Afebrile.',
          treatment_plan: 'Continue maintenance fluids, balanced diet, and ambulation as tolerated.',
          follow_up_instructions: 'Reassess vitals on morning rounds.',
          created_at: `${day}T09:15:00.000Z`,
        });
      });
    } else if (def.code === 'URC-5203' || def.code === 'URC-5204') {
      // Temp taken today, waiting for doctor visit!
      [dMinus2, dMinus1, today].forEach((day, dIdx) => {
        const tempVal = 37.0 - (dIdx * 0.1);
        const tempId = `temp-${def.code}-${day}`;
        temperatureRecords.push({
          id: tempId,
          patient_id: patientId,
          recorded_by: nurseUser.id,
          recorded_by_name: nurseUser.full_name,
          temp_celsius: parseFloat(tempVal.toFixed(1)),
          measurement_date: day,
          measurement_time: `${day}T07:45:00.000Z`,
          is_fever: false,
          is_routine: true,
          notes: 'Routine morning shift temperature logged.',
          created_at: `${day}T07:45:00.000Z`,
        });

        // Visited on previous days, NOT yet visited today
        if (day !== today) {
          doctorVisits.push({
            id: `visit-${def.code}-${day}`,
            patient_id: patientId,
            doctor_id: doctorUser.id,
            doctor_name: doctorUser.full_name,
            temperature_record_id: tempId,
            temperature_reading: parseFloat(tempVal.toFixed(1)),
            visit_date: day,
            visit_time: `${day}T10:00:00.000Z`,
            clinical_observations: 'Stable status, asymptomatic recovery underway.',
            treatment_plan: 'Standard quarantine supportive care.',
            created_at: `${day}T10:00:00.000Z`,
          });
        }
      });
    } else if (def.code === 'URC-5205' || def.code === 'URC-5206') {
      // High temperature today (Fever alert!)
      [dMinus1, today].forEach((day, dIdx) => {
        const tempVal = dIdx === 0 ? 38.6 : (def.code === 'URC-5205' ? 39.3 : 38.9);
        const tempId = `temp-${def.code}-${day}`;
        temperatureRecords.push({
          id: tempId,
          patient_id: patientId,
          recorded_by: nurseUser.id,
          recorded_by_name: nurseUser.full_name,
          temp_celsius: tempVal,
          measurement_date: day,
          measurement_time: `${day}T07:00:00.000Z`,
          is_fever: true,
          is_routine: true,
          notes: 'Elevated febrile spike observed. Hydration urged, cold compresses applied.',
          created_at: `${day}T07:00:00.000Z`,
        });

        if (day === today) {
          notifications.push({
            id: `notif-fever-${def.code}`,
            target_role: 'doctor',
            title: `High Fever Alert: Bed ${def.bed} (${def.name})`,
            message: `Temperature ${tempVal}°C recorded. Requires immediate clinical evaluation.`,
            type: 'high_temp',
            is_read: false,
            link: `/patients/${patientId}`,
            created_at: `${day}T07:05:00.000Z`,
          });
        }
      });
    } else if (def.code === 'URC-5207' || def.code === 'URC-5208' || def.code === 'URC-5209') {
      // Temp NOT taken today (Pending temperature for Nurse)
      if (def.code !== 'URC-5209') {
        // has previous day reading
        temperatureRecords.push({
          id: `temp-${def.code}-${dMinus1}`,
          patient_id: patientId,
          recorded_by: nurseUser.id,
          recorded_by_name: nurseUser.full_name,
          temp_celsius: 37.1,
          measurement_date: dMinus1,
          measurement_time: `${dMinus1}T08:15:00.000Z`,
          is_fever: false,
          is_routine: true,
          notes: 'Patient stable, resting.',
          created_at: `${dMinus1}T08:15:00.000Z`,
        });
      }
      notifications.push({
        id: `notif-pending-${def.code}`,
        target_role: 'nurse',
        title: `Morning Vitals Due: Bed ${def.bed} (${def.name})`,
        message: `Daily routine temperature has not been recorded yet today.`,
        type: 'temp_pending',
        is_read: false,
        link: `/temperatures?patientId=${patientId}`,
        created_at: `${today}T06:00:00.000Z`,
      });
    } else if (def.code === 'URC-5210' || def.code === 'URC-5211') {
      // 3 Consecutive Fever-Free Days -> Discharge Eligible (Awaiting Doctor Approval)
      [dMinus3, dMinus2, dMinus1, today].forEach((day) => {
        temperatureRecords.push({
          id: `temp-${def.code}-${day}`,
          patient_id: patientId,
          recorded_by: nurseUser.id,
          recorded_by_name: nurseUser.full_name,
          temp_celsius: 36.5,
          measurement_date: day,
          measurement_time: `${day}T07:30:00.000Z`,
          is_fever: false,
          is_routine: true,
          notes: 'Afebrile, clinically clear.',
          created_at: `${day}T07:30:00.000Z`,
        });
      });

      const reqId = `disch-req-${patientId}`;
      dischargeRequests.push({
        id: reqId,
        patient_id: patientId,
        eligible_since: today,
        streak_count: 4,
        doctor_id: null,
        doctor_status: 'pending',
        requested_at: `${today}T08:00:00.000Z`,
      });

      notifications.push({
        id: `notif-eligible-${def.code}`,
        target_role: 'doctor',
        title: `Discharge Eligibility: Bed ${def.bed} (${def.name})`,
        message: `Patient has completed 3+ consecutive fever-free days. Please review and approve discharge readiness.`,
        type: 'discharge_eligible',
        is_read: false,
        link: `/discharges`,
        created_at: `${today}T08:00:00.000Z`,
      });
    } else if (def.code === 'URC-5212' || def.code === 'URC-5213') {
      // Doctor Approved Discharge -> Awaiting Admin Finalization
      [dMinus4, dMinus3, dMinus2, dMinus1, today].forEach((day) => {
        temperatureRecords.push({
          id: `temp-${def.code}-${day}`,
          patient_id: patientId,
          recorded_by: nurseUser.id,
          recorded_by_name: nurseUser.full_name,
          temp_celsius: 36.4,
          measurement_date: day,
          measurement_time: `${day}T07:20:00.000Z`,
          is_fever: false,
          is_routine: true,
          notes: 'Full recovery, vital signs completely normal.',
          created_at: `${day}T07:20:00.000Z`,
        });
      });

      const reqId = `disch-req-${patientId}`;
      dischargeRequests.push({
        id: reqId,
        patient_id: patientId,
        eligible_since: dMinus1,
        streak_count: 4,
        doctor_id: doctorUser.id,
        doctor_name: doctorUser.full_name,
        doctor_status: 'approved',
        doctor_notes: 'Clinically recovered. Clear chest auscultation. Approved for administrative discharge and bed release.',
        requested_at: `${dMinus1}T08:00:00.000Z`,
        reviewed_at: `${today}T08:45:00.000Z`,
      });

      notifications.push({
        id: `notif-appr-${def.code}`,
        target_role: 'admin',
        title: `Discharge Approved: Bed ${def.bed} (${def.name})`,
        message: `Dr. Vance has approved discharge. Final administrative sign-off required.`,
        type: 'discharge_approved',
        is_read: false,
        link: `/discharges`,
        created_at: `${today}T08:50:00.000Z`,
      });
    } else if (def.status === 'discharged') {
      // Discharged & Recovered
      [dMinus6, dMinus5, dMinus4, dMinus3, dMinus2].forEach((day) => {
        temperatureRecords.push({
          id: `temp-${def.code}-${day}`,
          patient_id: patientId,
          recorded_by: nurseUser.id,
          recorded_by_name: nurseUser.full_name,
          temp_celsius: 36.6,
          measurement_date: day,
          measurement_time: `${day}T07:45:00.000Z`,
          is_fever: false,
          is_routine: true,
          created_at: `${day}T07:45:00.000Z`,
        });
      });

      dischargeRecords.push({
        id: `disch-rec-${patientId}`,
        patient_id: patientId,
        finalized_by: adminUser.id,
        finalized_by_name: adminUser.full_name,
        discharge_date: dMinus1,
        discharge_time: `${dMinus1}T14:30:00.000Z`,
        discharge_summary: `Patient successfully completed 3-day afebrile observation period. Discharge certificate and health kit issued. Bed returned to operational pool.`,
        outcome: 'recovered',
        bed_released_at: `${dMinus1}T14:30:00.000Z`,
        created_at: `${dMinus1}T14:30:00.000Z`,
      });

      patientOutcomes.push({
        id: `outcome-${patientId}`,
        patient_id: patientId,
        outcome_type: 'recovered',
        outcome_date: dMinus1,
        notes: 'Full recovery, quarantine observation fulfilled.',
        recorded_by: adminUser.id,
        recorded_by_name: adminUser.full_name,
        created_at: `${dMinus1}T14:30:00.000Z`,
      });
    } else if (def.status === 'deceased') {
      // Deceased Outcome
      [dMinus6, dMinus5, dMinus4, dMinus3].forEach((day) => {
        temperatureRecords.push({
          id: `temp-${def.code}-${day}`,
          patient_id: patientId,
          recorded_by: nurseUser.id,
          recorded_by_name: nurseUser.full_name,
          temp_celsius: 39.5,
          measurement_date: day,
          measurement_time: `${day}T06:45:00.000Z`,
          is_fever: true,
          is_routine: true,
          created_at: `${day}T06:45:00.000Z`,
        });
      });

      patientOutcomes.push({
        id: `outcome-${patientId}`,
        patient_id: patientId,
        outcome_type: 'deceased',
        outcome_date: dMinus2,
        cause_of_death: 'Severe Acute Respiratory Failure & Advanced Cardiopulmonary Arrest',
        notes: 'Rapid clinical decompensation despite advanced supportive intervention. Certified by Dr. Vance.',
        recorded_by: doctorUser.id,
        recorded_by_name: doctorUser.full_name,
        created_at: `${dMinus2}T17:15:00.000Z`,
      });
    } else if (def.code === 'URC-5219' || def.code === 'URC-5220') {
      // In-progress streaks
      [dMinus2, dMinus1, today].forEach((day, dIdx) => {
        temperatureRecords.push({
          id: `temp-${def.code}-${day}`,
          patient_id: patientId,
          recorded_by: nurseUser.id,
          recorded_by_name: nurseUser.full_name,
          temp_celsius: parseFloat((36.8 - (dIdx * 0.1)).toFixed(1)),
          measurement_date: day,
          measurement_time: `${day}T08:00:00.000Z`,
          is_fever: false,
          is_routine: true,
          notes: 'Improving afebrile recovery.',
          created_at: `${day}T08:00:00.000Z`,
        });
      });
    }
  });

  // 4. Historical Closed Outcomes for robust Analytics
  // 54 historical outcomes: 47 recovered, 7 deceased
  // Combined with 4 discharged recovered + 1 deceased = 59 total outcomes (51 recovered, 8 deceased)
  // Recovery Rate: 51 / 59 = 86.4% (Comfortably meets 85.0% benchmark!)
  const historicalOutcomes: Array<{
    patient_id: string;
    outcome_type: 'recovered' | 'deceased';
    outcome_date: string;
    admission_date: string;
    cause_of_death?: string;
  }> = [];

  for (let i = 1; i <= 54; i++) {
    const isDeceased = i % 8 === 0; // 6 deceased across 54 entries
    const daysAgo = Math.floor(i / 2) + 6;
    const outDate = addDays(today, -daysAgo);
    const admDate = addDays(outDate, isDeceased ? -6 : -8);

    historicalOutcomes.push({
      patient_id: `hist-p-${i}`,
      outcome_type: isDeceased ? 'deceased' : 'recovered',
      outcome_date: outDate,
      admission_date: admDate,
      cause_of_death: isDeceased ? 'Severe acute cardiopulmonary compromise' : undefined,
    });
  }

  return {
    users: DEMO_USERS,
    settings,
    beds,
    patients,
    temperatureRecords,
    doctorVisits,
    treatmentNotes,
    dischargeRequests,
    dischargeRecords,
    patientOutcomes,
    historicalOutcomes,
    notifications,
  };
}
