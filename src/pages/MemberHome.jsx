// src/pages/MemberHome.jsx
// Redesigned Member Home (legacy: /members/home).
// Hero/PillarCards/ValueProposition/InteractiveSoftware now live in
// ../components/HomeSections.jsx so the public Landing page can reuse the
// exact same green hero and cards.

import { useAuth } from "../lib/AuthContext";
import { Hero, PillarCards, ValueProposition, InteractiveSoftware } from "../components/HomeSections";

export default function MemberHome({ user: propUser }) {
  const { user: authUser } = useAuth();
  const user = propUser || authUser;

  return (
    <div className="bg-[#f4f6f3] font-[Manrope,ui-sans-serif,system-ui] text-[#19352d]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        <Hero
          mode="member"
          userName={user?.displayname || user?.username || user?.name || "Thomas Kee"}
        />
        <PillarCards />
        <ValueProposition />
        <InteractiveSoftware />
      </div>
    </div>
  );
}
