import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config.ts';
import { CrownIcon, StarIcon } from './icons.tsx';
import { design } from '../constants/design_system.ts';

const USER_COLLECTION = 'midpointMasterUsers';

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
            <div className="flex-grow font-semibold text-gray-800 dark:text-gray-100">
                {user.username}
                {isCurrentUser && <span className={`text-sm font-normal text-${design.colors.primary.DEFAULT} dark:text-indigo-400`}> (את/ה)</span>}
            </div>
            <div className={`flex items-center gap-2 text-lg font-bold text-${design.colors.primary.light}`}>
                <span>{user.score}</span>
                <StarIcon className={`h-5 w-5 text-${design.colors.accent.yellow}`} />
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
            <div className={`text-center ${design.layout.card} ${design.layout.leaderboard}`}>
                <h2 className={`${design.typography.sectionTitle} mb-4`}>לוח המובילים</h2>
                <p className={`text-lg ${design.colors.text.muted.light} dark:${design.colors.text.muted.dark}`}>
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
            <div className={`text-center p-10 ${design.colors.feedback.error.bg} ${design.colors.feedback.error.text} rounded-lg`}>
                <p className="text-xl font-semibold">{error}</p>
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
                        isCurrentUser={user.id === currentUser.uid}
                    />
                ))}
            </div>
        </div>
    );
}