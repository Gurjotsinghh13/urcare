import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { StoreAPI } from '@/lib/store';
import { UserProfile, UserRole } from '@/lib/types';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const staff = StoreAPI.getUsers();
  return NextResponse.json({ staff });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Only Administrator can manage staff
  if (user.role !== 'admin') {
    return NextResponse.json({ 
      error: 'Permission denied: Only Administrators can create and manage staff accounts.' 
    }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'create') {
      const { email, full_name, role, phone } = body;
      if (!email || !full_name || !role) {
        return NextResponse.json({ error: 'Email, full name, and role are required.' }, { status: 400 });
      }

      const existing = StoreAPI.getUserByEmail(email);
      if (existing) {
        return NextResponse.json({ error: 'A staff member with this email already exists.' }, { status: 400 });
      }

      const newStaff: UserProfile = {
        id: `user-${Date.now()}`,
        email,
        full_name,
        role: role as UserRole,
        phone,
        is_active: true,
        created_at: new Date().toISOString(),
      };

      StoreAPI.getStore().users.push(newStaff);
      StoreAPI.logAudit(user, 'CREATE_STAFF', 'user', newStaff.id, { email, role });

      return NextResponse.json({ success: true, staff: newStaff }, { status: 201 });
    }

    if (action === 'toggle_status') {
      const { user_id } = body;
      const target = StoreAPI.getUserById(user_id);
      if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });
      if (target.id === user.id) {
        return NextResponse.json({ error: 'Administrators cannot deactivate their own account.' }, { status: 400 });
      }

      target.is_active = !target.is_active;
      StoreAPI.logAudit(user, 'TOGGLE_STAFF_STATUS', 'user', target.id, { isActive: target.is_active });

      return NextResponse.json({ success: true, staff: target });
    }

    return NextResponse.json({ error: 'Invalid staff action.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
