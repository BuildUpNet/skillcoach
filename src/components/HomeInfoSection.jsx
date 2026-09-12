import { useState } from "react";
import { Users, BookOpen, ClipboardList, X, ArrowRight } from "lucide-react";

// ---- Same content jo old skillcoach.org ke 3 cards + read-more me tha ----
const SECTIONS = {
  business: {
    icon: Users,
    title: "Business",
    heading: "Business Project Management Tools.",
    subheading:
      "We provide project management tools that help your business stay organized.",
    bullets: [
      "Project Management Tools.",
      "Increase efficiency.",
      "Stay Organized.",
      "Monitor Progress.",
      "Identify Leaders.",
    ],
    columns: [
      [
        "Create a New Project Group.",
        "Invite Team Members to the Group.",
        "Create a New Task for Members.",
        "Place Secure Information in the New Task.",
        "Save the Task, then make NEW Assignments.",
      ],
      [
        "Communicate in a Stress Free Manner",
        "New Comments can be made for Assignments.",
        "Members can easily Reply to Comments.",
        "Email Notices are sent for everything.",
        "Project Workspace Links are in the emails.",
      ],
      [
        "Get the Work Done Efficiently",
        "Members Check Off Assignments when done.",
        "Project Managers Review the work.",
        "Project Managers Submit the finished Task.",
        "Task Owners Accept the finished work.",
      ],
    ],
  },
  educate: {
    icon: BookOpen,
    title: "Educate",
    heading: "Educate people about Anything.",
    subheading:
      "Make it Automated if you want, so you can make the process much more efficient.",
    bullets: [
      "Lesson Building Software.",
      "Quiz Creation Software.",
      "Reach Global Audiences.",
      "Automate your lessons.",
      "Work from anywhere.",
    ],
    groups: [
      {
        label: "Getting Started",
        columns: [
          [
            "Create a New Group.",
            "Invite Members to the Group.",
            "Create a New Task then Make Assignments",
          ],
          [
            "Automate the process.",
            "Make a Task for ALL Current Members.",
            "Or, Make a Task for ALL NEW Members.",
          ],
          [
            "Easy to Manage",
            "Review the Progress of Each Member.",
            "Allow them to learn at their own pace.",
          ],
        ],
      },
      {
        label: "Features",
        columns: [
          [
            "Lesson building software",
            "Quiz creation Software",
            "Quiz Tracking Software",
            "Individual or Group training",
          ],
          [
            "Hands-off training for 24/7 results",
            "Educate people all over the world.",
            "From the comfort of your home.",
          ],
          [
            "Be Creative.",
            "You can reach a mass audience.",
            "Share what you know and help others.",
          ],
        ],
      },
    ],
    quote: "Our tools can help you teach absolutely anything!",
  },
  personal: {
    icon: ClipboardList,
    title: "Personal",
    heading: "Personal Project Management",
    subheading:
      "Designed to be easy for people to use; Never forget that important thing again.\nManage your life and your family while On The Go.",
    bullets: [
      "Organize your life.",
      "Remember important things.",
      "Manage Family Calendars.",
      "Easy access from phones.",
      "Your digital todo list.",
    ],
    columns: [
      [
        "Create a New Group.",
        "Invite Family Members.",
        "Or, Keep it for Yourself.",
        "Bookmark the page for easy access.",
      ],
      [
        "Create a New Task for Yourself.",
        "Example Title: Workonthego",
        "Open the Task & Save the Task Page.",
        "Save the Page Icon to your phone too.",
      ],
      [
        "Record todo items on the GO.",
        "1. Click the Icon on your Phone.",
        "2. Click NEW to make a New Assignment.",
        "3. Save the assignment for later review.",
      ],
    ],
  },
};

const GREEN = "#19352d";
const GREEN_DARK = "#122721";
const GOLD = "#d99b26";

function BulletCol({ items }) {
  return (
    <ul className="space-y-2">
      {items.map((t, i) => (
        <li key={i} className="flex items-start gap-2 text-[15px] leading-snug text-slate-700">
          <span
            className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: GOLD }}
          />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

function ExpandedPanel({ data }) {
  return (
    <div className="grid gap-8 md:grid-cols-3">
      {(data.columns
        ? [{ label: null, columns: data.columns }]
        : data.groups
      ).map((group, gi) => (
        <div key={gi} className={data.groups ? "md:col-span-3" : "contents"}>
          {group.label && (
            <h4
              className="mb-4 text-center text-sm font-semibold uppercase tracking-wide"
              style={{ color: GOLD }}
            >
              {group.label}
            </h4>
          )}
          <div className="grid gap-8 md:grid-cols-3">
            {group.columns.map((col, ci) => (
              <BulletCol key={ci} items={col} />
            ))}
          </div>
        </div>
      ))}
      {data.quote && (
        <p
          className="md:col-span-3 mt-2 text-center text-base font-medium italic"
          style={{ color: GREEN }}
        >
          “{data.quote}”
        </p>
      )}
    </div>
  );
}

export default function HomeInfoSection() {
  const [open, setOpen] = useState(null); // "business" | "educate" | "personal" | null

  const toggle = (key) => setOpen((cur) => (cur === key ? null : key));

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      {/* Cards row — fixed height, never overlaps */}
      <div className="grid gap-6 md:grid-cols-3">
        {Object.entries(SECTIONS).map(([key, data]) => {
          const Icon = data.icon;
          const isOpen = open === key;
          return (
            <div
              key={key}
              className={`rounded-2xl border bg-white p-6 shadow-sm transition-all duration-300 ${
                isOpen ? "ring-2" : "border-slate-100 hover:shadow-md"
              }`}
              style={isOpen ? { borderColor: GOLD, boxShadow: `0 0 0 2px ${GOLD}33` } : undefined}
            >
              <div
                className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ backgroundColor: GREEN_DARK }}
              >
                <Icon size={22} color={GOLD} />
              </div>
              <h3 className="mb-3 text-lg font-semibold" style={{ color: GREEN }}>
                {data.title}
              </h3>
              <ul className="mb-4 space-y-1.5">
                {data.bullets.map((b, i) => (
                  <li key={i} className="text-sm text-slate-600">
                    • {b}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => toggle(key)}
                className="inline-flex items-center gap-1 text-sm font-medium transition-colors"
                style={{ color: isOpen ? GOLD : GREEN }}
              >
                {isOpen ? "Close" : "Read more"}
                <ArrowRight
                  size={15}
                  className={`transition-transform duration-300 ${isOpen ? "rotate-90" : ""}`}
                />
              </button>
            </div>
          );
        })}
      </div>

      {/* Expandable detail panel — slides open BELOW the grid, full width, no overlap */}
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          {open && (
            <div
              className="mt-6 rounded-2xl border p-8"
              style={{ borderColor: `${GOLD}55`, backgroundColor: "#fbf8f1" }}
            >
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold" style={{ color: GREEN }}>
                    {SECTIONS[open].heading}
                  </h3>
                  <p className="mt-1 whitespace-pre-line text-sm text-slate-600">
                    {SECTIONS[open].subheading}
                  </p>
                </div>
                <button
                  onClick={() => setOpen(null)}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
              <ExpandedPanel data={SECTIONS[open]} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
