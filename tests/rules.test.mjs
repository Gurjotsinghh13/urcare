// Run with: npm test   (uses Node's built-in test runner, no extra packages)
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSeed } from '../src/seed.js';
import {
  addDays, admitted, dateKey, dischargeState, feverFreeStreak, outcomeStats, todayInfo, validateTemp,
} from '../src/logic.js';
import {
  admitPatient, dischargePatient, freeBeds, recordDeath, recordTemperature, recordVisit, setHold,
  approveDischarge, updateSettings,
} from '../src/actions.js';

const nurse = { role: 'nurse', name: 'Test Nurse' };
const doctor = { role: 'doctor', name: 'Test Doctor' };
const admin = { role: 'admin', name: 'Test Admin' };
const today = dateKey();

const emptyState = () => ({
  settings: { feverThreshold: 38, requireDoctorApproval: false, minOutcomeSample: 20 },
  patients: [{ id: 'P-1', name: 'Test Patient', age: 40, sex: 'F', bed: 1, admittedOn: addDays(today, -6), status: 'admitted', hold: null, approval: null }],
  readings: [], visits: [], waitlist: [], audit: [],
});
const reading = (day, temp, i = 0) => ({ id: `r${day}${i}`, patientId: 'P-1', date: day, time: `${day}T0${7 + i}:00:00.000Z`, temp, by: 'x', role: 'nurse', note: '', reason: '' });
const withReadings = (list) => ({ ...emptyState(), readings: list.map(([off, t], i) => reading(addDays(today, off), t, i)) });

test('seed data matches the brief: 74 beds, all full, 50 earlier outcomes', () => {
  const s = buildSeed();
  const beds = admitted(s).map((p) => p.bed);
  assert.equal(beds.length, 74);
  assert.equal(new Set(beds).size, 74);
  assert.equal(freeBeds(s).length, 0);
  const o = outcomeStats(s, null);
  assert.equal(o.total, 50);
  assert.equal(o.deceased, 9);
});

test('three fever-free days are counted from consecutive calendar days', () => {
  const s = withReadings([[-3, 37.0], [-2, 36.8], [-1, 37.1]]);
  assert.equal(feverFreeStreak(s, 'P-1', today, 38), 3);
});

test('a missing day breaks the streak and a fever resets it', () => {
  assert.equal(feverFreeStreak(withReadings([[-3, 37.0], [-1, 37.1]]), 'P-1', today, 38), 1);
  assert.equal(feverFreeStreak(withReadings([[-3, 37.0], [-2, 36.8], [-1, 37.1], [0, 38.4]]), 'P-1', today, 38), 0);
});

test('a second reading on the same day with a fever makes that day a fever day', () => {
  const s = withReadings([[-2, 37.0], [-1, 37.0], [-1, 38.5]]);
  assert.equal(feverFreeStreak(s, 'P-1', today, 38), 0);
});

test('temperature validation: range error, confirmation, normal', () => {
  assert.ok(validateTemp('45').error);
  assert.ok(validateTemp('abc').error);
  assert.ok(validateTemp('40.6').confirm);
  assert.ok(validateTemp('34.8').confirm);
  assert.equal(validateTemp('37.2').value, 37.2);
});

test('nurse can record one reading per day; a duplicate needs a reason', () => {
  let s = emptyState();
  const first = recordTemperature(s, { patientId: 'P-1', temp: '37.4', user: nurse });
  assert.ok(first.state);
  s = first.state;
  const dup = recordTemperature(s, { patientId: 'P-1', temp: '37.6', user: nurse });
  assert.match(dup.error, /already recorded/);
  const extra = recordTemperature(s, { patientId: 'P-1', temp: '37.6', reason: 'Repeat check', user: nurse });
  assert.ok(extra.state);
});

test('unusual readings ask for confirmation and out-of-range readings are rejected', () => {
  const s = emptyState();
  assert.ok(recordTemperature(s, { patientId: 'P-1', temp: '40.8', user: nurse }).needsConfirm);
  assert.ok(recordTemperature(s, { patientId: 'P-1', temp: '40.8', confirmed: true, user: nurse }).state);
  assert.ok(recordTemperature(s, { patientId: 'P-1', temp: '50', user: nurse }).error);
});

test('only nurses and doctors record temperatures; a doctor must give a reason', () => {
  const s = emptyState();
  assert.ok(recordTemperature(s, { patientId: 'P-1', temp: '37', user: admin }).error);
  assert.ok(recordTemperature(s, { patientId: 'P-1', temp: '37', user: doctor }).error);
  assert.ok(recordTemperature(s, { patientId: 'P-1', temp: '37', reason: 'Not measured before rounds', user: doctor }).state);
});

