import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { StoreAPI } from '@/lib/store';
import { 
  dateKey, 
  addDays, 
  calculateFeverFreeStreak, 
  calculateOutcomeStats, 
  TOTAL_BEDS 
} from '@/lib/rules';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const today = dateKey();
  const settings = StoreAPI.getSettings();
  const beds = StoreAPI.getBeds();
  const patients = StoreAPI.getPatients();
  const admittedPatients = StoreAPI.getAdmittedPatients();
  const temperatures = StoreAPI.getTemperatures();
  const doctorVisits = StoreAPI.getDoctorVisits();
  const dischargeRequests = StoreAPI.getDischargeRequests();
  const patientOutcomes = StoreAPI.getStore().patientOutcomes;
  const historicalOutcomes = StoreAPI.getStore().historicalOutcomes;

  // Occupancy
  const occupiedBeds = beds.filter((b) => b.status === 'occupied').length;
  const availableBeds = beds.filter((b) => b.status === 'available').length;
  const maintenanceBeds = beds.filter((b) => b.status === 'maintenance').length;
  const occupancyRate = parseFloat(((occupiedBeds / settings.capacity) * 100).toFixed(1));

  // Today's Readings & Visits
  const todayTemperatures = temperatures.filter((t) => t.measurement_date === today);
  const todayVisits = doctorVisits.filter((v) => v.visit_date === today);

  // Per-patient today status
  const patientStatusMap = admittedPatients.map((p) => {
    const todayTemp = todayTemperatures.find((t) => t.patient_id === p.id && t.is_routine);
    const todayVisit = todayVisits.find((v) => v.patient_id === p.id);
    const pTemps = temperatures.filter((t) => t.patient_id === p.id);
    const streak = calculateFeverFreeStreak(pTemps, today, settings.fever_threshold);
    const isFebrileToday = todayTemp ? todayTemp.is_fever : false;

    return {
      patientId: p.id,
      patientCode: p.patient_code,
      fullName: p.full_name,
      bedNumber: p.bed_number,
      hasTempToday: Boolean(todayTemp),
      tempValue: todayTemp?.temp_celsius,
      isFebrileToday,
      hasVisitToday: Boolean(todayVisit),
      streak,
      status: p.status,
    };
  });

  const tempCompleted = patientStatusMap.filter((p) => p.hasTempToday).length;
  const tempPending = patientStatusMap.filter((p) => !p.hasTempToday).length;
  const visitsCompleted = patientStatusMap.filter((p) => p.hasVisitToday).length;
  const visitsPending = patientStatusMap.filter((p) => !p.hasVisitToday).length;

  const highTempPatients = patientStatusMap.filter((p) => p.isFebrileToday);
  const dischargeReadyPatients = patientStatusMap.filter((p) => p.status === 'discharge_eligible' || p.streak >= settings.days_required_fever_free);
  const doctorApprovedDischarges = dischargeRequests.filter((r) => r.doctor_status === 'approved');

  // Outcome statistics
  const allOutcomes = [
    ...historicalOutcomes,
    ...patientOutcomes.map((o) => ({
      outcome_type: o.outcome_type,
      outcome_date: o.outcome_date,
      admission_date: o.outcome_date, // approximate if not linked
    })),
  ];
  const outcomeStats = calculateOutcomeStats(allOutcomes, settings.min_outcome_sample);

  // 7-day trend calculation
  const sevenDayTrend = [];
  for (let i = 6; i >= 0; i--) {
    const d = addDays(today, -i);
    const tempsOnDay = temperatures.filter((t) => t.measurement_date === d);
    const visitsOnDay = doctorVisits.filter((v) => v.visit_date === d);
    sevenDayTrend.push({
      date: d,
      temperatures: tempsOnDay.length,
      visits: visitsOnDay.length,
      admissions: patients.filter((p) => p.admission_date === d).length,
    });
  }

  // Pending Operational Tasks
  const pendingTasks = [];
  if (tempPending > 0) {
    pendingTasks.push({
      id: 'task-temp',
      title: `${tempPending} Routine Temperature Measurements Pending`,
      role: 'nurse',
      priority: 'high',
      link: '/temperatures',
    });
  }
  if (highTempPatients.length > 0) {
    pendingTasks.push({
      id: 'task-fever',
      title: `${highTempPatients.length} Patient(s) with High Fever (> ${settings.fever_threshold}°C)`,
      role: 'doctor',
      priority: 'critical',
      link: '/rounds',
    });
  }
  if (visitsPending > 0) {
    pendingTasks.push({
      id: 'task-visit',
      title: `${visitsPending} Doctor Rounds Pending Today`,
      role: 'doctor',
      priority: 'medium',
      link: '/rounds',
    });
  }
  if (doctorApprovedDischarges.length > 0) {
    pendingTasks.push({
      id: 'task-disch-adm',
      title: `${doctorApprovedDischarges.length} Approved Discharge(s) Awaiting Admin Finalization`,
      role: 'admin',
      priority: 'high',
      link: '/discharges',
    });
  }

  return NextResponse.json({
    user,
    today,
    facility: {
      name: settings.facility_name,
      capacity: settings.capacity,
      feverThreshold: settings.fever_threshold,
      requireApproval: settings.require_doctor_approval,
      timezone: settings.timezone,
    },
    occupancy: {
      totalCapacity: settings.capacity,
      occupied: occupiedBeds,
      available: availableBeds,
      maintenance: maintenanceBeds,
      occupancyRate,
      isNearCapacity: occupiedBeds >= settings.capacity - 5,
    },
    vitals: {
      completed: tempCompleted,
      pending: tempPending,
      completionRate: admittedPatients.length > 0 ? parseFloat(((tempCompleted / admittedPatients.length) * 100).toFixed(1)) : 100,
      highTempCount: highTempPatients.length,
    },
    rounds: {
      completed: visitsCompleted,
      pending: visitsPending,
      completionRate: admittedPatients.length > 0 ? parseFloat(((visitsCompleted / admittedPatients.length) * 100).toFixed(1)) : 100,
    },
    discharges: {
      eligibleCount: dischargeReadyPatients.length,
      approvedPendingAdmin: doctorApprovedDischarges.length,
      totalDischargedRecovered: outcomeStats.recoveredCount,
      totalDeceased: outcomeStats.deceasedCount,
    },
    outcomes: outcomeStats,
    sevenDayTrend,
    pendingTasks,
    admittedPatientsCount: admittedPatients.length,
  });
}
