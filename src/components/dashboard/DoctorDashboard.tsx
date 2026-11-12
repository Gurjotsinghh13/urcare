'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  Stethoscope, 
  CheckCircle2, 
  DoorOpen, 
  Clock, 
  ArrowRight,
  Flame,
  FileCheck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface DoctorDashboardProps {
  data: any;
  onRefresh: () => void;
  onOpenVisitModal: (patient: any) => void;
}

export function DoctorDashboard({ data, onRefresh, onOpenVisitModal }: DoctorDashboardProps) {
  const { vitals, discharges } = data;
  const [roundsQueue, setRoundsQueue] = React.useState<any>({
    waitingForVitals: [],
    readyForRounds: [],
    completedRounds: [],
  });

  React.useEffect(() => {
    async function loadQueue() {
      try {
        const res = await fetch('/api/rounds');
        if (res.ok) {
          const json = await res.json();
          setRoundsQueue(json);
        }
      } catch {}
    }
    loadQueue();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-[#EAE3E5]">
        <div>
          <h1 className="text-xl font-bold text-[#202124] tracking-tight">Attending Physician Clinical Workspace</h1>
          <p className="text-xs text-[#6B7280] mt-1">
            Conduct daily clinical rounds, review patient afebrile streaks, and evaluate discharge readiness.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link href="/rounds">
            <Button size="sm" className="gap-1.5">
              <Stethoscope className="w-3.5 h-3.5" />
              Open Rounds Workspace
            </Button>
          </Link>
          <Link href="/discharges">
            <Button size="sm" variant="outline" className="gap-1.5">
              <DoorOpen className="w-3.5 h-3.5" />
              Discharge Reviews ({discharges.eligibleCount})
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ready for Rounds */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-[#6B7280] mb-2">
              <span className="text-xs font-medium">Ready for Rounds</span>
              <Clock className="w-4 h-4 text-[#E88770]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#202124]">
                {roundsQueue.readyForRounds?.length || 0}
              </span>
              <span className="text-xs text-[#6B7280]">Vitals logged</span>
            </div>
            <p className="text-[11px] text-[#6B7280] mt-2">
              Morning temperatures recorded by nurse.
            </p>
          </CardContent>
        </Card>

        {/* Visited Today */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-[#6B7280] mb-2">
              <span className="text-xs font-medium">Rounds Completed</span>
              <CheckCircle2 className="w-4 h-4 text-[#27805B]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#202124]">
                {roundsQueue.completedRounds?.length || 0}
              </span>
              <span className="text-xs text-[#6B7280]">Evaluated</span>
            </div>
            <p className="text-[11px] text-[#6B7280] mt-2">
              Clinical observations & treatment orders filed.
            </p>
          </CardContent>
        </Card>

        {/* High Temperature Alerts */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-[#6B7280] mb-2">
              <span className="text-xs font-medium">Fever Alerts</span>
              <Flame className="w-4 h-4 text-[#C04444]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#C04444]">
                {vitals.highTempCount || 0}
              </span>
              <span className="text-xs text-[#6B7280]">≥ 38.0°C</span>
            </div>
            <p className="text-[11px] text-[#6B7280] mt-2">
              Requires clinical evaluation or regimen change.
            </p>
          </CardContent>
        </Card>

        {/* Discharge Reviews */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-[#6B7280] mb-2">
              <span className="text-xs font-medium">Discharge Eligible</span>
              <FileCheck className="w-4 h-4 text-[#E88770]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#202124]">
                {discharges.eligibleCount || 0}
              </span>
              <span className="text-xs text-[#6B7280]">3-Day Afebrile</span>
            </div>
            <p className="text-[11px] text-[#6B7280] mt-2">
              Completed 3-day rule; awaiting physician sign-off.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Worklists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ready for Rounds */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Rounds Queue (Ready for Clinical Review)</CardTitle>
                <span className="text-xs text-[#6B7280]">Vitals recorded by nurse; ready for physician review</span>
              </div>
              <Badge variant="accent">{roundsQueue.readyForRounds?.length || 0} Ready</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {roundsQueue.readyForRounds?.length === 0 ? (
              <div className="text-center py-10 text-xs text-[#6B7280]">
                No patients awaiting review at this time.
              </div>
            ) : (
              <div className="divide-y divide-[#EAE3E5]/60">
                {roundsQueue.readyForRounds?.map((item: any) => (
                  <div key={item.patient.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#202124]">{item.patient.full_name}</span>
                        <span className="text-[10px] font-medium bg-[#FAF8F8] text-[#202124] px-1.5 py-0.5 rounded border border-[#EAE3E5]">
                          Bed {item.patient.bed_number}
                        </span>
                        {item.isFever && (
                          <span className="text-[10px] font-bold bg-[#FDF2F2] text-[#C04444] px-1.5 py-0.5 rounded border border-[#F8D7DA]">
                            Fever {item.todayTemp?.temp_celsius}°C
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#6B7280] mt-0.5">
                        Temp: {item.todayTemp?.temp_celsius}°C • Streak: {item.streak} days fever-free
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="primary" 
                      onClick={() => onOpenVisitModal(item.patient)}
                      className="text-xs gap-1"
                    >
                      <span>Conduct Visit</span>
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Patients Waiting for Nurse Vitals (Doctor visit blocked) */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Waiting for Nurse Vitals</CardTitle>
                <span className="text-xs text-[#6B7280]">Mandatory prerequisite: Doctor cannot visit before temperature entry</span>
              </div>
              <Badge variant="warning">{roundsQueue.waitingForVitals?.length || 0} Pending</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {roundsQueue.waitingForVitals?.length === 0 ? (
              <div className="text-center py-10 text-xs text-[#6B7280]">
                All admitted patients have today’s temperatures logged.
              </div>
            ) : (
              <div className="divide-y divide-[#EAE3E5]/60">
                {roundsQueue.waitingForVitals?.map((item: any) => (
                  <div key={item.patient.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#202124]">{item.patient.full_name}</span>
                        <span className="text-[10px] bg-[#FAF8F8] text-[#202124] px-1.5 py-0.5 rounded border border-[#EAE3E5]">
                          Bed {item.patient.bed_number}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#B7791F] font-medium mt-0.5">
                        Routine temperature measurement pending from nurse
                      </div>
                    </div>
                    <Button size="sm" variant="outline" disabled className="text-xs opacity-50">
                      Rounds Locked
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
