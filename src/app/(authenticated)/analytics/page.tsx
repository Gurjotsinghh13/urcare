'use client';

import * as React from 'react';
import { 
  TrendingUp, 
  AlertTriangle, 
  Download, 
  Clock, 
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
        <div className="w-7 h-7 border-2 border-[#E88770] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const { summary, monthlyTrends } = data;
  const isBenchmarkMet = summary.meetsBenchmark;
  const showWarning = summary.benchmarkWarning;

  // Outcome Proportion Pie Chart: Soft red-orange & Charcoal/Light Pink
  const outcomePieData = [
    { name: 'Recovered', value: summary.recoveredCount, color: '#27805B' },
    { name: 'Deceased', value: summary.deceasedCount, color: '#C04444' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-lg border border-[#EAE3E5] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#202124] tracking-tight">Clinical Analytics & Outcome Reports</h1>
            <Badge variant="accent">Evidence-Based</Badge>
          </div>
          <p className="text-xs text-[#6B7280] mt-1">
            Period: <span className="font-semibold text-[#202124]">{summary.reportingPeriod}</span> • Sample: <span className="font-semibold text-[#202124]">{summary.sampleSize} Completed Outcomes</span>
          </p>
        </div>
        <Button onClick={handleExportCSV} size="sm" className="gap-1.5">
          <Download className="w-3.5 h-3.5" />
          Export Complete CSV Report
        </Button>
      </div>

      {/* Benchmark Warning Banner if recovery falls below 85% */}
      {showWarning && (
        <div className="p-4 bg-[#FDF8F0] border border-[#F3E5D0] rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-[#B7791F] shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-semibold text-[#B7791F]">Clinical Benchmark Warning</h4>
            <p className="text-xs text-[#202124] mt-0.5 leading-relaxed">
              The facility recovery rate is currently <span className="font-semibold">{summary.recoveryRate}%</span>, which is below the mandatory quality benchmark of <span className="font-semibold">85.0%</span> across {summary.sampleSize} completed outcomes.
            </p>
          </div>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Recovery Rate */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-[#6B7280] mb-2">
              <span className="text-xs font-medium">Recovery Rate</span>
              <TrendingUp className="w-4 h-4 text-[#27805B]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#202124]">{summary.recoveryRate}%</span>
              <span className="text-xs font-semibold text-[#27805B]">Target: ≥ 85%</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-[#6B7280]">
              <span>{summary.recoveredCount} Recoveries</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                isBenchmarkMet ? 'bg-[#F0F7F4] text-[#27805B] border-[#D1E7DD]' : 'bg-[#FDF8F0] text-[#B7791F] border-[#F3E5D0]'
              }`}>
                {isBenchmarkMet ? 'Benchmark Met' : 'Action Required'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Mortality Rate */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-[#6B7280] mb-2">
              <span className="text-xs font-medium">Mortality Rate</span>
              <AlertTriangle className="w-4 h-4 text-[#C04444]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#202124]">{summary.mortalityRate}%</span>
              <span className="text-xs text-[#6B7280]">Target: ≤ 15%</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-[#6B7280]">
              <span>{summary.deceasedCount} Deceased</span>
              <span className="px-2 py-0.5 rounded font-medium text-[10px] bg-[#FAF8F8] text-[#202124] border border-[#EAE3E5]">
                Formula: Deaths/(Rec+Death)
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
              <span className="text-3xl font-extrabold text-[#202124]">{summary.averageLOSDays}</span>
              <span className="text-xs text-[#6B7280]">Days / Episode</span>
            </div>
            <div className="mt-3 text-[11px] text-[#6B7280]">
              Admission to discharge or closure
            </div>
          </CardContent>
        </Card>

        {/* Total Outcomes Cohort */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-[#6B7280] mb-2">
              <span className="text-xs font-medium">Completed Outcomes</span>
              <Activity className="w-4 h-4 text-[#202124]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#202124]">{summary.totalOutcomes}</span>
              <span className="text-xs text-[#6B7280]">Cases Analyzed</span>
            </div>
            <div className="mt-3 text-[11px] text-[#6B7280]">
              Sample exceeds min statistical threshold (20)
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Patient Flow */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Patient Flow & Outcomes (Last 6 Months)</CardTitle>
            <span className="text-xs text-[#6B7280]">Admissions vs Recoveries vs Deaths</span>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAE3E5" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} axisLine={{ stroke: '#EAE3E5' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} axisLine={{ stroke: '#EAE3E5' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #EAE3E5', fontSize: '12px', boxShadow: 'none' }} />
                  <Bar dataKey="admissions" name="Admissions" fill="#E88770" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="recoveries" name="Recovered" fill="#F4C7D3" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="deaths" name="Mortality" fill="#202124" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Outcome Proportion Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Outcome Ratio Distribution</CardTitle>
            <span className="text-xs text-[#6B7280]">Recovered vs Deceased</span>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <div className="h-44 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={outcomePieData}
                    innerRadius={46}
                    outerRadius={68}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {outcomePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #EAE3E5', fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-6 text-xs mt-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#27805B]" />
                <span className="text-[#202124] font-medium">{summary.recoveryRate}% Recovered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C04444]" />
                <span className="text-[#202124] font-medium">{summary.mortalityRate}% Deceased</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bed Occupancy Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Facility Bed Occupancy Rate (%)</CardTitle>
          <span className="text-xs text-[#6B7280]">Utilization percentage against 74 maximum bed capacity</span>
        </CardHeader>
        <CardContent>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAE3E5" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} axisLine={{ stroke: '#EAE3E5' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} axisLine={{ stroke: '#EAE3E5' }} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #EAE3E5', fontSize: '12px', boxShadow: 'none' }} />
                <Line type="monotone" dataKey="occupancyRate" name="Occupancy %" stroke="#E88770" strokeWidth={2} dot={{ r: 3, fill: '#E88770' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
