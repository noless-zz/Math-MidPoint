
import React from 'react';
import { useUser } from './hooks/useUser.ts';
import { View } from './types.ts';
import AuthScreen from './components/AuthScreen.tsx'; // Changed from LoginScreen
import Header from './components/Header.tsx';
import Dashboard from './components/Dashboard.tsx';
import LearnSection from './components/LearnSection.tsx';
import PracticeEngine from './components/PracticeEngine.tsx';
import Leaderboard from './components/Leaderboard.tsx';

export default function App() {
  // useUser now returns loading state and auth functions
  const { user, loading, signUp, login, logout, updateUser } = useUser();
  const [view, setView] = React.useState(View.Dashboard);

  const handleNavigate = React.useCallback((newView) => {
    setView(newView);
  }, []);

  const renderView = () => {
    // User is guaranteed to be non-null here
    switch (view) {
      case View.Learn:
        return <LearnSection />;
      case View.Practice:
        // FIX: Removed unused `user` prop from PracticeEngine to resolve TypeScript error. The component only expects `updateUser`.
        return <PracticeEngine updateUser={updateUser} />;
      case View.Leaderboard:
        return <Leaderboard currentUser={user} />;
      case View.Dashboard:
      default:
        return <Dashboard user={user} onNavigate={handleNavigate} />;
    }
  };
  
  // Handle initial loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-xl font-semibold">טוען...</p>
      </div>
    );
  }

  // If not loading and no user, show Auth screen
  if (!user) {
    return <AuthScreen onLogin={login} onSignUp={signUp} />;
  }

  // If logged in, show the main app
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 font-sans">
      <Header user={user} onNavigate={handleNavigate} onLogout={logout} currentView={view} />
      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {renderView()}
      </main>
    </div>
  );
}