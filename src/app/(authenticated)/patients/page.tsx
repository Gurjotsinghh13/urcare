'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  Search, 
  UserPlus, 
  CheckCircle2, 
  Clock, 
  Eye,
  Thermometer,
  Stethoscope,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getStatusBadge } from '@/lib/utils';
import { RegisterPatientModal } from '@/components/modals/RegisterPatientModal';
import { RecordTempModal } from '@/components/modals/RecordTempModal';
import { DoctorVisitModal } from '@/components/modals/DoctorVisitModal';

export default function PatientsPage() {
  const [patients, setPatients] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('active');
  const [user, setUser] = React.useState<any>(null);

  // Pagination
  const [page, setPage] = React.useState(1);
  const pageSize = 10;

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
    setPage(1);
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

  // Pagination calculation
  const totalItems = patients.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedPatients = patients.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-[#EAE3E5]">
        <div>
          <h1 className="text-xl font-bold text-[#202124] tracking-tight">Quarantine Patient Registry</h1>
          <p className="text-xs text-[#6B7280] mt-1">
            Complete census of active quarantine admissions, daily vitals progress, and discharge statuses.
          </p>
        </div>
        {user?.role === 'admin' && (
          <Button size="sm" onClick={() => setShowAdmitModal(true)} className="gap-1.5">
            <UserPlus className="w-3.5 h-3.5" />
            Admit New Patient
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-3 justify-between">
          <div className="w-full sm:w-72 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#6B7280]" />
            <input
              type="text"
              placeholder="Search by name, code, or bed..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-md border border-[#EAE3E5] text-xs focus:outline-none focus:border-[#E88770] focus:ring-1 focus:ring-[#F4C7D3] bg-white text-[#202124]"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'active', label: 'Active Cohort' },
              { id: 'admitted', label: 'In Bed' },
              { id: 'discharge_eligible', label: 'Eligible (3d)' },
              { id: 'discharge_approved', label: 'Approved' },
              { id: 'discharged', label: 'Discharged' },
              { id: 'deceased', label: 'Deceased' },
              { id: 'all', label: 'All Records' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`text-xs px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
                  statusFilter === tab.id
                    ? 'bg-[#FCEEF1] text-[#202124] border border-[#F4C7D3]'
                    : 'bg-[#FAF8F8] text-[#6B7280] hover:text-[#202124] border border-[#EAE3E5]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Patients Data Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#EAE3E5] bg-[#FAF8F8] text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
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
            <tbody className="divide-y divide-[#EAE3E5]/60 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-[#6B7280]">Loading patient records...</td>
                </tr>
              ) : paginatedPatients.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-[#6B7280]">No matching patient records found</td>
                </tr>
              ) : (
                paginatedPatients.map((p) => {
                  const statusInfo = getStatusBadge(p.status);
                  return (
                    <tr key={p.id} className="hover:bg-[#FAF8F8]/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-[#202124]">
                        {p.patient_code}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#202124]">{p.full_name}</div>
                        <div className="text-[11px] text-[#6B7280]">{p.age} yrs • {p.gender}</div>
                      </td>
                      <td className="py-3 px-4">
                        {p.bed_number ? (
                          <span className="font-medium text-[#202124] bg-[#FAF8F8] px-2 py-0.5 rounded border border-[#EAE3E5]">
                            Bed {p.bed_number}
                          </span>
                        ) : (
                          <span className="text-[#6B7280] italic">Released</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[#6B7280]">
                        {p.admission_date}
                      </td>
                      <td className="py-3 px-4">
                        {p.todayTemp !== null ? (
                          <div className="flex items-center gap-1.5">
                            <span className={`font-semibold ${p.isFeverToday ? 'text-[#C04444]' : 'text-[#202124]'}`}>
                              {p.todayTemp.toFixed(1)}°C
                            </span>
                            {p.isFeverToday && (
                              <span className="text-[10px] font-bold bg-[#FDF2F2] text-[#C04444] px-1 py-0.2 rounded border border-[#F8D7DA]">
                                Fever
                              </span>
                            )}
                          </div>
                        ) : p.status === 'discharged' || p.status === 'deceased' ? (
                          <span className="text-[#6B7280]">—</span>
                        ) : (
                          <span className="text-[11px] text-[#B7791F] font-medium bg-[#FDF8F0] px-1.5 py-0.5 rounded border border-[#F3E5D0]">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {p.todayVisitCompleted ? (
                          <span className="text-[11px] text-[#27805B] font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#27805B]" />
                            Completed
                          </span>
                        ) : p.status === 'discharged' || p.status === 'deceased' ? (
                          <span className="text-[#6B7280]">—</span>
                        ) : (
                          <span className="text-[11px] text-[#6B7280] flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Due
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 font-semibold text-[#202124]">
                          <span>{p.feverFreeStreak} / 3 days</span>
                          {p.feverFreeStreak >= 3 && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#27805B]" />
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${statusInfo.color}`}>
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
                                  className="p-1 rounded text-[#E88770] hover:bg-[#FCEEF1] transition-colors"
                                >
                                  <Thermometer className="w-4 h-4" />
                                </button>
                              )}
                              {p.todayTemp !== null && !p.todayVisitCompleted && (user?.role === 'doctor' || user?.role === 'admin') && (
                                <button
                                  onClick={() => handleOpenVisit(p)}
                                  title="Conduct Rounds"
                                  className="p-1 rounded text-[#E88770] hover:bg-[#FCEEF1] transition-colors"
                                >
                                  <Stethoscope className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}
                          <Link href={`/patients/${p.id}`}>
                            <button
                              title="Open Patient Chart"
                              className="p-1 rounded text-[#6B7280] hover:text-[#202124] hover:bg-[#FAF8F8] transition-colors"
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

        {/* Table Pagination */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-[#EAE3E5] bg-[#FAF8F8]/50 flex items-center justify-between text-xs text-[#6B7280]">
            <span>
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalItems)} of {totalItems} patients
            </span>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="h-7 px-2"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <span className="px-2 font-medium text-[#202124]">
                Page {page} of {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="h-7 px-2"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
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
