// src/pages/Landing.jsx
// Public landing page — this is what "/" shows to a logged-out visitor.
// Uses the SAME green hero + pillar cards as MemberHome (via HomeSections),
// just in public mode.

import { Hero, PillarCards, ValueProposition, InteractiveSoftware } from "../components/HomeSections";

export default function Landing() {
  return (
    <div className="bg-[#f4f6f3] font-[Manrope,ui-sans-serif,system-ui] text-[#19352d]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        <Hero mode="public" />
        <PillarCards />
        <ValueProposition />
        <InteractiveSoftware />
      </div>
    </div>
  );
}
