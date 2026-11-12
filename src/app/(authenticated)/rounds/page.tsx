'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  Stethoscope, 
  Lock, 
  Flame, 
  Eye
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
        <div className="w-7 h-7 border-2 border-[#E88770] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { waitingForVitals = [], readyForRounds = [], completedRounds = [] } = data || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-[#EAE3E5]">
        <div>
          <h1 className="text-xl font-bold text-[#202124] tracking-tight">Physician Clinical Rounds Station</h1>
          <p className="text-xs text-[#6B7280] mt-1">
            Standard operating procedure: Routine morning physician rounds require nurse temperature verification first.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="accent">{readyForRounds.length} Ready to Visit</Badge>
          <Badge variant="warning">{waitingForVitals.length} Locked (Awaiting Nurse)</Badge>
        </div>
      </div>

      {/* 3 Workspaces Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Ready for Rounds (Actionable!) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#E88770]" />
              <h3 className="text-xs font-bold text-[#202124] uppercase tracking-wider">Ready for Doctor Rounds</h3>
            </div>
            <span className="text-xs font-semibold text-[#E88770] bg-[#FCEEF1] px-2 py-0.5 rounded border border-[#F4C7D3]">
              {readyForRounds.length}
            </span>
          </div>

          <div className="space-y-3">
            {readyForRounds.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-xs text-[#6B7280]">
                  No patients awaiting review.
                </CardContent>
              </Card>
            ) : (
              readyForRounds.map((item: any) => (
                <Card key={item.patient.id} className="hover:border-[#F4C7D3] transition-colors">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#202124]">{item.patient.full_name}</span>
                          <span className="text-[11px] font-semibold bg-[#FAF8F8] text-[#202124] px-1.5 py-0.5 rounded border border-[#EAE3E5]">
                            Bed {item.patient.bed_number}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#6B7280] font-mono mt-0.5">{item.patient.patient_code}</div>
                      </div>

                      <div className="text-right">
                        <div className={`text-sm font-bold ${item.isFever ? 'text-[#C04444]' : 'text-[#202124]'}`}>
                          {item.todayTemp?.temp_celsius.toFixed(1)}°C
                        </div>
                        <div className="text-[10px] text-[#6B7280]">
                          {item.todayTemp?.measurement_time ? item.todayTemp.measurement_time.substring(11, 16) : ''}
                        </div>
                      </div>
                    </div>

                    {item.isFever && (
                      <div className="p-2 bg-[#FDF2F2] border border-[#F8D7DA] rounded text-[11px] text-[#C04444] font-semibold flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-[#C04444]" />
                        <span>Fever Alert: Evaluate clinical symptoms</span>
                      </div>
                    )}

                    <div className="text-[11px] text-[#6B7280]">
                      Streak: <span className="font-semibold text-[#202124]">{item.streak} / 3 days fever-free</span>
                    </div>

                    <div className="pt-2 border-t border-[#EAE3E5]/60 flex items-center justify-between">
                      <Link 
                        href={`/patients/${item.patient.id}`}
                        className="text-[11px] text-[#6B7280] hover:text-[#202124] flex items-center gap-1"
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
              <span className="w-2 h-2 rounded-full bg-[#B7791F]" />
              <h3 className="text-xs font-bold text-[#202124] uppercase tracking-wider">Waiting for Nurse Vitals</h3>
            </div>
            <span className="text-xs font-semibold text-[#B7791F] bg-[#FDF8F0] px-2 py-0.5 rounded border border-[#F3E5D0]">
              {waitingForVitals.length} Locked
            </span>
          </div>

          <div className="space-y-3">
            {waitingForVitals.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-xs text-[#6B7280]">
                  All patients have had their temperature logged.
                </CardContent>
              </Card>
            ) : (
              waitingForVitals.map((item: any) => (
                <Card key={item.patient.id} className="bg-[#FAF8F8]">
                  <CardContent className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-[#202124]">{item.patient.full_name}</span>
                          <span className="text-[10px] bg-white text-[#202124] px-1.5 py-0.2 rounded border border-[#EAE3E5]">
                            Bed {item.patient.bed_number}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#6B7280] font-mono mt-0.5">{item.patient.patient_code}</div>
                      </div>
                      <div className="p-1 rounded bg-[#FDF8F0] text-[#B7791F]" title="Locked: Needs Nurse Vitals">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    <p className="text-[11px] text-[#B7791F] bg-white p-2 rounded border border-[#F3E5D0]">
                      Doctor visit locked until nurse documents morning temperature.
                    </p>

                    <div className="flex justify-between items-center text-[11px] pt-1">
                      <Link href={`/patients/${item.patient.id}`} className="text-[#6B7280] hover:text-[#202124] flex items-center gap-1">
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
              <span className="w-2 h-2 rounded-full bg-[#27805B]" />
              <h3 className="text-xs font-bold text-[#202124] uppercase tracking-wider">Completed Rounds</h3>
            </div>
            <span className="text-xs font-semibold text-[#27805B] bg-[#F0F7F4] px-2 py-0.5 rounded border border-[#D1E7DD]">
              {completedRounds.length} Done
            </span>
          </div>

          <div className="space-y-3">
            {completedRounds.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-xs text-[#6B7280]">
                  No rounds completed yet today.
                </CardContent>
              </Card>
            ) : (
              completedRounds.map((item: any) => (
                <Card key={item.patient.id}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-[#202124]">{item.patient.full_name}</span>
                        <span className="text-[10px] bg-[#FAF8F8] text-[#202124] px-1.5 py-0.5 rounded border border-[#EAE3E5]">
                          Bed {item.patient.bed_number}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-[#202124]">
                        {item.todayTemp?.temp_celsius.toFixed(1)}°C
                      </span>
                    </div>

                    <div className="text-[11px] text-[#6B7280] bg-[#FAF8F8] p-2 rounded border border-[#EAE3E5] italic">
                      &ldquo;{item.todayVisit?.treatment_plan || 'Observations filed'}&rdquo;
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-[#6B7280] pt-1">
                      <span>Seen by {item.todayVisit?.doctor_name || 'Dr. Vance'}</span>
                      <Link href={`/patients/${item.patient.id}`} className="text-[#E88770] hover:underline font-medium">
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
