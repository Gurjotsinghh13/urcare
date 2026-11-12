'use client';

import * as React from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface DischargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: 'doctor_review' | 'admin_finalize';
  patientId: string;
  patientName: string;
  patientCode: string;
  bedNumber?: number | null;
  requestId?: string;
  streakCount?: number;
}

export function DischargeModal({
  isOpen,
  onClose,
  onSuccess,
  mode,
  patientId,
  patientName,
  patientCode,
  bedNumber,
  requestId,
  streakCount = 3,
}: DischargeModalProps) {
  // Doctor review state
  const [doctorStatus, setDoctorStatus] = React.useState<'approved' | 'deferred'>('approved');
  const [doctorNotes, setDoctorNotes] = React.useState('');
  const [deferralReason, setDeferralReason] = React.useState('');

  // Admin finalize state
  const [dischargeSummary, setDischargeSummary] = React.useState(
    'Patient completed 3-day fever-free quarantine observation. Clear lungs and vital signs stable. Discharge packet issued.'
  );

  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (mode === 'doctor_review') {
        const res = await fetch('/api/discharges', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'review',
            request_id: requestId,
            patient_id: patientId,
            doctor_status: doctorStatus,
            doctor_notes: doctorNotes,
            deferral_reason: doctorStatus === 'deferred' ? deferralReason : undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to review discharge request');
      } else {
        const res = await fetch('/api/discharges', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'finalize',
            patient_id: patientId,
            discharge_summary: dischargeSummary,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to finalize discharge');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'doctor_review' ? 'Doctor Discharge Readiness Review' : 'Administrator Finalize Discharge'}
      description="Two-step clinical and administrative quarantine discharge workflow."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 font-medium">
            {error}
          </div>
        )}

        {/* Patient Status Overview */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500">Patient:</span>
              <div className="text-sm font-semibold text-slate-900">
                {patientName} ({patientCode}) {bedNumber ? `• Bed ${bedNumber}` : ''}
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500">Afebrile Streak:</span>
              <div className="flex items-center gap-1 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{streakCount} Consecutive Days</span>
              </div>
            </div>
          </div>
        </div>

        {mode === 'doctor_review' ? (
          <>
            {/* Doctor Decision */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">Physician Clinical Decision</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDoctorStatus('approved')}
                  className={`p-3 rounded-lg border text-left flex items-start gap-2.5 transition-all ${
                    doctorStatus === 'approved'
                      ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-slate-900">Approve Readiness</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Patient is clinically fit for discharge</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDoctorStatus('deferred')}
                  className={`p-3 rounded-lg border text-left flex items-start gap-2.5 transition-all ${
                    doctorStatus === 'deferred'
                      ? 'border-amber-600 bg-amber-50/50 ring-1 ring-amber-600'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-slate-900">Defer Discharge</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Hold for further clinical observation</div>
                  </div>
                </button>
              </div>
            </div>

            {doctorStatus === 'approved' ? (
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-700">Clinical Justification & Notes</label>
                <textarea
                  rows={3}
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                  placeholder="e.g. Asymptomatic, clear chest auscultation, 3 fever-free days verified. Approved for administrative discharge."
                  className="w-full rounded-md border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-700">Mandatory Deferral Reason *</label>
                <Input
                  value={deferralReason}
                  onChange={(e) => setDeferralReason(e.target.value)}
                  placeholder="e.g. Persistent mild cough, waiting on confirmatory PCR, bloods pending"
                  required
                />
              </div>
            )}
          </>
        ) : (
          <>
            {/* Admin Finalize */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-800 leading-relaxed">
              <span className="font-semibold">Bed Release Notice:</span> Finalizing this discharge will release Bed {bedNumber} back to the available bed pool and officially mark the patient’s outcome as Recovered.
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">Administrative Discharge Summary *</label>
              <textarea
                rows={3}
                value={dischargeSummary}
                onChange={(e) => setDischargeSummary(e.target.value)}
                className="w-full rounded-md border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </>
        )}

        <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" isLoading={isSubmitting}>
            {mode === 'doctor_review' ? 'Submit Doctor Decision' : 'Finalize Discharge & Release Bed'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
