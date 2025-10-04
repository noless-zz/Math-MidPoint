import { useState, useEffect, useCallback } from 'react';
// Fix: Use firebase v8 namespaced API to resolve module export errors.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import { auth, db } from '../firebase/config.js';

export function useUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fix: Use auth.onAuthStateChanged and firebase.User type from v8 API.
    // Fix: Corrected the firebase user type to `firebase.auth.User`.
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // Fix: Use db.collection().doc() and .get() from v8 API.
        const userDocRef = db.collection("users").doc(firebaseUser.uid);
        const userDocSnap = await userDocRef.get();
        
        // Fix: Use .exists property instead of .exists() method.
        if (userDocSnap.exists) {
          setUser({ uid: firebaseUser.uid, ...userDocSnap.data() });
        } else {
          // FIX: If the user is authenticated but has no firestore doc, create one.
          console.log(`User document for ${firebaseUser.uid} not found. Creating new document.`);
          try {
            const username = firebaseUser.email ? firebaseUser.email.split('@')[0] : `user_${firebaseUser.uid.substring(0, 5)}`;
            
            const usersRef = db.collection("users");
            const q = usersRef.where("username", "==", username);
            const querySnapshot = await q.get();

            const finalUsername = querySnapshot.empty ? username : `${username}_${Math.random().toString(36).substring(2, 7)}`;

            const newUser = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                username: finalUsername,
                score: 0,
                completedExercises: 0,
            };
            
            await userDocRef.set(newUser);
            setUser(newUser);
          } catch (error) {
            console.error("Failed to create user document:", error);
            auth.signOut();
            setUser(null);
          }
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);
  
  const signUp = async (email, password, username) => {
    // 1. Check if username is unique
    // Fix: Use db.collection().where().get() from v8 API.
    const usersRef = db.collection("users");
    const q = usersRef.where("username", "==", username);
    const querySnapshot = await q.get();

    if (!querySnapshot.empty) {
        throw { code: 'auth/username-already-in-use' };
    }
    
    // 2. If unique, create user in Auth
    // Fix: Use auth.createUserWithEmailAndPassword from v8 API.
    const credentials = await auth.createUserWithEmailAndPassword(email, password);
    const firebaseUser = credentials.user;
    
    // 3. Create user document in Firestore
    if (firebaseUser) {
      const newUser = {
          email: firebaseUser.email,
          username,
          score: 0,
          completedExercises: 0,
      };
      
      // Fix: Use .doc().set() from v8 API.
      await db.collection("users").doc(firebaseUser.uid).set(newUser);
    }
  };

  const login = async (email, password) => {
    // Fix: Use auth.signInWithEmailAndPassword from v8 API.
    await auth.signInWithEmailAndPassword(email, password);
  };

  const logout = useCallback(async () => {
    // Fix: Use auth.signOut from v8 API.
    await auth.signOut();
  }, []);

  const updateUser = useCallback(async (scoreToAdd, exercisesToAdd) => {
    if (!user) return;
    
    // Fix: Use db.collection().doc() and .update() from v8 API.
    const userDocRef = db.collection("users").doc(user.uid);
    await userDocRef.update({
        // Fix: Use firebase.firestore.FieldValue.increment from v8 API.
        // Fix: Added necessary imports for firebase.firestore to be available.
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