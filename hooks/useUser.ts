import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase/config.ts';

const CURRENT_USER_KEY = 'midpointMasterCurrentUser';
const FIRESTORE_COLLECTION = 'scores_aloni_yitzhak_10_4';

// Define the user type
interface User {
  uid: string;
  username: string;
  score: number;
  completedExercises: number;
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
        });
      } else {
        // User exists in the list but not in Firestore yet.
        // Create a new local user object. It will be saved to Firestore on first update.
        setUser({
          uid: username,
          username: username,
          score: 0,
          completedExercises: 0,
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

  const updateUser = useCallback((scoreToAdd: number, exercisesToAdd: number) => {
    if (!user) return;

    const updatedUser: User = {
      ...user,
      score: user.score + scoreToAdd,
      completedExercises: user.completedExercises + exercisesToAdd,
    };
    
    setUser(updatedUser);

    // Update Firestore, will create the document if it doesn't exist
    db.collection(FIRESTORE_COLLECTION).doc(updatedUser.username).set({
      score: updatedUser.score,
      completedExercises: updatedUser.completedExercises,
    }, { merge: true }).catch(error => {
      console.error("Failed to update user data in Firestore:", error);
    });
  }, [user]);

  return { user, loading, login, logout, updateUser };
}