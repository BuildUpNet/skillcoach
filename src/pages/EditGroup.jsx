import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import CreateGroupForm from "../components/CreateGroupForm";
import { getGroup, updateGroup } from "../lib/api";

export default function EditGroup() {
  const navigate = useNavigate();
  const { groupId } = useParams();
  const [initialData, setInitialData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getGroup(groupId)
      .then((g) =>
        setInitialData({
          name: g.title,
          description: g.description,
          category: g.category_id || "",
          dailySummary: !!g.summary_emails,
          searchable: g.search ? "yes" : "no",
          memberInvites: g.invite ? "yes" : "officers",
          approval: g.approval ? "approve" : "immediate",
        }),
      )
      .catch((err) => setError(err.message));
  }, [groupId]);

  const handleSave = async (data) => {
    await updateGroup(groupId, {
      title: data.name,
      description: data.description,
      category_id: data.category,
      search: data.searchable === "yes",
      invite: data.memberInvites === "yes",
      approval: data.approval === "approve",
      summary_emails: data.dailySummary,
    });
    navigate(`/projects/${groupId}`);
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 pt-6">
      <nav className="flex items-center gap-2 text-[14.5px] text-ink/55">
        <Link to="/projects" className="hover:text-forest">Group</Link>
        <span>/</span>
        <span className="font-semibold text-ink">Edit group</span>
      </nav>

      <div className="mt-4 mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[36px] font-extrabold tracking-tight lg:text-[44px]">Edit group</h1>
          <p className="mt-2 max-w-[56ch] text-[16px] leading-7 text-ink/60">
            Update the basics, how people join, and who can see what.
          </p>
        </div>
        <Link to="/projects" className="rounded-xl border border-line bg-white px-4 py-2.5 text-[15px] font-semibold text-ink/70 hover:border-forest/40 hover:text-forest">
          ← Back to groups
        </Link>
      </div>

      {error && <p className="rounded-xl bg-crimson/10 px-4 py-3 text-[15px] font-medium text-crimson">{error}</p>}
      {!error && !initialData && <p className="text-[15px] text-ink/60">Loading…</p>}
      {initialData && (
        <CreateGroupForm
          initialData={initialData}
          submitLabel="Save changes"
          onCancel={() => navigate("/projects")}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
