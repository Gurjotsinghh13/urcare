// URCARE Comprehensive Automated Test Suite
// Validates all critical business logic, workflows, RBAC constraints, and calculations
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  TOTAL_BEDS,
  DAYS_REQUIRED_FEVER_FREE,
  BENCHMARK_RECOVERY_RATE,
  BENCHMARK_MORTALITY_RATE,
  validateTemperature,
  calculateFeverFreeStreak,
  isDischargeEligible,
  calculateOutcomeStats,
  canDoctorPerformVisit,
  canAdmitPatient,
  dateKey,
  addDays,
} from '../src/lib/rules.ts';

import { StoreAPI, resetStore } from '../src/lib/store.ts';
import { DEMO_USERS } from '../src/lib/seed-data.ts';

const today = dateKey();

test('1. Four demo accounts exist with correct credentials and roles', () => {
  const users = DEMO_USERS;
  assert.equal(users.length, 4);

  const roles = users.map((u) => u.role);
  assert.ok(roles.includes('admin'));
  assert.ok(roles.includes('doctor'));
  assert.ok(roles.includes('nurse'));
  assert.ok(roles.includes('manager'));

  const admin = users.find((u) => u.role === 'admin');
  assert.equal(admin.email, 'admin@urcare.demo');
  assert.equal(admin.password, 'URcareDemo!2026');

  const doctor = users.find((u) => u.role === 'doctor');
  assert.equal(doctor.email, 'doctor@urcare.demo');
  assert.equal(doctor.password, 'URcareDemo!2026');

  const nurse = users.find((u) => u.role === 'nurse');
  assert.equal(nurse.email, 'nurse@urcare.demo');

  const manager = users.find((u) => u.role === 'manager');
  assert.equal(manager.email, 'manager@urcare.demo');
});

test('2. Facility capacity is exactly 80 beds with unique bed numbers', () => {
  resetStore();
  const beds = StoreAPI.getBeds();
  assert.equal(beds.length, TOTAL_BEDS);
  assert.equal(beds.length, 80);

  const bedNumbers = beds.map((b) => b.bed_number);
  assert.equal(new Set(bedNumbers).size, 80);
  assert.equal(Math.min(...bedNumbers), 1);
  assert.equal(Math.max(...bedNumbers), 80);
});

test('3. Temperature validation: range error, extreme warning, and fever flag', () => {
  // Range limits: 34.0°C to 42.0°C
  assert.equal(validateTemperature('45.0').valid, false);
  assert.equal(validateTemperature('32.0').valid, false);
  assert.equal(validateTemperature('abc').valid, false);
  assert.equal(validateTemperature('').valid, false);

  // Hyperthermia confirmation (>= 40.0)
  const high = validateTemperature('40.5');
  assert.equal(high.valid, true);
  assert.equal(high.needsConfirmation, true);
  assert.equal(high.isFever, true);

  // Hypothermia confirmation (<= 35.0)
  const low = validateTemperature('34.8');
  assert.equal(low.valid, true);
  assert.equal(low.needsConfirmation, true);
  assert.equal(low.isFever, false);

  // Normal temperature
  const normal = validateTemperature('37.1');
  assert.equal(normal.valid, true);
  assert.equal(normal.value, 37.1);
  assert.equal(normal.isFever, false);

  // Fever threshold
  const fever = validateTemperature('38.2');
  assert.equal(fever.valid, true);
  assert.equal(fever.isFever, true);
});

test('4. Three complete consecutive calendar days required for discharge eligibility', () => {
  // 3 consecutive afebrile days
  const readings = [
    { measurement_date: addDays(today, -3), temp_celsius: 36.8 },
    { measurement_date: addDays(today, -2), temp_celsius: 37.0 },
    { measurement_date: addDays(today, -1), temp_celsius: 36.9 },
  ];
  assert.equal(calculateFeverFreeStreak(readings, today, 38.0), 3);
  assert.equal(isDischargeEligible(readings, today, 38.0, 3), true);
});

test('5. Missing reading day breaks streak and fever resets streak', () => {
  // Missing Day -2
  const brokenStreak = [
    { measurement_date: addDays(today, -3), temp_celsius: 36.8 },
    { measurement_date: addDays(today, -1), temp_celsius: 36.9 },
  ];
  assert.equal(calculateFeverFreeStreak(brokenStreak, today, 38.0), 1);
  assert.equal(isDischargeEligible(brokenStreak, today, 38.0, 3), false);

  // Fever day resets streak
  const feverReset = [
    { measurement_date: addDays(today, -3), temp_celsius: 36.8 },
    { measurement_date: addDays(today, -2), temp_celsius: 38.5 }, // Fever!
    { measurement_date: addDays(today, -1), temp_celsius: 36.9 },
  ];
  assert.equal(calculateFeverFreeStreak(feverReset, today, 38.0), 1);
});

