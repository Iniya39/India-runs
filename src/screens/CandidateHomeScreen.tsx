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
  Share2
} from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { FloatingInfoCard } from '../components/FloatingInfoCard';
import { NavBar, NavLinkItem } from '../components/NavBar';
import { PrivateChat } from '../components/PrivateChat';
import { JobDetailScreen } from './JobDetailScreen';
import { CandidateAIDashboard } from '../components/CandidateAIDashboard';
import { syncApplicationState, getCandidateUid } from '../lib/chatUtils';
import { 
  db, 
  auth, 
  collection, 
  getDocs, 
  doc, 
  getDoc,
  addDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  where
} from '../supabase';

export interface JobMatch {
  id: string;
  title: string;
  companyName: string;
  logoBg?: string;
  logoText?: string;
  logoUrl?: string;
  industry: string;
  companySize: string;
  location: string;
  jobType: string;
  experienceLevel: string;
  salary: string;
  matchScore: number;
  tags: string[];
  description: string;
  pitch?: string;
  postedDate: string; // e.g. "2 days ago"
  isReverseRecruitment: boolean;
  recruiterUid?: string;
}

interface CandidateHomeScreenProps {
  userData: { uid?: string; name?: string; email: string; role?: string };
  onLogout: () => void;
  onNavigateToProfile: () => void;
}

