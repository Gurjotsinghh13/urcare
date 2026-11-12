import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { StoreAPI } from '@/lib/store';
import { dateKey, calculateFeverFreeStreak } from '@/lib/rules';

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get('status');
  const searchQuery = searchParams.get('q')?.toLowerCase() || '';

  const today = dateKey();
  const settings = StoreAPI.getSettings();
  const patients = StoreAPI.getPatients();
  const temperatures = StoreAPI.getTemperatures();
  const visits = StoreAPI.getDoctorVisits();

  let filtered = patients;

  if (statusFilter && statusFilter !== 'all') {
    if (statusFilter === 'active') {
      filtered = filtered.filter((p) => p.status === 'admitted' || p.status === 'discharge_eligible' || p.status === 'discharge_approved');
    } else {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }
  }

  if (searchQuery) {
    filtered = filtered.filter((p) => 
      p.full_name.toLowerCase().includes(searchQuery) ||
      p.patient_code.toLowerCase().includes(searchQuery) ||
      String(p.bed_number).includes(searchQuery)
    );
  }

  const enriched = filtered.map((p) => {
    const pTemps = temperatures.filter((t) => t.patient_id === p.id);
    const todayTemp = pTemps.find((t) => t.measurement_date === today && t.is_routine);
    const todayVisit = visits.find((v) => v.patient_id === p.id && v.visit_date === today);
    const streak = calculateFeverFreeStreak(pTemps, today, settings.fever_threshold);

    return {
      ...p,
      todayTemp: todayTemp ? todayTemp.temp_celsius : null,
      todayVisitCompleted: Boolean(todayVisit),
      feverFreeStreak: streak,
      isFeverToday: todayTemp ? todayTemp.is_fever : false,
      readingsCount: pTemps.length,
    };
  });

  return NextResponse.json({ patients: enriched, total: enriched.length });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Only Administrator can admit/register patients
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Permission denied: Only Administrators can register and admit patients.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { full_name, age, gender, bed_number, medical_history, emergency_contact, admission_notes } = body;

    if (!full_name || !age || !gender || !bed_number) {
      return NextResponse.json({ error: 'Missing required patient demographic fields.' }, { status: 400 });
    }

    const newPatient = StoreAPI.admitPatient({
      full_name,
      age: Number(age),
      gender,
      bed_number: Number(bed_number),
      medical_history,
      emergency_contact,
      admission_notes,
    }, user);

    return NextResponse.json({ success: true, patient: newPatient }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
