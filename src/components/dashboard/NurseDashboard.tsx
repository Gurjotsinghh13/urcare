'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  Thermometer, 
  CheckCircle2, 
  Flame, 
  Clock, 
  Plus, 
  Stethoscope
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatTime } from '@/lib/rules';

interface NurseDashboardProps {
  data: any;
  onRefresh: () => void;
  onOpenTempModal: (patient?: any) => void;
}

export function NurseDashboard({ data, onRefresh, onOpenTempModal }: NurseDashboardProps) {
  const [patients, setPatients] = React.useState<any[]>([]);
  const [recentTemps, setRecentTemps] = React.useState<any[]>([]);

  React.useEffect(() => {
    async function loadData() {
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
          setRecentTemps((tempJson.temperatures || []).slice(0, 8));
        }
      } catch {}
    }
    loadData();
  }, []);

  const pendingPatients = patients.filter((p) => p.todayTemp === null);
  const completedPatients = patients.filter((p) => p.todayTemp !== null);
  const highTempPatients = patients.filter((p) => p.isFeverToday);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-[#EAE3E5]">
        <div>
          <h1 className="text-xl font-bold text-[#202124] tracking-tight">Charge Nurse Clinical Station</h1>
          <p className="text-xs text-[#6B7280] mt-1">
            Conduct daily routine morning temperature measurements, monitor fever patterns, and prepare patients for physician rounds.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button size="sm" onClick={() => onOpenTempModal()} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            Record Temperature
          </Button>
          <Link href="/temperatures">
            <Button size="sm" variant="outline" className="gap-1.5">
              <Thermometer className="w-3.5 h-3.5" />
              Vitals Worklist
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Measurements */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-[#6B7280] mb-2">
              <span className="text-xs font-medium">Pending Temperatures</span>
              <Clock className="w-4 h-4 text-[#B7791F]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#202124]">{pendingPatients.length}</span>
              <span className="text-xs text-[#6B7280]">Due</span>
            </div>
            <p className="text-[11px] text-[#6B7280] mt-2">
              Mandatory daily morning routine readings.
            </p>
          </CardContent>
        </Card>

        {/* Completed Measurements */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-[#6B7280] mb-2">
              <span className="text-xs font-medium">Completed Today</span>
              <CheckCircle2 className="w-4 h-4 text-[#27805B]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#202124]">{completedPatients.length}</span>
              <span className="text-xs text-[#6B7280]">Recorded</span>
            </div>
            <p className="text-[11px] text-[#6B7280] mt-2">
              Vitals logged & unlocked for doctor rounds.
            </p>
          </CardContent>
        </Card>

        {/* High Temperature Patients */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-[#6B7280] mb-2">
              <span className="text-xs font-medium">Fever Cases (≥ 38.0°C)</span>
              <Flame className="w-4 h-4 text-[#C04444]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#C04444]">{highTempPatients.length}</span>
              <span className="text-xs text-[#6B7280]">Active</span>
            </div>
            <p className="text-[11px] text-[#6B7280] mt-2">
              Physicians alerted for urgent evaluation.
            </p>
          </CardContent>
        </Card>

        {/* Doctor Visit Status */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-[#6B7280] mb-2">
              <span className="text-xs font-medium">Doctor Rounds Done</span>
              <Stethoscope className="w-4 h-4 text-[#E88770]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#202124]">
                {patients.filter((p) => p.todayVisitCompleted).length}
              </span>
              <span className="text-xs text-[#6B7280]">of {patients.length} seen</span>
            </div>
            <p className="text-[11px] text-[#6B7280] mt-2">
              Patients evaluated on morning rounds.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Worklists: Pending Temps + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Measurements Priority Queue */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Pending Morning Vitals Queue</CardTitle>
                <span className="text-xs text-[#6B7280]">Patients needing daily routine reading</span>
              </div>
              <Badge variant="warning">{pendingPatients.length} Pending</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {pendingPatients.length === 0 ? (
              <div className="text-center py-10 text-xs text-[#6B7280]">
                All routine daily temperatures recorded for today.
              </div>
            ) : (
              <div className="divide-y divide-[#EAE3E5]/60">
                {pendingPatients.map((p) => (
                  <div key={p.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#202124]">{p.full_name}</span>
                        <span className="text-[10px] font-medium bg-[#FAF8F8] text-[#202124] px-1.5 py-0.5 rounded border border-[#EAE3E5]">
                          Bed {p.bed_number}
                        </span>
                        <span className="text-[10px] text-[#6B7280]">{p.patient_code}</span>
                      </div>
                      <div className="text-[11px] text-[#6B7280] mt-0.5">
                        Admitted: {p.admission_date} • History: {p.medical_history || 'None'}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => onOpenTempModal(p)}
                      className="text-xs gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Take Temp</span>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Measurement Log */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Readings</CardTitle>
            <span className="text-xs text-[#6B7280]">Live nursing vitals activity</span>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              {recentTemps.length === 0 ? (
                <div className="text-center py-6 text-xs text-[#6B7280]">No recent logs</div>
              ) : (
                recentTemps.map((r) => (
                  <div key={r.id} className="p-2.5 rounded-md border border-[#EAE3E5] bg-[#FAF8F8] flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-[#202124]">
                        {r.temp_celsius.toFixed(1)}°C
                        {r.is_fever && (
                          <span className="ml-1.5 text-[10px] font-bold text-[#C04444] bg-[#FDF2F2] px-1 py-0.2 rounded border border-[#F8D7DA]">
                            Fever
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-[#6B7280] mt-0.5">
                        {r.notes || (r.is_routine ? 'Routine check' : 'Extra check')}
                      </div>
                    </div>
                    <span className="text-[10px] text-[#6B7280]">
                      {formatTime(r.measurement_time)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
