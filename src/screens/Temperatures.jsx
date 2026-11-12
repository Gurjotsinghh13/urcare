import React, { useState } from 'react';
import { useApp } from '../context.js';
import { useRows } from '../hooks.js';
import { Empty, Modal, Notice } from '../components/ui.jsx';
import { TempModal } from '../components/modals.jsx';
import { recordTemperature } from '../actions.js';
import { addDays, dayMax, fmtTemp, fmtTime, needsMonitoring } from '../logic.js';

function DueRow({ row, yesterday, onSave, go }) {
  const { p } = row;
  const [v, setV] = useState('');
  const [err, setErr] = useState('');
  const save = () => {
    const res = onSave(p.id, v);
    if (res.error) setErr(res.error);
    else if (res.state) { setV(''); setErr(''); }
  };
  return (
    <li className="row">
      <div className="who">
        <strong>Bed {p.bed}</strong>
        <button className="link" onClick={() => go(`/patient/${p.id}`)}>{p.name}</button>
        <span className="muted small">{p.id}, age {p.age}. {yesterday === null ? 'No reading yesterday' : `Yesterday ${fmtTemp(yesterday)}`}</span>
      </div>
      <div className="entry">
        <label className="sr" htmlFor={`t-${p.id}`}>Temperature for bed {p.bed} in °C</label>
        <input
          id={`t-${p.id}`} type="number" inputMode="decimal" step="0.1" placeholder="°C" value={v}
          onChange={(e) => { setV(e.target.value); setErr(''); }}
          onKeyDown={(e) => e.key === 'Enter' && save()}
        />
        <button className="btn primary" onClick={save}>Save</button>
      </div>
      {err && <p className="row-error" role="alert">{err}</p>}
    </li>
  );
}

export default function Temperatures() {
  const { state, today, run, go } = useApp();
  const rows = useRows();
  const [q, setQ] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [again, setAgain] = useState(null);

  const match = (r) => {
    const s = q.trim().toLowerCase();
    return !s || `bed ${r.p.bed} ${r.p.name} ${r.p.id}`.toLowerCase().includes(s);
  };
  const due = rows.filter((r) => needsMonitoring(r.ds) && !r.info.temp && match(r));
  const done = rows.filter((r) => r.info.temp && match(r));
  const totalDue = rows.filter((r) => needsMonitoring(r.ds) && !r.info.temp).length;
  const totalDone = rows.filter((r) => r.info.temp).length;
  const goal = totalDue + totalDone;

  const onSave = (patientId, temp) => {
    const res = run(recordTemperature, { patientId, temp }, { inline: true });
    if (res.needsConfirm) setConfirm({ patientId, temp, message: res.needsConfirm });
    return res;
  };

  return (
    <div className="stack-lg">
      <div>
        <h1>Temperatures</h1>
        <p className="lead">One reading per patient each day. Patients already measured move to the lower list, so nobody is measured twice by accident.</p>
      </div>

      <div className="progress" role="img" aria-label={`${totalDone} of ${goal} temperatures recorded`}>
        <div className="bar"><i style={{ width: `${goal ? (totalDone / goal) * 100 : 0}%` }} /></div>
        <span>{totalDone} of {goal} recorded today</span>
      </div>

      <label className="field search">
        <span>Find a patient</span>
        <input type="search" placeholder="Bed number, name or ID" value={q} onChange={(e) => setQ(e.target.value)} />
      </label>

      <section aria-labelledby="due">
        <h2 id="due">Still to measure ({due.length})</h2>
        {due.length === 0 ? <Empty>{q ? 'No matching patients are waiting.' : 'Every patient has a reading for today.'}</Empty> : (
          <ul className="list">
            {due.map((r) => (
              <DueRow key={r.p.id} row={r} go={go} onSave={onSave} yesterday={dayMax(state, r.p.id, addDays(today, -1))} />
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="done">
        <h2 id="done">Measured today ({done.length})</h2>
        {done.length === 0 ? <Empty>No readings yet today.</Empty> : (
          <ul className="list">
            {done.map(({ p, info }) => (
              <li key={p.id} className="row">
                <div className="who">
                  <strong>Bed {p.bed}</strong>
                  <button className="link" onClick={() => go(`/patient/${p.id}`)}>{p.name}</button>
                  <span className="muted small">{p.id}</span>
                </div>
                <div className="done-info">
                  <span className={info.febrile ? 'temp fever' : 'temp'}>{fmtTemp(info.temp.temp)}</span>
                  <span className="muted small">{fmtTime(info.temp.time)} by {info.temp.by}</span>
                  <button className="btn" onClick={() => setAgain(p)}>Record another reading</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {confirm && (
        <Modal title="Check this reading" onClose={() => setConfirm(null)}>
          <Notice tone="warn">{confirm.message}</Notice>
          <div className="actions">
            <button className="btn primary" onClick={() => { run(recordTemperature, { patientId: confirm.patientId, temp: confirm.temp, confirmed: true }); setConfirm(null); }}>Confirm and save</button>
            <button className="btn" onClick={() => setConfirm(null)}>Measure again</button>
          </div>
        </Modal>
      )}
      {again && <TempModal patient={again} mode="extra" onClose={() => setAgain(null)} />}
    </div>
  );
}
