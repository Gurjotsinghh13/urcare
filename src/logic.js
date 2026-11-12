// Pure business rules for CareTrack. No React in here, so every rule can be tested on its own.

export const TOTAL_BEDS = 74;
export const DAYS_REQUIRED = 3;
export const BENCHMARK_SUCCESS = 85;
export const BENCHMARK_MORTALITY = 15;

// Temperature entry limits (°C)
export const TEMP_MIN = 34.0; // below this or above TEMP_MAX the entry is rejected
export const TEMP_MAX = 42.0;
export const CONFIRM_HIGH = 40.0; // at or above this the nurse must confirm
export const CONFIRM_LOW = 35.0; // at or below this the nurse must confirm

export const DEFAULT_SETTINGS = {
  feverThreshold: 38.0, // set by the head doctor; the brief does not give a number
  requireDoctorApproval: false, // false = system flags discharge automatically, doctor may place a hold
  minOutcomeSample: 20, // outcomes needed before the success rate is treated as reliable
};

const pad = (n) => String(n).padStart(2, '0');
export const dateKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseKey = (k) => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const addDays = (k, n) => {
  const d = parseKey(k);
  d.setDate(d.getDate() + n);
  return dateKey(d);
};
export const fmtTime = (iso) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
export const fmtDate = (k) => parseKey(k).toLocaleDateString([], { day: 'numeric', month: 'short' });
export const fmtTemp = (t) => `${Number(t).toFixed(1)}°C`;

export const admitted = (state) => state.patients.filter((p) => p.status === 'admitted');
export const findPatient = (state, id) => state.patients.find((p) => p.id === id);

const byTime = (a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : 0);
export const allReadings = (state, pid) => state.readings.filter((r) => r.patientId === pid).sort(byTime);
export const allVisits = (state, pid) => state.visits.filter((v) => v.patientId === pid).sort(byTime);
export const readingsOn = (state, pid, day) => allReadings(state, pid).filter((r) => r.date === day);
export const visitsOn = (state, pid, day) => allVisits(state, pid).filter((v) => v.date === day);

export const dayMax = (state, pid, day) => {
  const rs = readingsOn(state, pid, day);
  return rs.length ? Math.max(...rs.map((r) => r.temp)) : null;
};

// Consecutive fever-free days. A day counts only if it has at least one reading and every
// reading that day is below the threshold. A missing day stops the count. If today has no
// reading yet the count ends yesterday, so a pending reading does not erase progress.
export function feverFreeStreak(state, pid, today, threshold) {
  let day = readingsOn(state, pid, today).length ? today : addDays(today, -1);
  let n = 0;
  while (n < 60) {
    const max = dayMax(state, pid, day);
    if (max === null || max >= threshold) break;
    n += 1;
    day = addDays(day, -1);
  }
  return n;
}

export function lastFeverDay(state, pid, threshold) {
  const days = [...new Set(allReadings(state, pid).map((r) => r.date))].sort().reverse();
  return days.find((d) => dayMax(state, pid, d) >= threshold) || null;
}

export function todayInfo(state, p, today, threshold) {
  const rs = readingsOn(state, p.id, today);
  const temp = rs.length ? rs[rs.length - 1] : null;
  const max = rs.length ? Math.max(...rs.map((r) => r.temp)) : null;
  const visit = visitsOn(state, p.id, today)[0] || null;
  const streak = feverFreeStreak(state, p.id, today, threshold);
  return {
    temp,
    dayMax: max,
    visit,
    streak,
    febrile: max !== null && max >= threshold,
    eligible: streak >= DAYS_REQUIRED,
  };
}

// 'not-eligible' | 'hold' | 'awaiting-approval' | 'ready'
export function dischargeState(p, info, settings) {
  if (!info.eligible) return 'not-eligible';
  if (p.hold) return 'hold';
  if (settings.requireDoctorApproval && !p.approval) return 'awaiting-approval';
  return 'ready';
}

// Patients who are ready (or only waiting for approval) leave the nurse and doctor to-do lists.
export const needsMonitoring = (ds) => ds !== 'ready' && ds !== 'awaiting-approval';

export function boardStatus(info, ds) {
  if (ds === 'ready') return 'ready';
  if (ds === 'awaiting-approval') return 'approval';
  if (ds === 'hold') return 'hold';
  if (!info.temp) return 'needs-temp';
  if (!info.visit) return 'needs-visit';
  return 'done';
}

export const STATUS_LABEL = {
  ready: 'Discharge ready',
  approval: 'Needs approval',
  hold: 'Discharge on hold',
  'needs-temp': 'Temp due',
  'needs-visit': 'Visit due',
  done: 'Done today',
};

export function validateTemp(raw) {
  if (raw === '' || raw === null || raw === undefined) return { error: 'Enter the temperature as a number, for example 37.4.' };
  const value = Number(raw);
  if (Number.isNaN(value)) return { error: 'Enter the temperature as a number, for example 37.4.' };
  if (value < TEMP_MIN || value > TEMP_MAX) {
    return { error: `${value.toFixed(1)}°C is outside the possible range of ${TEMP_MIN}–${TEMP_MAX}°C. Check the thermometer and enter the reading again.` };
  }
  if (value >= CONFIRM_HIGH) return { value, confirm: `${value.toFixed(1)}°C is unusually high. Confirm that this reading is correct before saving.` };
  if (value <= CONFIRM_LOW) return { value, confirm: `${value.toFixed(1)}°C is unusually low. Confirm that this reading is correct before saving.` };
  return { value };
}

export function outcomeStats(state, sinceKey) {
  const closed = state.patients
    .filter((p) => p.status !== 'admitted' && (!sinceKey || p.closedOn >= sinceKey))
    .sort((a, b) => (a.closedOn < b.closedOn ? 1 : -1));
  const recovered = closed.filter((p) => p.status === 'discharged').length;
  const deceased = closed.filter((p) => p.status === 'deceased').length;
  const total = recovered + deceased;
  return {
    closed,
    recovered,
    deceased,
    total,
    success: total ? (recovered / total) * 100 : null,
    mortality: total ? (deceased / total) * 100 : null,
  };
}
