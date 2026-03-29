import { getCurrentUser } from '@/lib/auth';
import { HeaderClient } from './HeaderClient';

export async function Header() {
  const { user, profile } = await getCurrentUser();

  // Единая проверка премиума — NULL = бессрочный, иначе проверяем дату
  const isPremium = profile?.is_premium === true && (
    !profile?.premium_until || new Date(profile.premium_until) > new Date()
  );

  return (
    <HeaderClient
      user={user ? { email: user.email } : null}
      isPremium={isPremium}
      isAdmin={profile?.is_admin || false}
    />
  );
}
