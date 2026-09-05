export default function GroupCard({ group, onLeave }) {
  return (
    <article className="flex flex-wrap gap-5 border-b border-gray-200 p-6 last:border-b-0 md:flex-nowrap">
      <img
        src={group.image}
        alt=""
        className="h-28 w-28 flex-none rounded-lg border border-gray-200 object-cover"
      />
      <div className="min-w-0 flex-1">
        <h3 className="mb-1 text-xl font-bold">{group.name}</h3>
        <p className="mb-2 text-[15px]">{group.description}</p>
        <p className="text-[13px] text-gray-500">
          {group.members} members led by <span className="font-medium text-ink">{group.leader}</span>
        </p>
      </div>
      <div className="w-full flex-none self-start md:w-auto">
        <button
          onClick={() => onLeave(group.id)}
          className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-500 transition-colors hover:border-[#f0c9c9] hover:bg-[#fdf2f2] hover:text-crimson"
        >
          ✕ Leave group
        </button>
      </div>
    </article>
  );
}