test('6. Nurse can record temperature and duplicate routine entry for today is blocked', () => {
  resetStore();
  const nurse = StoreAPI.getUserByEmail('nurse@urcare.demo');
  const patient = StoreAPI.getPatientById('p-7'); // Talia Al-Hashemi (pending temp)

  // First routine measurement succeeds
  const first = StoreAPI.recordTemperature({
    patient_id: patient.id,
    temp_celsius: 37.1,
    notes: 'Morning vitals recorded',
    is_routine: true,
  }, nurse);
  assert.ok(first.id);
  assert.equal(first.temp_celsius, 37.1);

  // Duplicate routine reading for today is rejected
  assert.throws(() => {
    StoreAPI.recordTemperature({
      patient_id: patient.id,
      temp_celsius: 37.3,
      is_routine: true,
    }, nurse);
  }, /already been recorded/);

  // Extra non-routine measurement with clinical reason succeeds
  const extra = StoreAPI.recordTemperature({
    patient_id: patient.id,
    temp_celsius: 37.4,
    is_routine: false,
    reason_for_extra: 'Post-antipyretic evaluation',
  }, nurse);
  assert.ok(extra.id);
});

test('7. Workflow Constraint: Doctor CANNOT complete visit before nurse records temperature', () => {
  resetStore();
  const doctor = StoreAPI.getUserByEmail('doctor@urcare.demo');
  const patient = StoreAPI.getPatientById('p-8'); // Caleb Montgomery (no temp today)

  // Visiting before nurse records temp fails
  assert.throws(() => {
    StoreAPI.recordDoctorVisit({
      patient_id: patient.id,
      clinical_observations: 'Lungs clear',
      treatment_plan: 'Continue fluids',
    }, doctor);
  }, /Mandatory clinical prerequisite: Nurse must record today’s temperature/);
});

test('8. Doctor visit succeeds after temperature is recorded', () => {
  resetStore();
  const nurse = StoreAPI.getUserByEmail('nurse@urcare.demo');
  const doctor = StoreAPI.getUserByEmail('doctor@urcare.demo');
  const patient = StoreAPI.getPatientById('p-8');

  // Step 1: Nurse logs temperature
  StoreAPI.recordTemperature({
    patient_id: patient.id,
    temp_celsius: 36.9,
    is_routine: true,
  }, nurse);

  // Step 2: Doctor can now complete visit
  const visit = StoreAPI.recordDoctorVisit({
    patient_id: patient.id,
    clinical_observations: 'Afebrile, respiration unlabored, vital signs stable.',
    treatment_plan: 'Maintain current protocol.',
  }, doctor);

  assert.ok(visit.id);
  assert.equal(visit.patient_id, patient.id);
});

test('9. Discharge workflow: Doctor approves, Admin finalizes, Bed is released', () => {
  resetStore();
  const admin = StoreAPI.getUserByEmail('admin@urcare.demo');
  const doctor = StoreAPI.getUserByEmail('doctor@urcare.demo');

  // Patient 12 (Alexander Brooks) is in Bed 67 with doctor approval pending admin finalization
  const patient = StoreAPI.getPatientById('p-12');
  const bedNum = patient.bed_number;
  assert.equal(patient.status, 'discharge_approved');

  // Finalize discharge by admin
  const discharge = StoreAPI.finalizeDischarge({
    patient_id: patient.id,
    discharge_summary: 'Quarantine criteria fulfilled. Full clinical recovery.',
  }, admin);

  assert.ok(discharge.id);
  assert.equal(patient.status, 'discharged');
  assert.equal(patient.bed_number, null);

  // Verify bed is released and available
  const bed = StoreAPI.getBeds().find((b) => b.bed_number === bedNum);
  assert.equal(bed.status, 'available');
  assert.equal(bed.current_patient_id, null);
});

test('10. Recovery Rate and Mortality Rate calculation matches formula and benchmark', () => {
  const outcomes = [
    { outcome_type: 'recovered', admission_date: '2026-11-01', outcome_date: '2026-11-09' },
    { outcome_type: 'recovered', admission_date: '2026-11-02', outcome_date: '2026-11-10' },
    { outcome_type: 'recovered', admission_date: '2026-11-01', outcome_date: '2026-11-09' },
    { outcome_type: 'recovered', admission_date: '2026-11-03', outcome_date: '2026-11-11' },
    { outcome_type: 'deceased', admission_date: '2026-11-01', outcome_date: '2026-11-06' },
  ];

  // 4 recovered, 1 deceased -> Total = 5
  // Recovery = 4 / 5 * 100 = 80.0%
  // Mortality = 1 / 5 * 100 = 20.0%
  const stats = calculateOutcomeStats(outcomes, 5);
  assert.equal(stats.recoveredCount, 4);
  assert.equal(stats.deceasedCount, 1);
  assert.equal(stats.recoveryRate, 80.0);
  assert.equal(stats.mortalityRate, 20.0);
  assert.equal(stats.meetsBenchmark, false); // 80% < 85% benchmark
  assert.equal(stats.benchmarkWarning, true);
});

test('11. Maximum occupancy cannot exceed 80 beds', () => {
  const checkFull = canAdmitPatient(80, 80);
  assert.equal(checkFull.allowed, false);
  assert.match(checkFull.reason, /maximum quarantine capacity/);

  const checkAvailable = canAdmitPatient(79, 80);
  assert.equal(checkAvailable.allowed, true);
});
