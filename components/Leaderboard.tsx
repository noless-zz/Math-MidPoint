import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config.ts';
import { userList } from '../users.tsx';
import { CrownIcon, StarIcon, SleepingIcon } from './icons.tsx';
import { design } from '../constants/design_system.ts';

const FIRESTORE_COLLECTION = 'scores_aloni_yitzhak_10_4';

interface LeaderboardRowProps {
    user: {
        username: string;
        score: number;
    };
    rank: number;
    isCurrentUser: boolean;
}

const LeaderboardRow: React.FC<LeaderboardRowProps> = ({ user, rank, isCurrentUser }) => {
    const rankColor = (r: number) => {
        if (r === 1) return `text-${design.colors.accent.yellow}`;
        if (r === 2) return `text-gray-400`;
        if (r === 3) return `text-${design.colors.accent.orange}`;
        return 'text-gray-500 dark:text-gray-400';
    };

    return (
        <div className={design.leaderboard.row(isCurrentUser)}>
            <div className="flex items-center w-16">
                <span className={`text-lg font-bold w-8 text-center ${rankColor(rank)}`}>
                    {rank}
                </span>
                {rank <= 3 && <CrownIcon className={`h-5 w-5 ml-1 ${rankColor(rank)}`} />}
            </div>
            <div className="flex-grow font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <span>{user.username}</span>
                {isCurrentUser && <span className={`text-sm font-normal text-${design.colors.primary.DEFAULT} dark:text-indigo-400`}> (את/ה)</span>}
                {user.score === 0 && !isCurrentUser && (
                    <SleepingIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" title="טרם שיחק/ה" />
                )}
            </div>
            <div className={`flex items-center gap-2 text-lg font-bold text-${design.colors.primary.light}`}>
                <span>{user.score}</span>
                <StarIcon className={`h-5 w-5 text-${design.colors.accent.yellow}`} />
            </div>
        </div>
    );
};


export default function Leaderboard({ currentUser }) {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const usersCollection = await db.collection(FIRESTORE_COLLECTION).get();
                
                const scoresMap = new Map<string, number>();
                usersCollection.docs.forEach(doc => {
                    const data = doc.data();
                    scoresMap.set(doc.id, data.score || 0);
                });

                const leaderboardUsers = userList.map(username => ({
                    id: username,
                    username: username,
                    score: scoresMap.get(username) || 0,
                }));

                leaderboardUsers.sort((a, b) => b.score - a.score);

                setUsers(leaderboardUsers);
            } catch (err) {
                console.error("Error fetching leaderboard from Firestore:", err);
                setError('לא ניתן היה לטעון את דירוג המובילים.');
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, []);
    
    if (loading) {
        return (
            <div className="text-center p-10">
                <p className="text-xl font-semibold">טוען דירוג...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`text-center p-10 ${design.colors.feedback.error.bg} ${design.colors.feedback.error.text} rounded-lg`}>
                <p className="text-xl font-semibold">{error}</p>
            </div>
        );
    }

    if (users.length === 0 && !loading) {
         return (
             <div className={design.layout.leaderboard}>
                <h2 className={`${design.typography.pageTitle}`}>לוח המובילים</h2>
                <div className="text-center p-10 bg-white dark:bg-gray-800 rounded-lg">
                    <p className="text-lg text-gray-500 dark:text-gray-400">עדיין אין נתונים להצגה. התחילו לתרגל כדי להופיע בדירוג!</p>
                </div>
            </div>
         );
    }

    return (
        <div className={design.layout.leaderboard}>
            <h2 className={`${design.typography.pageTitle}`}>לוח המובילים</h2>
            
            <div className="space-y-3">
                {users.map((user, index) => (
                    <LeaderboardRow 
                        key={user.id}
                        user={user}
                        rank={index + 1}
                        isCurrentUser={currentUser && user.id === currentUser.uid}
                    />
                ))}
            </div>
        </div>
    );
}