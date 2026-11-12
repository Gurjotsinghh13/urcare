import React, { useState } from 'react';
import { useApp } from '../context.js';
import { Empty, Notice } from '../components/ui.jsx';
import { BENCHMARK_MORTALITY, BENCHMARK_SUCCESS, addDays, fmtDate, outcomeStats } from '../logic.js';

const PERIODS = [['7', 'Last 7 days'], ['30', 'Last 30 days'], ['all', 'All time']];

export default function Outcomes() {
  const { state, today, go } = useApp();
  const [period, setPeriod] = useState('30');
  const since = period === 'all' ? null : addDays(today, -Number(period));
  const s = outcomeStats(state, since);
  const sampleOk = s.total >= state.settings.minOutcomeSample;
  const below = s.success !== null && s.success < BENCHMARK_SUCCESS;

  let verdict = <Notice tone="info">No final outcomes in this period yet.</Notice>;
  if (s.total) {
    if (!sampleOk) verdict = <Notice tone="warn">Only {s.total} outcomes in this period. That is too few to judge the success rate reliably (at least {state.settings.minOutcomeSample} needed).</Notice>;
    else if (below) verdict = <Notice tone="error">Success rate is {s.success.toFixed(1)}%, below the {BENCHMARK_SUCCESS}% benchmark. Mortality is {s.mortality.toFixed(1)}% against an expected {BENCHMARK_MORTALITY}%. Review treatment and staffing.</Notice>;
    else verdict = <Notice tone="ok">Success rate is {s.success.toFixed(1)}%, within the {BENCHMARK_SUCCESS}% benchmark.</Notice>;
  }

  return (
    <div className="stack-lg">
      <div>
        <h1>Outcome report</h1>
        <p className="lead">Success rate is recovered patients divided by all final outcomes (recovered plus deaths).</p>
      </div>

      <div className="chips" role="group" aria-label="Reporting period">
        {PERIODS.map(([id, label]) => (
          <button key={id} type="button" className={`chip ${period === id ? 'on' : ''}`} aria-pressed={period === id} onClick={() => setPeriod(id)}>{label}</button>
        ))}
      </div>

      {verdict}

      <dl className="strip">
        <div><dt>Recovered</dt><dd>{s.recovered}</dd></div>
        <div><dt>Deaths</dt><dd>{s.deceased}</dd></div>
        <div><dt>Final outcomes</dt><dd>{s.total}</dd></div>
        <div><dt>Success rate</dt><dd>{s.success === null ? '–' : `${s.success.toFixed(1)}%`}</dd></div>
      </dl>

      {s.success !== null && (
        <div>
          <div className="meter" role="img" aria-label={`Success rate ${s.success.toFixed(1)} percent, benchmark ${BENCHMARK_SUCCESS} percent`}>
            <i className={below ? 'low' : ''} style={{ width: `${s.success}%` }} />
            <b style={{ left: `${BENCHMARK_SUCCESS}%` }} />
          </div>
          <p className="muted small">The marker shows the {BENCHMARK_SUCCESS}% benchmark.</p>
        </div>
      )}

      <section aria-labelledby="log">
        <h2 id="log">Recent outcomes</h2>
        {s.closed.length === 0 ? <Empty>No outcomes in this period.</Empty> : (
          <table className="table">
            <thead><tr><th>Patient</th><th>Outcome</th><th>Date</th><th>Recorded by</th></tr></thead>
            <tbody>
              {s.closed.slice(0, 25).map((p) => (
                <tr key={p.id}>
                  <td><button className="link" onClick={() => go(`/patient/${p.id}`)}>{p.name}</button> <span className="muted small">{p.id}</span></td>
                  <td>{p.status === 'deceased' ? 'Died' : 'Recovered'}</td>
                  <td>{fmtDate(p.closedOn)}</td>
                  <td>{p.closedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
