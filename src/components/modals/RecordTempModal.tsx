'use client';

import * as React from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { validateTemperature } from '@/lib/rules';

interface RecordTempModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialPatientId?: string;
  patientName?: string;
  bedNumber?: number | null;
  admittedPatients?: Array<{ id: string; patient_code: string; full_name: string; bed_number?: number | null }>;
}

export function RecordTempModal({
  isOpen,
  onClose,
  onSuccess,
  initialPatientId,
  patientName,
  bedNumber,
  admittedPatients = [],
}: RecordTempModalProps) {
  const [patientId, setPatientId] = React.useState(initialPatientId || '');
  const [temperature, setTemperature] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [isRoutine, setIsRoutine] = React.useState(true);
  const [reasonForExtra, setReasonForExtra] = React.useState('');
  const [isConfirmed, setIsConfirmed] = React.useState(false);
  const [confirmPrompt, setConfirmPrompt] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (initialPatientId) {
      setPatientId(initialPatientId);
    } else if (admittedPatients.length > 0 && !patientId) {
      setPatientId(admittedPatients[0].id);
    }
  }, [initialPatientId, admittedPatients]);

  const handleTempChange = (val: string) => {
    setTemperature(val);
    setError(null);
    setConfirmPrompt(null);
    setIsConfirmed(false);

    if (val) {
      const v = validateTemperature(val, 38.0);
      if (v.needsConfirmation) {
        setConfirmPrompt(v.confirmMessage || 'Unusual reading. Please confirm.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const valResult = validateTemperature(temperature, 38.0);
    if (!valResult.valid) {
      setError(valResult.error || 'Invalid temperature');
      return;
    }

    if (valResult.needsConfirmation && !isConfirmed) {
      setConfirmPrompt(valResult.confirmMessage || 'Please confirm unusual temperature reading.');
      return;
    }

    if (!isRoutine && !reasonForExtra.trim()) {
      setError('A clinical reason is mandatory for extra/non-routine temperature checks.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/temperatures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patientId,
          temp_celsius: valResult.value,
          notes,
          is_routine: isRoutine,
          reason_for_extra: !isRoutine ? reasonForExtra : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to record temperature');
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
      title="Record Patient Vitals"
      description="Enter daily routine or repeat temperature measurement in Celsius (°C)."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-[#FDF2F2] border border-[#F8D7DA] rounded-md text-xs text-[#C04444] font-medium">
            {error}
          </div>
        )}

        {/* Patient Selection if not preset */}
        {initialPatientId ? (
          <div className="p-3 bg-[#FAF8F8] border border-[#EAE3E5] rounded-md">
            <span className="text-xs text-[#6B7280]">Patient:</span>
            <div className="text-sm font-semibold text-[#202124]">
              {patientName} {bedNumber ? `(Bed ${bedNumber})` : ''}
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#202124]">Select Admitted Patient</label>
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="w-full h-9 rounded-md border border-[#EAE3E5] bg-white px-3 py-1 text-sm text-[#202124] focus:outline-none focus:border-[#E88770]"
              required
            >
              {admittedPatients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.patient_code} - {p.full_name} {p.bed_number ? `(Bed ${p.bed_number})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Routine vs Extra toggle */}
        <div className="flex items-center gap-4 text-xs font-medium text-[#202124]">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={isRoutine}
              onChange={() => setIsRoutine(true)}
              className="text-[#E88770] focus:ring-[#E88770]"
            />
            <span>Routine Daily Reading</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={!isRoutine}
              onChange={() => setIsRoutine(false)}
              className="text-[#E88770] focus:ring-[#E88770]"
            />
            <span>Repeat / Extra Check</span>
          </label>
        </div>

        {!isRoutine && (
          <Input
            label="Clinical Reason for Extra Measurement *"
            placeholder="e.g. Post-paracetamol review, chills, spike check"
            value={reasonForExtra}
            onChange={(e) => setReasonForExtra(e.target.value)}
            required
          />
        )}

        {/* Temperature Input */}
        <div>
          <Input
            label="Temperature (°C) *"
            type="number"
            step="0.1"
            placeholder="e.g. 37.4"
            value={temperature}
            onChange={(e) => handleTempChange(e.target.value)}
            helperText="Valid clinical range: 34.0°C – 42.0°C. Fever threshold: ≥ 38.0°C"
            required
          />
        </div>

        {/* Confirmation alert for extreme values */}
        {confirmPrompt && (
          <div className="p-3 bg-[#FDF8F0] border border-[#F3E5D0] rounded-md space-y-2">
            <div className="text-xs text-[#B7791F] font-medium">{confirmPrompt}</div>
            <label className="flex items-center gap-2 text-xs text-[#B7791F] font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={isConfirmed}
                onChange={(e) => setIsConfirmed(e.target.checked)}
                className="rounded border-[#B7791F] text-[#E88770] focus:ring-[#E88770]"
              />
              <span>I confirm that this thermometer reading was verified twice.</span>
            </label>
          </div>
        )}

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-[#202124]">Clinical Nursing Notes (Optional)</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Patient feeling chilly, sweating, resting well"
            className="w-full rounded-md border border-[#EAE3E5] p-2.5 text-xs text-[#202124] focus:outline-none focus:border-[#E88770]"
          />
        </div>

        <div className="flex justify-end gap-2.5 pt-2 border-t border-[#EAE3E5]">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" isLoading={isSubmitting}>
            Save Temperature
          </Button>
        </div>
      </form>
    </Modal>
  );
}
