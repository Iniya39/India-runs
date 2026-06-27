import { motion, HTMLMotionProps } from 'motion/react';
import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: ButtonVariant;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  children,
  className = '',
  whileHover,
  whileTap,
  ...props
}) => {
  const baseStyles = 'px-6 py-3 font-manrope text-sm font-semibold rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent-orange/50 flex items-center justify-center gap-2 cursor-pointer';
  
  const variants = {
    primary: 'bg-brand-gradient text-white shadow-warm-md hover:shadow-warm-lg hover:brightness-105 border-0',
    secondary: 'border-2 border-border-warm text-text-navy bg-white hover:bg-border-warm/30',
    ghost: 'text-text-muted hover:text-text-navy hover:bg-border-warm/20',
  };

  return (
    <motion.button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      whileHover={{ scale: 1.02, ...(whileHover as object) }}
      whileTap={{ scale: 0.98, ...(whileTap as object) }}
      {...props}
    >
      {children}
    </motion.button>
  );
};
