import React from 'react';
import { RankedCandidate } from '../services/aiSuggestionsService';
import { RankingScore } from './RankingScore';
import { ExplanationPanel } from './ExplanationPanel';
import { Award, Briefcase, Code2, GraduationCap, Sparkles, Zap } from 'lucide-react';
import { Card } from './Card';

interface CandidateRankingCardProps {
  candidate: RankedCandidate;
}

export const CandidateRankingCard: React.FC<CandidateRankingCardProps> = ({ candidate }) => {
  const badge = getMatchBadge(candidate.final_score);

  return (
    <Card className="bg-white border border-border-warm shadow-warm-md hover:shadow-warm-lg hover:border-accent-purple/35 transition-all duration-300 p-5 sm:p-6 flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-warm/30 pb-4">
        {/* Name and Match Rating Badge */}
        <div>
          <h4 className="font-sora font-extrabold text-base sm:text-lg text-text-navy">
            {candidate.name}
          </h4>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 mt-1.5 rounded-full text-[10px] font-bold border ${badge.bg}`}>
            {badge.label}
          </span>
        </div>

        {/* Circular Final Score Indicator */}
        <div className="shrink-0">
          <RankingScore score={candidate.final_score} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left/Middle Column (span 2): Explanation */}
        <div className="lg:col-span-2 flex flex-col justify-center">
          <ExplanationPanel explanation={candidate.explanation} />
        </div>

        {/* Right Column: Breakdown grid */}
        <div className="bg-surface p-4 rounded-xl border border-border-warm/50 flex flex-col gap-3">
          <h5 className="text-[10px] font-extrabold text-text-navy uppercase tracking-wider mb-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-accent-purple" />
            AI Score Breakdown
          </h5>
          
          <div className="space-y-2">
            <ScoreBar label="Semantic Similarity" score={candidate.semantic_similarity} icon={Zap} />
            <ScoreBar label="Skills Match" score={candidate.skills_match} icon={Code2} />
            <ScoreBar label="Project Relevance" score={candidate.project_relevance} icon={Briefcase} />
            <ScoreBar label="Experience Match" score={candidate.experience_match} icon={Award} />
            <ScoreBar label="Certification Score" score={candidate.certification_score} icon={Award} />
            <ScoreBar label="Education Score" score={candidate.education_score} icon={GraduationCap} />
          </div>
        </div>
      </div>
    </Card>
  );
};

interface ScoreBarProps {
  label: string;
  score: number;
  icon: React.ComponentType<any>;
}

const ScoreBar: React.FC<ScoreBarProps> = ({ label, score, icon: Icon }) => {
  let barColor = 'bg-red-500';
  if (score >= 90) barColor = 'bg-green-500';
  else if (score >= 70) barColor = 'bg-blue-500';
  else if (score >= 50) barColor = 'bg-orange-500';

  return (
    <div>
      <div className="flex justify-between items-center text-[10px] font-bold text-text-muted uppercase mb-1">
        <span className="flex items-center gap-1">
          <Icon className="w-3 h-3 shrink-0 text-text-muted" />
          {label}
        </span>
        <span className="text-text-navy">{Math.round(score)}/100</span>
      </div>
      <div className="h-1.5 w-full bg-border-warm/40 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor} transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
};

const getMatchBadge = (score: number) => {
  if (score >= 90) return { label: '★★★★★ Excellent Match', bg: 'bg-green-50 text-green-700 border-green-200' };
  if (score >= 75) return { label: '★★★★ Strong Match', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
  if (score >= 60) return { label: '★★★ Moderate Match', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
  if (score >= 40) return { label: '★★ Fair Match', bg: 'bg-orange-50 text-orange-700 border-orange-200' };
  return { label: '★ Weak Match', bg: 'bg-red-50 text-red-700 border-red-200' };
};
