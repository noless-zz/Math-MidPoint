import { useState, useEffect, useCallback } from 'react';
// Fix: Use firebase v8 syntax. Import firebase to access auth providers and firestore field values.
// Fix: Updated Firebase imports to use the v8 SDK directly, removing the compat layer.
// @fixtsc
// Re-enabling compat layer as v8 syntax is used with what appears to be a v9+ SDK installation.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import { auth, db } from '../firebase/config.ts';
import { isProfane } from '../services/profanityFilter.ts';

const USER_COLLECTION = 'midpointMasterUsers';

export function useUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.warn('Authentication check timed out after 10 seconds.');
        setLoading(false);
        setAuthError({ 
          code: 'auth/timeout',
          message: 'תהליך האימות נתקע. אנא רענן את הדף ובדוק את חיבור האינטרנט.' 
        });
      }
    }, 10000);

    // With the pop-up flow, we only need the onAuthStateChanged listener.
    // The redirect check has been removed to prevent errors on load in sandboxed environments.
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      console.log('[Auth State Change] Triggered.');
      clearTimeout(loadingTimeout);
      try {
        if (firebaseUser) {
          console.log('[Auth State Change] User is signed in. Full user object:', firebaseUser);
          console.log('[Auth State Change] UID:', firebaseUser.uid, 'Email:', firebaseUser.email, 'DisplayName:', firebaseUser.displayName);
          
          // Fix: Use v8 syntax for document reference.
          const userDocRef = db.collection(USER_COLLECTION).doc(firebaseUser.uid);
          console.log(`[Auth State Change] Checking for user document at ${USER_COLLECTION}/${firebaseUser.uid}`);
          // Fix: Use v8 get() method on document reference.
          const userDocSnap = await userDocRef.get();
          
          if (userDocSnap.exists) {
            console.log('[Auth State Change] User document found. Setting user state.');
            setUser({ uid: firebaseUser.uid, ...userDocSnap.data(), emailVerified: firebaseUser.emailVerified });
          } else {
            console.log(`[Auth State Change] User document not found. Proceeding to create a new one.`);
            try {
              let username = firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : `user_${firebaseUser.uid.substring(0, 5)}`);
              console.log('[User Creation] Initial username from provider:', username);

              username = username.replace(/[^a-zA-Z0-9א-ת_]/g, '');
              console.log('[User Creation] Sanitized username:', username);

              if(isProfane(username)) {
                  username = `user_${firebaseUser.uid.substring(0, 5)}`;
                  console.log('[User Creation] Profanity detected. Resetting username to:', username);
              }

              // Fix: Use v8 syntax for collection reference.
              const usersRef = db.collection(USER_COLLECTION);
              console.log('[User Creation] Checking for username uniqueness...');
              // Fix: Use v8 where() and get() methods for queries.
              const q = usersRef.where("username", "==", username);
              const querySnapshot = await q.get();

              const finalUsername = querySnapshot.empty ? username : `${username}_${Math.random().toString(36).substring(2, 7)}`;
              if (!querySnapshot.empty) {
                  console.log('[User Creation] Username exists. Appending random suffix. Final username:', finalUsername);
              } else {
                  console.log('[User Creation] Username is unique. Final username:', finalUsername);
              }
              
              const newUser = {
                  uid: firebaseUser.uid,
                  email: firebaseUser.email,
                  username: finalUsername,
                  score: 0,
                  completedExercises: 0,
              };
              console.log('[User Creation] New user object to be saved:', newUser);
              
              // Fix: Use v8 set() method on document reference.
              await userDocRef.set(newUser);
              console.log('[User Creation] New user document created successfully.');
              setUser({...newUser, emailVerified: firebaseUser.emailVerified});
            } catch (error) {
              console.error("[User Creation] CRITICAL: Failed to create user document:", error);
              // Fix: Use v8 signOut method from auth instance.
              await auth.signOut();
              setUser(null);
            }
          }
        } else {
          console.log('[Auth State Change] User is signed out.');
          setUser(null);
        }
      } catch (error) {
        console.error("[Auth State Change] A critical error occurred in the auth state handler:", error);
        setAuthError(error);
        setUser(null);
      } finally {
        setLoading(false);
        console.log('[Auth State Change] Finished processing. Loading set to false.');
      }
    });

    return () => {
      unsubscribe();
      clearTimeout(loadingTimeout);
    };
  }, []);
  
  const signInWithGoogle = async () => {
    console.log('[Sign In] Attempting to sign in with Google via pop-up...');
    setLoading(true);
    setAuthError(null);
    // Fix: Use v8 syntax for GoogleAuthProvider.
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        // Fix: Use v8 signInWithPopup method from auth instance.
        await auth.signInWithPopup(provider);
        console.log('[Sign In] Google sign-in pop-up successful. Waiting for onAuthStateChanged...');
    } catch (error) {
        console.error("[Sign In] Google sign-in pop-up failed. Code:", error.code, "Message:", error.message);
        console.error("[Sign In] Full error object:", error);
        setAuthError(error);
        setLoading(false); // Stop loading on error
    }
  };

  const signInWithEmail = async (email, password) => {
    console.log(`[Sign In] Attempting to sign in with email: ${email}`);
    setLoading(true);
    setAuthError(null);
    try {
      await auth.signInWithEmailAndPassword(email, password);
      console.log('[Sign In] signInWithEmailAndPassword successful. Waiting for onAuthStateChanged...');
    } catch (error) {
      // This generic error can mean user not found OR wrong password.
      // We attempt to sign up as a fallback.
      if (error.code === 'auth/invalid-credential') {
        console.warn(`[Sign In] Invalid credential for ${email}. Attempting to create a new account as a fallback.`);
        try {
          // Try to create an account.
          await auth.createUserWithEmailAndPassword(email, password);
          console.log('[Sign Up] createUserWithEmailAndPassword successful after failed login. Waiting for onAuthStateChanged...');
        } catch (signUpError) {
           // If sign-up fails because the email already exists, it means the original error was a wrong password.
           // In this case, we should show the original 'invalid-credential' error to the user.
           if (signUpError.code === 'auth/email-already-in-use') {
              console.log("[Sign In] Fallback logic: User exists, so the original password was incorrect. Displaying 'invalid credential' message.");
              setAuthError(error); // Set the original 'invalid-credential' error
           } else {
              // Otherwise, it's a genuine sign-up error (like a weak password), which is useful to show.
              console.error("[Sign Up] Failed to create new user during fallback. Code:", signUpError.code, "Message:", signUpError.message);
              setAuthError(signUpError);
           }
           setLoading(false);
        }
      } else {
        // Handle other, unexpected sign-in errors
        console.error("[Sign In] Email sign-in failed. Code:", error.code, "Message:", error.message);
        setAuthError(error);
        setLoading(false);
      }
    }
  };

  const signUpWithEmail = async (email, password) => {
    console.log('[Sign Up] Attempting to sign up with email...');
    setLoading(true);
    setAuthError(null);
    try {
      await auth.createUserWithEmailAndPassword(email, password);
      console.log('[Sign Up] createUserWithEmailAndPassword successful. Waiting for onAuthStateChanged...');
    } catch (error) {
      console.error("[Sign Up] Email sign-up failed. Code:", error.code, "Message:", error.message);
      setAuthError(error);
      setLoading(false);
    }
  };

  const signInAsGuest = useCallback(() => {
    setLoading(true);
    const guestUser = {
      uid: `guest_${Date.now()}`,
      username: `אורח_${Math.random().toString(36).substring(2, 7)}`,
      score: 0,
      completedExercises: 0,
      isGuest: true,
    };
    setUser(guestUser);
    setLoading(false);
  }, []);

  const logout = useCallback(async () => {
    if (user?.isGuest) {
      setUser(null);
    } else {
      // Fix: Use v8 signOut method from auth instance.
      await auth.signOut();
    }
  }, [user]);

  const updateUser = useCallback(async (scoreToAdd, exercisesToAdd) => {
    if (!user || user.isGuest) { // Guests' scores are only local
        setUser(currentUser => {
          if (!currentUser) return null;
          return {
            ...currentUser,
            score: currentUser.score + scoreToAdd,
            completedExercises: currentUser.completedExercises + exercisesToAdd,
          };
        });
        return;
    }
    
    // Fix: Use v8 syntax for document reference and update.
    const userDocRef = db.collection(USER_COLLECTION).doc(user.uid);
    await userDocRef.update({
        // Fix: Use v8 FieldValue for incrementing.
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

  return { user, loading, signInWithGoogle, signInAsGuest, logout, updateUser, authError, signInWithEmail, signUpWithEmail };
}