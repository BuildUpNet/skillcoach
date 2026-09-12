import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Icon from "../components/group/icons";
import {
  getInbox, getOutbox, getConversation,
  replyToConversation, composeMessage,
} from "../lib/api";

function initialsOf(name) {
  return (
    (name || "")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "?"
  );
}

function renderBody(text) {
  if (!text) return null;
  const parts = [];
  const re = /\[([^\]]+)\]\(([^\s)]+)\)/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    let href = m[2];
    if (!/^https?:\/\//i.test(href)) href = `https://${href}`;
    parts.push(
   <a key={m.index} href={href} target="_blank" rel="noreferrer" className="underline underline-offset-2 decoration-current hover:opacity-75">
  {m[1]}
</a>
    );
    last = re.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

const TABS = [
  { id: "inbox", label: "Inbox", icon: "mail" },
  { id: "sent", label: "Sent", icon: "send" },
  { id: "compose", label: "Compose", icon: "edit" },
];

function Avatar({ name }) {
  return (
    <div className="flex-none w-10 h-10 rounded-full bg-forest-soft text-forest font-bold text-sm flex items-center justify-center">
      {initialsOf(name)}
    </div>
  );
}

function EmptyTip({ text, actionLabel, onAction }) {
  return (
    <div className="m-5 flex items-center gap-3 bg-gold-soft border border-gold/30 rounded-xl px-4 py-3.5">
      <span className="text-lg">💡</span>
      <p className="text-[14px] text-ink/70">
        {text}{" "}
        {actionLabel && (
          <button type="button" onClick={onAction} className="font-semibold text-forest hover:text-gold-deep underline underline-offset-2">
            {actionLabel}
          </button>
        )}
      </p>
    </div>
  );
}

/* Link + music attach controls, reused by both Compose and the reply box */
function AttachControls({ showLink, setShowLink, linkUrl, setLinkUrl, linkLabel, setLinkLabel, onInsertLink, attaching, attachment, onPickMusic, onRemoveAttachment }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-4">
        <button type="button" onClick={() => setShowLink((s) => !s)} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink/55 hover:text-forest">
          <Icon name="link" className="h-4 w-4" />
          Add Link
        </button>
        <label className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink/55 hover:text-forest cursor-pointer">
          <Icon name="music" className="h-4 w-4" />
          Add Music
          <input type="file" accept="audio/*" className="hidden" onChange={onPickMusic} />
        </label>
      </div>

      {showLink && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-mist border border-line p-3">
          <input value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)} placeholder="Link text (optional)"
            className="flex-1 min-w-[140px] rounded-lg border border-line bg-white px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-gold/40" />
          <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://…"
            className="flex-1 min-w-[180px] rounded-lg border border-line bg-white px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-gold/40" />
          <button type="button" onClick={onInsertLink} className="rounded-lg bg-forest px-3 py-1.5 text-sm font-semibold text-white hover:bg-forest-deep">
            Insert
          </button>
        </div>
      )}

      {attaching && <p className="text-[13px] text-ink/50">Attaching…</p>}
      {attachment && (
        <div className="flex items-center gap-2 rounded-lg bg-forest-soft px-3 py-2 text-[13px] text-forest">
          <Icon name="music" className="h-4 w-4" />
          {attachment.filename}
          <button type="button" onClick={onRemoveAttachment} className="ml-auto text-ink/50 hover:text-crimson">Remove</button>
        </div>
      )}
    </div>
  );
}

function useAttachControls(setBody) {
  const [showLink, setShowLink] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [attaching, setAttaching] = useState(false);
  const [error, setError] = useState("");

  const onInsertLink = () => {
    if (!linkUrl.trim()) return;
    let url = linkUrl.trim();
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    const label = linkLabel.trim() || url;
    setBody((b) => (b ? `${b}\n[${label}](${url})` : `[${label}](${url})`));
    setLinkUrl(""); setLinkLabel(""); setShowLink(false);
  };

  const onPickMusic = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("audio/")) { setError("Please choose an audio file."); return; }
    if (file.size > 4_500_000) { setError("Audio file is too large (max ~4.5MB)."); return; }
    setError("");
    setAttaching(true);
    const reader = new FileReader();
    reader.onload = () => { setAttachment({ filename: file.name, dataUrl: reader.result }); setAttaching(false); };
    reader.onerror = () => { setError("Couldn't read that file."); setAttaching(false); };
    reader.readAsDataURL(file);
  };

  return {
    showLink, setShowLink, linkUrl, setLinkUrl, linkLabel, setLinkLabel,
    attachment, setAttachment, attaching, error, setError,
    onInsertLink, onPickMusic,
  };
}

