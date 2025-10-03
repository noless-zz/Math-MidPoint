import { useState, useEffect, useCallback } from 'react';
// Fix: Corrected firebase imports to use scoped packages to resolve module export errors.
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, User as FirebaseUser } from '@firebase/auth';
// Fix: Corrected firebase imports to use scoped packages to resolve module export errors.
import { doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc, increment } from '@firebase/firestore';
import { auth, db } from '../firebase/config';
import type { User } from '../types';

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
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
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", username));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        throw { code: 'auth/username-already-in-use' };
    }
    
    // 2. If unique, create user in Auth
    const credentials = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = credentials.user;
    
    // 3. Create user document in Firestore
    if (firebaseUser) {
      const newUser: Omit<User, 'uid'> = {
          email: firebaseUser.email!,
          username,
          score: 0,
          completedExercises: 0,
      };
      
      await setDoc(doc(db, "users", firebaseUser.uid), newUser);
    }
  };

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  const updateUser = useCallback(async (scoreToAdd: number, exercisesToAdd: number) => {
    if (!user) return;
    
    const userDocRef = doc(db, "users", user.uid);
    await updateDoc(userDocRef, {
        score: increment(scoreToAdd),
        completedExercises: increment(exercisesToAdd),
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