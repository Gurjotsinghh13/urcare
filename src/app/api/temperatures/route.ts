import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { StoreAPI } from '@/lib/store';

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get('patientId') || undefined;

  const records = StoreAPI.getTemperatures(patientId);
  return NextResponse.json({ temperatures: records });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Facility Manager cannot record temperatures
  if (user.role === 'manager') {
    return NextResponse.json({ error: 'Permission denied: Facility Managers have read-only access and cannot record clinical data.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { patient_id, temp_celsius, notes, reason_for_extra, is_routine } = body;

    if (!patient_id || temp_celsius === undefined) {
      return NextResponse.json({ error: 'Patient ID and temperature are required.' }, { status: 400 });
    }

    const record = StoreAPI.recordTemperature({
      patient_id,
      temp_celsius: parseFloat(temp_celsius),
      notes,
      reason_for_extra,
      is_routine: is_routine ?? true,
    }, user);

    return NextResponse.json({ success: true, record }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
