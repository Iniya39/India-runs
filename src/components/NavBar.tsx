import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Sun, Moon, Menu, X, Globe, HelpCircle } from 'lucide-react';
import { Button } from './Button';

export interface NavLinkItem {
  label: string;
  href: string;
  active?: boolean;
}

export interface NavBarProps {
  links?: NavLinkItem[];
  activeTheme?: 'light' | 'dark';
  onThemeToggle?: () => void;
}

export const NavBar: React.FC<NavBarProps> = ({
  links = [
    { label: 'Talent Pool', href: '#pool', active: true },
    { label: 'AI Matchmaker', href: '#match' },
    { label: 'Reverse Hiring', href: '#reverse' },
    { label: 'Pricing', href: '#pricing' },
  ],
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-border-warm/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer group">
            <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center text-white shadow-warm-md group-hover:scale-105 transition-transform duration-300">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <span className="font-sora font-extrabold text-xl tracking-tight text-text-navy">
              Talent<span className="text-gradient">Sphere</span>
            </span>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={`px-4 py-2 rounded-full text-sm font-medium font-manrope transition-all duration-200 relative ${
                  link.active
                    ? 'text-accent-orange font-semibold bg-accent-orange/5'
                    : 'text-text-muted hover:text-text-navy hover:bg-border-warm/30'
                }`}
              >
                {link.label}
                {link.active && (
                  <motion.span
                    layoutId="activeNav"
                    className="absolute bottom-1 left-4 right-4 h-0.5 bg-accent-orange rounded-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </a>
            ))}
          </nav>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {/* Theme Toggle Icon (Visual showcase) */}
            <motion.button
              whileTap={{ rotate: 45, scale: 0.9 }}
              onClick={() => setIsDark(!isDark)}
              className="p-2.5 rounded-full border border-border-warm bg-white text-text-muted hover:text-text-navy hover:shadow-warm-sm transition-all duration-200 cursor-pointer"
              title="Toggle theme visual placeholder"
            >
              {isDark ? (
                <Moon className="w-5 h-5 text-accent-purple" />
              ) : (
                <Sun className="w-5 h-5 text-accent-orange" />
              )}
            </motion.button>

            <Button variant="secondary" className="px-5 py-2 text-sm">
              Log in
            </Button>
            <Button variant="primary" className="px-5 py-2 text-sm shadow-warm-sm">
              Sign up
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-full border border-border-warm bg-white text-text-muted hover:text-text-navy"
            >
              {isDark ? <Moon className="w-5 h-5 text-accent-purple" /> : <Sun className="w-5 h-5 text-accent-orange" />}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl border border-border-warm bg-white text-text-navy hover:bg-border-warm/20"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="md:hidden border-t border-border-warm bg-white/95 backdrop-blur-md overflow-hidden"
          >
            <div className="px-4 pt-4 pb-6 space-y-3">
              {links.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-4 py-2.5 rounded-xl text-base font-semibold font-manrope ${
                    link.active
                      ? 'bg-accent-orange/10 text-accent-orange'
                      : 'text-text-muted hover:bg-border-warm/20 hover:text-text-navy'
                  }`}
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-4 border-t border-border-warm/60 flex flex-col gap-2">
                <Button variant="secondary" className="w-full justify-center">
                  Log in
                </Button>
                <Button variant="primary" className="w-full justify-center">
                  Sign up
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
