import React, { useState } from 'react';
import { StyleGuide } from './screens/StyleGuide';
import { AuthScreen } from './screens/AuthScreen';
import { RoleSelectionScreen } from './screens/RoleSelectionScreen';
import { DashboardScreen } from './screens/DashboardScreen';

type ScreenName = 'style-guide' | 'auth' | 'role-selection' | 'dashboard';

interface UserSession {
  name: string;
  email: string;
  role: 'candidate' | 'recruiter';
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('style-guide');
  
  // Track mock auth & session details
  const [session, setSession] = useState<UserSession>({
    name: 'Demo Builder',
    email: 'demo@talentsphere.com',
    role: 'candidate'
  });

  const handleSignupSuccess = (userData: { name: string; email: string }) => {
    setSession({
      name: userData.name,
      email: userData.email,
      role: 'candidate' // Default role to candidate initially
    });
    // On signup: always proceed to role selection screen first
    setCurrentScreen('role-selection');
  };

  const handleLoginSuccess = (userData: { email: string }) => {
    // If logging in as demo, give prefilled values
    const isDemo = userData.email.toLowerCase() === 'demo@talentsphere.com';
    setSession({
      name: isDemo ? 'Demo Builder' : userData.email.split('@')[0],
      email: userData.email,
      role: 'candidate' // Keep existing or default to candidate
    });
    // On login: direct routing straight to dashboard
    setCurrentScreen('dashboard');
  };

  const handleRoleSelection = (selectedRole: 'candidate' | 'recruiter') => {
    setSession((prev) => ({
      ...prev,
      role: selectedRole
    }));
    // Proceed to final customized dashboard
    setCurrentScreen('dashboard');
  };

  const handleLogout = () => {
    // Return to landing page style guide for review
    setCurrentScreen('style-guide');
  };

  return (
    <div className="min-h-screen">
      
      {/* Dynamic Screen Routing Coordinator */}
      {currentScreen === 'style-guide' && (
        <StyleGuide onNavigateToAuth={() => setCurrentScreen('auth')} />
      )}

      {currentScreen === 'auth' && (
        <AuthScreen
          onSuccessSignup={handleSignupSuccess}
          onSuccessLogin={handleLoginSuccess}
          onBackToLanding={() => setCurrentScreen('style-guide')}
        />
      )}

      {currentScreen === 'role-selection' && (
        <RoleSelectionScreen
          userData={session}
          onSelectRole={handleRoleSelection}
          onLogout={handleLogout}
        />
      )}

      {currentScreen === 'dashboard' && (
        <DashboardScreen
          role={session.role}
          userData={session}
          onLogout={handleLogout}
          onNavigateToStyleGuide={() => setCurrentScreen('style-guide')}
        />
      )}

      {/* Persistent Tiny Screen switcher helper tool in absolute corner for easy review */}
      <div className="fixed bottom-3 right-3 z-50 bg-white/90 backdrop-blur-md border border-border-warm rounded-full px-3 py-1.5 shadow-warm-lg flex items-center gap-2">
        <span className="text-[10px] font-bold text-text-navy font-mono uppercase">Quick Jump:</span>
        <div className="flex gap-1.5">
          {(['style-guide', 'auth', 'role-selection', 'dashboard'] as const).map((scr) => (
            <button
              key={scr}
              onClick={() => {
                if (scr === 'dashboard' && !session.role) {
                  // Ensure default role is set if they bypass role-selection
                  setSession(prev => ({ ...prev, role: 'candidate' }));
                }
                setCurrentScreen(scr);
              }}
              className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold font-manrope capitalize cursor-pointer transition-all ${
                currentScreen === scr
                  ? 'bg-accent-orange text-white'
                  : 'bg-border-warm/40 text-text-muted hover:text-text-navy hover:bg-border-warm/70'
              }`}
            >
              {scr.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
