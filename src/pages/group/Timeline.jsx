import { useOutletContext } from "react-router-dom";
import { Card } from "../../components/group/GroupUI";

export default function GroupTimeline() {
  const { workspace } = useOutletContext();
  const { timeline } = workspace;

  return (
    <Card title="Timeline">
      <ol className="relative space-y-6 border-l-2 border-line pl-6">
        {timeline.map((t) => (
          <li key={t.id} className="relative">
            <span className="absolute -left-[29px] top-1 grid h-3.5 w-3.5 place-items-center rounded-full bg-forest ring-4 ring-forest-soft" />
            <p className="text-[15px] text-ink">{t.text}</p>
            <p className="mt-0.5 text-[13px] italic text-ink/50">{t.date}</p>
          </li>
        ))}
      </ol>
    </Card>
  );
}
