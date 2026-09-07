import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MemberAvatar } from "../components/GroupHoverCard";

// demo data — replace with API response keyed by username
const PROFILES = {
  karthick: {
    name: "Karthick", username: "karthick", avatar: null,
    badges: ["/groups/std.png"], stats: { views: 12, friends: 4, lastUpdate: "May 27", joined: "April 27, 2022" },
    counts: { friends: 4, groups: 1, pages: 1, lessons: 91 },
    mutualFriends: [{ name: "Gold", username: "gold", avatar: null }],
    groups: [{ id: 1, name: "STD work", image: "/groups/std.png", members: 10 }],
    posts: [
      { id: 1, text: ["completed the assignment ", { t: "stock finder on members", to: "#" }, " for the task ", { t: "STD work", to: "/groups/1" }], date: "May 27", likes: 0 },
      { id: 2, text: ["completed the assignment ", { t: "add instruction for desktop here", to: "#" }, " for the task ", { t: "STD work", to: "/groups/1" }], date: "March 30", likes: 0 },
      { id: 3, text: ["added 8 for the task: \"-AV Helper\" assignment"], date: "April 9, 2025", likes: 0 },
      { id: 4, text: ["got ", { t: "STD work", to: "/groups/1" }, " badge for the task ", { t: "Reuters PDF Changes", to: "#" }], date: "March 26, 2025", likes: 2 },
      { id: 5, text: ["got ", { t: "STD work", to: "/groups/1" }, " badge for the task ", { t: "Bugs", to: "#" }], date: "March 26, 2025", likes: 1 },
      { id: 6, text: ["got ", { t: "STD work", to: "/groups/1" }, " badge for the task ", { t: "Bugs", to: "#" }], date: "March 26, 2025", likes: 0 },
    ],
  },
};

const fallback = (u) => {
  const name = u.charAt(0).toUpperCase() + u.slice(1).replace(/-/g, " ");
  return {
    name, username: u, avatar: null, badges: ["/groups/std.png"],
    stats: { views: 8, friends: 3, lastUpdate: "June 2", joined: "January 14, 2023" },
    counts: { friends: 3, groups: 1, pages: 0, lessons: 24 },
    mutualFriends: [{ name: "Karthick", username: "karthick", avatar: null }],
    groups: [{ id: 1, name: "STD work", image: "/groups/std.png", members: 10 }],
    posts: [
      { id: 1, text: ["completed the assignment ", { t: "weekly report review", to: "#" }, " for the task ", { t: "STD work", to: "/groups/1" }], date: "June 2", likes: 1 },
      { id: 2, text: ["got ", { t: "STD work", to: "/groups/1" }, " badge for the task ", { t: "Bugs", to: "#" }], date: "May 18", likes: 3 },
      { id: 3, text: ["joined the group ", { t: "STD work", to: "/groups/1" }], date: "January 14, 2023", likes: 0 },
    ],
  };
};

const SECTIONS = (c) => [
  { key: "info", label: "Info" }, { key: "posts", label: "Posts" },
  { key: "friends", label: `Friends (${c.friends})` }, { key: "groups", label: `Groups (${c.groups})` },
  { key: "pages", label: `Pages (${c.pages})` }, { key: "lessons", label: `Lessons taken (${c.lessons})` },
];

