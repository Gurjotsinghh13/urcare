'use client';

import * as React from 'react';
import { 
  Users, 
  Bed, 
  Thermometer, 
  Stethoscope, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowUpRight, 
  TrendingUp,
  UserPlus,
  DoorOpen,
  Calendar
} from 'lucide-react';
import Link from 'next/link';
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
  LineChart, 
  Line, 
  CartesianGrid 
} from 'recharts';

interface AdminDashboardProps {
  data: any;
  onRefresh: () => void;
  onOpenAdmitModal: () => void;
}

export function AdminDashboard({ data, onRefresh, onOpenAdmitModal }: AdminDashboardProps) {
  const { occupancy, vitals, rounds, discharges, outcomes, sevenDayTrend, pendingTasks, today } = data;

  const recoverySuccess = outcomes?.recoveryRate || 0;
  const isBenchmarkMet = outcomes?.meetsBenchmark ?? true;
  const benchmarkWarning = outcomes?.benchmarkWarning ?? false;

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Facility Administrator Command Center</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time monitoring across quarantine occupancy, clinical compliance, and patient flow.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button size="sm" variant="outline" onClick={onRefresh}>
            Refresh Live Data
          </Button>
          <Button size="sm" onClick={onOpenAdmitModal} className="gap-1.5">
            <UserPlus className="w-4 h-4" />
            Admit New Patient
          </Button>
        </div>
      </div>

      {/* Benchmark Compliance Alert if Recovery Rate falls below 85% */}
      {benchmarkWarning && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-amber-900">Recovery Rate Benchmark Warning</h4>
            <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
              Current recovery rate is <span className="font-bold">{recoverySuccess}%</span>, which is below the facility benchmark of <span className="font-bold">85.0%</span> across a sample of {outcomes.totalOutcomes} completed outcomes. Please review clinical protocol compliance and patient severity.
            </p>
          </div>
        </div>
      )}

      {/* KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Occupancy Card */}
        <Card className="hover:border-slate-300 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">Bed Occupancy</span>
              <Bed className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{occupancy.occupied}</span>
              <span className="text-xs text-slate-400">/ {occupancy.totalCapacity} Beds</span>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                <span>{occupancy.occupancyRate}% Occupied</span>
                <span className="text-emerald-600 font-medium">{occupancy.available} Available</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-2 rounded-full ${occupancy.isNearCapacity ? 'bg-amber-500' : 'bg-blue-600'}`} 
                  style={{ width: `${Math.min(100, occupancy.occupancyRate)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Temperature Progress */}
        <Card className="hover:border-slate-300 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">Today’s Temperatures</span>
              <Thermometer className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{vitals.completed}</span>
              <span className="text-xs text-slate-400">/ {data.admittedPatientsCount} Patients</span>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                <span>{vitals.completionRate}% Done</span>
                <span className={vitals.pending > 0 ? 'text-amber-600 font-medium' : 'text-slate-400'}>
                  {vitals.pending} Pending
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-2 rounded-full bg-emerald-500" 
                  style={{ width: `${vitals.completionRate}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Doctor Visits Progress */}
        <Card className="hover:border-slate-300 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">Doctor Rounds Today</span>
              <Stethoscope className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{rounds.completed}</span>
              <span className="text-xs text-slate-400">/ {data.admittedPatientsCount} Patients</span>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                <span>{rounds.completionRate}% Done</span>
                <span className={rounds.pending > 0 ? 'text-indigo-600 font-medium' : 'text-slate-400'}>
                  {rounds.pending} Pending
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-2 rounded-full bg-indigo-500" 
                  style={{ width: `${rounds.completionRate}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recovery Rate vs Benchmark */}
        <Card className="hover:border-slate-300 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">Recovery Rate (Outcome)</span>
              <TrendingUp className={`w-4 h-4 ${isBenchmarkMet ? 'text-emerald-600' : 'text-amber-600'}`} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{recoverySuccess}%</span>
              <span className="text-xs text-slate-500">Benchmark: ≥ 85%</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Sample: {outcomes.totalOutcomes} outcomes</span>
              <span className={`px-2 py-0.5 rounded font-semibold text-[10px] ${
                isBenchmarkMet ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {isBenchmarkMet ? 'Target Met' : 'Below Target'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts & Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Activity Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Daily Clinical Activity Trend (Last 7 Days)</CardTitle>
            <span className="text-xs text-slate-500">Temperatures vs Doctor Visits</span>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sevenDayTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="temperatures" name="Temperatures" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="visits" name="Doctor Visits" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Operational Priority Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Operational Priorities</CardTitle>
            <span className="text-xs text-slate-500">{pendingTasks.length} active items</span>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingTasks.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">All routine workflows completed today</div>
            ) : (
              pendingTasks.map((t: any) => (
                <div key={t.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded border ${
                      t.priority === 'critical' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                      {t.priority}
                    </span>
                    <span className="text-[11px] text-slate-400 capitalize">{t.role}</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800 mt-1.5">{t.title}</p>
                  <Link 
                    href={t.link} 
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-800 mt-2"
                  >
                    Action Task <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>
              ))
            )}

            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <Link href="/discharges" className="w-full">
                <Button variant="outline" size="sm" className="w-full justify-between">
                  <span>Discharge Workflow Center</span>
                  <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded font-semibold text-slate-700">
                    {discharges.eligibleCount} Eligible
                  </span>
                </Button>
              </Link>
              <Link href="/analytics" className="w-full">
                <Button variant="outline" size="sm" className="w-full justify-between">
                  <span>Epidemiology & Outcome Reports</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
