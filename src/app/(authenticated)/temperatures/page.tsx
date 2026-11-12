'use client';

import * as React from 'react';
import { 
  Thermometer, 
  Search, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Flame, 
  AlertTriangle,
  History
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RecordTempModal } from '@/components/modals/RecordTempModal';
import { formatTime } from '@/lib/rules';

export default function TemperaturesPage() {
  const [patients, setPatients] = React.useState<any[]>([]);
  const [recentTemps, setRecentTemps] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [selectedPatient, setSelectedPatient] = React.useState<any>(null);
  const [showModal, setShowModal] = React.useState(false);

  const fetchData = async () => {
    try {
      const [patRes, tempRes] = await Promise.all([
        fetch('/api/patients?status=active'),
        fetch('/api/temperatures'),
      ]);
      if (patRes.ok) {
        const patJson = await patRes.json();
        setPatients(patJson.patients || []);
      }
      if (tempRes.ok) {
        const tempJson = await tempRes.json();
        setRecentTemps(tempJson.temperatures || []);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Nursing Temperature Station</h1>
          <p className="text-xs text-slate-500 mt-1">
            Mandatory daily routine vitals logging. Duplicate entries prevented. Doctor rounds unlocked upon recording.
          </p>
        </div>
        <Button size="sm" onClick={() => handleOpenModal()} className="gap-1.5">
          <Plus className="w-4 h-4" />
          Record Temperature
        </Button>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-500">Pending Morning Vitals</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">{pending.length}</div>
            </div>
            <Clock className="w-8 h-8 text-amber-500 opacity-80" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-500">Completed Today</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">{completed.length}</div>
            </div>
            <CheckCircle2 className="w-8 h-8 text-emerald-500 opacity-80" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-500">Fever Spikes Today (≥ 38.0°C)</span>
              <div className="text-2xl font-bold text-red-600 mt-1">
                {patients.filter((p) => p.isFeverToday).length}
              </div>
            </div>
            <Flame className="w-8 h-8 text-red-500 opacity-80" />
          </CardContent>
        </Card>
      </div>

      {/* Patient Vitals Entry Worklist */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle>Admitted Patients Vitals Roster</CardTitle>
              <span className="text-xs text-slate-500">Daily check list across all wards</span>
            </div>
            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="Filter by bed, name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-8 px-3 rounded-md border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Bed</th>
                  <th className="py-2.5 px-3">Patient</th>
                  <th className="py-2.5 px-3">Afebrile Streak</th>
                  <th className="py-2.5 px-3">Today’s Status</th>
                  <th className="py-2.5 px-3">Recorded Temp</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPatients.map((p) => {
                  const hasDone = p.todayTemp !== null;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        Bed {p.bed_number}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-800">{p.full_name}</div>
                        <div className="text-[10px] text-slate-400">{p.patient_code}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-slate-700">{p.feverFreeStreak} / 3 days</span>
                      </td>
                      <td className="py-2.5 px-3">
                        {hasDone ? (
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Logged Today
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Pending Morning Vitals
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {hasDone ? (
                          <span className={`font-bold text-sm ${p.isFeverToday ? 'text-red-600' : 'text-slate-900'}`}>
                            {p.todayTemp.toFixed(1)}°C
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
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
                })}
              </tbody>
            </table>
          </div>
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
