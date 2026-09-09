// src/pages/CreateGroup.jsx — one page, two modes:
//   /group/create      -> create
//   /group/:id/edit    -> edit (loads group, pre-fills form, saves with updateGroup)
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import CreateGroupForm from "../components/CreateGroupForm";
import { createGroup, updateGroup, getGroup, setGroupPhoto, deleteGroupPhoto } from "../lib/api";
import { useToast } from "../components/Toast";

// API row  ->  form values
const toForm = (g) => ({
  name: g.title || "",
  description: g.description || "",
  category: g.category_id ?? "",
  searchable: g.search ? "yes" : "no",
  memberInvites: g.invite ? "yes" : "no",
  approval: g.approval ? "approve" : "auto",
  dailySummary: !!g.summary_emails,
  photoDataUrl: g.photo_data_url || null,
});

// form values  ->  API payload
const toPayload = (d) => ({
  title: d.name,
  description: d.description,
  category_id: d.category,
  search: d.searchable === "yes",
  invite: d.memberInvites === "yes",
  approval: d.approval === "approve",
  summary_emails: d.dailySummary,
});

// API row -> card used on Projects page
const toCard = (g, photo) => ({
  id: g.group_id,
  ownerId: g.user_id,
  name: g.title,
  description: g.description,
  members: g.member_count ?? 1,
  leader: "You",
  isOwner: true,
  image: photo || null,
  memberList: [],
});

export default function CreateGroup() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();
  const [initial, setInitial] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    getGroup(id)
      .then((g) => setInitial(toForm(g)))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleSave = async (data) => {
    setError("");
    try {
      if (isEdit) {
        const updated = await updateGroup(id, toPayload(data));

        // photo: changed -> upload, removed -> delete, unchanged -> nothing
        if (data.photoDataUrl && data.photoDataUrl !== initial?.photoDataUrl) {
          await setGroupPhoto(id, data.photoDataUrl);
        } else if (!data.photoDataUrl && initial?.photoDataUrl) {
          await deleteGroupPhoto(id);
        }
        toast("Group updated successfully");
        navigate(`/projects/${id}`, {
          state: { updatedGroup: toCard(updated, data.photoDataUrl) },
        });
        return;
      }

      const created = await createGroup(toPayload(data));
      if (data.photoDataUrl) await setGroupPhoto(created.group_id, data.photoDataUrl);
      toast("Group created successfully");
      // Projects page picks this up from location.state and adds it to the list
      navigate("/projects", { state: { newGroup: toCard(created, data.photoDataUrl) } });
    } catch (err) {
      setError(err.message);
      throw err; // let the form stop its "saving" state
    }
  };

  const backTo = isEdit ? `/projects/${id}` : "/projects";

  return (
    <div className="mx-auto max-w-[1200px] px-4 pt-6">
      <nav className="flex items-center gap-2 text-[14.5px] text-ink/55">
        <Link to="/projects" className="hover:text-forest">Group</Link>
        <span>/</span>
        {isEdit && initial && (
          <>
            <Link to={backTo} className="truncate max-w-[24ch] hover:text-forest">{initial.name}</Link>
            <span>/</span>
          </>
        )}
        <span className="font-semibold text-ink">{isEdit ? "Edit group" : "Create new group"}</span>
      </nav>

      <div className="mt-4 mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[36px] font-extrabold tracking-tight lg:text-[44px]">
            {isEdit ? `Edit ${initial?.name || "group"}` : "Create a new group"}
          </h1>
          <p className="mt-2 max-w-[56ch] text-[16px] leading-7 text-ink/60">
            {isEdit
              ? "Change the name, photo, category, or how people join. Members keep their access."
              : "Set up the basics, decide how people join, and choose who can see what."}
          </p>
        </div>
        <Link
          to={backTo}
          className="rounded-xl border border-line bg-white px-4 py-2.5 text-[15px] font-semibold text-ink/70 hover:border-forest/40 hover:text-forest"
        >
          ← {isEdit ? "Back to group" : "Back to groups"}
        </Link>
      </div>

      {error && (
        <p className="mb-6 rounded-xl border border-red-200 bg-red-50 p-3 text-center text-[14px] font-medium text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-[15px] text-ink/55">Loading group…</p>
      ) : (
        (!isEdit || initial) && (
          <CreateGroupForm
            key={id || "new"}              // remount when switching group -> form re-inits
            initialValues={initial}        // null on create
            submitLabel={isEdit ? "Save changes" : "Create group"}
            onCancel={() => navigate(backTo)}
            onSave={handleSave}
          />
        )
      )}
    </div>
  );
}
