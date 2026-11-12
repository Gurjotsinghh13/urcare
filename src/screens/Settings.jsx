import React, { useState } from 'react';
import { useApp } from '../context.js';
import { Empty, Notice } from '../components/ui.jsx';
import { updateSettings } from '../actions.js';
import { fmtDate, fmtTime } from '../logic.js';

export default function Settings() {
  const { state, user, run, reset } = useApp();
  const [thr, setThr] = useState(String(state.settings.feverThreshold));
  const [error, setError] = useState('');
  const saveThr = (e) => {
    e.preventDefault();
    const res = run(updateSettings, { feverThreshold: thr }, { inline: true });
    setError(res.error || '');
  };

  return (
    <div className="stack-lg">
      <div>
        <h1>Settings</h1>
        <p className="lead">Clinical and administrative rules. Each role can change only its own.</p>
      </div>

      <section className="stack" aria-labelledby="fv">
        <h2 id="fv">Fever threshold</h2>
        <p>A reading at or above this temperature counts as a fever and restarts the three-day count. The brief gives no number, so the head doctor sets it. Current value: <strong>{state.settings.feverThreshold.toFixed(1)}°C</strong>.</p>
        {user.role === 'doctor' ? (
          <form className="stack form" onSubmit={saveThr}>
            <label className="field narrow"><span>Threshold (°C)</span><input type="number" step="0.1" min="37" max="40" value={thr} onChange={(e) => setThr(e.target.value)} /></label>
            {error && <Notice tone="error">{error}</Notice>}
            <div className="actions"><button className="btn primary" type="submit">Save threshold</button></div>
          </form>
        ) : <p className="muted">Only doctors can change this.</p>}
      </section>

      <section className="stack" aria-labelledby="ap">
        <h2 id="ap">Discharge approval</h2>
        <p>
          {state.settings.requireDoctorApproval
            ? 'On: a doctor must approve each discharge after the three-day rule is met.'
            : 'Off: the system flags a patient for discharge as soon as the rule is met. The doctor can place a hold, which blocks discharge.'}
        </p>
        {user.role === 'admin' ? (
          <div className="actions">
            <button className="btn" onClick={() => run(updateSettings, { requireDoctorApproval: !state.settings.requireDoctorApproval })}>
              {state.settings.requireDoctorApproval ? 'Turn doctor approval off' : 'Turn doctor approval on'}
            </button>
          </div>
        ) : <p className="muted">Only administrators can change this.</p>}
      </section>

      <section className="stack" aria-labelledby="demo">
        <h2 id="demo">Demo data</h2>
        <p>This prototype keeps its data in this browser only. Reset to start again with a full ward of 74 patients.</p>
        <div className="actions"><button className="btn danger-outline" onClick={() => { if (window.confirm('Reset all demo data?')) reset(); }}>Reset demo data</button></div>
      </section>

      <section aria-labelledby="act">
        <h2 id="act">Activity log</h2>
        {state.audit.length === 0 ? <Empty>No actions yet. Record a temperature or admit a patient and it will appear here.</Empty> : (
          <ul className="log">
            {state.audit.slice(0, 30).map((a) => (
              <li key={a.id}><span className="muted small">{fmtDate(a.at.slice(0, 10))}, {fmtTime(a.at)}</span> <strong>{a.action}.</strong> {a.detail} <span className="muted small">({a.by}, {a.role})</span></li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
