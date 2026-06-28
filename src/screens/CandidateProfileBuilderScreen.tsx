import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Camera,
  Plus,
  Trash2,
  Github,
  Link as LinkIcon,
  Check,
  AlertCircle,
  FileText,
  User,
  Briefcase,
  GraduationCap,
  FolderKanban,
  CheckCircle2,
  PlusCircle,
  Info
} from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Avatar } from '../components/Avatar';
import { FloatingInfoCard } from '../components/FloatingInfoCard';
import {
  auth,
  db,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  uploadProfilePhoto
} from '../firebase';

export interface WorkExperience {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startYear: string;
  endYear: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  techStack: string[];
  link: string;
}

export interface CandidateProfileData {
  basics: {
    photoUrl: string;
    name: string;
    headline: string;
    location: string;
    experienceYears: number;
    employmentStatus: 'Employed' | 'Open to work' | 'Actively interviewing' | 'Student';
  };
  skills: string[];
  experience: WorkExperience[];
  education: Education[];
  projects: Project[];
  verification: {
    githubConnected: boolean;
    githubUsername: string;
    portfolioUrl: string;
  };
}

export interface CandidateProfileBuilderScreenProps {
  initialData?: Partial<CandidateProfileData>;
  userDisplayName?: string;
  onComplete: (data: CandidateProfileData) => void;
  onSaveAndExit: (data: CandidateProfileData) => void;
}

