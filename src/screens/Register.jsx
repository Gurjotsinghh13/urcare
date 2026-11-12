import React, { useState } from 'react';
import { useApp } from '../context.js';
import { Empty, Notice } from '../components/ui.jsx';
import { addToWaitlist, admitPatient, freeBeds } from '../actions.js';
import { TOTAL_BEDS, fmtTime } from '../logic.js';

const nextId = (state) => {
  const nums = state.patients.map((p) => Number((p.id.match(/^P-(\d+)$/) || [])[1])).filter(Boolean);
  return `P-${Math.max(1000, ...nums) + 1}`;
};

export default function Register() {
  const { state, run, go } = useApp();
  const free = freeBeds(state);
  const blank = { id: nextId(state), name: '', age: '', sex: '', bed: '' };
  const [form, setForm] = useState(blank);
  const [fromWait, setFromWait] = useState(null);
  const [error, setError] = useState('');
  const [wait, setWait] = useState({ name: '', age: '', sex: '' });
  const [waitError, setWaitError] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    const res = run(admitPatient, { ...form, fromWaitlistId: fromWait }, { inline: true });
    if (res.error) return setError(res.error);
    setError('');
    setFromWait(null);
    return setForm({ id: '', name: '', age: '', sex: '', bed: '' });
  };

  const addWait = (e) => {
    e.preventDefault();
    const res = run(addToWaitlist, wait, { inline: true });
    if (res.error) return setWaitError(res.error);
    setWaitError('');
    return setWait({ name: '', age: '', sex: '' });
  };

  const startFromWaitlist = (w) => {
    setFromWait(w.id);
    setForm({ id: nextId(state), name: w.name, age: String(w.age), sex: w.sex, bed: free[0] ? String(free[0]) : '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="stack-lg">
      <div>
        <h1>Register patient</h1>
        <p className="lead">Admit a patient to a free bed. {free.length} of {TOTAL_BEDS} beds are free.</p>
      </div>

      {free.length === 0 && (
        <Notice tone="warn" action={<button className="btn" onClick={() => go('/discharges')}>Open discharges</button>}>
          All {TOTAL_BEDS} beds are occupied. Admission is blocked until a patient is discharged. Add new arrivals to the waiting list below.
        </Notice>
      )}

      <form className="stack form" onSubmit={submit}>
        <h2>{fromWait ? 'Admit from the waiting list' : 'Admit a patient'}</h2>
        <div className="grid2">
          <label className="field"><span>Patient ID</span><input value={form.id} onChange={set('id')} /></label>
          <label className="field"><span>Full name</span><input value={form.name} onChange={set('name')} /></label>
          <label className="field"><span>Age</span><input type="number" min="0" max="120" value={form.age} onChange={set('age')} /></label>
          <label className="field">
            <span>Sex</span>
            <select value={form.sex} onChange={set('sex')}>
              <option value="">Choose</option><option value="F">Female</option><option value="M">Male</option><option value="O">Other</option>
            </select>
          </label>
          <label className="field">
            <span>Bed</span>
            <select value={form.bed} onChange={set('bed')} disabled={free.length === 0}>
              <option value="">{free.length ? 'Choose a free bed' : 'No free beds'}</option>
              {free.map((b) => <option key={b} value={b}>Bed {b}</option>)}
            </select>
          </label>
        </div>
        {error && <Notice tone="error">{error}</Notice>}
        <div className="actions">
          <button className="btn primary" type="submit">Admit patient</button>
          {fromWait && <button className="btn" type="button" onClick={() => { setFromWait(null); setForm(blank); }}>Cancel</button>}
        </div>
      </form>

      <section aria-labelledby="wl">
        <h2 id="wl">Waiting list ({state.waitlist.length})</h2>
        {state.waitlist.length === 0 ? <Empty>Nobody is waiting for a bed.</Empty> : (
          <ul className="list">
            {state.waitlist.map((w) => (
              <li key={w.id} className="row">
                <div className="who"><strong>{w.name}</strong><span className="muted small">Age {w.age}. Added {fmtTime(w.addedAt)}</span></div>
                <div className="done-info">
                  <button className="btn" disabled={free.length === 0} title={free.length ? '' : 'Available when a bed is free'} onClick={() => startFromWaitlist(w)}>Admit to a bed</button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {free.length === 0 && (
          <form className="stack form" onSubmit={addWait}>
            <h3>Add to waiting list</h3>
            <div className="grid2">
              <label className="field"><span>Full name</span><input value={wait.name} onChange={(e) => setWait({ ...wait, name: e.target.value })} /></label>
              <label className="field"><span>Age</span><input type="number" value={wait.age} onChange={(e) => setWait({ ...wait, age: e.target.value })} /></label>
              <label className="field">
                <span>Sex</span>
                <select value={wait.sex} onChange={(e) => setWait({ ...wait, sex: e.target.value })}>
                  <option value="">Choose</option><option value="F">Female</option><option value="M">Male</option><option value="O">Other</option>
                </select>
              </label>
            </div>
            {waitError && <Notice tone="error">{waitError}</Notice>}
            <div className="actions"><button className="btn" type="submit">Add to waiting list</button></div>
          </form>
        )}
      </section>
    </div>
  );
}
