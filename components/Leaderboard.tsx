import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config.ts';
import { CrownIcon, StarIcon } from './icons.tsx';

const USER_COLLECTION = 'midpointMasterUsers';

const LeaderboardRow = ({ user, rank, isCurrentUser }) => {
    const rankColor = (r) => {
        if (r === 1) return 'text-yellow-400';
        if (r === 2) return 'text-gray-400';
        if (r === 3) return 'text-orange-400';
        return 'text-gray-500 dark:text-gray-400';
    };

    return (
        <div className={`flex items-center p-4 rounded-lg transition-colors ${isCurrentUser ? 'bg-indigo-100 dark:bg-indigo-900/50 border-2 border-indigo-500' : 'bg-white dark:bg-gray-800'}`}>
            <div className="flex items-center w-16">
                <span className={`text-lg font-bold w-8 text-center ${rankColor(rank)}`}>
                    {rank}
                </span>
                {rank <= 3 && <CrownIcon className={`h-5 w-5 ml-1 ${rankColor(rank)}`} />}
            </div>
            <div className="flex-grow font-semibold text-gray-800 dark:text-gray-100">
                {user.username}
                {isCurrentUser && <span className="text-sm font-normal text-indigo-600 dark:text-indigo-400"> (את/ה)</span>}
            </div>
            <div className="flex items-center gap-2 text-lg font-bold text-indigo-500">
                <span>{user.score}</span>
                <StarIcon className="h-5 w-5 text-yellow-500" />
            </div>
        </div>
    );
};


export default function Leaderboard({ currentUser }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                setLoading(true);
                setError(null);
                const usersRef = db.collection(USER_COLLECTION);
                const q = usersRef.orderBy('score', 'desc').limit(50);
                const querySnapshot = await q.get();
                
                const leaderboardUsers = [];
                querySnapshot.forEach((doc) => {
                    leaderboardUsers.push({ id: doc.id, ...doc.data() });
                });
                
                setUsers(leaderboardUsers);
            } catch (err) {
                console.error("Error fetching leaderboard:", err);
                setError('לא ניתן היה לטעון את דירוג המובילים.');
            } finally {
                setLoading(false);
            }
        };

        if (!currentUser.isGuest) {
            fetchLeaderboard();
        } else {
            setUsers([]); // Don't show leaderboard for guests
            setLoading(false);
        }
    }, [currentUser]);
    
    if (currentUser.isGuest) {
        return (
            <div className="text-center bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg max-w-2xl mx-auto">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">לוח המובילים</h2>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                    תכונה זו זמינה רק למשתמשים רשומים. <br/>
                    התחבר עם חשבון גוגל כדי לראות את הדירוג ולהתחרות!
                </p>
            </div>
        );
    }
    
    if (loading) {
        return (
            <div className="text-center p-10">
                <p className="text-xl font-semibold">טוען דירוג...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center p-10 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg">
                <p className="text-xl font-semibold">{error}</p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-8 text-gray-900 dark:text-white">לוח המובילים</h2>
            
            <div className="space-y-3">
                {users.map((user, index) => (
                    <LeaderboardRow 
                        key={user.id}
                        user={user}
                        rank={index + 1}
                        isCurrentUser={user.id === currentUser.uid}
                    />
                ))}
            </div>
        </div>
    );
}