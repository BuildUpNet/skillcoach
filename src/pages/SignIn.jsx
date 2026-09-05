import { useState } from "react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

export default function SignIn({ onNavigateToSignUp, onForgotPassword, onSuccess }) {
  const [formData, setFormData] = useState({ email: "", password: "", rememberMe: false });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
  };

  const validateField = (field, value) => {
    let error = "";
    if (field === "email") {
      if (!value.trim()) error = "Email address is required";
      else if (!EMAIL_RE.test(value)) error = "Please enter a valid email address";
    }
    if (field === "password" && !value) error = "Password is required";
    setErrors((p) => ({ ...p, [field]: error }));
    return error;
  };

  const handleBlur = (field) => {
    setTouched((p) => ({ ...p, [field]: true }));
    validateField(field, formData[field]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    const v = {};
    if (!formData.email.trim()) v.email = "Email address is required";
    else if (!EMAIL_RE.test(formData.email)) v.email = "Please enter a valid email address";
    if (!formData.password) v.password = "Password is required";
    setErrors(v);
    if (Object.keys(v).length === 0) {
      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setSubmitted(true);
        onSuccess?.(formData);
      }, 1000);
    }
  };

  const inputBase = "w-full rounded-xl border bg-white px-4 py-3 text-[15px] text-ink outline-none transition-all placeholder:text-ink/40";
  const inputOk = "border-line hover:border-forest/40 focus:border-forest focus:ring-4 focus:ring-forest/10";
  const inputErr = "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100";

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col items-center px-4 py-14 lg:py-20">
      <div className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-[0_2px_4px_rgba(20,26,24,.04),0_30px_60px_-36px_rgba(20,26,24,.35)] ring-1 ring-line">
        <div className="h-[3px] bg-[linear-gradient(90deg,#22433b,#d9a441_50%,#22433b)]" />

        {submitted ? (
          <div className="flex flex-col items-center p-10 text-center sm:p-12">
            <div className="mb-5 grid h-16 w-16 place-items-center rounded-full bg-forest-soft text-forest ring-8 ring-forest-soft/50">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-[28px] font-extrabold tracking-tight text-ink">Signed in successfully</h2>
            <p className="mt-2 max-w-sm text-[15px] text-ink/65">
              Welcome back, <span className="font-semibold text-ink">{formData.email}</span>. You are now logged in to your account.
            </p>
            <button
              onClick={() => { setSubmitted(false); setFormData({ email: "", password: "", rememberMe: false }); }}
              className="mt-7 w-full rounded-xl bg-forest px-4 py-3 text-[15px] font-bold text-white transition-colors hover:bg-forest-deep"
            >
              Sign out / switch account
            </button>
          </div>
        ) : (
          <div className="p-7 sm:p-10">
            <div className="mb-8 border-b border-line pb-6">
              <p className="text-[13px] font-bold uppercase tracking-wider text-gold-deep">Welcome back</p>
              <h1 className="mt-2 text-[32px] font-extrabold leading-tight tracking-tight text-ink sm:text-[36px]">Member sign in</h1>
              <p className="mt-3 text-[15px] leading-7 text-ink/65">
                Enter your details below. Don't have an account yet?{" "}
                <button type="button" onClick={onNavigateToSignUp} className="font-bold text-forest underline-offset-4 hover:underline">Sign up</button>{" "}first.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              <div>
                <label htmlFor="email" className="mb-2 block text-[15px] font-semibold text-ink">Email address <span className="text-gold-deep">*</span></label>
                <input id="email" name="email" type="email" autoComplete="email" placeholder="name@example.com"
                  value={formData.email} onChange={handleChange} onBlur={() => handleBlur("email")}
                  className={`${inputBase} ${errors.email && touched.email ? inputErr : inputOk}`} />
                {errors.email && touched.email && <ErrorText>{errors.email}</ErrorText>}
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-[15px] font-semibold text-ink">Password <span className="text-gold-deep">*</span></label>
                <div className="relative">
                  <input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="••••••••"
                    value={formData.password} onChange={handleChange} onBlur={() => handleBlur("password")}
                    className={`${inputBase} pr-12 ${errors.password && touched.password ? inputErr : inputOk}`} />
                  <button type="button" tabIndex={-1} onClick={() => setShowPassword((s) => !s)} aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-ink/40 transition-colors hover:text-forest">
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                </div>
                {errors.password && touched.password && <ErrorText>{errors.password}</ErrorText>}
              </div>

              <div className="flex flex-col gap-4 pt-1 sm:flex-row sm:items-center sm:justify-between">
                <label htmlFor="rememberMe" className="flex cursor-pointer select-none items-center gap-2.5 text-[15px] text-ink/80">
                  <input id="rememberMe" name="rememberMe" type="checkbox" checked={formData.rememberMe} onChange={handleChange} className="h-4.5 w-4.5 cursor-pointer rounded border-line accent-forest" />
                  Remember me
                </label>
                <button type="button" onClick={onForgotPassword} className="text-left text-[15px] font-semibold text-forest underline-offset-4 hover:underline">Forgot password?</button>
              </div>

              <button type="submit" disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center rounded-xl bg-forest px-6 py-3.5 text-[16px] font-bold text-white shadow-[0_12px_28px_-14px_rgba(34,67,59,.8)] transition-all hover:-translate-y-px hover:bg-forest-deep active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70">
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                    Signing in…
                  </span>
                ) : "Sign in"}
              </button>
            </form>
          </div>
        )}

        <div className="border-t border-line bg-mist px-7 py-4 text-center sm:px-10">
          <p className="text-[14.5px] text-ink/60">
            Don't have an account?{" "}
            <button type="button" onClick={onNavigateToSignUp} className="font-bold text-forest underline-offset-4 hover:underline">Sign up</button>
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
