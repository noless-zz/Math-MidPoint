import React from 'react';
import { View } from '../types.ts';
import { LearnIcon, PracticeIcon, LeaderboardIcon, StarIcon } from './icons.tsx';
import { design } from '../constants/design_system.ts';

const StatCard = ({ label, value, icon: Icon, colorClass }) => (
  <div className={`bg-white dark:bg-gray-800 p-6 rounded-xl ${design.effects.shadowMd} flex items-center space-x-4`}>
    <div className={`p-3 rounded-full bg-${colorClass}`}>
      <Icon className="h-8 w-8 text-white" />
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`text-2xl font-bold ${design.typography.baseText}`}>{value}</p>
    </div>
  </div>
);

const ActionCard = ({ title, description, icon: Icon, onClick, buttonText, colorClass }) => (
    <div className={`bg-white dark:bg-gray-800 p-6 rounded-xl ${design.effects.shadowMd} flex flex-col items-start h-full`}>
        <div className="flex items-center gap-4 mb-4">
            <div className={`p-3 rounded-full bg-${colorClass}`}>
                <Icon className="h-6 w-6 text-white" />
            </div>
            <h3 className={design.typography.cardTitle}>{title}</h3>
        </div>
        <p className={`text-gray-600 dark:text-gray-300 mb-6 flex-grow`}>{description}</p>
        <button 
            onClick={onClick}
            className={`w-full bg-${colorClass} hover:bg-${colorClass.replace('-500', '-600')} ${design.components.button.base.replace('py-3', 'py-3')} text-white ${design.effects.transition} ${design.effects.transformHover}`}
        >
            {buttonText}
        </button>
    </div>
);

export default function Dashboard({ user, onNavigate }) {
  return (
    <div className="space-y-8">
      <div className={`bg-${design.colors.primary.light} dark:bg-gray-800 text-white p-8 rounded-2xl ${design.effects.shadow}`}>
        <h1 className="text-4xl font-bold">,שלום {user.username}</h1>
        <p className={`mt-2 text-indigo-200 text-lg`}>מוכנ/ה לשלוט באמנות מציאת נקודות האמצע?</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard 
            label="ניקוד כולל" 
            value={user.score} 
            icon={StarIcon}
            colorClass={design.colors.accent.yellow}
        />
        <StatCard 
            label="תרגילים שהושלמו" 
            value={user.completedExercises} 
            icon={PracticeIcon}
            colorClass={design.colors.accent.green}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ActionCard 
            title="למידה"
            description="רענן/י את הזיכרון על הנוסחאות וראה/י דוגמאות אינטראקטיביות."
            icon={LearnIcon}
            onClick={() => onNavigate(View.Learn)}
            buttonText="בוא/י נלמד"
            colorClass={design.colors.accent.blue}
          />
          <ActionCard 
            title="תרגול"
            description="העמד/י את הידע שלך במבחן עם מגוון תרגילים מאתגרים."
            icon={PracticeIcon}
            onClick={() => onNavigate(View.Practice)}
            buttonText="נתחיל לתרגל"
            colorClass={design.colors.accent.teal}
          />
          <ActionCard 
            title="לוח המובילים"
            description="ראה/י איך את/ה מול אחרים ושאפ/י להגיע לפסגה!"
            icon={LeaderboardIcon}
            onClick={() => onNavigate(View.Leaderboard)}
            buttonText="צפה/י בדירוג"
            colorClass={design.colors.accent.purple}
          />
      </div>
    </div>
  );
}