import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronDown, ChevronLeft, ChevronRight, Sparkles, GraduationCap } from "lucide-react";

const FOREST = "#22433B";
const FOREST_DARK = "#16302A";
const GOLD = "#D9A441";
const MIST = "#F3F6F4";

const CATEGORY_OPTIONS = [
  "select",
  "Arts & Culture",
  "Business",
  "Entertainment",
  "Family & Home",
  "Health & Wellness",
  "Sports",
  "Technology",
  "Mathematics",
  "Design",
  "Engineering",
  "Languages",
  "Economics & Social Science",
  "Economics",
  "Science",
  "Investing",
  "Law",
  "demo Category",
];

const QUALIFICATIONS = [
  "I am or was a professor",
  "I am or was a teacher",
  "I am or was a business professional",
  "I am or was a business owner",
  "I am or was a doctor",
  "I have a graduate degree",
  "I have a bachelor of degree",
  "I am well studied in my field",
  "I have hands-on experience",
  "I have practical knowledge",
  "I am a tutor",
];

const STEPS = [
  { n: 1, label: "Interest" },
  { n: 2, label: "Category" },
  { n: 3, label: "About You" },
  { n: 4, label: "Qualifications" },
  { n: 5, label: "Done" },
];

function range(start, end) {
  const out = [];
  for (let i = start; i <= end; i++) out.push(i);
  return out;
}

const AGE_OPTIONS = range(10, 100);
const EXPERIENCE_OPTIONS = range(0, 10);

