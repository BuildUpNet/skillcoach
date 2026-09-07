import { useState } from "react";
import { Link, Outlet, useParams } from "react-router-dom";
import { getGroupWorkspace } from "../data/groupWorkspace";
import GroupSidebar from "../components/group/GroupSidebar";
import Icon from "../components/group/icons";

export default function GroupLayout() {
  const { groupId } = useParams();
  const [spinning, setSpinning] = useState(false);
  const workspace = getGroupWorkspace(groupId);

  if (!workspace) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-20 text-center">
        <p className="text-[20px] font-bold text-ink">Group not found</p>
        <Link to="/projects" className="mt-3 inline-block font-semibold text-forest underline-offset-4 hover:underline">
          Back to Projects
        </Link>
      </div>
    );
  }

  const { info } = workspace;

  const handleRefresh = () => {
    setSpinning(true);
    setTimeout(() => setSpinning(false), 700);
  };

  return (
    <div className="mx-auto max-w-[1320px] px-4 pb-16 pt-6 lg:flex lg:items-start lg:gap-6">
      <aside className="mb-6 lg:sticky lg:top-24 lg:mb-0 lg:w-72 lg:flex-none">
        <div className="overflow-hidden rounded-3xl bg-forest-deep shadow-[0_2px_4px_rgba(20,26,24,.04),0_30px_60px_-36px_rgba(20,26,24,.5)]">
          <div className="relative overflow-hidden px-5 pb-5 pt-6">
            <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-gold/20 blur-3xl" />
            <Link to="/projects" className="relative inline-flex items-center gap-1.5 text-[14px] font-semibold text-white/65 hover:text-white">
              <Icon name="back" className="h-4 w-4" /> Projects
            </Link>
            <div className="relative mt-4 flex items-center gap-3">
              <div className="grid h-12 w-12 flex-none place-items-center rounded-2xl bg-gold text-[17px] font-extrabold text-ink">
                {info.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-[18px] font-extrabold leading-tight text-white">{info.name}</h1>
                <p className="truncate text-[14px] text-white/65">{info.subtitle}</p>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 px-3 py-5">
            <GroupSidebar groupId={groupId} info={info} />
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white px-5 py-4 shadow-[0_2px_4px_rgba(20,26,24,.04),0_16px_36px_-24px_rgba(20,26,24,.25)] ring-1 ring-line">
          <div className="min-w-0">
            <p className="truncate text-[14.5px] font-semibold text-ink/70">
              Led by <span className="font-bold text-ink">{info.leader}</span> · {info.memberCount} members
            </p>
            <p className="mt-0.5 max-w-[60ch] truncate text-[14px] text-ink/60">{info.description}</p>
          </div>
          <button
            onClick={handleRefresh}
            aria-label="Refresh"
            className="grid h-10 w-10 flex-none place-items-center rounded-full border border-line text-ink/60 transition-colors hover:border-forest hover:text-forest"
          >
            <Icon name="refresh" className={`h-4 w-4 ${spinning ? "animate-spin" : ""}`} />
          </button>
        </div>

        <Outlet context={{ workspace }} />
      </main>
    </div>
  );
}
