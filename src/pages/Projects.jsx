import { useState } from "react";
import Navbar from "../components/Navbar";
import Announcement from "../components/Announcement";
import GroupCard from "../components/GroupCard";
import Footer from "../components/Footer";

const TABS = ["Browse groups", "My groups", "Create new group"];

const initialGroups = [
  {
    id: 1,
    name: "STD work",
    description: "Work on Stock Traders Daily",
    members: 10,
    leader: "Thomas Kee",
    image: "/groups/std.png",
  },
];

export default function Projects() {
  const [tab, setTab] = useState("My groups");
  const [groups, setGroups] = useState(initialGroups);

  const leaveGroup = (id) => setGroups((g) => g.filter((x) => x.id !== id));

  return (
    <>
      <Navbar updates={102} />
      <Announcement>
        New: Personal project management{" "}
        <span className="ml-1 font-normal text-ink">(organize your life)</span>
      </Announcement>

      <main className="pb-18 pt-10">
        <div className="mx-auto w-[min(1180px,100%-40px)]">
          <h1 className="mb-1 text-[28px] font-bold">Projects</h1>
          <p className="mb-7 text-[15px] text-gray-500">Groups you belong to and groups you can join.</p>

          <section className="overflow-hidden rounded-[10px] border border-gray-200 bg-white">
            <div className="flex gap-1 border-b border-gray-200 px-5" role="tablist">
              {TABS.map((t) => (
                <button
                  key={t}
                  role="tab"
                  aria-selected={tab === t}
                  onClick={() => setTab(t)}
                  className={`-mb-px border-b-2 px-3.5 py-4 text-[15px] transition-colors ${
                    tab === t
                      ? "border-crimson font-semibold text-crimson"
                      : "border-transparent font-medium text-gray-500 hover:text-ink"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 bg-page px-6 py-4 text-[15px]">
              <span>SkillCoaches can create groups.</span>
              <button className="rounded-lg bg-orange px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-dark">
                Become a SkillCoach
              </button>
            </div>

            {groups.length ? (
              groups.map((g) => <GroupCard key={g.id} group={g} onLeave={leaveGroup} />)
            ) : (
              <div className="px-6 py-14 text-center text-gray-500">
                You're not in any group yet. Browse groups to join one.
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}
