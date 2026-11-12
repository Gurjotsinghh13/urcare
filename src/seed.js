import { DEFAULT_SETTINGS, TOTAL_BEDS, addDays, dateKey } from './logic.js';

// Deterministic demo data, built relative to today so the board always looks current.
function rng(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST = ['Aarav', 'Vihaan', 'Ananya', 'Diya', 'Rohan', 'Isha', 'Kabir', 'Meera', 'Arjun', 'Saanvi', 'Neil', 'Tara', 'Dev', 'Anika', 'Yash', 'Riya', 'Farhan', 'Zoya', 'Harsh', 'Nisha', 'Imran', 'Pooja', 'Manav', 'Sneha'];
const LAST = ['Sharma', 'Patil', 'Deshmukh', 'Iyer', 'Khan', 'Nair', 'Gupta', 'Joshi', 'Menon', 'Verma', 'Kulkarni', 'Shaikh', 'Reddy', 'Bhatt', 'Singh', 'Chavan', 'Pillai', 'Mishra', 'Rao', 'Das'];
export const NURSES = ['Asha Kulkarni', 'Neha Pawar', 'Imran Shaikh'];
export const DOCTORS = ['Dr. Rohan Mehta', 'Dr. Sunita Rao'];
export const PLANS = ['Continue current treatment', 'Adjust medication', 'Increase monitoring', 'Fluids and rest'];

const isoAt = (day, h, m) => {
  const [y, mo, d] = day.split('-').map(Number);
  return new Date(y, mo - 1, d, h, m).toISOString();
};

export function buildSeed() {
  const rand = rng(20261112);
  const today = dateKey();
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const between = (a, b) => a + rand() * (b - a);
  const int = (a, b) => Math.floor(between(a, b + 1));
  const r1 = (x) => Math.round(x * 10) / 10;

  const state = {
    version: 1,
    seededOn: today,
    settings: { ...DEFAULT_SETTINGS },
    patients: [],
    readings: [],
    visits: [],
    waitlist: [],
    audit: [],
  };

  let rid = 0;
  let vid = 0;
  const addReading = (pid, day, h, m, temp, by) =>
    state.readings.push({ id: `seed-r${++rid}`, patientId: pid, date: day, time: isoAt(day, h, m), temp: r1(temp), by, role: 'nurse', note: '', reason: '' });
  const addVisit = (pid, day, h, m) =>
    state.visits.push({ id: `seed-v${++vid}`, patientId: pid, date: day, time: isoAt(day, h, m), by: pick(DOCTORS), plan: pick(PLANS), notes: '' });

  // A = 3+ fever-free days, B = 2, C = 1, D = still febrile, E = newly admitted and febrile
  const tags = [...Array(10).fill('A'), ...Array(9).fill('B'), ...Array(9).fill('C'), ...Array(38).fill('D'), ...Array(8).fill('E')];
  for (let i = tags.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [tags[i], tags[j]] = [tags[j], tags[i]];
  }

  let relapseUsed = false;
  for (let bed = 1; bed <= TOTAL_BEDS; bed++) {
    const tag = tags[bed - 1];
    const id = `P-${1000 + bed}`;
    let feverDays;
    let freeDays;
    if (tag === 'A') { feverDays = int(3, 6); freeDays = int(3, 5); }
    else if (tag === 'B') { feverDays = int(3, 6); freeDays = 2; }
    else if (tag === 'C') { feverDays = int(3, 6); freeDays = 1; }
    else if (tag === 'D') { feverDays = int(3, 12); freeDays = 0; }
    else { feverDays = int(1, 2); freeDays = 0; }
    const daysIn = feverDays + freeDays;

    state.patients.push({
      id,
      name: `${pick(FIRST)} ${pick(LAST)}`,
      age: int(19, 79),
      sex: rand() < 0.5 ? 'F' : 'M',
      bed,
      admittedOn: addDays(today, -daysIn),
      status: 'admitted',
      hold: null,
      approval: null,
    });

    for (let k = daysIn; k >= 1; k--) {
      const day = addDays(today, -k);
      const isFever = daysIn - k < feverDays;
      if (isFever && k > 2 && rand() < 0.05) continue; // an old missed reading
      const temp = isFever ? between(38.2, 40.0) : between(36.4, 37.6);
      const nurse = pick(NURSES);
      addReading(id, day, int(6, 9), int(0, 59), temp, nurse);
      if (rand() < 0.05) addReading(id, day, int(11, 13), int(0, 59), temp + between(-0.3, 0.3), nurse); // a duplicate
      if (rand() < 0.85) addVisit(id, day, int(10, 14), int(0, 59));
    }

    if (rand() < 0.55) {
      let t = tag === 'A' || tag === 'B' || tag === 'C' ? between(36.5, 37.4) : between(38.2, 40.0);
      if (tag === 'A' && !relapseUsed && rand() < 0.3) {
        t = between(38.3, 39.2);
        relapseUsed = true;
      }
      addReading(id, today, int(6, 9), int(0, 59), t, pick(NURSES));
      if (rand() < 0.45) addVisit(id, today, int(9, 10), int(0, 59));
    }
  }

  // Earlier outcomes, so the outcome report has something to show: 41 recovered, 9 deceased
  for (let n = 0; n < 50; n++) {
    const deceased = n < 9;
    const closedOn = addDays(today, -int(1, 30));
    state.patients.push({
      id: `P-${900 + n}`,
      name: `${pick(FIRST)} ${pick(LAST)}`,
      age: int(19, 82),
      sex: rand() < 0.5 ? 'F' : 'M',
      bed: null,
      admittedOn: addDays(closedOn, -int(6, 14)),
      status: deceased ? 'deceased' : 'discharged',
      closedOn,
      closedAt: isoAt(closedOn, int(9, 17), int(0, 59)),
      closedBy: deceased ? pick(DOCTORS) : pick(['Priya Nair', 'Karan Joshi']),
      cause: deceased ? 'Respiratory failure' : '',
      hold: null,
      approval: null,
    });
  }

  state.waitlist = [
    { id: 'W-1', name: 'Mahesh Kale', age: 54, sex: 'M', addedAt: isoAt(today, 7, 40) },
    { id: 'W-2', name: 'Fatima Sayyed', age: 31, sex: 'F', addedAt: isoAt(today, 8, 15) },
    { id: 'W-3', name: 'Lakshmi Narayan', age: 67, sex: 'F', addedAt: isoAt(today, 9, 5) },
  ];
  return state;
}
