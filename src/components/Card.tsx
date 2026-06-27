import { motion, HTMLMotionProps } from 'motion/react';
import React from 'react';

export interface CardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverEffect = false,
  ...props
}) => {
  const Component = hoverEffect ? motion.div : 'div';
  const motionProps = hoverEffect
    ? {
        whileHover: { y: -4, scale: 1.01 },
        transition: { type: 'spring', stiffness: 300, damping: 20 },
      }
    : {};

  return (
    // @ts-ignore - dynamic motion component polymorphism
    <Component
      className={`bg-surface border border-border-warm rounded-2xl p-6 shadow-warm-lg transition-all duration-300 ${className}`}
      {...motionProps}
      {...props}
    >
      {children}
    </Component>
  );
};
