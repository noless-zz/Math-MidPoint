
import React, { useState } from 'react';
import { LogoIcon } from './icons';

interface AuthScreenProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string, username: string) => Promise<void>;
}

export default function AuthScreen({ onLogin, onSignUp }: AuthScreenProps): React.ReactElement {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await onLogin(email, password);
      } else {
        await onSignUp(email, password, username);
      }
    } catch (err: any) {
      let message = "אירעה שגיאה. נסה שוב.";
      if (err.code === 'auth/email-already-in-use') message = 'כתובת הדוא"ל כבר בשימוש.';
      if (err.code === 'auth/invalid-email') message = 'כתובת הדוא"ל אינה תקינה.';
      if (err.code === 'auth/weak-password') message = 'הסיסמה חלשה מדי. נדרשים לפחות 6 תווים.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') message = 'דוא"ל או סיסמה שגויים.';
      if (err.code === 'auth/username-already-in-use') message = 'שם המשתמש כבר תפוס. בחר שם אחר.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8">
        <div className="flex justify-center mb-6">
            <LogoIcon className="h-20 w-20 text-indigo-500" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 text-center">
            {isLogin ? 'התחברות ל-Midpoint Master' : 'הרשמה ל-Midpoint Master'}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4 mt-8">
          {!isLogin && (
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="שם משתמש"
              required
              className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border-2 border-transparent focus:border-indigo-500 focus:ring-0 rounded-lg text-lg"
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder='דוא"ל'
            required
            className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border-2 border-transparent focus:border-indigo-500 focus:ring-0 rounded-lg text-lg"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="סיסמה"
            required
            className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border-2 border-transparent focus:border-indigo-500 focus:ring-0 rounded-lg text-lg"
          />

          {error && <p className="text-red-500 text-center">{error}</p>}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white font-bold text-lg py-3 px-4 rounded-lg transition"
          >
            {loading ? 'טוען...' : (isLogin ? 'התחבר' : 'הירשם')}
          </button>
        </form>

        <p className="text-center mt-6">
          {isLogin ? 'אין לך חשבון?' : 'יש לך כבר חשבון?'}
          <button onClick={toggleMode} className="font-semibold text-indigo-500 hover:text-indigo-400 ml-2">
            {isLogin ? 'הירשם כאן' : 'התחבר כאן'}
          </button>
        </p>
      </div>
    </div>
  );
}
