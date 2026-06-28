import React from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  Search,
  SlidersHorizontal,
  Plus,
  Briefcase,
  Users,
  Eye,
  Settings,
  Grid,
  TrendingUp,
  MapPin,
  Calendar,
  Layers,
  ChevronRight,
  LogOut,
  Mail,
  Zap,
  CheckCircle2,
  Heart
} from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Avatar } from '../components/Avatar';
import { BackgroundBlob } from '../components/BackgroundBlobs';

export interface DashboardScreenProps {
  role: 'candidate' | 'recruiter';
  userData: { name?: string; email: string };
  onLogout: () => void;
  onNavigateToStyleGuide?: () => void;
  onEditProfile?: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  role,
  userData,
  onLogout,
  onNavigateToStyleGuide,
  onEditProfile,
}) => {
  const isCandidate = role === 'candidate';

  // Realistic mock data for Candidate
  const candidateMatches = [
    {
      company: 'Quantum Dynamics',
      logo: 'Q',
      logoBg: 'bg-indigo-600',
      role: 'Staff React Engineer',
      salary: '$195,000 - $220,000',
      matchScore: '98%',
      tags: ['React 19', 'Next.js', 'Distributed Systems'],
      location: 'SF / Remote',
      pitch: "Hey Alex, we saw your design work. We're launching our new AI workspace next month and would love for you to lead the architecture."
    },
    {
      company: 'Aether Flow',
      logo: 'Æ',
      logoBg: 'bg-emerald-600',
      role: 'Senior Front-End Architect',
      salary: '$180,000 - $205,000',
      matchScore: '94%',
      tags: ['Tailwind v4', 'Vite', 'TypeScript'],
      location: 'Fully Remote',
      pitch: "Our team focuses entirely on fast web interactions. Your experience with motion and custom canvases is exactly what we need."
    }
  ];

  // Realistic mock data for Recruiter
  const recruiterMatches = [
    {
      name: 'Alex Rivera',
      avatar: 'https://picsum.photos/seed/engineer1/150/150',
      title: 'Senior Front-End Architect',
      skills: ['React 19', 'Tailwind v4', 'Vite', 'TypeScript'],
      matchScore: '98%',
      desiredSalary: '$190,000+',
      experience: '8 years',
      pitch: 'Specializes in high-fidelity animations, micro-frontends, and rapid developer tooling. Active seeker.'
    },
    {
      name: 'Sarah Chen',
      avatar: 'https://picsum.photos/seed/designer1/150/150',
      title: 'Lead Product Developer',
      skills: ['Next.js', 'PostgreSQL', 'AI Prompt Engineering'],
      matchScore: '95%',
      desiredSalary: '$200,000+',
      experience: '6 years',
      pitch: 'Full-stack builder who ran product at YC backed developer workspace startup. Prefers remote.'
    }
  ];

  return (
    <div className="min-h-screen bg-page-gradient overflow-x-hidden font-manrope">
      
      {/* Background Decorative Accents */}
      <BackgroundBlob size="xl" className="-top-40 left-0 opacity-10" />
      <BackgroundBlob size="lg" className="top-1/3 -right-20 from-accent-purple via-brand-middle to-brand-start opacity-10" />

      {/* Main Dashboard Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-border-warm/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center text-white shadow-warm-md">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-sora font-extrabold text-base tracking-tight text-text-navy">
                Talent<span className="text-gradient">Sphere</span>
              </span>
            </div>

            {/* Middle Indicator */}
            <div className="hidden sm:flex items-center gap-2">
              <Badge 
                text={isCandidate ? "Candidate Workspace" : "Recruiter Console"} 
                variant={isCandidate ? "orange" : "purple"}
                pulse={true} 
              />
              <span className="text-xs font-semibold text-text-muted">
                Logged in as <strong className="text-text-navy">{userData.name || userData.email}</strong>
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {onNavigateToStyleGuide && (
                <button
                  onClick={onNavigateToStyleGuide}
                  className="px-3.5 py-1.5 rounded-full border border-border-warm text-xs font-semibold text-text-navy bg-white hover:bg-border-warm/20 transition cursor-pointer"
                >
                  Inspect Style Guide
                </button>
              )}
              <button
                onClick={onLogout}
                className="p-2 rounded-full border border-border-warm bg-white text-text-muted hover:text-red-500 hover:border-red-200 transition cursor-pointer"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-sora text-2xl sm:text-3xl font-extrabold text-text-navy tracking-tight">
              {isCandidate ? (
                <>
                  Your Anonymous <span className="text-gradient">Matches</span>
                </>
              ) : (
                <>
                  Hiring Candidate <span className="text-gradient">Talent Matcher</span>
                </>
              )}
            </h1>
            <p className="font-manrope text-sm text-text-muted mt-1">
              {isCandidate 
                ? 'High-growth tech companies pitching directly to your profile.' 
                : 'AI-curated matching queue based on live tech talent.'
              }
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" className="px-4 py-2 text-xs">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filter parameters
            </Button>
            <Button 
              variant="primary" 
              className="px-4 py-2 text-xs shadow-warm-sm"
              onClick={() => {
                if (isCandidate && onEditProfile) {
                  onEditProfile();
                }
              }}
            >
              <Plus className="w-3.5 h-3.5" />
              {isCandidate ? 'Optimize Profile' : 'Create job pitch'}
            </Button>
          </div>
        </div>

        {/* Status stats board */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 bg-white flex flex-col justify-between h-24">
            <span className="text-xs font-bold text-text-muted uppercase">Active Match Score</span>
            <span className="font-sora text-2xl font-extrabold text-text-navy flex items-center gap-1.5">
              98% <Zap className="w-5 h-5 text-accent-orange fill-accent-orange" />
            </span>
          </Card>
          <Card className="p-4 bg-white flex flex-col justify-between h-24">
            <span className="text-xs font-bold text-text-muted uppercase">
              {isCandidate ? 'Active pitches' : 'Active job listings'}
            </span>
            <span className="font-sora text-2xl font-extrabold text-text-navy">
              {isCandidate ? '12 Inbound' : '4 Openings'}
            </span>
          </Card>
          <Card className="p-4 bg-white flex flex-col justify-between h-24">
            <span className="text-xs font-bold text-text-muted uppercase">Profile Views</span>
            <span className="font-sora text-2xl font-extrabold text-text-navy">
              {isCandidate ? '184 (Anonymous)' : '2.4k Candidates'}
            </span>
          </Card>
          <Card className="p-4 bg-white flex flex-col justify-between h-24">
            <span className="text-xs font-bold text-text-muted uppercase">Hiring Priority</span>
            <span className="font-sora text-2xl font-extrabold text-text-navy text-accent-purple flex items-center gap-1.5">
              Urgent <CheckCircle2 className="w-5 h-5 text-accent-purple" />
            </span>
          </Card>
        </div>

        {/* Content Section Split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Matches column (2 cols wide) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-sora font-bold text-base text-text-navy uppercase tracking-wider">
                {isCandidate ? 'Incoming Company Pitches' : 'Recommended Candidates'}
              </h3>
              <Badge text="Updated 5m ago" variant="green" />
            </div>

            {isCandidate ? (
              // CANDIDATE VIEW
              candidateMatches.map((match, i) => (
                <Card key={i} className="bg-white hover:border-accent-orange/40 transition-all" hoverEffect={true}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-border-warm/50">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-extrabold font-sora ${match.logoBg}`}>
                        {match.logo}
                      </div>
                      <div>
                        <h4 className="font-sora font-bold text-base text-text-navy">{match.role}</h4>
                        <p className="font-manrope text-xs text-text-muted">{match.company} • {match.location}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <Badge text={`Match: ${match.matchScore}`} variant="gradient" />
                      <span className="text-xs font-bold text-accent-orange bg-accent-orange/5 px-2.5 py-1 rounded-full">
                        {match.salary}
                      </span>
                    </div>
                  </div>

                  {/* Company Pitch Text */}
                  <div className="p-3 bg-[#FFFBF8] rounded-xl border border-border-warm/60 mb-4">
                    <p className="text-xs sm:text-sm italic font-manrope text-text-muted leading-relaxed">
                      "{match.pitch}"
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    {/* Skills tags */}
                    <div className="flex flex-wrap gap-1.5">
                      {match.tags.map((tag) => (
                        <span key={tag} className="text-[10px] font-semibold bg-border-warm/50 text-text-navy px-2 py-0.5 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <Button variant="ghost" className="px-3 py-1.5 text-xs text-text-muted">
                        Decline anonymous pitch
                      </Button>
                      <Button variant="primary" className="px-4 py-1.5 text-xs shadow-warm-sm">
                        Accept & unlock identity
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              // RECRUITER VIEW
              recruiterMatches.map((match, i) => (
                <Card key={i} className="bg-white hover:border-accent-purple/40 transition-all" hoverEffect={true}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-border-warm/50">
                    <div className="flex items-center gap-3">
                      <Avatar src={match.avatar} alt={match.name} size="md" />
                      <div>
                        <h4 className="font-sora font-bold text-base text-text-navy">{match.name}</h4>
                        <p className="font-manrope text-xs text-text-muted">{match.title} • {match.experience} exp</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <Badge text={`Match: ${match.matchScore}`} variant="purple" />
                      <span className="text-xs font-bold text-accent-purple bg-accent-purple/5 px-2.5 py-1 rounded-full">
                        {match.desiredSalary}
                      </span>
                    </div>
                  </div>

                  {/* Pitch / Bio info */}
                  <div className="p-3 bg-[#FFFBF8] rounded-xl border border-border-warm/60 mb-4">
                    <p className="text-xs sm:text-sm font-manrope text-text-muted leading-relaxed">
                      {match.pitch}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    {/* Skills tags */}
                    <div className="flex flex-wrap gap-1.5">
                      {match.skills.map((skill) => (
                        <span key={skill} className="text-[10px] font-semibold bg-border-warm/50 text-text-navy px-2 py-0.5 rounded-full">
                          {skill}
                        </span>
                      ))}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <Button variant="ghost" className="px-3 py-1.5 text-xs text-text-muted">
                        Pass profile
                      </Button>
                      <Button variant="primary" className="px-4 py-1.5 text-xs shadow-warm-sm bg-accent-purple">
                        Pitch direct role
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Right sidebar column (1 col wide) */}
          <div className="space-y-6">
            <h3 className="font-sora font-bold text-base text-text-navy uppercase tracking-wider">
              Workspace Checklist
            </h3>

            <Card className="bg-white space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-success-green flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-text-navy">Authentication complete</p>
                  <p className="text-[11px] text-text-muted">Identity verified via secure session tokens.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-success-green flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-text-navy">Workspace role established</p>
                  <p className="text-[11px] text-text-muted">Tailored configuration set to <strong className="capitalize">{role}</strong>.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full border border-border-warm flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-text-navy">Sync portfolio / post opening</p>
                  <p className="text-[11px] text-text-muted">Required before first matching outreach triggers.</p>
                </div>
              </div>
            </Card>

            {/* Platform Insights */}
            <Card className="bg-brand-gradient text-white">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 text-[9px] font-semibold uppercase tracking-wider mb-2">
                <Sparkles className="w-3 h-3" /> TalentSphere AI
              </span>
              <h4 className="font-sora font-bold text-sm mb-1">Weekly Market Analytics</h4>
              <p className="font-manrope text-xs text-white/80 leading-normal mb-4">
                Our models project that senior animation engineers are seeing a 22% raise in pre-vetted outbound proposals this week. Keep tags active!
              </p>
              <div className="text-xs font-bold text-white hover:underline flex items-center gap-1 cursor-pointer">
                View trends report <ChevronRight className="w-3 h-3" />
              </div>
            </Card>
          </div>

        </div>

      </main>

      {/* Mini footer */}
      <footer className="max-w-7xl mx-auto px-4 text-center mt-12 text-xs text-text-muted/60">
        <p className="flex items-center justify-center gap-1">
          Made with <Heart className="w-3 h-3 text-accent-orange fill-accent-orange" /> in the Google AI Studio Workspace
        </p>
      </footer>

    </div>
  );
};
