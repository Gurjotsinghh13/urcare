import React, { useState } from 'react';
import { useApp } from '../context.js';
import { useRows } from '../hooks.js';
import { Notice } from '../components/ui.jsx';
import {
  BENCHMARK_SUCCESS, STATUS_LABEL, TOTAL_BEDS, addDays, fmtTemp, needsMonitoring, outcomeStats,
} from '../logic.js';

const FILTERS = [
  ['all', 'All beds'],
  ['needs-temp', 'Temp due'],
  ['needs-visit', 'Visit due'],
  ['fever', 'Fever today'],
  ['ready', 'Discharge ready'],
  ['done', 'Done today'],
];

export default function Overview() {
  const { state, user, go, today } = useApp();
  const rows = useRows();
  const [filter, setFilter] = useState('all');

  const monitored = rows.filter((r) => needsMonitoring(r.ds));
  const tempDue = monitored.filter((r) => !r.info.temp);
  const visitReady = monitored.filter((r) => r.info.temp && !r.info.visit);
  const measured = rows.filter((r) => r.info.temp).length;
  const visited = rows.filter((r) => r.info.visit).length;
  const ready = rows.filter((r) => r.ds === 'ready' || r.ds === 'awaiting-approval');
  const recent = outcomeStats(state, addDays(today, -30));
  const sampleOk = recent.total >= state.settings.minOutcomeSample;
  const belowBenchmark = recent.success !== null && recent.success < BENCHMARK_SUCCESS;
  const lateInDay = new Date().getHours() >= 15 && (tempDue.length > 0 || visitReady.length > 0);

  const matches = (r) => {
    if (filter === 'all') return true;
    if (filter === 'fever') return r.info.febrile;
    if (filter === 'ready') return r.status === 'ready' || r.status === 'approval';
    return r.status === filter;
  };
  const count = (id) => rows.filter((r) => (id === 'all' ? true : id === 'fever' ? r.info.febrile : id === 'ready' ? r.status === 'ready' || r.status === 'approval' : r.status === id)).length;

  const byBed = new Map(rows.map((r) => [r.p.bed, r]));
  const beds = Array.from({ length: TOTAL_BEDS }, (_, i) => i + 1);

  const next = {
    nurse: { text: `${tempDue.length} patients still need a temperature reading today.`, label: 'Open temperatures', to: '/temperatures' },
    doctor: { text: `${visitReady.length} patients are ready for your visit. ${tempDue.length} are still waiting for a temperature.`, label: 'Open doctor rounds', to: '/rounds' },
    admin: { text: ready.length ? `${ready.length} patients meet the three-day rule and can go home.` : 'No patients are ready for discharge yet.', label: 'Open discharges', to: '/discharges' },
  }[user.role];

  return (
    <div className="stack-lg">
      <div>
        <h1>Ward overview</h1>
        <p className="lead">Every bed, with what has and has not been done today.</p>
      </div>

      {user.role !== 'nurse' && sampleOk && belowBenchmark && (
        <Notice tone="error" action={<button className="btn" onClick={() => go('/outcomes')}>Open outcome report</button>}>
          Success rate over the last 30 days is {recent.success.toFixed(0)}%, below the {BENCHMARK_SUCCESS}% benchmark ({recent.total} outcomes).
        </Notice>
      )}
      {lateInDay && (
        <Notice tone="warn">
          Late in the day: {tempDue.length} temperatures and {visitReady.length} doctor visits are still pending.
        </Notice>
      )}

      <dl className="strip">
        <div><dt>Beds in use</dt><dd>{rows.length}<span> of {TOTAL_BEDS}</span></dd></div>
        <div><dt>Temperatures today</dt><dd>{measured}<span> done, {tempDue.length} due</span></dd></div>
        <div><dt>Doctor visits today</dt><dd>{visited}<span> done, {visitReady.length} ready</span></dd></div>
        <div><dt>Ready for discharge</dt><dd>{ready.length}<span> patients</span></dd></div>
      </dl>

      <div className="next">
        <p>{next.text}</p>
        <button className="btn primary" onClick={() => go(next.to)}>{next.label}</button>
      </div>

      <section aria-labelledby="board">
        <h2 id="board">Ward board</h2>
        <div className="chips" role="group" aria-label="Filter beds">
          {FILTERS.map(([id, label]) => (
            <button key={id} type="button" className={`chip ${filter === id ? 'on' : ''}`} aria-pressed={filter === id} onClick={() => setFilter(id)}>
              {label} <span>{count(id)}</span>
            </button>
          ))}
        </div>
        <div className="board">
          {beds.map((bed) => {
            const r = byBed.get(bed);
            if (!r) return filter === 'all' ? <div key={bed} className="tile free"><span className="bed">Bed {bed}</span><span className="st">Free</span></div> : null;
            if (!matches(r)) return null;
            const { p, info, status } = r;
            return (
              <button
                key={bed}
                type="button"
                className={`tile s-${status} ${info.febrile ? 'fever' : ''}`}
                onClick={() => go(`/patient/${p.id}`)}
                aria-label={`Bed ${bed}, ${p.name}, ${STATUS_LABEL[status]}`}
              >
                <span className="bed">Bed {bed}</span>
                <span className="t">{info.temp ? `${fmtTemp(info.temp.temp)}${info.febrile ? ' ▲' : ''}` : 'No reading'}</span>
                <span className="st">{STATUS_LABEL[status]}</span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
