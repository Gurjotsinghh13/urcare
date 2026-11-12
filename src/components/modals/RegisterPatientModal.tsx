'use client';

import * as React from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bed } from '@/lib/types';

interface RegisterPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  availableBeds: Bed[];
}

export function RegisterPatientModal({
  isOpen,
  onClose,
  onSuccess,
  availableBeds = [],
}: RegisterPatientModalProps) {
  const [fullName, setFullName] = React.useState('');
  const [age, setAge] = React.useState('');
  const [gender, setGender] = React.useState<'M' | 'F' | 'Other'>('M');
  const [bedNumber, setBedNumber] = React.useState<number | ''>(availableBeds[0]?.bed_number || '');
  const [emergencyContact, setEmergencyContact] = React.useState('');
  const [medicalHistory, setMedicalHistory] = React.useState('');
  const [admissionNotes, setAdmissionNotes] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (availableBeds.length > 0 && !bedNumber) {
      setBedNumber(availableBeds[0].bed_number);
    }
  }, [availableBeds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !age || !bedNumber) {
      setError('Patient name, age, and bed assignment are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          age: parseInt(age, 10),
          gender,
          bed_number: Number(bedNumber),
          emergency_contact: emergencyContact,
          medical_history: medicalHistory,
          admission_notes: admissionNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to admit patient');
      }

      onSuccess();
      onClose();
      // Reset
      setFullName('');
      setAge('');
      setEmergencyContact('');
      setMedicalHistory('');
      setAdmissionNotes('');
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
      title="Admit New Patient"
      description="Register patient demographics, initial clinical triage, and assign a quarantine bed."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-[#FAF8F8] border border-[#C04444] rounded-md text-xs text-[#C04444] font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <Input
              label="Full Name *"
              placeholder="e.g. Samuel Green"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div>
            <Input
              label="Age *"
              type="number"
              placeholder="e.g. 42"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#202124]">Gender *</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as any)}
              className="w-full h-9 rounded-md border border-[#EAE3E5] bg-white px-3 py-1 text-sm text-[#202124] focus:outline-none focus:border-[#E88770] focus:ring-1 focus:ring-[#E88770] transition-colors"
            >
              <option value="M">Male</option>
              <option value="F">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#202124]">
              Assign Quarantine Bed * ({availableBeds.length} available)
            </label>
            {availableBeds.length === 0 ? (
              <div className="p-2 text-xs text-[#C04444] font-medium bg-[#FAF8F8] rounded border border-[#EAE3E5]">
                Facility full (74/74 beds occupied)
              </div>
            ) : (
              <select
                value={bedNumber}
                onChange={(e) => setBedNumber(Number(e.target.value))}
                className="w-full h-9 rounded-md border border-[#EAE3E5] bg-white px-3 py-1 text-sm text-[#202124] focus:outline-none focus:border-[#E88770] focus:ring-1 focus:ring-[#E88770] transition-colors"
                required
              >
                {availableBeds.map((b) => (
                  <option key={b.id} value={b.bed_number}>
                    Bed {b.bed_number} ({b.ward})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <Input
          label="Emergency Contact (Optional)"
          placeholder="e.g. Sarah Green (Spouse) - +1 555-0192"
          value={emergencyContact}
          onChange={(e) => setEmergencyContact(e.target.value)}
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-[#202124]">Medical History & Known Comorbidities</label>
          <textarea
            rows={2}
            value={medicalHistory}
            onChange={(e) => setMedicalHistory(e.target.value)}
            placeholder="e.g. Asthma, hypertension, penicillin allergy"
            className="w-full rounded-md border border-[#EAE3E5] p-2.5 text-xs text-[#202124] focus:outline-none focus:border-[#E88770] focus:ring-1 focus:ring-[#E88770] bg-white transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-[#202124]">Admission Notes & Triage Presentation</label>
          <textarea
            rows={2}
            value={admissionNotes}
            onChange={(e) => setAdmissionNotes(e.target.value)}
            placeholder="e.g. Day 2 of onset. Moderate dry cough. Transferred from community clinic."
            className="w-full rounded-md border border-[#EAE3E5] p-2.5 text-xs text-[#202124] focus:outline-none focus:border-[#E88770] focus:ring-1 focus:ring-[#E88770] bg-white transition-colors"
          />
        </div>

        <div className="flex justify-end gap-2.5 pt-2 border-t border-[#EAE3E5]">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" isLoading={isSubmitting} disabled={availableBeds.length === 0}>
            Admit & Assign Bed
          </Button>
        </div>
      </form>
    </Modal>
  );
}
