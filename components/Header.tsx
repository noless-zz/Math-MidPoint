import React from 'react';
import { View as ViewEnum } from '../types.ts';
import { LogoIcon, DashboardIcon, LearnIcon, PracticeIcon, LeaderboardIcon, LogoutIcon } from './icons.tsx';

const NavItem = ({ Icon, label, isActive, onClick }) => {
    const activeClasses = 'bg-indigo-600 text-white';
    const inactiveClasses = 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700';
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors duration-200 ${isActive ? activeClasses : inactiveClasses}`}
        >
            <Icon className="h-5 w-5" />
            <span className="font-medium">{label}</span>
        </button>
    );
};


// Fix: Replaced JSX.Element with React.ReactElement to resolve "Cannot find namespace 'JSX'" error.
export default function Header({ user, onNavigate, onLogout, currentView }) {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-4">
             <LogoIcon className="h-10 w-10 text-indigo-500" />
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">מרכז תירגול</h1>
            </div>
          </div>
          
          <nav className="flex items-center gap-2 sm:gap-4">
              <NavItem Icon={DashboardIcon} label="ראשי" isActive={currentView === ViewEnum.Dashboard} onClick={() => onNavigate(ViewEnum.Dashboard)} />
              <NavItem Icon={LearnIcon} label="למידה" isActive={currentView === ViewEnum.Learn} onClick={() => onNavigate(ViewEnum.Learn)} />
              <NavItem Icon={PracticeIcon} label="תרגול" isActive={currentView === ViewEnum.Practice} onClick={() => onNavigate(ViewEnum.Practice)} />
              <NavItem Icon={LeaderboardIcon} label="דירוג" isActive={currentView === ViewEnum.Leaderboard} onClick={() => onNavigate(ViewEnum.Leaderboard)} />
          </nav>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="font-semibold text-gray-900 dark:text-white">{user.username}</div>
              <div className="text-sm text-indigo-500 font-bold">{user.score} נקודות</div>
            </div>
            <button onClick={onLogout} title="התנתק" className="p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-gray-300 transition-colors">
              <LogoutIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}