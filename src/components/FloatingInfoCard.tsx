import { motion } from 'motion/react';
import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface FloatingInfoCardProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  iconBgType?: 'gradient' | 'orange' | 'purple';
  className?: string;
  delay?: number;
}

export const FloatingInfoCard: React.FC<FloatingInfoCardProps> = ({
  icon: Icon,
  title,
  subtitle,
  iconBgType = 'gradient',
  className = '',
  delay = 0,
}) => {
  const bgStyles = {
    gradient: 'bg-brand-gradient text-white',
    orange: 'bg-accent-orange/10 text-accent-orange',
    purple: 'bg-accent-purple/10 text-accent-purple',
  };

  return (
    <motion.div
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        type: 'spring',
        stiffness: 100,
        damping: 15,
        delay,
      }}
      whileHover={{ y: -5 }}
      className={`flex items-center gap-4 bg-surface border border-border-warm rounded-2xl p-4 shadow-warm-md hover:shadow-warm-lg transition-all duration-300 ${className}`}
    >
      <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-bold ${bgStyles[iconBgType]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h4 className="font-sora font-semibold text-text-navy text-sm sm:text-base leading-tight">
          {title}
        </h4>
        <p className="font-manrope text-xs sm:text-sm text-text-muted mt-1 leading-snug">
          {subtitle}
        </p>
      </div>
    </motion.div>
  );
};
