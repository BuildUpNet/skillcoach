import { useState } from "react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SLUG_RE = /^[a-zA-Z0-9_-]+$/;

const timezoneOptions = [
  "(UTC-12) International Date Line West", "(UTC-11) Midway Island, Samoa", "(UTC-10) Hawaii", "(UTC-9) Alaska",
  "(UTC-8) Pacific Time (US & Canada)", "(UTC-7) Mountain Time (US & Canada)", "(UTC-6) Central Time (US & Canada)",
  "(UTC-5) Eastern Time (US & Canada)", "(UTC-4) Atlantic Time (Canada)", "(UTC-3) Buenos Aires, Georgetown",
  "(UTC+0) Greenwich Mean Time : Dublin, London", "(UTC+1) Amsterdam, Berlin, Rome, Paris", "(UTC+2) Athens, Bucharest, Istanbul",
  "(UTC+3) Moscow, St. Petersburg, Kuwait", "(UTC+5:30) Chennai, Kolkata, Mumbai, New Delhi",
  "(UTC+8) Beijing, Chongqing, Hong Kong, Singapore", "(UTC+9) Tokyo, Seoul, Osaka", "(UTC+10) Sydney, Melbourne, Brisbane",
];

const languageOptions = [
  ["English", "English (US)"], ["English (UK)", "English (UK)"], ["Spanish", "Español (Spanish)"], ["French", "Français (French)"],
  ["German", "Deutsch (German)"], ["Italian", "Italiano (Italian)"], ["Portuguese", "Português (Portuguese)"],
  ["Japanese", "日本語 (Japanese)"], ["Korean", "한국어 (Korean)"], ["Chinese", "简体中文 (Simplified Chinese)"],
  ["Hindi", "हिन्दी (Hindi)"], ["Arabic", "العربية (Arabic)"],
];

const initialData = {
  firstName: "", lastName: "", displayName: "", email: "", password: "", passwordAgain: "",
  timezone: "(UTC-8) Pacific Time (US & Canada)", language: "English", agreeToTerms: false,
};

const inputBase = "w-full rounded-xl border bg-white px-4 py-3 text-[15px] text-ink outline-none transition-all placeholder:text-ink/40";
const inputOk = "border-line hover:border-forest/40 focus:border-forest focus:ring-4 focus:ring-forest/10";
const inputErr = "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100";
const labelCls = "mb-2 block text-[15px] font-semibold text-ink";
const hintCls = "mt-1.5 text-[13.5px] text-ink/55";

function ErrorText({ children }) {
  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-[13.5px] font-medium text-red-600">
      <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      {children}
    </p>
  );
}

function EyeButton({ shown, onToggle, label }) {
  return (
    <button type="button" tabIndex={-1} onClick={onToggle} aria-label={shown ? `Hide ${label}` : `Show ${label}`}
      className="absolute inset-y-0 right-0 flex items-center pr-4 text-ink/40 transition-colors hover:text-forest">
      {shown ? (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
      ) : (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
      )}
    </button>
  );
}

function Chevron() {
  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-ink/40">
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
    </div>
  );
}

