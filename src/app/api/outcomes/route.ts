import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { StoreAPI } from '@/lib/store';
import { calculateOutcomeStats } from '@/lib/rules';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const patientOutcomes = StoreAPI.getStore().patientOutcomes;
  const historicalOutcomes = StoreAPI.getStore().historicalOutcomes;
  const settings = StoreAPI.getSettings();

  const all = [
    ...historicalOutcomes,
    ...patientOutcomes.map((o) => ({
      outcome_type: o.outcome_type,
      outcome_date: o.outcome_date,
      admission_date: o.outcome_date,
      cause_of_death: o.cause_of_death,
    })),
  ];

  const stats = calculateOutcomeStats(all, settings.min_outcome_sample);
  return NextResponse.json({ stats, outcomes: patientOutcomes });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Only Doctor or Admin can record death outcome
  if (user.role !== 'doctor' && user.role !== 'admin') {
    return NextResponse.json({ 
      error: 'Permission denied: Only a physician or administrator can certify patient mortality.' 
    }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { patient_id, cause_of_death, notes } = body;

    if (!patient_id || !cause_of_death) {
      return NextResponse.json({ 
        error: 'Patient ID and cause of death are required.' 
      }, { status: 400 });
    }

    const outcome = StoreAPI.recordDeathOutcome({
      patient_id,
      cause_of_death,
      notes,
    }, user);

    return NextResponse.json({ success: true, outcome });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
