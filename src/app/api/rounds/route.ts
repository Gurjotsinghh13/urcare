import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { StoreAPI } from '@/lib/store';
import { dateKey, calculateFeverFreeStreak } from '@/lib/rules';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const today = dateKey();
  const settings = StoreAPI.getSettings();
  const admitted = StoreAPI.getAdmittedPatients();
  const temperatures = StoreAPI.getTemperatures();
  const visits = StoreAPI.getDoctorVisits();

  const waitingForVitals: any[] = [];
  const readyForRounds: any[] = [];
  const completedRounds: any[] = [];

  for (const p of admitted) {
    const pTemps = temperatures.filter((t) => t.patient_id === p.id);
    const todayTemp = pTemps.find((t) => t.measurement_date === today && t.is_routine);
    const todayVisit = visits.find((v) => v.patient_id === p.id && v.visit_date === today);
    const streak = calculateFeverFreeStreak(pTemps, today, settings.fever_threshold);

    const item = {
      patient: p,
      todayTemp: todayTemp || null,
      todayVisit: todayVisit || null,
      streak,
      isFever: todayTemp?.is_fever || false,
    };

    if (!todayTemp) {
      waitingForVitals.push(item);
    } else if (!todayVisit) {
      readyForRounds.push(item);
    } else {
      completedRounds.push(item);
    }
  }

  return NextResponse.json({
    today,
    summary: {
      totalAdmitted: admitted.length,
      waitingForVitalsCount: waitingForVitals.length,
      readyForRoundsCount: readyForRounds.length,
      completedRoundsCount: completedRounds.length,
    },
    waitingForVitals,
    readyForRounds,
    completedRounds,
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Only Doctor and Administrator can record doctor rounds
  if (user.role !== 'doctor' && user.role !== 'admin') {
    return NextResponse.json({ 
      error: 'Permission denied: Only physicians can conduct and document clinical rounds.' 
    }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { patient_id, clinical_observations, treatment_plan, follow_up_instructions } = body;

    if (!patient_id || !clinical_observations || !treatment_plan) {
      return NextResponse.json({ 
        error: 'Patient ID, clinical observations, and treatment plan are required.' 
      }, { status: 400 });
    }

    const visit = StoreAPI.recordDoctorVisit({
      patient_id,
      clinical_observations,
      treatment_plan,
      follow_up_instructions,
    }, user);

    return NextResponse.json({ success: true, visit }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
