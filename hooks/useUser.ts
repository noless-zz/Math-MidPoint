import { useState, useEffect, useCallback } from 'react';
// FIX: The errors indicate that Firebase v9 modular imports are failing.
// This suggests an older version of Firebase (v8 or below) is likely being used.
// The fix is to use the namespaced API from Firebase v8.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

// FIX: Import auth and db instances from config. The type `firebase.User` must be used for v8.
import { auth, db } from '../firebase/config';
import type { User } from '../types';


export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // FIX: Use auth.onAuthStateChanged for v8, and firebase.User as the type for the user object.
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser: firebase.User | null) => {
      if (firebaseUser) {
        // FIX: Use v8 syntax for Firestore document reference and get
        const userDocRef = db.collection("users").doc(firebaseUser.uid);
        const userDocSnap = await userDocRef.get();
        if (userDocSnap.exists) {
          setUser({ uid: firebaseUser.uid, ...(userDocSnap.data() as Omit<User, 'uid'>) });
        } else {
          console.log("User document does not exist.");
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);
  
  const signUp = async (email: string, password: string, username: string) => {
    // 1. Check if username is unique
    // FIX: Use v8 syntax for collection, where, and get
    const usersRef = db.collection("users");
    const q = usersRef.where("username", "==", username);
    const querySnapshot = await q.get();

    if (!querySnapshot.empty) {
        throw { code: 'auth/username-already-in-use' };
    }
    
    // 2. If unique, create user in Auth
    // FIX: Use auth.createUserWithEmailAndPassword for v8
    const credentials = await auth.createUserWithEmailAndPassword(email, password);
    const firebaseUser = credentials.user;
    
    // 3. Create user document in Firestore
    if (firebaseUser) {
      const newUser: Omit<User, 'uid'> = {
          email: firebaseUser.email!,
          username,
          score: 0,
          completedExercises: 0,
      };
      
      // FIX: Use v8 syntax for doc().set()
      await db.collection("users").doc(firebaseUser.uid).set(newUser);
    }
  };

  const login = async (email: string, password: string) => {
    // FIX: Use auth.signInWithEmailAndPassword for v8
    await auth.signInWithEmailAndPassword(email, password);
  };

  const logout = useCallback(async () => {
    // FIX: Use auth.signOut for v8
    await auth.signOut();
  }, []);

  const updateUser = useCallback(async (scoreToAdd: number, exercisesToAdd: number) => {
    if (!user) return;
    // FIX: Use v8 syntax for doc reference
    const userDocRef = db.collection("users").doc(user.uid);
    // FIX: Use v8 syntax for update and FieldValue.increment
    await userDocRef.update({
        score: firebase.firestore.FieldValue.increment(scoreToAdd),
        completedExercises: firebase.firestore.FieldValue.increment(exercisesToAdd),
    });
    
    setUser(currentUser => {
      if (!currentUser) return null;
      return {
        ...currentUser,
        score: currentUser.score + scoreToAdd,
        completedExercises: currentUser.completedExercises + exercisesToAdd,
      };
    });
  }, [user]);

  return { user, loading, signUp, login, logout, updateUser };
}