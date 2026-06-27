import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  Briefcase,
  UserCheck,
  Award,
  ShieldCheck,
  Info,
  CheckCircle2,
  Code,
  Layers,
  Palette,
  Type,
  Maximize2,
  RefreshCw,
  Heart,
  MapPin,
  ArrowRight
} from 'lucide-react';

import { NavBar } from '../components/NavBar';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { FloatingInfoCard } from '../components/FloatingInfoCard';
import { Avatar } from '../components/Avatar';
import { Badge } from '../components/Badge';
import { SectionContainer } from '../components/SectionContainer';
import { BackgroundBlob } from '../components/BackgroundBlobs';

export interface StyleGuideProps {
  onNavigateToAuth: () => void;
}

export const StyleGuide: React.FC<StyleGuideProps> = ({ onNavigateToAuth }) => {
  const [selectedVariant, setSelectedVariant] = useState<'all' | 'buttons' | 'cards' | 'avatars' | 'palette' | 'typography'>('all');
  const [demoState, setDemoState] = useState({
    submitting: false,
    success: false,
    count: 0
  });

  const triggerMockAction = () => {
    setDemoState({ ...demoState, submitting: true });
    setTimeout(() => {
      setDemoState({
        submitting: false,
        success: true,
        count: demoState.count + 1
      });
      setTimeout(() => {
        setDemoState(prev => ({ ...prev, success: false }));
      }, 3000);
    }, 1500);
  };

  return (
    <div className="relative min-h-screen bg-page-gradient overflow-x-hidden selection:bg-accent-orange/20 selection:text-text-navy pb-20">
      
      {/* Decorative Blobs positioned behind main layout */}
      <BackgroundBlob size="xl" className="top-10 -left-20" opacity={0.15} />
      <BackgroundBlob size="lg" className="top-[40%] -right-10 from-accent-purple via-brand-middle to-brand-start" opacity={0.1} />
      <BackgroundBlob size="xl" className="bottom-10 left-[20%]" opacity={0.12} />

      {/* Main header navbar */}
      <NavBar />

      <SectionContainer spacing="compact" className="relative z-10">
        
        {/* Style Guide Hero Header */}
        <div className="text-center md:text-left md:flex md:items-end md:justify-between border-b border-border-warm/60 pb-8 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent-orange/10 text-accent-orange font-manrope text-xs font-semibold mb-4 border border-accent-orange/15 shadow-warm-sm">
              <Sparkles className="w-3.5 h-3.5" />
              Design System & Component Library
            </div>
            <h1 className="font-sora text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-text-navy leading-none">
              Crafting <span className="text-gradient font-black">TalentSphere</span>
            </h1>
            <p className="mt-4 text-base sm:text-lg text-text-muted font-manrope max-w-2xl leading-relaxed">
              Explore the design tokens, typography scale, buttons, badges, avatars, and layout system. When ready, proceed to test the login/signup experience!
            </p>
          </div>

          <div className="mt-6 md:mt-0 flex flex-col sm:flex-row gap-3 items-center justify-center">
            {/* Direct Switcher to Auth Screen */}
            <Button 
              variant="primary" 
              onClick={onNavigateToAuth}
              className="w-full sm:w-auto shadow-warm-md hover:scale-105 transition-transform"
            >
              Test Login / Signup Flow
              <ArrowRight className="w-4 h-4" />
            </Button>
            
            <div className="flex flex-wrap gap-2 justify-center">
              {(['all', 'palette', 'typography', 'buttons', 'cards', 'avatars'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedVariant(tab)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize font-manrope transition-all cursor-pointer ${
                    selectedVariant === tab
                      ? 'bg-text-navy text-white shadow-warm-sm'
                      : 'bg-white text-text-muted border border-border-warm hover:text-text-navy hover:bg-border-warm/20'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Color Palette Section */}
        {(selectedVariant === 'all' || selectedVariant === 'palette') && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-16"
          >
            <div className="flex items-center gap-2.5 mb-6">
              <Palette className="w-5 h-5 text-accent-orange" />
              <h2 className="font-sora text-xl sm:text-2xl font-bold text-text-navy">Optimistic Color Palette</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Brand Gradient Card */}
              <Card className="flex flex-col justify-between h-48 bg-brand-gradient text-white overflow-hidden relative group">
                <div className="absolute right-[-20px] top-[-20px] w-32 h-32 rounded-full bg-white/10 blur-xl group-hover:scale-125 transition-transform duration-500" />
                <div className="relative z-10">
                  <span className="font-mono text-xs text-white/70">#FF6B4A → #FF4D6D → #8B5CF6</span>
                  <h3 className="font-sora font-extrabold text-xl mt-1">Brand Gradient</h3>
                </div>
                <p className="font-manrope text-xs text-white/90 leading-normal relative z-10">
                  Our energetic, optimistic primary visual identifier. Used for focal buttons, headings, and high-impact branding.
                </p>
              </Card>

              {/* Page Background Card */}
              <Card className="flex flex-col justify-between h-48 bg-white border border-border-warm/70">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-xs text-text-muted">#FFF3EB → #FFE8DC</span>
                    <span className="w-4 h-4 rounded-full bg-page-gradient border border-border-warm" />
                  </div>
                  <h3 className="font-sora font-bold text-lg text-text-navy mt-2">Page Background</h3>
                </div>
                <p className="font-manrope text-xs text-text-muted leading-relaxed">
                  Soft peach gradient that completely replaces typical harsh corporate blues or sterile whites. Soft, eye-safe, and welcoming.
                </p>
              </Card>

              {/* Surface/Card Color */}
              <Card className="flex flex-col justify-between h-48 bg-[#FFFBF8] border border-border-warm">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-xs text-text-muted">#FFFBF8</span>
                    <span className="w-4 h-4 rounded-full bg-[#FFFBF8] border border-border-warm" />
                  </div>
                  <h3 className="font-sora font-bold text-lg text-text-navy mt-2">Surface / Card</h3>
                </div>
                <p className="font-manrope text-xs text-text-muted leading-relaxed">
                  Warm white/cream tone for containers, cards, and UI surfaces. Enhances clarity and physical structure.
                </p>
              </Card>

              {/* Typography Color */}
              <Card className="flex flex-col justify-between h-48 bg-[#1A1A2E] text-white border-0">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-xs text-white/60">#1A1A2E</span>
                    <span className="w-4 h-4 rounded-full bg-[#1A1A2E] border border-white/20" />
                  </div>
                  <h3 className="font-sora font-bold text-lg mt-2">Navy & Grey Text</h3>
                </div>
                <p className="font-manrope text-xs text-white/80 leading-relaxed">
                  Deep navy navy replaces aggressive black text to retain strong typographic weight while avoiding high-contrast screen strain.
                </p>
              </Card>
            </div>
          </motion.div>
        )}

        {/* Typography Showcase */}
        {(selectedVariant === 'all' || selectedVariant === 'typography') && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-16"
          >
            <div className="flex items-center gap-2.5 mb-6">
              <Type className="w-5 h-5 text-accent-orange" />
              <h2 className="font-sora text-xl sm:text-2xl font-bold text-text-navy">Typography & Scale</h2>
            </div>

            <Card className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-6 border-b border-border-warm/50">
                <div className="lg:col-span-1">
                  <span className="font-mono text-xs text-text-muted block">Display Headings (Sora)</span>
                  <code className="text-xs font-mono text-accent-orange font-bold">font-sora tracking-tight font-bold</code>
                </div>
                <div className="lg:col-span-2 space-y-2">
                  <h3 className="font-sora text-3xl sm:text-4xl font-bold text-text-navy leading-tight">
                    Find your matches instantly.
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-6 border-b border-border-warm/50">
                <div className="lg:col-span-1">
                  <span className="font-mono text-xs text-text-muted block">Gradient Text Utility</span>
                  <code className="text-xs font-mono text-accent-orange font-bold">text-gradient font-black</code>
                </div>
                <div className="lg:col-span-2">
                  <h1 className="font-sora text-4xl sm:text-5xl font-extrabold text-text-navy">
                    The platform that puts <span className="text-gradient">Engineers First</span>
                  </h1>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Interactive Button Set */}
        {(selectedVariant === 'all' || selectedVariant === 'buttons') && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-16"
          >
            <div className="flex items-center gap-2.5 mb-6">
              <Code className="w-5 h-5 text-accent-orange" />
              <h2 className="font-sora text-xl sm:text-2xl font-bold text-text-navy">Interactive Button Set</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-sora font-bold text-lg text-text-navy mb-2">Pill-Shaped Actions</h3>
                  <p className="font-manrope text-sm text-text-muted leading-relaxed">
                    All buttons feature a fully rounded shape (<code className="text-xs font-mono text-accent-orange bg-accent-orange/5 px-1 py-0.5 rounded">rounded-full</code>) and support spring animation properties on hover or tap.
                  </p>
                </div>
              </Card>

              <Card className="lg:col-span-2 bg-[#FFFBF8] flex flex-col justify-between">
                <div className="flex flex-col sm:flex-row flex-wrap gap-4 items-center">
                  <div className="flex flex-col items-center gap-2">
                    <Button variant="primary">
                      Primary Gradient
                      <Sparkles className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <Button variant="secondary">
                      Secondary Outlined
                    </Button>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <Button variant="ghost">
                      Ghost Action
                    </Button>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-border-warm/50">
                  <div className="flex flex-col sm:flex-row items-center gap-6 justify-between bg-white p-4 rounded-xl border border-border-warm/60">
                    <div>
                      <p className="font-manrope text-sm font-semibold text-text-navy">Test State Loader</p>
                    </div>
                    <Button
                      variant={demoState.success ? 'secondary' : 'primary'}
                      onClick={triggerMockAction}
                      disabled={demoState.submitting}
                      className="min-w-44 py-2 text-xs"
                    >
                      {demoState.submitting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                          Optimizing CV...
                        </>
                      ) : demoState.success ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-success-green" />
                          Pre-vetted!
                        </>
                      ) : (
                        'Submit Resume'
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </motion.div>
        )}

        {/* Cards & Floating Info Panels */}
        {(selectedVariant === 'all' || selectedVariant === 'cards') && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-16"
          >
            <div className="flex items-center gap-2.5 mb-6">
              <Layers className="w-5 h-5 text-accent-orange" />
              <h2 className="font-sora text-xl sm:text-2xl font-bold text-text-navy">Cards & Floating Info Panels</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4 space-y-6">
                <Card className="bg-white">
                  <h3 className="font-sora font-bold text-lg text-text-navy mb-2">Base Cards</h3>
                  <p className="font-manrope text-sm text-text-muted leading-relaxed">
                    Engineered with soft <code className="text-xs font-mono text-accent-orange bg-accent-orange/5 px-1 py-0.5 rounded">rounded-2xl</code> borders, a custom <code className="text-xs font-mono text-accent-orange bg-accent-orange/5 px-1 py-0.5 rounded">shadow-warm-lg</code> to eliminate dark-grey corporate visual debris.
                  </p>
                </Card>
              </div>

              <div className="lg:col-span-8 space-y-6">
                <Card className="bg-white" hoverEffect={true}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <Badge text="Reverse Hiring Active" variant="gradient" pulse={true} />
                      <h3 className="font-sora text-xl font-bold text-text-navy mt-2">
                        Senior Front-End Architect
                      </h3>
                      <p className="font-manrope text-xs text-text-muted flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 text-accent-orange" /> Remote (USA, SF)
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-border-warm">
                    <Badge text="React 19" variant="orange" />
                    <Badge text="Tailwind v4" variant="purple" />
                    <Badge text="Vite + ESBuild" variant="muted" />
                    <Badge text="GoogleGenAI Verified" variant="green" />
                  </div>
                </Card>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FloatingInfoCard
                    icon={Briefcase}
                    title="AI Curated Pools"
                    subtitle="Pre-verified elite engineering matches sent bi-weekly."
                  />
                  <FloatingInfoCard
                    icon={UserCheck}
                    title="Direct Outreach"
                    subtitle="Bypass spam. Contact verified recruiters directly."
                    iconBgType="orange"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Avatars & Badges */}
        {(selectedVariant === 'all' || selectedVariant === 'avatars') && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-16"
          >
            <div className="flex items-center gap-2.5 mb-6">
              <UserCheck className="w-5 h-5 text-accent-orange" />
              <h2 className="font-sora text-xl sm:text-2xl font-bold text-text-navy">Avatars, Status Badges & Pills</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="space-y-6">
                <div className="flex flex-wrap items-end gap-6 p-4 bg-white rounded-xl border border-border-warm/60">
                  <Avatar src="https://picsum.photos/seed/engineer1/300/300" alt="Alex Rivera" size="xl" />
                  <Avatar src="https://picsum.photos/seed/designer1/300/300" alt="Sarah Chen" size="lg" />
                  <Avatar src="https://picsum.photos/seed/manager1/300/300" alt="Marcus Sterling" size="md" />
                </div>
              </Card>

              <Card className="flex flex-col justify-between">
                <div className="space-y-4">
                  <div>
                    <span className="font-mono text-[10px] text-text-muted uppercase mb-2 block">Standard Badges</span>
                    <div className="flex flex-wrap gap-2">
                      <Badge text="Reverse Hiring" variant="orange" />
                      <Badge text="Machine Learning" variant="purple" />
                      <Badge text="Fully Verified" variant="green" />
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </motion.div>
        )}

      </SectionContainer>
    </div>
  );
};