export const CandidateProfileBuilderScreen: React.FC<CandidateProfileBuilderScreenProps> = ({
  initialData,
  userDisplayName = '',
  onComplete,
  onSaveAndExit,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSuccessState, setIsSuccessState] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State variables for persistence and profile loading
  const [loadingProfile, setLoadingProfile] = useState<boolean>(true);
  const [maxCompletedStep, setMaxCompletedStep] = useState<number>(0);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);

  // Initialize the nested single profile state object
  const [formData, setFormData] = useState<CandidateProfileData>({
    basics: {
      photoUrl: initialData?.basics?.photoUrl || '',
      name: initialData?.basics?.name || userDisplayName || '',
      headline: initialData?.basics?.headline || '',
      location: initialData?.basics?.location || '',
      experienceYears: initialData?.basics?.experienceYears ?? 2,
      employmentStatus: initialData?.basics?.employmentStatus || 'Open to work',
    },
    skills: initialData?.skills || [],
    experience: initialData?.experience || [],
    education: initialData?.education || [],
    projects: initialData?.projects || [],
    verification: {
      githubConnected: initialData?.verification?.githubConnected || false,
      githubUsername: initialData?.verification?.githubUsername || '',
      portfolioUrl: initialData?.verification?.portfolioUrl || '',
    },
  });

  // Local helper states for input fields (e.g. skills typing, project skills typing)
  const [skillInput, setSkillInput] = useState('');
  const [projectSkillInputs, setProjectSkillInputs] = useState<Record<string, string>>({});
  const [githubUsernameInput, setGithubUsernameInput] = useState('');
  const [isConnectingGithub, setIsConnectingGithub] = useState(false);

  // Map the local React form state into the standardized Firestore schema structure
  const mapFormDataToFirestore = (data: CandidateProfileData) => {
    return {
      basics: {
        photoUrl: data.basics.photoUrl || '',
        fullName: data.basics.name || '',
        headline: data.basics.headline || '',
        location: data.basics.location || '',
        yearsExperience: data.basics.experienceYears,
        employmentStatus: data.basics.employmentStatus,
      },
      skills: data.skills || [],
      experience: (data.experience || []).map((exp) => ({
        company: exp.company || '',
        role: exp.role || '',
        startDate: exp.startDate || '',
        endDate: exp.endDate || '',
        isCurrent: exp.current || false,
        description: exp.description || '',
      })),
      education: (data.education || []).map((edu) => ({
        institution: edu.institution || '',
        degree: edu.degree || '',
        fieldOfStudy: edu.fieldOfStudy || '',
        startYear: edu.startYear || '',
        endYear: edu.endYear || '',
      })),
      projects: (data.projects || []).map((proj) => ({
        title: proj.title || '',
        description: proj.description || '',
        techStack: proj.techStack || [],
        link: proj.link || '',
      })),
      verification: {
        githubConnected: data.verification.githubConnected || false,
        githubUsername: data.verification.githubUsername || '',
        portfolioUrl: data.verification.portfolioUrl || '',
      },
    };
  };

  // On screen mount, fetch the existing candidateProfiles/{uid} document if one exists
  useEffect(() => {
    let active = true;
    const fetchProfile = async () => {
      const user = auth.currentUser;
      if (!user) {
        setLoadingProfile(false);
        return;
      }

      try {
        const profileRef = doc(db, 'candidateProfiles', user.uid);
        const profileSnap = await getDoc(profileRef);

        if (profileSnap && profileSnap.exists()) {
          const data = profileSnap.data();
          if (active && data) {
            // Pre-fill all step state
            setFormData({
              basics: {
                photoUrl: data.basics?.photoUrl || '',
                name: data.basics?.fullName || user.displayName || '',
                headline: data.basics?.headline || '',
                location: data.basics?.location || '',
                experienceYears: data.basics?.yearsExperience ?? 2,
                employmentStatus: data.basics?.employmentStatus || 'Open to work',
              },
              skills: data.skills || [],
              experience: (data.experience || []).map((exp: any) => ({
                id: exp.id || crypto.randomUUID(),
                company: exp.company || '',
                role: exp.role || '',
                startDate: exp.startDate || '',
                endDate: exp.endDate || '',
                current: exp.isCurrent || false,
                description: exp.description || '',
              })),
              education: (data.education || []).map((edu: any) => ({
                id: edu.id || crypto.randomUUID(),
                institution: edu.institution || '',
                degree: edu.degree || '',
                fieldOfStudy: edu.fieldOfStudy || '',
                startYear: edu.startYear || '',
                endYear: edu.endYear || '',
              })),
              projects: (data.projects || []).map((proj: any) => ({
                id: proj.id || crypto.randomUUID(),
                title: proj.title || '',
                description: proj.description || '',
                techStack: proj.techStack || [],
                link: proj.link || '',
              })),
              verification: {
                githubConnected: data.verification?.githubConnected || false,
                githubUsername: data.verification?.githubUsername || '',
                portfolioUrl: data.verification?.portfolioUrl || '',
              },
            });

            const completedStep = data.onboardingStep || 0;
            setMaxCompletedStep(completedStep);

            if (data.profileComplete) {
              setCurrentStep(5); // Review Step
            } else {
              // onboardingStep + 1, capped at 5
              setCurrentStep(Math.min(5, completedStep + 1));
            }
          }
        }
      } catch (err) {
        console.error("Error fetching existing candidate profile:", err);
      } finally {
        if (active) {
          setLoadingProfile(false);
        }
      }
    };

    fetchProfile();
    return () => {
      active = false;
    };
  }, []);

  // Profile image upload wired to Firebase Storage (or converted mock base64 with a simulated latency)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size limit of 5MB before upload starts
    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setPhotoUploadError("File is too large. Max size limit is 5MB.");
      return;
    }

    setPhotoUploadError(null);
    setIsUploadingPhoto(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("No authenticated user session found.");
      }
      
      const downloadUrl = await uploadProfilePhoto(user.uid, file);
      setFormData((prev) => ({
        ...prev,
        basics: {
          ...prev.basics,
          photoUrl: downloadUrl,
        },
      }));
    } catch (err: any) {
      console.error("Photo upload failed:", err);
      setPhotoUploadError(err instanceof Error ? err.message : "An unexpected error occurred during image upload.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Step names
  const stepsList = [
    { num: 1, label: 'Basics' },
    { num: 2, label: 'Skills & Experience' },
    { num: 3, label: 'Projects' },
    { num: 4, label: 'Verification' },
    { num: 5, label: 'Review' },
  ];

  // Adding work experience card
  const addExperience = () => {
    const newExp: WorkExperience = {
      id: crypto.randomUUID(),
      company: '',
      role: '',
      startDate: '',
      endDate: '',
      current: false,
      description: '',
    };
    setFormData((prev) => ({
      ...prev,
      experience: [...prev.experience, newExp],
    }));
  };

  // Updating work experience field
  const updateExperience = (id: string, field: keyof WorkExperience, value: any) => {
    setFormData((prev) => ({
      ...prev,
      experience: prev.experience.map((exp) => {
        if (exp.id === id) {
          const updated = { ...exp, [field]: value };
          if (field === 'current' && value === true) {
            updated.endDate = '';
          }
          return updated;
        }
        return exp;
      }),
    }));
  };

  // Deleting work experience card
  const deleteExperience = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      experience: prev.experience.filter((exp) => exp.id !== id),
    }));
  };

  // Adding education card
  const addEducation = () => {
    const newEdu: Education = {
      id: crypto.randomUUID(),
      institution: '',
      degree: '',
      fieldOfStudy: '',
      startYear: '',
      endYear: '',
    };
    setFormData((prev) => ({
      ...prev,
      education: [...prev.education, newEdu],
    }));
  };

  // Updating education field
  const updateEducation = (id: string, field: keyof Education, value: any) => {
    setFormData((prev) => ({
      ...prev,
      education: prev.education.map((edu) => (edu.id === id ? { ...edu, [field]: value } : edu)),
    }));
  };

  // Deleting education card
  const deleteEducation = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      education: prev.education.filter((edu) => edu.id !== id),
    }));
  };

  // Adding project card
  const addProject = () => {
    const newProj: Project = {
      id: crypto.randomUUID(),
      title: '',
      description: '',
      techStack: [],
      link: '',
    };
    setFormData((prev) => ({
      ...prev,
      projects: [...prev.projects, newProj],
    }));
  };

  // Updating project field
  const updateProject = (id: string, field: keyof Project, value: any) => {
    setFormData((prev) => ({
      ...prev,
      projects: prev.projects.map((proj) => (proj.id === id ? { ...proj, [field]: value } : proj)),
    }));
  };

  // Deleting project card
  const deleteProject = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      projects: prev.projects.filter((proj) => proj.id !== id),
    }));
  };

  // Skill tags tag-input handlers
  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const cleanSkill = skillInput.trim().replace(/,/g, '');
      if (cleanSkill && !formData.skills.includes(cleanSkill)) {
        setFormData((prev) => ({
          ...prev,
          skills: [...prev.skills, cleanSkill],
        }));
      }
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== tag),
    }));
  };

  // Project skills tag-input handlers
  const handleAddProjectSkill = (projectId: string, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const currentInput = projectSkillInputs[projectId] || '';
      const cleanSkill = currentInput.trim().replace(/,/g, '');
      const project = formData.projects.find((p) => p.id === projectId);
      if (cleanSkill && project && !project.techStack.includes(cleanSkill)) {
        updateProject(
          projectId,
          'techStack',
          [...project.techStack, cleanSkill]
        );
      }
      setProjectSkillInputs((prev) => ({ ...prev, [projectId]: '' }));
    }
  };

  const handleRemoveProjectSkill = (projectId: string, tag: string) => {
    const project = formData.projects.find((p) => p.id === projectId);
    if (project) {
      updateProject(
        projectId,
        'techStack',
        project.techStack.filter((s) => s !== tag)
      );
    }
  };

  // Github Connect mock action
  const handleConnectGithub = () => {
    if (!githubUsernameInput.trim()) return;
    setIsConnectingGithub(true);
    setTimeout(() => {
      setFormData((prev) => ({
        ...prev,
        verification: {
          ...prev.verification,
          githubConnected: true,
          githubUsername: githubUsernameInput.trim(),
        },
      }));
      setIsConnectingGithub(false);
    }, 1000);
  };

  const handleDisconnectGithub = () => {
    setFormData((prev) => ({
      ...prev,
      verification: {
        ...prev.verification,
        githubConnected: false,
        githubUsername: '',
      },
    }));
    setGithubUsernameInput('');
  };

  // Validation function per step
  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1:
        return (
          formData.basics.name.trim() !== '' &&
          formData.basics.headline.trim() !== '' &&
          formData.basics.location.trim() !== ''
        );
      case 2:
        // Skills section must have at least 1 tag
        if (formData.skills.length === 0) return false;
        // Verify that if they started filling repeatable experience cards, those cards are complete
        const isExpValid = formData.experience.every(
          (exp) => exp.company.trim() !== '' && exp.role.trim() !== '' && exp.startDate.trim() !== ''
        );
        // Verify education cards are complete if they exist
        const isEduValid = formData.education.every(
          (edu) => edu.institution.trim() !== '' && edu.degree.trim() !== '' && edu.startYear.trim() !== ''
        );
        return isExpValid && isEduValid;
      case 3:
        // Projects step is technically skippable/optional, but if cards exist they must have title & description
        return formData.projects.every(
          (proj) => proj.title.trim() !== '' && proj.description.trim() !== ''
        );
      case 4:
        // Verification step is fully skippable/optional
        return true;
      case 5:
        return true;
      default:
        return false;
    }
  };

  // Save progress handler for Save & Exit
  const handleSaveAndExitClick = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const profileRef = doc(db, 'candidateProfiles', user.uid);
        const payload = {
          uid: user.uid,
          ...mapFormDataToFirestore(formData),
          onboardingStep: maxCompletedStep,
          profileComplete: false,
          updatedAt: serverTimestamp(),
        };
        await setDoc(profileRef, payload, { merge: true });
      }
    } catch (err) {
      console.error("Error saving on exit:", err);
    }
    onSaveAndExit(formData);
  };

  // Handling navigation
  const handleNext = async () => {
    if (isStepValid(currentStep)) {
      const nextStepNum = Math.max(maxCompletedStep, currentStep);
      setMaxCompletedStep(nextStepNum);

      try {
        const user = auth.currentUser;
        if (user) {
          const profileRef = doc(db, 'candidateProfiles', user.uid);
          const payload = {
            uid: user.uid,
            ...mapFormDataToFirestore(formData),
            onboardingStep: nextStepNum,
            profileComplete: false,
            updatedAt: serverTimestamp(),
          };
          await setDoc(profileRef, payload, { merge: true });
        }
      } catch (err) {
        console.error("Error saving step progress:", err);
      }

      if (currentStep < 5) {
        setCurrentStep((prev) => prev + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Final submit
  const handleComplete = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const profileRef = doc(db, 'candidateProfiles', user.uid);
        const userRef = doc(db, 'users', user.uid);
        const payload = {
          uid: user.uid,
          ...mapFormDataToFirestore(formData),
          onboardingStep: 5,
          profileComplete: true,
          updatedAt: serverTimestamp(),
        };

        // Complete the profile document
        await setDoc(profileRef, payload, { merge: true });
        
        // Update the users schema collection
        await updateDoc(userRef, { onboardingComplete: true });
      }
    } catch (err) {
      console.error("Error completing candidate profile:", err);
    }

    setIsSuccessState(true);
    setTimeout(() => {
      onComplete(formData);
    }, 1800);
  };

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-page-gradient flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-accent-orange" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="font-manrope text-sm text-text-muted font-semibold">Resuming profile builder...</span>
        </div>
      </div>
    );
  }

  if (isSuccessState) {
    return (
      <div className="min-h-screen bg-page-gradient flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-surface border border-border-warm rounded-3xl p-8 shadow-warm-xl text-center flex flex-col items-center gap-6"
        >
          <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center text-success-green border-4 border-green-100">
            <CheckCircle2 className="w-10 h-10 animate-bounce" />
          </div>
          <div>
            <h2 className="font-sora font-bold text-text-navy text-2xl">Profile Completed!</h2>
            <p className="font-manrope text-text-muted text-sm mt-2 leading-relaxed">
              Your candidate profile has been finalized and saved securely. Preparing your personalized career matches dashboard now.
            </p>
          </div>
          <div className="w-full h-1.5 bg-border-warm/50 rounded-full overflow-hidden relative">
            <motion.div
              className="absolute left-0 top-0 bottom-0 bg-brand-gradient"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
            />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page-gradient pb-24 relative overflow-hidden">
      {/* Background Ambience decoration blobs */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        <span className="absolute -top-40 -left-40 w-96 h-96 bg-brand-start/5 rounded-full blur-3xl" />
        <span className="absolute top-1/2 -right-40 w-96 h-96 bg-brand-end/5 rounded-full blur-3xl" />
      </div>

      {/* Header Bar */}
      <div className="max-w-5xl mx-auto w-full px-4 pt-6 pb-4 flex justify-between items-center relative z-10 border-b border-border-warm/30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center text-white shadow-warm-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-sora font-extrabold text-lg text-text-navy tracking-tight">
            Talent<span className="text-gradient">Sphere</span>
          </span>
        </div>

        <button
          onClick={handleSaveAndExitClick}
          className="text-xs font-manrope font-semibold text-text-muted hover:text-accent-orange transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <FileText className="w-3.5 h-3.5" />
          Save & exit
        </button>
      </div>

      {/* Step Progress Bar Header */}
      <div className="max-w-3xl mx-auto w-full px-4 mt-8 relative z-10">
        <div className="bg-white/65 backdrop-blur-md border border-border-warm rounded-2xl p-4.5 shadow-warm-sm">
          {/* Horizontal Step Indicator pills */}
          <div className="flex items-center justify-between gap-1">
            {stepsList.map((step, idx) => {
              const isActive = step.num === currentStep;
              const isCompleted = step.num < currentStep;

              return (
                <React.Fragment key={step.num}>
                  {/* Step bubble */}
                  <button
                    onClick={() => {
                      // Allow clicking into previously completed steps or current step
                      if (step.num <= currentStep || isStepValid(step.num - 1)) {
                        setCurrentStep(step.num);
                      }
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-manrope font-bold transition-all ${
                      isActive
                        ? 'bg-brand-gradient text-white shadow-warm-sm'
                        : isCompleted
                        ? 'bg-success-green/10 text-success-green border border-success-green/20'
                        : 'bg-white/40 border border-border-warm/40 text-text-muted/60'
                    }`}
                  >
                    <span className="flex items-center justify-center">
                      {isCompleted ? (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      ) : (
                        step.num
                      )}
                    </span>
                    <span className="hidden sm:inline">{step.label}</span>
                  </button>

                  {/* Connect Line (exclude last element) */}
                  {idx < stepsList.length - 1 && (
                    <div className="flex-grow h-0.5 mx-1 rounded bg-border-warm/40 overflow-hidden">
                      <div
                        className="h-full bg-brand-gradient transition-all duration-300"
                        style={{
                          width:
                            currentStep > step.num
                              ? '100%'
                              : isActive
                              ? '50%'
                              : '0%',
                        }}
                      />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Form Display Container */}
      <div className="max-w-3xl mx-auto w-full px-4 mt-6 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.25 }}
          >
            {/* STEP 1: BASICS */}
            {currentStep === 1 && (
              <Card className="flex flex-col gap-6">
                <div>
                  <h3 className="font-sora font-bold text-text-navy text-xl">Let's start with the basics</h3>
                  <p className="font-manrope text-text-muted text-sm mt-1">
                    Introduce yourself to recruiters. This forms your identity card on the workspace.
                  </p>
                </div>

                {/* Profile Photo Selection Block */}
                {photoUploadError && (
                  <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-manrope">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div className="flex-grow">
                      <p className="font-bold">Upload Failed</p>
                      <p className="text-red-700/90 mt-0.5">{photoUploadError}</p>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setPhotoUploadError(null)}
                      className="text-red-500 hover:text-red-700 font-bold ml-1"
                    >
                      ✕
                    </button>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center gap-5 pb-4 border-b border-border-warm/30">
                  <div className="relative">
                    <Avatar
                      src={formData.basics.photoUrl}
                      alt={formData.basics.name || 'Candidate'}
                      size="xl"
                      className={`object-cover ${isUploadingPhoto ? 'opacity-40 animate-pulse' : ''}`}
                    />
                    {/* Floating camera upload trigger */}
                    <button
                      type="button"
                      disabled={isUploadingPhoto}
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-accent-orange text-white flex items-center justify-center shadow-warm-md border-2 border-white hover:bg-brand-middle transition cursor-pointer disabled:opacity-50"
                    >
                      {isUploadingPhoto ? (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Camera className="w-4 h-4" />
                      )}
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handlePhotoUpload}
                      accept="image/*"
                      className="hidden"
                      disabled={isUploadingPhoto}
                    />
                  </div>
                  <div className="text-center sm:text-left">
                    <h4 className="font-sora font-semibold text-sm text-text-navy">Profile Picture</h4>
                    <p className="font-manrope text-xs text-text-muted mt-1 max-w-xs">
                      Upload a high-quality headshot. Supports JPG, PNG. Image renders dynamically in your live resume profile.
                    </p>
                    <button
                      type="button"
                      disabled={isUploadingPhoto}
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-2 text-xs font-semibold text-accent-orange hover:underline cursor-pointer disabled:opacity-50"
                    >
                      {isUploadingPhoto ? 'Uploading photo...' : 'Select photo file'}
                    </button>
                  </div>
                </div>

                {/* Input Fields Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-manrope text-xs font-bold text-text-navy">
                      Full Name <span className="text-accent-orange">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Liam Devlin"
                      value={formData.basics.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          basics: { ...prev.basics, name: e.target.value },
                        }))
                      }
                      className="w-full px-4 py-3 bg-surface border border-border-warm rounded-xl font-manrope text-sm focus:outline-none focus:border-accent-orange focus:ring-1 focus:ring-accent-orange transition-colors"
                    />
                  </div>

                  {/* Headline */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-manrope text-xs font-bold text-text-navy">
                      Professional Headline <span className="text-accent-orange">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Senior Frontend Engineer"
                      value={formData.basics.headline}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          basics: { ...prev.basics, headline: e.target.value },
                        }))
                      }
                      className="w-full px-4 py-3 bg-surface border border-border-warm rounded-xl font-manrope text-sm focus:outline-none focus:border-accent-orange focus:ring-1 focus:ring-accent-orange transition-colors"
                    />
                  </div>

                  {/* Location */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-manrope text-xs font-bold text-text-navy">
                      Location (City, Country) <span className="text-accent-orange">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. San Francisco, US"
                      value={formData.basics.location}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          basics: { ...prev.basics, location: e.target.value },
                        }))
                      }
                      className="w-full px-4 py-3 bg-surface border border-border-warm rounded-xl font-manrope text-sm focus:outline-none focus:border-accent-orange focus:ring-1 focus:ring-accent-orange transition-colors"
                    />
                  </div>

                  {/* Employment Status Selector */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-manrope text-xs font-bold text-text-navy">
                      Employment Status
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {(['Employed', 'Open to work', 'Actively interviewing', 'Student'] as const).map((status) => {
                        const isSelected = formData.basics.employmentStatus === status;
                        return (
                          <button
                            key={status}
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                basics: { ...prev.basics, employmentStatus: status },
                              }))
                            }
                            className={`px-3 py-2 text-xs font-manrope font-semibold rounded-lg border cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-brand-gradient text-white border-transparent shadow-warm-sm'
                                : 'bg-white text-text-muted border-border-warm hover:border-accent-orange/40'
                            }`}
                          >
                            {status}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Years of Experience Slider */}
                <div className="flex flex-col gap-2 mt-2">
                  <div className="flex justify-between items-center">
                    <label className="font-manrope text-xs font-bold text-text-navy">
                      Total Professional Experience
                    </label>
                    <span className="text-xs font-manrope font-extrabold text-accent-orange bg-accent-orange/10 px-2.5 py-1 rounded-full">
                      {formData.basics.experienceYears === 20 ? '20+ years' : `${formData.basics.experienceYears} years`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="1"
                    value={formData.basics.experienceYears}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        basics: { ...prev.basics, experienceYears: parseInt(e.target.value, 10) },
                      }))
                    }
                    className="w-full accent-accent-orange bg-border-warm rounded-lg h-2 cursor-pointer focus:outline-none"
                  />
                  <div className="flex justify-between text-[10px] text-text-muted font-manrope">
                    <span>Entry Level (0 yrs)</span>
                    <span>Mid Level</span>
                    <span>Senior (10 yrs)</span>
                    <span>Lead/Architect (20+ yrs)</span>
                  </div>
                </div>
              </Card>
            )}

            {/* STEP 2: SKILLS & EXPERIENCE */}
            {currentStep === 2 && (
              <div className="flex flex-col gap-6">
                
                {/* Skills Tag Section */}
                <Card className="flex flex-col gap-4">
                  <div>
                    <h3 className="font-sora font-bold text-text-navy text-lg">Skills Spectrum</h3>
                    <p className="font-manrope text-text-muted text-xs mt-0.5">
                      Type a skill and press <kbd className="bg-border-warm/50 px-1 py-0.5 rounded font-mono text-[10px] font-bold">Enter</kbd> or <kbd className="bg-border-warm/50 px-1 py-0.5 rounded font-mono text-[10px] font-bold">,</kbd> to add. Add at least 1 core capability.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    <input
                      type="text"
                      placeholder="e.g. React, TypeScript, GraphQL, Rust"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={handleAddSkill}
                      className="w-full px-4 py-3 bg-surface border border-border-warm rounded-xl font-manrope text-sm focus:outline-none focus:border-accent-orange focus:ring-1 focus:ring-accent-orange transition-colors"
                    />

                    {/* Render current skills tags */}
                    <div className="flex flex-wrap gap-2 mt-1">
                      {formData.skills.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-manrope font-semibold bg-accent-orange/10 text-accent-orange border border-accent-orange/20 shadow-warm-sm"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(skill)}
                            className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-accent-orange/20 hover:text-accent-orange transition-all font-bold text-[10px] cursor-pointer"
                          >
                            ×
                          </button>
                        </span>
                      ))}

                      {formData.skills.length === 0 && (
                        <span className="text-xs text-text-muted font-manrope italic flex items-center gap-1">
                          <Info className="w-3.5 h-3.5 text-accent-orange" />
                          Please add at least one skill to continue.
                        </span>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Repeatable Work Experience Section */}
                <Card className="flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-sora font-bold text-text-navy text-lg">Work Experience</h3>
                      <p className="font-manrope text-text-muted text-xs mt-0.5">
                        Log past and current positions. Leave blank if none.
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      onClick={addExperience}
                      className="py-1.5 px-3 rounded-lg text-xs font-bold font-manrope flex items-center gap-1 border-border-warm bg-white text-accent-orange hover:bg-accent-orange/5"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Experience
                    </Button>
                  </div>

                  {/* Empty state Experience */}
                  {formData.experience.length === 0 && (
                    <div className="p-8 border border-dashed border-border-warm rounded-2xl text-center bg-white/40 flex flex-col items-center gap-2">
                      <Briefcase className="w-8 h-8 text-text-muted/40" />
                      <p className="font-manrope text-xs text-text-muted">
                        No work history added yet. You can proceed without it or add some now.
                      </p>
                    </div>
                  )}

                  {/* Experience cards list */}
                  <div className="flex flex-col gap-4">
                    {formData.experience.map((exp, idx) => (
                      <div 
                        key={exp.id} 
                        className="relative bg-white border border-border-warm/80 rounded-2xl p-5 shadow-warm-sm flex flex-col gap-3.5"
                      >
                        <button
                          type="button"
                          onClick={() => deleteExperience(exp.id)}
                          className="absolute top-4 right-4 p-1.5 rounded-lg text-text-muted hover:text-red-500 hover:bg-red-50 transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="flex items-center gap-2 font-sora font-bold text-xs text-accent-orange mb-1">
                          <Briefcase className="w-3.5 h-3.5" /> Position #{idx + 1}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Company */}
                          <div className="flex flex-col gap-1">
                            <label className="font-manrope text-[11px] font-bold text-text-navy">
                              Company Name <span className="text-accent-orange">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Google"
                              value={exp.company}
                              onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                              className="w-full px-3 py-2 bg-surface border border-border-warm rounded-lg font-manrope text-xs focus:outline-none focus:border-accent-orange transition-colors"
                            />
                          </div>

                          {/* Role / Title */}
                          <div className="flex flex-col gap-1">
                            <label className="font-manrope text-[11px] font-bold text-text-navy">
                              Role / Title <span className="text-accent-orange">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. React Lead"
                              value={exp.role}
                              onChange={(e) => updateExperience(exp.id, 'role', e.target.value)}
                              className="w-full px-3 py-2 bg-surface border border-border-warm rounded-lg font-manrope text-xs focus:outline-none focus:border-accent-orange transition-colors"
                            />
                          </div>

                          {/* Start Date */}
                          <div className="flex flex-col gap-1">
                            <label className="font-manrope text-[11px] font-bold text-text-navy">
                              Start Date <span className="text-accent-orange">*</span>
                            </label>
                            <input
                              type="date"
                              required
                              value={exp.startDate}
                              onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                              className="w-full px-3 py-2 bg-surface border border-border-warm rounded-lg font-manrope text-xs focus:outline-none focus:border-accent-orange transition-colors"
                            />
                          </div>

                          {/* End Date */}
                          <div className="flex flex-col gap-1">
                            <div className="flex justify-between items-center">
                              <label className="font-manrope text-[11px] font-bold text-text-navy">
                                End Date
                              </label>
                              <label className="flex items-center gap-1 text-[10px] text-text-muted cursor-pointer font-semibold select-none">
                                <input
                                  type="checkbox"
                                  checked={exp.current}
                                  onChange={(e) => updateExperience(exp.id, 'current', e.target.checked)}
                                  className="rounded accent-accent-orange cursor-pointer"
                                />
                                I currently work here
                              </label>
                            </div>
                            <input
                              type="date"
                              disabled={exp.current}
                              value={exp.endDate}
                              onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                              className="w-full px-3 py-2 bg-surface border border-border-warm rounded-lg font-manrope text-xs focus:outline-none focus:border-accent-orange transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            />
                          </div>
                        </div>

                        {/* Description */}
                        <div className="flex flex-col gap-1">
                          <label className="font-manrope text-[11px] font-bold text-text-navy">
                            Role Description
                          </label>
                          <textarea
                            rows={3}
                            placeholder="Describe your core achievements, tech stack utilized, or outcomes."
                            value={exp.description}
                            onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                            className="w-full px-3 py-2 bg-surface border border-border-warm rounded-lg font-manrope text-xs focus:outline-none focus:border-accent-orange transition-colors resize-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Repeatable Education Section */}
                <Card className="flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-sora font-bold text-text-navy text-lg">Education History</h3>
                      <p className="font-manrope text-text-muted text-xs mt-0.5">
                        Log degrees or certifications. Leave blank if none.
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      onClick={addEducation}
                      className="py-1.5 px-3 rounded-lg text-xs font-bold font-manrope flex items-center gap-1 border-border-warm bg-white text-accent-orange hover:bg-accent-orange/5"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Education
                    </Button>
                  </div>

                  {/* Empty state Education */}
                  {formData.education.length === 0 && (
                    <div className="p-8 border border-dashed border-border-warm rounded-2xl text-center bg-white/40 flex flex-col items-center gap-2">
                      <GraduationCap className="w-8 h-8 text-text-muted/40" />
                      <p className="font-manrope text-xs text-text-muted">
                        No education records added yet. Add one or continue to next step.
                      </p>
                    </div>
                  )}

                  {/* Education cards list */}
                  <div className="flex flex-col gap-4">
                    {formData.education.map((edu, idx) => (
                      <div 
                        key={edu.id} 
                        className="relative bg-white border border-border-warm/80 rounded-2xl p-5 shadow-warm-sm flex flex-col gap-3.5"
                      >
                        <button
                          type="button"
                          onClick={() => deleteEducation(edu.id)}
                          className="absolute top-4 right-4 p-1.5 rounded-lg text-text-muted hover:text-red-500 hover:bg-red-50 transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="flex items-center gap-2 font-sora font-bold text-xs text-accent-orange mb-1">
                          <GraduationCap className="w-3.5 h-3.5" /> Education #{idx + 1}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Institution */}
                          <div className="flex flex-col gap-1">
                            <label className="font-manrope text-[11px] font-bold text-text-navy">
                              School / Institution <span className="text-accent-orange">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Stanford University"
                              value={edu.institution}
                              onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
                              className="w-full px-3 py-2 bg-surface border border-border-warm rounded-lg font-manrope text-xs focus:outline-none focus:border-accent-orange transition-colors"
                            />
                          </div>

                          {/* Degree */}
                          <div className="flex flex-col gap-1">
                            <label className="font-manrope text-[11px] font-bold text-text-navy">
                              Degree / Certification <span className="text-accent-orange">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Bachelor of Science"
                              value={edu.degree}
                              onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                              className="w-full px-3 py-2 bg-surface border border-border-warm rounded-lg font-manrope text-xs focus:outline-none focus:border-accent-orange transition-colors"
                            />
                          </div>

                          {/* Field of Study */}
                          <div className="flex flex-col gap-1">
                            <label className="font-manrope text-[11px] font-bold text-text-navy">
                              Field of Study
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Computer Science"
                              value={edu.fieldOfStudy}
                              onChange={(e) => updateEducation(edu.id, 'fieldOfStudy', e.target.value)}
                              className="w-full px-3 py-2 bg-surface border border-border-warm rounded-lg font-manrope text-xs focus:outline-none focus:border-accent-orange transition-colors"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            {/* Start Year */}
                            <div className="flex flex-col gap-1">
                              <label className="font-manrope text-[11px] font-bold text-text-navy">
                                Start Year <span className="text-accent-orange">*</span>
                              </label>
                              <input
                                type="number"
                                min="1980"
                                max="2035"
                                placeholder="2018"
                                value={edu.startYear}
                                onChange={(e) => updateEducation(edu.id, 'startYear', e.target.value)}
                                className="w-full px-3 py-2 bg-surface border border-border-warm rounded-lg font-manrope text-xs focus:outline-none focus:border-accent-orange transition-colors"
                              />
                            </div>

                            {/* End Year */}
                            <div className="flex flex-col gap-1">
                              <label className="font-manrope text-[11px] font-bold text-text-navy">
                                End Year
                              </label>
                              <input
                                type="number"
                                min="1980"
                                max="2035"
                                placeholder="2022"
                                value={edu.endYear}
                                onChange={(e) => updateEducation(edu.id, 'endYear', e.target.value)}
                                className="w-full px-3 py-2 bg-surface border border-border-warm rounded-lg font-manrope text-xs focus:outline-none focus:border-accent-orange transition-colors"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* STEP 3: PROJECTS */}
            {currentStep === 3 && (
              <Card className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-sora font-bold text-text-navy text-lg">Featured Projects</h3>
                    <p className="font-manrope text-text-muted text-xs mt-0.5">
                      Showcase applications, systems, or code repositories.
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={addProject}
                    className="py-1.5 px-3 rounded-lg text-xs font-bold font-manrope flex items-center gap-1 border-border-warm bg-white text-accent-orange hover:bg-accent-orange/5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Project
                  </Button>
                </div>

                {/* Empty State visual container */}
                {formData.projects.length === 0 && (
                  <div className="p-10 border border-dashed border-border-warm rounded-2xl text-center bg-white/45 flex flex-col items-center gap-4 my-2">
                    <div className="w-12 h-12 rounded-full bg-accent-orange/10 flex items-center justify-center text-accent-orange shadow-warm-sm">
                      <FolderKanban className="w-6 h-6" />
                    </div>
                    <div className="max-w-sm">
                      <p className="font-sora font-semibold text-sm text-text-navy">
                        No projects added yet — projects help you stand out
                      </p>
                      <p className="font-manrope text-xs text-text-muted mt-1 leading-normal">
                        Candidates with 1 or more projects listed receive 45% more recruiter responses on average.
                      </p>
                    </div>
                    <Button
                      variant="primary"
                      onClick={addProject}
                      className="py-2 px-4 rounded-full font-bold text-xs shadow-warm-md"
                    >
                      <Plus className="w-3.5 h-3.5" /> List My First Project
                    </Button>
                  </div>
                )}

                {/* Repeatable Project Blocks */}
                <div className="flex flex-col gap-4">
                  {formData.projects.map((proj, idx) => (
                    <div
                      key={proj.id}
                      className="relative bg-white border border-border-warm/80 rounded-2xl p-5 shadow-warm-sm flex flex-col gap-3.5"
                    >
                      <button
                        type="button"
                        onClick={() => deleteProject(proj.id)}
                        className="absolute top-4 right-4 p-1.5 rounded-lg text-text-muted hover:text-red-500 hover:bg-red-50 transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="flex items-center gap-2 font-sora font-bold text-xs text-accent-orange mb-1">
                        <FolderKanban className="w-3.5 h-3.5" /> Project Entry #{idx + 1}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Project Title */}
                        <div className="flex flex-col gap-1">
                          <label className="font-manrope text-[11px] font-bold text-text-navy">
                            Project Title <span className="text-accent-orange">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Distributed Task Queue"
                            value={proj.title}
                            onChange={(e) => updateProject(proj.id, 'title', e.target.value)}
                            className="w-full px-3 py-2 bg-surface border border-border-warm rounded-lg font-manrope text-xs focus:outline-none focus:border-accent-orange transition-colors"
                          />
                        </div>

                        {/* Project Link */}
                        <div className="flex flex-col gap-1">
                          <label className="font-manrope text-[11px] font-bold text-text-navy flex items-center gap-1">
                            <LinkIcon className="w-3 h-3 text-accent-orange" />
                            Project Link (URL)
                          </label>
                          <input
                            type="url"
                            placeholder="e.g. https://github.com/liam/queue"
                            value={proj.link}
                            onChange={(e) => updateProject(proj.id, 'link', e.target.value)}
                            className="w-full px-3 py-2 bg-surface border border-border-warm rounded-lg font-manrope text-xs focus:outline-none focus:border-accent-orange transition-colors"
                          />
                        </div>
                      </div>

                      {/* Description */}
                      <div className="flex flex-col gap-1">
                        <label className="font-manrope text-[11px] font-bold text-text-navy">
                          Description <span className="text-accent-orange">*</span>
                        </label>
                        <textarea
                          rows={3}
                          required
                          placeholder="Describe the problem, the solution, and specific architecture details."
                          value={proj.description}
                          onChange={(e) => updateProject(proj.id, 'description', e.target.value)}
                          className="w-full px-3 py-2 bg-surface border border-border-warm rounded-lg font-manrope text-xs focus:outline-none focus:border-accent-orange transition-colors resize-none"
                        />
                      </div>

                      {/* Project Tech Stack tag-input */}
                      <div className="flex flex-col gap-1.5">
                        <label className="font-manrope text-[11px] font-bold text-text-navy">
                          Tech Stack / Technologies
                        </label>
                        <input
                          type="text"
                          placeholder="Type tech and press Enter"
                          value={projectSkillInputs[proj.id] || ''}
                          onChange={(e) =>
                            setProjectSkillInputs((prev) => ({ ...prev, [proj.id]: e.target.value }))
                          }
                          onKeyDown={(e) => handleAddProjectSkill(proj.id, e)}
                          className="w-full px-3 py-2 bg-surface border border-border-warm rounded-lg font-manrope text-xs focus:outline-none focus:border-accent-orange transition-colors"
                        />
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {proj.techStack.map((tech) => (
                            <span
                              key={tech}
                              className="inline-flex items-center gap-0.5 px-2 py-1 rounded-full text-[10px] font-manrope font-semibold bg-accent-orange/10 text-accent-orange border border-accent-orange/10"
                            >
                              {tech}
                              <button
                                type="button"
                                onClick={() => handleRemoveProjectSkill(proj.id, tech)}
                                className="w-3.5 h-3.5 rounded-full flex items-center justify-center hover:bg-accent-orange/20 hover:text-accent-orange transition-all font-bold text-[8px] cursor-pointer"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* STEP 4: VERIFICATION */}
            {currentStep === 4 && (
              <div className="flex flex-col gap-6">
                
                {/* Visual Explanatory FloatingInfoCard at top */}
                <FloatingInfoCard
                  icon={Sparkles}
                  iconBgType="orange"
                  title="Verified profiles get 3x more visibility"
                  subtitle="Recruiters prioritize verified GitHub profiles. Connect your developer profiles to boost discovery metrics instantly."
                />

                {/* GitHub Connect Block */}
                <Card className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-text-navy flex items-center justify-center text-white">
                      <Github className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-sora font-bold text-text-navy text-base">Connect GitHub</h3>
                      <p className="font-manrope text-text-muted text-xs">
                        Validate repositories, coding consistency, and language charts.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-border-warm flex flex-col gap-3">
                    {!formData.verification.githubConnected ? (
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-grow">
                          <input
                            type="text"
                            placeholder="Enter GitHub Username (e.g. liamdev)"
                            value={githubUsernameInput}
                            onChange={(e) => setGithubUsernameInput(e.target.value)}
                            className="w-full px-3 py-2 bg-surface border border-border-warm rounded-lg font-manrope text-xs focus:outline-none focus:border-accent-orange transition-colors"
                          />
                        </div>
                        <Button
                          variant="secondary"
                          onClick={handleConnectGithub}
                          disabled={isConnectingGithub || !githubUsernameInput.trim()}
                          className="py-2 px-4 text-xs font-bold border-text-navy text-text-navy hover:bg-text-navy/5"
                        >
                          {isConnectingGithub ? 'Linking account...' : 'Link GitHub'}
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-success-green/10 flex items-center justify-center text-success-green">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                          <span className="font-manrope text-xs text-text-navy font-bold">
                            Connected as: <span className="text-gradient">@{formData.verification.githubUsername}</span>
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleDisconnectGithub}
                          className="text-xs font-semibold text-red-500 hover:underline cursor-pointer"
                        >
                          Disconnect
                        </button>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Portfolio Website Simple Link Card */}
                <Card className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent-purple/10 flex items-center justify-center text-accent-purple">
                      <LinkIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-sora font-bold text-text-navy text-base">Add Portfolio or Personal Website</h3>
                      <p className="font-manrope text-text-muted text-xs">
                        Provide a personal URL showing your resume, designs, or writings.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <input
                      type="url"
                      placeholder="e.g. https://liamdev.me"
                      value={formData.verification.portfolioUrl}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          verification: { ...prev.verification, portfolioUrl: e.target.value },
                        }))
                      }
                      className="w-full px-4 py-3 bg-surface border border-border-warm rounded-xl font-manrope text-sm focus:outline-none focus:border-accent-orange focus:ring-1 focus:ring-accent-orange transition-colors"
                    />
                  </div>
                </Card>
              </div>
            )}

            {/* STEP 5: REVIEW */}
            {currentStep === 5 && (
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="font-sora font-bold text-text-navy text-xl">Review and Complete</h3>
                  <p className="font-manrope text-text-muted text-sm mt-1">
                    Confirm details before making your workspace active. Click edit on any section to revise.
                  </p>
                </div>

                {/* BASICS REVIEW */}
                <Card className="flex flex-col gap-4 relative">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="absolute top-4 right-4 text-xs font-bold text-accent-orange hover:underline cursor-pointer"
                  >
                    Edit Section
                  </button>
                  <div className="flex items-center gap-2 text-xs font-extrabold text-text-navy uppercase tracking-wider font-manrope">
                    <User className="w-3.5 h-3.5 text-accent-orange" /> Profile Basics
                  </div>

                  <div className="flex items-center gap-4 mt-1">
                    <Avatar
                      src={formData.basics.photoUrl}
                      alt={formData.basics.name}
                      size="lg"
                    />
                    <div>
                      <h4 className="font-sora font-bold text-text-navy text-base">{formData.basics.name}</h4>
                      <p className="font-manrope text-xs text-accent-orange font-semibold">{formData.basics.headline}</p>
                      <p className="font-manrope text-xs text-text-muted mt-0.5">{formData.basics.location}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-2 pt-3 border-t border-border-warm/20 text-xs font-manrope">
                    <div>
                      <span className="text-text-muted block">Experience:</span>
                      <span className="font-bold text-text-navy">
                        {formData.basics.experienceYears === 20 ? '20+ years' : `${formData.basics.experienceYears} years`}
                      </span>
                    </div>
                    <div>
                      <span className="text-text-muted block">Status:</span>
                      <span className="font-bold text-text-navy">{formData.basics.employmentStatus}</span>
                    </div>
                  </div>
                </Card>

                {/* SKILLS REVIEW */}
                <Card className="flex flex-col gap-4 relative">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="absolute top-4 right-4 text-xs font-bold text-accent-orange hover:underline cursor-pointer"
                  >
                    Edit Section
                  </button>
                  <div className="flex items-center gap-2 text-xs font-extrabold text-text-navy uppercase tracking-wider font-manrope">
                    <Sparkles className="w-3.5 h-3.5 text-accent-orange" /> Technical Capabilities
                  </div>

                  <div className="flex flex-wrap gap-2 mt-1">
                    {formData.skills.map((skill) => (
                      <Badge key={skill} text={skill} variant="orange" />
                    ))}
                  </div>
                </Card>

                {/* WORK EXPERIENCE & EDUCATION REVIEW */}
                <Card className="flex flex-col gap-4 relative">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="absolute top-4 right-4 text-xs font-bold text-accent-orange hover:underline cursor-pointer"
                  >
                    Edit Section
                  </button>
                  <div className="flex items-center gap-2 text-xs font-extrabold text-text-navy uppercase tracking-wider font-manrope">
                    <Briefcase className="w-3.5 h-3.5 text-accent-orange" /> Experience & Credentials
                  </div>

                  {/* Work experience list */}
                  <div className="flex flex-col gap-3 mt-1">
                    <h5 className="font-sora font-semibold text-xs text-text-navy border-b border-border-warm/30 pb-1">Work Experience</h5>
                    {formData.experience.length === 0 ? (
                      <p className="text-xs text-text-muted font-manrope italic">No work experience listed.</p>
                    ) : (
                      formData.experience.map((exp) => (
                        <div key={exp.id} className="text-xs font-manrope">
                          <p className="font-bold text-text-navy">{exp.role} @ {exp.company}</p>
                          <p className="text-[10px] text-text-muted">{exp.startDate} — {exp.current ? 'Present' : exp.endDate}</p>
                          {exp.description && <p className="text-text-muted mt-1 leading-normal bg-white/50 p-2 rounded border border-border-warm/20">{exp.description}</p>}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Education list */}
                  <div className="flex flex-col gap-3 mt-2">
                    <h5 className="font-sora font-semibold text-xs text-text-navy border-b border-border-warm/30 pb-1">Education</h5>
                    {formData.education.length === 0 ? (
                      <p className="text-xs text-text-muted font-manrope italic">No education listed.</p>
                    ) : (
                      formData.education.map((edu) => (
                        <div key={edu.id} className="text-xs font-manrope">
                          <p className="font-bold text-text-navy">{edu.degree} in {edu.fieldOfStudy || 'General study'}</p>
                          <p className="text-[10px] text-text-muted">{edu.institution} ({edu.startYear} — {edu.endYear || 'Present'})</p>
                        </div>
                      ))
                    )}
                  </div>
                </Card>

                {/* PROJECTS REVIEW */}
                <Card className="flex flex-col gap-4 relative">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="absolute top-4 right-4 text-xs font-bold text-accent-orange hover:underline cursor-pointer"
                  >
                    Edit Section
                  </button>
                  <div className="flex items-center gap-2 text-xs font-extrabold text-text-navy uppercase tracking-wider font-manrope">
                    <FolderKanban className="w-3.5 h-3.5 text-accent-orange" /> Showcased Projects
                  </div>

                  <div className="flex flex-col gap-4 mt-1">
                    {formData.projects.length === 0 ? (
                      <p className="text-xs text-text-muted font-manrope italic">No projects listed.</p>
                    ) : (
                      formData.projects.map((proj) => (
                        <div key={proj.id} className="text-xs font-manrope">
                          <div className="flex justify-between items-start">
                            <p className="font-bold text-text-navy">{proj.title}</p>
                            {proj.link && (
                              <a href={proj.link} target="_blank" rel="noopener noreferrer" className="text-accent-orange hover:underline inline-flex items-center gap-0.5 font-bold">
                                Link <LinkIcon className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                          <p className="text-text-muted mt-1 leading-normal">{proj.description}</p>
                          {proj.techStack.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {proj.techStack.map((tech) => (
                                <span key={tech} className="bg-border-warm/40 px-2 py-0.5 rounded text-[9px] font-bold text-text-navy border border-border-warm/30">
                                  {tech}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </Card>

                {/* VERIFICATION REVIEW */}
                <Card className="flex flex-col gap-4 relative">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    className="absolute top-4 right-4 text-xs font-bold text-accent-orange hover:underline cursor-pointer"
                  >
                    Edit Section
                  </button>
                  <div className="flex items-center gap-2 text-xs font-extrabold text-text-navy uppercase tracking-wider font-manrope">
                    <Check className="w-3.5 h-3.5 text-accent-orange" /> Verified Integrations
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1 text-xs font-manrope">
                    <div>
                      <span className="text-text-muted block">GitHub:</span>
                      {formData.verification.githubConnected ? (
                        <span className="font-bold text-success-green flex items-center gap-1 mt-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Connected (@{formData.verification.githubUsername})
                        </span>
                      ) : (
                        <span className="font-semibold text-text-muted italic mt-0.5 block">Not connected</span>
                      )}
                    </div>
                    <div>
                      <span className="text-text-muted block">Portfolio URL:</span>
                      {formData.verification.portfolioUrl ? (
                        <a href={formData.verification.portfolioUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-accent-orange hover:underline flex items-center gap-1 mt-0.5">
                          <LinkIcon className="w-3 h-3" /> {formData.verification.portfolioUrl}
                        </a>
                      ) : (
                        <span className="font-semibold text-text-muted italic mt-0.5 block">Not provided</span>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* BOTTOM STEP CONTROLS BAR */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-border-warm/30">
          <div>
            {currentStep > 1 ? (
              <Button
                variant="secondary"
                onClick={handleBack}
                className="py-3 px-5 font-bold font-manrope text-sm flex items-center gap-1.5 border-border-warm bg-white hover:bg-border-warm/25"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            ) : (
              <div /> // placeholder balance spacer
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Display a skippable skip-for-now option on Step 4 (Verification) */}
            {currentStep === 4 && (
              <button
                type="button"
                onClick={() => {
                  setCurrentStep(5);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-xs font-manrope font-bold text-text-muted hover:text-accent-orange transition-colors cursor-pointer"
              >
                Skip for now
              </button>
            )}

            {currentStep < 5 ? (
              <Button
                variant="primary"
                disabled={!isStepValid(currentStep)}
                onClick={handleNext}
                className={`py-3 px-6 font-bold font-manrope text-sm flex items-center gap-1.5 shadow-warm-md rounded-full ${
                  !isStepValid(currentStep)
                    ? 'opacity-40 cursor-not-allowed bg-border-warm text-text-muted/60 border-transparent shadow-none'
                    : ''
                }`}
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleComplete}
                className="py-3.5 px-8 font-bold font-manrope text-base flex items-center gap-2 shadow-warm-lg bg-brand-gradient text-white hover:brightness-105 rounded-full"
              >
                Complete profile
                <Check className="w-5 h-5 stroke-[3]" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
