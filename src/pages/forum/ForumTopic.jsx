import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FORUMS, initials, toneFor } from "../../data/forumData";

export default function ForumTopic() {
  const { topicId } = useParams();
  const [watching, setWatching] = useState(false);

  const forum = Object.values(FORUMS).find((f) => f.topics.some((t) => t.id === topicId));
  const topic = forum?.topics.find((t) => t.id === topicId);

  if (!forum || !topic) {
    return (
      <div className="mx-auto max-w-[900px] px-4 py-8">
        <div className="rounded-2xl border border-line bg-white p-10 text-center text-ink/60 shadow-sm">
          This topic doesn't exist.{" "}
          <Link to="/forums" className="font-semibold text-forest hover:text-gold-deep">
            Back to Forums
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[900px] px-4 py-8">
      <div className="mb-4 text-sm">
        <Link to="/forums" className="font-semibold text-ink/50 hover:text-forest">
          Forums
        </Link>
        <span className="mx-2 text-ink/30">»</span>
        <Link to={`/forums/${forum.id}/${forum.slug}`} className="font-semibold text-ink/50 hover:text-forest">
          {forum.name}
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">{topic.title}</h1>
        <div className="flex items-center gap-2">
          <Link
            to={`/forums/${forum.id}/${forum.slug}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink/70 hover:border-forest hover:text-forest"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path d="M19 12H5M11 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to topics
          </Link>
          <button
            onClick={() => setWatching((w) => !w)}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              watching ? "bg-gold text-ink" : "border border-line bg-white text-ink/70 hover:border-gold"
            }`}
          >
            <svg viewBox="0 0 24 24" fill={watching ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
              <path d="M12 2a6 6 0 00-6 6v3.5c0 .7-.3 1.4-.8 1.9L4 15h16l-1.2-1.6c-.5-.5-.8-1.2-.8-1.9V8a6 6 0 00-6-6z" />
              <path d="M9.5 18a2.5 2.5 0 005 0" />
            </svg>
            {watching ? "Watching" : "Watch topic"}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {topic.posts.map((post, i) => (
          <div key={i} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-bold ${toneFor(post.author)}`}>
                {initials(post.author)}
              </span>
              {i < topic.posts.length - 1 && <span className="mt-2 w-px flex-1 bg-line" />}
            </div>

            <div className="flex-1 rounded-2xl border border-line bg-white p-5 shadow-sm">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-bold text-ink">{post.author}</p>
                  <p className="text-xs text-ink/45">
                    {post.date} · {post.postCount} posts
                  </p>
                </div>
                <button className="inline-flex items-center gap-1 text-xs font-semibold text-ink/40 hover:text-crimson">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
                    <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
                    <circle cx="12" cy="12" r="9" />
                  </svg>
                  Report
                </button>
              </div>
              <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink/75">{post.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}