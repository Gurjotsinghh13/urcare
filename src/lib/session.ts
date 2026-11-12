import { cookies } from 'next/headers';
import { StoreAPI } from './store';
import { UserProfile } from './types';

const SESSION_COOKIE_NAME = 'urcare_session_user';

export async function getCurrentUser(): Promise<UserProfile | null> {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  const userId = sessionCookie.value;
  const user = StoreAPI.getUserById(userId);
  return user || null;
}

export async function setSessionUser(userId: string) {
  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE_NAME, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

export async function clearSessionUser() {
  const cookieStore = cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
