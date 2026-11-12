'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  Stethoscope, 
  AlertCircle, 
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
  const { vitals, rounds, discharges, today } = data;
  const [roundsQueue, setRoundsQueue] = React.useState<any>({
    waitingForVitals: [],
    readyForRounds: [],
    completedRounds: [],
  });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadQueue() {
      try {
        const res = await fetch('/api/rounds');
        if (res.ok) {
          const json = await res.json();
          setRoundsQueue(json);
        }
      } catch {}
      setLoading(false);
    }
    loadQueue();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Attending Physician Clinical Workspace</h1>
          <p className="text-xs text-slate-500 mt-1">
            Conduct daily clinical rounds, review patient afebrile streaks, and evaluate discharge readiness.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link href="/rounds">
            <Button size="sm" className="gap-1.5">
              <Stethoscope className="w-4 h-4" />
              Open Rounds Workspace
            </Button>
          </Link>
          <Link href="/discharges">
            <Button size="sm" variant="outline" className="gap-1.5">
              <DoorOpen className="w-4 h-4" />
              Discharge Reviews ({discharges.eligibleCount})
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ready for Doctor Review */}
        <Card className="border-l-4 border-l-blue-600">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">Ready for Rounds</span>
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">
                {roundsQueue.readyForRounds?.length || 0}
              </span>
              <span className="text-xs text-slate-500">Vitals logged today</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Patients with morning temperature taken, ready for review.
            </p>
          </CardContent>
        </Card>

        {/* Visited Today */}
        <Card className="border-l-4 border-l-emerald-600">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">Rounds Completed</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">
                {roundsQueue.completedRounds?.length || 0}
              </span>
              <span className="text-xs text-slate-500">Patients evaluated</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Clinical observations & treatment orders filed.
            </p>
          </CardContent>
        </Card>

        {/* High Temperature Alerts */}
        <Card className="border-l-4 border-l-red-600">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">Fever Alerts</span>
              <Flame className="w-4 h-4 text-red-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-red-600">
                {vitals.highTempCount || 0}
              </span>
              <span className="text-xs text-slate-500">Patients (≥ 38.0°C)</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Requires immediate clinical evaluation or treatment adjustment.
            </p>
          </CardContent>
        </Card>

        {/* Discharge Reviews */}
        <Card className="border-l-4 border-l-indigo-600">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">Discharge Eligible</span>
              <FileCheck className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-indigo-600">
                {discharges.eligibleCount || 0}
              </span>
              <span className="text-xs text-slate-500">3-Day Afebrile</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Completed 3-day rule; awaiting physician approval.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Queue: Patients Ready for Doctor Rounds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Rounds Queue (Ready for Clinical Review)</CardTitle>
                <span className="text-xs text-slate-500">Vitals recorded by nurse; awaiting physician</span>
              </div>
              <Badge variant="info">{roundsQueue.readyForRounds?.length || 0} Ready</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {roundsQueue.readyForRounds?.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400">
                No patients awaiting review at this time.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {roundsQueue.readyForRounds?.map((item: any) => (
                  <div key={item.patient.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-900">{item.patient.full_name}</span>
                        <span className="text-[10px] font-medium bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                          Bed {item.patient.bed_number}
                        </span>
                        {item.isFever && (
                          <span className="text-[10px] font-bold bg-red-50 text-red-700 px-1.5 py-0.5 rounded border border-red-200">
                            Fever {item.todayTemp?.temp_celsius}°C
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
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
                <span className="text-xs text-slate-500">Clinical prerequisite: Doctor cannot visit before temperature entry</span>
              </div>
              <Badge variant="warning">{roundsQueue.waitingForVitals?.length || 0} Pending</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {roundsQueue.waitingForVitals?.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400">
                All admitted patients have today’s temperatures logged!
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {roundsQueue.waitingForVitals?.map((item: any) => (
                  <div key={item.patient.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-900">{item.patient.full_name}</span>
                        <span className="text-[10px] font-medium bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                          Bed {item.patient.bed_number}
                        </span>
                      </div>
                      <div className="text-[11px] text-amber-700 font-medium mt-0.5">
                        Routine temperature measurement pending from nurse
                      </div>
                    </div>
                    <Button size="sm" variant="outline" disabled className="text-xs opacity-60">
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
