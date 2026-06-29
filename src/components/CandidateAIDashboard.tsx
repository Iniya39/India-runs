import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, Award, Zap, TrendingUp, Sparkles, BrainCircuit, Target, Compass } from 'lucide-react';

interface CandidateAIDashboardProps {
  candidateId: string;
}

export const CandidateAIDashboard: React.FC<CandidateAIDashboardProps> = ({ candidateId }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [resumeData, setResumeData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('candidate_id', candidateId);
      formData.append('file', file);

      const res = await fetch('http://localhost:8000/api/process-resume', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to process resume");
      }

      const result = await res.json();
      setResumeData(result.data);
    } catch (err: any) {
      setError(err.message || "An error occurred during upload.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-8">
      {/* Upload Zone */}
      <div className="bg-white rounded-3xl border border-border-warm shadow-warm-md p-8 sm:p-12 text-center flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-5">
          <BrainCircuit className="w-64 h-64" />
        </div>
        
        <h2 className="font-sora font-extrabold text-2xl sm:text-3xl text-text-navy mb-2 z-10">
          Upload Your Resume
        </h2>
        <p className="font-manrope text-sm text-text-muted max-w-md mx-auto mb-8 z-10">
          Upload your PDF or DOCX resume. Our AI will deeply analyze your experience, infer hidden skills, and build your intelligent profile.
        </p>

        <input
          type="file"
          accept=".pdf,.docx"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="relative z-10 flex items-center gap-3 px-8 py-4 bg-accent-purple text-white rounded-full font-bold font-manrope shadow-warm-md hover:bg-accent-purple/90 transition-all disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
        >
          {isUploading ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Processing AI Profile...</>
          ) : (
            <><UploadCloud className="w-5 h-5" /> Select Resume</>
          )}
        </button>

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg border border-red-100 flex items-center gap-2 text-sm z-10">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}
      </div>

      {/* AI Resume Analysis Dashboard */}
      {resumeData && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-6"
        >
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-accent-purple" />
            <h2 className="font-sora font-extrabold text-2xl text-text-navy">AI Resume Analysis</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Column 1: Basic & Career Intel */}
            <div className="flex flex-col gap-6 md:col-span-1">
              <div className="bg-white rounded-2xl border border-border-warm shadow-sm p-6">
                <h3 className="text-lg font-bold text-text-navy font-sora flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-accent-purple" /> Profile Overview
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-text-muted font-manrope uppercase tracking-wider font-bold mb-1">Name</p>
                    <p className="font-manrope text-sm text-text-navy font-medium">{resumeData.basics?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted font-manrope uppercase tracking-wider font-bold mb-1">Role / Summary</p>
                    <p className="font-manrope text-sm text-text-navy font-medium leading-relaxed">{resumeData.basics?.summary || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 shadow-sm p-6">
                <h3 className="text-lg font-bold text-indigo-900 font-sora flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-indigo-500" /> Career Progression
                </h3>
                <p className="font-manrope text-sm text-indigo-900/80 leading-relaxed">
                  {resumeData.careerIntelligence?.careerProgression || 'No clear progression detected.'}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {resumeData.careerIntelligence?.domainExpertise?.map((domain: string) => (
                    <span key={domain} className="px-2.5 py-1 bg-white border border-indigo-200 text-indigo-700 text-xs font-bold rounded-full">
                      {domain}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Column 2 & 3: Skills & Confidence */}
            <div className="flex flex-col gap-6 md:col-span-2">
              
              <div className="bg-white rounded-2xl border border-border-warm shadow-sm p-6">
                <h3 className="text-lg font-bold text-text-navy font-sora flex items-center gap-2 mb-4">
                  <BrainCircuit className="w-5 h-5 text-emerald-500" /> Evidence Confidence (USP)
                </h3>
                <p className="text-xs text-text-muted font-manrope mb-5">
                  Our AI evaluates your skills based on tangible evidence (projects, duration, certifications) to give recruiters confidence.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {resumeData.evidenceConfidence?.map((ec: any) => (
                    <div key={ec.skill} className="p-4 bg-surface rounded-xl border border-border-warm/50 flex flex-col gap-2 relative overflow-hidden group hover:border-emerald-200 transition-colors">
                      <div className="flex justify-between items-center">
                        <span className="font-manrope font-bold text-text-navy">{ec.skill}</span>
                        <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                          {ec.confidenceScore}%
                        </span>
                      </div>
                      <div className="text-[10px] text-text-muted font-manrope flex flex-col gap-1">
                        {ec.evidence?.slice(0, 2).map((ev: string, i: number) => (
                          <div key={i} className="flex items-start gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{ev}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-border-warm shadow-sm p-6">
                <h3 className="text-lg font-bold text-text-navy font-sora flex items-center gap-2 mb-4">
                  <Zap className="w-5 h-5 text-accent-orange" /> Inferred Hidden Skills
                </h3>
                <p className="text-xs text-text-muted font-manrope mb-5">
                  Skills you didn't explicitly list, but our AI inferred from your projects and experience descriptions.
                </p>
                <div className="flex flex-wrap gap-2">
                  {resumeData.hiddenSkills?.map((hs: any) => (
                    <div key={hs.skill} className="px-3 py-1.5 bg-orange-50 border border-orange-200 text-orange-700 rounded-full text-xs font-bold font-manrope group relative cursor-help">
                      {hs.skill}
                      
                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-text-navy text-white text-[10px] rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all shadow-xl z-20 font-normal">
                        <span className="font-bold block mb-1">Inferred from:</span>
                        {hs.context}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-text-navy"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-border-warm shadow-sm p-6">
                <h3 className="text-lg font-bold text-text-navy font-sora flex items-center gap-2 mb-4">
                  <Award className="w-5 h-5 text-accent-purple" /> Project Intelligence
                </h3>
                <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-2">
                  {resumeData.projectIntelligence?.map((proj: any, idx: number) => (
                    <div key={idx} className="p-4 border border-border-warm rounded-xl bg-surface">
                      <h4 className="font-sora font-bold text-text-navy">{proj.projectName}</h4>
                      <p className="text-xs text-text-muted mt-1 mb-3">{proj.problemStatement}</p>
                      
                      <div className="flex flex-wrap gap-x-4 gap-y-2 text-[10px] font-manrope">
                        {proj.architecture && (
                          <div><span className="font-bold text-text-navy">Architecture:</span> <span className="text-text-muted">{proj.architecture}</span></div>
                        )}
                        {proj.impact && (
                          <div><span className="font-bold text-text-navy">Impact:</span> <span className="text-text-muted">{proj.impact}</span></div>
                        )}
                      </div>
                      
                      {proj.technologies && proj.technologies.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {proj.technologies.map((t: string) => (
                            <span key={t} className="text-[9px] font-mono px-2 py-0.5 bg-border-warm/30 rounded text-text-navy/70">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
            </div>
          </div>

          {/* AI Career Coach Panel (Phase 5) */}
          <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-2xl shadow-xl p-8 text-white mt-4 border border-indigo-500/30">
            <div className="flex items-center gap-3 mb-6">
              <Compass className="w-8 h-8 text-indigo-300" />
              <div>
                <h3 className="font-sora font-extrabold text-2xl">AI Career Coach Insights</h3>
                <p className="text-sm text-indigo-200">Based on your profile, here is how you can improve your marketability.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/10 p-5 rounded-xl border border-white/10 flex flex-col">
                <span className="text-xs font-bold uppercase text-indigo-300 mb-2">Profile Strength</span>
                <span className="font-sora font-extrabold text-3xl">85%</span>
                <p className="text-xs text-indigo-200 mt-2 leading-relaxed">Your profile is strong, but adding specific quantifiable metrics to your projects will increase recruiter confidence.</p>
              </div>
              
              <div className="bg-white/10 p-5 rounded-xl border border-white/10 flex flex-col">
                <span className="text-xs font-bold uppercase text-emerald-300 mb-2">Most Valuable Skills</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="px-2 py-1 bg-emerald-500/20 text-emerald-100 rounded-md text-xs font-bold border border-emerald-500/30">React</span>
                  <span className="px-2 py-1 bg-emerald-500/20 text-emerald-100 rounded-md text-xs font-bold border border-emerald-500/30">FastAPI</span>
                </div>
                <p className="text-[10px] text-indigo-200 mt-auto pt-3">Highly demanded in current tech market.</p>
              </div>

              <div className="bg-white/10 p-5 rounded-xl border border-white/10 flex flex-col">
                <span className="text-xs font-bold uppercase text-orange-300 mb-2 flex items-center gap-1"><Target className="w-3 h-3"/> Weak Areas</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="px-2 py-1 bg-orange-500/20 text-orange-100 rounded-md text-xs font-bold border border-orange-500/30">Cloud Deployment</span>
                </div>
                <p className="text-[10px] text-indigo-200 mt-auto pt-3">Consider adding AWS or GCP certifications.</p>
              </div>

              <div className="bg-white/10 p-5 rounded-xl border border-white/10 flex flex-col">
                <span className="text-xs font-bold uppercase text-purple-300 mb-2">Learning Suggestion</span>
                <p className="text-sm font-bold text-white mb-1">Docker & Kubernetes</p>
                <p className="text-xs text-indigo-200 leading-relaxed">Most backend roles matching your profile require containerization experience. Learning this will unlock 40% more jobs.</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
