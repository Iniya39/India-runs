import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Search,
  SlidersHorizontal,
  ChevronRight,
  Briefcase,
  MapPin,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ChevronDown,
  X,
  Send,
  MessageSquare,
  Bookmark,
  Share2,
  Users,
  Plus,
  Trash2,
  RotateCcw,
  ArrowLeft,
  Sliders,
  Filter,
  Check,
  Building,
  DollarSign,
  UserCheck,
  ExternalLink,
  Lock
} from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Avatar } from '../components/Avatar';
import { FloatingInfoCard } from '../components/FloatingInfoCard';
import { NavBar, NavLinkItem } from '../components/NavBar';
import { 
  db, 
  auth, 
  collection, 
  getDocs, 
  addDoc,
  serverTimestamp 
} from '../firebase';

// Interfaces for recruiter structures
export interface RecruiterJob {
  id: string;
  title: string;
  postedDate: string;
  status: 'Active' | 'Closed';
  applicantsCount: number;
  tags: string[];
  description: string;
  salary: string;
  location: string;
  experienceLevel: string;
  jobType: string;
  topCandidates: {
    name: string;
    avatarUrl: string;
    title: string;
    matchScore: number;
    skills: string[];
    pitch: string;
    experience: string;
    location: string;
    desiredSalary: string;
  }[];
}

interface RecruiterHomeScreenProps {
  userData: { name?: string; email: string; companyName?: string };
  onLogout: () => void;
  onNavigateToCompanySetup?: () => void;
}

// Sample candidates with realistic seed avatars
const CANDIDATES_POOL = [
  {
    name: 'Alex Rivera',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    title: 'Senior Front-End Architect',
    matchScore: 98,
    skills: ['React 19', 'Tailwind v4', 'Vite', 'TypeScript'],
    experience: '8 years',
    location: 'SF / Remote',
    desiredSalary: '$195,000',
    pitch: 'Specializes in high-fidelity animations, micro-frontends, and rapid developer tooling. Active seeker.'
  },
  {
    name: 'Sarah Chen',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
    title: 'Lead Product Developer',
    matchScore: 95,
    skills: ['Next.js', 'PostgreSQL', 'AI Prompt Engineering', 'TypeScript'],
    experience: '6 years',
    location: 'Fully Remote',
    desiredSalary: '$200,000',
    pitch: 'Full-stack builder who ran product at YC backed developer workspace startup. Prefers remote.'
  },
  {
    name: 'Marcus Brody',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    title: 'Staff UI Engineer',
    matchScore: 92,
    skills: ['React', 'Framer Motion', 'Tailwind', 'CSS Canvases'],
    experience: '9 years',
    location: 'Austin, TX',
    desiredSalary: '$185,000',
    pitch: 'Obsessed with fluid interfaces and micro-interactions. Created popular open-source layouts.'
  },
  {
    name: 'Emily Watson',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    title: 'Senior Product Engineer',
    matchScore: 89,
    skills: ['Next.js', 'GraphQL', 'Node.js', 'Vite'],
    experience: '7 years',
    location: 'Fully Remote',
    desiredSalary: '$175,000',
    pitch: 'Passionate about bridging visual design and bulletproof server architecture.'
  },
  {
    name: 'Jordan Miller',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    title: 'Full-Stack React Developer',
    matchScore: 84,
    skills: ['React', 'Node.js', 'Tailwind', 'Firebase'],
    experience: '5 years',
    location: 'New York, NY',
    desiredSalary: '$150,000',
    pitch: 'Fast-paced developer with strong focus on clean state engines and SaaS delivery.'
  }
];

