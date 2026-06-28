import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  ArrowRight,
  Briefcase,
  User,
  Check,
  AlertCircle,
  X
} from 'lucide-react';
import { Button } from '../components/Button';
import { BackgroundBlob } from '../components/BackgroundBlobs';

// Firebase Auth & Firestore imports (routed through our fallback proxy)
import { auth, db, doc, getDoc, updateDoc } from '../firebase';

export interface RoleSelectionScreenProps {
  onSelectRole: (role: 'candidate' | 'recruiter') => void;
  onLogout?: () => void;
  userData?: { name?: string; email?: string };
}

export const RoleSelectionScreen: React.FC<RoleSelectionScreenProps> = ({
  onSelectRole,
  onLogout,
  userData = { name: 'Builder' },
}) => {
  const [selectedRole, setSelectedRole] = useState<'candidate' | 'recruiter' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // GUARD CONDITION — IMPORTANT:
  // If the user's Firestore document already has a non-null role, redirect them immediately to their dashboard
  useEffect(() => {
    const checkUserRoleOnMount = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            if (data.role) {
              // Redirect them immediately to dashboard since role is already selected
              onSelectRole(data.role);
            }
          }
        } catch (err) {
          console.error('Error verifying user role on mount:', err);
        }
      }
    };
    checkUserRoleOnMount();
  }, [onSelectRole]);

  const handleContinue = async () => {
    if (!selectedRole) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user session found.');
      }

      // Update the existing users/{uid} Firestore document setting role
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        role: selectedRole,
        onboardingComplete: true
      });

      // Navigate to corresponding screen via callback
      onSelectRole(selectedRole);

      // Placeholders for Candidate/Recruiter routing:
      if (selectedRole === 'candidate') {
        // TODO: Redirect / Navigate to the Candidate Profile Builder screen (not built yet)
        console.log('Role registered: Candidate. Routing to Candidate Profile Builder...');
      } else {
        // TODO: Redirect / Navigate to the Recruiter/Company Setup screen (not built yet)
        console.log('Role registered: Recruiter. Routing to Recruiter/Company Setup...');
      }

    } catch (err: any) {
      console.error('Failed to update workspace role:', err);
      // Map Firestore error or use fallbacks
      setError(err.message || 'A network error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const candidateBullets = [
    'AI-matched job recommendations',
    'Showcase verified skills & projects',
    'Get discovered through reverse hiring'
  ];

  const recruiterBullets = [
    'AI-ranked candidate shortlists',
    'Deep semantic job matching',
    'Ask AI anything about a candidate'
  ];

  return (
    <div className="min-h-screen bg-page-gradient py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden flex flex-col justify-between font-manrope">
      
      {/* Background Decorative Accents */}
      <BackgroundBlob size="xl" className="-top-40 -right-20 opacity-8" />
      <BackgroundBlob size="lg" className="-bottom-20 -left-20 from-accent-purple via-brand-middle to-brand-start opacity-8" />

      {/* Top Bar with TalentSphere Brand (no visible back/logout option per instructions) */}
      <div className="max-w-5xl mx-auto w-full flex justify-between items-center relative z-10 pb-6 border-b border-border-warm/20">
        <div className="flex items-center gap-2 mx-auto sm:mx-0">
          <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center text-white shadow-warm-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-sora font-extrabold text-base tracking-tight text-text-navy">
            Talent<span className="text-gradient">Sphere</span>
          </span>
        </div>
      </div>

      {/* Centered Single-Column Main Content Container */}
      <div className="max-w-4xl mx-auto w-full relative z-10 py-12 my-auto flex flex-col justify-center items-center">
        
        {/* Header Section */}
        <div className="text-center max-w-2xl mb-12">
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-orange/10 text-accent-orange font-semibold text-xs mb-4 border border-accent-orange/15 shadow-warm-sm">
              <Sparkles className="w-3.5 h-3.5" />
              Onboarding Workspace Setup
            </div>
            <h1 className="font-sora text-3xl sm:text-4xl md:text-5xl font-extrabold text-text-navy tracking-tight leading-tight">
              How do you want to use <span className="text-gradient">TalentSphere</span>?
            </h1>
            <p className="font-manrope text-sm sm:text-base text-text-muted mt-4 max-w-xl mx-auto leading-relaxed">
              This helps us tailor your experience. <span className="font-bold text-text-navy">You can't change this later</span>, so choose carefully.
            </p>
          </motion.div>
        </div>

        {/* Side-by-Side Selection Cards (stacks on mobile) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full mb-12">
          
          {/* Candidate Option Card */}
          <motion.div
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            onClick={() => !isSubmitting && setSelectedRole('candidate')}
            className={`cursor-pointer h-full ${isSubmitting ? 'pointer-events-none opacity-80' : ''}`}
            id="role-candidate-card"
          >
            <div 
              className={`relative rounded-2xl transition-all duration-300 h-full p-[2px] ${
                selectedRole === 'candidate' 
                  ? 'bg-brand-gradient shadow-warm-xl' 
                  : 'bg-transparent border-2 border-border-warm hover:border-accent-orange/40 hover:shadow-warm-md'
              }`}
            >
              <div className="h-full bg-white rounded-[14px] p-8 flex flex-col justify-between">
                <div>
                  {/* Badge with Icon */}
                  <div className="flex justify-between items-center mb-6">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white bg-brand-gradient shadow-warm-sm`}>
                      <User className="w-6 h-6" />
                    </div>
                    {selectedRole === 'candidate' && (
                      <span className="text-xs font-bold text-accent-orange bg-accent-orange/10 border border-accent-orange/15 px-3 py-1 rounded-full">
                        Selected Role
                      </span>
                    )}
                  </div>

                  <h3 className="font-sora text-xl font-extrabold text-text-navy mb-2">
                    I'm looking for jobs
                  </h3>
                  <p className="font-manrope text-sm text-text-muted leading-relaxed mb-6">
                    Build your profile, get discovered by top companies, and find roles that actually fit you.
                  </p>

                  {/* Bullet Benefits List */}
                  <ul className="space-y-3.5 font-manrope">
                    {candidateBullets.map((bullet, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-text-muted">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0 bg-accent-orange/10 text-accent-orange`}>
                          <Check className="w-3 h-3 stroke-[3px]" />
                        </div>
                        <span className="text-text-navy/90">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-4 border-t border-border-warm/50 flex justify-between items-center text-xs font-semibold text-text-muted">
                  <span>Candidate Space</span>
                  <span className={selectedRole === 'candidate' ? 'text-accent-orange font-bold' : ''}>
                    Reverse Hiring
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Recruiter Option Card */}
          <motion.div
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            onClick={() => !isSubmitting && setSelectedRole('recruiter')}
            className={`cursor-pointer h-full ${isSubmitting ? 'pointer-events-none opacity-80' : ''}`}
            id="role-recruiter-card"
          >
            <div 
              className={`relative rounded-2xl transition-all duration-300 h-full p-[2px] ${
                selectedRole === 'recruiter' 
                  ? 'bg-brand-gradient shadow-warm-xl' 
                  : 'bg-transparent border-2 border-border-warm hover:border-accent-purple/40 hover:shadow-warm-md'
              }`}
            >
              <div className="h-full bg-white rounded-[14px] p-8 flex flex-col justify-between">
                <div>
                  {/* Badge with Icon */}
                  <div className="flex justify-between items-center mb-6">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white bg-brand-gradient shadow-warm-sm">
                      <Briefcase className="w-6 h-6" />
                    </div>
                    {selectedRole === 'recruiter' && (
                      <span className="text-xs font-bold text-accent-purple bg-accent-purple/10 border border-accent-purple/15 px-3 py-1 rounded-full">
                        Selected Role
                      </span>
                    )}
                  </div>

                  <h3 className="font-sora text-xl font-extrabold text-text-navy mb-2">
                    I'm hiring talent
                  </h3>
                  <p className="font-manrope text-sm text-text-muted leading-relaxed mb-6">
                    Post roles, get an intelligently ranked shortlist, and skip the keyword guesswork.
                  </p>

                  {/* Bullet Benefits List */}
                  <ul className="space-y-3.5 font-manrope">
                    {recruiterBullets.map((bullet, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-text-muted">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0 bg-accent-purple/10 text-accent-purple">
                          <Check className="w-3 h-3 stroke-[3px]" />
                        </div>
                        <span className="text-text-navy/90">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-4 border-t border-border-warm/50 flex justify-between items-center text-xs font-semibold text-text-muted">
                  <span>Employer Console</span>
                  <span className={selectedRole === 'recruiter' ? 'text-accent-purple font-bold' : ''}>
                    Semantic Search
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

        </div>

        {/* Action Call-to-Button & Error Banner Section */}
        <div className="text-center w-full max-w-sm flex flex-col gap-4">
          
          {/* Reuse the inline error banner style from the AuthScreen */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-3 shadow-warm-sm text-left">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-grow">
                    <p className="text-xs font-manrope leading-normal font-semibold">
                      {error}
                    </p>
                  </div>
                  <button 
                    onClick={() => setError(null)}
                    className="p-1 rounded-full hover:bg-red-100 text-red-500 transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            variant="primary"
            disabled={!selectedRole || isSubmitting}
            onClick={handleContinue}
            className={`w-full py-4 font-bold shadow-warm-md transition-all text-base rounded-full ${
              !selectedRole 
                ? 'opacity-50 cursor-not-allowed bg-text-muted/20 text-text-muted border border-border-warm' 
                : 'hover:scale-105 active:scale-95'
            }`}
            id="role-continue-button"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Processing setup...
              </span>
            ) : (
              <>
                Continue setup
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </Button>
          <p className="text-xs text-text-muted font-manrope">
            Clicking Continue registers your selected role. You cannot swap workspaces later.
          </p>
        </div>

      </div>

      {/* Bottom Legal bar */}
      <div className="max-w-5xl mx-auto w-full text-center relative z-10 text-xs text-text-muted/60 font-manrope pt-4 border-t border-border-warm/20">
        Secure onboarding token verified. TalentSphere © 2026. All rights reserved.
      </div>

    </div>
  );
};
