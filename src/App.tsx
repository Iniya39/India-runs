import React, { useState, useEffect } from 'react';
import { StyleGuide } from './screens/StyleGuide';
import { AuthScreen } from './screens/AuthScreen';
import { RoleSelectionScreen } from './screens/RoleSelectionScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { CandidateProfileBuilderScreen } from './screens/CandidateProfileBuilderScreen';
import { RecruiterCompanySetupScreen } from './screens/RecruiterCompanySetupScreen';

// Firebase Auth & Firestore imports (routed through our fallback proxy)
import { 
  auth, 
  db, 
  onAuthStateChanged, 
  signOut, 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp,
  isDemoMode
} from './firebase';

type ScreenName = 'style-guide' | 'auth' | 'role-selection' | 'candidate-profile-builder' | 'recruiter-company-setup' | 'dashboard';

interface UserSession {
  uid: string;
  name: string;
  email: string;
  role: 'candidate' | 'recruiter' | null;
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('style-guide');
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  // Monitor auth state changes & handle session persistence
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (!userDocSnap.exists()) {
            // New user signed up, but Firestore document doesn't exist yet
            // Let's create a default profile (handleSignupSuccess will also double check/enrich this with displayName)
            const newUser = {
              email: user.email || '',
              displayName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
              createdAt: serverTimestamp(),
              role: null,
              onboardingComplete: false,
            };
            await setDoc(userDocRef, newUser, { merge: true });
            
            setSession({
              uid: user.uid,
              name: newUser.displayName,
              email: newUser.email,
              role: null,
            });
            setCurrentScreen('role-selection');
          } else {
            // Existing user
            const data = userDocSnap.data();
            setSession({
              uid: user.uid,
              name: data.displayName || user.displayName || 'Anonymous',
              email: data.email || user.email || '',
              role: data.role || null,
            });

            if (!data.role) {
              setCurrentScreen('role-selection');
            } else if (!data.onboardingComplete) {
              if (data.role === 'candidate') {
                setCurrentScreen('candidate-profile-builder');
              } else {
                setCurrentScreen('recruiter-company-setup');
              }
            } else {
              setCurrentScreen('dashboard');
            }
          }
        } catch (error) {
          console.error('onAuthStateChanged session fetch error:', error);
        }
      } else {
        setSession(null);
        setCurrentScreen('style-guide');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignupSuccess = async (userData: { name: string; email: string }) => {
    const user = auth.currentUser;
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      const newUser = {
        email: user.email || userData.email,
        displayName: userData.name || user.displayName || 'Anonymous',
        createdAt: serverTimestamp(),
        role: null,
        onboardingComplete: false,
      };
      await setDoc(userDocRef, newUser, { merge: true });
      
      setSession({
        uid: user.uid,
        name: newUser.displayName,
        email: newUser.email,
        role: null,
      });
      setCurrentScreen('role-selection');
    }
  };

  const handleLoginSuccess = async (userData: { email: string }) => {
    const user = auth.currentUser;
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        const newUser = {
          email: user.email || userData.email,
          displayName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
          createdAt: serverTimestamp(),
          role: null,
          onboardingComplete: false,
        };
        await setDoc(userDocRef, newUser);
        setSession({
          uid: user.uid,
          name: newUser.displayName,
          email: newUser.email,
          role: null,
        });
        setCurrentScreen('role-selection');
      } else {
        const data = userDocSnap.data();
        setSession({
          uid: user.uid,
          name: data.displayName || user.displayName || 'Anonymous',
          email: data.email || user.email || '',
          role: data.role || null,
        });
        if (!data.role) {
          setCurrentScreen('role-selection');
        } else if (!data.onboardingComplete) {
          if (data.role === 'candidate') {
            setCurrentScreen('candidate-profile-builder');
          } else {
            setCurrentScreen('recruiter-company-setup');
          }
        } else {
          setCurrentScreen('dashboard');
        }
      }
    }
  };

  const handleRoleSelection = async (selectedRole: 'candidate' | 'recruiter') => {
    if (auth.currentUser) {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userRef, { role: selectedRole, onboardingComplete: false }, { merge: true });
    }
    setSession((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        role: selectedRole
      };
    });

    if (selectedRole === 'candidate') {
      setCurrentScreen('candidate-profile-builder');
    } else {
      setCurrentScreen('recruiter-company-setup');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setSession(null);
    setCurrentScreen('style-guide');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-page-gradient flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-accent-orange" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="font-manrope text-sm text-text-muted font-semibold">Loading your session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {isDemoMode && (
        <div className="bg-[#FFF3CD] border-b border-[#FFEBAA] text-[#856404] px-4 py-2 text-center text-xs font-manrope font-semibold flex items-center justify-center gap-1.5 relative z-50">
          <span className="inline-flex items-center justify-center w-2 h-2 rounded-full bg-[#856404] animate-pulse" />
          Running in Demo Mode (Local Persistent Storage). To sync with Firestore cloud, connect a Firebase project via the Settings tab.
        </div>
      )}
      
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

      {currentScreen === 'role-selection' && session && (
        <RoleSelectionScreen
          userData={session}
          onSelectRole={handleRoleSelection}
          onLogout={handleLogout}
        />
      )}

      {currentScreen === 'candidate-profile-builder' && session && (
        <CandidateProfileBuilderScreen
          userDisplayName={session.name}
          onComplete={async (data) => {
            if (auth.currentUser) {
              const userRef = doc(db, 'users', auth.currentUser.uid);
              await setDoc(userRef, { onboardingComplete: true }, { merge: true });
            }
            setCurrentScreen('dashboard');
          }}
          onSaveAndExit={(data) => {
            setCurrentScreen('dashboard');
          }}
        />
      )}

      {currentScreen === 'recruiter-company-setup' && session && (
        <RecruiterCompanySetupScreen
          onComplete={async (data) => {
            if (auth.currentUser) {
              const userRef = doc(db, 'users', auth.currentUser.uid);
              await setDoc(userRef, { 
                onboardingComplete: true,
                companyProfile: data 
              }, { merge: true });
            }
            setCurrentScreen('dashboard');
          }}
          onSaveAndExit={async (data) => {
            if (auth.currentUser) {
              const userRef = doc(db, 'users', auth.currentUser.uid);
              await setDoc(userRef, { 
                companyProfile: data 
              }, { merge: true });
            }
            setCurrentScreen('dashboard');
          }}
        />
      )}

      {currentScreen === 'dashboard' && session && session.role && (
        <DashboardScreen
          role={session.role}
          userData={session}
          onLogout={handleLogout}
          onNavigateToStyleGuide={() => setCurrentScreen('style-guide')}
          onEditProfile={() => setCurrentScreen('candidate-profile-builder')}
        />
      )}

      {/* Persistent Tiny Screen switcher helper tool in absolute corner for easy review */}
      <div className="fixed bottom-3 right-3 z-50 bg-white/90 backdrop-blur-md border border-border-warm rounded-full px-3 py-1.5 shadow-warm-lg flex items-center gap-2">
        <span className="text-[10px] font-bold text-text-navy font-mono uppercase">Quick Jump:</span>
        <div className="flex gap-1.5">
          {(['style-guide', 'auth', 'role-selection', 'candidate-profile-builder', 'recruiter-company-setup', 'dashboard'] as const).map((scr) => (
            <button
              key={scr}
              onClick={() => {
                if (scr === 'dashboard' && (!session || !session.role)) {
                  // Ensure mock fallback if jumping directly
                  setSession({
                    uid: 'mock-uid',
                    name: 'Demo Builder',
                    email: 'demo@talentsphere.com',
                    role: 'candidate',
                  });
                } else if (scr === 'candidate-profile-builder' && !session) {
                  setSession({
                    uid: 'mock-uid',
                    name: 'Demo Builder',
                    email: 'demo@talentsphere.com',
                    role: 'candidate',
                  });
                } else if (scr === 'recruiter-company-setup' && !session) {
                  setSession({
                    uid: 'mock-uid',
                    name: 'Demo Recruiter',
                    email: 'recruiter@talentsphere.com',
                    role: 'recruiter',
                  });
                } else if (!session) {
                  setSession({
                    uid: 'mock-uid',
                    name: 'Demo Builder',
                    email: 'demo@talentsphere.com',
                    role: null,
                  });
                }
                setCurrentScreen(scr);
              }}
              className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold font-manrope capitalize cursor-pointer transition-all ${
                currentScreen === scr
                  ? 'bg-accent-orange text-white'
                  : 'bg-border-warm/40 text-text-muted hover:text-text-navy hover:bg-border-warm/70'
              }`}
            >
              {scr.replace(/-/g, ' ')}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}

