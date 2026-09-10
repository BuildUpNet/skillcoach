import { createContext, useContext, useEffect, useState } from "react";
import { getMe, logout as apiLogout, stopImpersonating as apiStopImpersonating } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [impersonating, setImpersonating] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = () =>
    getMe()
      .then(({ user, impersonating }) => {
        setUser(user);
        setImpersonating(!!impersonating);
      })
      .catch(() => {
        setUser(null);
        setImpersonating(false);
      });

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  const signIn = (user) => setUser(user);

  const signOut = async () => {
    await apiLogout().catch(() => {});
    setUser(null);
    setImpersonating(false);
  };

  const stopImpersonating = async () => {
    const { user } = await apiStopImpersonating();
    setUser(user);
    setImpersonating(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, impersonating, signIn, signOut, stopImpersonating, refreshUser: refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
