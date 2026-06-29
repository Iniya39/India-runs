import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Award, Briefcase, Code2, GraduationCap, ChevronDown, ChevronUp, 
  Sparkles, Zap, BrainCircuit, Loader2, UserPlus, AlertTriangle, TrendingUp, MessagesSquare, Download, CheckSquare
} from 'lucide-react';

interface CandidateRankingDashboardProps {
  jobId: string;
  jobData: any;
}

export const CandidateRankingDashboard: React.FC<CandidateRankingDashboardProps> = ({ jobId, jobData }) => {
  const [isRanking, setIsRanking] = useState(false);
  const [rankedData, setRankedData] = useState<any>(null);
  const [isReverseRecruiting, setIsReverseRecruiting] = useState(false);
  const [passiveCandidates, setPassiveCandidates] = useState<any[]>([]);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [comparisonResult, setComparisonResult] = useState<any>(null);
  const [isComparing, setIsComparing] = useState(false);

  const handleRankCandidates = async () => {
    setIsRanking(true);
    try {
      // Mock semantic candidates
      const mockSemanticCandidates = [
        { candidate_id: "cand_1", similarity_score: 92, metadata: { name: "Sarah Chen", role: "AI Engineer" } },
        { candidate_id: "cand_2", similarity_score: 85, metadata: { name: "David Kim", role: "Backend Developer" } },
        { candidate_id: "cand_3", similarity_score: 89, metadata: { name: "Elena Rodriguez", role: "Full Stack ML" } }
      ];

      const res = await fetch('http://localhost:8000/api/rank-candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_data: jobData,
          semantic_candidates: mockSemanticCandidates
        })
      });

      if (!res.ok) throw new Error("Ranking failed");
      const data = await res.json();
      setRankedData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRanking(false);
    }
  };

  const handleReverseRecruitment = async () => {
    setIsReverseRecruiting(true);
    try {
      const res = await fetch('http://localhost:8000/api/reverse-recruitment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_data: jobData })
      });
      if (!res.ok) throw new Error("Reverse recruitment failed");
      const data = await res.json();
      setPassiveCandidates(data.recommended_passive_candidates || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsReverseRecruiting(false);
    }
  };

  const handleCompare = async () => {
    if (selectedForCompare.length < 2) return;
    setIsComparing(true);
    
    // Find candidate objects
    const allCands = [...(rankedData?.ranked_candidates || []), ...passiveCandidates];
    const candsToCompare = allCands.filter(c => selectedForCompare.includes(c.candidate_id));

    try {
      const res = await fetch('http://localhost:8000/api/compare-candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_data: jobData, candidates: candsToCompare })
      });
      if (!res.ok) throw new Error("Compare failed");
      const data = await res.json();
      setComparisonResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsComparing(false);
    }
  };

  const handleExport = () => {
    // Generate a beautiful HTML report string
    const htmlContent = `
      <html>
        <head>
          <title>AI Candidate Evaluation Report</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1a1a2e; }
            h1 { color: #5e35b1; }
            .candidate { border: 1px solid #e0e0e0; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; background: #e8f5e9; color: #2e7d32; }
          </style>
        </head>
        <body>
          <h1>AI Evaluation Report: ${jobData?.basics?.title || 'Job Role'}</h1>
          ${rankedData?.ranked_candidates?.map((c: any) => `
            <div class="candidate">
              <h2>${c.name} - ${c.decision?.recommendation}</h2>
              <p><strong>Final Score:</strong> ${c.final_score}/100</p>
              <p><strong>Summary:</strong> ${c.decision?.summary}</p>
              <p><strong>Strengths:</strong> ${c.decision?.strengths?.join(', ')}</p>
              <p><strong>Risks:</strong> ${c.decision?.risks?.join(', ')}</p>
            </div>
          `).join('')}
        </body>
      </html>
    `;
    
    // Open in a new window so the recruiter can print to PDF
    const newWindow = window.open();
    newWindow?.document.write(htmlContent);
    newWindow?.document.close();
  };

  const toggleCompare = (id: string) => {
    setSelectedForCompare(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  if (!rankedData && !isRanking) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-border-warm shadow-sm text-center">
        <Sparkles className="w-16 h-16 text-accent-purple mb-4 opacity-50" />
        <h3 className="font-sora font-bold text-2xl text-text-navy mb-2">Ready to re-rank candidates?</h3>
        <p className="text-text-muted mb-8 max-w-md font-manrope">
          We will analyze the top semantic candidates against your job description to generate dynamic weights and a final contextual score.
        </p>
        <div className="flex gap-4">
          <button onClick={handleRankCandidates} className="px-6 py-3 bg-accent-purple text-white rounded-xl font-bold font-manrope hover:bg-accent-purple/90 transition-all shadow-md">
            Generate AI Ranking
          </button>
          <button onClick={handleReverseRecruitment} className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold font-manrope hover:bg-emerald-600 transition-all shadow-md">
            Find Passive Candidates
          </button>
        </div>
      </div>
    );
  }

  if (isRanking || isReverseRecruiting) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl border border-border-warm text-center">
        <Loader2 className="w-12 h-12 text-accent-purple animate-spin mb-4" />
        <h3 className="font-sora font-bold text-xl text-text-navy">
          {isRanking ? 'Evaluating multi-signal intelligence...' : 'Searching database for passive candidates...'}
        </h3>
        <p className="text-sm text-text-muted mt-2 font-manrope">This requires deep semantic evaluation and may take 15-30 seconds.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 font-manrope">
      
      {/* Top Actions Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {selectedForCompare.length >= 2 && (
            <button 
              onClick={handleCompare}
              disabled={isComparing}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm"
            >
              {isComparing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Compare {selectedForCompare.length} Candidates
            </button>
          )}
        </div>
        <button 
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-border-warm text-text-navy rounded-lg text-sm font-bold hover:bg-surface transition-colors shadow-sm"
        >
          <Download className="w-4 h-4 text-text-muted" /> Export AI Report
        </button>
      </div>

      {/* Comparison Result Modal */}
      {comparisonResult && (
        <div className="bg-gradient-to-br from-indigo-900 to-purple-900 p-6 rounded-2xl text-white shadow-xl">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-sora font-bold text-xl flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-300" /> AI Comparison Engine
            </h3>
            <button onClick={() => setComparisonResult(null)} className="text-white/50 hover:text-white">✕</button>
          </div>
          <p className="text-sm text-indigo-100 mb-6 leading-relaxed">{comparisonResult.executive_summary}</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(comparisonResult.tradeoffs).map(([id, tradeoff]: any) => (
              <div key={id} className="bg-white/10 p-4 rounded-xl border border-white/20">
                <span className="text-xs font-bold uppercase text-indigo-300 mb-1 block">Candidate Trade-off</span>
                <p className="text-sm font-medium">{tradeoff}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-xl">
            <h4 className="font-bold text-emerald-300 flex items-center gap-2">
              <Award className="w-4 h-4" /> AI Recommendation
            </h4>
            <p className="text-sm mt-1 text-emerald-50">{comparisonResult.recommendation_reason}</p>
          </div>
        </div>
      )}

      {/* Reverse Recruitment Results */}
      {passiveCandidates.length > 0 && (
        <div className="flex flex-col gap-4">
          <h3 className="font-sora font-bold text-xl text-text-navy flex items-center gap-2 border-b border-border-warm pb-2">
            <UserPlus className="w-5 h-5 text-emerald-500" /> Reverse Recruitment (Passive Candidates)
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {passiveCandidates.map((cand, idx) => (
              <CandidateRankCard 
                key={idx} 
                candidate={cand} 
                isPassive={true} 
                isSelected={selectedForCompare.includes(cand.candidate_id)}
                onToggleSelect={() => toggleCompare(cand.candidate_id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Applicants Ranking Results */}
      {rankedData?.ranked_candidates && (
        <div className="flex flex-col gap-4 mt-4">
          <h3 className="font-sora font-bold text-xl text-text-navy flex items-center gap-2 border-b border-border-warm pb-2">
            <Award className="w-5 h-5 text-accent-purple" /> AI Ranked Applicants
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {rankedData.ranked_candidates.map((cand: any, idx: number) => (
              <CandidateRankCard 
                key={idx} 
                candidate={cand} 
                rank={idx + 1}
                isSelected={selectedForCompare.includes(cand.candidate_id)}
                onToggleSelect={() => toggleCompare(cand.candidate_id)}
              />
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

// --- Subcomponents ---

const RecommendationBadge = ({ rec }: { rec: string }) => {
  if (!rec) return null;
  const lower = rec.toLowerCase();
  if (lower.includes('strong')) return <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> {rec}</span>;
  if (lower.includes('good')) return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> {rec}</span>;
  if (lower.includes('potential')) return <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold border border-orange-200 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-500"></div> {rec}</span>;
  return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold border border-red-200 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> {rec}</span>;
};

const CandidateRankCard = ({ candidate, rank, isPassive = false, isSelected, onToggleSelect }: any) => {
  const [expanded, setExpanded] = useState(false);
  const decision = candidate.decision || {};
  
  return (
    <div className={`bg-white rounded-2xl border ${isSelected ? 'border-indigo-400 shadow-md ring-2 ring-indigo-400/20' : 'border-border-warm shadow-sm'} overflow-hidden transition-all hover:shadow-md`}>
      
      {/* Top Header Row */}
      <div className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onToggleSelect} className={`shrink-0 w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-border-warm hover:border-indigo-400'}`}>
            {isSelected && <CheckSquare className="w-4 h-4 text-white" />}
          </button>
          
          {!isPassive && (
            <div className="w-10 h-10 rounded-full bg-accent-purple/10 text-accent-purple font-sora font-extrabold flex items-center justify-center shrink-0 text-lg border border-accent-purple/20">
              #{rank}
            </div>
          )}
          
          <div>
            <div className="flex items-center gap-3">
              <h4 className="font-sora font-bold text-lg text-text-navy">{candidate.name}</h4>
              <RecommendationBadge rec={decision.recommendation} />
            </div>
            <div className="flex items-center gap-3 text-xs text-text-muted mt-1">
              <span>{candidate.role}</span>
              {decision.growth_potential && (
                <span className="flex items-center gap-1 text-indigo-600 font-bold"><TrendingUp className="w-3 h-3"/> {decision.growth_potential}</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase text-text-muted block">Final AI Score</span>
            <span className="font-sora font-extrabold text-2xl text-text-navy">{candidate.final_score}</span>
          </div>
          <button onClick={() => setExpanded(!expanded)} className="text-text-muted hover:text-text-navy bg-surface p-2 rounded-lg transition-colors">
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Expanded Explainable AI Section */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border-warm overflow-hidden bg-surface/30"
          >
            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Strengths & Risks */}
              <div className="flex flex-col gap-4">
                <div className="bg-white p-4 rounded-xl border border-border-warm shadow-sm">
                  <h5 className="font-sora font-bold text-sm text-emerald-700 mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> Candidate Strengths
                  </h5>
                  <ul className="space-y-2 text-xs text-text-navy font-medium">
                    {decision.strengths?.map((s: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="bg-white p-4 rounded-xl border border-border-warm shadow-sm">
                  <h5 className="font-sora font-bold text-sm text-red-600 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Potential Hiring Risks
                  </h5>
                  <ul className="space-y-2 text-xs text-text-navy font-medium">
                    {decision.risks?.map((r: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 mt-1.5"></div>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Middle Column: Interview Focus & Readiness */}
              <div className="flex flex-col gap-4">
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                  <h5 className="font-sora font-bold text-sm text-indigo-900 mb-3 flex items-center gap-2">
                    <MessagesSquare className="w-4 h-4" /> Suggested Interview Focus
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {decision.interview_focus?.map((f: string, i: number) => (
                      <span key={i} className="px-2.5 py-1 bg-white border border-indigo-200 text-indigo-700 rounded-lg text-[11px] font-bold">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-border-warm shadow-sm">
                  <h5 className="font-sora font-bold text-sm text-text-navy mb-3 flex items-center gap-2">
                    <BrainCircuit className="w-4 h-4 text-accent-purple" /> Readiness Scores
                  </h5>
                  <div className="space-y-3">
                    <ReadinessBar label="Technical" score={decision.readiness?.technical} />
                    <ReadinessBar label="Communication" score={decision.readiness?.communication} />
                    <ReadinessBar label="Leadership" score={decision.readiness?.leadership} />
                    <ReadinessBar label="Domain Knowledge" score={decision.readiness?.domain} />
                  </div>
                </div>
              </div>

              {/* Right Column: Signal Breakdown */}
              <div className="flex flex-col gap-3">
                <div className="bg-white p-4 rounded-xl border border-border-warm shadow-sm h-full flex flex-col">
                  <h5 className="font-sora font-bold text-sm text-text-navy mb-1">Recruiter AI Summary</h5>
                  <p className="text-xs text-text-muted mb-4">{decision.summary}</p>
                  
                  <div className="mt-auto space-y-2 text-xs font-bold font-manrope">
                    <div className="flex justify-between items-center bg-surface p-2 rounded-md">
                      <span className="text-text-muted flex items-center gap-1"><Zap className="w-3 h-3"/> Semantic</span>
                      <span className="text-text-navy">{candidate.semantic_score}/100</span>
                    </div>
                    <div className="flex justify-between items-center bg-surface p-2 rounded-md">
                      <span className="text-text-muted flex items-center gap-1"><Code2 className="w-3 h-3"/> Skills</span>
                      <span className="text-text-navy">{candidate.skills_score}/100</span>
                    </div>
                    <div className="flex justify-between items-center bg-surface p-2 rounded-md">
                      <span className="text-text-muted flex items-center gap-1"><Briefcase className="w-3 h-3"/> Projects</span>
                      <span className="text-text-navy">{candidate.projects_score}/100</span>
                    </div>
                    <div className="flex justify-between items-center bg-surface p-2 rounded-md">
                      <span className="text-text-muted flex items-center gap-1"><Award className="w-3 h-3"/> Experience</span>
                      <span className="text-text-navy">{candidate.experience_score}/100</span>
                    </div>
                  </div>
                </div>

                {isPassive && (
                  <button className="py-3 bg-emerald-500 text-white rounded-xl font-bold font-manrope hover:bg-emerald-600 transition-colors shadow-sm flex items-center justify-center gap-2">
                    <UserPlus className="w-4 h-4" /> Invite Candidate
                  </button>
                )}
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ReadinessBar = ({ label, score = 0 }: { label: string, score: number }) => (
  <div>
    <div className="flex justify-between text-[10px] font-bold uppercase text-text-muted mb-1">
      <span>{label}</span>
      <span>{score}/100</span>
    </div>
    <div className="h-1.5 w-full bg-surface rounded-full overflow-hidden">
      <div 
        className="h-full rounded-full bg-gradient-to-r from-accent-purple/50 to-accent-purple" 
        style={{ width: `${score}%` }} 
      />
    </div>
  </div>
);
