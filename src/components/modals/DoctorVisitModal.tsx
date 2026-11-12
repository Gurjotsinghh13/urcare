'use client';

import * as React from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface DoctorVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  patientId: string;
  patientName: string;
  bedNumber?: number | null;
  todayTemperature?: number | null;
  temperatureTime?: string;
  nurseName?: string;
}

export function DoctorVisitModal({
  isOpen,
  onClose,
  onSuccess,
  patientId,
  patientName,
  bedNumber,
  todayTemperature,
  temperatureTime,
  nurseName,
}: DoctorVisitModalProps) {
  const [observations, setObservations] = React.useState('');
  const [treatmentPlan, setTreatmentPlan] = React.useState('');
  const [followUp, setFollowUp] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const hasTemperature = todayTemperature !== null && todayTemperature !== undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!hasTemperature) {
      setError('Cannot conduct routine rounds: Today’s temperature has not yet been recorded by nursing staff.');
      return;
    }

    if (!observations.trim() || !treatmentPlan.trim()) {
      setError('Clinical observations and treatment plan are mandatory.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/rounds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patientId,
          clinical_observations: observations,
          treatment_plan: treatmentPlan,
          follow_up_instructions: followUp,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to document doctor visit');
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
      title="Doctor Clinical Rounds"
      description="Document clinical evaluation, findings, and treatment orders."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 font-medium">
            {error}
          </div>
        )}

        {/* Patient & Vitals Summary */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500">Patient:</div>
            <div className="text-sm font-semibold text-slate-900">
              {patientName} {bedNumber ? `(Bed ${bedNumber})` : ''}
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500 text-right">Today’s Vitals:</div>
            {hasTemperature ? (
              <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{todayTemperature.toFixed(1)}°C</span>
                {nurseName && <span className="text-xs font-normal text-slate-500">by {nurseName}</span>}
              </div>
            ) : (
              <div className="flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Pending Temperature</span>
              </div>
            )}
          </div>
        </div>

        {!hasTemperature && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800 leading-relaxed">
            <span className="font-semibold">Workflow Rule:</span> Routine doctor visits require today’s temperature measurement to be logged first by nursing staff. Please request nurse reading before completing visit.
          </div>
        )}

        {/* Clinical Observations */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-700">
            Clinical Observations & System Review *
          </label>
          <textarea
            rows={3}
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            placeholder="e.g. Patient alert and oriented. Bilateral lung fields clear. Respiration unlabored. Afebrile."
            className="w-full rounded-md border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={!hasTemperature}
          />
        </div>

        {/* Treatment Plan */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-700">
            Treatment Plan & Orders *
          </label>
          <textarea
            rows={2}
            value={treatmentPlan}
            onChange={(e) => setTreatmentPlan(e.target.value)}
            placeholder="e.g. Continue hydration, maintenance oral therapy, step-down monitoring."
            className="w-full rounded-md border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={!hasTemperature}
          />
        </div>

        {/* Follow-up */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-700">
            Follow-up & Nursing Instructions (Optional)
          </label>
          <Input
            placeholder="e.g. Recheck vitals if shivering or subjective fever occurs"
            value={followUp}
            onChange={(e) => setFollowUp(e.target.value)}
            disabled={!hasTemperature}
          />
        </div>

        <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" isLoading={isSubmitting} disabled={!hasTemperature}>
            Complete Doctor Visit
          </Button>
        </div>
      </form>
    </Modal>
  );
}
