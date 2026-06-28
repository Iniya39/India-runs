import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  MapPin, 
  Briefcase, 
  Calendar, 
  Building, 
  Sparkles, 
  Bookmark, 
  Check, 
  DollarSign, 
  Users, 
  CheckCircle2, 
  Zap, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { JobMatch } from './CandidateHomeScreen';
import { db, auth, doc, getDoc, setDoc, updateDoc, serverTimestamp } from '../firebase';
import { getCandidateUid } from '../lib/chatUtils';

interface JobDetailScreenProps {
  jobId: string;
  onBack: () => void;
  userData: { uid?: string; name?: string; email: string };
  appliedJobIds: Record<string, { candidateInterested: boolean; chatUnlocked: boolean }>;
  triggerToast: (msg: string) => void;
  onInterestExpressed: () => void;
  fallbackJob?: JobMatch | null;
}

export const JobDetailScreen: React.FC<JobDetailScreenProps> = ({
  jobId,
  onBack,
  userData,
  appliedJobIds,
  triggerToast,
  onInterestExpressed,
  fallbackJob
}) => {
  const [job, setJob] = useState<JobMatch | null>(fallbackJob || null);
  const [loading, setLoading] = useState(!fallbackJob);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch job details if not already present
  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        const jobRef = doc(db, 'jobs', jobId);
        const jobSnap = await getDoc(jobRef);
        if (jobSnap.exists()) {
          const data = jobSnap.data();
          setJob({
            id: jobId,
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
            salary: data.salary || '$100,000+',
            matchScore: data.matchScore || Math.floor(Math.random() * 25) + 75,
            tags: data.tags || [],
            description: data.description || '',
            pitch: data.pitch || '',
            postedDate: data.postedDate || '3 days ago',
            isReverseRecruitment: !!data.isReverseRecruitment,
            recruiterUid: data.recruiterUid || 'mock-recruiter-uid',
          });
        }
      } catch (err) {
        console.error("Error fetching job details:", err);
      } finally {
        setLoading(false);
      }
    };

    if (!job || job.id !== jobId) {
      setLoading(true);
      fetchJobDetails();
    } else {
      setLoading(false);
    }
  }, [jobId]);

  const hasExpressedInterest = !!appliedJobIds[jobId]?.candidateInterested;

  const handleConfirmInterest = async () => {
    if (!job || isSubmitting || hasExpressedInterest) return;
    setIsSubmitting(true);

    try {
      const candidateUid = userData.uid || auth.currentUser?.uid || getCandidateUid(userData.name || 'Sarah Chen');
      const recruiterUid = job.recruiterUid || 'mock-recruiter-uid';
      const applicationId = `${job.id}_${candidateUid}`;
      
      const appRef = doc(db, 'applications', applicationId);
      const appSnap = await getDoc(appRef);

      if (!appSnap.exists()) {
        await setDoc(appRef, {
          candidateUid,
          recruiterUid,
          jobId: job.id,
          candidateInterested: true,
          recruiterShortlisted: false,
          chatUnlocked: false,
          createdAt: serverTimestamp()
        });
      } else {
        await updateDoc(appRef, {
          candidateInterested: true
        });
      }

      // Re-read recruiterShortlisted on that same document
      const updatedSnap = await getDoc(appRef);
      const updatedData = updatedSnap.exists() ? updatedSnap.data() : null;
      
      if (updatedData && updatedData.recruiterShortlisted) {
        await updateDoc(appRef, {
          chatUnlocked: true
        });

        const convRef = doc(db, 'conversations', applicationId);
        const convSnap = await getDoc(convRef);

        if (!convSnap.exists()) {
          await setDoc(convRef, {
            id: applicationId,
            candidateUid,
            recruiterUid,
            jobId: job.id,
            candidateName: userData.name || 'Sarah Chen',
            candidateAvatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
            recruiterName: 'Elena Rostova',
            recruiterAvatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face',
            jobTitle: job.title,
            companyName: job.companyName,
            lastMessage: '',
            lastMessageAt: new Date().toISOString(),
            unreadByCandidate: false,
            unreadByRecruiter: false
          });
        }
      }

      triggerToast("Interest sent! We'll notify you if there's a match.");
      onInterestExpressed();
    } catch (err) {
      console.error("Error expressing interest:", err);
      triggerToast("Failed to express interest. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-page-gradient flex items-center justify-center font-manrope">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-accent-orange" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm text-text-muted font-semibold">Loading job description...</span>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-page-gradient flex flex-col items-center justify-center font-manrope px-4">
        <AlertCircle className="w-12 h-12 text-accent-orange mb-3" />
        <h3 className="font-sora font-extrabold text-lg text-text-navy">Opportunity Not Found</h3>
        <p className="text-sm text-text-muted text-center mt-1 mb-5 max-w-sm">
          The requested job posting may have been filled or removed by the hiring recruiter.
        </p>
        <Button variant="secondary" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
          Back to Workspace
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FCFBF9] text-text-navy font-manrope pb-28">
      
      {/* Top sticky back banner */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-border-warm/50 shadow-warm-sm">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <button 
            onClick={onBack}
            className="group flex items-center gap-2 text-xs font-extrabold text-text-navy hover:text-accent-orange transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to feed</span>
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-text-muted bg-border-warm/40 px-2 py-1 rounded-full">
              ID: {job.id.substring(0, 8)}...
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 flex flex-col gap-8">
        
        {/* REVERSE RECRUITMENT BANNER */}
        {job.isReverseRecruitment && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-brand-gradient/10 rounded-2xl border border-brand-start/20 text-brand-start font-manrope text-xs font-bold shadow-warm-sm flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-brand-gradient text-white flex items-center justify-center shadow-warm-sm">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <p className="text-text-navy font-extrabold">This company matched to you</p>
              <p className="text-[10px] text-text-muted font-normal mt-0.5">
                The recruiting team initiated direct outreach based on your verified tech competencies.
              </p>
            </div>
          </motion.div>
        )}

        {/* HEADER BLOCK */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2.5">
            {job.logoUrl ? (
              <img src={job.logoUrl} alt={job.companyName} className="w-10 h-10 rounded-xl object-cover" />
            ) : (
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-extrabold font-sora ${job.logoBg || 'bg-indigo-600'}`}>
                {job.logoText || 'CO'}
              </div>
            )}
            <div>
              <p className="text-xs font-bold text-text-navy">{job.companyName}</p>
              <p className="text-[10px] text-text-muted">Verified Company Profile</p>
            </div>
          </div>

          <h1 className="font-sora text-2xl sm:text-3xl font-extrabold text-text-navy tracking-tight leading-tight">
            {job.title}
          </h1>

          {/* Meta row badges */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge text={job.location} variant="purple" icon={MapPin} className="text-[10px] py-1 px-2.5" />
            <Badge text={job.jobType} variant="orange" icon={Briefcase} className="text-[10px] py-1 px-2.5" />
            <Badge text={job.experienceLevel} variant="green" icon={Building} className="text-[10px] py-1 px-2.5" />
            <span className="text-[11px] font-bold text-accent-orange bg-accent-orange/5 px-2.5 py-1 rounded-full border border-accent-orange/10 flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              {job.salary}
            </span>
          </div>

          <p className="text-[11px] font-manrope text-text-muted font-semibold flex items-center gap-1 mt-1">
            <Calendar className="w-3.5 h-3.5" />
            Posted {job.postedDate}
          </p>
        </div>

        {/* PITCH CALLOUT IF REVERSE RECRUITMENT */}
        {job.isReverseRecruitment && job.pitch && (
          <div className="p-5 rounded-2xl bg-[#FFFBF8] border border-brand-start/20 shadow-warm-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-gradient/5 rounded-bl-full pointer-events-none" />
            <span className="text-[9px] font-extrabold text-brand-start uppercase tracking-wider bg-brand-gradient/10 px-2.5 py-0.5 rounded-full border border-brand-start/10">
              Personalized Outreach Pitch
            </span>
            <p className="font-manrope text-sm text-text-navy/95 italic leading-relaxed mt-3 pl-3 border-l-2 border-brand-start">
              "{job.pitch}"
            </p>
          </div>
        )}

        {/* MATCH INSIGHT BLOCK */}
        <Card className="p-6 bg-white border border-border-warm shadow-warm-md flex flex-col gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent-orange/5 rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent-orange" />
              <h3 className="font-sora font-extrabold text-sm sm:text-base text-text-navy">
                TalentSphere Matching Insight
              </h3>
            </div>
            <Badge text={`${job.matchScore}% Match`} variant="gradient" className="text-xs px-3 py-1 shrink-0 shadow-warm-sm" />
          </div>

          <div className="flex flex-col gap-3 mt-1.5 font-manrope text-xs sm:text-sm text-text-muted leading-relaxed">
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-success-green/15 flex items-center justify-center text-success-green shrink-0 mt-0.5">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <p>
                Your skills in <span className="font-bold text-text-navy">{job.tags.slice(0, 3).join(', ') || 'modern frameworks'}</span> align beautifully with this organization's active tech architecture.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-success-green/15 flex items-center justify-center text-success-green shrink-0 mt-0.5">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <p>
                Your preference for <span className="font-bold text-text-navy">{job.jobType}</span> parameters completely satisfies their structural scheduling layout.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-success-green/15 flex items-center justify-center text-success-green shrink-0 mt-0.5">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <p>
                Verified developer stats from your synchronized codebase workspaces confirm high performance indicators in related tasks.
              </p>
            </div>
          </div>
        </Card>

        {/* JOB DESCRIPTION */}
        <div className="flex flex-col gap-3">
          <h3 className="font-sora font-extrabold text-sm sm:text-base text-text-navy tracking-tight uppercase tracking-wider text-xs">
            About the role
          </h3>
          <p className="font-manrope text-sm leading-relaxed text-text-navy/85 whitespace-pre-wrap">
            {job.description || "No description provided."}
          </p>
        </div>

        {/* REQUIRED SKILLS */}
        {job.tags && job.tags.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-border-warm/50 pt-6">
            <h3 className="font-sora font-extrabold text-sm sm:text-base text-text-navy tracking-tight uppercase tracking-wider text-xs">
              Required core competencies
            </h3>
            <div className="flex flex-wrap gap-2">
              {job.tags.map((tag, idx) => (
                <span 
                  key={idx} 
                  className="text-xs font-bold bg-border-warm/40 text-text-navy px-3 py-1 rounded-full border border-border-warm/10"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* COMPANY CONTEXT */}
        <div className="flex flex-col gap-4 border-t border-border-warm/50 pt-6">
          <h3 className="font-sora font-extrabold text-sm sm:text-base text-text-navy tracking-tight uppercase tracking-wider text-xs">
            About {job.companyName}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white border border-border-warm p-4 sm:p-5 rounded-2xl shadow-warm-sm">
            <div className="flex flex-col">
              <span className="text-[10px] text-text-muted uppercase font-extrabold tracking-wider">Sector / Industry</span>
              <p className="text-xs sm:text-sm font-extrabold text-text-navy mt-1">{job.industry || 'Technology'}</p>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-text-muted uppercase font-extrabold tracking-wider">Company Size</span>
              <p className="text-xs sm:text-sm font-extrabold text-text-navy mt-1">{job.companySize || '11-50'} employees</p>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-text-muted uppercase font-extrabold tracking-wider">Location Format</span>
              <p className="text-xs sm:text-sm font-extrabold text-text-navy mt-1">{job.location || 'Remote'}</p>
            </div>
          </div>
        </div>

      </div>

      {/* STICKY ACTION AREA BOTTOM BAR */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-border-warm/60 py-4 px-6 z-40 shadow-warm-lg">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div className="hidden sm:flex flex-col">
            <p className="text-[10px] text-text-muted uppercase font-extrabold tracking-wider">Target Compensation</p>
            <p className="text-sm font-extrabold text-text-navy mt-0.5">{job.salary}</p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto flex-1 justify-end">
            <Button
              variant="secondary"
              onClick={onBack}
              className="py-3 px-4 text-xs font-bold text-text-navy border-border-warm hover:bg-border-warm/20"
            >
              Cancel
            </Button>
            
            <Button
              variant={hasExpressedInterest ? "secondary" : "primary"}
              disabled={hasExpressedInterest || isSubmitting}
              onClick={handleConfirmInterest}
              className={`py-3 px-8 text-xs font-extrabold transition-all min-w-[160px] ${
                hasExpressedInterest 
                  ? 'bg-border-warm/40 border border-border-warm text-text-muted cursor-not-allowed pointer-events-none' 
                  : 'shadow-warm-md hover:scale-[1.01]'
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Syncing...
                </span>
              ) : hasExpressedInterest ? (
                <span className="flex items-center justify-center gap-1.5 text-text-muted">
                  <CheckCircle2 className="w-4 h-4 text-success-green" />
                  Interest sent ✓
                </span>
              ) : (
                'I\'m interested'
              )}
            </Button>
          </div>
        </div>
      </div>

    </div>
  );
};