const DEFAULT_RECRUITER_JOBS: RecruiterJob[] = [
  {
    id: 'rec-job-1',
    title: 'Staff React Engineer',
    postedDate: 'Posted 2 days ago',
    status: 'Active',
    applicantsCount: 24,
    tags: ['React 19', 'Next.js', 'Distributed Systems'],
    description: 'Lead front-end scaling efforts for our next-generation visual automation designer. Build responsive component systems that sync in real-time.',
    salary: '$195,000 - $220,000',
    location: 'SF / Remote',
    experienceLevel: 'Senior',
    jobType: 'Full-time',
    topCandidates: [
      CANDIDATES_POOL[0], // Alex Rivera
      CANDIDATES_POOL[1], // Sarah Chen
      CANDIDATES_POOL[2], // Marcus Brody
      CANDIDATES_POOL[3], // Emily Watson
    ]
  },
  {
    id: 'rec-job-2',
    title: 'Senior Front-End Architect',
    postedDate: 'Posted 5 days ago',
    status: 'Active',
    applicantsCount: 12,
    tags: ['Tailwind v4', 'Vite', 'TypeScript'],
    description: 'Architect a blisteringly fast multi-tenant dashboard system. Focus heavily on layout animations, rendering efficiency, and flawless visual typography.',
    salary: '$180,000 - $205,000',
    location: 'Fully Remote',
    experienceLevel: 'Senior',
    jobType: 'Full-time',
    topCandidates: [
      CANDIDATES_POOL[1], // Sarah Chen
      CANDIDATES_POOL[2], // Marcus Brody
      CANDIDATES_POOL[3], // Emily Watson
    ]
  },
  {
    id: 'rec-job-3',
    title: 'Product Engineer (AI Systems)',
    postedDate: 'Posted 2 weeks ago',
    status: 'Closed',
    applicantsCount: 45,
    tags: ['Next.js', 'Generative AI', 'PostgreSQL'],
    description: 'Integrate multi-modal LLM features directly into the core workflow interface. Work closely with product designers to map raw models to delightful tools.',
    salary: '$160,000 - $190,000',
    location: 'Austin, TX',
    experienceLevel: 'Senior',
    jobType: 'Full-time',
    topCandidates: [
      CANDIDATES_POOL[0], // Alex Rivera
      CANDIDATES_POOL[1], // Sarah Chen
      CANDIDATES_POOL[3], // Emily Watson
      CANDIDATES_POOL[4], // Jordan Miller
    ]
  }
];

