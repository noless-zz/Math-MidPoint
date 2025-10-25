import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config.ts';
import { userList } from '../users.tsx';
import { CrownIcon, StarIcon, SleepingIcon } from './icons.tsx';
import { design } from '../constants/design_system.ts';
import { SUBJECTS } from '../types.ts';

const FIRESTORE_COLLECTION = 'scores_aloni_yitzhak_10_4';

interface LeaderboardUser {
    id: string;
    username: string;
    score: number;
    scoresBySubject?: Record<string, number>;
    lastPlayed?: any; // firebase.firestore.Timestamp
}

interface LeaderboardRowProps {
    user: LeaderboardUser;
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

const getStartOfDay = (date: Date): Date => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
};

const getStartOfWeek = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Sunday as start of week
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
};

const TopicLeaderCard = ({ subjectName, leader }) => (
    <div className="w-full bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md text-center border border-gray-200 dark:border-gray-700 flex flex-col justify-between">
        <h4 className="font-bold text-indigo-600 dark:text-indigo-400 truncate h-12 flex items-center justify-center">{subjectName}</h4>
        <div>
            <div className="my-2">
                <CrownIcon className="h-8 w-8 mx-auto text-yellow-400" />
            </div>
            <p className="font-semibold truncate">{leader.username}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{leader.score} נק'</p>
        </div>
    </div>
);

const OverallLeaderCard = ({ title, leader }) => (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg text-center border-2 border-indigo-400 dark:border-indigo-500">
        <h4 className="font-bold text-lg text-indigo-600 dark:text-indigo-400">{title}</h4>
        <div className="my-2">
            <CrownIcon className="h-10 w-10 mx-auto text-yellow-400" />
        </div>
        <p className="font-semibold text-xl truncate">{leader.username}</p>
        <p className="text-md text-gray-500 dark:text-gray-400">{leader.score} נק'</p>
    </div>
);

const TopicLeaders = ({ leaders }) => (
    <div className="mb-12">
        <h3 className="text-2xl font-bold text-right mb-4">מובילי הנושאים</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.values(SUBJECTS).filter(s => s.practice).map(subject => (
                leaders[subject.id] ? 
                <TopicLeaderCard key={subject.id} subjectName={subject.name} leader={leaders[subject.id]} />
                : null
            ))}
        </div>
    </div>
);

export default function Leaderboard({ currentUser }) {
    const [allTimeUsers, setAllTimeUsers] = useState<LeaderboardUser[]>([]);
    const [dailyTopLeader, setDailyTopLeader] = useState<LeaderboardUser | null>(null);
    const [weeklyTopLeader, setWeeklyTopLeader] = useState<LeaderboardUser | null>(null);
    const [topicLeaders, setTopicLeaders] = useState<Record<string, { username: string, score: number }>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const usersCollection = await db.collection(FIRESTORE_COLLECTION).get();
                
                const scoresMap = new Map<string, LeaderboardUser>();
                usersCollection.docs.forEach(doc => {
                    const data = doc.data();
                    scoresMap.set(doc.id, {
                        id: doc.id,
                        username: doc.id,
                        score: data.score || 0,
                        scoresBySubject: data.scoresBySubject || {},
                        lastPlayed: data.lastPlayed || null,
                    });
                });

                const allUsers = userList.map(username => scoresMap.get(username) || {
                    id: username,
                    username: username,
                    score: 0,
                    scoresBySubject: {},
                    lastPlayed: null,
                });

                // All-Time Leaders
                const sortedAllTime = [...allUsers].sort((a, b) => b.score - a.score);
                setAllTimeUsers(sortedAllTime);

                // Time-based Top Leaders
                const todayStart = getStartOfDay(new Date());
                const weekStart = getStartOfWeek(new Date());

                const dailyActiveUsers = allUsers.filter(u => u.lastPlayed && u.lastPlayed.toDate() >= todayStart);
                if (dailyActiveUsers.length > 0) {
                    const sortedDaily = dailyActiveUsers.sort((a,b) => b.score - a.score);
                    setDailyTopLeader(sortedDaily[0]);
                } else {
                    const randomUser = userList[Math.floor(Math.random() * userList.length)];
                    setDailyTopLeader({ id: randomUser, username: randomUser, score: 0, lastPlayed: null });
                }

                const weeklyActiveUsers = allUsers.filter(u => u.lastPlayed && u.lastPlayed.toDate() >= weekStart);
                 if (weeklyActiveUsers.length > 0) {
                    const sortedWeekly = weeklyActiveUsers.sort((a,b) => b.score - a.score);
                    setWeeklyTopLeader(sortedWeekly[0]);
                } else {
                    const randomUser = userList[Math.floor(Math.random() * userList.length)];
                    setWeeklyTopLeader({ id: randomUser, username: randomUser, score: 0, lastPlayed: null });
                }

                // Topic Leaders
                const leadersByTopic: Record<string, { username: string, score: number }> = {};
                const practiceSubjects = Object.values(SUBJECTS).filter(s => s.practice);

                practiceSubjects.forEach(subject => {
                    let topUser: LeaderboardUser | null = null;
                    let maxScore = -1;

                    allUsers.forEach(user => {
                        const userScore = user.scoresBySubject?.[subject.id] || 0;
                        if (userScore > maxScore) {
                            maxScore = userScore;
                            topUser = user;
                        }
                    });

                    if (topUser && maxScore > 0) {
                        leadersByTopic[subject.id] = { username: topUser.username, score: maxScore };
                    } else {
                        const randomUser = userList[Math.floor(Math.random() * userList.length)];
                        leadersByTopic[subject.id] = { username: randomUser, score: 0 };
                    }
                });
                setTopicLeaders(leadersByTopic);

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

    if (allTimeUsers.length === 0 && !loading) {
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                {weeklyTopLeader && <OverallLeaderCard title="המוביל השבועי" leader={weeklyTopLeader} />}
                {dailyTopLeader && <OverallLeaderCard title="המוביל היומי" leader={dailyTopLeader} />}
            </div>

            <TopicLeaders leaders={topicLeaders} />

            <div className="mt-8">
                <h3 className="text-2xl font-bold text-right mb-4">דירוג כללי</h3>
                <div className="space-y-3">
                    {allTimeUsers.map((user, index) => (
                        <LeaderboardRow 
                            key={user.id}
                            user={user}
                            rank={index + 1}
                            isCurrentUser={currentUser && user.id === currentUser.uid}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}