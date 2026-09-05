import React, { useState } from 'react';

export default function SignUp({ onNavigateToLogin, onSuccess }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    displayName: '',
    email: '',
    password: '',
    passwordAgain: '',
    timezone: '(UTC-8) Pacific Time (US & Canada)',
    language: 'English',
    agreeToTerms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordAgain, setShowPasswordAgain] = useState(false);
  const [captchaStatus, setCaptchaStatus] = useState('idle'); 
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const timezoneOptions = [
    { value: '(UTC-12) International Date Line West', label: '(UTC-12) International Date Line West' },
    { value: '(UTC-11) Midway Island, Samoa', label: '(UTC-11) Midway Island, Samoa' },
    { value: '(UTC-10) Hawaii', label: '(UTC-10) Hawaii' },
    { value: '(UTC-9) Alaska', label: '(UTC-9) Alaska' },
    { value: '(UTC-8) Pacific Time (US & Canada)', label: '(UTC-8) Pacific Time (US & Canada)' },
    { value: '(UTC-7) Mountain Time (US & Canada)', label: '(UTC-7) Mountain Time (US & Canada)' },
    { value: '(UTC-6) Central Time (US & Canada)', label: '(UTC-6) Central Time (US & Canada)' },
    { value: '(UTC-5) Eastern Time (US & Canada)', label: '(UTC-5) Eastern Time (US & Canada)' },
    { value: '(UTC-4) Atlantic Time (Canada)', label: '(UTC-4) Atlantic Time (Canada)' },
    { value: '(UTC-3) Buenos Aires, Georgetown', label: '(UTC-3) Buenos Aires, Georgetown' },
    { value: '(UTC+0) Greenwich Mean Time : Dublin, London', label: '(UTC+0) Greenwich Mean Time : Dublin, London' },
    { value: '(UTC+1) Amsterdam, Berlin, Rome, Paris', label: '(UTC+1) Amsterdam, Berlin, Rome, Paris' },
    { value: '(UTC+2) Athens, Bucharest, Istanbul', label: '(UTC+2) Athens, Bucharest, Istanbul' },
    { value: '(UTC+3) Moscow, St. Petersburg, Kuwait', label: '(UTC+3) Moscow, St. Petersburg, Kuwait' },
    { value: '(UTC+5:30) Chennai, Kolkata, Mumbai, New Delhi', label: '(UTC+5:30) Chennai, Kolkata, Mumbai, New Delhi' },
    { value: '(UTC+8) Beijing, Chongqing, Hong Kong, Singapore', label: '(UTC+8) Beijing, Chongqing, Hong Kong, Singapore' },
    { value: '(UTC+9) Tokyo, Seoul, Osaka', label: '(UTC+9) Tokyo, Seoul, Osaka' },
    { value: '(UTC+10) Sydney, Melbourne, Brisbane', label: '(UTC+10) Sydney, Melbourne, Brisbane' },
  ];

  const languageOptions = [
    { value: 'English', label: 'English (US)' },
    { value: 'English (UK)', label: 'English (UK)' },
    { value: 'Spanish', label: 'Español (Spanish)' },
    { value: 'French', label: 'Français (French)' },
    { value: 'German', label: 'Deutsch (German)' },
    { value: 'Italian', label: 'Italiano (Italian)' },
    { value: 'Portuguese', label: 'Português (Portuguese)' },
    { value: 'Japanese', label: '日本語 (Japanese)' },
    { value: 'Korean', label: '한국어 (Korean)' },
    { value: 'Chinese', label: '简体中文 (Simplified Chinese)' },
    { value: 'Hindi', label: 'हिन्दी (Hindi)' },
    { value: 'Arabic', label: 'العربية (Arabic)' },
  ];

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
      case 'firstName':
        if (!value.trim()) error = 'First name is required';
        break;
      case 'lastName':
        if (!value.trim()) error = 'Last name is required';
        break;
      case 'displayName':
        if (!value.trim()) {
          error = 'Display name is required';
        } else if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
          error = 'Only letters, numbers, hyphens and underscores allowed';
        }
        break;
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
        } else if (value.length < 6) {
          error = 'Password must be at least 6 characters in length';
        }
        break;
      case 'passwordAgain':
        if (!value) {
          error = 'Please confirm your password';
        } else if (value !== formData.password) {
          error = 'Passwords do not match';
        }
        break;
      case 'agreeToTerms':
        if (!value) {
          error = 'You must agree to the terms of service';
        }
        break;
      default:
        break;
    }

    setErrors((prev) => ({ ...prev, [field]: error }));
    return error;
  };

  const handleCaptchaClick = () => {
    if (captchaStatus === 'verified' || captchaStatus === 'verifying') return;

    setCaptchaStatus('verifying');
    setErrors((prev) => ({ ...prev, captcha: '' }));

    setTimeout(() => {
      setCaptchaStatus('verified');
    }, 900);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

   
    const allTouched = Object.keys(formData).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);

    const validationErrors = {};
    if (!formData.firstName.trim()) validationErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) validationErrors.lastName = 'Last name is required';
    if (!formData.displayName.trim()) {
      validationErrors.displayName = 'Display name is required';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.displayName)) {
      validationErrors.displayName = 'Only letters, numbers, hyphens and underscores allowed';
    }
    if (!formData.email.trim()) {
      validationErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      validationErrors.email = 'Please enter a valid email address';
    }
    if (!formData.password) {
      validationErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      validationErrors.password = 'Passwords must be at least 6 characters in length.';
    }
    if (!formData.passwordAgain) {
      validationErrors.passwordAgain = 'Please enter your password again for confirmation.';
    } else if (formData.passwordAgain !== formData.password) {
      validationErrors.passwordAgain = 'Passwords do not match.';
    }
    if (!formData.agreeToTerms) {
      validationErrors.agreeToTerms = 'You must agree to the terms of service to continue.';
    }
    if (captchaStatus !== 'verified') {
      validationErrors.captcha = 'Please complete the human verification.';
    }

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setSubmitted(true);
        if (onSuccess) onSuccess(formData);
      }, 1200);
    }
  };

  const cleanSlug = formData.displayName
    ? formData.displayName.toLowerCase().replace(/[^a-z0-9_-]/g, '')
    : 'yourname';

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2.5 mb-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/60 shadow-xs">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Skillcoach Network</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-500/20 text-white font-black text-lg">
            S
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900">
            Skill<span className="text-emerald-600">coach</span>
          </span>
        </div>
      </div>

      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200/80 overflow-hidden transition-all duration-300">
        {submitted ? (
          <div className="p-8 sm:p-12 text-center flex flex-col items-center animate-fadeIn">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-5 ring-8 ring-emerald-50">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Account Created Successfully!</h2>
            <p className="text-slate-600 text-sm max-w-sm mb-6">
              Welcome aboard, <span className="font-semibold text-slate-900">{formData.firstName}</span>! We sent a confirmation link to <span className="font-semibold text-slate-900">{formData.email}</span>.
            </p>
            
            <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 text-left text-xs text-slate-600 space-y-2">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-400">Profile URL:</span>
                <span className="font-medium text-emerald-600 font-mono">http://www.skillcoach.org/profile/{cleanSlug}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-400">Timezone:</span>
                <span className="font-medium text-slate-700">{formData.timezone}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Language:</span>
                <span className="font-medium text-slate-700">{formData.language}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setSubmitted(false);
                setFormData({
                  firstName: '',
                  lastName: '',
                  displayName: '',
                  email: '',
                  password: '',
                  passwordAgain: '',
                  timezone: '(UTC-8) Pacific Time (US & Canada)',
                  language: 'English',
                  agreeToTerms: false,
                });
                setCaptchaStatus('idle');
              }}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition shadow hover:shadow-md cursor-pointer"
            >
              Create Another Account
            </button>
          </div>
        ) : (
          /* Form Screen */
          <div className="p-6 sm:p-10">
            {/* Header */}
            <div className="mb-8 border-b border-slate-100 pb-5">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Create Account
              </h1>
              <p className="mt-1.5 text-sm text-slate-500">
                Join Skillcoach today to connect with coaches and level up your skills.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-6">
            
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-semibold text-slate-800 mb-1.5">
                    First Name <span className="text-emerald-600">*</span>
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    autoComplete="given-name"
                    placeholder="e.g. Alex"
                    value={formData.firstName}
                    onChange={handleChange}
                    onBlur={() => handleBlur('firstName')}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm bg-white border transition-all duration-200 outline-none text-slate-900 placeholder:text-slate-400 shadow-xs ${
                      errors.firstName && touched.firstName
                        ? 'border-red-400 focus:border-red-500 focus:ring-3 focus:ring-red-100'
                        : 'border-slate-300 hover:border-slate-400 focus:border-emerald-600 focus:ring-3 focus:ring-emerald-100'
                    }`}
                  />
                  {errors.firstName && touched.firstName && (
                    <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.firstName}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-semibold text-slate-800 mb-1.5">
                    Last Name <span className="text-emerald-600">*</span>
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    autoComplete="family-name"
                    placeholder="e.g. Morgan"
                    value={formData.lastName}
                    onChange={handleChange}
                    onBlur={() => handleBlur('lastName')}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm bg-white border transition-all duration-200 outline-none text-slate-900 placeholder:text-slate-400 shadow-xs ${
                      errors.lastName && touched.lastName
                        ? 'border-red-400 focus:border-red-500 focus:ring-3 focus:ring-red-100'
                        : 'border-slate-300 hover:border-slate-400 focus:border-emerald-600 focus:ring-3 focus:ring-emerald-100'
                    }`}
                  />
                  {errors.lastName && touched.lastName && (
                    <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.lastName}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="displayName" className="block text-sm font-semibold text-slate-800 mb-1.5">
                  Display Name <span className="text-emerald-600">*</span>
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-mono text-xs hidden sm:flex">
                    skillcoach.org/profile/
                  </span>
                  <input
                    id="displayName"
                    name="displayName"
                    type="text"
                    placeholder="yourname"
                    value={formData.displayName}
                    onChange={handleChange}
                    onBlur={() => handleBlur('displayName')}
                    className={`w-full py-2.5 pr-3.5 rounded-xl text-sm bg-white border transition-all duration-200 outline-none text-slate-900 placeholder:text-slate-400 ${
                      formData.displayName || true ? 'sm:pl-43 pl-3.5' : 'pl-3.5'
                    } ${
                      errors.displayName && touched.displayName
                        ? 'border-red-400 focus:border-red-500 focus:ring-3 focus:ring-red-100'
                        : 'border-slate-300 hover:border-slate-400 focus:border-emerald-600 focus:ring-3 focus:ring-emerald-100'
                    }`}
                  />
                </div>
                <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                  This will be the end of your profile link, for example: <span className="font-mono text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">http://www.skillcoach.org/profile/{cleanSlug}</span>
                </p>
                {errors.displayName && touched.displayName && (
                  <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.displayName}
                  </p>
                )}
              </div>

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
                <p className="mt-1.5 text-xs text-slate-500">
                  You will use your email address to login.
                </p>
                {errors.email && touched.email && (
                  <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.email}
                  </p>
                )}
              </div>

      
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
    
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-slate-800 mb-1.5">
                    Password <span className="text-emerald-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
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
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500">
                    Passwords must be at least 6 characters in length.
                  </p>
                  {errors.password && touched.password && (
                    <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Password Again */}
                <div>
                  <label htmlFor="passwordAgain" className="block text-sm font-semibold text-slate-800 mb-1.5">
                    Password Again <span className="text-emerald-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="passwordAgain"
                      name="passwordAgain"
                      type={showPasswordAgain ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      value={formData.passwordAgain}
                      onChange={handleChange}
                      onBlur={() => handleBlur('passwordAgain')}
                      className={`w-full pl-3.5 pr-10 py-2.5 rounded-xl text-sm bg-white border transition-all duration-200 outline-none text-slate-900 placeholder:text-slate-400 shadow-xs ${
                        errors.passwordAgain && touched.passwordAgain
                          ? 'border-red-400 focus:border-red-500 focus:ring-3 focus:ring-red-100'
                          : 'border-slate-300 hover:border-slate-400 focus:border-emerald-600 focus:ring-3 focus:ring-emerald-100'
                      }`}
                    />
                    <button
                      type="button"
                      tabIndex="-1"
                      onClick={() => setShowPasswordAgain(!showPasswordAgain)}
                      aria-label={showPasswordAgain ? 'Hide password confirmation' : 'Show password confirmation'}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      {showPasswordAgain ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500">
                    Enter your password again for confirmation.
                  </p>
                  {errors.passwordAgain && touched.passwordAgain && (
                    <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.passwordAgain}
                    </p>
                  )}
                </div>
              </div>

              {/* 5. Dropdowns: Timezone & Language */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                {/* Timezone */}
                <div>
                  <label htmlFor="timezone" className="block text-sm font-semibold text-slate-800 mb-1.5">
                    Timezone
                  </label>
                  <div className="relative">
                    <select
                      id="timezone"
                      name="timezone"
                      value={formData.timezone}
                      onChange={handleChange}
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl text-sm bg-white border border-slate-300 hover:border-slate-400 focus:border-emerald-600 focus:ring-3 focus:ring-emerald-100 transition-all duration-200 outline-none text-slate-900 shadow-xs appearance-none cursor-pointer"
                    >
                      {timezoneOptions.map((tz) => (
                        <option key={tz.value} value={tz.value}>
                          {tz.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Language */}
                <div>
                  <label htmlFor="language" className="block text-sm font-semibold text-slate-800 mb-1.5">
                    Language
                  </label>
                  <div className="relative">
                    <select
                      id="language"
                      name="language"
                      value={formData.language}
                      onChange={handleChange}
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl text-sm bg-white border border-slate-300 hover:border-slate-400 focus:border-emerald-600 focus:ring-3 focus:ring-emerald-100 transition-all duration-200 outline-none text-slate-900 shadow-xs appearance-none cursor-pointer"
                    >
                      {languageOptions.map((lang) => (
                        <option key={lang.value} value={lang.value}>
                          {lang.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* 6. Human Verification: Mock hCaptcha UI Block */}
              <div>
                <div
                  onClick={handleCaptchaClick}
                  className={`w-full max-w-[304px] bg-[#f9fafb] border rounded-lg p-3.5 flex items-center justify-between shadow-xs transition-all cursor-pointer select-none ${
                    errors.captcha
                      ? 'border-red-400 bg-red-50/30'
                      : captchaStatus === 'verified'
                      ? 'border-emerald-300 bg-emerald-50/20'
                      : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded border-2 flex items-center justify-center transition-colors ${
                        captchaStatus === 'verified'
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : captchaStatus === 'verifying'
                          ? 'border-emerald-500 bg-white'
                          : 'border-slate-400 bg-white hover:border-slate-500'
                      }`}
                    >
                      {captchaStatus === 'verified' && (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {captchaStatus === 'verifying' && (
                        <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                      )}
                    </div>
                    <span className="text-sm font-medium text-slate-700">I am human</span>
                  </div>

                  {/* hCaptcha Branding */}
                  <div className="flex flex-col items-center pl-2">
                    <svg className="w-7 h-7 text-[#00828A]" viewBox="0 0 32 32" fill="currentColor">
                      <path d="M16 2C8.268 2 2 8.268 2 16s6.268 14 14 14 14-6.268 14-14S23.732 2 16 2zm0 4a10 10 0 1 1 0 20 10 10 0 0 1 0-20z" opacity="0.2"/>
                      <path d="M22.5 11.5l-8 9-4.5-4.5 1.5-1.5 3 3 6.5-7.5 1.5 1.5z"/>
                    </svg>
                    <span className="text-[10px] font-bold text-slate-500 tracking-tight leading-none mt-0.5">hCaptcha</span>
                    <div className="flex gap-1 text-[8px] text-slate-400 leading-tight">
                      <a href="#privacy" onClick={(e) => e.stopPropagation()} className="hover:underline">Privacy</a>
                      <span>·</span>
                      <a href="#terms" onClick={(e) => e.stopPropagation()} className="hover:underline">Terms</a>
                    </div>
                  </div>
                </div>
                {errors.captcha && (
                  <p className="mt-1.5 text-xs text-red-600 font-medium flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.captcha}
                  </p>
                )}
              </div>

              {/* 7. Terms Checkbox */}
              <div>
                <div className="flex items-start gap-3">
                  <div className="flex items-center h-5 mt-0.5">
                    <input
                      id="agreeToTerms"
                      name="agreeToTerms"
                      type="checkbox"
                      checked={formData.agreeToTerms}
                      onChange={handleChange}
                      className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 focus:ring-offset-0 transition cursor-pointer accent-emerald-600"
                    />
                  </div>
                  <label htmlFor="agreeToTerms" className="text-sm text-slate-600 select-none cursor-pointer">
                    I have read and agree to the{' '}
                    <a
                      href="#terms"
                      onClick={(e) => e.preventDefault()}
                      className="font-medium text-emerald-600 hover:text-emerald-700 underline underline-offset-2 transition-colors"
                    >
                      terms of service
                    </a>
                    .
                  </label>
                </div>
                {errors.agreeToTerms && touched.agreeToTerms && (
                  <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.agreeToTerms}
                  </p>
                )}
              </div>

              {/* 8. Submit CTA Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full inline-flex items-center justify-center px-6 py-3.5 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-md shadow-emerald-600/25 hover:shadow-lg hover:shadow-emerald-600/30 focus:outline-none focus:ring-4 focus:ring-emerald-500/30 transition-all duration-200 transform active:scale-[0.99] disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer text-base"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Creating Account...
                    </span>
                  ) : (
                    'Continue'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Card Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-center sm:px-10">
          <p className="text-xs text-slate-500">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="font-semibold text-emerald-600 hover:text-emerald-700 transition cursor-pointer hover:underline"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>

      {/* Trust & Security Micro Footer */}
      <div className="mt-8 flex items-center justify-center gap-6 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
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
