import { useState, useEffect, useCallback } from 'react';
import { db, firebase } from '../firebase/config.ts';

const CURRENT_USER_KEY = 'midpointMasterCurrentUser';
const FIRESTORE_COLLECTION = 'scores_aloni_yitzhak_10_4';

// --- Helper Functions ---
const getStartOfWeek = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // MONDAY start
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
};

const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}


// --- Type Definitions ---
interface UserStats {
  periodId: string; // YYYY-MM-DD for daily, or date of start of week for weekly
  score: number;
  scoresBySubject: Record<string, number>;
}

interface User {
  uid: string;
  username: string;
  score: number;
  completedExercises: number;
  scoresBySubject?: Record<string, number>;
  lastPlayed?: firebase.firestore.Timestamp;
  dailyStats?: UserStats;
  weeklyStats?: UserStats;
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserFromFirestore = useCallback(async (username: string) => {
    if (!username) {
      setUser(null);
      return;
    }
    try {
      const userDoc = await db.collection(FIRESTORE_COLLECTION).doc(username).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        setUser({
          uid: username,
          username: username,
          score: userData?.score || 0,
          completedExercises: userData?.completedExercises || 0,
          scoresBySubject: userData?.scoresBySubject || {},
          lastPlayed: userData?.lastPlayed || null,
          dailyStats: userData?.dailyStats,
          weeklyStats: userData?.weeklyStats,
        });
      } else {
        setUser({
          uid: username,
          username: username,
          score: 0,
          completedExercises: 0,
          scoresBySubject: {},
          lastPlayed: null,
        });
      }
    } catch (error) {
      console.error("Error loading user data from Firestore:", error);
      setUser(null);
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    try {
      const currentUsername = localStorage.getItem(CURRENT_USER_KEY);
      if (currentUsername) {
        loadUserFromFirestore(currentUsername).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    } catch (e) {
      console.error("Failed to load user from localStorage", e);
      setLoading(false);
    }
  }, [loadUserFromFirestore]);

  const login = useCallback(async (username: string) => {
    setLoading(true);
    localStorage.setItem(CURRENT_USER_KEY, username);
    await loadUserFromFirestore(username);
    setLoading(false);
  }, [loadUserFromFirestore]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(CURRENT_USER_KEY);
  }, []);

  const updateUser = useCallback((scoreToAdd: number, exercisesToAdd: number, subjectId: string) => {
    if (!user) return;
    
    const today = new Date();
    const currentDate = formatDate(today);
    const currentWeekId = formatDate(getStartOfWeek(today));

    // Optimistically update local state for immediate UI feedback
    const updatedUser: User = { ...user };
    updatedUser.score += scoreToAdd;
    updatedUser.completedExercises += exercisesToAdd;
    updatedUser.scoresBySubject = { ...updatedUser.scoresBySubject, [subjectId]: (updatedUser.scoresBySubject?.[subjectId] || 0) + scoreToAdd };
    
    // Daily
    if (updatedUser.dailyStats?.periodId !== currentDate) {
        updatedUser.dailyStats = { periodId: currentDate, score: scoreToAdd, scoresBySubject: { [subjectId]: scoreToAdd }};
    } else {
        updatedUser.dailyStats.score += scoreToAdd;
        updatedUser.dailyStats.scoresBySubject[subjectId] = (updatedUser.dailyStats.scoresBySubject[subjectId] || 0) + scoreToAdd;
    }
    // Weekly
    if (updatedUser.weeklyStats?.periodId !== currentWeekId) {
        updatedUser.weeklyStats = { periodId: currentWeekId, score: scoreToAdd, scoresBySubject: { [subjectId]: scoreToAdd }};
    } else {
        updatedUser.weeklyStats.score += scoreToAdd;
        updatedUser.weeklyStats.scoresBySubject[subjectId] = (updatedUser.weeklyStats.scoresBySubject[subjectId] || 0) + scoreToAdd;
    }
    setUser(updatedUser);

    // --- Prepare Firestore update object ---
    const firestoreUpdate: { [key: string]: any } = {
      score: firebase.firestore.FieldValue.increment(scoreToAdd),
      completedExercises: firebase.firestore.FieldValue.increment(exercisesToAdd),
      [`scoresBySubject.${subjectId}`]: firebase.firestore.FieldValue.increment(scoreToAdd),
      lastPlayed: firebase.firestore.FieldValue.serverTimestamp(),
    };

    // Handle daily stats update/reset
    if (user.dailyStats?.periodId !== currentDate) {
      firestoreUpdate.dailyStats = { periodId: currentDate, score: scoreToAdd, scoresBySubject: { [subjectId]: scoreToAdd } };
    } else {
      firestoreUpdate['dailyStats.score'] = firebase.firestore.FieldValue.increment(scoreToAdd);
      firestoreUpdate[`dailyStats.scoresBySubject.${subjectId}`] = firebase.firestore.FieldValue.increment(scoreToAdd);
    }
    
    // Handle weekly stats update/reset
    if (user.weeklyStats?.periodId !== currentWeekId) {
      firestoreUpdate.weeklyStats = { periodId: currentWeekId, score: scoreToAdd, scoresBySubject: { [subjectId]: scoreToAdd } };
    } else {
      firestoreUpdate['weeklyStats.score'] = firebase.firestore.FieldValue.increment(scoreToAdd);
      firestoreUpdate[`weeklyStats.scoresBySubject.${subjectId}`] = firebase.firestore.FieldValue.increment(scoreToAdd);
    }

    // --- Execute atomic update in Firestore ---
    db.collection(FIRESTORE_COLLECTION).doc(user.username).set(firestoreUpdate, { merge: true }).catch(error => {
      console.error("Failed to update user data in Firestore:", error);
      // Potentially revert optimistic update here
    });
  }, [user]);

  return { user, loading, login, logout, updateUser };
}