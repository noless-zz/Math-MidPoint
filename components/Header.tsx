import React from 'react';
import { View } from '../types.ts';
import { DashboardIcon, LearnIcon, PracticeIcon, LeaderboardIcon, LogoutIcon, LogoIcon } from './icons.tsx';
import { design } from '../constants/design_system.ts';

export default function Header({ user, onNavigate, onLogout, currentView }) {
  const navItems = [
    { view: View.Dashboard, label: 'לוח בקרה', icon: DashboardIcon },
    { view: View.Learn, label: 'למידה', icon: LearnIcon },
    { view: View.Practice, label: 'תרגול', icon: PracticeIcon },
    { view: View.Leaderboard, label: 'דירוג', icon: LeaderboardIcon },
  ];

  return (
    <header className={design.header.background}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center gap-2 text-white">
              <LogoIcon className="h-8 w-8" />
              <span className="font-bold text-xl hidden md:block">Midpoint Master</span>
            </div>
            <nav className="hidden md:flex items-baseline space-x-4 mr-10">
              {navItems.map((item) => (
                <button
                  key={item.view}
                  onClick={() => onNavigate(item.view)}
                  className={design.header.navButton(currentView, item.view)}
                  aria-current={currentView === item.view ? 'page' : undefined}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center">
            <div className="text-white text-sm mr-4">
              <span className="font-semibold">{user.username}</span>
            </div>
            <button
              onClick={onLogout}
              className={`flex items-center p-2 rounded-full ${design.colors.text.onPrimaryMuted} hover:bg-${design.colors.primary.light} hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-indigo-600 focus:ring-white`}
              title="התנתקות"
            >
              <LogoutIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      <nav className={`md:hidden bg-indigo-700 dark:bg-gray-700 p-2`}>
        <div className="flex items-center justify-around">
          {navItems.map((item) => (
             <button
                key={item.view}
                onClick={() => onNavigate(item.view)}
                className={design.header.mobileNavButton(currentView, item.view)}
                aria-current={currentView === item.view ? 'page' : undefined}
              >
                <item.icon className="h-5 w-5 mb-1" />
                {item.label}
            </button>
          ))}
        </div>
      </nav>
    </header>
  );
}