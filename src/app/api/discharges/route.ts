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
  const dischargeRequests = StoreAPI.getDischargeRequests();
  const completedDischarges = StoreAPI.getStore().dischargeRecords;

  // Find all patients with active streak and status
  const queue = admitted.map((p) => {
    const pTemps = temperatures.filter((t) => t.patient_id === p.id);
    const streak = calculateFeverFreeStreak(pTemps, today, settings.fever_threshold);
    const req = dischargeRequests.find((r) => r.patient_id === p.id);

    return {
      patient: p,
      streak,
      feverThreshold: settings.fever_threshold,
      daysRequired: settings.days_required_fever_free,
      isEligible: streak >= settings.days_required_fever_free,
      dischargeRequest: req || null,
      status: p.status,
    };
  });

  const awaitingDoctorReview = queue.filter(
    (q) => (q.isEligible && !q.dischargeRequest) || (q.dischargeRequest && q.dischargeRequest.doctor_status === 'pending')
  );

  const approvedAwaitingAdmin = queue.filter(
    (q) => q.dischargeRequest && q.dischargeRequest.doctor_status === 'approved' && q.status === 'discharge_approved'
  );

  return NextResponse.json({
    settings: {
      daysRequired: settings.days_required_fever_free,
      feverThreshold: settings.fever_threshold,
      requireApproval: settings.require_doctor_approval,
    },
    awaitingDoctorReview,
    approvedAwaitingAdmin,
    completedDischarges,
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { action } = body;

    // Action 1: Doctor Review (Approve or Defer)
    if (action === 'review') {
      if (user.role !== 'doctor' && user.role !== 'admin') {
        return NextResponse.json({ 
          error: 'Permission denied: Only physicians can approve or defer clinical discharge readiness.' 
        }, { status: 403 });
      }

      const { request_id, patient_id, doctor_status, doctor_notes, deferral_reason } = body;

      let targetReqId = request_id;
      // If no request object exists yet, create one
      if (!targetReqId && patient_id) {
        const today = dateKey();
        const newReq = {
          id: `disch-req-${Date.now()}`,
          patient_id,
          eligible_since: today,
          streak_count: 3,
          doctor_status: 'pending' as const,
          requested_at: new Date().toISOString(),
        };
        StoreAPI.getStore().dischargeRequests.unshift(newReq);
        targetReqId = newReq.id;
      }

      const updated = StoreAPI.reviewDischargeRequest({
        request_id: targetReqId,
        doctor_status,
        doctor_notes,
        deferral_reason,
      }, user);

      return NextResponse.json({ success: true, request: updated });
    }

    // Action 2: Administrator Finalize Discharge
    if (action === 'finalize') {
      if (user.role !== 'admin') {
        return NextResponse.json({ 
          error: 'Permission denied: Only Administrators can finalize administrative patient discharge and bed release.' 
        }, { status: 403 });
      }

      const { patient_id, discharge_summary } = body;
      if (!patient_id || !discharge_summary) {
        return NextResponse.json({ 
          error: 'Patient ID and discharge summary are required to finalize discharge.' 
        }, { status: 400 });
      }

      const discharge = StoreAPI.finalizeDischarge({
        patient_id,
        discharge_summary,
      }, user);

      return NextResponse.json({ success: true, discharge });
    }

    return NextResponse.json({ error: 'Invalid action. Supported actions: review, finalize' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
