import { useState } from "react";
import { forgotPassword } from "../lib/api";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPassword({ onBackToSignIn }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const inputBase = "w-full rounded-xl border bg-white px-4 py-3 text-[15px] text-ink outline-none transition-all placeholder:text-ink/40";
  const inputOk = "border-line hover:border-forest/40 focus:border-forest focus:ring-4 focus:ring-forest/10";
  const inputErr = "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100";

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return setError("Email address is required");
    if (!EMAIL_RE.test(email)) return setError("Please enter a valid email address");
    setError(""); setFormError(""); setBusy(true);
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setFormError(err.message || "Something went wrong, please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col items-center px-4 py-8 lg:py-12">
      <div className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-[0_2px_4px_rgba(20,26,24,.04),0_30px_60px_-36px_rgba(20,26,24,.35)] ring-1 ring-line">
        <div className="h-[3px] bg-[linear-gradient(90deg,#22433b,#d9a441_50%,#22433b)]" />

        {sent ? (
          <div className="flex flex-col items-center p-8 text-center sm:p-10">
            <div className="mb-5 grid h-16 w-16 place-items-center rounded-full bg-forest-soft text-forest ring-8 ring-forest-soft/50">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-[26px] font-extrabold tracking-tight text-ink">Check your inbox</h2>
            <p className="mt-2 max-w-sm text-[15px] leading-7 text-ink/65">
              If <span className="font-semibold text-ink">{email}</span> is registered with us, a reset link is on its way. It expires in 24 hours.
            </p>
            <p className="mt-3 text-[14px] text-ink/50">Didn't get it? Check your spam folder.</p>
            <button onClick={onBackToSignIn}
              className="mt-7 w-full rounded-xl bg-forest px-4 py-3 text-[15px] font-bold text-white transition-colors hover:bg-forest-deep">
              Back to sign in
            </button>
          </div>
        ) : (
          <div className="p-6 sm:p-8">
            <div className="mb-6 border-b border-line pb-5">
              <p className="text-[13px] font-bold uppercase tracking-wider text-gold-deep">Lost password</p>
              <h1 className="mt-1.5 text-[28px] font-extrabold leading-tight tracking-tight text-ink sm:text-[32px]">Reset your password</h1>
              <p className="mt-2 text-[15px] leading-7 text-ink/65">
                Enter the email address on your account and we'll send you a link to choose a new password.
              </p>
            </div>

            <form onSubmit={submit} noValidate className="space-y-5">
              {formError && (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-[14px] font-medium text-red-600 ring-1 ring-red-100">{formError}</p>
              )}
              <div>
                <label htmlFor="email" className="mb-2 block text-[15px] font-semibold text-ink">
                  Email address <span className="text-gold-deep">*</span>
                </label>
                <input id="email" type="email" autoComplete="email" placeholder="name@example.com"
                  value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  className={`${inputBase} ${error ? inputErr : inputOk}`} />
                {error && <p className="mt-1.5 text-[13.5px] font-medium text-red-600">{error}</p>}
              </div>

              <button type="submit" disabled={busy}
                className="inline-flex w-full items-center justify-center rounded-xl bg-forest px-6 py-3 text-[16px] font-bold text-white shadow-[0_12px_28px_-14px_rgba(34,67,59,.8)] transition-all hover:-translate-y-px hover:bg-forest-deep disabled:cursor-not-allowed disabled:opacity-70">
                {busy ? "Sending…" : "Send reset link"}
              </button>
            </form>
          </div>
        )}

        <div className="border-t border-line bg-mist px-7 py-4 text-center sm:px-10">
          <p className="text-[14.5px] text-ink/60">
            Remembered it?{" "}
            <button type="button" onClick={onBackToSignIn} className="font-bold text-forest underline-offset-4 hover:underline">Sign in</button>
          </p>
        </div>
      </div>
    </div>
  );
}