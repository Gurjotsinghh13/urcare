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
    { month: 'Jun', admissions: 31, recoveries: 27, deaths: 4, occupancyRate: 68 },
    { month: 'Jul', admissions: 39, recoveries: 34, deaths: 5, occupancyRate: 77 },
    { month: 'Aug', admissions: 53, recoveries: 46, deaths: 6, occupancyRate: 92 },
    { month: 'Sep', admissions: 44, recoveries: 38, deaths: 5, occupancyRate: 83 },
    { month: 'Oct', admissions: 49, recoveries: 43, deaths: 6, occupancyRate: 87 },
    { month: 'Nov', admissions: 24, recoveries: stats.recoveredCount, deaths: stats.deceasedCount, occupancyRate: parseFloat(((beds.filter(b => b.status === 'occupied').length / settings.capacity) * 100).toFixed(1)) },
  ];

  // Age group mortality vs recovery
  const ageGroupDistribution = [
    { ageGroup: '18-35', recoveries: 22, deaths: 1 },
    { ageGroup: '36-50', recoveries: 17, deaths: 2 },
    { ageGroup: '51-65', recoveries: 11, deaths: 2 },
    { ageGroup: '66+', recoveries: 5, deaths: 4 },
  ];

  return NextResponse.json({
    summary: {
      totalCapacity: settings.capacity,
      currentlyAdmitted: StoreAPI.getAdmittedPatients().length,
      totalAdmissionsAllTime: 54 + patients.length,
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
