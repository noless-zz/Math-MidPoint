

import { useState, useEffect, useCallback } from 'react';
import { db, firebase, auth } from '../firebase/config.ts';

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
  isGuest?: boolean;
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // This state holds the Firebase auth user, separate from the app user profile
  const [firebaseUser, setFirebaseUser] = useState<firebase.User | null>(() => auth.currentUser);

  const loadUserFromFirestore = useCallback(async (username: string) => {
    if (!username) {
      setUser(null);
      return;
    }

    // Defensive check: Ensure we are authenticated before any Firestore operation.
    if (!auth.currentUser) {
        console.error("[DEBUG][ERROR] Attempted to load from Firestore, but `auth.currentUser` is null. This indicates an auth flow issue.");
        setUser(null);
        localStorage.removeItem(CURRENT_USER_KEY);
        return;
    }
    
    console.log(`[DEBUG][FIRESTORE] Attempting to read doc '${username}' from collection '${FIRESTORE_COLLECTION}'. Authenticated UID: ${auth.currentUser.uid}`);

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
        console.log(`[DEBUG][FIRESTORE] Document for '${username}' does not exist. Creating new local user object.`);
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
      console.error(`[DEBUG][ERROR] Error loading user data for '${username}' from Firestore:`, error);
      console.error("[DEBUG][ACTION] This usually means your Firestore Security Rules are blocking the read. Check your project's rules to ensure they allow reads for authenticated users. A simple rule for this collection would be: 'allow read: if request.auth != null;'");
      setUser(null);
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  }, []);

  // Effect 1: Listen for auth state changes from Firebase and update local state
  useEffect(() => {
    console.log("[DEBUG] Setting up Firebase auth state listener...");
    const unsubscribe = auth.onAuthStateChanged((fbUser) => {
      if (fbUser) {
        console.log(`[DEBUG][AUTH] State changed: User is signed in anonymously. UID: ${fbUser.uid}`);
      } else {
        console.log("[DEBUG][AUTH] State changed: User is signed out.");
      }
      setFirebaseUser(fbUser);
    });
    return () => {
        console.log("[DEBUG] Cleaning up Firebase auth state listener.");
        unsubscribe();
    };
  }, []);

  // Effect 2: React to the authentication state to either sign in or load data
  useEffect(() => {
    const handleUserLogic = async () => {
      console.log(`[DEBUG] handleUserLogic triggered. firebaseUser is ${firebaseUser ? 'present' : 'null'}.`);
      
      // If we don't have a firebase user, sign in anonymously.
      // This will trigger the onAuthStateChanged listener, which will update firebaseUser state and re-run this effect.
      if (!firebaseUser) {
        console.log("[DEBUG] No Firebase user found, attempting anonymous sign-in...");
        try {
          const userCredential = await auth.signInAnonymously();
          console.log("[DEBUG] Anonymous sign-in successful.", userCredential);
        } catch (error) {
          console.error("[DEBUG][ERROR] Anonymous sign-in failed. This is likely a configuration issue.", error);
          console.error("[DEBUG][ACTION] Please go to your Firebase Console -> Authentication -> Sign-in method and ensure the 'Anonymous' sign-in provider is ENABLED.");
          setLoading(false); // Can't proceed
        }
        return; // Exit and wait for the state change to re-trigger the effect
      }

      // At this point, we are guaranteed to have an authenticated firebaseUser.
      console.log(`[DEBUG] User is authenticated with UID: ${firebaseUser.uid}. Proceeding to load app data.`);
      setLoading(true);
      const currentUsername = localStorage.getItem(CURRENT_USER_KEY);
      if (currentUsername) {
        console.log(`[DEBUG] Found username '${currentUsername}' in localStorage. Loading from Firestore...`);
        await loadUserFromFirestore(currentUsername);
      } else {
        console.log("[DEBUG] No username in localStorage. App is waiting for user selection.");
        setUser(null);
      }
      setLoading(false);
    };

    handleUserLogic();
  }, [firebaseUser, loadUserFromFirestore]);


  const login = useCallback(async (username: string) => {
    setLoading(true);
    localStorage.setItem(CURRENT_USER_KEY, username);
    await loadUserFromFirestore(username);
    setLoading(false);
  }, [loadUserFromFirestore]);

  const loginAsGuest = useCallback(() => {
    setLoading(true);
    const guestUser: User = {
      uid: `guest_${Date.now()}`,
      username: 'אורח/ת',
      score: 0,
      completedExercises: 0,
      isGuest: true,
      scoresBySubject: {},
    };
    setUser(guestUser);
    setLoading(false);
  }, []);

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

    // If user is a guest, do not persist data to Firestore
    if (user.isGuest) {
        return;
    }
    
    if (!auth.currentUser) {
        console.error("[DEBUG][ERROR] Attempted to update Firestore, but `auth.currentUser` is null.");
        return;
    }

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
    
    console.log(`[DEBUG][FIRESTORE] Attempting to update doc '${user.username}'. Authenticated UID: ${auth.currentUser.uid}`);
    
    // --- Execute atomic update in Firestore ---
    db.collection(FIRESTORE_COLLECTION).doc(user.username).set(firestoreUpdate, { merge: true }).catch(error => {
      console.error("[DEBUG][ERROR] Failed to update user data in Firestore:", error);
      console.error("[DEBUG][ACTION] Check your Firestore security rules to ensure they allow writes for authenticated users. A simple rule would be: 'allow write: if request.auth != null;'");
      // Potentially revert optimistic update here
    });
  }, [user]);

  return { user, loading, login, logout, updateUser, loginAsGuest };
}