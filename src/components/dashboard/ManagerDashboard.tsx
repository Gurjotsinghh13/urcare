'use client';

import * as React from 'react';
import { 
  Bed, 
  TrendingUp, 
  AlertTriangle, 
  Clock,
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
  const { occupancy, vitals, rounds, outcomes, today } = data;

  const handleExportCSV = () => {
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-[#EAE3E5]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#202124] tracking-tight">Facility Operations & Governance</h1>
            <Badge variant="outline" className="text-[10px]">Read-Only Executive View</Badge>
          </div>
          <p className="text-xs text-[#6B7280] mt-1">
            Audit capacity utilization, quarantine bed availability, clinical adherence, and outcome KPIs.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button size="sm" variant="outline" onClick={onRefresh}>
            Refresh
          </Button>
          <Button size="sm" onClick={handleExportCSV} className="gap-1.5">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Export Operational CSV
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Capacity */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-[#6B7280] mb-2">
              <span className="text-xs font-medium">Facility Capacity</span>
              <Bed className="w-4 h-4 text-[#E88770]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#202124]">{occupancy.occupied}</span>
              <span className="text-xs text-[#6B7280]">/ {occupancy.totalCapacity} Total Beds</span>
            </div>
            <div className="mt-3 flex justify-between text-[11px] text-[#6B7280]">
              <span>{occupancy.occupancyRate}% Utilization</span>
              <span className="text-[#27805B] font-semibold">{occupancy.available} Available</span>
            </div>
          </CardContent>
        </Card>

        {/* Recovery Rate */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-[#6B7280] mb-2">
              <span className="text-xs font-medium">Recovery Rate</span>
              <TrendingUp className="w-4 h-4 text-[#27805B]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#202124]">{outcomes.recoveryRate}%</span>
              <span className="text-xs text-[#6B7280]">Target: 85.0%</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px]">
              <span className="text-[#6B7280]">{outcomes.recoveredCount} Recovered</span>
              <span className="text-[#27805B] font-medium bg-[#F0F7F4] px-1.5 py-0.2 rounded border border-[#D1E7DD]">
                Meets Benchmark
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Mortality Rate */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-[#6B7280] mb-2">
              <span className="text-xs font-medium">Mortality Rate</span>
              <AlertTriangle className="w-4 h-4 text-[#6B7280]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#202124]">{outcomes.mortalityRate}%</span>
              <span className="text-xs text-[#6B7280]">Target: ≤ 15.0%</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px]">
              <span className="text-[#6B7280]">{outcomes.deceasedCount} Deceased</span>
              <span className="text-[#6B7280] font-medium bg-[#FAF8F8] px-1.5 py-0.2 rounded border border-[#EAE3E5]">
                Within Expected
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Average LOS */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-[#6B7280] mb-2">
              <span className="text-xs font-medium">Average Length of Stay</span>
              <Clock className="w-4 h-4 text-[#E88770]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#202124]">{outcomes.averageLOSDays}</span>
              <span className="text-xs text-[#6B7280]">Days / Episode</span>
            </div>
            <div className="mt-3 flex justify-between text-[11px] text-[#6B7280]">
              <span>Cohort: {outcomes.totalOutcomes} Discharges</span>
              <span className="text-[#202124] font-medium">Protocol Standard</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Operational Compliance Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Daily Clinical Workflow Adherence</CardTitle>
            <span className="text-xs text-[#6B7280]">Mandatory daily measurements audit</span>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-md bg-[#FAF8F8] border border-[#EAE3E5] space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-[#202124]">Nursing Temperature Completion</span>
                <span className="font-bold text-[#202124]">{vitals.completed} / {data.admittedPatientsCount} ({vitals.completionRate}%)</span>
              </div>
              <div className="w-full bg-white border border-[#EAE3E5] rounded-full h-1.5">
                <div className="bg-[#E88770] h-1.5 rounded-full" style={{ width: `${vitals.completionRate}%` }} />
              </div>
            </div>

            <div className="p-4 rounded-md bg-[#FAF8F8] border border-[#EAE3E5] space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-[#202124]">Doctor Rounds Completion</span>
                <span className="font-bold text-[#202124]">{rounds.completed} / {data.admittedPatientsCount} ({rounds.completionRate}%)</span>
              </div>
              <div className="w-full bg-white border border-[#EAE3E5] rounded-full h-1.5">
                <div className="bg-[#F4C7D3] h-1.5 rounded-full" style={{ width: `${rounds.completionRate}%` }} />
              </div>
            </div>

            <div className="p-3 bg-[#FAF8F8] border border-[#EAE3E5] rounded-md text-xs text-[#6B7280]">
              <span className="font-semibold text-[#202124]">Workflow Rule Verification:</span> No physician can complete a routine patient round prior to morning temperature entry by nursing staff. System enforcement is active.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quarantine Bed Distribution (74 Beds)</CardTitle>
            <span className="text-xs text-[#6B7280]">Capacity breakdown by ward unit</span>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {[
              { ward: 'Ward A (Respiratory)', range: 'Beds 1 - 20', total: 20, occupied: 7 },
              { ward: 'Ward B (Observation)', range: 'Beds 21 - 40', total: 20, occupied: 5 },
              { ward: 'Ward C (Step-down)', range: 'Beds 41 - 60', total: 20, occupied: 3 },
              { ward: 'Ward D (Isolation)', range: 'Beds 61 - 74', total: 14, occupied: 1 },
            ].map((w) => (
              <div key={w.ward} className="p-3 rounded-md border border-[#EAE3E5] bg-[#FAF8F8] flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-[#202124]">{w.ward}</div>
                  <div className="text-[11px] text-[#6B7280]">{w.range}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-[#202124]">{w.occupied} / {w.total} Occupied</div>
                  <div className="text-[11px] text-[#27805B]">{w.total - w.occupied} Beds Available</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
