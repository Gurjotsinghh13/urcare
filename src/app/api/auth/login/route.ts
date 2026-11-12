import { NextResponse } from 'next/server';
import { StoreAPI } from '@/lib/store';
import { setSessionUser } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const user = StoreAPI.getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials. User does not exist.' }, { status: 401 });
    }

    // In demo environment, verify standard demo password or account
    if (password !== 'URcareDemo!2026' && password !== 'admin' && password !== 'demo') {
      return NextResponse.json({ error: 'Invalid password. For demo accounts use: URcareDemo!2026' }, { status: 401 });
    }

    if (!user.is_active) {
      return NextResponse.json({ error: 'This user account has been deactivated.' }, { status: 403 });
    }

    await setSessionUser(user.id);
    StoreAPI.logAudit(user, 'USER_LOGIN', 'auth', user.id, { email: user.email, role: user.role });

    return NextResponse.json({ success: true, user });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Login failed' }, { status: 500 });
  }
}
