import GroupHoverCard from "./GroupHoverCard";

export default function GroupCard({ group, onLeave, onOpen }) {
  return (
    <article className="group relative flex flex-col rounded-3xl bg-white shadow-[0_2px_4px_rgba(20,26,24,.04),0_20px_40px_-28px_rgba(20,26,24,.3)] ring-1 ring-line transition-transform duration-300 hover:-translate-y-1">
      <div className="relative h-44 overflow-hidden rounded-t-3xl">
        <img src={group.image} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/80 via-forest-deep/20 to-transparent" />
        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[13px] font-bold text-forest backdrop-blur">
          {group.members} members
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <GroupHoverCard group={group} onLeave={onLeave}>
          <button onClick={() => onOpen?.(group.id)} className="text-left text-[24px] font-extrabold leading-tight tracking-tight text-ink hover:text-forest">
            {group.name}
          </button>
        </GroupHoverCard>

        <p className="mt-2 text-[16px] leading-6 text-ink/75">{group.description}</p>
        <p className="mt-2 text-[14.5px] text-ink/55">
          Led by <span className="font-semibold text-ink">{group.leader}</span>
        </p>

        <div className="mt-5 flex items-center gap-2 border-t border-line pt-4">
          <button onClick={() => onOpen?.(group.id)} className="flex-1 rounded-xl bg-forest px-4 py-2.5 text-[15px] font-bold text-white transition-colors hover:bg-forest-deep">
            Open group
          </button>
          <button onClick={() => onLeave(group.id)} className="rounded-xl border border-line px-4 py-2.5 text-[15px] font-semibold text-ink/60 transition-colors hover:border-crimson/40 hover:bg-crimson/5 hover:text-crimson">
            Leave
          </button>
        </div>
      </div>
    </article>
  );
}
