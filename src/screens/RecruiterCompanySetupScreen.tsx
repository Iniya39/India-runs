import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Building2,
  Briefcase,
  Globe,
  Upload,
  ArrowRight,
  PlusCircle,
  FileText,
  Image as ImageIcon,
  AlertCircle,
  X
} from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { BackgroundBlob } from '../components/BackgroundBlobs';
import {
  auth,
  db,
  doc,
  getDoc,
  collection,
  addDoc,
  updateDoc,
  serverTimestamp,
  uploadCompanyLogo
} from '../firebase';

export interface RecruiterCompanyData {
  companyName: string;
  logoUrl: string;
  industry: string;
  companySize: '1-10' | '11-50' | '51-200' | '201-1000' | '1000+';
  recruiterTitle: string;
  companyWebsite: string;
  hiringContextNote: string;
}

export interface RecruiterCompanySetupScreenProps {
  initialData?: Partial<RecruiterCompanyData>;
  onComplete: (data: RecruiterCompanyData) => void;
  onSaveAndExit?: (data: RecruiterCompanyData) => void;
}

export const RecruiterCompanySetupScreen: React.FC<RecruiterCompanySetupScreenProps> = ({
  initialData,
  onComplete,
  onSaveAndExit,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSuccessState, setIsSuccessState] = useState(false);

  // Persistence/Loading State
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [existingCompanyId, setExistingCompanyId] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Form State Setup
  const [formData, setFormData] = useState<RecruiterCompanyData>({
    companyName: initialData?.companyName || '',
    logoUrl: initialData?.logoUrl || '',
    industry: initialData?.industry || '',
    companySize: initialData?.companySize || '11-50',
    recruiterTitle: initialData?.recruiterTitle || '',
    companyWebsite: initialData?.companyWebsite || '',
    hiringContextNote: initialData?.hiringContextNote || '',
  });

  // Resume on Return implementation
  useEffect(() => {
    let active = true;
    const loadExistingData = async () => {
      const user = auth.currentUser;
      if (!user) {
        setLoadingProfile(false);
        return;
      }
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap && userSnap.exists() && active) {
          const userData = userSnap.data();
          const recruiterTitle = userData.recruiterTitle || '';
          const companyId = userData.companyId;
          
          if (companyId) {
            setExistingCompanyId(companyId);
            const companyRef = doc(db, 'companies', companyId);
            const companySnap = await getDoc(companyRef);
            if (companySnap && companySnap.exists() && active) {
              const compData = companySnap.data();
              setFormData({
                companyName: compData.companyName || '',
                logoUrl: compData.logoUrl || '',
                industry: compData.industry || '',
                companySize: compData.companySize || '11-50',
                recruiterTitle: recruiterTitle || compData.recruiterTitle || '',
                companyWebsite: compData.companyWebsite || '',
                hiringContextNote: compData.hiringContextNote || '',
              });
            } else {
              setFormData((prev) => ({
                ...prev,
                recruiterTitle,
              }));
            }
          } else {
            setFormData((prev) => ({
              ...prev,
              recruiterTitle,
            }));
          }
        }
      } catch (err) {
        console.error("Error loading existing recruiter/company data:", err);
      } finally {
        if (active) {
          setLoadingProfile(false);
        }
      }
    };
    loadExistingData();
    return () => {
      active = false;
    };
  }, []);

  // Handle Logo Upload Preview
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size limit of 5MB
      const maxSizeBytes = 5 * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        setSaveError("File is too large. Max size limit is 5MB.");
        return;
      }

      setSaveError(null);
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          logoUrl: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Determine if minimum required fields are filled: Company Name and Industry
  const isValid = formData.companyName.trim() !== '' && formData.industry !== '';

  const handleContinue = async () => {
    if (!isValid) return;
    const user = auth.currentUser;
    if (!user) {
      setSaveError("No authenticated user session found.");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const uid = user.uid;
      let companyId = existingCompanyId;

      if (companyId) {
        // Update existing company document
        const companyRef = doc(db, 'companies', companyId);
        await updateDoc(companyRef, {
          companyName: formData.companyName.trim(),
          industry: formData.industry,
          companySize: formData.companySize,
          companyWebsite: formData.companyWebsite.trim(),
          hiringContextNote: formData.hiringContextNote.trim()
        });
      } else {
        // Create new company document
        const companyPayload = {
          companyName: formData.companyName.trim(),
          logoUrl: '',
          industry: formData.industry,
          companySize: formData.companySize,
          companyWebsite: formData.companyWebsite.trim(),
          hiringContextNote: formData.hiringContextNote.trim(),
          createdByUid: uid,
          recruiterUids: [uid],
          createdAt: serverTimestamp()
        };
        const docRef = await addDoc(collection(db, 'companies'), companyPayload);
        companyId = docRef.id;
        setExistingCompanyId(companyId);
      }

      // 2. Upload the logo if selected
      let finalLogoUrl = formData.logoUrl;
      if (logoFile && companyId) {
        setIsUploadingLogo(true);
        try {
          finalLogoUrl = await uploadCompanyLogo(companyId, logoFile);
          await updateDoc(doc(db, 'companies', companyId), { logoUrl: finalLogoUrl });
        } catch (uploadErr) {
          console.error("Failed uploading logo:", uploadErr);
          throw new Error("Logo upload failed");
        } finally {
          setIsUploadingLogo(false);
        }
      }

      // 3. Update the existing users/{uid} document setting onboardingComplete: true, companyId, recruiterTitle
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        onboardingComplete: true,
        companyId: companyId,
        recruiterTitle: formData.recruiterTitle.trim()
      });

      // 4. Update the local state with final logoUrl if any
      const finalData = {
        ...formData,
        logoUrl: finalLogoUrl || formData.logoUrl
      };
      setFormData(finalData);

      setIsSuccessState(true);
      setTimeout(() => {
        onComplete(finalData);
      }, 1800);

    } catch (err) {
      console.error("Error continuing setup:", err);
      setSaveError("Something went wrong saving your company details. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAndExitClick = async () => {
    const user = auth.currentUser;
    if (!user) {
      if (onSaveAndExit) onSaveAndExit(formData);
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const uid = user.uid;
      let companyId = existingCompanyId;

      if (companyId) {
        // Update existing company document
        const companyRef = doc(db, 'companies', companyId);
        await updateDoc(companyRef, {
          companyName: formData.companyName.trim(),
          industry: formData.industry,
          companySize: formData.companySize,
          companyWebsite: formData.companyWebsite.trim(),
          hiringContextNote: formData.hiringContextNote.trim()
        });
      } else {
        // Create new company document
        const companyPayload = {
          companyName: formData.companyName.trim(),
          logoUrl: '',
          industry: formData.industry,
          companySize: formData.companySize,
          companyWebsite: formData.companyWebsite.trim(),
          hiringContextNote: formData.hiringContextNote.trim(),
          createdByUid: uid,
          recruiterUids: [uid],
          createdAt: serverTimestamp()
        };
        const docRef = await addDoc(collection(db, 'companies'), companyPayload);
        companyId = docRef.id;
        setExistingCompanyId(companyId);
      }

      // 2. Upload the logo if selected
      let finalLogoUrl = formData.logoUrl;
      if (logoFile && companyId) {
        setIsUploadingLogo(true);
        try {
          finalLogoUrl = await uploadCompanyLogo(companyId, logoFile);
          await updateDoc(doc(db, 'companies', companyId), { logoUrl: finalLogoUrl });
        } catch (uploadErr) {
          console.error("Failed uploading logo on exit:", uploadErr);
        } finally {
          setIsUploadingLogo(false);
        }
      }

      // 3. Update the existing users/{uid} document setting companyId, recruiterTitle
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        companyId: companyId,
        recruiterTitle: formData.recruiterTitle.trim()
      });

      const finalData = {
        ...formData,
        logoUrl: finalLogoUrl || formData.logoUrl
      };

      if (onSaveAndExit) {
        onSaveAndExit(finalData);
      }
    } catch (err) {
      console.error("Error on save and exit:", err);
      // Even if firestore write fails, let them exit
      if (onSaveAndExit) onSaveAndExit(formData);
    } finally {
      setIsSaving(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-page-gradient flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-accent-orange" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="font-manrope text-sm text-text-muted font-semibold animate-pulse">Loading company profile...</span>
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
          <div className="w-20 h-20 rounded-full bg-orange-50 flex items-center justify-center text-accent-orange border-4 border-orange-100">
            <Building2 className="w-10 h-10 animate-bounce" />
          </div>
          <div>
            <h2 className="font-sora font-bold text-text-navy text-2xl">Company Profile Set!</h2>
            <p className="font-manrope text-text-muted text-sm mt-2 leading-relaxed">
              Your company setup has been completed successfully. Preparing your candidate sourcing and recruitment dashboard now.
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
    <div className="min-h-screen bg-page-gradient pb-24 relative overflow-hidden flex flex-col justify-between">
      {/* Background Ambience decoration blobs */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        <BackgroundBlob size="xl" className="-top-40 -right-20 opacity-8" />
        <BackgroundBlob size="lg" className="-bottom-20 -left-20 from-accent-purple via-brand-middle to-brand-start opacity-8" />
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

        {onSaveAndExit && (
          <button
            onClick={handleSaveAndExitClick}
            disabled={isSaving}
            className="text-xs font-manrope font-semibold text-text-muted hover:text-accent-orange transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            <FileText className="w-3.5 h-3.5" />
            {isSaving ? "Saving..." : "Save & exit"}
          </button>
        )}
      </div>

      {/* Main Single Card Form Container */}
      <div className="max-w-md w-full mx-auto px-4 mt-12 mb-16 relative z-10 flex-grow flex flex-col justify-center">
        <div className="text-center mb-6">
          <h2 className="font-sora font-extrabold text-2xl sm:text-3xl text-text-navy tracking-tight">
            Tell us about your company
          </h2>
          <p className="font-manrope text-sm text-text-muted mt-2 leading-relaxed">
            This helps us tailor job matching for your team.
          </p>
        </div>

        {/* Dissmissible Error Banner */}
        <AnimatePresence>
          {saveError && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              className="mb-4 overflow-hidden"
            >
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-3 shadow-warm-sm">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-grow">
                  <p className="text-xs font-manrope leading-normal font-semibold">
                    {saveError}
                  </p>
                </div>
                <button 
                  onClick={() => setSaveError(null)}
                  className="p-1 rounded-full hover:bg-red-100 text-red-500 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Card className="flex flex-col gap-5 p-6 sm:p-8 shadow-warm-lg" id="recruiter-setup-card">
          {/* Logo upload & Company Name Block */}
          <div className="flex items-center gap-4.5 pb-4 border-b border-border-warm/30">
            {/* Squarespace-like mini Upload Box */}
            <div className="relative flex-shrink-0">
              <button
                type="button"
                disabled={isUploadingLogo || isSaving}
                onClick={() => fileInputRef.current?.click()}
                className="w-16 h-16 rounded-xl border-2 border-dashed border-border-warm bg-surface hover:bg-orange-50/20 hover:border-accent-orange/40 transition-all flex flex-col items-center justify-center text-text-muted gap-1 cursor-pointer overflow-hidden disabled:opacity-50"
              >
                {isUploadingLogo ? (
                  <div className="w-5 h-5 border-2 border-accent-orange border-t-transparent rounded-full animate-spin" />
                ) : formData.logoUrl ? (
                  <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <ImageIcon className="w-5 h-5 text-text-muted/60" />
                    <span className="text-[9px] font-bold font-manrope">Upload</span>
                  </>
                )}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleLogoUpload}
                accept="image/*"
                className="hidden"
                disabled={isUploadingLogo || isSaving}
              />
            </div>

            <div className="flex-grow flex flex-col gap-1">
              <label className="font-manrope text-xs font-bold text-text-navy">
                Company Name <span className="text-accent-orange">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Acme Corporation"
                value={formData.companyName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, companyName: e.target.value }))
                }
                className="w-full px-3 py-2 bg-surface border border-border-warm rounded-lg font-manrope text-xs focus:outline-none focus:border-accent-orange focus:ring-1 focus:ring-accent-orange transition-all"
                disabled={isSaving}
              />
            </div>
          </div>

          {/* Industry Selection Dropdown */}
          <div className="flex flex-col gap-1.5">
            <label className="font-manrope text-xs font-bold text-text-navy">
              Industry <span className="text-accent-orange">*</span>
            </label>
            <select
              required
              value={formData.industry}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, industry: e.target.value }))
              }
              className="w-full px-3 py-2.5 bg-surface border border-border-warm rounded-lg font-manrope text-xs focus:outline-none focus:border-accent-orange focus:ring-1 focus:ring-accent-orange transition-all"
              disabled={isSaving}
            >
              <option value="" disabled>Select your company's sector</option>
              <option value="Tech">Technology, Software & AI</option>
              <option value="Finance">Finance & Fintech</option>
              <option value="Healthcare">Healthcare & Biotech</option>
              <option value="Retail">Retail & E-commerce</option>
              <option value="Education">Education & Edtech</option>
              <option value="Agency">Creative Agency & Consulting</option>
              <option value="Other">Other / Non-profit</option>
            </select>
          </div>

          {/* Company Size Pill Group */}
          <div className="flex flex-col gap-1.5">
            <label className="font-manrope text-xs font-bold text-text-navy">
              Company Size
            </label>
            <div className="flex flex-wrap gap-2">
              {(['1-10', '11-50', '51-200', '201-1000', '1000+'] as const).map((size) => {
                const isSelected = formData.companySize === size;
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, companySize: size }))
                    }
                    className={`px-3 py-1.5 text-xs font-manrope font-semibold rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-brand-gradient text-white border-transparent shadow-warm-sm'
                        : 'bg-white text-text-muted border-border-warm hover:border-accent-orange/40'
                    }`}
                    disabled={isSaving}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Your Title / Role */}
          <div className="flex flex-col gap-1.5">
            <label className="font-manrope text-xs font-bold text-text-navy">
              Your Professional Title
            </label>
            <input
              type="text"
              placeholder="e.g. Talent Sourcing Lead"
              value={formData.recruiterTitle}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, recruiterTitle: e.target.value }))
              }
              className="w-full px-3 py-2 bg-surface border border-border-warm rounded-lg font-manrope text-xs focus:outline-none focus:border-accent-orange focus:ring-1 focus:ring-accent-orange transition-all"
              disabled={isSaving}
            />
          </div>

          {/* Company Website URL */}
          <div className="flex flex-col gap-1.5">
            <label className="font-manrope text-xs font-bold text-text-navy flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-accent-orange" />
              Company Website (Optional)
            </label>
            <input
              type="url"
              placeholder="e.g. https://acme.co"
              value={formData.companyWebsite}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, companyWebsite: e.target.value }))
              }
              className="w-full px-3 py-2 bg-surface border border-border-warm rounded-lg font-manrope text-xs focus:outline-none focus:border-accent-orange focus:ring-1 focus:ring-accent-orange transition-all"
              disabled={isSaving}
            />
          </div>

          {/* Hiring Context Note (Critically placed) */}
          <div className="flex flex-col gap-1.5">
            <label className="font-manrope text-xs font-bold text-text-navy flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-accent-orange" />
              Hiring Context & Needs
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Fast-paced startup, remote-first, node & python stacks..."
              value={formData.hiringContextNote}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, hiringContextNote: e.target.value }))
              }
              className="w-full px-3 py-2 bg-surface border border-border-warm rounded-lg font-manrope text-xs focus:outline-none focus:border-accent-orange focus:ring-1 focus:ring-accent-orange transition-all resize-none"
              disabled={isSaving}
            />
            <p className="text-[10px] text-text-muted leading-relaxed font-manrope">
              Anything about your team or hiring needs that might help our AI understand context (e.g. fast-paced startup, remote-first, specific tech culture).
            </p>
          </div>

          {/* Bottom Call to Action Button */}
          <Button
            variant="primary"
            disabled={!isValid || isSaving}
            onClick={handleContinue}
            className={`w-full py-3 mt-2 font-bold shadow-warm-md text-sm rounded-full flex items-center justify-center gap-2 ${
              !isValid || isSaving ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            id="recruiter-continue-button"
          >
            {isSaving ? (
              <>
                Saving details...
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </>
            ) : (
              <>
                Continue to dashboard
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </Card>
      </div>

      {/* Bottom Legal bar */}
      <div className="max-w-5xl mx-auto w-full text-center relative z-10 text-[10px] text-text-muted/60 font-manrope pt-4 border-t border-border-warm/20">
        Secure hiring workspace initialized. TalentSphere © 2026. All rights reserved.
      </div>
    </div>
  );
};
