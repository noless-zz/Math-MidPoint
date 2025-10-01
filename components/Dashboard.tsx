
import React from 'react';
import type { User, View } from '../types';
import { View as ViewEnum } from '../types';
import { LearnIcon, PracticeIcon, LeaderboardIcon, StarIcon } from './icons';

interface DashboardProps {
  user: User;
  onNavigate: (view: View) => void;
}

const StatCard: React.FC<{ Icon: React.ElementType; label: string; value: string | number; color: string }> = ({ Icon, label, value, color }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md flex items-center gap-4">
        <div className={`p-3 rounded-full ${color}`}>
            <Icon className="h-7 w-7 text-white" />
        </div>
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
    </div>
);

const ActionCard: React.FC<{ Icon: React.ElementType; title: string; description: string; buttonText: string; onClick: () => void, color: string }> = ({ Icon, title, description, buttonText, onClick, color }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md flex flex-col items-start gap-4 transition-transform transform hover:-translate-y-1">
        <div className={`p-3 rounded-full ${color}`}>
            <Icon className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
        <p className="text-gray-600 dark:text-gray-300 flex-grow">{description}</p>
        <button onClick={onClick} className={`w-full mt-2 ${color} text-white font-bold py-2 px-4 rounded-lg transition-opacity hover:opacity-90`}>
            {buttonText}
        </button>
    </div>
);


// Fix: Replaced JSX.Element with React.ReactElement to resolve "Cannot find namespace 'JSX'" error.
export default function Dashboard({ user, onNavigate }: DashboardProps): React.ReactElement {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">שלום, {user.name}!</h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">מוכן להפוך לאשף בנקודות אמצע?</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatCard Icon={StarIcon} label="ניקוד כולל" value={user.score} color="bg-indigo-500" />
          <StatCard Icon={PracticeIcon} label="תרגילים שהושלמו" value={user.completedExercises} color="bg-green-500" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ActionCard
            Icon={LearnIcon}
            title="מרכז למידה"
            description="רענן את הידע שלך על הנוסחה למציאת נקודת אמצע קטע."
            buttonText="מעבר ללמידה"
            onClick={() => onNavigate(ViewEnum.Learn)}
            color="bg-blue-500"
        />
        <ActionCard
            Icon={PracticeIcon}
            title="מגרש תרגול"
            description="הגיע הזמן לבחון את היכולות שלך עם תרגילים דינמיים."
            buttonText="התחל לתרגל"
            onClick={() => onNavigate(ViewEnum.Practice)}
            color="bg-indigo-500"
        />
        <ActionCard
            Icon={LeaderboardIcon}
            title="לוח המובילים"
            description="ראה איך אתה ממוקם ביחס לשאר התלמידים."
            buttonText="צפה בדירוג"
            onClick={() => onNavigate(ViewEnum.Leaderboard)}
            color="bg-amber-500"
        />
      </div>
    </div>
  );
}