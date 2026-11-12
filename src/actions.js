// Every user action is a pure function: (state, payload) -> { state, message } | { error } | { needsConfirm }.
// The checks here are the "logical constraints" a production back end must enforce again on the server.
import {
  DAYS_REQUIRED, TOTAL_BEDS, addDays, admitted, dateKey, dischargeState, findPatient,
  fmtTime, readingsOn, todayInfo, validateTemp, visitsOn,
} from './logic.js';
import { buildSeed } from './seed.js';

let counter = 0;
const uid = (p) => `${p}-${Date.now().toString(36)}-${(counter++).toString(36)}`;
const nowIso = () => new Date().toISOString();
const fail = (error) => ({ error });

function log(state, user, action, detail, patientId = null) {
  const entry = { id: uid('a'), at: nowIso(), by: user.name, role: user.role, action, detail, patientId };
  return { ...state, audit: [entry, ...state.audit].slice(0, 300) };
}

const updatePatient = (state, id, patch) => ({
  ...state,
  patients: state.patients.map((p) => (p.id === id ? { ...p, ...patch } : p)),
});

export const freeBeds = (state) => {
  const used = new Set(admitted(state).map((p) => p.bed));
  const free = [];
  for (let b = 1; b <= TOTAL_BEDS; b++) if (!used.has(b)) free.push(b);
  return free;
};

export function admitPatient(state, { id, name, age, sex, bed, fromWaitlistId, user }) {
  if (user.role !== 'admin') return fail('Only administrators can admit patients.');
  const pid = String(id || '').trim();
  if (!pid) return fail('Enter a patient ID.');
  if (state.patients.some((p) => p.id.toLowerCase() === pid.toLowerCase())) return fail(`Patient ID ${pid} is already in use. Patient IDs must be unique.`);
  if (!String(name || '').trim()) return fail('Enter the patient’s full name.');
  const years = Number(age);
  if (!Number.isInteger(years) || years < 0 || years > 120) return fail('Enter an age between 0 and 120.');
  if (!sex) return fail('Choose the patient’s sex.');
  const bedNo = Number(bed);
  if (!bedNo) return fail(freeBeds(state).length ? 'Choose a bed.' : `All ${TOTAL_BEDS} beds are occupied. Admission is blocked until a patient is discharged.`);
  if (!freeBeds(state).includes(bedNo)) return fail(`Bed ${bedNo} is already taken by another patient. Choose a free bed.`);

  let next = {
    ...state,
    patients: [
      ...state.patients,
      { id: pid, name: String(name).trim(), age: years, sex, bed: bedNo, admittedOn: dateKey(), status: 'admitted', hold: null, approval: null },
    ],
    waitlist: fromWaitlistId ? state.waitlist.filter((w) => w.id !== fromWaitlistId) : state.waitlist,
  };
  next = log(next, user, 'Admitted patient', `${pid} to bed ${bedNo}`, pid);
  return { state: next, message: `${String(name).trim()} admitted to bed ${bedNo}.` };
}

export function addToWaitlist(state, { name, age, sex, user }) {
  if (user.role !== 'admin') return fail('Only administrators can manage the waiting list.');
  if (freeBeds(state).length) return fail('Beds are free. Admit the patient directly instead of using the waiting list.');
  if (!String(name || '').trim()) return fail('Enter the patient’s full name.');
  const years = Number(age);
  if (!Number.isInteger(years) || years < 0 || years > 120) return fail('Enter an age between 0 and 120.');
  if (!sex) return fail('Choose the patient’s sex.');
  const entry = { id: uid('W'), name: String(name).trim(), age: years, sex, addedAt: nowIso() };
  const next = log({ ...state, waitlist: [...state.waitlist, entry] }, user, 'Added to waiting list', entry.name);
  return { state: next, message: `${entry.name} added to the waiting list.` };
}

