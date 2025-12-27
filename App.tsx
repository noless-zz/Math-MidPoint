import React from 'react';
import { useUser } from './hooks/useUser.ts';
import { View } from './types.ts';
import LoginScreen from './components/LoginScreen.tsx';
import Header from './components/Header.tsx';
import Dashboard from './components/Dashboard.tsx';
import LearnSection from './components/LearnSection.tsx';
import PracticeEngine from './components/PracticeEngine.tsx';
import Leaderboard from './components/Leaderboard.tsx';
import { design } from './constants/design_system.ts';

export default function App() {
  const { user, loading, login, logout, updateUser, loginAsGuest } = useUser();
  const [view, setView] = React.useState(View.Dashboard);

  const handleNavigate = React.useCallback((newView) => {
    setView(newView);
  }, []);

  const renderView = () => {
    switch (view) {
      case View.Learn:
        return <LearnSection />;
      case View.Practice:
        return <PracticeEngine user={user} updateUser={updateUser} />;
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
    return <LoginScreen onLogin={login} onLoginAsGuest={loginAsGuest} />;
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