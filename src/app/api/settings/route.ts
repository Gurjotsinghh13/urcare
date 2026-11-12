import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { StoreAPI } from '@/lib/store';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  return NextResponse.json({ settings: StoreAPI.getSettings() });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Only Doctor or Admin can change clinical threshold and settings
  if (user.role !== 'doctor' && user.role !== 'admin') {
    return NextResponse.json({ 
      error: 'Permission denied: Clinical settings can only be configured by the Lead Physician or Administrator.' 
    }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { fever_threshold, require_doctor_approval, capacity } = body;

    const updates: any = {};
    if (fever_threshold !== undefined) {
      const ft = parseFloat(fever_threshold);
      if (isNaN(ft) || ft < 36.5 || ft > 40.0) {
        return NextResponse.json({ 
          error: 'Fever threshold must be a clinically reasonable value between 36.5°C and 40.0°C.' 
        }, { status: 400 });
      }
      updates.fever_threshold = ft;
    }

    if (require_doctor_approval !== undefined) {
      updates.require_doctor_approval = Boolean(require_doctor_approval);
    }

    if (capacity !== undefined && user.role === 'admin') {
      const cap = parseInt(capacity, 10);
      if (cap > 0 && cap <= 100) updates.capacity = cap;
    }

    const updated = StoreAPI.updateSettings(updates, user);
    return NextResponse.json({ success: true, settings: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
