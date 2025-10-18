import React from 'react';
import { useUser } from './hooks/useUser.ts';
import { View } from './types.ts';
import AuthScreen from './components/AuthScreen.tsx';
import Header from './components/Header.tsx';
import Dashboard from './components/Dashboard.tsx';
import LearnSection from './components/LearnSection.tsx';
import PracticeEngine from './components/PracticeEngine.tsx';
import Leaderboard from './components/Leaderboard.tsx';
import { design } from './constants/design_system.ts';

export default function App() {
  const { user, loading, signInWithGoogle, signInAsGuest, logout, updateUser, authError, signInWithEmail, signUpWithEmail } = useUser();
  const [view, setView] = React.useState(View.Dashboard);

  React.useEffect(() => {
    if (authError) {
      if (authError.code === 'auth/operation-not-supported-in-this-environment') {
        console.warn(
          "[Auth Flow] Google Sign-In is not supported in this environment. This is an expected condition, not a critical error. Other login methods remain available."
        );
      } else {
        console.error("An authentication error was caught by the App component:", authError);
      }
    }
  }, [authError]);

  const handleNavigate = React.useCallback((newView) => {
    setView(newView);
  }, []);

  const renderView = () => {
    switch (view) {
      case View.Learn:
        return <LearnSection />;
      case View.Practice:
        return <PracticeEngine updateUser={updateUser} />;
      case View.Leaderboard:
        return <Leaderboard currentUser={user} />;
      case View.Dashboard:
      default:
        return <Dashboard user={user} onNavigate={handleNavigate} />;
    }
  };
  
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center bg-${design.colors.background.light} dark:bg-${design.colors.background.dark}`}>
        <p className="text-xl font-semibold">טוען...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen 
      onSignInWithGoogle={signInWithGoogle} 
      onSignInAsGuest={signInAsGuest} 
      authError={authError} 
      onSignInWithEmail={signInWithEmail}
      onSignUpWithEmail={signUpWithEmail}
    />;
  }

  return (
    <div className={`min-h-screen bg-${design.colors.background.light} dark:bg-${design.colors.background.dark} ${design.typography.fontFamily}`}>
      <Header user={user} onNavigate={handleNavigate} onLogout={logout} currentView={view} />
      <main className={design.layout.mainContainer}>
        {renderView()}
      </main>
    </div>
  );
}