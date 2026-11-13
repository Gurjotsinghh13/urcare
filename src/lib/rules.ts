// URCARE Core Business Rules & Clinical Calculations
// Pure functions for high testability and rock-solid reliability

export const TOTAL_BEDS = 80;
export const DAYS_REQUIRED_FEVER_FREE = 3;
export const BENCHMARK_RECOVERY_RATE = 85.0; // 85% expected recovery
export const BENCHMARK_MORTALITY_RATE = 15.0; // 15% expected mortality

// Temperature limits in Celsius
export const TEMP_MIN = 34.0;
export const TEMP_MAX = 42.0;
export const CONFIRM_HIGH = 40.0;
export const CONFIRM_LOW = 35.0;

export const DEFAULT_SETTINGS = {
  facilityName: 'URCARE Quarantine Facility',
  capacity: TOTAL_BEDS,
  feverThreshold: 38.0, // configurable by doctor
  requireDoctorApproval: true,
  daysRequiredFeverFree: DAYS_REQUIRED_FEVER_FREE,
  timezone: 'Asia/Kolkata',
  minOutcomeSample: 20,
};

// Date helpers
const pad = (n: number) => String(n).padStart(2, '0');

export function dateKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseDateKey(k: string): Date {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(k: string, n: number): string {
  const d = parseDateKey(k);
  d.setDate(d.getDate() + n);
  return dateKey(d);
}

export function formatTemp(temp: number | null | undefined): string {
  if (temp === null || temp === undefined || isNaN(temp)) return '--';
  return `${Number(temp).toFixed(1)}°C`;
}

export function formatDate(isoOrDateKey: string): string {
  if (!isoOrDateKey) return '--';
  try {
    const d = isoOrDateKey.includes('T') ? new Date(isoOrDateKey) : parseDateKey(isoOrDateKey);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return isoOrDateKey;
  }
}

export function formatTime(iso: string): string {
  if (!iso) return '--';
  try {
    return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

// Temperature Validation
export interface TempValidationResult {
  valid: boolean;
  value?: number;
  error?: string;
  needsConfirmation?: boolean;
  confirmMessage?: string;
  isFever?: boolean;
}

export function validateTemperature(
  rawInput: string | number,
  feverThreshold: number = 38.0
): TempValidationResult {
  if (rawInput === '' || rawInput === null || rawInput === undefined) {
    return { valid: false, error: 'Temperature is required (e.g., 37.2).' };
  }

  const value = typeof rawInput === 'number' ? rawInput : parseFloat(String(rawInput).trim());
  if (isNaN(value)) {
    return { valid: false, error: 'Please enter a valid numeric temperature.' };
  }

  if (value < TEMP_MIN || value > TEMP_MAX) {
    return {
      valid: false,
      error: `${value.toFixed(1)}°C is outside valid clinical physiological range (${TEMP_MIN}–${TEMP_MAX}°C). Check device.`,
    };
  }

  const isFever = value >= feverThreshold;

  if (value >= CONFIRM_HIGH) {
    return {
      valid: true,
      value,
      isFever,
      needsConfirmation: true,
      confirmMessage: `${value.toFixed(1)}°C is dangerously high (hyperpyrexia). Please confirm reading before recording.`,
    };
  }

  if (value <= CONFIRM_LOW) {
    return {
      valid: true,
      value,
      isFever,
      needsConfirmation: true,
      confirmMessage: `${value.toFixed(1)}°C is unusually low (hypothermia). Please confirm reading before recording.`,
    };
  }

  return { valid: true, value, isFever };
}

// Calculation of consecutive fever-free days
// Rule: 3 consecutive complete calendar days fever-free.
// A day counts only if it has at least one reading AND every reading that day is < feverThreshold.
// A missing day breaks the streak.
// A fever resets the streak to 0.
export function calculateFeverFreeStreak(
  readings: Array<{ measurement_date?: string; date?: string; temp_celsius?: number; temp?: number }>,
  today: string,
  feverThreshold: number = 38.0
): number {
  if (!readings || readings.length === 0) return 0;

  // Group readings by date
  const dayReadingsMap = new Map<string, number[]>();
  for (const r of readings) {
    const d = r.measurement_date || r.date;
    const t = r.temp_celsius !== undefined ? r.temp_celsius : r.temp;
    if (d && t !== undefined && !isNaN(t)) {
      if (!dayReadingsMap.has(d)) dayReadingsMap.set(d, []);
      dayReadingsMap.get(d)!.push(Number(t));
    }
  }

  // Check if today has a reading
  const hasReadingToday = dayReadingsMap.has(today);
  let checkDay = hasReadingToday ? today : addDays(today, -1);
  let streak = 0;

  // Scan backwards up to 60 days
  for (let i = 0; i < 60; i++) {
    const temps = dayReadingsMap.get(checkDay);
    if (!temps || temps.length === 0) {
      // Missing reading day breaks the streak
      break;
    }
    const maxTemp = Math.max(...temps);
    if (maxTemp >= feverThreshold) {
      // Fever day resets streak
      break;
    }
    streak += 1;
    checkDay = addDays(checkDay, -1);
  }

  return streak;
}

// Check discharge eligibility
export function isDischargeEligible(
  readings: Array<{ measurement_date?: string; date?: string; temp_celsius?: number; temp?: number }>,
  today: string,
  feverThreshold: number = 38.0,
  requiredDays: number = DAYS_REQUIRED_FEVER_FREE
): boolean {
  return calculateFeverFreeStreak(readings, today, feverThreshold) >= requiredDays;
}

// Clinical Outcomes and Analytics
export interface OutcomeStats {
  totalOutcomes: number;
  recoveredCount: number;
  deceasedCount: number;
  recoveryRate: number | null; // percentage
  mortalityRate: number | null; // percentage
  meetsBenchmark: boolean;
  benchmarkWarning: boolean;
  averageLOSDays: number;
}

export function calculateOutcomeStats(
  outcomes: Array<{ outcome_type: 'recovered' | 'deceased'; admission_date?: string; outcome_date?: string }>,
  minSample: number = 20
): OutcomeStats {
  const recoveredCount = outcomes.filter((o) => o.outcome_type === 'recovered').length;
  const deceasedCount = outcomes.filter((o) => o.outcome_type === 'deceased').length;
  const totalOutcomes = recoveredCount + deceasedCount;

  const recoveryRate = totalOutcomes > 0 ? (recoveredCount / totalOutcomes) * 100 : null;
  const mortalityRate = totalOutcomes > 0 ? (deceasedCount / totalOutcomes) * 100 : null;

  const meetsBenchmark = recoveryRate !== null ? recoveryRate >= BENCHMARK_RECOVERY_RATE : true;
  const benchmarkWarning = totalOutcomes >= minSample && recoveryRate !== null && recoveryRate < BENCHMARK_RECOVERY_RATE;

  // Calculate Average Length of Stay (LOS)
  let totalDays = 0;
  let losCount = 0;
  for (const o of outcomes) {
    if (o.admission_date && o.outcome_date) {
      const start = new Date(o.admission_date).getTime();
      const end = new Date(o.outcome_date).getTime();
      const days = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
      totalDays += days;
      losCount++;
    }
  }

  const averageLOSDays = losCount > 0 ? parseFloat((totalDays / losCount).toFixed(1)) : 8.5;

  return {
    totalOutcomes,
    recoveredCount,
    deceasedCount,
    recoveryRate: recoveryRate !== null ? parseFloat(recoveryRate.toFixed(1)) : null,
    mortalityRate: mortalityRate !== null ? parseFloat(mortalityRate.toFixed(1)) : null,
    meetsBenchmark,
    benchmarkWarning,
    averageLOSDays,
  };
}

// Business Rules Guard: Doctor Visit requires nurse temperature first
export function canDoctorPerformVisit(hasTodayTemperature: boolean): { allowed: boolean; reason?: string } {
  if (!hasTodayTemperature) {
    return {
      allowed: false,
      reason: 'Mandatory clinical prerequisite: Nurse must record today’s temperature before doctor rounds can be performed.',
    };
  }
  return { allowed: true };
}

// Business Rules Guard: Bed release on discharge
export function canAdmitPatient(currentOccupancy: number, maxCapacity: number = TOTAL_BEDS): { allowed: boolean; reason?: string } {
  if (currentOccupancy >= maxCapacity) {
    return {
      allowed: false,
      reason: `Facility is at maximum quarantine capacity (${maxCapacity}/${maxCapacity} beds occupied). No beds available for admission.`,
    };
  }
  return { allowed: true };
}
