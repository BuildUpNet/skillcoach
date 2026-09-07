import { Link, useParams } from "react-router-dom";
import { FORUMS, initials, toneFor, replyCount } from "../../data/forumData";

const HOT_VIEWS = 10000;

export default function ForumTopics() {
  const { forumId } = useParams();
  const forum = FORUMS[forumId];

  if (!forum) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-8">
        <div className="rounded-2xl border border-line bg-white p-10 text-center text-ink/60 shadow-sm">
          This forum doesn't exist.{" "}
          <Link to="/forums" className="font-semibold text-forest hover:text-gold-deep">
            Back to Forums
          </Link>
        </div>
      </div>
    );
  }

  const sortedTopics = [...forum.topics].sort((a, b) => b.views - a.views);

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8">
      <div className="mb-4 text-sm">
        <Link to="/forums" className="font-semibold text-ink/50 hover:text-forest">
          Forums
        </Link>
        <span className="mx-2 text-ink/30">»</span>
        <span className="font-semibold text-forest">{forum.name}</span>
      </div>

      <div className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-forest to-forest-deep px-8 py-8 sm:px-10">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(rgba(244,246,245,0.14) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
        <div className="pointer-events-none absolute -top-24 -right-16 h-64 w-64 rounded-full bg-gold/25 blur-[80px]" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white sm:text-3xl">{forum.name}</h1>
            <p className="mt-1 text-[15px] text-white/70">{forum.subtitle}</p>
          </div>
          <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white/80">
            {forum.topics.length} topic{forum.topics.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
        {sortedTopics.map((topic) => {
          const replies = replyCount(topic);
          const isHot = topic.views >= HOT_VIEWS;
          return (
            <Link
              key={topic.id}
              to={`/forums/topic/${topic.id}/${topic.slug}`}
              className="flex flex-col gap-4 p-5 transition-colors hover:bg-forest-soft/40 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-forest-soft text-forest">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5">
                    <path d="M4 4h16v12H8l-4 4z" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-ink">{topic.title}</p>
                    {isHot && (
                      <span className="rounded-full bg-crimson/10 px-2 py-0.5 text-[11px] font-bold text-crimson">
                        Hot
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-ink/50">
                    {replies} repl{replies === 1 ? "y" : "ies"} · {topic.views.toLocaleString()} views
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 sm:ml-4">
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold ${toneFor(topic.lastPost.author)}`}>
                  {initials(topic.lastPost.author)}
                </span>
                <div className="text-sm">
                  <p className="text-ink/70">
                    Last post by <span className="font-semibold text-ink">{topic.lastPost.author}</span>
                  </p>
                  <p className="text-xs text-ink/45">{topic.lastPost.date}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}