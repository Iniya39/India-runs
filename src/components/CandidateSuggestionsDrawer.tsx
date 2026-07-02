import React, { useEffect, useState, useCallback } from 'react';
import { X, RotateCcw, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchAISuggestions, RankedCandidate } from '../services/aiSuggestionsService';
import { CandidateRankingList } from './CandidateRankingList';

interface CandidateSuggestionsDrawerProps {
  jobId: string;
  jobTitle: string;
  initialCandidates?: RankedCandidate[];
  initialCount?: number;
  initialElapsedMs?: number;
  onClose: () => void;
}

export const CandidateSuggestionsDrawer: React.FC<CandidateSuggestionsDrawerProps> = ({
  jobId,
  jobTitle,
  initialCandidates,
  initialCount,
  initialElapsedMs,
  onClose,
}) => {
  const [candidates, setCandidates] = useState<RankedCandidate[]>(() => initialCandidates || []);
  const [candidateCount, setCandidateCount] = useState(() => initialCount || 0);
  const [elapsedMs, setElapsedMs] = useState(() => initialElapsedMs || 0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadSuggestions = useCallback(async (isRefresh = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchAISuggestions(jobId);
      setCandidates(response.rankings || []);
      setCandidateCount(response.candidate_count || 0);
      setElapsedMs(response.elapsed_ms || 0);
      if (isRefresh) {
        triggerToast("Suggestions updated successfully!");
      }
    } catch (err: any) {
      const errMsg = err.message || "Failed to load suggestions.";
      setError(errMsg);
      triggerToast(`Error: ${errMsg}`);
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    if (initialCandidates === undefined) {
      loadSuggestions();
    }
  }, [loadSuggestions, initialCandidates]);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-manrope">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <motion.div 
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-screen max-w-3xl bg-page-gradient h-full flex flex-col shadow-warm-lg relative border-l border-border-warm/50"
        >
          {/* Toast Container */}
          <AnimatePresence>
            {toastMessage && (
              <motion.div
                initial={{ opacity: 0, y: -20, x: '-50%' }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-[#161820] text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-warm-lg flex items-center gap-2 border border-white/10"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-accent-purple" />
                <span>{toastMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Drawer Header */}
          <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-border-warm/50 px-6 py-4 flex items-center justify-between z-10 shadow-warm-sm">
            <div>
              <h2 className="font-sora font-extrabold text-lg sm:text-xl text-text-navy flex items-center gap-2">
                <span>AI Candidate Matchmaker</span>
              </h2>
              <p className="text-xs text-text-muted mt-0.5 max-w-md truncate">
                AI suggestions for <strong className="text-text-navy">{jobTitle}</strong>
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Refresh Button */}
              <button
                onClick={() => loadSuggestions(true)}
                disabled={isLoading}
                className={`p-2 rounded-xl border text-text-muted hover:text-text-navy hover:bg-border-warm/25 transition-all shadow-warm-sm flex items-center gap-1.5 cursor-pointer ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : 'bg-white border-border-warm'
                }`}
                title="Refresh suggestions"
              >
                <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="text-xs font-bold hidden sm:inline">Refresh</span>
              </button>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="p-2 rounded-xl border border-border-warm bg-white text-text-muted hover:text-text-navy hover:bg-border-warm/25 transition-all shadow-warm-sm cursor-pointer"
                title="Close panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Scrollable list container */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
            <CandidateRankingList
              candidates={candidates}
              isLoading={isLoading}
              error={error}
              onRetry={() => loadSuggestions(false)}
              jobTitle={jobTitle}
              candidateCount={candidateCount}
              elapsedMs={elapsedMs}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
};