test('a doctor visit needs today’s temperature first and cannot be recorded twice', () => {
  let s = emptyState();
  assert.match(recordVisit(s, { patientId: 'P-1', plan: 'Continue current treatment', user: doctor }).error, /temperature/i);
  s = recordTemperature(s, { patientId: 'P-1', temp: '38.9', user: nurse }).state;
  const v = recordVisit(s, { patientId: 'P-1', plan: 'Adjust medication', user: doctor });
  assert.ok(v.state);
  assert.match(recordVisit(v.state, { patientId: 'P-1', plan: 'Adjust medication', user: doctor }).error, /already recorded/);
  assert.ok(recordVisit(s, { patientId: 'P-1', plan: 'Adjust medication', user: nurse }).error);
});

test('discharge is blocked until the three-day rule is met', () => {
  const s = withReadings([[-2, 37.0], [-1, 37.0]]);
  assert.match(dischargePatient(s, { patientId: 'P-1', user: admin }).error, /2 of 3/);
});

test('automatic mode: eligible patient can be discharged, a hold blocks it, the bed is freed', () => {
  const s = withReadings([[-3, 37.0], [-2, 36.9], [-1, 37.1]]);
  const info = todayInfo(s, s.patients[0], today, 38);
  assert.equal(dischargeState(s.patients[0], info, s.settings), 'ready');
  const held = setHold(s, { patientId: 'P-1', reason: 'Oxygen low', user: doctor });
  assert.match(dischargePatient(held.state, { patientId: 'P-1', user: admin }).error, /hold/);
  assert.ok(dischargePatient(s, { patientId: 'P-1', user: nurse }).error);
  const done = dischargePatient(s, { patientId: 'P-1', user: admin });
  assert.equal(done.state.patients[0].status, 'discharged');
  assert.equal(admitted(done.state).length, 0);
});

test('approval mode: the administrator waits for the doctor', () => {
  let s = withReadings([[-3, 37.0], [-2, 36.9], [-1, 37.1]]);
  s = updateSettings(s, { requireDoctorApproval: true, user: admin }).state;
  assert.match(dischargePatient(s, { patientId: 'P-1', user: admin }).error, /approval/);
  s = approveDischarge(s, { patientId: 'P-1', user: doctor }).state;
  assert.ok(dischargePatient(s, { patientId: 'P-1', user: admin }).state);
});

test('a fever after approval clears the approval and the hold', () => {
  let s = withReadings([[-3, 37.0], [-2, 36.9], [-1, 37.1]]);
  s = setHold(s, { patientId: 'P-1', reason: 'Check bloods', user: doctor }).state;
  s = recordTemperature(s, { patientId: 'P-1', temp: '38.7', user: nurse }).state;
  assert.equal(s.patients[0].hold, null);
});

test('admission is blocked when all beds are full and bed IDs must be unique', () => {
  const full = buildSeed();
  const res = admitPatient(full, { id: 'P-5000', name: 'New Patient', age: 30, sex: 'F', bed: 1, user: admin });
  assert.match(res.error, /already taken|occupied/);
  assert.match(admitPatient(emptyState(), { id: 'P-1', name: 'Dup', age: 30, sex: 'F', bed: 2, user: admin }).error, /unique/);
  assert.ok(admitPatient(emptyState(), { id: 'P-2', name: 'Fine', age: 30, sex: 'F', bed: 2, user: admin }).state);
  assert.ok(admitPatient(emptyState(), { id: 'P-2', name: 'Fine', age: 30, sex: 'F', bed: 2, user: nurse }).error);
});

test('deaths are recorded by doctors and the success rate uses recovered over all outcomes', () => {
  const s = emptyState();
  assert.ok(recordDeath(s, { patientId: 'P-1', cause: 'Respiratory failure', user: admin }).error);
  const dead = recordDeath(s, { patientId: 'P-1', cause: 'Respiratory failure', user: doctor });
  const o = outcomeStats(dead.state, null);
  assert.equal(o.deceased, 1);
  assert.equal(o.success, 0);
  const o2 = outcomeStats(buildSeed(), null);
  assert.equal(Math.round(o2.success), 82);
});

test('only doctors set the fever threshold, and it must be sensible', () => {
  const s = emptyState();
  assert.ok(updateSettings(s, { feverThreshold: 38.5, user: nurse }).error);
  assert.ok(updateSettings(s, { feverThreshold: 45, user: doctor }).error);
  assert.equal(updateSettings(s, { feverThreshold: 38.5, user: doctor }).state.settings.feverThreshold, 38.5);
});
