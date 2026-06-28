import React, { useState, useEffect } from 'react';
import { StyleGuide } from './screens/StyleGuide';
import { AuthScreen } from './screens/AuthScreen';
import { RoleSelectionScreen } from './screens/RoleSelectionScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { CandidateProfileBuilderScreen } from './screens/CandidateProfileBuilderScreen';
import { RecruiterCompanySetupScreen } from './screens/RecruiterCompanySetupScreen';

import { 
  auth, 
  db, 
  onAuthStateChanged, 
  signOut, 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp,
  isConfigValid
} from './supabase';

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
  const [selectedRoleFromLanding, setSelectedRoleFromLanding] = useState<'candidate' | 'recruiter' | null>(null);

  // Monitor auth state changes & handle session persistence
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (!userDocSnap.exists()) {
            const chosenRole = selectedRoleFromLanding;
            const newUser = {
              email: user.email || '',
              displayName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
              createdAt: serverTimestamp(),
              role: chosenRole,
              onboardingComplete: false,
            };
            await setDoc(userDocRef, newUser, { merge: true });
            
            setSession({
              uid: user.uid,
              name: newUser.displayName,
              email: newUser.email,
              role: chosenRole,
            });
            if (chosenRole) {
              setCurrentScreen(chosenRole === 'candidate' ? 'candidate-profile-builder' : 'recruiter-company-setup');
            } else {
              setCurrentScreen('role-selection');
            }
          } else {
            // Existing user
            const data = userDocSnap.data();
            let role = data.role;
            if (!role && selectedRoleFromLanding) {
              await setDoc(userDocRef, { role: selectedRoleFromLanding }, { merge: true });
              role = selectedRoleFromLanding;
            }

            setSession({
              uid: user.uid,
              name: data.displayName || user.displayName || 'Anonymous',
              email: data.email || user.email || '',
              role: role || null,
            });

            if (!role) {
              setCurrentScreen('role-selection');
            } else if (!data.onboardingComplete) {
              if (role === 'candidate') {
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
  }, [selectedRoleFromLanding]);

  const handleSignupSuccess = async (userData: { name: string; email: string }) => {
    const user = auth.currentUser;
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      const chosenRole = selectedRoleFromLanding;
      const newUser = {
        email: user.email || userData.email,
        displayName: userData.name || user.displayName || 'Anonymous',
        createdAt: serverTimestamp(),
        role: chosenRole,
        onboardingComplete: false,
      };
      await setDoc(userDocRef, newUser, { merge: true });
      
      setSession({
        uid: user.uid,
        name: newUser.displayName,
        email: newUser.email,
        role: chosenRole,
      });
      if (chosenRole) {
        setCurrentScreen(chosenRole === 'candidate' ? 'candidate-profile-builder' : 'recruiter-company-setup');
      } else {
        setCurrentScreen('role-selection');
      }
    }
  };

  const handleLoginSuccess = async (userData: { email: string }) => {
    const user = auth.currentUser;
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        const chosenRole = selectedRoleFromLanding;
        const newUser = {
          email: user.email || userData.email,
          displayName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
          createdAt: serverTimestamp(),
          role: chosenRole,
          onboardingComplete: false,
        };
        await setDoc(userDocRef, newUser);
        setSession({
          uid: user.uid,
          name: newUser.displayName,
          email: newUser.email,
          role: chosenRole,
        });
        if (chosenRole) {
          setCurrentScreen(chosenRole === 'candidate' ? 'candidate-profile-builder' : 'recruiter-company-setup');
        } else {
          setCurrentScreen('role-selection');
        }
      } else {
        const data = userDocSnap.data();
        let role = data.role;
        if (!role && selectedRoleFromLanding) {
          await setDoc(userDocRef, { role: selectedRoleFromLanding }, { merge: true });
          role = selectedRoleFromLanding;
        }

        setSession({
          uid: user.uid,
          name: data.displayName || user.displayName || 'Anonymous',
          email: data.email || user.email || '',
          role: role || null,
        });
        if (!role) {
          setCurrentScreen('role-selection');
        } else if (!data.onboardingComplete) {
          if (role === 'candidate') {
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
    setSelectedRoleFromLanding(null);
    setCurrentScreen('style-guide');
  };

  if (!isConfigValid) {
    return (
      <div className="min-h-screen bg-[#0D0E12] flex items-center justify-center p-4 font-manrope">
        <div className="max-w-md w-full bg-[#161820]/80 backdrop-blur-xl border border-[#2B2E3D] rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-center relative overflow-hidden">
          {/* Decorative background glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#FF6B6B]/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[#FFD93D]/10 rounded-full blur-3xl" />
          
          <div className="w-16 h-16 rounded-2xl bg-[#FF6B6B]/10 border border-[#FF6B6B]/20 flex items-center justify-center text-[#FF6B6B] mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          
          <h2 className="font-sora font-extrabold text-[#F8F9FA] text-2xl tracking-tight">Configuration Setup Required</h2>
          <p className="text-sm text-[#A0A5B5] mt-3 leading-relaxed">
            TalentSphere requires active Firebase and Supabase database parameters to run. Local storage fallback mode is disabled.
          </p>
          
          <div className="mt-6 text-left bg-[#1F212E] border border-[#2D3042] rounded-2xl p-4.5 space-y-3">
            <h4 className="text-xs font-bold text-[#F8F9FA] uppercase tracking-wider">Required Environment Variables:</h4>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-[#A0A5B5]">VITE_FIREBASE_API_KEY</span>
                {import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_API_KEY !== "AIzaSyFakeKeyPlaceholderForAppToBuild" ? (
                  <span className="text-[#51CF66] font-bold">✓ Configured</span>
                ) : (
                  <span className="text-[#FF6B6B] font-bold">✗ Missing / Placeholder</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#A0A5B5]">VITE_SUPABASE_URL</span>
                {import.meta.env.VITE_SUPABASE_URL ? (
                  <span className="text-[#51CF66] font-bold">✓ Configured</span>
                ) : (
                  <span className="text-[#FF6B6B] font-bold">✗ Missing</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#A0A5B5]">VITE_SUPABASE_ANON_KEY</span>
                {import.meta.env.VITE_SUPABASE_ANON_KEY ? (
                  <span className="text-[#51CF66] font-bold">✓ Configured</span>
                ) : (
                  <span className="text-[#FF6B6B] font-bold">✗ Missing</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-5 border-t border-[#2D3042]/50 text-xs text-[#A0A5B5] leading-relaxed">
            Please define these keys in your local <code className="text-[#FFD93D] font-mono">.env</code> file at the root of the workspace directory, then restart your development server.
          </div>
        </div>
      </div>
    );
  }

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
      
      {/* Dynamic Screen Routing Coordinator */}
      {currentScreen === 'style-guide' && (
        <StyleGuide onSelectRole={(role) => {
          setSelectedRoleFromLanding(role);
          setCurrentScreen('auth');
        }} />
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
                companyId: data.id 
              }, { merge: true });
            }
            setCurrentScreen('dashboard');
          }}
          onSaveAndExit={async (data) => {
            if (auth.currentUser) {
              const userRef = doc(db, 'users', auth.currentUser.uid);
              await setDoc(userRef, { 
                companyId: data.id 
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
          onEditCompany={() => setCurrentScreen('recruiter-company-setup')}
        />
      )}


    </div>
  );
}

