'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  Users, 
  Search, 
  Filter, 
  UserPlus, 
  CheckCircle2, 
  Clock, 
  Flame, 
  ArrowRight,
  Eye,
  Thermometer,
  Stethoscope
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getStatusBadge } from '@/lib/utils';
import { RegisterPatientModal } from '@/components/modals/RegisterPatientModal';
import { RecordTempModal } from '@/components/modals/RecordTempModal';
import { DoctorVisitModal } from '@/components/modals/DoctorVisitModal';
import { Bed } from '@/lib/types';

export default function PatientsPage() {
  const [patients, setPatients] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('active');
  const [user, setUser] = React.useState<any>(null);

  // Modals
  const [showAdmitModal, setShowAdmitModal] = React.useState(false);
  const [showTempModal, setShowTempModal] = React.useState(false);
  const [tempModalPatient, setTempModalPatient] = React.useState<any>(null);
  const [showVisitModal, setShowVisitModal] = React.useState(false);
  const [visitModalPatient, setVisitModalPatient] = React.useState<any>(null);

  const fetchPatients = async () => {
    try {
      const [patRes, meRes] = await Promise.all([
        fetch(`/api/patients?status=${statusFilter}&q=${encodeURIComponent(search)}`),
        fetch('/api/auth/me'),
      ]);
      if (patRes.ok) {
        const json = await patRes.json();
        setPatients(json.patients || []);
      }
      if (meRes.ok) {
        const meJson = await meRes.json();
        setUser(meJson.user);
      }
    } catch {}
    setLoading(false);
  };

  React.useEffect(() => {
    fetchPatients();
  }, [statusFilter, search]);

  const handleOpenTemp = (patient: any) => {
    setTempModalPatient(patient);
    setShowTempModal(true);
  };

  const handleOpenVisit = (patient: any) => {
    setVisitModalPatient(patient);
    setShowVisitModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Quarantine Patient Registry</h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete census of active quarantine admissions, daily vitals progress, and discharge statuses.
          </p>
        </div>
        {user?.role === 'admin' && (
          <Button size="sm" onClick={() => setShowAdmitModal(true)} className="gap-1.5">
            <UserPlus className="w-4 h-4" />
            Admit New Patient
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-3 justify-between">
          <div className="w-full sm:w-80 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by patient name, code, or bed..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-md border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs text-slate-400 shrink-0">Filter:</span>
            {[
              { id: 'active', label: 'Active Cohort' },
              { id: 'admitted', label: 'In Bed' },
              { id: 'discharge_eligible', label: 'Eligible (3d)' },
              { id: 'discharge_approved', label: 'Doctor Approved' },
              { id: 'discharged', label: 'Discharged' },
              { id: 'deceased', label: 'Deceased' },
              { id: 'all', label: 'All Records' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`text-xs px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
                  statusFilter === tab.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Patients Data Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Patient Code</th>
                <th className="py-3 px-4">Patient Name</th>
                <th className="py-3 px-4">Bed Location</th>
                <th className="py-3 px-4">Admission Date</th>
                <th className="py-3 px-4">Today’s Temp</th>
                <th className="py-3 px-4">Doctor Rounds</th>
                <th className="py-3 px-4">Afebrile Streak</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">Loading patient records...</td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">No matching patient records found</td>
                </tr>
              ) : (
                patients.map((p) => {
                  const statusInfo = getStatusBadge(p.status);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-slate-700">
                        {p.patient_code}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{p.full_name}</div>
                        <div className="text-[11px] text-slate-500">{p.age} yrs • {p.gender}</div>
                      </td>
                      <td className="py-3 px-4">
                        {p.bed_number ? (
                          <span className="font-medium text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            Bed {p.bed_number}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">None (Released)</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {p.admission_date}
                      </td>
                      <td className="py-3 px-4">
                        {p.todayTemp !== null ? (
                          <div className="flex items-center gap-1.5">
                            <span className={`font-semibold ${p.isFeverToday ? 'text-red-600 font-bold' : 'text-slate-900'}`}>
                              {p.todayTemp.toFixed(1)}°C
                            </span>
                            {p.isFeverToday && (
                              <span className="text-[10px] font-bold bg-red-50 text-red-700 px-1 py-0.2 rounded border border-red-200">
                                Fever
                              </span>
                            )}
                          </div>
                        ) : p.status === 'discharged' || p.status === 'deceased' ? (
                          <span className="text-slate-400">—</span>
                        ) : (
                          <span className="text-[11px] text-amber-700 font-medium bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {p.todayVisitCompleted ? (
                          <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Completed
                          </span>
                        ) : p.status === 'discharged' || p.status === 'deceased' ? (
                          <span className="text-slate-400">—</span>
                        ) : (
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Due
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 font-semibold text-slate-800">
                          <span>{p.feverFreeStreak} / 3 days</span>
                          {p.feverFreeStreak >= 3 && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {p.status !== 'discharged' && p.status !== 'deceased' && (
                            <>
                              {p.todayTemp === null && (user?.role === 'nurse' || user?.role === 'admin') && (
                                <button
                                  onClick={() => handleOpenTemp(p)}
                                  title="Record Temperature"
                                  className="p-1 rounded text-blue-600 hover:bg-blue-50"
                                >
                                  <Thermometer className="w-4 h-4" />
                                </button>
                              )}
                              {p.todayTemp !== null && !p.todayVisitCompleted && (user?.role === 'doctor' || user?.role === 'admin') && (
                                <button
                                  onClick={() => handleOpenVisit(p)}
                                  title="Conduct Rounds"
                                  className="p-1 rounded text-indigo-600 hover:bg-indigo-50"
                                >
                                  <Stethoscope className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}
                          <Link href={`/patients/${p.id}`}>
                            <button
                              title="Open Patient Chart"
                              className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modals */}
      <RegisterPatientModal
        isOpen={showAdmitModal}
        onClose={() => setShowAdmitModal(false)}
        onSuccess={fetchPatients}
        availableBeds={[]}
      />

      <RecordTempModal
        isOpen={showTempModal}
        onClose={() => setShowTempModal(false)}
        onSuccess={fetchPatients}
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
          onSuccess={fetchPatients}
          patientId={visitModalPatient.id}
          patientName={visitModalPatient.full_name}
          bedNumber={visitModalPatient.bed_number}
          todayTemperature={visitModalPatient.todayTemp}
        />
      )}
    </div>
  );
}
