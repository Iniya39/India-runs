import React from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  ArrowRight,
  Briefcase
} from 'lucide-react';

import { NavBar } from '../components/NavBar';
import { BackgroundBlob } from '../components/BackgroundBlobs';

export interface StyleGuideProps {
  onSelectRole: (role: 'candidate' | 'recruiter') => void;
}

export const StyleGuide: React.FC<StyleGuideProps> = ({ onSelectRole }) => {
  return (
    <div className="relative min-h-screen bg-page-gradient overflow-hidden selection:bg-accent-orange/20 selection:text-text-navy flex flex-col">
      
      {/* Decorative Blobs positioned behind main layout */}
      <BackgroundBlob size="xl" className="top-10 -left-20" opacity={0.15} />
      <BackgroundBlob size="lg" className="top-[40%] -right-10 from-accent-purple via-brand-middle to-brand-start" opacity={0.1} />
      <BackgroundBlob size="xl" className="bottom-10 left-[20%]" opacity={0.12} />

      {/* Main header navbar */}
      <NavBar />

      {/* Viewport-centric centered flex container */}
      <div className="flex-grow flex flex-col justify-center items-center relative z-10 px-4 py-4 md:py-8 max-w-4xl mx-auto w-full h-[calc(100vh-76px)]">
        
        {/* Landing Page Hero Header */}
        <div className="text-center max-w-3xl mx-auto mb-6 md:mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-orange/10 text-accent-orange font-manrope text-[10px] font-semibold mb-3 border border-accent-orange/15 shadow-warm-sm animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Driven Recruiting Platform
          </div>
          
          <h1 className="font-sora text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-text-navy leading-tight">
            Find the right talent, <br />
            <span className="text-gradient font-black">Faster Smarter</span>
          </h1>
          
          <p className="mt-3 text-xs sm:text-sm text-text-muted font-manrope max-w-xl mx-auto leading-relaxed">
            AI that understands jobs deeply, analyses real potential and connects the perfect match.
          </p>

          {/* Positioned tagline inline quote right below hero */}
          <div className="mt-4">
            <span className="inline-flex items-center font-sora text-xs italic font-semibold text-text-navy/70 bg-white/50 backdrop-blur-md px-4 py-1.5 rounded-full border border-border-warm shadow-warm-sm">
              “The platform that puts <span className="text-gradient font-extrabold ml-1">Engineers First</span>”
            </span>
          </div>
        </div>

        {/* Action Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl mx-auto">
          {/* Candidate Card */}
          <motion.div
            whileHover={{ y: -4, scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            onClick={() => onSelectRole('candidate')}
            className="bg-white/80 backdrop-blur-sm border border-border-warm rounded-2xl p-6 shadow-warm-md hover:shadow-warm-lg hover:border-accent-orange/40 transition-all flex flex-col justify-between cursor-pointer group"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-accent-orange flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-sora font-extrabold text-lg text-text-navy mb-1.5">
                I'm a Candidate
              </h3>
              <p className="font-manrope text-xs text-text-muted leading-relaxed">
                Build your profile, showcase your verified work, and let companies reach out to you with pre-vetted positions.
              </p>
            </div>
            <div className="mt-6 flex items-center justify-between font-manrope text-xs font-bold text-accent-orange">
              <span>Login as Candidate</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>

          {/* Recruiter Card */}
          <motion.div
            whileHover={{ y: -4, scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            onClick={() => onSelectRole('recruiter')}
            className="bg-white/80 backdrop-blur-sm border border-border-warm rounded-2xl p-6 shadow-warm-md hover:shadow-warm-lg hover:border-accent-purple/40 transition-all flex flex-col justify-between cursor-pointer group"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-accent-purple flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Briefcase className="w-5 h-5" />
              </div>
              <h3 className="font-sora font-extrabold text-lg text-text-navy mb-1.5">
                I'm a Recruiter
              </h3>
              <p className="font-manrope text-xs text-text-muted leading-relaxed">
                Post roles, analyze applicant potential with deep AI context, and connect with matching candidates instantly.
              </p>
            </div>
            <div className="mt-6 flex items-center justify-between font-manrope text-xs font-bold text-accent-purple">
              <span>Login as Recruiter</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
};