/* Expanded conversation thread + reply box, shown under an inbox row when opened */
function ThreadPanel({ conversationId, onSent }) {
  const [thread, setThread] = useState(null);
  const [error, setError] = useState("");
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const attach = useAttachControls(setReply);

  const load = () => {
    setError("");
    getConversation(conversationId)
      .then(setThread)
      .catch((e) => setError(e.message || "Couldn't load this conversation."));
  };

  useEffect(load, [conversationId]);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    setError("");
    try {
      await replyToConversation(conversationId, reply.trim(), attach.attachment);
      setReply("");
      attach.setAttachment(null);
      load();
      onSent?.();
    } catch (err) {
      setError(err.message || "Couldn't send reply.");
    } finally {
      setSending(false);
    }
  };

  if (error) return <p className="px-5 pb-4 text-[13.5px] text-red-600">{error}</p>;
  if (!thread) return <p className="px-5 pb-4 text-[13.5px] text-ink/50">Loading conversation…</p>;

  return (
    <div className="border-t border-line bg-mist px-5 py-4">
      <div className="space-y-3 mb-4">
        {thread.messages.map((m) => (
          <div key={m.id} className={`flex ${m.self ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-[14px] ${m.self ? "bg-forest text-white" : "bg-white border border-line text-ink"}`}>
              {!m.self && <p className="text-[12px] font-semibold text-ink/50 mb-0.5">{m.from.name}</p>}
              {m.body?.trim() && <div className="whitespace-pre-wrap">{renderBody(m.body)}</div>}
              {m.attachment && (
                <>
                  {!m.body?.trim() && <p className="text-[13px] italic opacity-70 mb-1">🎵 Audio attachment</p>}
                  <audio controls src={m.attachment.data_url} className="mt-2 w-full max-w-[260px]" />
                </>
              )}
              <p className={`mt-1 text-[11px] ${m.self ? "text-white/60" : "text-ink/40"}`}>
                {new Date(m.time).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {thread.locked ? (
        <p className="text-[13px] text-ink/50 italic">This conversation is locked.</p>
      ) : (
        <form onSubmit={handleReply} className="space-y-2">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={2}
            placeholder="Write a reply…"
            className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[14px] outline-none resize-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
          />

          {(error || attach.error) && (
            <p className="text-[13px] text-red-600">{attach.error || error}</p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <AttachControls
              showLink={attach.showLink} setShowLink={attach.setShowLink}
              linkUrl={attach.linkUrl} setLinkUrl={attach.setLinkUrl}
              linkLabel={attach.linkLabel} setLinkLabel={attach.setLinkLabel}
              onInsertLink={attach.onInsertLink}
              attaching={attach.attaching} attachment={attach.attachment}
              onPickMusic={attach.onPickMusic}
              onRemoveAttachment={() => attach.setAttachment(null)}
            />
            <button
              type="submit"
              disabled={sending || !reply.trim()}
              className="inline-flex items-center gap-1.5 rounded-full bg-forest px-4 py-2 text-[14px] font-bold text-white hover:bg-forest-deep disabled:opacity-40"
            >
              <Icon name="send" className="h-4 w-4" />
              {sending ? "Sending…" : "Reply"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function ConversationRow({ convo, direction, expanded, onToggle, onSent }) {
  const person = direction === "inbox" ? convo.from : convo.to;
  const label = direction === "inbox" ? "From" : "To";

  return (
    <li className="border-b border-line last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-start gap-3 px-5 py-4 text-left hover:bg-mist transition-colors"
      >
        <Avatar name={person} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className={`text-[13px] text-ink/50 ${convo.unread ? "font-semibold text-ink/70" : ""}`}>
              {label}: {person}
            </p>
            <span className="text-xs text-ink/40 shrink-0">
              {convo.time ? new Date(convo.time).toLocaleString() : ""}
            </span>
          </div>
          <p className={`text-[15px] mt-0.5 truncate ${convo.unread ? "font-bold text-ink" : "font-medium text-ink/85"}`}>
            {convo.subject}
          </p>
          {convo.preview && (
            <p className={`text-[13.5px] text-ink/55 mt-1 ${expanded ? "" : "truncate"}`}>{convo.preview}</p>
          )}
        </div>
        {convo.unread && <span className="mt-1.5 w-2 h-2 rounded-full bg-gold shrink-0" aria-label="Unread" />}
      </button>
      {expanded && <ThreadPanel conversationId={convo.id} onSent={onSent} />}
    </li>
  );
}

export default function Messages() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [tab, setTab] = useState(
    searchParams.get("tab") === "compose" || searchParams.get("name") ? "compose" : "inbox"
  );
  const [inbox, setInbox] = useState(null);
  const [outbox, setOutbox] = useState(null);
  const [listError, setListError] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const [compose, setCompose] = useState({
    to: searchParams.get("name") || searchParams.get("to") || "",
    subject: "",
    body: "",
  });
  const [composeErr, setComposeErr] = useState("");
  const [sending, setSending] = useState(false);
  const [justSent, setJustSent] = useState(false);

  const setComposeBody = (updater) =>
    setCompose((c) => ({ ...c, body: typeof updater === "function" ? updater(c.body) : updater }));
  const attach = useAttachControls(setComposeBody);

  useEffect(() => {
    if (searchParams.get("to") || searchParams.get("name") || searchParams.get("tab")) {
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadInbox = () => {
    setListError("");
    getInbox()
      .then(setInbox)
      .catch((e) => setListError(e.message || "Couldn't load inbox."));
  };

  const loadOutbox = () => {
    setListError("");
    getOutbox()
      .then(setOutbox)
      .catch((e) => setListError(e.message || "Couldn't load sent messages."));
  };

  useEffect(() => {
    if (tab === "inbox") loadInbox();
    if (tab === "sent") loadOutbox();
  }, [tab]);

  const unreadCount = inbox?.unread ?? 0;

  const tabPill = (isActive) =>
    `inline-flex items-center gap-2 rounded-full px-4 py-2 text-[14px] font-semibold transition-colors ${
      isActive ? "bg-forest text-white" : "bg-white text-ink/65 border border-line hover:border-gold"
    }`;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!compose.to.trim() || !compose.subject.trim() || !compose.body.trim()) return;
    setSending(true);
    setComposeErr("");
    try {
      await composeMessage({
        to: compose.to.split(",").map((s) => s.trim()).filter(Boolean),
        subject: compose.subject.trim(),
        body: compose.body.trim(),
        attachment: attach.attachment,
      });
      setCompose({ to: "", subject: "", body: "" });
      attach.setAttachment(null);
      setJustSent(true);
      setTab("sent");
      loadOutbox();
      setTimeout(() => setJustSent(false), 3000);
    } catch (err) {
      setComposeErr(err.message || "Couldn't send message.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <p className="text-gold-deep text-sm font-semibold mb-1">Messages</p>
          <h1 className="text-3xl font-extrabold text-ink">Talk to your coaches and group.</h1>
        </div>
        <button
          type="button"
          onClick={() => setTab("compose")}
          className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-[15px] font-bold text-ink shadow-[0_8px_20px_-10px_rgba(217,164,65,.9)] transition-transform hover:-translate-y-px hover:bg-gold-deep hover:text-white"
        >
          <Icon name="edit" className="h-4 w-4" />
          New Message
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map((t) => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)} className={tabPill(tab === t.id)}>
            <Icon name={t.icon} className="h-4 w-4" />
            {t.label}
            {t.id === "inbox" && unreadCount > 0 && (
              <span className="bg-crimson text-white text-[11px] font-bold rounded-full px-1.5 py-px leading-none">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="bg-white border border-line rounded-2xl shadow-sm overflow-hidden">
        {tab === "inbox" && (
          <>
            <div className="px-5 py-4 border-b border-line">
              <p className="text-[14px] text-ink/60">
                You have <span className="font-semibold text-ink">{unreadCount} new</span> messages,{" "}
                {inbox?.total ?? 0} total
              </p>
            </div>

            {listError && <p className="px-5 py-4 text-[13.5px] text-red-600">{listError}</p>}

            {!inbox ? (
              <p className="text-center text-ink/50 py-14">Loading…</p>
            ) : inbox.conversations.length === 0 ? (
              <EmptyTip
                text="Your inbox is empty."
                actionLabel="Compose a new message"
                onAction={() => setTab("compose")}
              />
            ) : (
              <ul>
                {inbox.conversations.map((c) => (
                  <ConversationRow
                    key={c.id}
                    convo={c}
                    direction="inbox"
                    expanded={expandedId === c.id}
                    onToggle={() => setExpandedId((cur) => (cur === c.id ? null : c.id))}
                    onSent={loadInbox}
                  />
                ))}
              </ul>
            )}
          </>
        )}

        {tab === "sent" && (
          <>
            <div className="px-5 py-4 border-b border-line">
              <p className="text-[14px] text-ink/60">
                <span className="font-semibold text-ink">{outbox?.total ?? 0}</span> sent message
                {(outbox?.total ?? 0) === 1 ? "" : "s"}
              </p>
            </div>

            {listError && <p className="px-5 py-4 text-[13.5px] text-red-600">{listError}</p>}

            {!outbox ? (
              <p className="text-center text-ink/50 py-14">Loading…</p>
            ) : outbox.conversations.length === 0 ? (
              <EmptyTip text="You haven't sent anything yet." actionLabel="Write your first message" onAction={() => setTab("compose")} />
            ) : (
              <ul>
                {outbox.conversations.map((c) => (
                  <ConversationRow
                    key={c.id}
                    convo={c}
                    direction="sent"
                    expanded={expandedId === c.id}
                    onToggle={() => setExpandedId((cur) => (cur === c.id ? null : c.id))}
                    onSent={loadOutbox}
                  />
                ))}
              </ul>
            )}
          </>
        )}

        {tab === "compose" && (
          <form onSubmit={handleSend} className="p-6 max-w-xl">
            <h2 className="text-xl font-bold text-ink mb-1.5">Compose Message</h2>
            <p className="text-[13.5px] text-ink/55 mb-6">
              Your message can be addressed to up to 10 recipients.
            </p>

            {justSent && (
              <div className="mb-5 flex items-center gap-2 bg-forest-soft text-forest text-sm font-medium px-4 py-2.5 rounded-lg">
                <Icon name="check" className="h-4 w-4" />
                Message sent.
              </div>
            )}
            {(composeErr || attach.error) && (
              <div className="mb-5 rounded-lg bg-red-50 px-4 py-2.5 text-[13.5px] text-red-700 ring-1 ring-red-100">
                {attach.error || composeErr}
              </div>
            )}

            <label className="block mb-4">
              <span className="block text-[13px] font-semibold text-ink/70 mb-1.5">Send To</span>
              <input
                type="text"
                value={compose.to}
                onChange={(e) => setCompose((c) => ({ ...c, to: e.target.value }))}
                placeholder="Username(s) or user ID(s), separated by commas"
                required
                className="w-full bg-mist border border-line rounded-lg px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
              />
            </label>

            <label className="block mb-4">
              <span className="block text-[13px] font-semibold text-ink/70 mb-1.5">Subject</span>
              <input
                type="text"
                value={compose.subject}
                onChange={(e) => setCompose((c) => ({ ...c, subject: e.target.value }))}
                required
                className="w-full bg-mist border border-line rounded-lg px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
              />
            </label>

            <label className="block mb-2">
              <span className="block text-[13px] font-semibold text-ink/70 mb-1.5">Message</span>
              <textarea
                value={compose.body}
                onChange={(e) => setCompose((c) => ({ ...c, body: e.target.value }))}
                rows={5}
                required
                className="w-full bg-mist border border-line rounded-lg px-3.5 py-2.5 text-sm outline-none resize-none focus:ring-2 focus:ring-gold/40 focus:border-gold"
              />
            </label>

            <div className="mb-6">
              <AttachControls
                showLink={attach.showLink} setShowLink={attach.setShowLink}
                linkUrl={attach.linkUrl} setLinkUrl={attach.setLinkUrl}
                linkLabel={attach.linkLabel} setLinkLabel={attach.setLinkLabel}
                onInsertLink={attach.onInsertLink}
                attaching={attach.attaching} attachment={attach.attachment}
                onPickMusic={attach.onPickMusic}
                onRemoveAttachment={() => attach.setAttachment(null)}
              />
            </div>

            <button
              type="submit"
              disabled={sending || !compose.to.trim() || !compose.subject.trim() || !compose.body.trim()}
              className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-2.5 text-[15px] font-bold text-ink shadow-[0_8px_20px_-10px_rgba(217,164,65,.9)] transition-transform hover:-translate-y-px hover:bg-gold-deep hover:text-white disabled:opacity-40 disabled:pointer-events-none"
            >
              <Icon name="send" className="h-4 w-4" />
              {sending ? "Sending…" : "Send Message"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}