function SideAction({ icon, label, danger }) {
  return (
    <button className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-semibold transition-colors ${danger ? "text-ink/70 hover:bg-crimson/5 hover:text-crimson" : "text-ink/80 hover:bg-forest-soft hover:text-forest"}`}>
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-mist text-ink/60">{icon}</span>{label}
    </button>
  );
}

function Post({ post, author }) {
  const [liked, setLiked] = useState(false);
  return (
    <li className="flex gap-4 rounded-2xl bg-white p-5 ring-1 ring-line">
      <MemberAvatar member={author} size="h-11 w-11" />
      <div className="min-w-0 flex-1">
        <p className="text-[15px] leading-6 text-ink/80">
          <Link to={`/profile/${author.username}`} className="font-bold text-ink hover:text-forest">{author.name}</Link>{" "}
          {post.text.map((p, i) => typeof p === "string" ? p : <Link key={i} to={p.to} className="font-semibold text-forest underline-offset-4 hover:underline">{p.t}</Link>)}
        </p>
        <div className="mt-2.5 flex items-center gap-4 text-[13.5px] text-ink/55">
          <span>{post.date}</span>
          <button onClick={() => setLiked((l) => !l)} className={`inline-flex items-center gap-1.5 font-semibold ${liked ? "text-gold-deep" : "hover:text-forest"}`}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M7 11v10H4a1 1 0 01-1-1v-8a1 1 0 011-1h3zm0 0l4-8a2 2 0 012 2v4h5a2 2 0 012 2.3l-1.2 7A2 2 0 0116.8 21H7" /></svg>
            Like{post.likes + (liked ? 1 : 0) ? ` · ${post.likes + (liked ? 1 : 0)}` : ""}
          </button>
          <button className="font-semibold hover:text-forest">Comment</button>
        </div>
      </div>
    </li>
  );
}

export default function MemberProfile() {
  const { username = "" } = useParams();
  const user = PROFILES[username.toLowerCase()] || fallback(username);
  const [section, setSection] = useState("posts");
  const [shown, setShown] = useState(4);
  const [note, setNote] = useState("");

  const posts = user.posts.slice(0, shown);

  return (
    <div className="mx-auto max-w-[1200px] px-4 pt-6">
      {/* cover */}
      <section className="relative overflow-hidden rounded-3xl bg-forest px-8 pb-8 pt-10 text-white lg:px-12">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold/30 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,.08)_1px,transparent_0)] bg-[size:28px_28px]" />
        <div className="relative flex flex-wrap items-end gap-6">
          <MemberAvatar member={user} size="h-28 w-28 text-[40px]" className="ring-4 ring-white/90" />
          <div className="flex-1">
            <p className="text-[13px] font-bold uppercase tracking-wider text-gold">Member profile</p>
            <h1 className="mt-1 text-[40px] font-extrabold leading-none tracking-tight">{user.name}</h1>
            <p className="mt-2 text-[15px] text-white/70">@{user.username} · joined {user.stats.joined}</p>
          </div>
          <div className="flex gap-2">
            <button className="rounded-xl bg-gold px-5 py-2.5 text-[15px] font-bold text-ink hover:bg-white">Add to friends</button>
            <button className="rounded-xl bg-white/10 px-5 py-2.5 text-[15px] font-bold text-white ring-1 ring-white/25 hover:bg-white/15">Message</button>
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* sidebar */}
        <aside className="space-y-4">
          <div className="rounded-3xl bg-white p-4 ring-1 ring-line">
            {user.badges.length > 0 && (
              <div className="mb-3 flex gap-2 px-2">
                {user.badges.map((b, i) => <img key={i} src={b} alt="" className="h-10 w-10 rounded-lg object-cover ring-1 ring-line" />)}
              </div>
            )}
            <SideAction label="Add to my friends" icon="＋" />
            <SideAction label="Send credits" icon="◎" />
            <SideAction label="Block member" icon="⊘" danger />
            <SideAction label="Report" icon="⚑" danger />
          </div>

          <div className="rounded-3xl bg-white p-5 ring-1 ring-line">
            <h3 className="text-[13px] font-bold uppercase tracking-wider text-gold-deep">Member info</h3>
            <dl className="mt-3 space-y-2 text-[14.5px]">
              {[["Profile views", user.stats.views], ["Friends", user.stats.friends], ["Last update", user.stats.lastUpdate], ["Joined", user.stats.joined]].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-line pb-2 last:border-0 last:pb-0"><dt className="text-ink/55">{k}</dt><dd className="font-semibold text-ink">{v}</dd></div>
              ))}
            </dl>
          </div>

          <div className="rounded-3xl bg-white p-5 ring-1 ring-line">
            <h3 className="text-[13px] font-bold uppercase tracking-wider text-gold-deep">Mutual friends</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {user.mutualFriends.length ? user.mutualFriends.map((m) => (
                <Link key={m.username} to={`/profile/${m.username}`} title={m.name}><MemberAvatar member={m} size="h-11 w-11" /></Link>
              )) : <p className="text-[14px] text-ink/55">No mutual friends yet.</p>}
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5 ring-1 ring-line">
            <h3 className="text-[13px] font-bold uppercase tracking-wider text-gold-deep">My note about {user.name}</h3>
            <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Private — only you can see this."
              className="mt-3 w-full resize-none rounded-xl border border-line bg-white px-3.5 py-2.5 text-[14.5px] outline-none placeholder:text-ink/40 focus:border-forest focus:ring-4 focus:ring-forest/10" />
            <div className="mt-2 flex gap-2">
              <button className="rounded-lg bg-forest px-3.5 py-2 text-[14px] font-bold text-white hover:bg-forest-deep">Save</button>
              <button onClick={() => setNote("")} className="rounded-lg px-3.5 py-2 text-[14px] font-semibold text-ink/60 hover:bg-mist">Cancel</button>
            </div>
          </div>
        </aside>

        {/* main */}
        <main>
          <div className="flex flex-wrap gap-1.5 rounded-2xl bg-white p-1.5 ring-1 ring-line">
            {SECTIONS(user.counts).map((s) => (
              <button key={s.key} onClick={() => setSection(s.key)}
                className={`rounded-xl px-4 py-2.5 text-[14.5px] font-semibold transition-colors ${section === s.key ? "bg-forest text-white" : "text-ink/60 hover:text-ink"}`}>
                {s.label}
              </button>
            ))}
          </div>

          <div className="mt-4">
            {section === "posts" && (
              <>
                <ul className="space-y-3">{posts.map((p) => <Post key={p.id} post={p} author={user} />)}</ul>
                {shown < user.posts.length && (
                  <div className="mt-5 text-center">
                    <button onClick={() => setShown((n) => n + 4)} className="rounded-xl bg-forest px-6 py-3 text-[15px] font-bold text-white hover:bg-forest-deep">View more</button>
                  </div>
                )}
                {!user.posts.length && <p className="rounded-2xl bg-white p-10 text-center text-ink/55 ring-1 ring-line">No posts yet.</p>}
              </>
            )}

            {section === "groups" && (
              <ul className="grid gap-3 sm:grid-cols-2">
                {user.groups.map((g) => (
                  <li key={g.id}>
                    <Link to={`/groups/${g.id}`} className="flex items-center gap-4 rounded-2xl bg-white p-4 ring-1 ring-line hover:ring-forest/40">
                      <img src={g.image} alt="" className="h-14 w-14 rounded-xl object-cover" />
                      <span><span className="block text-[16px] font-extrabold">{g.name}</span><span className="text-[13.5px] text-ink/55">{g.members} members</span></span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {section === "info" && (
              <div className="rounded-2xl bg-white p-6 ring-1 ring-line text-[15px] leading-7 text-ink/70">
                <p><span className="font-bold text-ink">{user.name}</span> has been a SkillCoach member since {user.stats.joined}. {user.counts.lessons} lessons taken across {user.counts.groups} group{user.counts.groups === 1 ? "" : "s"}.</p>
              </div>
            )}

            {["friends", "pages", "lessons"].includes(section) && (
              <p className="rounded-2xl bg-white p-10 text-center text-ink/55 ring-1 ring-line">Nothing to show here yet.</p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
