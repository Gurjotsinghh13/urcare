'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  Bed, 
  Thermometer, 
  Stethoscope, 
  TrendingUp,
  UserPlus,
  ArrowUpRight,
  AlertTriangle,
  DoorOpen
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid 
} from 'recharts';

interface AdminDashboardProps {
  data: any;
  onRefresh: () => void;
  onOpenAdmitModal: () => void;
}

export function AdminDashboard({ data, onRefresh, onOpenAdmitModal }: AdminDashboardProps) {
  const { occupancy, vitals, rounds, discharges, outcomes, sevenDayTrend } = data;

  const recoverySuccess = outcomes?.recoveryRate || 0;
  const isBenchmarkMet = outcomes?.meetsBenchmark ?? true;
  const benchmarkWarning = outcomes?.benchmarkWarning ?? false;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-[#EAE3E5]">
        <div>
          <h1 className="text-xl font-bold text-[#202124] tracking-tight">Facility Administrator Command Center</h1>
          <p className="text-xs text-[#6B7280] mt-1">
            Real-time monitoring across quarantine occupancy, clinical compliance, and patient flow.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button size="sm" variant="outline" onClick={onRefresh}>
            Refresh Live Data
          </Button>
          <Button size="sm" onClick={onOpenAdmitModal} className="gap-1.5">
            <UserPlus className="w-3.5 h-3.5" />
            Admit New Patient
          </Button>
        </div>
      </div>

      {/* Benchmark Compliance Alert if Recovery Rate falls below 85% */}
      {benchmarkWarning && (
        <div className="p-4 bg-[#FDF8F0] border border-[#F3E5D0] rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-[#B7791F] shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-semibold text-[#B7791F]">Recovery Rate Benchmark Warning</h4>
            <p className="text-xs text-[#202124] mt-0.5 leading-relaxed">
              Current recovery rate is <span className="font-semibold">{recoverySuccess}%</span>, which is below the facility benchmark of <span className="font-semibold">85.0%</span> across a sample of {outcomes.totalOutcomes} completed outcomes.
            </p>
          </div>
        </div>
      )}

      {/* Clean KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Bed Occupancy */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-[#6B7280] mb-2">
              <span className="text-xs font-medium">Bed Occupancy</span>
              <Bed className="w-4 h-4 text-[#E88770]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#202124]">{occupancy.occupied}</span>
              <span className="text-xs text-[#6B7280]">/ {occupancy.totalCapacity} Beds</span>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-[11px] text-[#6B7280] mb-1">
                <span>{occupancy.occupancyRate}% Occupied</span>
                <span className="text-[#27805B] font-medium">{occupancy.available} Available</span>
              </div>
              <div className="w-full bg-[#FAF8F8] border border-[#EAE3E5] rounded-full h-1.5 overflow-hidden">
                <div 
                  className="h-1.5 rounded-full bg-[#E88770]" 
                  style={{ width: `${Math.min(100, occupancy.occupancyRate)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Temperature Progress */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-[#6B7280] mb-2">
              <span className="text-xs font-medium">Today’s Temperatures</span>
              <Thermometer className="w-4 h-4 text-[#E88770]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#202124]">{vitals.completed}</span>
              <span className="text-xs text-[#6B7280]">/ {data.admittedPatientsCount} Patients</span>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-[11px] text-[#6B7280] mb-1">
                <span>{vitals.completionRate}% Done</span>
                <span className={vitals.pending > 0 ? 'text-[#B7791F] font-medium' : 'text-[#6B7280]'}>
                  {vitals.pending} Pending
                </span>
              </div>
              <div className="w-full bg-[#FAF8F8] border border-[#EAE3E5] rounded-full h-1.5 overflow-hidden">
                <div 
                  className="h-1.5 rounded-full bg-[#F4C7D3]" 
                  style={{ width: `${vitals.completionRate}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Doctor Rounds Progress */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-[#6B7280] mb-2">
              <span className="text-xs font-medium">Doctor Rounds Today</span>
              <Stethoscope className="w-4 h-4 text-[#E88770]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#202124]">{rounds.completed}</span>
              <span className="text-xs text-[#6B7280]">/ {data.admittedPatientsCount} Patients</span>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-[11px] text-[#6B7280] mb-1">
                <span>{rounds.completionRate}% Done</span>
                <span className={rounds.pending > 0 ? 'text-[#E88770] font-medium' : 'text-[#6B7280]'}>
                  {rounds.pending} Pending
                </span>
              </div>
              <div className="w-full bg-[#FAF8F8] border border-[#EAE3E5] rounded-full h-1.5 overflow-hidden">
                <div 
                  className="h-1.5 rounded-full bg-[#E88770]" 
                  style={{ width: `${rounds.completionRate}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recovery Rate vs Benchmark */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-[#6B7280] mb-2">
              <span className="text-xs font-medium">Recovery Rate</span>
              <TrendingUp className="w-4 h-4 text-[#27805B]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#202124]">{recoverySuccess}%</span>
              <span className="text-xs text-[#6B7280]">Target: ≥ 85%</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px]">
              <span className="text-[#6B7280]">Sample: {outcomes.totalOutcomes} cases</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                isBenchmarkMet ? 'bg-[#F0F7F4] text-[#27805B] border-[#D1E7DD]' : 'bg-[#FDF8F0] text-[#B7791F] border-[#F3E5D0]'
              }`}>
                {isBenchmarkMet ? 'Target Met' : 'Below Target'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts & Operational Priorities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Activity Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Daily Clinical Activity Trend (Last 7 Days)</CardTitle>
            <span className="text-xs text-[#6B7280]">Temperatures vs Doctor Visits</span>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sevenDayTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAE3E5" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} axisLine={{ stroke: '#EAE3E5' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} axisLine={{ stroke: '#EAE3E5' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #EAE3E5', fontSize: '12px', boxShadow: 'none' }}
                  />
                  <Bar dataKey="temperatures" name="Temperatures" fill="#E88770" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="visits" name="Doctor Visits" fill="#F4C7D3" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Operational Priorities */}
        <Card>
          <CardHeader>
            <CardTitle>Operational Priorities</CardTitle>
            <span className="text-xs text-[#6B7280]">{data.pendingTasks?.length || 0} active</span>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.pendingTasks?.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#6B7280]">All routine workflows completed today</div>
            ) : (
              data.pendingTasks?.map((t: any) => (
                <div key={t.id} className="p-3 rounded-md border border-[#EAE3E5] bg-[#FAF8F8] hover:bg-[#F7F0F1] transition-colors">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded border ${
                      t.priority === 'critical' ? 'bg-[#FDF2F2] text-[#C04444] border-[#F8D7DA]' : 'bg-[#FCEEF1] text-[#E88770] border-[#F4C7D3]'
                    }`}>
                      {t.priority}
                    </span>
                    <span className="text-[11px] text-[#6B7280] capitalize">{t.role}</span>
                  </div>
                  <p className="text-xs font-semibold text-[#202124] mt-1.5">{t.title}</p>
                  <Link 
                    href={t.link} 
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-[#E88770] hover:text-[#D97660] mt-2"
                  >
                    Action Task <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>
              ))
            )}

            <div className="pt-2 border-t border-[#EAE3E5]/60 flex flex-col gap-2">
              <Link href="/discharges" className="w-full">
                <Button variant="outline" size="sm" className="w-full justify-between">
                  <span>Discharge Workflow Center</span>
                  <span className="text-xs bg-[#FAF8F8] px-1.5 py-0.5 rounded font-semibold text-[#202124] border border-[#EAE3E5]">
                    {discharges.eligibleCount} Eligible
                  </span>
                </Button>
              </Link>
              <Link href="/analytics" className="w-full">
                <Button variant="outline" size="sm" className="w-full justify-between">
                  <span>Epidemiology & Outcome Reports</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#6B7280]" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
