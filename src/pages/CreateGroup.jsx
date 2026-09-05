import { Link, useNavigate } from "react-router-dom";
import CreateGroupForm from "../components/CreateGroupForm";

export default function CreateGroup() {
  const navigate = useNavigate();

  const handleSave = (data) => {
    const newGroup = {
      id: Date.now(),
      name: data.name,
      description: data.description,
      members: 1,
      leader: "You",
      image: data.photo ? URL.createObjectURL(data.photo) : "/groups/std.png",
    };
    // Projects page picks this up from location.state and adds it to the list
    navigate("/projects", { state: { newGroup } });
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 pt-6">
      <nav className="flex items-center gap-2 text-[14.5px] text-ink/55">
        <Link to="/projects" className="hover:text-forest">Group</Link>
        <span>/</span>
        <span className="font-semibold text-ink">Create new group</span>
      </nav>

      <div className="mt-4 mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[36px] font-extrabold tracking-tight lg:text-[44px]">Create a new group</h1>
          <p className="mt-2 max-w-[56ch] text-[16px] leading-7 text-ink/60">
            Set up the basics, decide how people join, and choose who can see what.
          </p>
        </div>
        <Link to="/projects" className="rounded-xl border border-line bg-white px-4 py-2.5 text-[15px] font-semibold text-ink/70 hover:border-forest/40 hover:text-forest">
          ← Back to groups
        </Link>
      </div>

      <CreateGroupForm onCancel={() => navigate("/projects")} onSave={handleSave} />
    </div>
  );
}
