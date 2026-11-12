'use client';

import * as React from 'react';
import { 
  Thermometer, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Flame,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RecordTempModal } from '@/components/modals/RecordTempModal';

export default function TemperaturesPage() {
  const [patients, setPatients] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [selectedPatient, setSelectedPatient] = React.useState<any>(null);
  const [showModal, setShowModal] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const pageSize = 10;

  const fetchData = async () => {
    try {
      const res = await fetch('/api/patients?status=active');
      if (res.ok) {
        const json = await res.json();
        setPatients(json.patients || []);
      }
    } catch {}
    setLoading(false);
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (p?: any) => {
    setSelectedPatient(p || null);
    setShowModal(true);
  };

  const filteredPatients = patients.filter((p) => 
    p.full_name.toLowerCase().includes(search.toLowerCase()) ||
    p.patient_code.toLowerCase().includes(search.toLowerCase()) ||
    String(p.bed_number).includes(search)
  );

  const pending = patients.filter((p) => p.todayTemp === null);
  const completed = patients.filter((p) => p.todayTemp !== null);

  const totalItems = filteredPatients.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginated = filteredPatients.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-[#EAE3E5]">
        <div>
          <h1 className="text-xl font-bold text-[#202124] tracking-tight">Nursing Temperature Station</h1>
          <p className="text-xs text-[#6B7280] mt-1">
            Mandatory daily routine vitals logging. Duplicate entries prevented. Doctor rounds unlocked upon recording.
          </p>
        </div>
        <Button size="sm" onClick={() => handleOpenModal()} className="gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          Record Temperature
        </Button>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-[#6B7280]">Pending Morning Vitals</span>
              <div className="text-2xl font-bold text-[#B7791F] mt-1">{pending.length}</div>
            </div>
            <Clock className="w-7 h-7 text-[#B7791F] opacity-70" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-[#6B7280]">Completed Today</span>
              <div className="text-2xl font-bold text-[#27805B] mt-1">{completed.length}</div>
            </div>
            <CheckCircle2 className="w-7 h-7 text-[#27805B] opacity-70" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-[#6B7280]">Fever Spikes (≥ 38.0°C)</span>
              <div className="text-2xl font-bold text-[#C04444] mt-1">
                {patients.filter((p) => p.isFeverToday).length}
              </div>
            </div>
            <Flame className="w-7 h-7 text-[#C04444] opacity-70" />
          </CardContent>
        </Card>
      </div>

      {/* Patient Vitals Entry Worklist */}
      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle>Admitted Patients Vitals Roster</CardTitle>
              <span className="text-xs text-[#6B7280]">Daily check list across all wards</span>
            </div>
            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="Filter by bed, name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-8 px-3 rounded-md border border-[#EAE3E5] text-xs focus:outline-none focus:border-[#E88770] bg-white text-[#202124]"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#EAE3E5] bg-[#FAF8F8] text-[#6B7280] font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-4">Bed</th>
                  <th className="py-2.5 px-4">Patient</th>
                  <th className="py-2.5 px-4">Afebrile Streak</th>
                  <th className="py-2.5 px-4">Today’s Status</th>
                  <th className="py-2.5 px-4">Recorded Temp</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE3E5]/60">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#6B7280]">Loading vitals roster...</td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#6B7280]">No matching patients found</td>
                  </tr>
                ) : (
                  paginated.map((p) => {
                    const hasDone = p.todayTemp !== null;
                    return (
                      <tr key={p.id} className="hover:bg-[#FAF8F8]/60 transition-colors">
                        <td className="py-2.5 px-4 font-semibold text-[#202124]">
                          Bed {p.bed_number}
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="font-semibold text-[#202124]">{p.full_name}</div>
                          <div className="text-[10px] text-[#6B7280]">{p.patient_code}</div>
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="font-semibold text-[#202124]">{p.feverFreeStreak} / 3 days</span>
                        </td>
                        <td className="py-2.5 px-4">
                          {hasDone ? (
                            <span className="text-[10px] font-semibold text-[#27805B] bg-[#F0F7F4] px-2 py-0.5 rounded border border-[#D1E7DD]">
                              Logged Today
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-[#B7791F] bg-[#FDF8F0] px-2 py-0.5 rounded border border-[#F3E5D0]">
                              Pending Morning Vitals
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4">
                          {hasDone ? (
                            <span className={`font-bold text-sm ${p.isFeverToday ? 'text-[#C04444]' : 'text-[#202124]'}`}>
                              {p.todayTemp.toFixed(1)}°C
                            </span>
                          ) : (
                            <span className="text-[#6B7280]">—</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <Button
                            size="sm"
                            variant={hasDone ? 'outline' : 'primary'}
                            onClick={() => handleOpenModal(p)}
                            className="text-xs"
                          >
                            {hasDone ? 'Repeat / Extra' : 'Record Temp'}
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="p-3 border-t border-[#EAE3E5] bg-[#FAF8F8]/50 flex items-center justify-between text-xs text-[#6B7280]">
              <span>Page {page} of {totalPages}</span>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)} className="h-7 px-2">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
                <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(page + 1)} className="h-7 px-2">
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <RecordTempModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={fetchData}
        initialPatientId={selectedPatient?.id}
        patientName={selectedPatient?.full_name}
        bedNumber={selectedPatient?.bed_number}
        admittedPatients={patients}
      />
    </div>
  );
}
