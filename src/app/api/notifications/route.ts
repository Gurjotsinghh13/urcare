import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { StoreAPI } from '@/lib/store';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const notifications = StoreAPI.getNotifications(user.role, user.id);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await request.json();
    if (id === 'all') {
      const all = StoreAPI.getNotifications(user.role, user.id);
      all.forEach((n) => { n.is_read = true; });
    } else {
      StoreAPI.markNotificationRead(id);
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
