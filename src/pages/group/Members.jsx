import { Link, useOutletContext } from "react-router-dom";
import { Avatar, Card, RoleBadge } from "../../components/group/GroupUI";

export default function GroupMembers() {
  const { workspace } = useOutletContext();
  const { members } = workspace;

  return (
    <Card
      title={`Members (${members.length})`}
      action={<Link to="../invite" relative="path" className="rounded-xl bg-forest px-4 py-2 text-[14px] font-bold text-white hover:bg-forest-deep">Invite members</Link>}
    >
      <ul className="grid gap-3 sm:grid-cols-2">
        {members.map((m) => (
          <li key={m.id} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-mist/50 px-4 py-3.5">
            <div className="flex items-center gap-3">
              <Avatar name={m.name} />
              <div>
                <p className="text-[15px] font-semibold text-ink">{m.name}</p>
                <p className="text-[13px] text-ink/50">Joined {m.joined}</p>
              </div>
            </div>
            <RoleBadge role={m.role} />
          </li>
        ))}
      </ul>
    </Card>
  );
}
