'use client';

import * as React from 'react';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { DoctorDashboard } from '@/components/dashboard/DoctorDashboard';
import { NurseDashboard } from '@/components/dashboard/NurseDashboard';
import { ManagerDashboard } from '@/components/dashboard/ManagerDashboard';
import { RegisterPatientModal } from '@/components/modals/RegisterPatientModal';
import { RecordTempModal } from '@/components/modals/RecordTempModal';
import { DoctorVisitModal } from '@/components/modals/DoctorVisitModal';
import { Bed } from '@/lib/types';

export default function DashboardPage() {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [availableBeds, setAvailableBeds] = React.useState<Bed[]>([]);

  // Modals state
  const [showAdmitModal, setShowAdmitModal] = React.useState(false);
  const [showTempModal, setShowTempModal] = React.useState(false);
  const [tempModalPatient, setTempModalPatient] = React.useState<any>(null);
  const [showVisitModal, setShowVisitModal] = React.useState(false);
  const [visitModalPatient, setVisitModalPatient] = React.useState<any>(null);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBeds = async () => {
    try {
      const res = await fetch('/api/patients');
      // Or fetch available beds from patients
    } catch {}
  };

  React.useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleOpenAdmit = async () => {
    try {
      const res = await fetch('/api/patients');
      // beds available:
      const bedsList: Bed[] = [];
      for (let i = 1; i <= 80; i++) {
        bedsList.push({
          id: `bed-${i}`,
          bed_number: i,
          ward: i <= 20 ? 'Ward A' : i <= 40 ? 'Ward B' : i <= 60 ? 'Ward C' : 'Ward D',
          status: 'available',
          updated_at: new Date().toISOString(),
        });
      }
      setAvailableBeds(bedsList.filter((b) => b.bed_number > 20));
    } catch {}
    setShowAdmitModal(true);
  };

  const handleOpenTemp = (patient?: any) => {
    setTempModalPatient(patient || null);
    setShowTempModal(true);
  };

  const handleOpenVisit = (patient: any) => {
    setVisitModalPatient(patient);
    setShowVisitModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading URCARE Clinical Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!data || !data.user) {
    return (
      <div className="p-8 text-center text-xs text-slate-500">
        Error loading dashboard session. Please refresh or log in again.
      </div>
    );
  }

  const role = data.user.role;

  return (
    <div>
      {role === 'admin' && (
        <AdminDashboard
          data={data}
          onRefresh={fetchDashboardData}
          onOpenAdmitModal={handleOpenAdmit}
        />
      )}

      {role === 'doctor' && (
        <DoctorDashboard
          data={data}
          onRefresh={fetchDashboardData}
          onOpenVisitModal={handleOpenVisit}
        />
      )}

      {role === 'nurse' && (
        <NurseDashboard
          data={data}
          onRefresh={fetchDashboardData}
          onOpenTempModal={handleOpenTemp}
        />
      )}

      {role === 'manager' && (
        <ManagerDashboard
          data={data}
          onRefresh={fetchDashboardData}
        />
      )}

      {/* Modals */}
      <RegisterPatientModal
        isOpen={showAdmitModal}
        onClose={() => setShowAdmitModal(false)}
        onSuccess={fetchDashboardData}
        availableBeds={availableBeds}
      />

      <RecordTempModal
        isOpen={showTempModal}
        onClose={() => setShowTempModal(false)}
        onSuccess={fetchDashboardData}
        initialPatientId={tempModalPatient?.id}
        patientName={tempModalPatient?.full_name}
        bedNumber={tempModalPatient?.bed_number}
      />

      {visitModalPatient && (
        <DoctorVisitModal
          isOpen={showVisitModal}
          onClose={() => {
            setShowVisitModal(false);
            setVisitModalPatient(null);
          }}
          onSuccess={fetchDashboardData}
          patientId={visitModalPatient.id}
          patientName={visitModalPatient.full_name}
          bedNumber={visitModalPatient.bed_number}
          todayTemperature={visitModalPatient.todayTemp}
        />
      )}
    </div>
  );
}
