export default function GroupCard({ group, onLeave, onOpen }) {
  return (
    <article className="group relative overflow-hidden rounded-[22px] bg-white p-[1px] shadow-[0_2px_3px_rgba(28,21,23,.04),0_24px_50px_-32px_rgba(28,21,23,.35)] transition-transform duration-300 hover:-translate-y-1">
      {/* gold gradient border on hover */}
      <div className="pointer-events-none absolute inset-0 rounded-[22px] bg-[linear-gradient(135deg,#d9a441,transparent_40%,transparent_60%,#22433b)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative rounded-[21px] bg-white">
        <div className="relative m-2 h-44 overflow-hidden rounded-2xl">
          <img src={group.image} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/85 via-forest-deep/20 to-transparent" />
          <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-[13px] font-bold text-forest">
            {group.members} members
          </span>
          <h3 className="absolute bottom-4 left-5 right-5 font-display text-[26px] font-semibold leading-tight text-white">
            {group.name}
          </h3>
        </div>

        <div className="px-6 pb-6 pt-3">
          <p className="text-[16px] leading-6 text-ink/75">{group.description}</p>
          <p className="mt-2 text-[14.5px] text-ink/55">
            Led by <span className="font-semibold text-ink">{group.leader}</span>
          </p>
          <div className="mt-5 flex items-center gap-2 border-t border-line pt-4">
            <button onClick={() => onOpen?.(group.id)} className="flex-1 rounded-xl bg-forest px-4 py-2.5 text-[15px] font-bold text-white transition-colors hover:bg-forest-deep">
              Open group
            </button>
            <button onClick={() => onLeave(group.id)} className="rounded-xl border border-line px-4 py-2.5 text-[15px] font-semibold text-ink/60 transition-colors hover:border-gold hover:text-forest">
              Leave
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
