

import React, { useState, useEffect } from 'react';
import { LogoIcon } from './icons.tsx';

// A simple Google Icon component
const GoogleIcon = (props) => (
  <svg viewBox="0 0 48 48" {...props}>
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
    <path fill="none" d="M0 0h48v48H0z"></path>
  </svg>
);

const UserIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
);

export default function AuthScreen({ onSignInWithGoogle, onSignInAsGuest, authError, onSignInWithEmail, onSignUpWithEmail }) {
    const [mode, setMode] = useState('signIn'); // 'signIn' or 'signUp'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
      e.preventDefault();
      if (mode === 'signIn') {
        onSignInWithEmail(email, password);
      } else {
        onSignUpWithEmail(email, password);
      }
    };
    
    const getErrorMessage = (error) => {
      if (!error) return null;
      switch (error.code) {
        case 'auth/operation-not-supported-in-this-environment':
          return 'ההתחברות באמצעות גוגל אינה נתמכת בסביבת הרצה זו.';
        case 'auth/unauthorized-domain':
          return 'הדומיין אינו מורשה. יש לעדכן את הגדרות Firebase.';
        case 'auth/popup-closed-by-user':
          return 'חלון ההתחברות נסגר. נסה/י שוב.';
        case 'auth/cancelled-popup-request':
          return 'בוצעה בקשת התחברות נוספת לפני שהנוכחית הושלמה.';
        case 'auth/invalid-email':
          return 'כתובת האימייל אינה תקינה.';
        case 'auth/user-not-found':
          return 'לא נמצא משתמש עם כתובת אימייל זו.';
        case 'auth/wrong-password':
          return 'הסיסמה שגויה. נסה/י שוב.';
        case 'auth/email-already-in-use':
          return 'כתובת האימייל כבר קיימת במערכת.';
        case 'auth/weak-password':
          return 'הסיסמה חלשה מדי. נדרשים לפחות 6 תווים.';
        default:
          return error.message || 'אירעה שגיאה. נסה שוב.';
      }
    };
    
  const renderAuthError = () => {
    if (!authError) return null;
    const errorMessage = getErrorMessage(authError);
    
    if (errorMessage) {
       return (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-6" role="alert">
          <strong className="font-bold">שגיאה: </strong>
          <span className="block sm:inline">{errorMessage}</span>
        </div>
      );
    }
    
    return null;
  };
    
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        <div className="text-center">
            <LogoIcon className="h-16 w-16 text-indigo-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">ברוכים הבאים</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2 mb-8">
              {mode === 'signIn' ? 'התחבר/י לחשבונך' : 'צור/י חשבון חדש'}
            </p>
        </div>

        {renderAuthError()}

        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-right">
                    אימייל
                </label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
            </div>

            <div>
                <label htmlFor="password"  className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-right">
                    סיסמה
                </label>
                <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
            </div>
            
             <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {mode === 'signIn' ? 'התחברות' : 'הרשמה'}
            </button>
        </form>
        
        <div className="text-center mt-4">
            <button onClick={() => setMode(mode === 'signIn' ? 'signUp' : 'signIn')} className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium">
                {mode === 'signIn' ? 'אין לך חשבון? הרשמ/י' : 'יש לך כבר חשבון? התחבר/י'}
            </button>
        </div>
        
        <div className="mt-6">
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">או</span>
                </div>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-3">
                 <button
                   onClick={onSignInWithGoogle}
                   className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-semibold py-2.5 px-4 rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-gray-600 text-sm"
                 >
                   <GoogleIcon className="h-5 w-5" />
                   <span>המשך עם גוגל</span>
                 </button>
                  <button
                    onClick={onSignInAsGuest}
                    className="w-full flex items-center justify-center gap-3 bg-gray-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors hover:bg-gray-600 text-sm"
                  >
                    <UserIcon className="h-5 w-5" />
                    <span>המשך כאורח</span>
                  </button>
            </div>
        </div>
      </div>
    </div>
  );
}