export const CandidateHomeScreen: React.FC<CandidateHomeScreenProps> = ({
  userData,
  onLogout,
  onNavigateToProfile,
}) => {
  // Navigation tabs state
  const [activeTab, setActiveTab] = useState<'home' | 'applications' | 'messages' | 'profile' | 'ai-profile'>('home');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Deep-link / Hash-based routing state for full Job Detail page
  const [selectedJobIdForDetail, setSelectedJobIdForDetail] = useState<string | null>(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#/job/')) {
      return hash.replace('#/job/', '');
    }
    return null;
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/job/')) {
        setSelectedJobIdForDetail(hash.replace('#/job/', ''));
      } else {
        setSelectedJobIdForDetail(null);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleNavigateToJob = (jobId: string) => {
    window.location.hash = `#/job/${jobId}`;
    setSelectedJobIdForDetail(jobId);
  };

  const handleBackFromJob = () => {
    window.location.hash = '';
    setSelectedJobIdForDetail(null);
  };

  // Search & Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [selectedExperience, setSelectedExperience] = useState('All');
  const [selectedJobType, setSelectedJobType] = useState('All');

  // Database jobs
  const [jobs, setJobs] = useState<JobMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [appliedJobIds, setAppliedJobIds] = useState<Record<string, { candidateInterested: boolean; chatUnlocked: boolean }>>({});

  // Listen to applications in real-time
  useEffect(() => {
    const currentCandidateUid = userData.uid || auth.currentUser?.uid || '';
    if (!currentCandidateUid) return;
    const appsRef = collection(db, 'applications');
    const q = query(appsRef, where('candidateUid', '==', currentCandidateUid));
    
    const unsubscribe = onSnapshot(q, (snapshot: any) => {
      const mapping: Record<string, { candidateInterested: boolean; chatUnlocked: boolean }> = {};
      snapshot.forEach((docSnap: any) => {
        const data = docSnap.data();
        if (data && data.jobId) {
          mapping[data.jobId] = {
            candidateInterested: !!data.candidateInterested,
            chatUnlocked: !!data.chatUnlocked
          };
        }
      });
      setAppliedJobIds(mapping);
    }, (err) => {
      console.error("Error subscribing to applications:", err);
    });
    
    return () => unsubscribe();
  }, [userData.uid, userData.name]);

  // Pagination for Standard Feed
  const [visibleCount, setVisibleCount] = useState(4);

  // Selected Job for Modal Detail
  const [selectedJob, setSelectedJob] = useState<JobMatch | null>(null);
  const [modalActionState, setModalActionState] = useState<'idle' | 'applied' | 'responded'>('idle');
  const [modalMessageText, setModalMessageText] = useState('');

  // Fetch jobs on mount
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'jobs'));
        if (querySnapshot && !querySnapshot.empty) {
          const loadedJobs: JobMatch[] = [];
          querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            loadedJobs.push({
              id: docSnap.id,
              title: data.title || '',
              companyName: data.companyName || '',
              logoUrl: data.logoUrl || '',
              logoBg: data.logoBg || 'bg-indigo-600',
              logoText: data.logoText || (data.companyName ? data.companyName.substring(0, 2).toUpperCase() : 'CO'),
              industry: data.industry || 'Technology',
              companySize: data.companySize || '11-50',
              location: data.location || 'Remote',
              jobType: data.jobType || 'Full-time',
              experienceLevel: data.experienceLevel || 'Senior',
              salary: data.salary || 'Negotiable',
              matchScore: data.matchScore || Math.floor(Math.random() * 25) + 75,
              tags: data.tags || [],
              description: data.description || '',
              pitch: data.pitch || '',
              postedDate: data.postedDate || '3 days ago',
              isReverseRecruitment: !!data.isReverseRecruitment,
              recruiterUid: data.recruiterUid || '',
            });
          });
          setJobs(loadedJobs);
        } else {
          setJobs([]);
        }
      } catch (err) {
        console.error("Error reading jobs:", err);
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Build the persistent top NavBar link definitions
  const navLinks: NavLinkItem[] = [
    { 
      label: 'Home', 
      href: '#home', 
      active: activeTab === 'home',
      onClick: () => setActiveTab('home') 
    },
    { 
      label: 'Applications', 
      href: '#applications', 
      active: activeTab === 'applications',
      onClick: () => {
        setActiveTab('applications');
        triggerToast("Viewing Applications feed (Placeholder)");
      } 
    },
    { 
      label: 'Messages', 
      href: '#messages', 
      active: activeTab === 'messages',
      onClick: () => {
        setActiveTab('messages');
        triggerToast("Opening candidate chat inbox (Placeholder)");
      } 
    },
    { 
      label: 'Profile', 
      href: '#profile', 
      active: activeTab === 'profile',
      onClick: onNavigateToProfile 
    },
    { 
      label: 'AI Profile', 
      href: '#ai-profile', 
      active: activeTab === 'ai-profile',
      onClick: () => setActiveTab('ai-profile') 
    },
  ];

  // Locations list for filter dropdown
  const locations = ['All', 'SF / Remote', 'Fully Remote', 'New York, NY', 'Austin, TX', 'Remote'];
  // Experience level list for filter
  const experienceLevels = ['All', 'Entry-level', 'Mid-level', 'Senior', 'Lead'];
  // Job Type list
  const jobTypes = ['All', 'Full-time', 'Contract', 'Part-time'];

  // Filter and search logic
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesLocation = selectedLocation === 'All' || job.location === selectedLocation;
    const matchesExperience = selectedExperience === 'All' || job.experienceLevel === selectedExperience;
    const matchesJobType = selectedJobType === 'All' || job.jobType === selectedJobType;

    return matchesSearch && matchesLocation && matchesExperience && matchesJobType;
  });

  // Separate jobs into Reverse Recruitment and New Openings
  const reverseRecruitmentJobs = filteredJobs.filter(j => j.isReverseRecruitment);
  const standardOpeningsJobs = filteredJobs.filter(j => !j.isReverseRecruitment);



  // Express Interest in Firestore with matching conversations & chats
  const handleConfirmInterest = async () => {
    if (!selectedJob) return;

    try {
      const candidateUid = userData.uid || auth.currentUser?.uid || '';
      const recruiterUid = selectedJob.recruiterUid || '';
      const jobId = selectedJob.id;
      const applicationId = `${jobId}_${candidateUid}`;
      
      const appRef = doc(db, 'applications', applicationId);
      const appSnap = await getDoc(appRef);

      if (!appSnap.exists()) {
        // Document doesn't exist, create it
        await setDoc(appRef, {
          candidateUid,
          recruiterUid,
          jobId,
          candidateInterested: true,
          recruiterShortlisted: false,
          chatUnlocked: false,
          createdAt: serverTimestamp()
        });
      } else {
        // Document already exists, update setting candidateInterested: true
        await updateDoc(appRef, {
          candidateInterested: true
        });
      }

      // Create a real-time notification for the recruiter
      try {
        const candidateName = userData.basics?.name || userData.displayName || 'A candidate';
        const jobTitle = selectedJob.title;
        const notificationId = crypto.randomUUID();
        await setDoc(doc(db, 'notifications', notificationId), {
          id: notificationId,
          user_id: recruiterUid,
          title: 'Candidate Expressed Interest',
          message: `${candidateName} has expressed interest in your job posting: "${jobTitle}"`,
          read: false,
          createdAt: new Date().toISOString()
        });
        console.log("Recruiter notification sent successfully.");
      } catch (notifErr) {
        console.error("Failed to send recruiter notification:", notifErr);
      }

      // Re-read recruiterShortlisted on that same document
      const updatedSnap = await getDoc(appRef);
      const updatedData = updatedSnap.exists() ? updatedSnap.data() : null;
      
      if (updatedData && updatedData.recruiterShortlisted) {
        // if recruiterShortlisted is also true, updateDoc setting chatUnlocked: true
        await updateDoc(appRef, {
          chatUnlocked: true
        });

        // Get recruiter and company details dynamically
        const recruiterRef = doc(db, 'users', recruiterUid);
        const recruiterSnap = await getDoc(recruiterRef);
        const recruiterData = recruiterSnap.exists() ? recruiterSnap.data() : null;
        const recruiterName = recruiterData?.displayName || 'Recruiter';
        
        let recruiterAvatarUrl = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face';
        if (recruiterData?.companyId) {
          const companyRef = doc(db, 'companies', recruiterData.companyId);
          const companySnap = await getDoc(companyRef);
          if (companySnap.exists()) {
            recruiterAvatarUrl = companySnap.data().logoUrl || recruiterAvatarUrl;
          }
        }

        // and create the corresponding conversations/{applicationId} document if it doesn't already exist
        const convRef = doc(db, 'conversations', applicationId);
        const convSnap = await getDoc(convRef);

        if (!convSnap.exists()) {
          await setDoc(convRef, {
            id: applicationId,
            candidateUid,
            recruiterUid,
            jobId,
            candidateName: userData.name || 'Anonymous Candidate',
            candidateAvatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
            recruiterName,
            recruiterAvatarUrl,
            jobTitle: selectedJob.title,
            companyName: selectedJob.companyName,
            lastMessage: '',
            lastMessageAt: new Date().toISOString(),
            unreadByCandidate: false,
            unreadByRecruiter: false
          });
        }
      }

      // Show a brief toast/confirmation
      triggerToast("Interest sent! We'll notify you if there's a match.");
      setSelectedJob(null);
    } catch (err) {
      console.error("Error in handleConfirmInterest:", err);
      triggerToast("Failed to express interest. Please try again.");
    }
  };

  if (selectedJobIdForDetail) {
    const currentJob = jobs.find(j => j.id === selectedJobIdForDetail);
    return (
      <JobDetailScreen
        jobId={selectedJobIdForDetail}
        onBack={handleBackFromJob}
        userData={userData}
        appliedJobIds={appliedJobIds}
        triggerToast={triggerToast}
        onInterestExpressed={() => {
          // Subscriptions handle the state in real-time, but we can do extra triggers here if needed
        }}
        fallbackJob={currentJob}
      />
    );
  }

  return (
    <div className="min-h-screen bg-page-gradient overflow-x-hidden font-manrope pb-12">
      
      {/* 1. TOP APP SHELL - Persistent Navigation Header */}
      <NavBar 
        links={navLinks}
        user={{
          name: userData.name || 'Anonymous Candidate',
          email: userData.email,
        }}
        onLogout={onLogout}
        onProfileClick={onNavigateToProfile}
        onSettingsClick={() => triggerToast("Settings modal (Placeholder)")}
      />

      {/* Main Container below navbar */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 flex flex-col gap-8">
        
        {/* Floating Toast Notification */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-text-navy text-white px-5 py-3 rounded-full shadow-warm-lg flex items-center gap-2 border border-white/10"
            >
              <CheckCircle2 className="w-4 h-4 text-accent-orange" />
              <span className="text-xs font-semibold font-manrope">{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {activeTab === 'ai-profile' ? (
          <motion.div
            key="ai-profile-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            <CandidateAIDashboard 
              candidateId={userData.uid || auth.currentUser?.uid || getCandidateUid(userData.name || 'Sarah Chen')} 
            />
          </motion.div>
        ) : activeTab === 'messages' ? (
          <motion.div
            key="messages-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            <PrivateChat
              currentUserId={userData.uid || auth.currentUser?.uid || getCandidateUid(userData.name || 'Sarah Chen')}
              currentRole="candidate"
              userName={userData.name || 'Sarah Chen'}
              onBackToHome={() => setActiveTab('home')}
            />
          </motion.div>
        ) : (
          <>
            {/* Header Hero Greeting */}
        <div className="flex flex-col gap-1.5 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-sora text-2xl sm:text-3xl font-extrabold text-text-navy tracking-tight">
              Welcome back, <span className="text-gradient">{userData.name || 'Anonymous'}</span>
            </h1>
            <p className="font-manrope text-sm text-text-muted">
              Your verified profile is live. Explore inbound matches and AI-ranked career tracks.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start md:self-auto bg-orange-50/40 border border-accent-orange/10 px-4 py-2 rounded-2xl shadow-warm-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-orange opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-orange"></span>
            </span>
            <span className="text-xs font-bold text-text-navy font-manrope">Profile Search Status: Verified</span>
          </div>
        </div>

        {/* 2. SEARCH BAR & DYNAMIC FILTER PANEL */}
        <div className="w-full flex flex-col gap-3">
          <div className="relative flex items-center">
            <div className="absolute left-4.5 text-text-muted pointer-events-none">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search jobs by title, company, or skill..."
              className="w-full pl-12 pr-14 py-3.5 bg-white border border-border-warm rounded-full font-manrope text-sm text-text-navy focus:outline-none focus:border-accent-orange focus:ring-2 focus:ring-accent-orange/10 shadow-warm-sm hover:border-accent-orange/35 transition-all duration-300"
            />
            
            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`absolute right-3.5 p-2 rounded-full border cursor-pointer transition-all ${
                showFilters || selectedLocation !== 'All' || selectedExperience !== 'All' || selectedJobType !== 'All'
                  ? 'border-accent-orange bg-accent-orange/10 text-accent-orange'
                  : 'border-border-warm bg-white text-text-muted hover:bg-border-warm/30 hover:text-text-navy'
              }`}
              title="Filter opportunities"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>

          {/* Collapsible Filters Sub-Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="overflow-hidden bg-white/70 backdrop-blur-md rounded-2xl border border-border-warm shadow-warm-md p-4 flex flex-col gap-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Location Filter */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-text-navy uppercase tracking-wider">Location</label>
                    <div className="relative">
                      <select
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-border-warm rounded-xl font-manrope text-xs text-text-navy focus:outline-none focus:border-accent-orange transition-all appearance-none cursor-pointer"
                      >
                        <option value="All">All Locations</option>
                        {locations.filter(l => l !== 'All').map(loc => (
                          <option key={loc} value={loc}>{loc}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-2.5 w-3.5 h-3.5 text-text-muted pointer-events-none" />
                    </div>
                  </div>

                  {/* Experience Level Filter */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-text-navy uppercase tracking-wider">Experience Level</label>
                    <div className="relative">
                      <select
                        value={selectedExperience}
                        onChange={(e) => setSelectedExperience(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-border-warm rounded-xl font-manrope text-xs text-text-navy focus:outline-none focus:border-accent-orange transition-all appearance-none cursor-pointer"
                      >
                        <option value="All">All Levels</option>
                        {experienceLevels.filter(x => x !== 'All').map(exp => (
                          <option key={exp} value={exp}>{exp}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-2.5 w-3.5 h-3.5 text-text-muted pointer-events-none" />
                    </div>
                  </div>

                  {/* Job Type Filter */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-text-navy uppercase tracking-wider">Job Type</label>
                    <div className="relative">
                      <select
                        value={selectedJobType}
                        onChange={(e) => setSelectedJobType(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-border-warm rounded-xl font-manrope text-xs text-text-navy focus:outline-none focus:border-accent-orange transition-all appearance-none cursor-pointer"
                      >
                        <option value="All">All Job Types</option>
                        {jobTypes.filter(j => j !== 'All').map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-2.5 w-3.5 h-3.5 text-text-muted pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Reset button inside panel */}
                <div className="flex justify-between items-center border-t border-border-warm/40 pt-3">
                  <span className="text-[10px] text-text-muted font-manrope">
                    Showing <strong className="text-text-navy">{filteredJobs.length}</strong> matching results
                  </span>
                  <button
                    onClick={() => {
                      setSelectedLocation('All');
                      setSelectedExperience('All');
                      setSelectedJobType('All');
                      setSearchQuery('');
                    }}
                    className="text-xs font-bold text-accent-orange hover:underline cursor-pointer"
                  >
                    Clear All Filters
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>


        {/* 3. SECTION 1 — REVERSE RECRUITMENT (TOP BILLING) */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-border-warm/30 pb-2">
            <div className="flex flex-col gap-0.5">
              <h2 className="font-sora font-extrabold text-lg text-text-navy flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent-orange fill-accent-orange" />
                Opportunities that found you
              </h2>
              <p className="font-manrope text-xs text-text-muted leading-snug">
                Companies matched to your profile — they're interested before you even apply
              </p>
            </div>
            <Badge text="Inbound Pitches" variant="orange" pulse={reverseRecruitmentJobs.length > 0} />
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="w-8 h-8 border-3 border-accent-orange border-t-transparent rounded-full animate-spin" />
            </div>
          ) : reverseRecruitmentJobs.length === 0 ? (
            /* Inline encouraging empty state */
            <div className="p-6 bg-orange-50/15 border-2 border-dashed border-border-warm rounded-2xl text-center max-w-2xl mx-auto w-full flex flex-col items-center gap-3 shadow-warm-sm">
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-accent-orange">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-text-navy font-sora">No one's reached out yet</p>
                <p className="text-xs text-text-muted leading-relaxed mt-1 max-w-md">
                  Completing your profile verification and syncing your GitHub repositories significantly increases your visibility to recruiters in our search pool.
                </p>
              </div>
              <Button 
                variant="secondary" 
                onClick={onNavigateToProfile}
                className="px-4 py-1.5 text-xs text-accent-orange border-accent-orange hover:bg-accent-orange/5"
              >
                Complete profile verification
              </Button>
            </div>
          ) : (
            /* Horizontal Scrollable Row */
            <div className="relative w-full overflow-x-auto pb-4 pt-1 flex items-stretch gap-5 snap-x scroll-smooth select-none scrollbar-thin scrollbar-thumb-border-warm scrollbar-track-transparent">
              {reverseRecruitmentJobs.map((job) => (
                <div 
                  key={job.id} 
                  className="w-[280px] sm:w-[320px] shrink-0 snap-start"
                >
                  <Card 
                    className="h-full bg-white border border-border-warm shadow-warm-md hover:shadow-warm-lg hover:border-accent-orange/45 transition-all duration-300 flex flex-col justify-between p-5 relative"
                  >
                    <div>
                      {/* Top row: Logo & Match badge */}
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-2.5">
                          {job.logoUrl ? (
                            <img src={job.logoUrl} alt={job.companyName} className="w-9 h-9 rounded-lg object-cover" />
                          ) : (
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold font-sora ${job.logoBg}`}>
                              {job.logoText}
                            </div>
                          )}
                          <div>
                            <p className="text-[10px] text-text-muted font-bold font-manrope uppercase tracking-wider">{job.companyName}</p>
                            <p className="text-xs font-bold text-text-navy font-manrope">{job.location}</p>
                          </div>
                        </div>
                        <Badge text={`${job.matchScore}% Match`} variant="gradient" className="text-[10px] px-2.5 py-0.5 shrink-0" />
                      </div>

                      {/* Job Title */}
                      <h4 className="font-sora font-extrabold text-sm sm:text-base text-text-navy leading-snug tracking-tight mb-2">
                        {job.title}
                      </h4>

                      {/* Why matched bullet tags */}
                      <div className="flex flex-wrap gap-1 mb-4.5">
                        {job.tags.slice(0, 3).map((tag, i) => (
                          <Badge key={i} text={tag} variant="orange" className="text-[9px] px-2 py-0.5 font-bold" />
                        ))}
                      </div>

                      {/* Recruiter's Pitch Preview Quote */}
                      {job.pitch && (
                        <div className="p-3 bg-[#FFFBF8] rounded-xl border border-border-warm/60 mb-4 text-xs font-manrope text-text-muted italic leading-relaxed relative">
                          <span className="absolute -top-1.5 left-2 bg-white px-1.5 text-[8px] font-bold text-accent-orange uppercase tracking-wider border border-border-warm/50 rounded-full">Pitch Note</span>
                          "{job.pitch}"
                        </div>
                      )}
                    </div>

                    {/* Gradient Action Button */}
                    <div className="mt-2.5 w-full">
                      <Button
                        variant={appliedJobIds[job.id]?.candidateInterested ? "secondary" : "primary"}
                        onClick={() => {
                          handleNavigateToJob(job.id);
                        }}
                        className={`w-full py-2.5 text-xs font-bold transition-all ${
                          appliedJobIds[job.id]?.candidateInterested
                            ? 'text-text-navy hover:text-accent-orange hover:border-accent-orange border-border-warm'
                            : 'shadow-warm-sm hover:scale-[1.01]'
                        }`}
                      >
                        {appliedJobIds[job.id]?.candidateInterested ? 'Interest sent ✓ (View Details)' : 'View & Respond'}
                        {!appliedJobIds[job.id]?.candidateInterested && <ArrowRight className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </section>


        {/* 4. SECTION 2 — NEW OPENINGS (STANDARD FEED) */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-border-warm/30 pb-2">
            <h2 className="font-sora font-extrabold text-lg text-text-navy">
              New openings for you
            </h2>
            <Badge text={`${standardOpeningsJobs.length} Available`} variant="muted" />
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="w-8 h-8 border-3 border-accent-orange border-t-transparent rounded-full animate-spin" />
            </div>
          ) : standardOpeningsJobs.length === 0 ? (
            /* Simple centered empty state */
            <div className="py-12 text-center text-sm font-manrope text-text-muted">
              No new openings match your profile right now — check back soon
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Responsive Grid layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-5">
                {standardOpeningsJobs.slice(0, visibleCount).map((job) => (
                  <Card 
                    key={job.id} 
                    className="bg-white border border-border-warm hover:border-accent-orange/20 transition-all duration-300 p-5 flex flex-col justify-between"
                  >
                    <div>
                      {/* Header row: Logo, title, Match Score */}
                      <div className="flex items-start justify-between gap-4 mb-3.5">
                        <div className="flex gap-3">
                          {job.logoUrl ? (
                            <img src={job.logoUrl} alt={job.companyName} className="w-11 h-11 rounded-xl object-cover" />
                          ) : (
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm font-extrabold font-sora ${job.logoBg}`}>
                              {job.logoText}
                            </div>
                          )}
                          <div>
                            <h3 className="font-sora font-bold text-sm sm:text-base text-text-navy leading-snug">
                              {job.title}
                            </h3>
                            <p className="font-manrope text-xs text-text-muted mt-0.5">{job.companyName} • {job.location}</p>
                          </div>
                        </div>

                        {/* Match Score Badge (smaller/less prominent than reverse recruitment) */}
                        <div className="flex flex-col items-end shrink-0">
                          <span className="text-[10px] font-bold text-text-muted uppercase">Match</span>
                          <span className="text-xs font-extrabold text-text-navy font-sora">{job.matchScore}%</span>
                        </div>
                      </div>

                      {/* Short Description snippet truncated */}
                      <p className="font-manrope text-xs text-text-muted leading-relaxed mb-4 line-clamp-2">
                        {job.description}
                      </p>

                      {/* Info lines (Salary, Date, Level) */}
                      <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mb-4 text-[11px] font-manrope text-text-muted border-t border-border-warm/30 pt-3">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-accent-orange" />
                          Posted {job.postedDate}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-accent-orange" />
                          {job.jobType} • {job.experienceLevel}
                        </span>
                        <span className="text-text-navy font-bold">{job.salary}</span>
                      </div>
                    </div>

                     {/* View Details Primary Action (Outlined/Secondary, not gradient) */}
                     <div className="w-full">
                       <Button
                         variant="secondary"
                         onClick={() => {
                           handleNavigateToJob(job.id);
                         }}
                         className="w-full py-2.5 text-xs text-text-navy transition-colors hover:text-accent-orange hover:border-accent-orange cursor-pointer"
                       >
                         {appliedJobIds[job.id]?.candidateInterested ? 'Interest sent ✓ (View Details)' : 'View Details'}
                       </Button>
                     </div>
                  </Card>
                ))}
              </div>

              {/* Pagination or Load More button */}
              {visibleCount < standardOpeningsJobs.length && (
                <div className="flex justify-center mt-2">
                  <Button
                    variant="secondary"
                    onClick={() => setVisibleCount((prev) => prev + 4)}
                    className="px-6 py-2 text-xs font-semibold hover:border-accent-orange/40"
                  >
                    Load more openings
                  </Button>
                </div>
              )}
            </div>
          )}
        </section>
          </>
        )}

      </main>



    </div>
  );
};
