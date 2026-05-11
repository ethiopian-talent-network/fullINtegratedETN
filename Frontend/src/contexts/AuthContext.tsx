import {
  createContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from "react";

const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours in ms

export interface User {
  id: number;
  email: string;
  name: string;
  role: "talent" | "employer" | "admin" | "owner";
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => void;
  hasRole: (role: string) => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Re-export useAuth from its own file for backward compatibility
export { useAuth } from "./useAuth";

const clearSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("loginAt");
};

const isSessionExpired = (): boolean => {
  const loginAt = localStorage.getItem("loginAt");
  if (!loginAt) return false; // no loginAt = old session, let backend JWT decide
  return Date.now() - parseInt(loginAt) > SESSION_DURATION;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const expiryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const logout = () => {
    setToken(null);
    setUser(null);
    clearSession();
    if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current);
  };

  const scheduleAutoLogout = (loginAt: number) => {
    if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current);
    const remaining = SESSION_DURATION - (Date.now() - loginAt);
    if (remaining <= 0) {
      logout();
      return;
    }
    expiryTimerRef.current = setTimeout(() => {
      logout();
      window.location.href = "/login";
    }, remaining);
  };

  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (storedToken && storedUser) {
        // Migrate old sessions that have no loginAt — set it now so expiry works going forward
        if (!localStorage.getItem("loginAt")) {
          localStorage.setItem("loginAt", Date.now().toString());
        }
        if (isSessionExpired()) {
          clearSession();
          setIsLoading(false);
          return;
        }
        try {
          const parsed = JSON.parse(storedUser);
          if (!parsed?.id || !parsed?.role || !parsed?.email) {
            throw new Error("Invalid stored user");
          }
          const res = await fetch(
            `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/api/auth/me`,
            { headers: { Authorization: `Bearer ${storedToken}` } },
          );
          if (!res.ok) throw new Error("Token invalid");
          setToken(storedToken);
          setUser(parsed);
          const loginAt = parseInt(localStorage.getItem("loginAt") || "0");
          scheduleAutoLogout(loginAt);
        } catch {
          clearSession();
        }
      }
      setIsLoading(false);
    };

    restoreSession();
    return () => {
      if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current);
    };
  }, []);

  const login = async (newToken: string, newUser: User): Promise<void> => {
    const loginAt = Date.now();
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    localStorage.setItem("loginAt", loginAt.toString());
    scheduleAutoLogout(loginAt);
  };

  const hasRole = (role: string): boolean => user?.role === role;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
