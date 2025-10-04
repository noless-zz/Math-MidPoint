import { auth } from './config.ts';

/**
 * Validates user login credentials against Firebase Auth.
 * This is intended for manual testing and validation during development.
 * It will sign the user in and immediately sign them out.
 * 
 * To use, you can import this function and call it from a temporary
 * location, for example, within a useEffect hook in App.jsx:
 * 
 * useEffect(() => {
 *   validateUserLogin("no.less@live.com", "nn2008");
 * }, []);
 * 
 * @param {string} email The user's email.
 * @param {string} password The user's password.
 * @returns A promise that resolves to an object indicating success or failure.
 */
export async function validateUserLogin(email, password) {
  try {
    console.log(`[VALIDATION] Attempting to log in as ${email}...`);
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    console.log(`[VALIDATION] Successfully logged in user: ${userCredential.user?.uid}`);
    
    // Immediately sign out to not affect the app's actual auth state.
    await auth.signOut();
    console.log('[VALIDATION] Successfully logged out.');
    
    return { success: true, data: userCredential.user };
  } catch (error) {
    console.error('[VALIDATION] Login validation failed:', error.code, error.message);
    return { success: false, error: { code: error.code, message: error.message } };
  }
}