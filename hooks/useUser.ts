import { useState, useEffect, useCallback } from 'react';
import { db, firebase } from '../firebase/config.ts';

const CURRENT_USER_KEY = 'midpointMasterCurrentUser';
const FIRESTORE_COLLECTION = 'scores_aloni_yitzhak_10_4';

// Define the user type
interface User {
  uid: string;
  username: string;
  score: number;
  completedExercises: number;
  scoresBySubject?: Record<string, number>;
  lastPlayed?: firebase.firestore.Timestamp;
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
        });
      } else {
        // User exists in the list but not in Firestore yet.
        // Create a new local user object. It will be saved to Firestore on first update.
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
      // Logout on error to prevent inconsistent state
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

    const updatedUser: User = {
      ...user,
      score: user.score + scoreToAdd,
      completedExercises: user.completedExercises + exercisesToAdd,
      scoresBySubject: {
          ...(user.scoresBySubject || {}),
          [subjectId]: ((user.scoresBySubject || {})[subjectId] || 0) + scoreToAdd
      }
    };
    
    setUser(updatedUser);

    // Update Firestore with FieldValue for atomic operations
    db.collection(FIRESTORE_COLLECTION).doc(updatedUser.username).set({
      score: firebase.firestore.FieldValue.increment(scoreToAdd),
      completedExercises: firebase.firestore.FieldValue.increment(exercisesToAdd),
      [`scoresBySubject.${subjectId}`]: firebase.firestore.FieldValue.increment(scoreToAdd),
      lastPlayed: firebase.firestore.FieldValue.serverTimestamp(),
    }, { merge: true }).catch(error => {
      console.error("Failed to update user data in Firestore:", error);
    });
  }, [user]);

  return { user, loading, login, logout, updateUser };
}