function Stepper({ step }) {
  const current = STEPS[step - 1];
  return (
    <div className="mb-10">
      <div className="flex items-end justify-between mb-3">
        <h3 className="text-lg font-bold tracking-tight" style={{ color: FOREST_DARK }}>
          {current.label}
        </h3>
        <span className="text-sm font-semibold" style={{ color: "#8A9691" }}>
          Step {step} of {STEPS.length}
        </span>
      </div>
      <div className="flex gap-1.5">
        {STEPS.map((s) => {
          const isDone = step > s.n;
          const isActive = step === s.n;
          return (
            <div
              key={s.n}
              className="h-2 flex-1 rounded-full overflow-hidden"
              style={{ backgroundColor: "#E3E9E6" }}
            >
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: isDone || isActive ? "100%" : "0%",
                  backgroundColor: isDone ? FOREST : isActive ? GOLD : "transparent",
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="block text-base font-semibold mb-2" style={{ color: FOREST_DARK }}>
        {label}
      </span>
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          className="w-full appearance-none rounded-xl border-2 bg-white px-4 py-3 pr-10 text-base font-medium outline-none transition-colors focus:border-[#D9A441]"
          style={{ borderColor: "#D7E0DC", color: FOREST_DARK }}
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <ChevronDown
          size={20}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
          style={{ color: FOREST }}
        />
      </div>
    </label>
  );
}

function PrimaryButton({ children, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-base font-bold transition-transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ backgroundColor: GOLD, color: FOREST_DARK }}
    >
      {children}
    </button>
  );
}

function GhostButton({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-base font-bold border-2 transition-colors hover:bg-white"
      style={{ borderColor: FOREST, color: FOREST_DARK }}
    >
      {children}
    </button>
  );
}

export default function BecomeSkillCoach() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [wantToJoin, setWantToJoin] = useState("");
  const [categories, setCategories] = useState(["Mathematics", "Investing", "Investing"]);
  const [age, setAge] = useState(23);
  const [experience, setExperience] = useState(8);
  const [qualifications, setQualifications] = useState([
    "I am or was a professor",
    "I am or was a business professional",
  ]);
  const [description, setDescription] = useState("");

  const goNext = () => setStep((s) => Math.min(5, s + 1));
  const goBack = () => setStep((s) => Math.max(1, s - 1));

  const toggleQualification = (q) => {
    setQualifications((prev) =>
      prev.includes(q) ? prev.filter((x) => x !== q) : [...prev, q]
    );
  };

  const updateCategory = (idx, val) => {
    setCategories((prev) => prev.map((c, i) => (i === idx ? val : c)));
  };

  return (
    <div className="min-h-screen w-full flex items-start justify-center py-12 px-4" style={{ backgroundColor: MIST, fontFamily: "Manrope, sans-serif" }}>
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-extrabold" style={{ color: FOREST_DARK }}>
              Become a SkillCoach
            </h1>
            <p className="text-base mt-1" style={{ color: "#5C6F69" }}>
              Share what you know with the world.
            </p>
          </div>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold"
            style={{ backgroundColor: FOREST, color: GOLD }}
          >
            <Sparkles size={16} />
            It's free
          </span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-10" style={{ boxShadow: "0 20px 45px -20px rgba(22,48,42,0.25)" }}>
          <Stepper step={step} />

          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold mb-3" style={{ color: FOREST_DARK }}>
                Tell us why you're here
              </h2>
              <p className="text-base leading-relaxed mb-6" style={{ color: "#5C6F69" }}>
                Thank you for taking part in our effort to provide free education to the world!
                We believe everyone has something they can share, and we look forward to learning
                what you can contribute. Becoming a SkillCoach is free, but we want to know why you
                think you are qualified, so there is a short approval process. This won't take long
                at all.
              </p>

              <p className="text-base font-semibold mb-4" style={{ color: FOREST_DARK }}>
                Do you want to become a SkillCoach so that you can produce lessons, help teach
                others, use our free lesson building software, and potentially earn income from
                your lessons (if you want)?
              </p>

              <div className="flex gap-4">
                {["Yes", "No"].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setWantToJoin(opt)}
                    className="flex-1 rounded-2xl border-2 py-4 text-base font-bold transition-colors"
                    style={{
                      borderColor: wantToJoin === opt ? GOLD : "#D7E0DC",
                      backgroundColor: wantToJoin === opt ? "#FBF1DF" : "#FFFFFF",
                      color: FOREST_DARK,
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold mb-3" style={{ color: FOREST_DARK }}>
                Upgrade category
              </h2>
              <p className="text-base mb-6" style={{ color: "#5C6F69" }}>
                Great! What subject or subjects will you produce lessons on (give us your best
                guess)?
              </p>
              <div className="space-y-5">
                <SelectField
                  label="Category 1"
                  value={categories[0]}
                  onChange={(e) => updateCategory(0, e.target.value)}
                  options={CATEGORY_OPTIONS}
                />
                <SelectField
                  label="Category 2"
                  value={categories[1]}
                  onChange={(e) => updateCategory(1, e.target.value)}
                  options={CATEGORY_OPTIONS}
                />
                <SelectField
                  label="Category 3"
                  value={categories[2]}
                  onChange={(e) => updateCategory(2, e.target.value)}
                  options={CATEGORY_OPTIONS}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-xl font-bold mb-3" style={{ color: FOREST_DARK }}>
                Add age and experience
              </h2>
              <p className="text-base mb-6" style={{ color: "#5C6F69" }}>
                A couple of quick details so we can match your lessons to the right audience.
              </p>
              <div className="space-y-5">
                <SelectField
                  label="How old are you?"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  options={AGE_OPTIONS}
                />
                <SelectField
                  label="How many years of experience do you have in this field?"
                  value={experience}
                  onChange={(e) => setExperience(Number(e.target.value))}
                  options={EXPERIENCE_OPTIONS}
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="text-xl font-bold mb-3" style={{ color: FOREST_DARK }}>
                Add qualification
              </h2>
              <p className="text-base mb-4" style={{ color: "#5C6F69" }}>
                Tell us a little more about your qualifications.
              </p>

              <p className="text-base font-semibold mb-3" style={{ color: FOREST_DARK }}>
                Which one of these best describes you?
              </p>
              <div className="grid sm:grid-cols-2 gap-3 mb-6">
                {QUALIFICATIONS.map((q) => {
                  const checked = qualifications.includes(q);
                  return (
                    <button
                      key={q}
                      onClick={() => toggleQualification(q)}
                      className="flex items-start gap-3 rounded-xl border-2 px-4 py-3 text-left text-base font-medium transition-colors"
                      style={{
                        borderColor: checked ? GOLD : "#D7E0DC",
                        backgroundColor: checked ? "#FBF1DF" : "#FFFFFF",
                        color: FOREST_DARK,
                      }}
                    >
                      <span
                        className="mt-0.5 w-5 h-5 rounded-md flex items-center justify-center shrink-0 border-2"
                        style={{
                          borderColor: checked ? GOLD : "#C7D2CD",
                          backgroundColor: checked ? GOLD : "transparent",
                        }}
                      >
                        {checked && <Check size={14} strokeWidth={3} color={FOREST_DARK} />}
                      </span>
                      {q}
                    </button>
                  );
                })}
              </div>

              <label className="block">
                <span className="block text-base font-semibold mb-2" style={{ color: FOREST_DARK }}>
                  Description (optional)
                </span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="none"
                  className="w-full rounded-xl border-2 bg-white px-4 py-3 text-base outline-none transition-colors focus:border-[#D9A441] resize-none"
                  style={{ borderColor: "#D7E0DC", color: FOREST_DARK }}
                />
              </label>
            </div>
          )}

          {step === 5 && (
            <div className="text-center py-4">
              <div
                className="mx-auto mb-6 w-16 h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: FOREST }}
              >
                <GraduationCap size={32} color={GOLD} />
              </div>
              <h2 className="text-2xl font-extrabold mb-3" style={{ color: FOREST_DARK }}>
                Thank you for your request
              </h2>
              <p className="text-base leading-relaxed max-w-md mx-auto mb-8" style={{ color: "#5C6F69" }}>
                We have submitted your request to become a SkillCoach to our approval department
                and they will get back to you very quickly. Watch your email and the notifications
                section in the SkillCoach menu for the approval notice. Once it comes you will be
                able to start publishing lessons and using our software.
              </p>
              <PrimaryButton onClick={() => navigate("/home")}>Back to Home</PrimaryButton>
            </div>
          )}

          {/* Footer nav */}
          {step < 5 && (
            <div className="flex items-center justify-between mt-9 pt-6 border-t" style={{ borderColor: "#EBEFED" }}>
              {step > 1 ? (
                <GhostButton onClick={goBack}>
                  <ChevronLeft size={18} /> Back
                </GhostButton>
              ) : (
                <span />
              )}
              <PrimaryButton
                onClick={goNext}
                disabled={step === 1 && !wantToJoin}
              >
                Next <ChevronRight size={18} />
              </PrimaryButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
