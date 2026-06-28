import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Sun, Moon, Menu, X, Globe, HelpCircle, LogOut, User as UserIcon, Settings as SettingsIcon, ChevronDown } from 'lucide-react';
import { Button } from './Button';
import { Avatar } from './Avatar';

export interface NavLinkItem {
  label: string;
  href: string;
  active?: boolean;
  onClick?: () => void;
}

export interface NavBarProps {
  links?: NavLinkItem[];
  activeTheme?: 'light' | 'dark';
  onThemeToggle?: () => void;
  user?: { name?: string; email: string; avatarUrl?: string } | null;
  onLogout?: () => void;
  onNavigateToScreen?: (screen: string) => void;
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
}

export const NavBar: React.FC<NavBarProps> = ({
  links,
  user = null,
  onLogout,
  onProfileClick,
  onSettingsClick,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Default guest links
  const defaultGuestLinks: NavLinkItem[] = [
    { label: 'Talent Pool', href: '#pool' },
    { label: 'AI Matchmaker', href: '#match' },
    { label: 'Reverse Hiring', href: '#reverse' },
    { label: 'Pricing', href: '#pricing' },
  ];

  const displayLinks = links || defaultGuestLinks;

  const handleLogoutClick = () => {
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
    if (onLogout) onLogout();
  };

  const handleProfileClick = () => {
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
    if (onProfileClick) onProfileClick();
  };

  const handleSettingsClick = () => {
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
    if (onSettingsClick) onSettingsClick();
  };

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
            {displayLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => {
                  if (link.onClick) {
                    e.preventDefault();
                    link.onClick();
                  }
                }}
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

          {/* Action Buttons / User Profile */}
          <div className="hidden md:flex items-center gap-3">
            {/* Theme Toggle Icon (Visual showcase) */}
            <motion.button
              whileTap={{ rotate: 45, scale: 0.9 }}
              onClick={() => setIsDark(!isDark)}
              className="p-2.5 rounded-full border border-border-warm bg-white text-text-muted hover:text-text-navy hover:shadow-warm-sm transition-all duration-200 cursor-pointer mr-1"
              title="Toggle theme visual placeholder"
            >
              {isDark ? (
                <Moon className="w-5 h-5 text-accent-purple" />
              ) : (
                <Sun className="w-5 h-5 text-accent-orange" />
              )}
            </motion.button>

            {user ? (
              /* Authenticated User Dropdown */
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-full hover:bg-border-warm/30 transition-all duration-200 cursor-pointer border border-border-warm/40 bg-surface"
                >
                  <Avatar
                    src={user.avatarUrl}
                    alt={user.name || user.email || 'Anonymous'}
                    size="sm"
                    className="w-8 h-8 ring-0 shadow-none"
                  />
                  <span className="text-xs font-semibold text-text-navy font-manrope pr-1 max-w-[120px] truncate">
                    {user.name || user.email?.split('@')[0]}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-text-muted transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-52 bg-white rounded-2xl border border-border-warm shadow-warm-lg py-2.5 z-50 overflow-hidden"
                    >
                      <div className="px-4 py-2 border-b border-border-warm/40 mb-1.5">
                        <p className="text-xs font-bold text-text-navy truncate">{user.name || 'Anonymous'}</p>
                        <p className="text-[10px] text-text-muted truncate mt-0.5">{user.email}</p>
                      </div>

                      <button
                        onClick={handleProfileClick}
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-text-navy hover:bg-orange-50/30 hover:text-accent-orange transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <UserIcon className="w-4 h-4 text-text-muted" />
                        My Profile
                      </button>

                      <button
                        onClick={handleSettingsClick}
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-text-navy hover:bg-orange-50/30 hover:text-accent-orange transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <SettingsIcon className="w-4 h-4 text-text-muted" />
                        Settings
                      </button>

                      <div className="border-t border-border-warm/40 my-1.5"></div>

                      <button
                        onClick={handleLogoutClick}
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        Log out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              /* Guest Actions */
              <>
                <Button variant="secondary" className="px-5 py-2 text-sm">
                  Log in
                </Button>
                <Button variant="primary" className="px-5 py-2 text-sm shadow-warm-sm">
                  Sign up
                </Button>
              </>
            )}
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
              {displayLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => {
                    setIsMobileMenuOpen(false);
                    if (link.onClick) {
                      e.preventDefault();
                      link.onClick();
                    }
                  }}
                  className={`block px-4 py-2.5 rounded-xl text-base font-semibold font-manrope ${
                    link.active
                      ? 'bg-accent-orange/10 text-accent-orange'
                      : 'text-text-muted hover:bg-border-warm/20 hover:text-text-navy'
                  }`}
                >
                  {link.label}
                </a>
              ))}
              
              {user ? (
                /* Authenticated Mobile Section */
                <div className="pt-4 border-t border-border-warm/60 flex flex-col gap-2">
                  <div className="px-4 py-1.5 flex items-center gap-2">
                    <Avatar
                      src={user.avatarUrl}
                      alt={user.name || user.email || 'Anonymous'}
                      size="sm"
                      className="w-10 h-10 ring-0"
                    />
                    <div>
                      <p className="text-sm font-bold text-text-navy">{user.name || 'Anonymous'}</p>
                      <p className="text-[11px] text-text-muted truncate max-w-[200px]">{user.email}</p>
                    </div>
                  </div>
                  <Button variant="secondary" className="w-full justify-start gap-2 text-sm font-semibold" onClick={handleProfileClick}>
                    <UserIcon className="w-4 h-4 text-text-muted" />
                    My Profile
                  </Button>
                  <Button variant="secondary" className="w-full justify-start gap-2 text-sm font-semibold" onClick={handleSettingsClick}>
                    <SettingsIcon className="w-4 h-4 text-text-muted" />
                    Settings
                  </Button>
                  <Button variant="secondary" className="w-full justify-start gap-2 text-sm font-semibold text-red-600 hover:bg-red-50" onClick={handleLogoutClick}>
                    <LogOut className="w-4 h-4" />
                    Log out
                  </Button>
                </div>
              ) : (
                /* Guest Mobile Actions */
                <div className="pt-4 border-t border-border-warm/60 flex flex-col gap-2">
                  <Button variant="secondary" className="w-full justify-center">
                    Log in
                  </Button>
                  <Button variant="primary" className="w-full justify-center">
                    Sign up
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

