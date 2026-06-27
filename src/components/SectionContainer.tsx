import React from 'react';

export interface SectionContainerProps {
  children: React.ReactNode;
  id?: string;
  className?: string;
  spacing?: 'compact' | 'normal' | 'relaxed';
}

export const SectionContainer: React.FC<SectionContainerProps> = ({
  children,
  id,
  className = '',
  spacing = 'normal',
}) => {
  const spacingStyles = {
    compact: 'py-8 sm:py-12',
    normal: 'py-16 sm:py-24',
    relaxed: 'py-24 sm:py-32',
  };

  return (
    <section
      id={id}
      className={`w-full ${spacingStyles[spacing]} ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </section>
  );
};