export default function SignUp({ onNavigateToLogin, onSuccess }) {
  const [formData, setFormData] = useState(initialData);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordAgain, setShowPasswordAgain] = useState(false);
  const [captchaStatus, setCaptchaStatus] = useState("idle");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
  };

  const validateField = (field, value, data = formData) => {
    let error = "";
    switch (field) {
      case "firstName": if (!value.trim()) error = "First name is required"; break;
      case "lastName": if (!value.trim()) error = "Last name is required"; break;
      case "displayName":
        if (!value.trim()) error = "Display name is required";
        else if (!SLUG_RE.test(value)) error = "Only letters, numbers, hyphens and underscores allowed";
        break;
      case "email":
        if (!value.trim()) error = "Email address is required";
        else if (!EMAIL_RE.test(value)) error = "Please enter a valid email address";
        break;
      case "password":
        if (!value) error = "Password is required";
        else if (value.length < 6) error = "Password must be at least 6 characters in length";
        break;
      case "passwordAgain":
        if (!value) error = "Please confirm your password";
        else if (value !== data.password) error = "Passwords do not match";
        break;
      case "agreeToTerms": if (!value) error = "You must agree to the terms of service"; break;
      default: break;
    }
    return error;
  };

  const handleBlur = (field) => {
    setTouched((p) => ({ ...p, [field]: true }));
    setErrors((p) => ({ ...p, [field]: validateField(field, formData[field]) }));
  };

  const handleCaptchaClick = () => {
    if (captchaStatus !== "idle") return;
    setCaptchaStatus("verifying");
    setErrors((p) => ({ ...p, captcha: "" }));
    setTimeout(() => setCaptchaStatus("verified"), 900);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched(Object.fromEntries(Object.keys(formData).map((k) => [k, true])));

    const v = {};
    Object.keys(formData).forEach((k) => {
      const err = validateField(k, formData[k]);
      if (err) v[k] = err;
    });
    if (captchaStatus !== "verified") v.captcha = "Please complete the human verification.";
    setErrors(v);

    if (Object.keys(v).length === 0) {
      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setSubmitted(true);
        onSuccess?.(formData);
      }, 1200);
    }
  };

  const cleanSlug = formData.displayName ? formData.displayName.toLowerCase().replace(/[^a-z0-9_-]/g, "") : "yourname";
  const err = (f) => errors[f] && touched[f];

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col items-center px-4 py-14 lg:py-20">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-[0_2px_4px_rgba(20,26,24,.04),0_30px_60px_-36px_rgba(20,26,24,.35)] ring-1 ring-line">
        <div className="h-[3px] bg-[linear-gradient(90deg,#22433b,#d9a441_50%,#22433b)]" />

        {submitted ? (
          <div className="flex flex-col items-center p-10 text-center sm:p-12">
            <div className="mb-5 grid h-16 w-16 place-items-center rounded-full bg-forest-soft text-forest ring-8 ring-forest-soft/50">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-[28px] font-extrabold tracking-tight text-ink">Account created</h2>
            <p className="mt-2 max-w-md text-[15px] leading-7 text-ink/65">
              Welcome aboard, <span className="font-semibold text-ink">{formData.firstName}</span>! We sent a confirmation link to{" "}
              <span className="font-semibold text-ink">{formData.email}</span>.
            </p>

            <div className="mt-6 w-full space-y-2 rounded-2xl bg-mist p-5 text-left text-[14.5px] text-ink/70 ring-1 ring-line">
              <div className="flex flex-wrap justify-between gap-2 border-b border-line py-1.5">
                <span className="text-ink/50">Profile URL</span>
                <span className="font-mono text-[13.5px] font-semibold text-forest">skillcoach.org/profile/{cleanSlug}</span>
              </div>
              <div className="flex flex-wrap justify-between gap-2 border-b border-line py-1.5">
                <span className="text-ink/50">Timezone</span><span className="font-medium text-ink">{formData.timezone}</span>
              </div>
              <div className="flex flex-wrap justify-between gap-2 py-1.5">
                <span className="text-ink/50">Language</span><span className="font-medium text-ink">{formData.language}</span>
              </div>
            </div>

            <button
              onClick={() => { setSubmitted(false); setFormData(initialData); setCaptchaStatus("idle"); setTouched({}); setErrors({}); }}
              className="mt-7 w-full rounded-xl bg-forest px-4 py-3 text-[15px] font-bold text-white transition-colors hover:bg-forest-deep"
            >
              Create another account
            </button>
          </div>
        ) : (
          <div className="p-7 sm:p-10">
            <div className="mb-8 border-b border-line pb-6">
              <p className="text-[13px] font-bold uppercase tracking-wider text-gold-deep">Get started</p>
              <h1 className="mt-2 text-[32px] font-extrabold leading-tight tracking-tight text-ink sm:text-[36px]">Create your account</h1>
              <p className="mt-3 text-[15px] leading-7 text-ink/65">Join SkillCoach to connect with coaches and level up your skills.</p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="firstName" className={labelCls}>First name <span className="text-gold-deep">*</span></label>
                  <input id="firstName" name="firstName" type="text" autoComplete="given-name" placeholder="e.g. Alex"
                    value={formData.firstName} onChange={handleChange} onBlur={() => handleBlur("firstName")}
                    className={`${inputBase} ${err("firstName") ? inputErr : inputOk}`} />
                  {err("firstName") && <ErrorText>{errors.firstName}</ErrorText>}
                </div>
                <div>
                  <label htmlFor="lastName" className={labelCls}>Last name <span className="text-gold-deep">*</span></label>
                  <input id="lastName" name="lastName" type="text" autoComplete="family-name" placeholder="e.g. Morgan"
                    value={formData.lastName} onChange={handleChange} onBlur={() => handleBlur("lastName")}
                    className={`${inputBase} ${err("lastName") ? inputErr : inputOk}`} />
                  {err("lastName") && <ErrorText>{errors.lastName}</ErrorText>}
                </div>
              </div>

              <div>
                <label htmlFor="displayName" className={labelCls}>Display name <span className="text-gold-deep">*</span></label>
                <div className={`flex overflow-hidden rounded-xl border bg-white transition-all ${err("displayName") ? inputErr : inputOk} focus-within:ring-4`}>
                  <span className="hidden select-none items-center border-r border-line bg-mist px-3.5 font-mono text-[13px] text-ink/50 sm:flex">skillcoach.org/profile/</span>
                  <input id="displayName" name="displayName" type="text" placeholder="yourname"
                    value={formData.displayName} onChange={handleChange} onBlur={() => handleBlur("displayName")}
                    className="w-full bg-transparent px-4 py-3 text-[15px] text-ink outline-none placeholder:text-ink/40" />
                </div>
                <p className={hintCls}>
                  Your profile link will be{" "}
                  <span className="rounded bg-forest-soft px-1.5 py-0.5 font-mono text-[13px] font-medium text-forest">skillcoach.org/profile/{cleanSlug}</span>
                </p>
                {err("displayName") && <ErrorText>{errors.displayName}</ErrorText>}
              </div>

              <div>
                <label htmlFor="email" className={labelCls}>Email address <span className="text-gold-deep">*</span></label>
                <input id="email" name="email" type="email" autoComplete="email" placeholder="name@example.com"
                  value={formData.email} onChange={handleChange} onBlur={() => handleBlur("email")}
                  className={`${inputBase} ${err("email") ? inputErr : inputOk}`} />
                <p className={hintCls}>You'll use this email to sign in.</p>
                {err("email") && <ErrorText>{errors.email}</ErrorText>}
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="password" className={labelCls}>Password <span className="text-gold-deep">*</span></label>
                  <div className="relative">
                    <input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="••••••••"
                      value={formData.password} onChange={handleChange} onBlur={() => handleBlur("password")}
                      className={`${inputBase} pr-12 ${err("password") ? inputErr : inputOk}`} />
                    <EyeButton shown={showPassword} onToggle={() => setShowPassword((s) => !s)} label="password" />
                  </div>
                  <p className={hintCls}>At least 6 characters.</p>
                  {err("password") && <ErrorText>{errors.password}</ErrorText>}
                </div>
                <div>
                  <label htmlFor="passwordAgain" className={labelCls}>Confirm password <span className="text-gold-deep">*</span></label>
                  <div className="relative">
                    <input id="passwordAgain" name="passwordAgain" type={showPasswordAgain ? "text" : "password"} autoComplete="new-password" placeholder="••••••••"
                      value={formData.passwordAgain} onChange={handleChange} onBlur={() => handleBlur("passwordAgain")}
                      className={`${inputBase} pr-12 ${err("passwordAgain") ? inputErr : inputOk}`} />
                    <EyeButton shown={showPasswordAgain} onToggle={() => setShowPasswordAgain((s) => !s)} label="password confirmation" />
                  </div>
                  <p className={hintCls}>Enter the same password again.</p>
                  {err("passwordAgain") && <ErrorText>{errors.passwordAgain}</ErrorText>}
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="timezone" className={labelCls}>Timezone</label>
                  <div className="relative">
                    <select id="timezone" name="timezone" value={formData.timezone} onChange={handleChange}
                      className={`${inputBase} ${inputOk} cursor-pointer appearance-none pr-12`}>
                      {timezoneOptions.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                    </select>
                    <Chevron />
                  </div>
                </div>
                <div>
                  <label htmlFor="language" className={labelCls}>Language</label>
                  <div className="relative">
                    <select id="language" name="language" value={formData.language} onChange={handleChange}
                      className={`${inputBase} ${inputOk} cursor-pointer appearance-none pr-12`}>
                      {languageOptions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                    <Chevron />
                  </div>
                </div>
              </div>

              {/* captcha */}
              <div>
                <button type="button" onClick={handleCaptchaClick}
                  className={`flex w-full max-w-[320px] items-center justify-between rounded-xl border p-4 text-left transition-all select-none ${
                    errors.captcha ? "border-red-400 bg-red-50/40"
                    : captchaStatus === "verified" ? "border-forest/40 bg-forest-soft/60"
                    : "border-line bg-mist hover:border-forest/40"
                  }`}>
                  <span className="flex items-center gap-3">
                    <span className={`grid h-7 w-7 place-items-center rounded-md border-2 transition-colors ${
                      captchaStatus === "verified" ? "border-forest bg-forest text-white"
                      : captchaStatus === "verifying" ? "border-forest bg-white"
                      : "border-ink/30 bg-white"
                    }`}>
                      {captchaStatus === "verified" && <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                      {captchaStatus === "verifying" && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-forest border-t-transparent" />}
                    </span>
                    <span className="text-[15px] font-semibold text-ink">I am human</span>
                  </span>
                  <span className="flex flex-col items-center pl-2">
                    <svg className="h-7 w-7 text-gold-deep" viewBox="0 0 32 32" fill="currentColor">
                      <path d="M16 2C8.268 2 2 8.268 2 16s6.268 14 14 14 14-6.268 14-14S23.732 2 16 2zm0 4a10 10 0 1 1 0 20 10 10 0 0 1 0-20z" opacity="0.25" />
                      <path d="M22.5 11.5l-8 9-4.5-4.5 1.5-1.5 3 3 6.5-7.5 1.5 1.5z" />
                    </svg>
                    <span className="mt-0.5 text-[10px] font-bold leading-none text-ink/50">hCaptcha</span>
                  </span>
                </button>
                {errors.captcha && <ErrorText>{errors.captcha}</ErrorText>}
              </div>

              {/* terms */}
              <div>
                <label htmlFor="agreeToTerms" className="flex cursor-pointer select-none items-start gap-3 text-[15px] text-ink/75">
                  <input id="agreeToTerms" name="agreeToTerms" type="checkbox" checked={formData.agreeToTerms} onChange={handleChange}
                    className="mt-1 h-4.5 w-4.5 cursor-pointer rounded border-line accent-forest" />
                  <span>
                    I have read and agree to the{" "}
                    <a href="#terms" onClick={(e) => e.preventDefault()} className="font-semibold text-forest underline underline-offset-4">terms of service</a>.
                  </span>
                </label>
                {err("agreeToTerms") && <ErrorText>{errors.agreeToTerms}</ErrorText>}
              </div>

              <button type="submit" disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center rounded-xl bg-forest px-6 py-3.5 text-[16px] font-bold text-white shadow-[0_12px_28px_-14px_rgba(34,67,59,.8)] transition-all hover:-translate-y-px hover:bg-forest-deep active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70">
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                    Creating account…
                  </span>
                ) : "Create account"}
              </button>
            </form>
          </div>
        )}

        <div className="border-t border-line bg-mist px-7 py-4 text-center sm:px-10">
          <p className="text-[14.5px] text-ink/60">
            Already have an account?{" "}
            <button type="button" onClick={onNavigateToLogin} className="font-bold text-forest underline-offset-4 hover:underline">Sign in</button>
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13.5px] text-ink/50">
        <span className="flex items-center gap-1.5">
          <svg className="h-4 w-4 text-gold-deep" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
          256-bit SSL encryption
        </span>
        <span>Privacy protected</span>
      </div>
    </div>
  );
}