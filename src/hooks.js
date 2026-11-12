import { useMemo } from 'react';
import { useApp } from './context.js';
import { admitted, boardStatus, dischargeState, todayInfo } from './logic.js';

// One row per admitted patient, with today's facts and the discharge state worked out once.
export function useRows() {
  const { state, today } = useApp();
  return useMemo(
    () =>
      admitted(state)
        .map((p) => {
          const info = todayInfo(state, p, today, state.settings.feverThreshold);
          const ds = dischargeState(p, info, state.settings);
          return { p, info, ds, status: boardStatus(info, ds) };
        })
        .sort((a, b) => a.p.bed - b.p.bed),
    [state, today],
  );
}
