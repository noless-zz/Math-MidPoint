
import React, { useMemo } from 'react';
import type { User } from '../types';
import { CrownIcon } from './icons';

interface LeaderboardProps {
  currentUser: User;
}

// Dummy data for a simulated leaderboard
const dummyUsers: User[] = [
  { name: 'איינשטיין', score: 1250, completedExercises: 125 },
  { name: 'ניוטון', score: 1100, completedExercises: 110 },
  { name: 'פיתגורס', score: 980, completedExercises: 98 },
  { name: 'מרי קירי', score: 850, completedExercises: 82 },
  { name: 'דה וינצ\'י', score: 720, completedExercises: 70 },
  { name: 'גלילאו', score: 500, completedExercises: 45 },
  { name: 'ארכימדס', score: 340, completedExercises: 33 },
];

// Fix: Replaced JSX.Element with React.ReactElement to resolve "Cannot find namespace 'JSX'" error.
export default function Leaderboard({ currentUser }: LeaderboardProps): React.ReactElement {

  const sortedUsers = useMemo(() => {
    const combined = [...dummyUsers, currentUser];
    // Avoid duplicates if user name is in dummy data
    const uniqueUsers = Array.from(new Map(combined.map(u => [u.name, u])).values());
    return uniqueUsers.sort((a, b) => b.score - a.score);
  }, [currentUser]);

  const getRankColor = (rank: number): string => {
    if (rank === 0) return 'bg-amber-400 text-amber-900';
    if (rank === 1) return 'bg-slate-300 text-slate-800';
    if (rank === 2) return 'bg-orange-400 text-orange-900';
    return 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200';
  }

  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg">
      <h2 className="text-4xl font-bold text-center mb-2 text-gray-900 dark:text-white">לוח המובילים</h2>
      <p className="text-center text-gray-500 dark:text-gray-400 mb-8">
        זהו לוח תוצאות מדומה להדגמה.
      </p>
      
      <ul className="space-y-4">
        {sortedUsers.map((user, index) => {
          const isCurrentUser = user.name === currentUser.name;
          return (
            <li
              key={index}
              className={`flex items-center p-4 rounded-lg transition-all ${isCurrentUser ? 'bg-indigo-100 dark:bg-indigo-900/50 ring-2 ring-indigo-500 scale-105' : 'bg-gray-50 dark:bg-gray-700/50'}`}
            >
              <div className="flex items-center gap-4 w-16">
                <span className={`flex items-center justify-center h-8 w-8 rounded-full font-bold text-sm ${getRankColor(index)}`}>
                    {index + 1}
                </span>
                {index === 0 && <CrownIcon className="h-6 w-6 text-amber-500" />}
              </div>
              
              <div className="flex-grow">
                  <p className={`font-bold text-lg ${isCurrentUser ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-800 dark:text-gray-100'}`}>
                    {user.name}
                  </p>
              </div>

              <div className="text-right">
                <p className="font-bold text-indigo-500 dark:text-indigo-400 text-lg">{user.score.toLocaleString()} נק'</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user.completedExercises} תרגילים</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}