import { useOutletContext } from "react-router-dom";
import { Card } from "../../components/group/GroupUI";

export default function GroupLessons() {
  const { workspace } = useOutletContext();
  const { lessons } = workspace;

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {lessons.map((l) => (
        <Card key={l.id}>
          <div className="mb-3 flex items-center justify-between">
            <span className="rounded-full bg-gold-soft px-3 py-1 text-[12.5px] font-bold text-gold-deep">{l.duration}</span>
            <span className="text-[13px] font-semibold text-ink/50">{l.progress}% complete</span>
          </div>
          <h3 className="text-[19px] font-extrabold leading-tight tracking-tight text-ink">{l.title}</h3>
          <p className="mt-2 text-[14.5px] leading-6 text-ink/65">{l.description}</p>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-mist">
            <div className="h-full rounded-full bg-gradient-to-r from-forest to-forest-deep" style={{ width: `${l.progress}%` }} />
          </div>
          <button className="mt-5 w-full rounded-xl bg-forest px-4 py-2.5 text-[15px] font-bold text-white transition-colors hover:bg-forest-deep">
            {l.progress > 0 ? "Continue lesson" : "Start lesson"}
          </button>
        </Card>
      ))}
    </div>
  );
}
