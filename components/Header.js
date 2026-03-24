import { getCurrentUser } from '@/lib/auth';
import { HeaderClient } from './HeaderClient';

export async function Header() {
  const { user, profile } = await getCurrentUser();
  return (
    <HeaderClient
      user={user ? { email: user.email } : null}
      isPremium={profile?.is_premium || false}
      isAdmin={profile?.is_admin || false}
    />
  );
}
