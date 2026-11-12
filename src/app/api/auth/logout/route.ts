import { NextResponse } from 'next/server';
import { clearSessionUser } from '@/lib/session';

export async function POST() {
  await clearSessionUser();
  return NextResponse.json({ success: true });
}
