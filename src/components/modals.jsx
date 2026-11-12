import React, { useState } from 'react';
import { Modal, Notice } from './ui.jsx';
import { useApp } from '../context.js';
import { dischargePatient, recordDeath, recordTemperature, recordVisit, setHold } from '../actions.js';
import { PLANS } from '../seed.js';
import { fmtTime } from '../logic.js';

const who = (p) => `Bed ${p.bed}, ${p.name} (${p.id})`;

// mode: 'first' (nurse, first reading today) | 'extra' (another reading, reason needed) | 'doctor' (doctor records it, reason needed)
export function TempModal({ patient, mode, onClose }) {
  const { run, user } = useApp();
  const [temp, setTemp] = useState('');
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [confirmMsg, setConfirmMsg] = useState('');
  const needsReason = mode !== 'first';

  const submit = (confirmed = false) => {
    const res = run(recordTemperature, { patientId: patient.id, temp, reason, note, confirmed }, { inline: true });
    if (res.needsConfirm) return setConfirmMsg(res.needsConfirm);
    if (res.error) { setConfirmMsg(''); return setError(res.error); }
    return onClose();
  };

  const title = mode === 'doctor' ? 'Record temperature yourself' : mode === 'extra' ? 'Record another reading' : 'Record temperature';
  return (
    <Modal title={title} onClose={onClose}>
      <p className="muted">{who(patient)}</p>
      {mode === 'doctor' && <p>The nurse has not recorded today’s temperature. Your reading is saved under your name and shown in the activity log.</p>}
      <form onSubmit={(e) => { e.preventDefault(); submit(false); }} className="stack">
        <label className="field">
          <span>Temperature (°C)</span>
          <input autoFocus type="number" inputMode="decimal" step="0.1" value={temp} onChange={(e) => { setTemp(e.target.value); setConfirmMsg(''); }} />
        </label>
        {needsReason && (
          <label className="field">
            <span>Reason</span>
            <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder={mode === 'doctor' ? 'Not measured before rounds' : 'Repeat reading after a high value'} />
          </label>
        )}
        <label className="field">
          <span>Note (optional)</span>
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        {error && <Notice tone="error">{error}</Notice>}
        {confirmMsg && (
          <Notice tone="warn" action={<button type="button" className="btn primary" onClick={() => submit(true)}>Confirm and save</button>}>
            {confirmMsg}
          </Notice>
        )}
        <div className="actions">
          <button type="submit" className="btn primary">Save temperature</button>
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
        </div>
      </form>
      <p className="muted small">Signed in as {user.name}.</p>
    </Modal>
  );
}

export function VisitModal({ patient, today: todayReading, onClose }) {
  const { run } = useApp();
  const [plan, setPlan] = useState(PLANS[0]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const submit = (e) => {
    e.preventDefault();
    const res = run(recordVisit, { patientId: patient.id, plan, notes }, { inline: true });
    if (res.error) return setError(res.error);
    return onClose();
  };
  return (
    <Modal title="Record visit" onClose={onClose}>
      <p className="muted">{who(patient)}</p>
      {todayReading && <p>Today’s temperature: <strong>{todayReading.temp.toFixed(1)}°C</strong> at {fmtTime(todayReading.time)} by {todayReading.by}.</p>}
      <form onSubmit={submit} className="stack">
        <label className="field">
          <span>Treatment plan</span>
          <select value={plan} onChange={(e) => setPlan(e.target.value)}>
            {PLANS.map((x) => <option key={x}>{x}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Notes (optional)</span>
          <textarea rows="3" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
        {error && <Notice tone="error">{error}</Notice>}
        <div className="actions">
          <button type="submit" className="btn primary">Record visit</button>
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </Modal>
  );
}

export function HoldModal({ patient, onClose }) {
  const { run } = useApp();
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const submit = (e) => {
    e.preventDefault();
    const res = run(setHold, { patientId: patient.id, reason }, { inline: true });
    if (res.error) return setError(res.error);
    return onClose();
  };
  return (
    <Modal title="Hold discharge" onClose={onClose}>
      <p className="muted">{who(patient)}</p>
      <p>The patient meets the three-day rule. A hold blocks the administrator from discharging until you release it.</p>
      <form onSubmit={submit} className="stack">
        <label className="field">
          <span>Reason for the hold</span>
          <input autoFocus type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Oxygen level still low" />
        </label>
        {error && <Notice tone="error">{error}</Notice>}
        <div className="actions">
          <button type="submit" className="btn primary">Place hold</button>
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </Modal>
  );
}

export function DeathModal({ patient, onClose }) {
  const { run } = useApp();
  const [cause, setCause] = useState('');
  const [error, setError] = useState('');
  const submit = (e) => {
    e.preventDefault();
    const res = run(recordDeath, { patientId: patient.id, cause }, { inline: true });
    if (res.error) return setError(res.error);
    return onClose();
  };
  return (
    <Modal title="Record death" onClose={onClose}>
      <p className="muted">{who(patient)}</p>
      <p>This closes the patient’s record, frees the bed and counts towards the mortality rate. It cannot be undone.</p>
      <form onSubmit={submit} className="stack">
        <label className="field">
          <span>Cause or circumstances</span>
          <input autoFocus type="text" value={cause} onChange={(e) => setCause(e.target.value)} />
        </label>
        {error && <Notice tone="error">{error}</Notice>}
        <div className="actions">
          <button type="submit" className="btn danger">Record death</button>
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </Modal>
  );
}

export function DischargeModal({ patient, onClose }) {
  const { run } = useApp();
  const [error, setError] = useState('');
  const confirm = () => {
    const res = run(dischargePatient, { patientId: patient.id }, { inline: true });
    if (res.error) return setError(res.error);
    return onClose();
  };
  return (
    <Modal title="Discharge patient" onClose={onClose}>
      <p className="muted">{who(patient)}</p>
      <p>This records a recovered outcome and frees bed {patient.bed} for the next patient.</p>
      {error && <Notice tone="error">{error}</Notice>}
      <div className="actions">
        <button type="button" className="btn primary" onClick={confirm}>Discharge and free bed {patient.bed}</button>
        <button type="button" className="btn" onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
}