export const RecruiterHomeScreen: React.FC<RecruiterHomeScreenProps> = ({
  userData,
  onLogout,
  onNavigateToCompanySetup,
}) => {
  // Navigation tabs state
  const [activeTab, setActiveTab] = useState<'home' | 'candidates' | 'messages' | 'company-settings'>('home');
  const [activeView, setActiveView] = useState<'home' | 'ranking'>('home');
  
  // Jobs List State
  const [jobs, setJobs] = useState<RecruiterJob[]>(DEFAULT_RECRUITER_JOBS);
  const [selectedJob, setSelectedJob] = useState<RecruiterJob | null>(null);
  
  // Search state
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [showSearchFilters, setShowSearchFilters] = useState(false);
  
  // UI filter states
  const [filterLocation, setFilterLocation] = useState('All');
  const [filterExperience, setFilterExperience] = useState('All');
  const [filterSkill, setFilterSkill] = useState('All');
  
  // Interaction states
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activePitchCandidate, setActivePitchCandidate] = useState<any | null>(null);
  const [pitchText, setPitchText] = useState('');
  const [isSubmittingPitch, setIsSubmittingPitch] = useState(false);
  const [pitchSuccess, setPitchSuccess] = useState(false);

  // Notifications
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Nav bar links configuration (Recruiter style)
  const navLinks: NavLinkItem[] = [
    {
      label: 'Home',
      href: '#home',
      active: activeTab === 'home' && activeView === 'home',
      onClick: () => {
        setActiveTab('home');
        setActiveView('home');
        setSelectedJob(null);
      }
    },
    {
      label: 'Candidates',
      href: '#candidates',
      active: activeTab === 'candidates' || activeView === 'ranking',
      onClick: () => {
        setActiveTab('candidates');
        // Automatically open the first active job ranking or general search ranking
        const firstActive = jobs.find(j => j.status === 'Active') || jobs[0];
        if (firstActive) {
          setSelectedJob(firstActive);
          setActiveView('ranking');
        } else {
          // If no jobs, show ranking with null context (general candidate pool)
          setSelectedJob(null);
          setActiveView('ranking');
        }
        triggerToast("Viewing AI Candidate Matchmaking Pool");
      }
    },
    {
      label: 'Messages',
      href: '#messages',
      active: activeTab === 'messages',
      onClick: () => {
        setActiveTab('messages');
        triggerToast("Recruiter Chat Inbox (Placeholder)");
      }
    },
    {
      label: 'Company Settings',
      href: '#company-settings',
      active: activeTab === 'company-settings',
      onClick: () => {
        setActiveTab('company-settings');
        if (onNavigateToCompanySetup) {
          onNavigateToCompanySetup();
        } else {
          triggerToast("Navigate to Company Setup Screen");
        }
      }
    }
  ];

  // Global search submission -> Navigates to AI Ranking Screen
  const handleGlobalSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalSearchQuery.trim()) return;
    
    // Choose a job context if possible, or leave it as general search ranking
    const matchedJob = jobs.find(j => 
      j.title.toLowerCase().includes(globalSearchQuery.toLowerCase()) || 
      j.tags.some(t => t.toLowerCase().includes(globalSearchQuery.toLowerCase()))
    );
    
    setSelectedJob(matchedJob || null);
    setActiveView('ranking');
    setActiveTab('candidates');
    triggerToast(`Searching AI matches for "${globalSearchQuery}"`);
  };

  // Delete Job Posting (for demonstrating Empty State)
  const handleDeleteJob = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setJobs(prev => prev.filter(job => job.id !== id));
    triggerToast("Job posting deleted");
  };

  // Restore Default Jobs (for convenience in Empty State)
  const handleRestoreDefaultJobs = () => {
    setJobs(DEFAULT_RECRUITER_JOBS);
    triggerToast("Restored demo job listings");
  };

  // Action: Open Rank candidates for specific job
  const handleViewRankedCandidates = (job: RecruiterJob) => {
    setSelectedJob(job);
    setActiveView('ranking');
    setActiveTab('candidates');
    triggerToast(`Opening match analysis for ${job.title}`);
  };

  // Action: Submit Direct Pitch to Candidate
  const handleSendDirectPitch = () => {
    if (!activePitchCandidate) return;
    setIsSubmittingPitch(true);
    
    setTimeout(() => {
      setIsSubmittingPitch(false);
      setPitchSuccess(true);
      triggerToast(`Direct pitch submitted to ${activePitchCandidate.name}!`);
      
      // Clear after visual delay
      setTimeout(() => {
        setActivePitchCandidate(null);
        setPitchSuccess(false);
        setPitchText('');
      }, 1800);
    }, 1200);
  };

  // Candidates list inside the AI Ranking Screen, filtered based on query and UI selections
  const displayCandidates = (selectedJob ? selectedJob.topCandidates : CANDIDATES_POOL).filter(cand => {
    // Quick search query filter
    const matchesSearch = globalSearchQuery 
      ? cand.name.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
        cand.title.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
        cand.skills.some(s => s.toLowerCase().includes(globalSearchQuery.toLowerCase()))
      : true;
    
    // UI selections
    const matchesLocation = filterLocation === 'All' 
      ? true 
      : filterLocation === 'SF / Remote' 
        ? cand.location.includes('SF') || cand.location.includes('Remote')
        : filterLocation === 'Fully Remote'
          ? cand.location === 'Fully Remote'
          : cand.location.includes(filterLocation);

    const matchesExperience = filterExperience === 'All'
      ? true
      : filterExperience === 'Senior'
        ? parseInt(cand.experience) >= 6
        : parseInt(cand.experience) < 6;

    const matchesSkill = filterSkill === 'All'
      ? true
      : cand.skills.includes(filterSkill);

    return matchesSearch && matchesLocation && matchesExperience && matchesSkill;
  });

  return (
    <div className="min-h-screen bg-page-gradient overflow-x-hidden font-manrope pb-12">
      
      {/* 1. PERSISTENT NAV BAR */}
      <NavBar 
        links={navLinks}
        user={{
          name: userData.name || 'Anonymous Recruiter',
          email: userData.email,
        }}
        onLogout={onLogout}
        onProfileClick={() => triggerToast("Viewing Profile Modal")}
        onSettingsClick={onNavigateToCompanySetup}
      />

      {/* Toast notifications */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-text-navy text-white px-5 py-3 rounded-full shadow-warm-lg flex items-center gap-2 border border-white/10"
          >
            <CheckCircle2 className="w-4 h-4 text-accent-purple" />
            <span className="text-xs font-semibold font-manrope">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">

        {/* --- ROUTING SWITCH --- */}
        <AnimatePresence mode="wait">
          {activeView === 'home' ? (
            
            /* ==================== SCREEN A: RECRUITER HOME ==================== */
            <motion.div
              key="recruiter-home"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-8"
            >
              
              {/* Header Greeting & Analytics Intro */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="font-sora text-2xl sm:text-3xl font-extrabold text-text-navy tracking-tight">
                    Recruiter Console: <span className="text-gradient-purple">{userData.companyName || 'TalentSphere Workspace'}</span>
                  </h1>
                  <p className="font-manrope text-sm text-text-muted mt-1">
                    Manage active hiring mandates, track incoming applicants, and initiate secure AI matches.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {jobs.length < DEFAULT_RECRUITER_JOBS.length && (
                    <button
                      onClick={handleRestoreDefaultJobs}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border-warm bg-white text-xs font-bold text-text-muted hover:text-text-navy transition cursor-pointer"
                      title="Reset demo data"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reset Demo
                    </button>
                  )}
                  <div className="flex items-center gap-2 bg-purple-50 border border-accent-purple/10 px-4 py-2 rounded-2xl shadow-warm-sm">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-purple opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-purple"></span>
                    </span>
                    <span className="text-xs font-bold text-text-navy font-manrope">Hiring Engine: Active</span>
                  </div>
                </div>
              </div>

              {/* 2. SEARCH BAR (GLOBAL CANDIDATE QUICK SEARCH) */}
              <form onSubmit={handleGlobalSearchSubmit} className="w-full flex flex-col gap-3">
                <div className="relative flex items-center">
                  <div className="absolute left-4.5 text-text-muted pointer-events-none">
                    <Search className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={globalSearchQuery}
                    onChange={(e) => setGlobalSearchQuery(e.target.value)}
                    placeholder="Search candidates by name, skill, or role..."
                    className="w-full pl-12 pr-14 py-3.5 bg-white border border-border-warm rounded-full font-manrope text-sm text-text-navy focus:outline-none focus:border-accent-purple focus:ring-2 focus:ring-accent-purple/10 shadow-warm-sm hover:border-accent-purple/35 transition-all duration-300"
                  />
                  
                  {/* Filter Toggle Icon (UI only for global, can toggle filters row below) */}
                  <button
                    type="button"
                    onClick={() => setShowSearchFilters(!showSearchFilters)}
                    className={`absolute right-3.5 p-2 rounded-full border cursor-pointer transition-all ${
                      showSearchFilters || filterLocation !== 'All' || filterExperience !== 'All' || filterSkill !== 'All'
                        ? 'border-accent-purple bg-accent-purple/10 text-accent-purple'
                        : 'border-border-warm bg-white text-text-muted hover:bg-border-warm/30 hover:text-text-navy'
                    }`}
                    title="Toggle filters"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                  </button>
                </div>

                {/* Collapsible UI-only Search Filters */}
                <AnimatePresence>
                  {showSearchFilters && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden bg-white/70 backdrop-blur-md rounded-2xl border border-border-warm shadow-warm-md p-4 flex flex-col gap-4"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-text-navy uppercase tracking-wider">Candidate Location</label>
                          <select
                            value={filterLocation}
                            onChange={(e) => setFilterLocation(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-border-warm rounded-xl font-manrope text-xs text-text-navy focus:outline-none focus:border-accent-purple appearance-none"
                          >
                            <option value="All">All Locations</option>
                            <option value="SF / Remote">SF / Remote</option>
                            <option value="Fully Remote">Fully Remote</option>
                            <option value="New York, NY">New York, NY</option>
                            <option value="Austin, TX">Austin, TX</option>
                          </select>
                        </div>
                        
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-text-navy uppercase tracking-wider">Experience Range</label>
                          <select
                            value={filterExperience}
                            onChange={(e) => setFilterExperience(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-border-warm rounded-xl font-manrope text-xs text-text-navy focus:outline-none focus:border-accent-purple appearance-none"
                          >
                            <option value="All">All Experience Ranges</option>
                            <option value="Senior">Senior level (6+ years)</option>
                            <option value="Mid">Mid level (&lt; 6 years)</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-text-navy uppercase tracking-wider">Key Tech Stack</label>
                          <select
                            value={filterSkill}
                            onChange={(e) => setFilterSkill(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-border-warm rounded-xl font-manrope text-xs text-text-navy focus:outline-none focus:border-accent-purple appearance-none"
                          >
                            <option value="All">All Core Skills</option>
                            <option value="React 19">React 19</option>
                            <option value="Next.js">Next.js</option>
                            <option value="TypeScript">TypeScript</option>
                            <option value="Framer Motion">Framer Motion</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-between items-center border-t border-border-warm/40 pt-3 text-[10px] text-text-muted">
                        <span>Filters will apply to the AI Ranking screen upon searching.</span>
                        <button
                          type="button"
                          onClick={() => {
                            setFilterLocation('All');
                            setFilterExperience('All');
                            setFilterSkill('All');
                            setGlobalSearchQuery('');
                          }}
                          className="font-bold text-accent-purple hover:underline cursor-pointer"
                        >
                          Clear Filters
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>

              {/* 3. HEADER ROW & PRIMARY ACTION */}
              <div className="flex items-center justify-between border-b border-border-warm/30 pb-3">
                <div className="flex flex-col">
                  <h2 className="font-sora font-extrabold text-lg text-text-navy">
                    New Hiring
                  </h2>
                  <p className="text-xs text-text-muted">
                    Your active job mandates mapped to TalentSphere candidate profiles.
                  </p>
                </div>
                
                <Button 
                  variant="primary" 
                  onClick={() => triggerToast("Form Screen 'Post a new job' (Placeholder)")}
                  className="px-4 py-2 text-xs font-bold shadow-warm-sm bg-brand-gradient hover:scale-[1.01]"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Post a new job
                </Button>
              </div>

              {/* 4. JOB CARDS GRID (or EMPTY STATE) */}
              {jobs.length === 0 ? (
                
                /* ==================== EMPTY STATE ==================== */
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-16 px-6 bg-white border-2 border-dashed border-border-warm rounded-3xl text-center max-w-2xl mx-auto w-full flex flex-col items-center gap-4 shadow-warm-sm"
                >
                  <div className="w-14 h-14 rounded-full bg-purple-50 flex items-center justify-center text-accent-purple border border-accent-purple/15">
                    <Building className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-sora font-bold text-text-navy">You haven't posted a job yet</h3>
                    <p className="text-xs sm:text-sm text-text-muted mt-1.5 max-w-md mx-auto leading-relaxed">
                      Post your first opening and let our secure AI matchmaker scout, score, and queue pre-vetted tech talent.
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 mt-2">
                    <Button 
                      variant="primary" 
                      onClick={() => triggerToast("Form Screen 'Post a new job' (Placeholder)")}
                      className="px-6 py-2.5 text-xs font-bold bg-brand-gradient shadow-warm-sm"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Post your first job opening
                    </Button>
                    <Button 
                      variant="secondary"
                      onClick={handleRestoreDefaultJobs}
                      className="px-4 py-2.5 text-xs font-bold border-border-warm text-text-muted hover:text-text-navy"
                    >
                      Restore Demo Jobs
                    </Button>
                  </div>
                </motion.div>

              ) : (

                /* ==================== ACTIVE LISTINGS GRID ==================== */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {jobs.map((job) => (
                    <Card
                      key={job.id}
                      className="bg-white border border-border-warm hover:border-accent-purple/35 hover:shadow-warm-md transition-all duration-300 p-5 flex flex-col justify-between"
                    >
                      <div>
                        {/* Title, Posted Date, Status Badge */}
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div>
                            <h3 className="font-sora font-extrabold text-base sm:text-lg text-text-navy leading-snug">
                              {job.title}
                            </h3>
                            <span className="font-manrope text-xs text-text-muted block mt-0.5">
                              {job.postedDate}
                            </span>
                          </div>
                          
                          {/* Status Badge */}
                          <Badge 
                            text={job.status} 
                            variant={job.status === 'Active' ? 'green' : 'muted'} 
                            className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5"
                          />
                        </div>

                        {/* Salary and Location Details bar */}
                        <div className="flex flex-wrap items-center gap-y-1.5 gap-x-3 text-[11px] text-text-muted mb-4 border-b border-border-warm/30 pb-3">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-accent-purple" />
                            {job.location}
                          </span>
                          <span className="text-text-navy font-bold">{job.salary}</span>
                        </div>

                        {/* Job Description Snapshot */}
                        <p className="font-manrope text-xs text-text-muted leading-relaxed line-clamp-2 mb-5">
                          {job.description}
                        </p>

                        {/* APPLICANT COUNT ROW - HIGHLIGHTED PROMINENTLY */}
                        <div className="flex items-center justify-between gap-4 bg-purple-50/30 border border-accent-purple/5 p-3 rounded-2xl mb-5">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-accent-purple/10 flex items-center justify-center text-accent-purple">
                              <UserCheck className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-[10px] uppercase font-bold text-text-muted block tracking-wider">Total Applicants</span>
                              <span className="text-sm font-extrabold text-text-navy font-sora">
                                {job.applicantsCount} applicants
                              </span>
                            </div>
                          </div>

                          {/* Stacked circular Avatar list of top ranks */}
                          <div className="flex items-center">
                            <div className="flex -space-x-2 mr-2">
                              {job.topCandidates.slice(0, 4).map((cand, idx) => (
                                <div key={idx} className="relative ring-2 ring-white rounded-full overflow-hidden">
                                  <Avatar 
                                    src={cand.avatarUrl} 
                                    alt={cand.name} 
                                    size="sm" 
                                    className="w-7 h-7"
                                  />
                                </div>
                              ))}
                            </div>
                            
                            {/* Overflow Indicator (+19 pattern) */}
                            {job.applicantsCount > 4 && (
                              <span className="text-[10px] font-extrabold text-text-navy bg-border-warm/60 px-2 py-0.5 rounded-full font-sora border border-white">
                                +{job.applicantsCount - 4}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Primary action / Secondary action */}
                      <div className="flex items-center justify-between gap-4 mt-2">
                        {/* Edit job - Secondary Link */}
                        <button
                          onClick={() => triggerToast(`Edit Job details modal for "${job.title}" (Placeholder)`)}
                          className="text-xs font-semibold text-text-muted hover:text-accent-purple transition-colors cursor-pointer"
                        >
                          Edit job
                        </button>

                        <div className="flex items-center gap-2">
                          {/* Trash button helper */}
                          <button
                            onClick={(e) => handleDeleteJob(job.id, e)}
                            className="p-2 text-text-muted hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer border border-border-warm/40 bg-white"
                            title="Delete Listing"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          {/* View ranked candidates button */}
                          <Button
                            variant="primary"
                            onClick={() => handleViewRankedCandidates(job)}
                            className="py-2 px-4 text-xs font-bold bg-accent-purple shadow-warm-sm hover:scale-[1.01]"
                          >
                            View ranked candidates
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>

                    </Card>
                  ))}
                </div>
              )}

            </motion.div>

          ) : (

            /* ==================== SCREEN B: AI RANKING SCREEN ==================== */
            <motion.div
              key="recruiter-ranking"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-6"
            >
              {/* Back Link / breadcrumb */}
              <div>
                <button
                  onClick={() => {
                    setActiveView('home');
                    setActiveTab('home');
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold text-text-muted hover:text-accent-purple transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Job Postings
                </button>
              </div>

              {/* Title Header Row */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border-warm/30 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge text="AI MATCHMAKING ENGINE" variant="purple" pulse={true} className="text-[9px] px-2" />
                    {selectedJob && (
                      <span className="text-xs font-semibold text-text-muted">
                        • {selectedJob.salary}
                      </span>
                    )}
                  </div>
                  <h1 className="font-sora text-xl sm:text-2xl font-extrabold text-text-navy">
                    {selectedJob ? (
                      <>
                        Ranked Matches for <span className="text-gradient-purple">{selectedJob.title}</span>
                      </>
                    ) : (
                      'Global AI Candidate Ranking'
                    )}
                  </h1>
                  <p className="text-xs sm:text-sm text-text-muted font-manrope">
                    Pre-evaluated candidates matching this profile, ordered by objective tech score and capability vectors.
                  </p>
                </div>

                {/* Info stat */}
                <div className="flex items-center gap-3 self-start md:self-auto bg-white border border-border-warm px-4 py-2.5 rounded-2xl shadow-warm-sm">
                  <div className="text-right">
                    <span className="text-[9px] uppercase font-bold text-text-muted block tracking-wider">Analysis Status</span>
                    <span className="text-xs font-extrabold text-text-navy font-manrope">
                      {displayCandidates.length} profiles qualified
                    </span>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-accent-purple">
                    <Sparkles className="w-4 h-4 fill-accent-purple/20" />
                  </div>
                </div>
              </div>

              {/* Filtering Controls inside Ranking Screen */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/60 backdrop-blur border border-border-warm p-4 rounded-2xl shadow-warm-sm">
                
                {/* Internal Search */}
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-text-muted" />
                  <input
                    type="text"
                    placeholder="Refine list by name/skill..."
                    value={globalSearchQuery}
                    onChange={(e) => setGlobalSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 bg-white border border-border-warm rounded-xl text-xs text-text-navy focus:outline-none focus:border-accent-purple"
                  />
                </div>

                {/* Dropdowns */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Location selector */}
                  <div className="relative">
                    <select
                      value={filterLocation}
                      onChange={(e) => setFilterLocation(e.target.value)}
                      className="bg-white border border-border-warm rounded-xl px-2.5 py-1.5 text-xs text-text-navy font-medium pr-7 appearance-none focus:outline-none focus:border-accent-purple"
                    >
                      <option value="All">All Locations</option>
                      <option value="SF / Remote">SF / Remote</option>
                      <option value="Fully Remote">Fully Remote</option>
                      <option value="New York, NY">New York, NY</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-2.5 w-3 h-3 text-text-muted pointer-events-none" />
                  </div>

                  {/* Tech stack filter */}
                  <div className="relative">
                    <select
                      value={filterSkill}
                      onChange={(e) => setFilterSkill(e.target.value)}
                      className="bg-white border border-border-warm rounded-xl px-2.5 py-1.5 text-xs text-text-navy font-medium pr-7 appearance-none focus:outline-none focus:border-accent-purple"
                    >
                      <option value="All">All Skills</option>
                      <option value="React 19">React 19</option>
                      <option value="Next.js">Next.js</option>
                      <option value="TypeScript">TypeScript</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-2.5 w-3 h-3 text-text-muted pointer-events-none" />
                  </div>

                  {/* Reset */}
                  {(filterLocation !== 'All' || filterSkill !== 'All' || globalSearchQuery !== '') && (
                    <button
                      onClick={() => {
                        setFilterLocation('All');
                        setFilterSkill('All');
                        setGlobalSearchQuery('');
                      }}
                      className="text-xs font-bold text-accent-purple hover:underline px-2 cursor-pointer"
                    >
                      Reset Filters
                    </button>
                  )}
                </div>
              </div>

              {/* CANDIDATES LISTING ROW (Vetted Candidates List) */}
              {displayCandidates.length === 0 ? (
                <div className="py-12 bg-white/40 border border-border-warm border-dashed rounded-3xl text-center text-xs text-text-muted font-manrope">
                  No matching candidates fit your current search query / filters inside this listing.
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  {displayCandidates.map((match, idx) => (
                    <motion.div
                      key={match.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Card 
                        className="bg-white border border-border-warm hover:border-accent-purple/35 transition-all duration-300 p-5 flex flex-col gap-4 shadow-warm-sm"
                      >
                        {/* Upper Details Row */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border-warm/35">
                          <div className="flex items-center gap-3">
                            <Avatar src={match.avatarUrl} alt={match.name} size="md" className="ring-2 ring-accent-purple/15" />
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-sora font-extrabold text-base text-text-navy">{match.name}</h4>
                                <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  <Lock className="w-2.5 h-2.5" /> Identity Locked
                                </span>
                              </div>
                              <p className="font-manrope text-xs text-text-muted mt-0.5">{match.title} • {match.experience} exp</p>
                            </div>
                          </div>

                          {/* Matching evaluation & salary expectation */}
                          <div className="flex items-center gap-2 self-start sm:self-center">
                            <Badge text={`${match.matchScore}% Score`} variant="purple" pulse={match.matchScore >= 95} className="font-bold text-[10px]" />
                            <span className="text-xs font-bold text-accent-purple bg-accent-purple/5 px-2.5 py-1 rounded-full font-manrope">
                              {match.desiredSalary} desired
                            </span>
                          </div>
                        </div>

                        {/* Middle bio evaluation */}
                        <div className="p-3 bg-purple-50/10 rounded-xl border border-border-warm/50 text-xs sm:text-sm text-text-muted font-manrope leading-relaxed">
                          <span className="font-bold text-[10px] text-accent-purple uppercase block tracking-wider mb-1">AI Match Summary</span>
                          {match.pitch}
                        </div>

                        {/* Lower Action Row (Skills & Action Proposals) */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-1">
                          {/* Tech stack */}
                          <div className="flex flex-wrap gap-1.5">
                            {match.skills.map((skill) => (
                              <span key={skill} className="text-[10px] font-semibold bg-border-warm/50 text-text-navy px-2.5 py-0.5 rounded-full font-manrope">
                                {skill}
                              </span>
                            ))}
                          </div>

                          {/* Pitch Actions */}
                          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                            <Button 
                              variant="ghost" 
                              onClick={() => triggerToast(`Passed profile: ${match.name}`)}
                              className="px-3.5 py-1.5 text-xs text-text-muted hover:text-red-600 transition"
                            >
                              Pass profile
                            </Button>
                            
                            <Button 
                              variant="primary" 
                              onClick={() => {
                                setActivePitchCandidate(match);
                                setPitchText(`Hi ${match.name.split(' ')[0]}, we reviewed your GitHub profile and senior UI engineering background. We are scaling our Staff React team at Quantum and would love to introduce our mandate. Is this anonymous path open to a confidential chat?`);
                              }}
                              className="px-4 py-1.5 text-xs font-bold shadow-warm-sm bg-accent-purple hover:scale-[1.01]"
                            >
                              <MessageSquare className="w-3.5 h-3.5 mr-1" />
                              Pitch direct role
                            </Button>
                          </div>
                        </div>

                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}

            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* 5. RECRUITER PITCH OUTBOX OVERLAY MODAL */}
      <AnimatePresence>
        {activePitchCandidate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!isSubmittingPitch) setActivePitchCandidate(null);
              }}
              className="absolute inset-0 bg-text-navy/50 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-white rounded-3xl border border-border-warm shadow-warm-xl p-6 sm:p-7 z-10 flex flex-col gap-4.5"
            >
              <button
                onClick={() => setActivePitchCandidate(null)}
                className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-border-warm/20 text-text-muted hover:text-text-navy transition cursor-pointer"
                disabled={isSubmittingPitch}
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex gap-3 pb-3 border-b border-border-warm/40">
                <Avatar src={activePitchCandidate.avatarUrl} alt={activePitchCandidate.name} size="sm" className="ring-2 ring-accent-purple/10" />
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-sora font-extrabold text-sm sm:text-base text-text-navy">
                      Pitch {activePitchCandidate.name}
                    </h3>
                    <Badge text="98% Match" variant="purple" className="text-[9px] px-2 py-0" />
                  </div>
                  <p className="font-manrope text-xs text-text-muted mt-0.5">
                    Anonymous Outreach for: {selectedJob ? selectedJob.title : 'Talent Pool Opportunity'}
                  </p>
                </div>
              </div>

              {!pitchSuccess ? (
                <>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-text-navy uppercase tracking-wider">
                      <span>Confidential Proposals Note</span>
                      <span className="text-[9px] text-accent-purple bg-purple-50 px-2 py-0.5 rounded-full font-bold">1 Credit</span>
                    </div>
                    
                    <p className="text-xs text-text-muted leading-relaxed mb-1 bg-surface border border-border-warm p-3 rounded-2xl">
                      Outreach is kept <strong>completely private</strong>. Your corporate brand is masked under confidential vectors until this pre-qualified candidate accepts.
                    </p>

                    <textarea
                      value={pitchText}
                      onChange={(e) => setPitchText(e.target.value)}
                      placeholder="Compose your customized pitch message..."
                      className="w-full px-3.5 py-3 bg-surface border border-border-warm rounded-2xl font-manrope text-xs text-text-navy focus:outline-none focus:border-accent-purple focus:ring-1 focus:ring-accent-purple transition-all h-32 resize-none leading-relaxed"
                      disabled={isSubmittingPitch}
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-border-warm/40 mt-1">
                    <Button
                      variant="secondary"
                      onClick={() => setActivePitchCandidate(null)}
                      className="py-1.5 px-4 text-xs"
                      disabled={isSubmittingPitch}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleSendDirectPitch}
                      className="py-1.5 px-5 text-xs font-bold bg-accent-purple shadow-warm-sm"
                      disabled={isSubmittingPitch || !pitchText.trim()}
                    >
                      {isSubmittingPitch ? (
                        <span className="flex items-center gap-1">
                          <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Sending Out...
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Send className="w-3.5 h-3.5" />
                          Send Confidential Proposal
                        </span>
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                /* Success screen */
                <div className="text-center py-6 flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-success-green/10 flex items-center justify-center text-success-green border border-success-green/10">
                    <Check className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-text-navy">Confidential Pitch Sent Successfully!</h4>
                    <p className="text-xs text-text-muted mt-1 leading-relaxed max-w-xs mx-auto">
                      {activePitchCandidate.name} has been notified anonymously. You will be alerted the second they agree to unlock full profile credentials.
                    </p>
                  </div>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
