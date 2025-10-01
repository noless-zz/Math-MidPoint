
import React, { useState, useCallback } from 'react';
// Fix: Removed `User` from this import as it's not exported from `useUser`. `User` type is not explicitly needed in this file anyway.
import { useUser } from './hooks/useUser';
import { View } from './types';
import LoginScreen from './components/LoginScreen';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import LearnSection from './components/LearnSection';
import PracticeEngine from './components/PracticeEngine';
import Leaderboard from './components/Leaderboard';

// Fix: Replaced JSX.Element with React.ReactElement to resolve "Cannot find namespace 'JSX'" error.
export default function App(): React.ReactElement {
  const { user, login, logout, updateUser } = useUser();
  const [view, setView] = useState<View>(View.Dashboard);

  const handleLogin = (name: string): void => {
    login(name);
    setView(View.Dashboard);
  };

  const handleLogout = (): void => {
    logout();
  };

  const handleNavigate = useCallback((newView: View) => {
    setView(newView);
  }, []);

  // Fix: Replaced JSX.Element with React.ReactElement to resolve "Cannot find namespace 'JSX'" error.
  const renderView = (): React.ReactElement => {
    switch (view) {
      case View.Learn:
        return <LearnSection />;
      case View.Practice:
        return <PracticeEngine user={user!} updateUser={updateUser} />;
      case View.Leaderboard:
        return <Leaderboard currentUser={user!} />;
      case View.Dashboard:
      default:
        return <Dashboard user={user!} onNavigate={handleNavigate} />;
    }
  };

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 font-sans">
      <Header user={user} onNavigate={handleNavigate} onLogout={handleLogout} currentView={view} />
      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {renderView()}
      </main>
    </div>
  );
}