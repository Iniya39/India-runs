import React from 'react';
import { LucideIcon } from 'lucide-react';

export type BadgeVariant = 'gradient' | 'orange' | 'purple' | 'green' | 'muted';

export interface BadgeProps {
  text: string;
  icon?: LucideIcon;
  variant?: BadgeVariant;
  pulse?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  text,
  icon: Icon,
  variant = 'orange',
  pulse = false,
  className = '',
}) => {
  const styles = {
    gradient: 'bg-brand-gradient text-white font-semibold',
    orange: 'bg-accent-orange/10 text-accent-orange border border-accent-orange/20',
    purple: 'bg-accent-purple/10 text-accent-purple border border-accent-purple/20',
    green: 'bg-success-green/10 text-success-green border border-success-green/20',
    muted: 'bg-border-warm/40 text-text-muted border border-border-warm',
  };

  const pulseColors = {
    gradient: 'bg-white',
    orange: 'bg-accent-orange',
    purple: 'bg-accent-purple',
    green: 'bg-success-green',
    muted: 'bg-text-muted',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-manrope font-semibold tracking-wide ${styles[variant]} ${className}`}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pulseColors[variant]}`}></span>
          <span className={`relative inline-flex rounded-full h-2 w-2 ${pulseColors[variant]}`}></span>
        </span>
      )}
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {text}
    </span>
  );
};
