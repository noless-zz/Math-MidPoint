import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, query, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import type { User } from '../types';
import { CrownIcon } from './icons';

interface LeaderboardProps {
  currentUser: User;
}

export default function Leaderboard({ currentUser }: LeaderboardProps): React.ReactElement {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, orderBy('score', 'desc'), limit(10));
        const querySnapshot = await getDocs(q);
        const fetchedUsers: User[] = [];
        querySnapshot.forEach((doc) => {
          fetchedUsers.push({ uid: doc.id, ...doc.data() } as User);
        });

        const currentUserInList = fetchedUsers.some(u => u.uid === currentUser.uid);
        if (!currentUserInList && currentUser) {
            const userDocRef = doc(db, "users", currentUser.uid);
            const userDocSnap = await getDoc(userDocRef);
            
            if(userDocSnap.exists()) {
              fetchedUsers.push({ uid: currentUser.uid, ...userDocSnap.data() } as User);
            }
        }
        
        setUsers(fetchedUsers.sort((a,b) => b.score - a.score));
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentUser]);

  const getRankColor = (rank: number): string => {
    if (rank === 0) return 'bg-amber-400 text-amber-900';
    if (rank === 1) return 'bg-slate-300 text-slate-800';
    if (rank === 2) return 'bg-orange-400 text-orange-900';
    return 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200';
  }

  if (loading) {
      return <div className="text-center p-10">טוען דירוג...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg">
      <h2 className="text-4xl font-bold text-center mb-2 text-gray-900 dark:text-white">לוח המובילים</h2>
      <p className="text-center text-gray-500 dark:text-gray-400 mb-8">
        10 השחקנים המובילים. האם אתה ביניהם?
      </p>
      
      <ul className="space-y-4">
        {users.map((user, index) => {
          const isCurrentUser = user.uid === currentUser.uid;
          return (
            <li
              key={user.uid}
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
                    {user.username}
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