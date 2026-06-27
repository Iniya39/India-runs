import { motion } from 'motion/react';
import React from 'react';

export interface BackgroundBlobProps {
  color?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  blur?: 'sm' | 'md' | 'lg' | 'xl';
  animate?: boolean;
  className?: string;
  opacity?: number;
}

export const BackgroundBlob: React.FC<BackgroundBlobProps> = ({
  color = 'from-brand-start via-brand-middle to-brand-end',
  size = 'md',
  blur = 'lg',
  animate = true,
  className = '',
  opacity = 0.12,
}) => {
  const sizeStyles = {
    sm: 'w-48 h-48',
    md: 'w-72 h-72',
    lg: 'w-96 h-96',
    xl: 'w-128 h-128 md:w-160 md:h-160',
  };

  const blurStyles = {
    sm: 'blur-md',
    md: 'blur-xl',
    lg: 'blur-2xl',
    xl: 'blur-3xl',
  };

  const animationProps = animate
    ? {
        animate: {
          x: [0, 15, -10, 0],
          y: [0, -20, 15, 0],
          scale: [1, 1.05, 0.95, 1],
          rotate: [0, 12, -8, 0],
        },
        transition: {
          duration: 12,
          repeat: Infinity,
          repeatType: 'reverse' as const,
          ease: 'easeInOut',
        },
      }
    : {};

  return (
    <motion.div
      {...animationProps}
      style={{ opacity }}
      className={`absolute pointer-events-none rounded-full bg-gradient-to-tr ${color} ${sizeStyles[size]} ${blurStyles[blur]} ${className} z-0`}
    >
      {/* Organic SVG filter overlay inside the blob to give it a natural liquid distortion */}
      <svg className="hidden">
        <defs>
          <filter id="liquid">
            <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="30" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>
    </motion.div>
  );
};

// Reusable SVG Wave Background component for sections
export const SVGDividerWave: React.FC<{ className?: string; flipped?: boolean }> = ({ className = '', flipped = false }) => {
  return (
    <div className={`w-full overflow-hidden leading-none pointer-events-none ${className} ${flipped ? 'rotate-180' : ''}`}>
      <svg
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
        className="relative block w-full h-[60px]"
        fill="currentColor"
      >
        <path
          d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V0C26.9,8.75,55.05,16.22,83.1,22.07,135.66,32.9,188.62,41.45,241,45.88,267.8,47.78,294.67,49.77,321.39,56.44Z"
          className="text-surface"
        ></path>
      </svg>
    </div>
  );
};
