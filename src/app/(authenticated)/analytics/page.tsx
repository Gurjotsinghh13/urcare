'use client';

import * as React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Download, 
  Clock, 
  Bed, 
  Users,
  Activity
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
  LineChart, 
  Line, 
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function AnalyticsPage() {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/analytics');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {}
    setLoading(false);
  };

  React.useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleExportCSV = () => {
    if (!data) return;
    const { summary, monthlyTrends } = data;
    const rows = [
      ['URCARE EPIDEMIOLOGICAL & OPERATIONAL REPORT'],
      ['Reporting Period', summary.reportingPeriod],
      ['Sample Size', `${summary.sampleSize} completed patient outcomes`],
      ['Total Recoveries', summary.recoveredCount],
      ['Total Mortality', summary.deceasedCount],
      ['Recovery Rate (%)', `${summary.recoveryRate}%`],
      ['Mortality Rate (%)', `${summary.mortalityRate}%`],
      ['Target Recovery Benchmark', `${summary.benchmarks.targetRecoveryRate}%`],
      ['Expected Mortality Benchmark', `${summary.benchmarks.expectedMortalityRate}%`],
      ['Average Length of Stay', `${summary.averageLOSDays} days`],
      [''],
      ['MONTHLY TREND BREAKDOWN'],
      ['Month', 'Admissions', 'Recoveries', 'Deaths', 'Bed Occupancy (%)'],
      ...monthlyTrends.map((m: any) => [m.month, m.admissions, m.recoveries, m.deaths, `${m.occupancyRate}%`]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `URCARE_Analytics_Report_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const { summary, monthlyTrends, ageGroupDistribution } = data;
  const isBenchmarkMet = summary.meetsBenchmark;
  const showWarning = summary.benchmarkWarning;

  const outcomePieData = [
    { name: 'Recovered', value: summary.recoveredCount, color: '#10b981' },
    { name: 'Deceased', value: summary.deceasedCount, color: '#ef4444' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Clinical Analytics & Outcome Reports</h1>
            <Badge variant="info">Evidence-Based</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Period: <span className="font-semibold text-slate-700">{summary.reportingPeriod}</span> • Sample Size: <span className="font-semibold text-slate-700">{summary.sampleSize} Completed Outcomes</span>
          </p>
        </div>
        <Button onClick={handleExportCSV} size="sm" className="gap-1.5 bg-slate-900 hover:bg-slate-800 text-white">
          <Download className="w-4 h-4" />
          Export Complete CSV Report
        </Button>
      </div>

      {/* Benchmark Warning Banner if recovery falls below 85% */}
      {showWarning && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-amber-900">Clinical Benchmark Warning</h4>
            <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
              The facility recovery rate is currently <span className="font-bold">{summary.recoveryRate}%</span>, which is below the mandatory quality benchmark of <span className="font-bold">85.0%</span> across {summary.sampleSize} completed outcomes.
            </p>
          </div>
        </div>
      )}

      {/* Primary KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Recovery Rate */}
        <Card className="hover:border-slate-300 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">Recovery Rate (Discharged)</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">{summary.recoveryRate}%</span>
              <span className="text-xs font-semibold text-emerald-600">Target: ≥ 85%</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
              <span>{summary.recoveredCount} Recoveries</span>
              <span className={`px-2 py-0.5 rounded font-semibold text-[10px] ${
                isBenchmarkMet ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {isBenchmarkMet ? 'Benchmark Met' : 'Action Required'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Mortality Rate */}
        <Card className="hover:border-slate-300 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">Mortality Rate</span>
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">{summary.mortalityRate}%</span>
              <span className="text-xs font-semibold text-slate-500">Expected: ≤ 15%</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
              <span>{summary.deceasedCount} Deceased</span>
              <span className="px-2 py-0.5 rounded font-medium text-[10px] bg-slate-100 text-slate-700">
                Formula: Deaths/(Rec+Death)
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
              <span className="text-3xl font-extrabold text-slate-900">{summary.averageLOSDays}</span>
              <span className="text-xs text-slate-400">Days / Episode</span>
            </div>
            <div className="mt-3 text-[11px] text-slate-500">
              Admission to discharge or closure
            </div>
          </CardContent>
        </Card>

        {/* Total Outcomes Cohort */}
        <Card className="hover:border-slate-300 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">Completed Outcomes</span>
              <Activity className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">{summary.totalOutcomes}</span>
              <span className="text-xs text-slate-400">Cases Analyzed</span>
            </div>
            <div className="mt-3 text-[11px] text-slate-500">
              Sample exceeds min statistical threshold (20)
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Admission and Discharge Volume */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Patient Flow & Outcomes (Last 6 Months)</CardTitle>
            <span className="text-xs text-slate-500">Admissions vs Recoveries</span>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                  <Bar dataKey="admissions" name="Admissions" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="recoveries" name="Recovered" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="deaths" name="Mortality" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Outcome Proportion Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Outcome Ratio Distribution</CardTitle>
            <span className="text-xs text-slate-500">Recovered vs Deceased</span>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <div className="h-48 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={outcomePieData}
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {outcomePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-6 text-xs mt-2">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-slate-700 font-medium">{summary.recoveryRate}% Recovered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-slate-700 font-medium">{summary.mortalityRate}% Deceased</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bed Occupancy Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Facility Bed Occupancy Rate (%)</CardTitle>
          <span className="text-xs text-slate-500">Utilization percentage against 74 maximum bed capacity</span>
        </CardHeader>
        <CardContent>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                <Line type="monotone" dataKey="occupancyRate" name="Occupancy %" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
