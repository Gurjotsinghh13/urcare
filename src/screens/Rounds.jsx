import React, { useState } from 'react';
import { useApp } from '../context.js';
import { useRows } from '../hooks.js';
import { Empty, Pill } from '../components/ui.jsx';
import { TempModal, VisitModal } from '../components/modals.jsx';
import { DAYS_REQUIRED, fmtTemp, fmtTime, needsMonitoring } from '../logic.js';

const streakText = (info) => (info.febrile ? 'Fever today' : `${info.streak} of ${DAYS_REQUIRED} fever-free days`);

export default function Rounds() {
  const { go } = useApp();
  const rows = useRows();
  const [visit, setVisit] = useState(null);
  const [temp, setTemp] = useState(null);

  const monitored = rows.filter((r) => needsMonitoring(r.ds));
  const ready = monitored
    .filter((r) => r.info.temp && !r.info.visit)
    .sort((a, b) => Number(b.info.febrile) - Number(a.info.febrile) || b.info.dayMax - a.info.dayMax);
  const waiting = monitored.filter((r) => !r.info.temp);
  const visited = rows.filter((r) => r.info.visit);

  return (
    <div className="stack-lg">
      <div>
        <h1>Doctor rounds</h1>
        <p className="lead">Start with patients who already have today’s temperature. Feverish patients are listed first.</p>
      </div>

      <section aria-labelledby="ready">
        <h2 id="ready">Ready for your visit ({ready.length})</h2>
        {ready.length === 0 ? <Empty>No patients are waiting for a visit right now.</Empty> : (
          <ul className="list">
            {ready.map(({ p, info, ds }) => (
              <li key={p.id} className="row">
                <div className="who">
                  <strong>Bed {p.bed}</strong>
                  <button className="link" onClick={() => go(`/patient/${p.id}`)}>{p.name}</button>
                  <span className="muted small">{p.id}, age {p.age}</span>
                </div>
                <div className="done-info">
                  <span className={info.febrile ? 'temp fever' : 'temp'}>{fmtTemp(info.temp.temp)}</span>
                  <span className="muted small">{fmtTime(info.temp.time)} by {info.temp.by}</span>
                  <Pill tone={info.febrile ? 'fever' : 'ok'}>{streakText(info)}</Pill>
                  {ds === 'hold' && <Pill tone="warn">Discharge on hold</Pill>}
                  <button className="btn primary" onClick={() => setVisit(p)}>Record visit</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="waiting">
        <h2 id="waiting">Waiting for a temperature ({waiting.length})</h2>
        <p className="muted">A visit cannot be recorded until the nurse has measured the patient. If you need to see someone first, record the temperature yourself and give a reason.</p>
        {waiting.length === 0 ? <Empty>Nobody is waiting for a temperature.</Empty> : (
          <ul className="list">
            {waiting.map(({ p }) => (
              <li key={p.id} className="row">
                <div className="who">
                  <strong>Bed {p.bed}</strong>
                  <button className="link" onClick={() => go(`/patient/${p.id}`)}>{p.name}</button>
                  <span className="muted small">{p.id}, age {p.age}</span>
                </div>
                <div className="done-info">
                  <Pill tone="warn">Not measured yet</Pill>
                  <button className="btn" disabled title="Available after the nurse records today’s temperature">Record visit</button>
                  <button className="btn" onClick={() => setTemp(p)}>Record temperature myself</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="visited">
        <h2 id="visited">Visited today ({visited.length})</h2>
        {visited.length === 0 ? <Empty>No visits recorded yet today.</Empty> : (
          <ul className="list">
            {visited.map(({ p, info }) => (
              <li key={p.id} className="row">
                <div className="who">
                  <strong>Bed {p.bed}</strong>
                  <button className="link" onClick={() => go(`/patient/${p.id}`)}>{p.name}</button>
                </div>
                <div className="done-info">
                  <span className="muted small">{fmtTime(info.visit.time)} by {info.visit.by}. {info.visit.plan}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {visit && <VisitModal patient={visit} today={rows.find((r) => r.p.id === visit.id)?.info.temp} onClose={() => setVisit(null)} />}
      {temp && <TempModal patient={temp} mode="doctor" onClose={() => setTemp(null)} />}
    </div>
  );
}
