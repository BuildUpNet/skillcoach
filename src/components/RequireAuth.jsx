import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";

export default function RequireAuth() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <p className="text-[15px] text-ink/60">Loading…</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;

  return <Outlet />;
}
