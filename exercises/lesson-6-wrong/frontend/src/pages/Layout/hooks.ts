import { useAuth } from '@/contexts/AuthContext';

export function useCurrentUser() {
  const { user } = useAuth();

  // Convert the user from AuthContext (userId, email) to match the old User type if needed
  // For now, just return the user from auth context
  return user
    ? {
        id: user.userId,
        email: user.email,
        name: user.email.split('@')[0], // Extract name from email as fallback
      }
    : null;
}
