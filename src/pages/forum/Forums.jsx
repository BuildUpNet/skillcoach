import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FORUMS, initials, toneFor, replyCount } from "../../data/forumData";

export default function Forums() {
  const [query, setQuery] = useState("");

  const forums = useMemo(() => Object.values(FORUMS), []);

  const categories = useMemo(() => {
    const byCategory = {};
    forums.forEach((f) => {
      if (!byCategory[f.category]) byCategory[f.category] = [];
      byCategory[f.category].push(f);
    });
    return Object.entries(byCategory);
  }, [forums]);

  const totalTopics = forums.reduce((sum, f) => sum + f.topics.length, 0);
  const totalPosts = forums.reduce(
    (sum, f) => sum + f.topics.reduce((s, t) => s + t.posts.length, 0),
    0
  );

  const filteredCategories = useMemo(() => {
    if (!query.trim()) return categories;
    const q = query.toLowerCase();
    return categories
      .map(([cat, list]) => [cat, list.filter((f) => f.name.toLowerCase().includes(q))])
      .filter(([, list]) => list.length > 0);
  }, [categories, query]);

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8">
      <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-forest to-forest-deep px-8 py-9 sm:px-10">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(rgba(244,246,245,0.14) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
        <div className="pointer-events-none absolute -top-28 -left-20 h-80 w-80 rounded-full bg-gold/30 blur-[90px]" />
        <div className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-crimson/20 blur-[100px]" />

        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold text-gold">Community</p>
            <h1 className="text-3xl font-extrabold text-white sm:text-4xl">Forums</h1>
            <p className="mt-2 max-w-md text-[15px] leading-relaxed text-white/70">
              Ask questions, share progress, and follow what your group is working through.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-center">
              <p className="text-xl font-extrabold text-gold">{totalTopics}</p>
              <p className="text-xs text-white/60">Topics</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-center">
              <p className="text-xl font-extrabold text-gold">{totalPosts}</p>
              <p className="text-xs text-white/60">Posts</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-6 flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2.5 max-w-md">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 shrink-0 text-white/50">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search forums"
            className="w-full bg-transparent text-sm text-white placeholder-white/45 outline-none"
          />
        </div>
      </div>

      {filteredCategories.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white p-10 text-center text-ink/60 shadow-sm">
          No forums match "{query}".
        </div>
      ) : (
        <div className="space-y-8">
          {filteredCategories.map(([category, list]) => (
            <section key={category}>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink/50">{category}</h2>
              <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
                {list.map((forum) => {
                  const latest = forum.topics.reduce((a, b) => (b.views > a.views ? b : a), forum.topics[0]);
                  const posts = forum.topics.reduce((s, t) => s + t.posts.length, 0);
                  return (
                    <Link
                      key={forum.id}
                      to={`/forums/${forum.id}/${forum.slug}`}
                      className="flex flex-col gap-4 p-5 transition-colors hover:bg-forest-soft/40 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-forest-soft text-forest">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
                            <path d="M4 5h11l3 3v11H4z" strokeLinejoin="round" />
                            <path d="M7 10h8M7 13h5" strokeLinecap="round" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-bold text-ink">{forum.name}</p>
                          <p className="text-sm text-ink/55">{forum.subtitle}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-8">
                        <div className="text-center">
                          <p className="text-lg font-bold text-forest">{forum.topics.length}</p>
                          <p className="text-xs text-ink/50">Topics</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-forest">{posts}</p>
                          <p className="text-xs text-ink/50">Posts</p>
                        </div>
                        {latest?.lastPost && (
                          <div className="hidden items-center gap-2.5 sm:flex">
                            <span
                              className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold ${toneFor(
                                latest.lastPost.author
                              )}`}
                            >
                              {initials(latest.lastPost.author)}
                            </span>
                            <div className="text-sm">
                              <p className="text-ink/70">
                                Last reply by <span className="font-semibold text-ink">{latest.lastPost.author}</span>
                              </p>
                              <p className="text-xs text-ink/45">{latest.lastPost.date}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}