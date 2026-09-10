import { FiUserCheck } from "react-icons/fi";
import { useAuth } from "../lib/AuthContext";

export default function ImpersonationBanner() {
  const { user, impersonating, stopImpersonating } = useAuth();
  if (!impersonating) return null;

  return (
    <div className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-gold px-4 py-2 text-[13px] font-bold text-ink">
      <FiUserCheck />
      Viewing as {user?.displayname || user?.username}
      <button
        onClick={() => stopImpersonating()}
        className="ml-2 rounded-full bg-ink px-3 py-1 text-[12px] font-bold text-white hover:bg-ink/80"
      >
        Return to admin
      </button>
    </div>
  );
}
