import React, { useEffect, useState } from 'react';
import { AppContext } from './context.js';
import { buildSeed } from './seed.js';
import { dateKey } from './logic.js';
import { Notice } from './components/ui.jsx';
import Overview from './screens/Overview.jsx';
import Temperatures from './screens/Temperatures.jsx';
import Rounds from './screens/Rounds.jsx';
import Discharges from './screens/Discharges.jsx';
import Register from './screens/Register.jsx';
import Outcomes from './screens/Outcomes.jsx';
import Settings from './screens/Settings.jsx';
import PatientDetail from './screens/PatientDetail.jsx';

const STATE_KEY = 'caretrack.demo.v1';
const ROLE_KEY = 'caretrack.role.v1';

export const USERS = {
  nurse: { role: 'nurse', name: 'Asha Kulkarni', label: 'Nurse' },
  doctor: { role: 'doctor', name: 'Dr. Rohan Mehta', label: 'Doctor' },
  admin: { role: 'admin', name: 'Priya Nair', label: 'Administrator' },
};

const NAV = {
  nurse: [['overview', 'Overview'], ['temperatures', 'Temperatures']],
  doctor: [['overview', 'Overview'], ['rounds', 'Doctor rounds'], ['discharges', 'Discharges'], ['outcomes', 'Outcome report'], ['settings', 'Settings']],
  admin: [['overview', 'Overview'], ['register', 'Register patient'], ['discharges', 'Discharges'], ['outcomes', 'Outcome report'], ['settings', 'Settings']],
};

const ROLE_INFO = [
  ['nurse', 'Nurse', 'Sees which patients still need a temperature today and records readings.'],
  ['doctor', 'Doctor', 'Sees patients whose temperature is in, records visits, places discharge holds and records deaths.'],
  ['admin', 'Administrator', 'Admits patients, discharges those who meet the three-day rule and reads the outcome report.'],
];

const store = {
  get(k) { try { return window.localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { window.localStorage.setItem(k, v); } catch { /* storage unavailable */ } },
};

function loadState() {
  try {
    const raw = store.get(STATE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      // Demo data is built relative to a day, so start fresh each new day.
      if (s && s.patients && s.seededOn === dateKey()) return s;
    }
  } catch { /* fall through to a fresh seed */ }
  return buildSeed();
}

function useHash() {
  const [hash, setHash] = useState(window.location.hash || '#/overview');
  useEffect(() => {
    const on = () => setHash(window.location.hash || '#/overview');
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return hash;
}

const go = (path) => { window.location.hash = path; window.scrollTo(0, 0); };

export default function App() {
  const [state, setState] = useState(loadState);
  const [role, setRole] = useState(() => store.get(ROLE_KEY));
  const [toast, setToast] = useState(null);
  const hash = useHash();

  useEffect(() => { store.set(STATE_KEY, JSON.stringify(state)); }, [state]);
  useEffect(() => { if (role) store.set(ROLE_KEY, role); }, [role]);
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  const user = role ? USERS[role] : null;
  const today = dateKey();

  const run = (fn, payload, opts = {}) => {
    const res = fn(state, { ...payload, user });
    if (res.error) {
      if (!opts.inline) setToast({ kind: 'error', text: res.error, id: Date.now() });
      return res;
    }
    if (res.needsConfirm) return res;
    setState(res.state);
    if (res.message) setToast({ kind: 'ok', text: res.message, id: Date.now() });
    return res;
  };
  const reset = () => { setState(buildSeed()); setToast({ kind: 'ok', text: 'Demo data reset.', id: Date.now() }); go('/overview'); };

  if (!user) {
    return (
      <main className="welcome">
        <h1>CareTrack</h1>
        <p className="lead">Daily temperature tracking and discharge planning for a 74-bed quarantine and treatment centre. Choose a role to try the prototype.</p>
        <ul className="roles">
          {ROLE_INFO.map(([id, label, text]) => (
            <li key={id}>
              <button className="role-btn" onClick={() => { setRole(id); go('/overview'); }}>
                <strong>{label}</strong>
                <span>{text}</span>
              </button>
            </li>
          ))}
        </ul>
        <p className="muted small">Demo only. Data stays in this browser and no real patient information is used.</p>
      </main>
    );
  }

  const [, route = 'overview', param] = hash.replace('#', '').split('/');
  const allowed = NAV[role].map(([id]) => id);
  let page;
  if (route === 'patient' && param) page = <PatientDetail id={decodeURIComponent(param)} />;
  else if (!allowed.includes(route)) {
    page = (
      <div className="stack">
        <h1>Not available for your role</h1>
        <Notice tone="warn">The {user.label.toLowerCase()} role cannot open this page. Switch role in the top right if you need it.</Notice>
        <button className="btn" onClick={() => go('/overview')}>Back to overview</button>
      </div>
    );
  } else {
    page = { overview: <Overview />, temperatures: <Temperatures />, rounds: <Rounds />, discharges: <Discharges />, register: <Register />, outcomes: <Outcomes />, settings: <Settings /> }[route];
  }

  const ctx = { state, user, today, run, reset, go, settings: state.settings };
  return (
    <AppContext.Provider value={ctx}>
      <header className="top">
        <div className="top-inner">
          <a className="brand" href="#/overview" onClick={() => go('/overview')}>CareTrack</a>
          <nav aria-label="Main">
            {NAV[role].map(([id, label]) => (
              <a key={id} href={`#/${id}`} className={route === id ? 'on' : ''} aria-current={route === id ? 'page' : undefined}>{label}</a>
            ))}
          </nav>
          <label className="role-select">
            <span className="sr">Signed in as</span>
            <select value={role} onChange={(e) => { setRole(e.target.value); go('/overview'); }}>
              {Object.values(USERS).map((u) => <option key={u.role} value={u.role}>{u.label}: {u.name}</option>)}
            </select>
          </label>
        </div>
      </header>
      <main className="page">{page}</main>
      <footer className="foot">Prototype with demo data. Everything is saved in this browser only.</footer>
      <div className="toasts" aria-live="polite">
        {toast && <div key={toast.id} className={`toast ${toast.kind}`}>{toast.text}</div>}
      </div>
    </AppContext.Provider>
  );
}
