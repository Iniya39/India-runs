import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  ArrowRight,
  Briefcase,
  Users,
  CheckCircle2,
  Cpu,
  Compass,
  Building,
  Target
} from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { BackgroundBlob } from '../components/BackgroundBlobs';

export interface RoleSelectionScreenProps {
  onSelectRole: (role: 'candidate' | 'recruiter') => void;
  userData?: { name?: string; email?: string };
}

export const RoleSelectionScreen: React.FC<RoleSelectionScreenProps> = ({
  onSelectRole,
  userData = { name: 'Alex' },
}) => {
  const [selectedRole, setSelectedRole] = useState<'candidate' | 'recruiter' | null>(null);

  const handleContinue = () => {
    if (selectedRole) {
      onSelectRole(selectedRole);
    }
  };

  const candidateBenefits = [
    'Create an anonymous candidate profile',
    'Get direct inbound pitches from vetted teams',
    'Salary transparency on every offer',
    'Bypass traditional recruiter resume screens'
  ];

  const recruiterBenefits = [
    'Direct outreach to pre-vetted active builders',
    'Pitch candidates directly with salary upfront',
    '85% response rate with smart AI match suggestions',
    'Streamlined pipeline with automated scheduling'
  ];

  return (
    <div className="min-h-screen bg-page-gradient py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden flex flex-col justify-between">
      
      {/* Background Decorative Accents */}
      <BackgroundBlob size="xl" className="-top-20 right-0 opacity-12" />
      <BackgroundBlob size="lg" className="-bottom-10 left-10 from-accent-purple via-brand-middle to-brand-start opacity-10" />

      {/* Top Brand bar */}
      <div className="max-w-7xl mx-auto w-full flex justify-between items-center relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center text-white shadow-warm-md">
            <Sparkles className="w-4.5 h-4.5" />
          </div>
          <span className="font-sora font-extrabold text-lg tracking-tight text-text-navy">
            Talent<span className="text-gradient">Sphere</span>
          </span>
        </div>
        <Badge text="Step 2 of 3: Setup Role" variant="gradient" />
      </div>

      {/* Main Content Box */}
      <div className="max-w-4xl mx-auto w-full relative z-10 my-auto py-8">
        
        {/* Welcome Callout */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', duration: 0.5 }}
          >
            <h2 className="font-sora text-3xl sm:text-4xl md:text-5xl font-extrabold text-text-navy tracking-tight">
              Welcome, <span className="text-gradient">{userData.name || 'Builder'}</span>!
            </h2>
            <p className="font-manrope text-sm sm:text-base text-text-muted mt-3 max-w-xl mx-auto leading-relaxed">
              Let's tailor your TalentSphere workspace. How do you intend to use the AI matchmaker platform?
            </p>
          </motion.div>
        </div>

        {/* Option Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          
          {/* Candidate Card */}
          <motion.div
            whileHover={{ y: -5 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            onClick={() => setSelectedRole('candidate')}
            className="cursor-pointer"
          >
            <div 
              className={`h-full rounded-2xl p-6 sm:p-8 bg-white border-2 transition-all flex flex-col justify-between ${
                selectedRole === 'candidate'
                  ? 'border-accent-orange shadow-warm-xl ring-2 ring-accent-orange/10'
                  : 'border-border-warm hover:border-accent-orange/40 shadow-warm-md'
              }`}
            >
              <div>
                {/* Header with Icon */}
                <div className="flex justify-between items-start mb-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white transition-all ${
                    selectedRole === 'candidate' ? 'bg-accent-orange shadow-warm-md' : 'bg-border-warm text-text-muted'
                  }`}>
                    <Compass className="w-7 h-7" />
                  </div>
                  {selectedRole === 'candidate' && (
                    <Badge text="Selected" variant="gradient" />
                  )}
                </div>

                <h3 className="font-sora text-xl font-bold text-text-navy mb-2">
                  I'm a Candidate
                </h3>
                <p className="font-manrope text-xs sm:text-sm text-text-muted leading-relaxed mb-6">
                  I want to discover premium technology roles anonymously, bypass generic applications, and receive company pitches.
                </p>

                {/* Benefits List */}
                <ul className="space-y-3 font-manrope">
                  {candidateBenefits.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-text-muted">
                      <CheckCircle2 className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                        selectedRole === 'candidate' ? 'text-accent-orange' : 'text-border-warm'
                      }`} />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Bottom tag */}
              <div className="mt-8 pt-4 border-t border-border-warm/50 flex justify-between items-center">
                <span className="text-xs font-semibold text-text-muted">Anonymity Guaranteed</span>
                <span className={`text-xs font-bold ${
                  selectedRole === 'candidate' ? 'text-accent-orange' : 'text-text-muted'
                }`}>Explore Roles</span>
              </div>
            </div>
          </motion.div>

          {/* Recruiter Card */}
          <motion.div
            whileHover={{ y: -5 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            onClick={() => setSelectedRole('recruiter')}
            className="cursor-pointer"
          >
            <div 
              className={`h-full rounded-2xl p-6 sm:p-8 bg-white border-2 transition-all flex flex-col justify-between ${
                selectedRole === 'recruiter'
                  ? 'border-accent-purple shadow-warm-xl ring-2 ring-accent-purple/10'
                  : 'border-border-warm hover:border-accent-purple/40 shadow-warm-md'
              }`}
            >
              <div>
                {/* Header with Icon */}
                <div className="flex justify-between items-start mb-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white transition-all ${
                    selectedRole === 'recruiter' ? 'bg-accent-purple shadow-warm-md' : 'bg-border-warm text-text-muted'
                  }`}>
                    <Building className="w-7 h-7" />
                  </div>
                  {selectedRole === 'recruiter' && (
                    <Badge text="Selected" variant="purple" />
                  )}
                </div>

                <h3 className="font-sora text-xl font-bold text-text-navy mb-2">
                  I'm Hiring
                </h3>
                <p className="font-manrope text-xs sm:text-sm text-text-muted leading-relaxed mb-6">
                  I want to build highly efficient engineering teams, pitch top candidates transparently, and use AI matchmaking filters.
                </p>

                {/* Benefits List */}
                <ul className="space-y-3 font-manrope">
                  {recruiterBenefits.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-text-muted">
                      <CheckCircle2 className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                        selectedRole === 'recruiter' ? 'text-accent-purple' : 'text-border-warm'
                      }`} />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Bottom tag */}
              <div className="mt-8 pt-4 border-t border-border-warm/50 flex justify-between items-center">
                <span className="text-xs font-semibold text-text-muted">Direct Team Pitching</span>
                <span className={`text-xs font-bold ${
                  selectedRole === 'recruiter' ? 'text-accent-purple' : 'text-text-muted'
                }`}>Hire Top Talents</span>
              </div>
            </div>
          </motion.div>

        </div>

        {/* Action Button */}
        <div className="text-center">
          <Button
            variant="primary"
            disabled={!selectedRole}
            onClick={handleContinue}
            className={`mx-auto min-w-56 py-3.5 font-bold shadow-warm-md transition-all ${
              selectedRole === 'recruiter' ? 'bg-brand-gradient brightness-105' : ''
            }`}
          >
            Continue workspace setup
            <ArrowRight className="w-4 h-4" />
          </Button>
          <p className="text-xs text-text-muted font-manrope mt-3">
            You can modify your role selection settings anytime inside your user preferences dashboard.
          </p>
        </div>

      </div>

      {/* Footer bar */}
      <div className="max-w-7xl mx-auto w-full text-center relative z-10 text-xs text-text-muted/60 font-manrope pt-4 border-t border-border-warm/30">
        Secure tokenized onboarding verified. TalentSphere Workspace © 2026.
      </div>

    </div>
  );
};
