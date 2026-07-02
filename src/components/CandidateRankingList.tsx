import React from 'react';
import { RankedCandidate } from '../services/aiSuggestionsService';
import { CandidateRankingCard } from './CandidateRankingCard';
import { AlertCircle, Clock, Users } from 'lucide-react';
import { Button } from './Button';

interface CandidateRankingListProps {
  candidates: RankedCandidate[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  jobTitle: string;
  candidateCount: number;
  elapsedMs: number;
}

export const CandidateRankingList: React.FC<CandidateRankingListProps> = ({
  candidates,
  isLoading,
  error,
  onRetry,
  jobTitle,
  candidateCount,
  elapsedMs,
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 w-full">
        {/* Skeleton Header Info */}
        <div className="animate-pulse flex flex-col gap-2 mb-2">
          <div className="h-6 w-2/3 bg-gray-200 rounded-md" />
          <div className="h-4 w-1/3 bg-gray-200 rounded-md" />
        </div>

        {/* Skeleton Cards */}
        {[1, 2, 3].map((idx) => (
          <div key={idx} className="animate-pulse bg-white border border-border-warm rounded-2xl p-6 flex flex-col gap-4 shadow-warm-sm">
            <div className="flex justify-between items-center pb-4 border-b border-border-warm/30">
              <div className="space-y-2 w-1/3">
                <div className="h-5 bg-gray-200 rounded-md" />
                <div className="h-4 bg-gray-200 rounded-md w-1/2" />
              </div>
              <div className="w-16 h-16 bg-gray-200 rounded-full" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-2">
                <div className="h-4 bg-gray-200 rounded-md" />
                <div className="h-4 bg-gray-200 rounded-md w-5/6" />
                <div className="h-4 bg-gray-200 rounded-md w-2/3" />
              </div>
              <div className="bg-surface p-4 rounded-xl space-y-2 animate-pulse">
                <div className="h-3 bg-gray-200 rounded-md w-1/2 mb-2" />
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-3 bg-gray-200 rounded-md" />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-red-50/50 border border-red-200 rounded-2xl text-center max-w-md mx-auto w-full my-6 shadow-warm-sm">
        <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
        <h3 className="font-sora font-extrabold text-base text-text-navy">Failed to load suggestions</h3>
        <p className="font-manrope text-xs text-text-muted mt-2 mb-4 leading-relaxed">
          {error}
        </p>
        <Button variant="primary" onClick={onRetry} className="bg-red-500 hover:bg-red-600 hover:brightness-105 px-6 py-2 text-xs">
          Retry Request
        </Button>
      </div>
    );
  }

  if (!candidates || candidates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white border border-border-warm rounded-2xl text-center max-w-md mx-auto w-full my-6 shadow-warm-sm">
        <Users className="w-12 h-12 text-text-muted mb-3" />
        <h3 className="font-sora font-extrabold text-base text-text-navy">No suitable candidates found</h3>
        <p className="font-manrope text-xs text-text-muted mt-2 leading-relaxed">
          No suitable candidates found. We scanned the active talent database, but couldn't identify profiles matching this job description.
        </p>
      </div>
    );
  }

  // Ensure sorting by final_score descending
  const sortedCandidates = [...candidates].sort((a, b) => b.final_score - a.final_score);
  const formattedTime = (elapsedMs / 1000).toFixed(2);

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Metadata Bar */}
      <div className="bg-white border border-border-warm rounded-2xl p-4 sm:p-5 shadow-warm-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[9px] font-extrabold text-accent-purple uppercase tracking-wider bg-purple-50 px-2.5 py-0.5 rounded-full border border-accent-purple/10">
            Mandate: {jobTitle}
          </span>
          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-text-muted font-manrope">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-text-muted" />
              <strong>{candidateCount}</strong> candidates evaluated
            </span>
            <span className="text-border-warm hidden sm:inline">•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-text-muted" />
              Completed in <strong>{formattedTime}s</strong> ({Math.round(elapsedMs)}ms)
            </span>
          </div>
        </div>
      </div>

      {/* Candidate Listings */}
      <div className="flex flex-col gap-6">
        {sortedCandidates.map((cand) => (
          <CandidateRankingCard key={cand.candidate_id} candidate={cand} />
        ))}
      </div>
    </div>
  );
};
