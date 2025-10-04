
import React from 'react';
import { useUser } from './hooks/useUser.js';
import { View } from './types.js';
import AuthScreen from './components/AuthScreen.jsx'; // Changed from LoginScreen
import Header from './components/Header.jsx';
import Dashboard from './components/Dashboard.jsx';
import LearnSection from './components/LearnSection.jsx';
import PracticeEngine from './components/PracticeEngine.jsx';
import Leaderboard from './components/Leaderboard.jsx';

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