export function recordTemperature(state, { patientId, temp, note = '', reason = '', confirmed = false, user }) {
  if (!['nurse', 'doctor'].includes(user.role)) return fail('Only nurses and doctors can record temperatures.');
  const p = findPatient(state, patientId);
  if (!p || p.status !== 'admitted') return fail('This patient is no longer admitted, so a temperature cannot be recorded.');

  const check = validateTemp(temp);
  if (check.error) return fail(check.error);

  const today = dateKey();
  const existing = readingsOn(state, patientId, today);
  if (existing.length && !reason.trim()) {
    const last = existing[existing.length - 1];
    return fail(`A temperature was already recorded today at ${fmtTime(last.time)} by ${last.by}. To record another reading, give a reason.`);
  }
  if (user.role === 'doctor' && !reason.trim()) return fail('Give a reason for recording the temperature yourself, for example “not measured before rounds”.');
  if (check.confirm && !confirmed) return { needsConfirm: check.confirm };

  const reading = {
    id: uid('r'), patientId, date: today, time: nowIso(), temp: Math.round(check.value * 10) / 10,
    by: user.name, role: user.role, note: note.trim(), reason: reason.trim(),
  };
  let next = { ...state, readings: [...state.readings, reading] };
  const info = todayInfo(next, p, today, next.settings.feverThreshold);
  if (info.febrile && (p.hold || p.approval)) {
    next = updatePatient(next, patientId, { hold: null, approval: null });
    next = log(next, user, 'Discharge clearance cleared', 'Fever recorded, so the fever-free count restarted', patientId);
  }
  next = log(next, user, 'Recorded temperature', `${reading.temp.toFixed(1)}°C${reason ? ` (${reason.trim()})` : ''}`, patientId);
  return { state: next, message: `${reading.temp.toFixed(1)}°C saved for ${p.name}.` };
}

export function recordVisit(state, { patientId, plan, notes = '', user }) {
  if (user.role !== 'doctor') return fail('Only doctors can record a visit.');
  const p = findPatient(state, patientId);
  if (!p || p.status !== 'admitted') return fail('This patient is no longer admitted.');
  const today = dateKey();
  if (!readingsOn(state, patientId, today).length) {
    return fail('Today’s temperature has not been recorded yet. Ask the nurse, or record it yourself with a reason.');
  }
  const prior = visitsOn(state, patientId, today)[0];
  if (prior) return fail(`A visit was already recorded today at ${fmtTime(prior.time)} by ${prior.by}.`);
  if (!plan) return fail('Choose a treatment plan for this visit.');
  const visit = { id: uid('v'), patientId, date: today, time: nowIso(), by: user.name, plan, notes: notes.trim() };
  const next = log({ ...state, visits: [...state.visits, visit] }, user, 'Recorded visit', plan, patientId);
  return { state: next, message: `Visit recorded for ${p.name}.` };
}

export function approveDischarge(state, { patientId, user }) {
  if (user.role !== 'doctor') return fail('Only doctors can approve a discharge.');
  const p = findPatient(state, patientId);
  if (!p || p.status !== 'admitted') return fail('This patient is no longer admitted.');
  const info = todayInfo(state, p, dateKey(), state.settings.feverThreshold);
  if (!info.eligible) return fail(`Only ${info.streak} of ${DAYS_REQUIRED} fever-free days are recorded, so discharge cannot be approved yet.`);
  const next = log(updatePatient(state, patientId, { approval: { by: user.name, at: nowIso() }, hold: null }), user, 'Approved discharge', p.name, patientId);
  return { state: next, message: `Discharge approved for ${p.name}. The administrator can now discharge.` };
}

