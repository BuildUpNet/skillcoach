import { useState } from "react";
import { Link } from "react-router-dom";

export function MemberAvatar({ member, size = "h-9 w-9", className = "" }) {
  return member.avatar ? (
    <img src={member.avatar} alt={member.name} className={`${size} rounded-full object-cover ring-2 ring-white ${className}`} />
  ) : (
    <span className={`${size} grid place-items-center rounded-full bg-forest-soft text-[13px] font-extrabold text-forest ring-2 ring-white ${className}`}>
      {member.name.trim()[0].toUpperCase()}
    </span>
  );
}

/**
 * Wrap any trigger (group name, link) — shows a hover card with the group
 * summary, member avatars (each linking to /profile/:username) and Leave.
 */
export default function GroupHoverCard({ group, onLeave, children }) {
  const [open, setOpen] = useState(false);
  const members = group.memberList || [];

  return (
    <span className="relative inline-block" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      {children}

      {open && (
        <div className="absolute left-0 top-full z-30 w-[340px] pt-3">
          {/* arrow */}
          <span className="absolute left-6 top-[7px] h-3 w-3 rotate-45 border-l border-t border-line bg-white" />
          <div className="overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_-24px_rgba(20,26,24,.45)] ring-1 ring-line">
            <div className="flex gap-4 p-4">
              <img src={group.image} alt="" className="h-20 w-20 flex-none rounded-xl object-cover ring-1 ring-line" />
              <div className="min-w-0 flex-1">
                <Link to={`/groups/${group.id}`} className="block truncate text-[18px] font-extrabold tracking-tight text-ink hover:text-forest">{group.name}</Link>
                <p className="mt-0.5 text-[14px] text-ink/55">{group.members} members · led by <span className="font-semibold text-ink/80">{group.leader}</span></p>

                <div className="mt-3 flex items-center">
                  {members.slice(0, 6).map((m, i) => (
                    <Link key={m.username} to={`/profile/${m.username}`} title={m.name}
                      className={`${i ? "-ml-2" : ""} transition-transform hover:z-10 hover:-translate-y-0.5`}>
                      <MemberAvatar member={m} />
                    </Link>
                  ))}
                  {group.members > members.length && (
                    <span className="-ml-2 grid h-9 w-9 place-items-center rounded-full bg-mist text-[12px] font-bold text-ink/60 ring-2 ring-white">
                      +{group.members - members.length}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-line bg-mist px-4 py-2.5">
              <Link to={`/groups/${group.id}`} className="text-[14px] font-bold text-forest hover:underline">Open group</Link>
              <button onClick={() => onLeave?.(group.id)} className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-ink/55 hover:text-crimson">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 6l12 12M18 6L6 18" /></svg>
                Leave group
              </button>
            </div>
          </div>
        </div>
      )}
    </span>
  );
}
