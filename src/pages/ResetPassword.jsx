import { useEffect, useState } from "react";
import { verifyResetCode, resetPassword } from "../lib/api";

export default function ResetPassword({ onSuccess, onBackToSignIn, onForgotAgain }) {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code") || "";
  const uid = params.get("uid") || "";

  const [status, setStatus] = useState("checking"); // checking | valid | invalid
  const [maskedEmail, setMaskedEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  const inputBase = "w-full rounded-xl border bg-white px-4 py-3 text-[15px] text-ink outline-none transition-all placeholder:text-ink/40";
  const inputOk = "border-line hover:border-forest/40 focus:border-forest focus:ring-4 focus:ring-forest/10";
  const inputErr = "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100";

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await verifyResetCode(code, uid);
        if (!alive) return;
        setMaskedEmail(r.email || "");
        setStatus("valid");
      } catch {
        if (alive) setStatus("invalid");
      }
    })();
    return () => { alive = false; };
  }, [code, uid]);

  const submit = async (e) => {
    e.preventDefault();
    const v = {};
    if (!pw) v.pw = "Password is required";
    else if (pw.length < 8) v.pw = "Password must be at least 8 characters in length";
    if (!pw2) v.pw2 = "Please confirm your password";
    else if (pw !== pw2) v.pw2 = "Passwords do not match";
    setErrors(v);
    if (Object.keys(v).length) return;

    setFormError(""); setBusy(true);
    try {
      const { user } = await resetPassword({ code, uid, password: pw });
      onSuccess?.(user);
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

        {status === "checking" && (
          <div className="p-10 text-center text-[15px] text-ink/60">Checking your reset link…</div>
        )}

        {status === "invalid" && (
          <div className="flex flex-col items-center p-8 text-center sm:p-10">
            <div className="mb-5 grid h-16 w-16 place-items-center rounded-full bg-red-50 text-red-500 ring-8 ring-red-50/60">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <h2 className="text-[26px] font-extrabold tracking-tight text-ink">Link expired</h2>
            <p className="mt-2 max-w-sm text-[15px] leading-7 text-ink/65">
              This reset link is invalid or older than 24 hours. Request a fresh one and we'll email it right away.
            </p>
            <button onClick={onForgotAgain}
              className="mt-7 w-full rounded-xl bg-forest px-4 py-3 text-[15px] font-bold text-white transition-colors hover:bg-forest-deep">
              Request a new link
            </button>
          </div>
        )}

        {status === "valid" && (
          <div className="p-6 sm:p-8">
            <div className="mb-6 border-b border-line pb-5">
              <p className="text-[13px] font-bold uppercase tracking-wider text-gold-deep">Almost done</p>
              <h1 className="mt-1.5 text-[28px] font-extrabold leading-tight tracking-tight text-ink sm:text-[32px]">Choose a new password</h1>
              {maskedEmail && (
                <p className="mt-2 text-[15px] leading-7 text-ink/65">
                  For the account <span className="font-semibold text-ink">{maskedEmail}</span>
                </p>
              )}
            </div>

            <form onSubmit={submit} noValidate className="space-y-5">
              {formError && (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-[14px] font-medium text-red-600 ring-1 ring-red-100">{formError}</p>
              )}

              <div>
                <label htmlFor="pw" className="mb-2 block text-[15px] font-semibold text-ink">
                  New password <span className="text-gold-deep">*</span>
                </label>
                <div className="relative">
                  <input id="pw" type={show ? "text" : "password"} autoComplete="new-password" placeholder="••••••••"
                    value={pw} onChange={(e) => { setPw(e.target.value); setErrors((p) => ({ ...p, pw: "" })); }}
                    className={`${inputBase} pr-12 ${errors.pw ? inputErr : inputOk}`} />
                  <button type="button" tabIndex={-1} onClick={() => setShow((s) => !s)}
                    aria-label={show ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-[13px] font-semibold text-ink/40 hover:text-forest">
                    {show ? "Hide" : "Show"}
                  </button>
                </div>
                <p className="mt-1.5 text-[13.5px] text-ink/55">At least 8 characters.</p>
                {errors.pw && <p className="mt-1.5 text-[13.5px] font-medium text-red-600">{errors.pw}</p>}
              </div>

              <div>
                <label htmlFor="pw2" className="mb-2 block text-[15px] font-semibold text-ink">
                  Confirm password <span className="text-gold-deep">*</span>
                </label>
                <input id="pw2" type={show ? "text" : "password"} autoComplete="new-password" placeholder="••••••••"
                  value={pw2} onChange={(e) => { setPw2(e.target.value); setErrors((p) => ({ ...p, pw2: "" })); }}
                  className={`${inputBase} ${errors.pw2 ? inputErr : inputOk}`} />
                {errors.pw2 && <p className="mt-1.5 text-[13.5px] font-medium text-red-600">{errors.pw2}</p>}
              </div>

              <button type="submit" disabled={busy}
                className="inline-flex w-full items-center justify-center rounded-xl bg-forest px-6 py-3 text-[16px] font-bold text-white shadow-[0_12px_28px_-14px_rgba(34,67,59,.8)] transition-all hover:-translate-y-px hover:bg-forest-deep disabled:cursor-not-allowed disabled:opacity-70">
                {busy ? "Saving…" : "Save password and sign in"}
              </button>
            </form>
          </div>
        )}

        <div className="border-t border-line bg-mist px-7 py-4 text-center sm:px-10">
          <p className="text-[14.5px] text-ink/60">
            <button type="button" onClick={onBackToSignIn} className="font-bold text-forest underline-offset-4 hover:underline">Back to sign in</button>
          </p>
        </div>
      </div>
    </div>
  );
}