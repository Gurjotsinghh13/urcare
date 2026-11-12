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

  // 2. 74 Beds
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

  // 3. 20 Realistic Fictional Patients covering all scenarios
  const patientDefinitions = [
    // Scenario A: Temp taken today, normal, completed doctor visit
    { code: 'URC-1001', name: 'Eleanor Vance', age: 42, gender: 'F' as const, adm: dMinus6, bed: 1, status: 'admitted' as const, med: 'Mild asthma, seasonal allergies' },
    { code: 'URC-1002', name: 'Liam Gallagher', age: 35, gender: 'M' as const, adm: dMinus5, bed: 2, status: 'admitted' as const, med: 'No prior conditions' },
    
    // Scenario B: Temp taken today, normal, waiting for doctor visit
    { code: 'URC-1003', name: 'Sophia Chen', age: 29, gender: 'F' as const, adm: dMinus4, bed: 3, status: 'admitted' as const, med: 'Type 1 diabetes, monitored' },
    { code: 'URC-1004', name: 'Mateo Morales', age: 51, gender: 'M' as const, adm: dMinus4, bed: 4, status: 'admitted' as const, med: 'Hypertension' },
    
    // Scenario C: High Temperature today (Fever alert > 38.0°C)
    { code: 'URC-1005', name: 'Aisha Al-Mansoor', age: 38, gender: 'F' as const, adm: dMinus3, bed: 5, status: 'admitted' as const, med: 'Active febrile symptoms, productive cough' },
    { code: 'URC-1006', name: 'Robert Kowalski', age: 67, gender: 'M' as const, adm: dMinus2, bed: 6, status: 'admitted' as const, med: 'COPD, high risk' },

    // Scenario D: Pending temperature reading today (Nurse to-do)
    { code: 'URC-1007', name: 'Chloe Dubois', age: 24, gender: 'F' as const, adm: dMinus2, bed: 7, status: 'admitted' as const, med: 'Fatigue, sore throat' },
    { code: 'URC-1008', name: 'James Wilson', age: 45, gender: 'M' as const, adm: dMinus1, bed: 8, status: 'admitted' as const, med: 'Admitted yesterday after close contact exposure' },
    { code: 'URC-1009', name: 'Nadia Petrova', age: 31, gender: 'F' as const, adm: today, bed: 9, status: 'admitted' as const, med: 'Newly admitted morning triage' },

    // Scenario E: 3 Consecutive Fever-Free Days -> Discharge Eligible (Awaiting Doctor Review)
    { code: 'URC-1010', name: 'David Kim', age: 39, gender: 'M' as const, adm: dMinus7, bed: 10, status: 'discharge_eligible' as const, med: 'Resolved viral symptoms, 4 days afebrile' },
    { code: 'URC-1011', name: 'Maria Santos', age: 48, gender: 'F' as const, adm: dMinus6, bed: 11, status: 'discharge_eligible' as const, med: 'Vital signs completely stable' },

    // Scenario F: Doctor Approved Discharge (Awaiting Administrator Finalization)
    { code: 'URC-1012', name: 'Thomas Wright', age: 53, gender: 'M' as const, adm: dMinus7, bed: 12, status: 'discharge_approved' as const, med: 'Cleared by Dr. Vance, ready for discharge summary' },
    { code: 'URC-1013', name: 'Fatima Zahra', age: 33, gender: 'F' as const, adm: dMinus6, bed: 13, status: 'discharge_approved' as const, med: 'Excellent recovery, home quarantine complete' },

    // Scenario G: Recovered & Discharged (Bed released)
    { code: 'URC-1014', name: 'Lucas Meyer', age: 28, gender: 'M' as const, adm: dMinus7, bed: null, status: 'discharged' as const, med: 'Full recovery, negative test, discharged yesterday' },
    { code: 'URC-1015', name: 'Grace Hopper-Lee', age: 62, gender: 'F' as const, adm: dMinus7, bed: null, status: 'discharged' as const, med: 'Discharged safely with follow-up instructions' },
    { code: 'URC-1016', name: 'Arjun Patel', age: 36, gender: 'M' as const, adm: dMinus7, bed: null, status: 'discharged' as const, med: 'Discharged 2 days ago' },
    { code: 'URC-1017', name: 'Hannah Schmidt', age: 41, gender: 'F' as const, adm: dMinus7, bed: null, status: 'discharged' as const, med: 'Discharged 3 days ago' },

    // Scenario H: Deceased Outcome (Clinical complications)
    { code: 'URC-1018', name: 'Arthur Pendelton', age: 84, gender: 'M' as const, adm: dMinus7, bed: null, status: 'deceased' as const, med: 'Severe acute respiratory distress syndrome' },
    
    // Scenario I: Steady recovery (2 fever-free days, day 3 in progress)
    { code: 'URC-1019', name: 'Zoe Thorne', age: 27, gender: 'F' as const, adm: dMinus5, bed: 14, status: 'admitted' as const, med: 'Day 2 afebrile, improving steadily' },
    { code: 'URC-1020', name: 'Benjamin Clark', age: 49, gender: 'M' as const, adm: dMinus3, bed: 15, status: 'admitted' as const, med: 'Day 1 afebrile' },
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
      emergency_contact: `Family Contact (${def.name.split(' ')[0]}) - +1 555-01${idx + 10}`,
      medical_history: def.med,
      admission_notes: `Patient admitted to quarantine following symptom onset and protocol verification.`,
      discharged_at: def.status === 'discharged' ? `${dMinus1}T15:00:00.000Z` : null,
      created_at: `${def.adm}T09:00:00.000Z`,
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
      content: `Patient admitted, baseline vitals checked, isolation precautions active.`,
      created_at: `${def.adm}T10:00:00.000Z`,
    });

    // Populate Temperature history according to scenarios
    if (def.code === 'URC-1001' || def.code === 'URC-1002') {
      // Temp taken today, normal. Doctor visited today.
      [dMinus3, dMinus2, dMinus1, today].forEach((day, dIdx) => {
        const tempVal = dIdx === 0 ? 38.2 : 36.8 + (dIdx * 0.1);
        const tempId = `temp-${def.code}-${day}`;
        temperatureRecords.push({
          id: tempId,
          patient_id: patientId,
          recorded_by: nurseUser.id,
          recorded_by_name: nurseUser.full_name,
          temp_celsius: parseFloat(tempVal.toFixed(1)),
          measurement_date: day,
          measurement_time: `${day}T07:30:00.000Z`,
          is_fever: tempVal >= 38.0,
          is_routine: true,
          notes: 'Patient resting comfortably.',
          created_at: `${day}T07:30:00.000Z`,
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
          visit_time: `${day}T09:30:00.000Z`,
          clinical_observations: 'Lungs clear bilaterally. Good air entry. Oxygen saturation 98% on room air.',
          treatment_plan: 'Continue standard hydration and oral vitamins.',
          follow_up_instructions: 'Re-evaluate on tomorrow morning rounds.',
          created_at: `${day}T09:30:00.000Z`,
        });
      });
    } else if (def.code === 'URC-1003' || def.code === 'URC-1004') {
      // Temp taken today, waiting for doctor visit!
      [dMinus2, dMinus1, today].forEach((day, dIdx) => {
        const tempVal = 37.1 - (dIdx * 0.1);
        const tempId = `temp-${def.code}-${day}`;
        temperatureRecords.push({
          id: tempId,
          patient_id: patientId,
          recorded_by: nurseUser.id,
          recorded_by_name: nurseUser.full_name,
          temp_celsius: parseFloat(tempVal.toFixed(1)),
          measurement_date: day,
          measurement_time: `${day}T08:00:00.000Z`,
          is_fever: false,
          is_routine: true,
          notes: 'Routine morning vitals.',
          created_at: `${day}T08:00:00.000Z`,
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
            visit_time: `${day}T10:15:00.000Z`,
            clinical_observations: 'Stable condition. Blood sugar within target range.',
            treatment_plan: 'Continue routine monitoring.',
            created_at: `${day}T10:15:00.000Z`,
          });
        }
      });
    } else if (def.code === 'URC-1005' || def.code === 'URC-1006') {
      // High temperature today (Fever!)
      [dMinus1, today].forEach((day, dIdx) => {
        const tempVal = dIdx === 0 ? 38.4 : 39.1;
        const tempId = `temp-${def.code}-${day}`;
        temperatureRecords.push({
          id: tempId,
          patient_id: patientId,
          recorded_by: nurseUser.id,
          recorded_by_name: nurseUser.full_name,
          temp_celsius: tempVal,
          measurement_date: day,
          measurement_time: `${day}T07:15:00.000Z`,
          is_fever: true,
          is_routine: true,
          notes: 'High fever recorded. Patient complaining of chills and headache.',
          created_at: `${day}T07:15:00.000Z`,
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
            created_at: `${day}T07:16:00.000Z`,
          });
        }
      });
    } else if (def.code === 'URC-1007' || def.code === 'URC-1008' || def.code === 'URC-1009') {
      // Temp NOT taken today (Pending temperature for Nurse)
      if (def.code !== 'URC-1009') {
        // has previous day reading
        temperatureRecords.push({
          id: `temp-${def.code}-${dMinus1}`,
          patient_id: patientId,
          recorded_by: nurseUser.id,
          recorded_by_name: nurseUser.full_name,
          temp_celsius: 37.3,
          measurement_date: dMinus1,
          measurement_time: `${dMinus1}T08:30:00.000Z`,
          is_fever: false,
          is_routine: true,
          notes: 'Patient stable.',
          created_at: `${dMinus1}T08:30:00.000Z`,
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
    } else if (def.code === 'URC-1010' || def.code === 'URC-1011') {
      // 3 Consecutive Fever-Free Days -> Discharge Eligible (Awaiting Doctor Approval)
      [dMinus3, dMinus2, dMinus1, today].forEach((day) => {
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
          notes: 'Afebrile, asymptomatic.',
          created_at: `${day}T07:45:00.000Z`,
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
    } else if (def.code === 'URC-1012' || def.code === 'URC-1013') {
      // Doctor Approved Discharge -> Awaiting Admin Finalization
      [dMinus4, dMinus3, dMinus2, dMinus1, today].forEach((day) => {
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
          notes: 'Completely stable.',
          created_at: `${day}T07:30:00.000Z`,
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
        doctor_notes: 'Clinically recovered. Clear chest auscultation. Approved for administrative discharge.',
        requested_at: `${dMinus1}T08:00:00.000Z`,
        reviewed_at: `${today}T09:00:00.000Z`,
      });

      notifications.push({
        id: `notif-appr-${def.code}`,
        target_role: 'admin',
        title: `Discharge Approved: Bed ${def.bed} (${def.name})`,
        message: `Dr. Vance has approved discharge. Final administrative sign-off required.`,
        type: 'discharge_approved',
        is_read: false,
        link: `/discharges`,
        created_at: `${today}T09:05:00.000Z`,
      });
    } else if (def.status === 'discharged') {
      // Discharged & Recovered
      [dMinus6, dMinus5, dMinus4, dMinus3, dMinus2].forEach((day) => {
        temperatureRecords.push({
          id: `temp-${def.code}-${day}`,
          patient_id: patientId,
          recorded_by: nurseUser.id,
          recorded_by_name: nurseUser.full_name,
          temp_celsius: 36.7,
          measurement_date: day,
          measurement_time: `${day}T08:00:00.000Z`,
          is_fever: false,
          is_routine: true,
          created_at: `${day}T08:00:00.000Z`,
        });
      });

      dischargeRecords.push({
        id: `disch-rec-${patientId}`,
        patient_id: patientId,
        finalized_by: adminUser.id,
        finalized_by_name: adminUser.full_name,
        discharge_date: dMinus1,
        discharge_time: `${dMinus1}T15:00:00.000Z`,
        discharge_summary: `Patient successfully met 3-day afebrile criteria. Discharge packet provided. Bed released to available pool.`,
        outcome: 'recovered',
        bed_released_at: `${dMinus1}T15:00:00.000Z`,
        created_at: `${dMinus1}T15:00:00.000Z`,
      });

      patientOutcomes.push({
        id: `outcome-${patientId}`,
        patient_id: patientId,
        outcome_type: 'recovered',
        outcome_date: dMinus1,
        notes: 'Full recovery, completed mandatory quarantine period.',
        recorded_by: adminUser.id,
        recorded_by_name: adminUser.full_name,
        created_at: `${dMinus1}T15:00:00.000Z`,
      });
    } else if (def.status === 'deceased') {
      // Deceased Outcome
      [dMinus6, dMinus5, dMinus4, dMinus3].forEach((day) => {
        temperatureRecords.push({
          id: `temp-${def.code}-${day}`,
          patient_id: patientId,
          recorded_by: nurseUser.id,
          recorded_by_name: nurseUser.full_name,
          temp_celsius: 39.4,
          measurement_date: day,
          measurement_time: `${day}T07:00:00.000Z`,
          is_fever: true,
          is_routine: true,
          created_at: `${day}T07:00:00.000Z`,
        });
      });

      patientOutcomes.push({
        id: `outcome-${patientId}`,
        patient_id: patientId,
        outcome_type: 'deceased',
        outcome_date: dMinus2,
        cause_of_death: 'Severe Acute Respiratory Distress Syndrome & Multiorgan Failure',
        notes: 'Clinical deterioration despite maximum support. Resuscitation attempted, time of death certified by Dr. Vance.',
        recorded_by: doctorUser.id,
        recorded_by_name: doctorUser.full_name,
        created_at: `${dMinus2}T18:40:00.000Z`,
      });
    } else if (def.code === 'URC-1019' || def.code === 'URC-1020') {
      // In-progress streaks
      [dMinus2, dMinus1, today].forEach((day, dIdx) => {
        temperatureRecords.push({
          id: `temp-${def.code}-${day}`,
          patient_id: patientId,
          recorded_by: nurseUser.id,
          recorded_by_name: nurseUser.full_name,
          temp_celsius: 36.9 - (dIdx * 0.1),
          measurement_date: day,
          measurement_time: `${day}T08:15:00.000Z`,
          is_fever: false,
          is_routine: true,
          notes: 'Improving.',
          created_at: `${day}T08:15:00.000Z`,
        });
      });
    }
  });

  // 4. Historical Closed Outcomes for robust Analytics (50 total outcomes: 43 recovered, 7 deceased -> 86.0% recovery rate, matching the ~85% benchmark!)
  const historicalOutcomes: Array<{
    patient_id: string;
    outcome_type: 'recovered' | 'deceased';
    outcome_date: string;
    admission_date: string;
    cause_of_death?: string;
  }> = [];

  for (let i = 1; i <= 46; i++) {
    // 40 recovered, 6 deceased
    const isDeceased = i % 7 === 0;
    const daysAgo = Math.floor(i / 2) + 7;
    const outDate = addDays(today, -daysAgo);
    const admDate = addDays(outDate, isDeceased ? -5 : -9);

    historicalOutcomes.push({
      patient_id: `hist-p-${i}`,
      outcome_type: isDeceased ? 'deceased' : 'recovered',
      outcome_date: outDate,
      admission_date: admDate,
      cause_of_death: isDeceased ? 'Respiratory failure from viral pneumonia' : undefined,
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
