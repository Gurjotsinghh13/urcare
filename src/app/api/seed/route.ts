import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { resetStore } from '@/lib/store';

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ 
      error: 'Unauthorized: Demo data reset is restricted to Administrator role.' 
    }, { status: 403 });
  }

  try {
    resetStore();
    return NextResponse.json({ 
      success: true, 
      message: 'Demo dataset successfully restored to original assessment state.' 
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
