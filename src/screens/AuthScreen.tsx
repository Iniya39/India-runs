import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  ArrowRight,
  AlertCircle,
  X,
  Briefcase,
  Award,
  ShieldCheck,
  CheckCircle2,
  LockKeyhole
} from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { FloatingInfoCard } from '../components/FloatingInfoCard';
import { BackgroundBlob } from '../components/BackgroundBlobs';

// Firebase Auth modular imports (routed through our fallback proxy)
import { 
  auth,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  signInWithPopup, 
  GoogleAuthProvider 
} from '../firebase';

export interface AuthScreenProps {
  onSuccessSignup: (userData: { name: string; email: string }) => void;
  onSuccessLogin: (userData: { email: string }) => void;
  onBackToLanding?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onSuccessSignup,
  onSuccessLogin,
  onBackToLanding,
}) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Form values
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });

  // Form errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  // General form submission error banner
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear field-specific error as user types
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  // Field validation on blur
  const handleBlur = (fieldName: string) => {
    validateField(fieldName);
  };

  const validateField = (fieldName: string): boolean => {
    let isValid = true;
    const newErrors = { ...errors };

    if (fieldName === 'email') {
      if (!formData.email) {
        newErrors.email = 'Email address is required';
        isValid = false;
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
        isValid = false;
      } else {
        delete newErrors.email;
      }
    }

    if (fieldName === 'password') {
      if (!formData.password) {
        newErrors.password = 'Password is required';
        isValid = false;
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
        isValid = false;
      } else {
        delete newErrors.password;
      }
    }

    if (!isLogin) {
      if (fieldName === 'name') {
        if (!formData.name.trim()) {
          newErrors.name = 'Full name is required';
          isValid = false;
        } else {
          delete newErrors.name;
        }
      }

      if (fieldName === 'confirmPassword') {
        if (!formData.confirmPassword) {
          newErrors.confirmPassword = 'Please confirm your password';
          isValid = false;
        } else if (formData.confirmPassword !== formData.password) {
          newErrors.confirmPassword = 'Passwords do not match';
          isValid = false;
        } else {
          delete newErrors.confirmPassword;
        }
      }

      if (fieldName === 'agreeTerms') {
        if (!formData.agreeTerms) {
          newErrors.agreeTerms = 'You must accept the terms';
          isValid = false;
        } else {
          delete newErrors.agreeTerms;
        }
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const validateAll = (): boolean => {
    const fieldsToValidate = isLogin
      ? ['email', 'password']
      : ['name', 'email', 'password', 'confirmPassword', 'agreeTerms'];
    
    let allValid = true;
    const newErrors: Record<string, string> = {};

    fieldsToValidate.forEach((field) => {
      if (field === 'email') {
        if (!formData.email) {
          newErrors.email = 'Email address is required';
          allValid = false;
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
          newErrors.email = 'Please enter a valid email address';
          allValid = false;
        }
      } else if (field === 'password') {
        if (!formData.password) {
          newErrors.password = 'Password is required';
          allValid = false;
        } else if (formData.password.length < 8) {
          newErrors.password = 'Password must be at least 8 characters';
          allValid = false;
        }
      } else if (field === 'name') {
        if (!formData.name.trim()) {
          newErrors.name = 'Full name is required';
          allValid = false;
        }
      } else if (field === 'confirmPassword') {
        if (!formData.confirmPassword) {
          newErrors.confirmPassword = 'Please confirm your password';
          allValid = false;
        } else if (formData.confirmPassword !== formData.password) {
          newErrors.confirmPassword = 'Passwords do not match';
          allValid = false;
        }
      } else if (field === 'agreeTerms') {
        if (!formData.agreeTerms) {
          newErrors.agreeTerms = 'You must agree to the terms';
          allValid = false;
        }
      }
    });

    setErrors(newErrors);
    return allValid;
  };

  const mapAuthErrorToMessage = (code: string): string => {
    switch (code) {
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Invalid email or password.';
      case 'auth/weak-password':
        return 'Password must be at least 8 characters.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later.';
      default:
        return 'An error occurred during authentication. Please try again.';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBannerError(null);

    if (!validateAll()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (isLogin) {
        // Real Firebase Auth Login
        const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
        onSuccessLogin({ email: userCredential.user.email || formData.email });
      } else {
        // Real Firebase Auth Signup
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        await updateProfile(userCredential.user, {
          displayName: formData.name,
        });
        onSuccessSignup({ name: formData.name, email: formData.email });
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setBannerError(mapAuthErrorToMessage(err.code || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setErrors({});
    setBannerError(null);
  };

  return (
    <div className="min-h-screen bg-page-gradient flex flex-col md:flex-row relative overflow-hidden">
      
      {/* Decorative Blob in Background (behind split panels) */}
      <BackgroundBlob size="xl" className="bottom-0 left-0 -translate-x-1/3 translate-y-1/3 opacity-10" />

      {/* LEFT PANEL: Auth Form (~45% on desktop, full width on mobile) */}
      <div className="w-full md:w-[45%] flex flex-col justify-between p-6 sm:p-10 md:p-12 xl:p-16 bg-[#FFFBF8]/95 backdrop-blur-sm relative z-10 border-r border-border-warm/50 shadow-warm-lg">
        
        {/* Top bar with Logo */}
        <div className="flex items-center justify-between mb-8 md:mb-12">
          <div 
            onClick={onBackToLanding}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center text-white shadow-warm-md group-hover:scale-105 transition-transform duration-300">
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <span className="font-sora font-extrabold text-lg tracking-tight text-text-navy">
              Talent<span className="text-gradient">Sphere</span>
            </span>
          </div>
          
          {onBackToLanding && (
            <button 
              onClick={onBackToLanding}
              className="text-xs font-semibold font-manrope text-accent-orange hover:underline cursor-pointer"
            >
              Back to system guide
            </button>
          )}
        </div>

        {/* Center Content: Auth Form */}
        <div className="my-auto max-w-md w-full mx-auto">
          
          {/* Headline */}
          <div className="mb-8">
            <h2 className="font-sora text-3xl font-extrabold text-text-navy tracking-tight">
              {isLogin ? (
                <>
                  Welcome <span className="text-gradient">Back</span>
                </>
              ) : (
                <>
                  Start your <span className="text-gradient">Journey</span>
                </>
              )}
            </h2>
            <p className="font-manrope text-sm text-text-muted mt-2">
              {isLogin 
                ? 'Access your unified AI matching candidate platform.' 
                : 'Create your optimistic talent hub credential in 30 seconds.'
              }
            </p>
          </div>

          {/* Dissmissible Error Banner */}
          <AnimatePresence>
            {bannerError && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                className="mb-6 overflow-hidden"
              >
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-3 shadow-warm-sm">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-grow">
                    <p className="text-xs font-manrope leading-normal font-semibold">
                      {bannerError}
                    </p>
                  </div>
                  <button 
                    onClick={() => setBannerError(null)}
                    className="p-1 rounded-full hover:bg-red-100 text-red-500 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 font-manrope">
            
            {/* Full Name field (Signup only) */}
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-navy block" htmlFor="name">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 w-4 h-4 text-text-muted" />
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    placeholder="E.g., Alex Rivera"
                    value={formData.name}
                    onChange={handleChange}
                    onBlur={() => handleBlur('name')}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-white/70 text-sm outline-none transition-all ${
                      errors.name 
                        ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200' 
                        : 'border-border-warm focus:border-accent-orange/40 focus:ring-2 focus:ring-accent-orange/10'
                    }`}
                  />
                </div>
                {errors.name && (
                  <p className="text-xs text-red-600 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.name}
                  </p>
                )}
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-navy block" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-text-muted" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={() => handleBlur('email')}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-white/70 text-sm outline-none transition-all ${
                    errors.email 
                      ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200' 
                      : 'border-border-warm focus:border-accent-orange/40 focus:ring-2 focus:ring-accent-orange/10'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-600 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-text-navy" htmlFor="password">
                  Password
                </label>
                {isLogin && (
                  <a 
                    href="#forgot" 
                    onClick={(e) => {
                      e.preventDefault();
                      setBannerError('Password recovery simulator: An email reset link has been configured (placeholder).');
                    }}
                    className="text-xs font-semibold text-accent-orange hover:underline"
                  >
                    Forgot password?
                  </a>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-text-muted" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={() => handleBlur('password')}
                  className={`w-full pl-10 pr-10 py-3 rounded-xl border bg-white/70 text-sm outline-none transition-all ${
                    errors.password 
                      ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200' 
                      : 'border-border-warm focus:border-accent-orange/40 focus:ring-2 focus:ring-accent-orange/10'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-text-muted hover:text-text-navy"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-600 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password Field (Signup only) */}
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-navy block" htmlFor="confirmPassword">
                  Confirm Password
                </label>
                <div className="relative">
                  <LockKeyhole className="absolute left-3.5 top-3.5 w-4 h-4 text-text-muted" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onBlur={() => handleBlur('confirmPassword')}
                    className={`w-full pl-10 pr-10 py-3 rounded-xl border bg-white/70 text-sm outline-none transition-all ${
                      errors.confirmPassword 
                        ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200' 
                        : 'border-border-warm focus:border-accent-orange/40 focus:ring-2 focus:ring-accent-orange/10'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3.5 text-text-muted hover:text-text-navy"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-red-600 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.confirmPassword}
                  </p>
                )}
              </div>
            )}

            {/* Checkbox (Signup only) */}
            {!isLogin && (
              <div className="space-y-1.5 pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    name="agreeTerms"
                    type="checkbox"
                    checked={formData.agreeTerms}
                    onChange={handleChange}
                    onBlur={() => handleBlur('agreeTerms')}
                    className="mt-1 h-4 w-4 rounded border-border-warm text-accent-orange focus:ring-accent-orange/30 cursor-pointer"
                  />
                  <span className="text-xs text-text-muted leading-snug">
                    I agree to the{' '}
                    <a href="#terms" className="text-accent-orange font-semibold hover:underline">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="#privacy" className="text-accent-orange font-semibold hover:underline">
                      Privacy Policy
                    </a>
                  </span>
                </label>
                {errors.agreeTerms && (
                  <p className="text-xs text-red-600 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.agreeTerms}
                  </p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                className="w-full justify-center py-3.5 font-bold shadow-warm-md text-sm sm:text-base relative"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {isLogin ? 'Authenticating...' : 'Generating Profile...'}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 justify-center">
                    {isLogin ? 'Log in' : 'Create account'}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </div>
          </form>

          {/* Social Sign In Divider */}
          <div className="relative my-6 text-center">
            <hr className="border-border-warm" />
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#FFFBF8] px-4 text-xs text-text-muted font-semibold tracking-wider uppercase">
              Or continue with
            </span>
          </div>

          {/* Google & LinkedIn Buttons */}
          <div className="grid grid-cols-2 gap-3.5">
            <Button
              variant="secondary"
              onClick={async () => {
                setBannerError(null);
                setIsSubmitting(true);
                try {
                  const provider = new GoogleAuthProvider();
                  const userCredential = await signInWithPopup(auth, provider);
                  onSuccessLogin({ email: userCredential.user.email || '' });
                } catch (err: any) {
                  console.error('Google auth error:', err);
                  if (err.code !== 'auth/popup-closed-by-user') {
                    setBannerError(mapAuthErrorToMessage(err.code || err.message));
                  }
                } finally {
                  setIsSubmitting(false);
                }
              }}
              disabled={isSubmitting}
              className="py-2.5 font-semibold text-xs flex items-center justify-center gap-2 bg-white"
            >
              {/* Simple Google SVG Icon */}
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5.04c1.62 0 3.08.56 4.22 1.65l3.15-3.15C17.45 1.84 14.97 1 12 1 7.35 1 3.4 3.65 1.5 7.5l3.8 2.95C6.2 7.14 8.88 5.04 12 5.04z" />
                <path fill="#4285F4" d="M23.5 12.25c0-.82-.07-1.61-.21-2.38H12v4.5h6.48c-.28 1.48-1.11 2.73-2.37 3.58l3.7 2.87c2.16-2 3.69-4.94 3.69-8.57z" />
                <path fill="#FBBC05" d="M5.3 14.55C5.05 13.8 4.9 13 4.9 12.2c0-.8.15-1.6.4-2.35L1.5 6.9C.55 8.8 0 10.95 0 13.2s.55 4.4 1.5 6.3l3.8-2.95z" />
                <path fill="#34A853" d="M12 23c3.24 0 5.97-1.08 7.96-2.92l-3.7-2.87c-1.02.68-2.33 1.1-4.26 1.1-3.12 0-5.8-2.1-6.7-5.01L1.5 16.25C3.4 20.1 7.35 23 12 23z" />
              </svg>
              Google
            </Button>
            
            <Button
              variant="secondary"
              disabled={true}
              className="py-2.5 font-semibold text-xs flex items-center justify-center gap-2 bg-white opacity-50 cursor-not-allowed"
            >
              {/* Simple LinkedIn SVG Icon */}
              <svg className="w-4 h-4 flex-shrink-0 fill-[#0077B5]" viewBox="0 0 24 24">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
              </svg>
              LinkedIn
            </Button>
          </div>

          {/* Toggle Button / Account Switcher link */}
          <div className="mt-8 text-center">
            <button
              onClick={toggleAuthMode}
              className="font-manrope text-sm text-text-muted hover:text-text-navy transition font-semibold"
            >
              {isLogin ? (
                <>
                  Don't have an account?{' '}
                  <span className="text-accent-orange hover:underline font-bold">
                    Sign up
                  </span>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <span className="text-accent-orange hover:underline font-bold">
                    Log in
                  </span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* Bottom Footer Info */}
        <div className="mt-8 pt-4 border-t border-border-warm/40 text-center">
          <p className="text-[11px] text-text-muted/60 font-manrope">
            Secure passwordless credential matching configured. Powered by Google AI Studio.
          </p>
        </div>

      </div>

      {/* RIGHT PANEL: Decorative Panel (~55% on desktop, hidden/stacks below on mobile) */}
      <div className="w-full md:w-[55%] bg-brand-gradient relative flex flex-col justify-between p-10 md:p-14 xl:p-20 overflow-hidden text-white min-h-[350px] md:min-h-screen">
        
        {/* Animated Background blobs/artifics */}
        <BackgroundBlob size="lg" className="top-10 right-10 from-white/10 to-white/0" opacity={0.15} />
        <BackgroundBlob size="xl" className="bottom-0 right-0 from-white/10 to-transparent" opacity={0.12} />

        {/* Floating circles and elements simulating fluid wave lines */}
        <div className="absolute inset-0 z-0 opacity-15 pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <g fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M-100,200 Q200,400 500,200 T1100,400" />
              <path d="M-50,300 Q250,500 550,300 T1150,500" />
              <path d="M-200,100 Q100,300 400,100 T1000,300" />
            </g>
          </svg>
        </div>

        {/* Top visual decoration */}
        <div className="relative z-10 self-start">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold tracking-wider uppercase font-manrope">
            <Sparkles className="w-3.5 h-3.5 text-white" />
            AI-Driven Hiring Platform
          </span>
        </div>

        {/* Center illustration & Value Proposition */}
        <div className="my-auto relative z-10 max-w-xl">
          <h3 className="font-sora text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight mb-6">
            The platform built for the <span className="underline decoration-white/30 decoration-wavy underline-offset-8">modern professional</span>.
          </h3>
          <p className="font-manrope text-white/80 text-sm sm:text-base md:text-lg leading-relaxed mb-8">
            Stop casting a wide net. Connect with teams that pitch you based on skills, pre-verified salaries, and human alignment.
          </p>

          {/* Floating Info Cards showing Trust/Value messages */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
            <FloatingInfoCard
              icon={Briefcase}
              title="Reverse Recruiting"
              subtitle="Companies apply to your profile directly with vetted offers."
              iconBgType="orange"
              className="bg-white/10 border-white/15 backdrop-blur-md text-white hover:bg-white/15"
            />
            
            <FloatingInfoCard
              icon={Award}
              title="10,000+ Pros"
              subtitle="Join active engineering candidates securing premium roles."
              iconBgType="purple"
              className="bg-white/10 border-white/15 backdrop-blur-md text-white hover:bg-white/15"
            />
          </div>
        </div>

        {/* Bottom indicator */}
        <div className="relative z-10 text-xs text-white/60 font-manrope flex justify-between items-center mt-6">
          <span>© 2026 TalentSphere Inc.</span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-white" /> GDPR Vetted Secure
          </span>
        </div>

      </div>

    </div>
  );
};
