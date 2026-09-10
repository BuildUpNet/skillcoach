import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MemberAvatar } from "../components/GroupHoverCard";
import { getMember, postStatus, togglePostLike, getPostComments, addPostComment, blockMember, unblockMember, reportMember } from "../lib/api";
import { useAuth } from "../lib/AuthContext";
import { FriendButton } from "./Members";

const SECTIONS = (c, isOwn) => [
  { key: "info", label: "Info" }, { key: "posts", label: "Posts" },
  { key: "friends", label: `Friends (${c.friends})` }, { key: "groups", label: `Groups (${c.groups})` },
  ...(isOwn
    ? [{ key: "credits", label: "My Credits", to: "/credits" }]
    : [{ key: "pages", label: `Pages (${c.pages})` }, { key: "lessons", label: `Lessons taken (${c.lessons})` }]),
];

function SideAction({ icon, label, danger, to, onClick }) {
  const cls = `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-semibold transition-colors ${danger ? "text-ink/70 hover:bg-crimson/5 hover:text-crimson" : "text-ink/80 hover:bg-forest-soft hover:text-forest"}`;
  const inner = <><span className="grid h-8 w-8 place-items-center rounded-lg bg-mist text-ink/60">{icon}</span>{label}</>;
  return to ? <Link to={to} className={cls}>{inner}</Link> : <button onClick={onClick} className={cls}>{inner}</button>;
}

