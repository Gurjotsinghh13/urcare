import React, { useState } from 'react';
import { useApp } from '../context.js';
import { Empty, Notice, Pill, TempChart } from '../components/ui.jsx';
import { DeathModal, DischargeModal, HoldModal, TempModal, VisitModal } from '../components/modals.jsx';
import { approveDischarge, releaseHold } from '../actions.js';
import {
  DAYS_REQUIRED, allReadings, allVisits, dischargeState, findPatient, fmtDate, fmtTemp, fmtTime, todayInfo,
} from '../logic.js';

export default function PatientDetail({ id }) {
  const { state, today, user, run, go } = useApp();
  const [modal, setModal] = useState(null);
  const p = findPatient(state, id);

  if (!p) {
    return (
      <div className="stack">
        <h1>Patient not found</h1>
        <p>No patient has the ID {id}.</p>
        <button className="btn" onClick={() => go('/overview')}>Back to overview</button>
      </div>
    );
  }

  const thr = state.settings.feverThreshold;
  const info = todayInfo(state, p, today, thr);
  const ds = dischargeState(p, info, state.settings);
  const readings = allReadings(state, p.id);
  const visits = allVisits(state, p.id);
  const log = state.audit.filter((a) => a.patientId === p.id).slice(0, 8);
  const open = p.status === 'admitted';

  return (
    <div className="stack-lg">
      <div>
        <button className="link back" onClick={() => go('/overview')}>Back to overview</button>
        <h1>{p.name}</h1>
        <p className="lead">
          {p.id}, age {p.age}, {p.sex === 'F' ? 'female' : p.sex === 'M' ? 'male' : 'other'}.
          {open ? ` Bed ${p.bed}, admitted ${fmtDate(p.admittedOn)}.` : ` ${p.status === 'deceased' ? 'Died' : 'Discharged'} on ${fmtDate(p.closedOn)}.`}
        </p>
      </div>

      {!open && <Notice tone="info">This record is closed. {p.status === 'deceased' ? `Cause: ${p.cause || 'not recorded'}.` : 'Recovered.'} Closed by {p.closedBy}.</Notice>}

      {open && (
        <div className="status-line">
          <Pill tone={info.febrile ? 'fever' : info.temp ? 'ok' : 'warn'}>{info.temp ? `Today ${fmtTemp(info.temp.temp)}` : 'No temperature today'}</Pill>
          <Pill tone={info.visit ? 'ok' : 'warn'}>{info.visit ? 'Doctor visited' : 'No doctor visit today'}</Pill>
          <Pill tone={info.eligible ? 'ok' : 'plain'}>{info.streak} of {DAYS_REQUIRED} fever-free days</Pill>
          {ds === 'ready' && <Pill tone="ok">Ready for discharge</Pill>}
          {ds === 'awaiting-approval' && <Pill tone="warn">Waiting for doctor approval</Pill>}
          {ds === 'hold' && <Pill tone="warn">Discharge on hold: {p.hold.reason}</Pill>}
        </div>
      )}

      {open && (
        <div className="actions">
          {user.role === 'nurse' && !info.temp && <button className="btn primary" onClick={() => setModal('temp-first')}>Record temperature</button>}
          {user.role === 'nurse' && info.temp && <button className="btn" onClick={() => setModal('temp-extra')}>Record another reading</button>}
          {user.role === 'doctor' && info.temp && !info.visit && <button className="btn primary" onClick={() => setModal('visit')}>Record visit</button>}
          {user.role === 'doctor' && !info.temp && <button className="btn" onClick={() => setModal('temp-doctor')}>Record temperature myself</button>}
          {user.role === 'doctor' && ds === 'awaiting-approval' && <button className="btn primary" onClick={() => run(approveDischarge, { patientId: p.id })}>Approve discharge</button>}
          {user.role === 'doctor' && (ds === 'ready' || ds === 'awaiting-approval') && <button className="btn" onClick={() => setModal('hold')}>Hold discharge</button>}
          {user.role === 'doctor' && ds === 'hold' && <button className="btn" onClick={() => run(releaseHold, { patientId: p.id })}>Release hold</button>}
          {user.role === 'doctor' && <button className="btn danger-outline" onClick={() => setModal('death')}>Record death</button>}
          {user.role === 'admin' && ds === 'ready' && <button className="btn primary" onClick={() => setModal('discharge')}>Discharge patient</button>}
          {user.role === 'admin' && ds !== 'ready' && <span className="muted">Discharge is available once the three-day rule is met{state.settings.requireDoctorApproval ? ' and the doctor approves' : ''}.</span>}
        </div>
      )}

      <section aria-labelledby="trend">
        <h2 id="trend">Temperature, last 14 days</h2>
        {readings.length === 0 ? <Empty>No temperature history in the demo data for this patient.</Empty> : (
          <>
            <TempChart readings={readings} threshold={thr} today={today} since={p.admittedOn} />
            <p className="muted small">Each dot is the day’s highest reading. Shaded days have no reading.</p>
          </>
        )}
      </section>

      <div className="two-col">
        <section aria-labelledby="rd">
          <h2 id="rd">Readings</h2>
          {readings.length === 0 ? <Empty>No readings.</Empty> : (
            <table className="table">
              <thead><tr><th>When</th><th>Temp</th><th>By</th></tr></thead>
              <tbody>
                {[...readings].reverse().slice(0, 12).map((r) => (
                  <tr key={r.id}>
                    <td>{fmtDate(r.date)}, {fmtTime(r.time)}</td>
                    <td className={r.temp >= thr ? 'temp fever' : 'temp'}>{fmtTemp(r.temp)}</td>
                    <td>{r.by}{r.reason ? <span className="muted small"> ({r.reason})</span> : null}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
        <section aria-labelledby="vs">
          <h2 id="vs">Doctor visits</h2>
          {visits.length === 0 ? <Empty>No visits.</Empty> : (
            <table className="table">
              <thead><tr><th>When</th><th>Plan</th><th>By</th></tr></thead>
              <tbody>
                {[...visits].reverse().slice(0, 12).map((v) => (
                  <tr key={v.id}><td>{fmtDate(v.date)}, {fmtTime(v.time)}</td><td>{v.plan}{v.notes ? <span className="muted small">. {v.notes}</span> : null}</td><td>{v.by}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      {log.length > 0 && (
        <section aria-labelledby="al">
          <h2 id="al">Recent activity</h2>
          <ul className="log">
            {log.map((a) => <li key={a.id}><span className="muted small">{fmtTime(a.at)}</span> {a.action}. {a.detail} <span className="muted small">({a.by})</span></li>)}
          </ul>
        </section>
      )}

      {modal === 'temp-first' && <TempModal patient={p} mode="first" onClose={() => setModal(null)} />}
      {modal === 'temp-extra' && <TempModal patient={p} mode="extra" onClose={() => setModal(null)} />}
      {modal === 'temp-doctor' && <TempModal patient={p} mode="doctor" onClose={() => setModal(null)} />}
      {modal === 'visit' && <VisitModal patient={p} today={info.temp} onClose={() => setModal(null)} />}
      {modal === 'hold' && <HoldModal patient={p} onClose={() => setModal(null)} />}
      {modal === 'death' && <DeathModal patient={p} onClose={() => setModal(null)} />}
      {modal === 'discharge' && <DischargeModal patient={p} onClose={() => setModal(null)} />}
    </div>
  );
}
