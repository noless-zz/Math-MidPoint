import { useState, useEffect, useCallback } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import { auth, db } from '../firebase/config.ts';
import { isProfane } from '../services/profanityFilter.ts';

const USER_COLLECTION = 'midpointMasterUsers';

export function useUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        if (firebaseUser.isAnonymous) {
          setUser({
            uid: firebaseUser.uid,
            email: null,
            username: 'אורח/ת',
            score: 0,
            completedExercises: 0,
            isGuest: true,
            emailVerified: true,
          });
        } else {
          const userDocRef = db.collection(USER_COLLECTION).doc(firebaseUser.uid);
          const userDocSnap = await userDocRef.get();
          
          if (userDocSnap.exists) {
            setUser({ uid: firebaseUser.uid, ...userDocSnap.data(), emailVerified: firebaseUser.emailVerified });
          } else {
            console.log(`User document for ${firebaseUser.uid} not found. Creating new document.`);
            try {
              const username = firebaseUser.email ? firebaseUser.email.split('@')[0] : `user_${firebaseUser.uid.substring(0, 5)}`;
              
              const usersRef = db.collection(USER_COLLECTION);
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
              setUser({...newUser, emailVerified: firebaseUser.emailVerified});
            } catch (error) {
              console.error("Failed to create user document:", error);
              auth.signOut();
              setUser(null);
            }
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
    // 1. Check for profanity
    if (isProfane(username)) {
      throw { code: 'auth/profane-username' };
    }
    
    // 2. Check if username is unique
    const usersRef = db.collection(USER_COLLECTION);
    const q = usersRef.where("username", "==", username);
    const querySnapshot = await q.get();

    if (!querySnapshot.empty) {
        throw { code: 'auth/username-already-in-use' };
    }
    
    // 3. If unique, create user in Auth
    const credentials = await auth.createUserWithEmailAndPassword(email, password);
    const firebaseUser = credentials.user;
    
    // 4. Send verification email
    await firebaseUser?.sendEmailVerification();

    // 5. Create user document in Firestore
    if (firebaseUser) {
      const newUser = {
          email: firebaseUser.email,
          username,
          score: 0,
          completedExercises: 0,
      };
      
      await db.collection(USER_COLLECTION).doc(firebaseUser.uid).set(newUser);
    }
  };

  const login = async (email, password) => {
    await auth.signInWithEmailAndPassword(email, password);
  };
  
  const loginAsGuest = async () => {
    await auth.signInAnonymously();
  };

  const logout = useCallback(async () => {
    await auth.signOut();
  }, []);

  const resendVerificationEmail = useCallback(async () => {
    if (auth.currentUser) {
      await auth.currentUser.sendEmailVerification();
    }
  }, []);

  const updateUser = useCallback(async (scoreToAdd, exercisesToAdd) => {
    if (!user) return;
    
    if (!user.isGuest) {
      const userDocRef = db.collection(USER_COLLECTION).doc(user.uid);
      await userDocRef.update({
          score: firebase.firestore.FieldValue.increment(scoreToAdd),
          completedExercises: firebase.firestore.FieldValue.increment(exercisesToAdd),
      });
    }
    
    setUser(currentUser => {
      if (!currentUser) return null;
      return {
        ...currentUser,
        score: currentUser.score + scoreToAdd,
        completedExercises: currentUser.completedExercises + exercisesToAdd,
      };
    });
  }, [user]);

  return { user, loading, signUp, login, logout, updateUser, loginAsGuest, resendVerificationEmail };
}
