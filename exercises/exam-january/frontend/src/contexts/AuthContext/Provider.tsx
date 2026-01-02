import { useEffect, useState, type ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import type { User } from './types';
import AuthContext from './Context';

const TOKEN_KEY = 'auth_token';

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_KEY);
  });

  const [user, setUser] = useState<User | null>(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (storedToken) {
      try {
        return jwtDecode<User>(storedToken);
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        return null;
      }
    }
    return null;
  });

  const login = (newToken: string) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    const decoded = jwtDecode<User>(newToken);
    setUser(decoded);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  // Check if token is expired on mount and periodically
  useEffect(() => {
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        const currentTime = Date.now() / 1000;

        if (decoded.exp < currentTime) {
          // Token expired
          logout();
        }
      } catch {
        logout();
      }
    }
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!user && !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
