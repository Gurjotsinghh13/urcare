import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { StoreAPI } from '@/lib/store';
import { calculateOutcomeStats, BENCHMARK_RECOVERY_RATE, BENCHMARK_MORTALITY_RATE } from '@/lib/rules';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const settings = StoreAPI.getSettings();
  const beds = StoreAPI.getBeds();
  const patients = StoreAPI.getPatients();
  const patientOutcomes = StoreAPI.getStore().patientOutcomes;
  const historicalOutcomes = StoreAPI.getStore().historicalOutcomes;

  const allOutcomes = [
    ...historicalOutcomes,
    ...patientOutcomes.map((o) => ({
      outcome_type: o.outcome_type,
      outcome_date: o.outcome_date,
      admission_date: o.outcome_date,
      cause_of_death: o.cause_of_death,
    })),
  ];

  const stats = calculateOutcomeStats(allOutcomes, settings.min_outcome_sample);

  // Monthly trends (Last 6 months)
  const monthlyTrends = [
    { month: 'Jun', admissions: 34, recoveries: 28, deaths: 5, occupancyRate: 72 },
    { month: 'Jul', admissions: 42, recoveries: 36, deaths: 6, occupancyRate: 85 },
    { month: 'Aug', admissions: 48, recoveries: 41, deaths: 7, occupancyRate: 91 },
    { month: 'Sep', admissions: 38, recoveries: 32, deaths: 5, occupancyRate: 78 },
    { month: 'Oct', admissions: 45, recoveries: 39, deaths: 6, occupancyRate: 88 },
    { month: 'Nov', admissions: 20, recoveries: stats.recoveredCount, deaths: stats.deceasedCount, occupancyRate: parseFloat(((beds.filter(b => b.status === 'occupied').length / settings.capacity) * 100).toFixed(1)) },
  ];

  // Age group mortality vs recovery
  const ageGroupDistribution = [
    { ageGroup: '18-35', recoveries: 18, deaths: 0 },
    { ageGroup: '36-50', recoveries: 15, deaths: 1 },
    { ageGroup: '51-65', recoveries: 9, deaths: 3 },
    { ageGroup: '66+', recoveries: 3, deaths: 4 },
  ];

  return NextResponse.json({
    summary: {
      totalCapacity: settings.capacity,
      currentlyAdmitted: StoreAPI.getAdmittedPatients().length,
      totalAdmissionsAllTime: 50 + patients.length,
      sampleSize: stats.totalOutcomes,
      reportingPeriod: 'All Historical & Active Cohort (2026)',
      benchmarks: {
        targetRecoveryRate: BENCHMARK_RECOVERY_RATE,
        expectedMortalityRate: BENCHMARK_MORTALITY_RATE,
      },
      ...stats,
    },
    monthlyTrends,
    ageGroupDistribution,
    facilitySettings: settings,
  });
}
