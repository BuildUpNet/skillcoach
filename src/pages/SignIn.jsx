import React, { useState } from 'react';

export default function SignIn({ onNavigateToSignUp, onForgotPassword, onSuccess }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  const validateField = (field, value) => {
    let error = '';
    switch (field) {
      case 'email':
        if (!value.trim()) {
          error = 'Email address is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = 'Please enter a valid email address';
        }
        break;
      case 'password':
        if (!value) {
          error = 'Password is required';
        }
        break;
      default:
        break;
    }

    setErrors((prev) => ({ ...prev, [field]: error }));
    return error;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const allTouched = { email: true, password: true };
    setTouched(allTouched);

    const validationErrors = {};
    if (!formData.email.trim()) {
      validationErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      validationErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      validationErrors.password = 'Password is required';
    }

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setSubmitted(true);
        if (onSuccess) onSuccess(formData);
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
      {/* Main Card Container */}
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200/80 overflow-hidden transition-all duration-300">
        {submitted ? (
          /* Success Screen */
          <div className="p-8 sm:p-12 text-center flex flex-col items-center animate-fadeIn">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-5 ring-8 ring-emerald-50">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Signed In Successfully!</h2>
            <p className="text-slate-600 text-sm max-w-sm mb-6">
              Welcome back, <span className="font-semibold text-slate-900">{formData.email}</span>. You are now logged in to your account.
            </p>

            <button
              onClick={() => {
                setSubmitted(false);
                setFormData({ email: '', password: '', rememberMe: false });
              }}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition shadow hover:shadow-md cursor-pointer"
            >
              Sign Out / Switch Account
            </button>
          </div>
        ) : (
          /* Sign In Form Screen */
          <div className="p-6 sm:p-10">
            {/* Header */}
            <div className="mb-8 border-b border-slate-100 pb-5">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Member Sign In
              </h1>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                If you already have an account, please enter your details below. If you don't have one yet, please{' '}
                <button
                  type="button"
                  onClick={onNavigateToSignUp}
                  className="font-semibold text-emerald-600 hover:text-emerald-700 transition cursor-pointer hover:underline underline-offset-2"
                >
                  sign up
                </button>{' '}
                first.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              {/* Email Address */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-800 mb-1.5">
                  Email Address <span className="text-emerald-600">*</span>
                </label>
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={() => handleBlur('email')}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm bg-white border transition-all duration-200 outline-none text-slate-900 placeholder:text-slate-400 shadow-xs ${
                      errors.email && touched.email
                        ? 'border-red-400 focus:border-red-500 focus:ring-3 focus:ring-red-100'
                        : 'border-slate-300 hover:border-slate-400 focus:border-emerald-600 focus:ring-3 focus:ring-emerald-100'
                    }`}
                  />
                </div>
                {errors.email && touched.email && (
                  <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-slate-800 mb-1.5">
                  Password <span className="text-emerald-600">*</span>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={() => handleBlur('password')}
                    className={`w-full pl-3.5 pr-10 py-2.5 rounded-xl text-sm bg-white border transition-all duration-200 outline-none text-slate-900 placeholder:text-slate-400 shadow-xs ${
                      errors.password && touched.password
                        ? 'border-red-400 focus:border-red-500 focus:ring-3 focus:ring-red-100'
                        : 'border-slate-300 hover:border-slate-400 focus:border-emerald-600 focus:ring-3 focus:ring-emerald-100'
                    }`}
                  />
                  <button
                    type="button"
                    tabIndex="-1"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                        />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && touched.password && (
                  <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Controls Row: Submit Button & Remember Me */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Left: Sign In Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto min-w-[140px] inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-md shadow-emerald-600/25 hover:shadow-lg hover:shadow-emerald-600/30 focus:outline-none focus:ring-4 focus:ring-emerald-500/30 transition-all duration-200 transform active:scale-[0.99] disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer text-sm"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Signing In...
                    </span>
                  ) : (
                    'Sign In'
                  )}
                </button>

                {/* Right / Beside: Remember Me Checkbox */}
                <label htmlFor="rememberMe" className="flex items-center gap-2.5 text-sm text-slate-700 select-none cursor-pointer">
                  <input
                    id="rememberMe"
                    name="rememberMe"
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 focus:ring-offset-0 transition cursor-pointer accent-emerald-600"
                  />
                  <span>Remember Me</span>
                </label>
              </div>

              {/* Secondary Link: Forgot Password */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={onForgotPassword}
                  className="text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:underline underline-offset-2 transition-colors cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Card Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-center sm:px-10">
          <p className="text-xs text-slate-500">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onNavigateToSignUp}
              className="font-semibold text-emerald-600 hover:text-emerald-700 transition cursor-pointer hover:underline"
            >
              Sign Up
            </button>
          </p>
        </div>
      </div>

      {/* Trust & Security Micro Footer */}
      <div className="mt-8 flex items-center justify-center gap-6 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          256-Bit SSL Encryption
        </span>
        <span>•</span>
        <span>Privacy Protected</span>
        <span>•</span>
        <span>© {new Date().getFullYear()} Skillcoach</span>
      </div>
    </div>
  );
}
