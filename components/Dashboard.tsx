import React from 'react';
import { View } from '../types.ts';
import { LearnIcon, PracticeIcon, LeaderboardIcon, StarIcon } from './icons.tsx';

const StatCard = ({ label, value, icon: Icon, colorClass }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md flex items-center space-x-4">
    <div className={`p-3 rounded-full ${colorClass}`}>
      <Icon className="h-8 w-8 text-white" />
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  </div>
);

const ActionCard = ({ title, description, icon: Icon, onClick, buttonText, colorClass }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md flex flex-col items-start h-full">
        <div className="flex items-center gap-4 mb-4">
            <div className={`p-3 rounded-full ${colorClass}`}>
                <Icon className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mb-6 flex-grow">{description}</p>
        <button 
            onClick={onClick}
            className={`w-full ${colorClass} text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105`}
        >
            {buttonText}
        </button>
    </div>
);

export default function Dashboard({ user, onNavigate }) {
  return (
    <div className="space-y-8">
      <div className="bg-indigo-500 dark:bg-gray-800 text-white p-8 rounded-2xl shadow-lg">
        <h1 className="text-4xl font-bold">,שלום {user.username}</h1>
        <p className="mt-2 text-indigo-200 text-lg">מוכנ/ה לשלוט באמנות מציאת נקודות האמצע?</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard 
            label="ניקוד כולל" 
            value={user.score} 
            icon={StarIcon}
            colorClass="bg-yellow-500"
        />
        <StatCard 
            label="תרגילים שהושלמו" 
            value={user.completedExercises} 
            icon={PracticeIcon}
            colorClass="bg-green-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ActionCard 
            title="למידה"
            description="רענן/י את הזיכרון על הנוסחאות וראה/י דוגמאות אינטראקטיביות."
            icon={LearnIcon}
            onClick={() => onNavigate(View.Learn)}
            buttonText="בוא/י נלמד"
            colorClass="bg-blue-500 hover:bg-blue-600"
          />
          <ActionCard 
            title="תרגול"
            description="העמד/י את הידע שלך במבחן עם מגוון תרגילים מאתגרים."
            icon={PracticeIcon}
            onClick={() => onNavigate(View.Practice)}
            buttonText="נתחיל לתרגל"
            colorClass="bg-teal-500 hover:bg-teal-600"
          />
          <ActionCard 
            title="לוח המובילים"
            description="ראה/י איך את/ה מול אחרים ושאפ/י להגיע לפסגה!"
            icon={LeaderboardIcon}
            onClick={() => onNavigate(View.Leaderboard)}
            buttonText="צפה/י בדירוג"
            colorClass="bg-purple-500 hover:bg-purple-600"
          />
      </div>
    </div>
  );
}
