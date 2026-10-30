import { createContext, useContext, useState, type ReactNode } from "react";

import { clearToken, getToken, setToken } from "../lib/token";

/**
 * Who is logged in, for the whole app.
 *
 * The token is the only thing the server cares about. `user` is kept beside it
 * purely so the interface can say "Welcome, John" without asking the server
 * again — the login response already told us, so we store what we were told
 * instead of decoding the token ourselves.
 */
export interface AuthUser {
  id: number;
  name: string;
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_KEY = "auth_user";

function readStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // The initialiser runs once, on the first render. Reading localStorage here
  // rather than in a useEffect is what stops the app flashing "logged out"
  // for one frame every time you refresh.
  const [token, setTokenState] = useState<string | null>(getToken);
  const [user, setUser] = useState<AuthUser | null>(readStoredUser);

  const login = (newToken: string, newUser: AuthUser) => {
    setToken(newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setTokenState(newToken);
    setUser(newUser);
  };

  const logout = () => {
    clearToken();
    localStorage.removeItem(USER_KEY);
    setTokenState(null);
    setUser(null);
  };

  // There is deliberately no expiry timer here. A token's expiry is checked by
  // the server, on every request, and that is the only check that counts. When
  // the server refuses, `graphqlRequest` clears the token and sends the user to
  // /login — see src/lib/graphql.ts.
  return (
    <AuthContext.Provider
      value={{ user, token, login, logout, isAuthenticated: !!user && !!token }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
