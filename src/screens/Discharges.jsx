import React, { useState } from 'react';
import { useApp } from '../context.js';
import { useRows } from '../hooks.js';
import { Empty, Notice, Pill } from '../components/ui.jsx';
import { DischargeModal, HoldModal } from '../components/modals.jsx';
import { approveDischarge, releaseHold } from '../actions.js';
import { DAYS_REQUIRED, fmtDate, lastFeverDay } from '../logic.js';

export default function Discharges() {
  const { state, user, run, go } = useApp();
  const rows = useRows();
  const [discharge, setDischarge] = useState(null);
  const [hold, setHold] = useState(null);
  const thr = state.settings.feverThreshold;

  const readyRows = rows.filter((r) => r.ds === 'ready');
  const approval = rows.filter((r) => r.ds === 'awaiting-approval');
  const held = rows.filter((r) => r.ds === 'hold');
  const close = rows.filter((r) => r.ds === 'not-eligible' && r.info.streak === DAYS_REQUIRED - 1);

  const detail = (p, info) => {
    const last = lastFeverDay(state, p.id, thr);
    return `${info.streak} of ${DAYS_REQUIRED} fever-free days${last ? `. Last fever ${fmtDate(last)}` : ''}`;
  };
  const Who = ({ p }) => (
    <div className="who">
      <strong>Bed {p.bed}</strong>
      <button className="link" onClick={() => go(`/patient/${p.id}`)}>{p.name}</button>
      <span className="muted small">{p.id}, age {p.age}</span>
    </div>
  );

  return (
    <div className="stack-lg">
      <div>
        <h1>Discharges</h1>
        <p className="lead">
          {state.settings.requireDoctorApproval
            ? 'A patient is discharged after three fever-free days, the doctor’s approval and the administrator’s confirmation.'
            : 'A patient who completes three fever-free days appears here automatically. The doctor can place a hold; otherwise the administrator can discharge.'}
        </p>
      </div>

      <section aria-labelledby="ready">
        <h2 id="ready">Ready to go home ({readyRows.length})</h2>
        {readyRows.length === 0 ? <Empty>No patients are ready for discharge.</Empty> : (
          <ul className="list">
            {readyRows.map(({ p, info }) => (
              <li key={p.id} className="row">
                <Who p={p} />
                <div className="done-info">
                  <Pill tone="ok">{detail(p, info)}</Pill>
                  {user.role === 'admin' && <button className="btn primary" onClick={() => setDischarge(p)}>Discharge</button>}
                  {user.role === 'doctor' && <button className="btn" onClick={() => setHold(p)}>Hold discharge</button>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {state.settings.requireDoctorApproval && (
        <section aria-labelledby="approval">
          <h2 id="approval">Waiting for doctor approval ({approval.length})</h2>
          {approval.length === 0 ? <Empty>Nobody is waiting for approval.</Empty> : (
            <ul className="list">
              {approval.map(({ p, info }) => (
                <li key={p.id} className="row">
                  <Who p={p} />
                  <div className="done-info">
                    <Pill tone="warn">{detail(p, info)}</Pill>
                    {user.role === 'doctor' && (
                      <>
                        <button className="btn primary" onClick={() => run(approveDischarge, { patientId: p.id })}>Approve discharge</button>
                        <button className="btn" onClick={() => setHold(p)}>Hold discharge</button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section aria-labelledby="held">
        <h2 id="held">On hold ({held.length})</h2>
        {held.length === 0 ? <Empty>No discharges are on hold.</Empty> : (
          <ul className="list">
            {held.map(({ p }) => (
              <li key={p.id} className="row">
                <Who p={p} />
                <div className="done-info">
                  <Notice tone="warn">{p.hold.by}: {p.hold.reason}</Notice>
                  {user.role === 'doctor' && <button className="btn" onClick={() => run(releaseHold, { patientId: p.id })}>Release hold</button>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="close">
        <h2 id="close">One day to go ({close.length})</h2>
        {close.length === 0 ? <Empty>No patients are one day away.</Empty> : (
          <ul className="list">
            {close.map(({ p, info }) => (
              <li key={p.id} className="row">
                <Who p={p} />
                <div className="done-info"><Pill>{detail(p, info)}</Pill></div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {discharge && <DischargeModal patient={discharge} onClose={() => setDischarge(null)} />}
      {hold && <HoldModal patient={hold} onClose={() => setHold(null)} />}
    </div>
  );
}
