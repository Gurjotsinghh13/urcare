'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  Stethoscope, 
  CheckCircle2, 
  Clock, 
  Lock, 
  Flame, 
  ArrowRight,
  Eye,
  UserCheck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DoctorVisitModal } from '@/components/modals/DoctorVisitModal';

export default function DoctorRoundsPage() {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [selectedPatient, setSelectedPatient] = React.useState<any>(null);
  const [showModal, setShowModal] = React.useState(false);

  const fetchRoundsData = async () => {
    try {
      const res = await fetch('/api/rounds');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {}
    setLoading(false);
  };

  React.useEffect(() => {
    fetchRoundsData();
  }, []);

  const handleOpenVisit = (patient: any, todayTemp: any) => {
    setSelectedPatient({
      ...patient,
      todayTemp: todayTemp?.temp_celsius,
      nurseName: todayTemp?.recorded_by_name,
    });
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { waitingForVitals = [], readyForRounds = [], completedRounds = [] } = data || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Physician Clinical Rounds Station</h1>
          <p className="text-xs text-slate-500 mt-1">
            Standard operating procedure: Routine morning physician rounds require nurse temperature verification first.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="info">{readyForRounds.length} Ready to Visit</Badge>
          <Badge variant="warning">{waitingForVitals.length} Locked (Awaiting Nurse)</Badge>
        </div>
      </div>

      {/* 3 Workspaces Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Ready for Rounds (Actionable!) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Ready for Doctor Rounds</h3>
            </div>
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              {readyForRounds.length}
            </span>
          </div>

          <div className="space-y-3">
            {readyForRounds.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-xs text-slate-400">
                  No patients awaiting review.
                </CardContent>
              </Card>
            ) : (
              readyForRounds.map((item: any) => (
                <Card key={item.patient.id} className="border-l-4 border-l-blue-600 hover:shadow-md transition-shadow">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{item.patient.full_name}</span>
                          <span className="text-[11px] font-semibold bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded">
                            Bed {item.patient.bed_number}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">{item.patient.patient_code}</div>
                      </div>

                      <div className="text-right">
                        <div className={`text-sm font-bold ${item.isFever ? 'text-red-600' : 'text-slate-900'}`}>
                          {item.todayTemp?.temp_celsius.toFixed(1)}°C
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {item.todayTemp?.measurement_time ? item.todayTemp.measurement_time.substring(11, 16) : ''}
                        </div>
                      </div>
                    </div>

                    {item.isFever && (
                      <div className="p-2 bg-red-50 border border-red-200 rounded text-[11px] text-red-700 font-semibold flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-red-600" />
                        <span>Fever Alert: Evaluate clinical symptoms</span>
                      </div>
                    )}

                    <div className="text-[11px] text-slate-500">
                      Streak: <span className="font-semibold text-slate-800">{item.streak} / 3 days fever-free</span>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <Link 
                        href={`/patients/${item.patient.id}`}
                        className="text-[11px] text-slate-500 hover:text-slate-900 flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" /> Chart
                      </Link>
                      <Button
                        size="sm"
                        onClick={() => handleOpenVisit(item.patient, item.todayTemp)}
                        className="text-xs gap-1"
                      >
                        <Stethoscope className="w-3.5 h-3.5" />
                        <span>Conduct Visit</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Column 2: Waiting for Nurse Vitals (LOCKED) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Waiting for Nurse Vitals</h3>
            </div>
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              {waitingForVitals.length} Locked
            </span>
          </div>

          <div className="space-y-3">
            {waitingForVitals.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-xs text-slate-400">
                  All patients have had their temperature logged!
                </CardContent>
              </Card>
            ) : (
              waitingForVitals.map((item: any) => (
                <Card key={item.patient.id} className="border-slate-200 bg-slate-50/50">
                  <CardContent className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-slate-800">{item.patient.full_name}</span>
                          <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-medium">
                            Bed {item.patient.bed_number}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">{item.patient.patient_code}</div>
                      </div>
                      <div className="p-1 rounded bg-amber-100 text-amber-700" title="Locked: Needs Nurse Vitals">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded border border-amber-200">
                      Doctor visit locked until nurse documents morning temperature.
                    </p>

                    <div className="flex justify-between items-center text-[11px] pt-1">
                      <Link href={`/patients/${item.patient.id}`} className="text-slate-500 hover:text-slate-800 flex items-center gap-1">
                        <Eye className="w-3 h-3" /> View History
                      </Link>
                      <Button size="sm" variant="outline" disabled className="text-xs opacity-50">
                        Visit Locked
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Column 3: Completed Rounds Today */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Completed Rounds</h3>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {completedRounds.length} Done
            </span>
          </div>

          <div className="space-y-3">
            {completedRounds.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-xs text-slate-400">
                  No rounds completed yet today.
                </CardContent>
              </Card>
            ) : (
              completedRounds.map((item: any) => (
                <Card key={item.patient.id} className="border-l-4 border-l-emerald-600">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-900">{item.patient.full_name}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium">
                          Bed {item.patient.bed_number}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-slate-700">
                        {item.todayTemp?.temp_celsius.toFixed(1)}°C
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 italic">
                      &ldquo;{item.todayVisit?.treatment_plan || 'Observations filed'}&rdquo;
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1">
                      <span>Seen by {item.todayVisit?.doctor_name || 'Dr. Vance'}</span>
                      <Link href={`/patients/${item.patient.id}`} className="text-blue-600 hover:underline">
                        View Visit Note →
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {selectedPatient && (
        <DoctorVisitModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedPatient(null);
          }}
          onSuccess={fetchRoundsData}
          patientId={selectedPatient.id}
          patientName={selectedPatient.full_name}
          bedNumber={selectedPatient.bed_number}
          todayTemperature={selectedPatient.todayTemp}
          nurseName={selectedPatient.nurseName}
        />
      )}
    </div>
  );
}