function ReportDialog({ user, onClose }) {
  const [category, setCategory] = useState("spam");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const submit = async () => {
    setBusy(true); setErr("");
    try { await reportMember(user.user_id, { category, description }); setDone(true); }
    catch (e) { setErr(e.message || "Couldn't send report."); }
    finally { setBusy(false); }
  };
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {done ? (
          <>
            <h3 className="text-[20px] font-extrabold text-ink">Report sent</h3>
            <p className="mt-2 text-[15px] text-ink/65">Thanks — our team will review {user.name}'s profile.</p>
            <button onClick={onClose} className="mt-5 w-full rounded-xl bg-forest px-4 py-3 text-[15px] font-bold text-white hover:bg-forest-deep">Close</button>
          </>
        ) : (
          <>
            <h3 className="text-[20px] font-extrabold text-ink">Report {user.name}</h3>
            <label className="mt-4 block text-[14px] font-semibold text-ink">Reason</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1.5 w-full rounded-xl border border-line px-4 py-3 text-[15px] outline-none focus:border-forest">
              <option value="spam">Spam or scam</option>
              <option value="abuse">Abusive or harassing</option>
              <option value="fake">Fake profile</option>
              <option value="inappropriate">Inappropriate content</option>
              <option value="other">Other</option>
            </select>
            <label className="mt-4 block text-[14px] font-semibold text-ink">What happened?</label>
            <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Give us a few details so we can act on it."
              className="mt-1.5 w-full resize-none rounded-xl border border-line px-4 py-3 text-[15px] outline-none focus:border-forest focus:ring-4 focus:ring-forest/10" />
            {err && <p className="mt-2 text-[14px] text-red-600">{err}</p>}
            <div className="mt-5 flex gap-2">
              <button onClick={submit} disabled={busy || !description.trim()} className="flex-1 rounded-xl bg-crimson px-4 py-3 text-[15px] font-bold text-white hover:opacity-90 disabled:opacity-60">{busy ? "Sending…" : "Send report"}</button>
              <button onClick={onClose} className="rounded-xl px-4 py-3 text-[15px] font-semibold text-ink/60 hover:bg-mist">Cancel</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatusComposer({ user, onPosted }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const share = async () => {
    if (!text.trim()) return;
    setBusy(true); setErr("");
    try {
      const post = await postStatus(text.trim());
      setText("");
      onPosted?.(post);
    } catch (e) {
      setErr(e.message || "Couldn't post right now.");
    } finally { setBusy(false); }
  };
  return (
    <div className="mb-4 rounded-2xl bg-white p-4 ring-1 ring-line">
      <div className="flex gap-3">
        <MemberAvatar member={user} size="h-11 w-11" />
        <textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="What's on your mind?"
          className="w-full resize-none rounded-xl border border-line bg-white px-3.5 py-2.5 text-[15px] outline-none placeholder:text-ink/40 focus:border-forest focus:ring-4 focus:ring-forest/10" />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[13.5px] text-ink/50">{err || "Posts to your profile feed."}</span>
        <button onClick={share} disabled={busy || !text.trim()}
          className="rounded-xl bg-forest px-5 py-2.5 text-[15px] font-bold text-white transition-colors hover:bg-forest-deep disabled:cursor-not-allowed disabled:opacity-60">
          {busy ? "Sharing…" : "Share"}
        </button>
      </div>
    </div>
  );
}

function Comments({ postId, me, onCount }) {
  const [list, setList] = useState(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    getPostComments(postId).then(setList).catch(() => setList([]));
  }, [postId]);

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    setBusy(true); setErr("");
    try {
      const c = await addPostComment(postId, body);
      setList((l) => [...(l || []), c]);
      setText("");
      onCount?.((n) => n + 1);
    } catch (e) {
      setErr(e.message || "Couldn't post comment.");
    } finally { setBusy(false); }
  };

  return (
    <div className="mt-4 space-y-3 border-t border-line pt-4">
      {list === null && <p className="text-[14px] text-ink/50">Loading comments…</p>}
      {list?.length === 0 && <p className="text-[14px] text-ink/50">No comments yet.</p>}
      {list?.map((c) => (
        <div key={c.id} className="flex gap-3">
          <Link to={`/profile/${c.author.username}`} className="flex-none"><MemberAvatar member={c.author} size="h-8 w-8" /></Link>
          <div className="min-w-0 flex-1 rounded-xl bg-mist px-3.5 py-2.5">
            <p className="text-[14.5px] leading-6 text-ink/80">
              <Link to={`/profile/${c.author.username}`} className="font-bold text-ink hover:text-forest">{c.author.name}</Link>{" "}
              <span className="whitespace-pre-line">{c.body}</span>
            </p>
            <p className="mt-0.5 text-[12.5px] text-ink/45">{c.date}</p>
          </div>
        </div>
      ))}
      {me && (
        <div className="flex gap-3">
          <MemberAvatar member={{ name: me.displayname || me.username || "Me", avatar: me.avatar || null }} size="h-8 w-8" />
          <div className="flex-1">
            <textarea rows={1} value={text} onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Write a comment… (Enter to post)"
              className="w-full resize-none rounded-xl border border-line bg-white px-3.5 py-2.5 text-[14.5px] outline-none placeholder:text-ink/40 focus:border-forest focus:ring-4 focus:ring-forest/10" />
            <div className="mt-1.5 flex items-center justify-between">
              <span className="text-[12.5px] text-red-600">{err}</span>
              <button onClick={send} disabled={busy || !text.trim()}
                className="rounded-lg bg-forest px-3.5 py-1.5 text-[13.5px] font-bold text-white hover:bg-forest-deep disabled:opacity-60">
                {busy ? "Posting…" : "Comment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Post({ post, author: fallbackAuthor, me }) {
  const [liked, setLiked] = useState(!!post.liked);
  const [likes, setLikes] = useState(post.likes || 0);
  const [comments, setComments] = useState(post.comments || 0);
  const [open, setOpen] = useState(false);
  const [liking, setLiking] = useState(false);
  const author = post.author || fallbackAuthor;
  const photos = (post.attachments || []).filter((x) => x.kind === "photo");
  const links = (post.attachments || []).filter((x) => x.kind === "link");

  const toggleLike = async () => {
    if (liking) return;
    setLiking(true);
    // optimistic
    setLiked((l) => !l); setLikes((n) => n + (liked ? -1 : 1));
    try {
      const r = await togglePostLike(post.id);
      setLiked(r.liked); setLikes(r.likes);
    } catch {
      setLiked(liked); setLikes(likes);
    } finally { setLiking(false); }
  };

  return (
    <li className="rounded-2xl bg-white p-5 ring-1 ring-line">
      <div className="flex gap-4">
        <Link to={`/profile/${author.username}`} className="flex-none"><MemberAvatar member={author} size="h-11 w-11" /></Link>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] leading-6 text-ink/80">
            <Link to={`/profile/${author.username}`} className="font-bold text-ink hover:text-forest">{author.name}</Link>{" "}
            {post.text.map((p, i) => typeof p === "string" ? p : <Link key={i} to={p.to} className="font-semibold text-forest underline-offset-4 hover:underline">{p.t}</Link>)}
          </p>

          {photos.length > 0 && (
            <div className={`mt-3 grid gap-2 ${photos.length > 1 ? "grid-cols-2 sm:grid-cols-3" : ""}`}>
              {photos.map((ph, i) => (
                <a key={i} href={ph.url} target="_blank" rel="noreferrer">
                  <img src={ph.url} alt="" className={`w-full rounded-xl object-cover ring-1 ring-line ${photos.length > 1 ? "h-36" : "max-h-96"}`} />
                </a>
              ))}
            </div>
          )}
          {links.map((l, i) => (
            <a key={i} href={l.url} target="_blank" rel="noreferrer" className="mt-3 block rounded-xl bg-mist px-4 py-3 ring-1 ring-line hover:ring-forest/40">
              <span className="block truncate text-[15px] font-bold text-forest">{l.title}</span>
              {l.description && <span className="mt-0.5 block text-[13.5px] leading-6 text-ink/60 line-clamp-2">{l.description}</span>}
              <span className="mt-0.5 block truncate text-[12.5px] text-ink/45">{l.url}</span>
            </a>
          ))}

          <div className="mt-2.5 flex items-center gap-4 text-[13.5px] text-ink/55">
            <span>{post.date}</span>
            <button onClick={toggleLike} disabled={liking} className={`inline-flex items-center gap-1.5 font-semibold ${liked ? "text-gold-deep" : "hover:text-forest"}`}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M7 11v10H4a1 1 0 01-1-1v-8a1 1 0 011-1h3zm0 0l4-8a2 2 0 012 2v4h5a2 2 0 012 2.3l-1.2 7A2 2 0 0116.8 21H7" /></svg>
              {liked ? "Liked" : "Like"}{likes ? ` · ${likes}` : ""}
            </button>
            <button onClick={() => setOpen((o) => !o)} className={`font-semibold ${open ? "text-forest" : "hover:text-forest"}`}>
              Comment{comments ? ` · ${comments}` : ""}
            </button>
          </div>

          {open && <Comments postId={post.id} me={me} onCount={setComments} />}
        </div>
      </div>
    </li>
  );
}

function Skeleton() {
  return (
    <div className="mx-auto max-w-[1200px] animate-pulse px-4 pt-6">
      <div className="h-52 rounded-3xl bg-forest/80" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[300px_1fr]">
        <div className="space-y-4">{[0, 1, 2].map((i) => <div key={i} className="h-36 rounded-3xl bg-white ring-1 ring-line" />)}</div>
        <div className="space-y-3">{[0, 1, 2, 3].map((i) => <div key={i} className="h-24 rounded-2xl bg-white ring-1 ring-line" />)}</div>
      </div>
    </div>
  );
}

export default function MemberProfile() {
  const { username = "" } = useParams();
  const { user: me } = useAuth();
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | notfound | error
  const [section, setSection] = useState("info");
  const [shown, setShown] = useState(4);
  const [note, setNote] = useState("");
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    let alive = true;
    setStatus("loading");
    setUser(null);
    setSection("info");
    setShown(4);
    getMember(username)
      .then((data) => { if (alive) { setUser(data); setStatus("ready"); } })
      .catch((err) => { if (alive) setStatus(err.status === 404 ? "notfound" : "error"); });
    return () => { alive = false; };
  }, [username]);

  if (status === "loading") return <Skeleton />;

  if (status !== "ready") {
    return (
      <div className="mx-auto max-w-[1200px] px-4 pt-6">
        <div className="rounded-3xl bg-white p-14 text-center ring-1 ring-line">
          <h1 className="text-[28px] font-extrabold tracking-tight text-ink">
            {status === "notfound" ? "Member not found" : "Couldn't load this profile"}
          </h1>
          <p className="mt-2 text-[15px] text-ink/60">
            {status === "notfound" ? `No member with the username “${username}”.` : "Please try again in a moment."}
          </p>
          <Link to="/members" className="mt-6 inline-block rounded-xl bg-forest px-6 py-3 text-[15px] font-bold text-white hover:bg-forest-deep">Browse members</Link>
        </div>
      </div>
    );
  }

  const isOwn = !!me && (
    (me.user_id != null && Number(me.user_id) === Number(user.user_id)) ||
    (me.username && me.username.toLowerCase() === user.username.toLowerCase())
  );
  const posts = user.posts.slice(0, shown);
  const addPost = (post) => setUser((u) => ({ ...u, posts: [post, ...u.posts] }));

  return (
    <div className="mx-auto max-w-[1200px] px-4 pt-6">
      {reporting && <ReportDialog user={user} onClose={() => setReporting(false)} />}
      {user.blocked && (
        <p className="mb-4 rounded-2xl bg-crimson/10 px-5 py-3 text-[14.5px] font-medium text-crimson ring-1 ring-crimson/20">
          You've blocked {user.name}. They can't send you requests or messages.
        </p>
      )}
      {/* cover */}
      <section className="relative overflow-hidden rounded-3xl bg-forest px-8 pb-8 pt-10 text-white lg:px-12">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold/30 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,.08)_1px,transparent_0)] bg-[size:28px_28px]" />
        <div className="relative flex flex-wrap items-end gap-6">
          <div className="relative">
            <MemberAvatar member={user} size="h-28 w-28 text-[40px]" className="ring-4 ring-white/90" />
            {isOwn && (
              <Link to="/profile/edit/photo" title="Change photo" aria-label="Change photo"
                className="absolute -bottom-1 -right-1 grid h-10 w-10 place-items-center rounded-full bg-gold text-ink ring-4 ring-forest transition-colors hover:bg-white">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" />
                </svg>
              </Link>
            )}
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-bold uppercase tracking-wider text-gold">Member profile</p>
            <h1 className="mt-1 text-[40px] font-extrabold leading-none tracking-tight">{user.name}</h1>
            <p className="mt-2 text-[15px] text-white/70">@{user.username}{user.stats.joined ? ` · joined ${user.stats.joined}` : ""}</p>
          </div>
          <div className="flex gap-2">
            {isOwn ? (
              <Link to="/profile/edit" className="rounded-xl bg-gold px-5 py-2.5 text-[15px] font-bold text-ink hover:bg-white">Edit my profile</Link>
            ) : (
              <>
                <div className="min-w-[180px]">
                  <FriendButton member={{ id: user.user_id, name: user.name, relation: user.relation || "none" }}
                    onChange={(rel) => setUser((u) => ({ ...u, relation: rel }))} />
                </div>
                <Link to="/messages" className="rounded-xl bg-white/10 px-5 py-2.5 text-[15px] font-bold text-white ring-1 ring-white/25 hover:bg-white/15">Message</Link>
              </>
            )}
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
            {isOwn ? (
              <>
                <SideAction label="Edit my profile" icon="✎" to="/profile/edit" />
                <SideAction label="My credits" icon="◎" to="/credits" />
              </>
            ) : (
              <>
                <div className="mb-2 px-1">
                  <FriendButton size="sm" member={{ id: user.user_id, name: user.name, relation: user.relation || "none" }}
                    onChange={(rel) => setUser((u) => ({ ...u, relation: rel }))} />
                </div>
                <SideAction label="Send credits" icon="◎" to="/credits" />
                <SideAction label={user.blocked ? "Unblock member" : "Block member"} icon="⊘" danger
                  onClick={async () => {
                    if (user.blocked) { await unblockMember(user.user_id).catch(() => {}); setUser((u) => ({ ...u, blocked: false })); return; }
                    if (!confirm(`Block ${user.name}? They won't be able to contact you and any friendship will be removed.`)) return;
                    const r = await blockMember(user.user_id).catch((e) => alert(e.message));
                    if (r) setUser((u) => ({ ...u, blocked: true, relation: "none" }));
                  }} />
                <SideAction label="Report" icon="⚑" danger onClick={() => setReporting(true)} />
              </>
            )}
          </div>

          <div className="rounded-3xl bg-white p-5 ring-1 ring-line">
            <h3 className="text-[13px] font-bold uppercase tracking-wider text-gold-deep">Member info</h3>
            <dl className="mt-3 space-y-2 text-[14.5px]">
              {[["Profile views", user.stats.views], ["Friends", user.stats.friends], ["Last update", user.stats.lastUpdate], ["Joined", user.stats.joined]].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-line pb-2 last:border-0 last:pb-0"><dt className="text-ink/55">{k}</dt><dd className="font-semibold text-ink">{v ?? "—"}</dd></div>
              ))}
            </dl>
          </div>

          {!isOwn && <div className="rounded-3xl bg-white p-5 ring-1 ring-line">
            <h3 className="text-[13px] font-bold uppercase tracking-wider text-gold-deep">Mutual friends</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {user.mutualFriends.length ? user.mutualFriends.map((m) => (
                <Link key={m.username} to={`/profile/${m.username}`} title={m.name}><MemberAvatar member={m} size="h-11 w-11" /></Link>
              )) : <p className="text-[14px] text-ink/55">No mutual friends yet.</p>}
            </div>
          </div>}

          {!isOwn && <div className="rounded-3xl bg-white p-5 ring-1 ring-line">
            <h3 className="text-[13px] font-bold uppercase tracking-wider text-gold-deep">My note about {user.name}</h3>
            <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Private — only you can see this."
              className="mt-3 w-full resize-none rounded-xl border border-line bg-white px-3.5 py-2.5 text-[14.5px] outline-none placeholder:text-ink/40 focus:border-forest focus:ring-4 focus:ring-forest/10" />
            <div className="mt-2 flex gap-2">
              <button className="rounded-lg bg-forest px-3.5 py-2 text-[14px] font-bold text-white hover:bg-forest-deep">Save</button>
              <button onClick={() => setNote("")} className="rounded-lg px-3.5 py-2 text-[14px] font-semibold text-ink/60 hover:bg-mist">Cancel</button>
            </div>
          </div>}
        </aside>

        {/* main */}
        <main>
          <div className="flex flex-wrap gap-1.5 rounded-2xl bg-white p-1.5 ring-1 ring-line">
            {SECTIONS(user.counts, isOwn).map((s) => {
              const cls = `rounded-xl px-4 py-2.5 text-[14.5px] font-semibold transition-colors ${section === s.key ? "bg-forest text-white" : "text-ink/60 hover:text-ink"}`;
              return s.to
                ? <Link key={s.key} to={s.to} className={cls}>{s.label}</Link>
                : <button key={s.key} onClick={() => setSection(s.key)} className={cls}>{s.label}</button>;
            })}
          </div>

          <div className="mt-4">
            {section === "posts" && (
              <>
                {isOwn && <StatusComposer user={user} onPosted={addPost} />}
                <ul className="space-y-3">{posts.map((p) => <Post key={p.id} post={p} author={user} me={me ? { ...me, avatar: isOwn ? user.avatar : me.avatar } : null} />)}</ul>
                {shown < user.posts.length && (
                  <div className="mt-5 text-center">
                    <button onClick={() => setShown((n) => n + 4)} className="rounded-xl bg-forest px-6 py-3 text-[15px] font-bold text-white hover:bg-forest-deep">View more</button>
                  </div>
                )}
                {!user.posts.length && <p className="rounded-2xl bg-white p-10 text-center text-ink/55 ring-1 ring-line">No posts yet.</p>}
              </>
            )}

            {section === "groups" && (
              user.groups.length ? (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {user.groups.map((g) => (
                    <li key={g.id}>
                      <Link to={`/projects/${g.id}`} className="flex items-center gap-4 rounded-2xl bg-white p-4 ring-1 ring-line hover:ring-forest/40">
                        <img src={g.image} alt="" onError={(e) => { e.currentTarget.src = "/groups/std.png"; }} className="h-14 w-14 rounded-xl object-cover" />
                        <span><span className="block text-[16px] font-extrabold">{g.name}</span><span className="text-[13.5px] text-ink/55">{g.members} members</span></span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : <p className="rounded-2xl bg-white p-10 text-center text-ink/55 ring-1 ring-line">Not a member of any group yet.</p>
            )}

            {section === "friends" && (
              (user.friends || []).length ? (
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {user.friends.map((f) => (
                    <li key={f.user_id}>
                      <Link to={`/profile/${f.username}`} className="flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-line hover:ring-forest/40">
                        <MemberAvatar member={f} size="h-12 w-12" />
                        <span className="min-w-0">
                          <span className="block truncate text-[15.5px] font-extrabold text-ink">{f.name}</span>
                          <span className="block truncate text-[13.5px] text-ink/55">@{f.username}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : <p className="rounded-2xl bg-white p-10 text-center text-ink/55 ring-1 ring-line">No friends yet.</p>
            )}

            {section === "info" && (
              <div className="space-y-4">
                {user.about && (
                  <div className="rounded-2xl bg-white p-6 ring-1 ring-line">
                    <h3 className="mb-3 text-[17px] font-extrabold tracking-tight text-ink">Introduction</h3>
                    <p className="whitespace-pre-line text-[15px] leading-7 text-ink/80">{user.about}</p>
                  </div>
                )}
                {(user.info || []).map((sec) => (
                  <div key={sec.heading} className="rounded-2xl bg-white p-6 ring-1 ring-line">
                    <h3 className="mb-3 text-[17px] font-extrabold tracking-tight text-ink">{sec.heading}</h3>
                    <dl className="grid gap-x-8 gap-y-3 text-[15px] sm:grid-cols-2">
                      {sec.items.map((it) => (
                        <div key={it.label} className={`flex justify-between gap-4 border-b border-line pb-2 ${it.type === "textarea" ? "sm:col-span-2 flex-col" : ""}`}>
                          <dt className="text-ink/55">{it.label}</dt>
                          <dd className={`font-semibold text-ink ${it.type === "textarea" ? "whitespace-pre-line font-normal text-ink/80" : "text-right"}`}>
                            {/^https?:\/\//i.test(it.value) || ["website", "url"].includes(it.type)
                              ? <a href={/^https?:\/\//i.test(it.value) ? it.value : `https://${it.value}`} target="_blank" rel="noreferrer" className="text-forest hover:underline">{it.value}</a>
                              : it.value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ))}

                {!user.about && !(user.info || []).length && (
                  <p className="rounded-2xl bg-white p-10 text-center text-ink/55 ring-1 ring-line">
                    {isOwn ? <>Nothing here yet — add your details from <Link to="/profile/edit" className="font-bold text-forest">Edit my profile</Link>.</> : `${user.name} hasn't added any info yet.`}
                  </p>
                )}
              </div>
            )}

            {["pages", "lessons"].includes(section) && (
              <p className="rounded-2xl bg-white p-10 text-center text-ink/55 ring-1 ring-line">Nothing to show here yet.</p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}