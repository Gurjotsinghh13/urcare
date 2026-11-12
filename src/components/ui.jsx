import React, { useEffect } from 'react';
import { addDays, fmtDate } from '../logic.js';

export function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog" role="dialog" aria-modal="true" aria-label={title}>
        <div className="dialog-head">
          <h2>{title}</h2>
          <button type="button" className="btn quiet" onClick={onClose}>Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export const Pill = ({ tone = 'plain', children }) => <span className={`pill ${tone}`}>{children}</span>;

export const Notice = ({ tone = 'info', children, action }) => (
  <div className={`notice ${tone}`} role={tone === 'error' ? 'alert' : undefined}>
    <div>{children}</div>
    {action}
  </div>
);

export const Empty = ({ children }) => <p className="empty">{children}</p>;

// Daily highest temperature for the last 14 days, with the fever threshold and missed days marked.
export function TempChart({ readings, threshold, today, since, days = 14 }) {
  const W = 600, H = 200, L = 40, R = 12, T = 14, B = 30;
  const keys = Array.from({ length: days }, (_, i) => addDays(today, -(days - 1 - i)));
  const maxes = keys.map((k) => {
    const rs = readings.filter((r) => r.date === k);
    return rs.length ? Math.max(...rs.map((r) => r.temp)) : null;
  });
  const yMin = 35, yMax = 41;
  const x = (i) => L + (i * (W - L - R)) / (days - 1);
  const y = (t) => T + ((yMax - Math.min(Math.max(t, yMin), yMax)) * (H - T - B)) / (yMax - yMin);
  const step = (W - L - R) / (days - 1);

  const runs = [];
  let cur = [];
  maxes.forEach((t, i) => {
    if (t === null) { if (cur.length) runs.push(cur); cur = []; }
    else cur.push([x(i), y(t)]);
  });
  if (cur.length) runs.push(cur);

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Highest temperature each day for the last 14 days">
      {keys.map((k, i) =>
        maxes[i] === null && k >= since ? (
          <rect key={k} x={x(i) - step / 2} y={T} width={step} height={H - T - B} className="missed" />
        ) : null,
      )}
      {[36, 37, 38, 39, 40].map((t) => (
        <g key={t}>
          <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} className="grid" />
          <text x={L - 6} y={y(t) + 4} textAnchor="end" className="axis">{t}°</text>
        </g>
      ))}
      <line x1={L} x2={W - R} y1={y(threshold)} y2={y(threshold)} className="threshold" />
      <text x={W - R} y={y(threshold) - 5} textAnchor="end" className="axis strong">Fever from {threshold.toFixed(1)}°C</text>
      {runs.map((r, i) => <polyline key={i} points={r.map((p) => p.join(',')).join(' ')} className="trend" />)}
      {maxes.map((t, i) =>
        t === null ? null : <circle key={i} cx={x(i)} cy={y(t)} r="4.5" className={t >= threshold ? 'dot fever' : 'dot'} />,
      )}
      {keys.map((k, i) => (i % 2 === 0 || i === days - 1 ? <text key={k} x={x(i)} y={H - 8} textAnchor="middle" className="axis">{fmtDate(k)}</text> : null))}
    </svg>
  );
}
