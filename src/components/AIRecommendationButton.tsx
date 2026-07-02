import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface AIRecommendationButtonProps {
  onClick: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

export const AIRecommendationButton: React.FC<AIRecommendationButtonProps> = ({
  onClick,
  isLoading,
  disabled = false,
}) => {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={isLoading || disabled}
      className={`px-4 py-2 text-xs font-bold rounded-full transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer border ${
        isLoading || disabled
          ? 'bg-border-warm/40 border-border-warm text-text-muted cursor-not-allowed pointer-events-none'
          : 'bg-white border-accent-purple text-accent-purple hover:bg-accent-purple/5 shadow-warm-sm hover:shadow-warm-md'
      }`}
      whileHover={{ scale: isLoading || disabled ? 1 : 1.02 }}
      whileTap={{ scale: isLoading || disabled ? 1 : 0.98 }}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin text-accent-purple" />
          <span>Generating AI Suggestions...</span>
        </>
      ) : (
        <>
          <Sparkles className="w-3.5 h-3.5 text-accent-purple" />
          <span>AI Candidate Suggestions</span>
        </>
      )}
    </motion.button>
  );
};
