import type { User } from '@/lib/api';
import { useOutletContext } from 'react-router';

export function useCurrentUser() {
  const { currentUser } = useOutletContext<{ currentUser: User | null }>();
  return currentUser;
}
