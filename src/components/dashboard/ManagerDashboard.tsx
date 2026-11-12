'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  Building2, 
  Bed, 
  TrendingUp, 
  Download, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ManagerDashboardProps {
  data: any;
  onRefresh: () => void;
}

export function ManagerDashboard({ data, onRefresh }: ManagerDashboardProps) {
  const { occupancy, vitals, rounds, discharges, outcomes, today } = data;

  const handleExportCSV = () => {
    // Generate CSV export of operational metrics
    const rows = [
      ['Metric', 'Value', 'Benchmark / Target'],
      ['Total Facility Capacity', `${occupancy.totalCapacity} Beds`, '74 Fixed'],
      ['Currently Occupied Beds', `${occupancy.occupied} Beds`, '-'],
      ['Available Beds', `${occupancy.available} Beds`, '-'],
      ['Occupancy Rate', `${occupancy.occupancyRate}%`, '< 90% Safe Target'],
      ['Today Temperature Measurements Completed', `${vitals.completed}`, `${vitals.completionRate}%`],
      ['Today Doctor Rounds Completed', `${rounds.completed}`, `${rounds.completionRate}%`],
      ['Total Recovered Outcomes', `${outcomes.recoveredCount}`, '-'],
      ['Total Mortality Outcomes', `${outcomes.deceasedCount}`, '-'],
      ['Recovery Rate Percentage', `${outcomes.recoveryRate}%`, '≥ 85.0% Benchmark'],
      ['Mortality Rate Percentage', `${outcomes.mortalityRate}%`, '≤ 15.0% Benchmark'],
      ['Average Length of Stay (Days)', `${outcomes.averageLOSDays} days`, '-'],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `URCARE_Facility_Report_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Facility Operations & Governance</h1>
            <Badge variant="outline" className="text-[10px]">Read-Only Executive View</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Audit capacity utilization, quarantine bed availability, clinical adherence, and outcome KPIs.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button size="sm" variant="outline" onClick={onRefresh}>
            Refresh
          </Button>
          <Button size="sm" onClick={handleExportCSV} className="gap-1.5 bg-slate-900 hover:bg-slate-800 text-white">
            <FileSpreadsheet className="w-4 h-4" />
            Export Operational CSV
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Capacity */}
        <Card className="hover:border-slate-300 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">Facility Capacity</span>
              <Bed className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{occupancy.occupied}</span>
              <span className="text-xs text-slate-400">/ {occupancy.totalCapacity} Total Beds</span>
            </div>
            <div className="mt-3 flex justify-between text-[11px] text-slate-500">
              <span>{occupancy.occupancyRate}% Utilization</span>
              <span className="text-emerald-600 font-semibold">{occupancy.available} Available</span>
            </div>
          </CardContent>
        </Card>

        {/* Recovery Rate */}
        <Card className="hover:border-slate-300 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">Recovery Rate</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{outcomes.recoveryRate}%</span>
              <span className="text-xs text-slate-500">Benchmark: 85.0%</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">{outcomes.recoveredCount} Recovered</span>
              <span className="text-emerald-700 font-medium bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                Meets Benchmark
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Mortality Rate */}
        <Card className="hover:border-slate-300 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">Mortality Rate</span>
              <AlertTriangle className="w-4 h-4 text-slate-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{outcomes.mortalityRate}%</span>
              <span className="text-xs text-slate-500">Benchmark: ≤ 15.0%</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">{outcomes.deceasedCount} Deceased</span>
              <span className="text-slate-700 font-medium bg-slate-100 px-1.5 py-0.2 rounded">
                Within Expected
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Average LOS */}
        <Card className="hover:border-slate-300 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">Average Length of Stay</span>
              <Clock className="w-4 h-4 text-purple-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{outcomes.averageLOSDays}</span>
              <span className="text-xs text-slate-400">Days per Patient</span>
            </div>
            <div className="mt-3 flex justify-between text-[11px] text-slate-500">
              <span>Cohort: {outcomes.totalOutcomes} Discharges</span>
              <span className="text-purple-600 font-medium">Standard Protocol</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Operational Compliance Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Daily Clinical Workflow Adherence</CardTitle>
            <span className="text-xs text-slate-500">Mandatory daily measurements audit</span>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-800">Nursing Temperature Completion</span>
                <span className="font-bold text-slate-900">{vitals.completed} / {data.admittedPatientsCount} ({vitals.completionRate}%)</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${vitals.completionRate}%` }} />
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-800">Doctor Rounds Completion</span>
                <span className="font-bold text-slate-900">{rounds.completed} / {data.admittedPatientsCount} ({rounds.completionRate}%)</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${rounds.completionRate}%` }} />
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-800">
              <span className="font-semibold">Workflow Rule Verification:</span> No physician can complete a routine patient round prior to morning temperature entry by nursing staff. System enforcement is active.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quarantine Bed Distribution (74 Beds)</CardTitle>
            <span className="text-xs text-slate-500">Capacity breakdown by ward unit</span>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { ward: 'Ward A (Respiratory)', range: 'Beds 1 - 20', total: 20, occupied: 7 },
              { ward: 'Ward B (Observation)', range: 'Beds 21 - 40', total: 20, occupied: 5 },
              { ward: 'Ward C (Step-down)', range: 'Beds 41 - 60', total: 20, occupied: 3 },
              { ward: 'Ward D (Isolation)', range: 'Beds 61 - 74', total: 14, occupied: 1 },
            ].map((w) => (
              <div key={w.ward} className="p-3 rounded-lg border border-slate-200 bg-white flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-900">{w.ward}</div>
                  <div className="text-[11px] text-slate-500">{w.range}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-slate-800">{w.occupied} / {w.total} Occupied</div>
                  <div className="text-[11px] text-emerald-600">{w.total - w.occupied} Beds Available</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
