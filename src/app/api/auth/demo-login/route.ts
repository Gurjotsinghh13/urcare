import { NextResponse } from 'next/server';
import { StoreAPI } from '@/lib/store';
import { setSessionUser } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const { role } = await request.json();
    const users = StoreAPI.getUsers();
    const targetUser = users.find((u) => u.role === role);

    if (!targetUser) {
      return NextResponse.json({ error: `Demo account for role ${role} not found.` }, { status: 404 });
    }

    await setSessionUser(targetUser.id);
    StoreAPI.logAudit(targetUser, 'DEMO_LOGIN', 'auth', targetUser.id, { role: targetUser.role });

    return NextResponse.json({ success: true, user: targetUser });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
