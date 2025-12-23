'use server';

import { removeServerAuthCookie } from '@/lib/auth';
import PATHS from '@/paths';
import { redirect } from 'next/navigation';

export async function logout() {
  await removeServerAuthCookie();
  redirect(PATHS.auth.login);
}