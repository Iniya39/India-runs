import React from 'react';
import { BrainCircuit } from 'lucide-react';

interface ExplanationPanelProps {
  explanation: string;
}

export const ExplanationPanel: React.FC<ExplanationPanelProps> = ({ explanation }) => {
  return (
    <div className="bg-[#FFFBF8] border border-brand-start/20 rounded-xl p-4 flex gap-3 shadow-warm-sm mt-3 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-16 h-16 bg-brand-gradient/5 rounded-bl-full pointer-events-none" />
      <div className="w-8 h-8 rounded-full bg-brand-gradient text-white flex items-center justify-center shrink-0 shadow-warm-sm">
        <BrainCircuit className="w-4.5 h-4.5" />
      </div>
      <div>
        <h5 className="text-[10px] font-extrabold text-brand-start uppercase tracking-wider">AI Evaluation Reasoning</h5>
        <p className="font-manrope text-xs leading-relaxed text-text-navy/90 mt-1">
          {explanation}
        </p>
      </div>
    </div>
  );
};
