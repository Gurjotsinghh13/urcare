import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { StoreAPI } from '@/lib/store';
import { dateKey, calculateFeverFreeStreak, isDischargeEligible } from '@/lib/rules';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const patientId = params.id;
  const patient = StoreAPI.getPatientById(patientId);
  if (!patient) {
    return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
  }

  const today = dateKey();
  const settings = StoreAPI.getSettings();
  const temperatures = StoreAPI.getTemperatures(patient.id);
  const visits = StoreAPI.getDoctorVisits(patient.id);
  const notes = StoreAPI.getTreatmentNotes(patient.id);
  const dischargeReqs = StoreAPI.getDischargeRequests().filter((r) => r.patient_id === patient.id);
  const outcome = StoreAPI.getStore().patientOutcomes.find((o) => o.patient_id === patient.id);

  const streak = calculateFeverFreeStreak(temperatures, today, settings.fever_threshold);
  const eligible = isDischargeEligible(temperatures, today, settings.fever_threshold, settings.days_required_fever_free);
  const todayTemp = temperatures.find((t) => t.measurement_date === today && t.is_routine);
  const todayVisit = visits.find((v) => v.visit_date === today);

  return NextResponse.json({
    patient,
    clinical: {
      feverFreeStreak: streak,
      isDischargeEligible: eligible,
      todayTemperature: todayTemp || null,
      todayVisit: todayVisit || null,
      canDoctorVisitToday: Boolean(todayTemp) && !todayVisit,
      feverThreshold: settings.fever_threshold,
      daysRequired: settings.days_required_fever_free,
    },
    temperatures,
    visits,
    treatmentNotes: notes,
    dischargeRequests: dischargeReqs,
    outcome: outcome || null,
  });
}