export function setHold(state, { patientId, reason, user }) {
  if (user.role !== 'doctor') return fail('Only doctors can place a discharge on hold.');
  const p = findPatient(state, patientId);
  if (!p || p.status !== 'admitted') return fail('This patient is no longer admitted.');
  if (!String(reason || '').trim()) return fail('Give a reason for the hold so the administrator knows why discharge is blocked.');
  const next = log(updatePatient(state, patientId, { hold: { by: user.name, reason: reason.trim(), at: nowIso() }, approval: null }), user, 'Placed discharge on hold', reason.trim(), patientId);
  return { state: next, message: `Discharge on hold for ${p.name}.` };
}

export function releaseHold(state, { patientId, user }) {
  if (user.role !== 'doctor') return fail('Only doctors can release a hold.');
  const p = findPatient(state, patientId);
  if (!p || !p.hold) return fail('There is no hold to release.');
  const next = log(updatePatient(state, patientId, { hold: null }), user, 'Released discharge hold', p.name, patientId);
  return { state: next, message: `Hold released for ${p.name}.` };
}

export function dischargePatient(state, { patientId, user }) {
  if (user.role !== 'admin') return fail('Only administrators can finalise a discharge.');
  const p = findPatient(state, patientId);
  if (!p || p.status !== 'admitted') return fail('This patient is no longer admitted.');
  const info = todayInfo(state, p, dateKey(), state.settings.feverThreshold);
  const ds = dischargeState(p, info, state.settings);
  if (ds === 'not-eligible') return fail(`Only ${info.streak} of ${DAYS_REQUIRED} fever-free days are recorded. Discharge is blocked until the rule is met.`);
  if (ds === 'hold') return fail(`${p.hold.by} placed this discharge on hold: ${p.hold.reason}`);
  if (ds === 'awaiting-approval') return fail('Waiting for the doctor’s approval before this patient can be discharged.');
  const next = log(
    updatePatient(state, patientId, { status: 'discharged', closedOn: dateKey(), closedAt: nowIso(), closedBy: user.name }),
    user, 'Discharged patient', `${p.name}, bed ${p.bed} released`, patientId,
  );
  return { state: next, message: `${p.name} discharged. Bed ${p.bed} is free.` };
}

export function recordDeath(state, { patientId, cause, user }) {
  if (user.role !== 'doctor') return fail('Only doctors can record a death.');
  const p = findPatient(state, patientId);
  if (!p || p.status !== 'admitted') return fail('This patient is no longer admitted.');
  if (!String(cause || '').trim()) return fail('Enter the cause or circumstances. This record is permanent.');
  const next = log(
    updatePatient(state, patientId, { status: 'deceased', closedOn: dateKey(), closedAt: nowIso(), closedBy: user.name, cause: cause.trim(), hold: null, approval: null }),
    user, 'Recorded death', `${p.name}, bed ${p.bed} released`, patientId,
  );
  return { state: next, message: `Outcome recorded for ${p.name}. Bed ${p.bed} is free.` };
}

export function updateSettings(state, { feverThreshold, requireDoctorApproval, user }) {
  let settings = { ...state.settings };
  const changes = [];
  if (feverThreshold !== undefined) {
    if (user.role !== 'doctor') return fail('Only doctors can change the fever threshold.');
    const t = Number(feverThreshold);
    if (Number.isNaN(t) || t < 37 || t > 40) return fail('The fever threshold must be between 37.0°C and 40.0°C.');
    settings.feverThreshold = Math.round(t * 10) / 10;
    changes.push(`fever threshold ${settings.feverThreshold.toFixed(1)}°C`);
  }
  if (requireDoctorApproval !== undefined) {
    if (user.role !== 'admin') return fail('Only administrators can change the discharge approval mode.');
    settings.requireDoctorApproval = Boolean(requireDoctorApproval);
    changes.push(`doctor approval ${settings.requireDoctorApproval ? 'required' : 'not required'}`);
  }
  const next = log({ ...state, settings }, user, 'Changed settings', changes.join(', '));
  return { state: next, message: 'Settings saved.' };
}

export const resetDemo = () => buildSeed();
export { addDays };
