import React, { useState } from 'react';

export default function VerificationBanner({ onResend }) {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleResend = async () => {
    setError('');
    setSent(true);
    try {
      await onResend();
      // Keep the "Sent!" message for a few seconds
      setTimeout(() => setSent(false), 10000);
    } catch (err) {
      setError('שליחת האימייל נכשלה. נסה שוב מאוחר יותר.');
      setSent(false);
    }
  };

  return (
    <div className="bg-amber-100 dark:bg-amber-900/50 border-b-2 border-amber-400 dark:border-amber-600 text-amber-800 dark:text-amber-200 p-3 text-center text-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-4">
        <p>
            <strong>חשבונך אינו מאומת.</strong> בדוק את תיבת הדואר הנכנס שלך (כולל תיקיית ספאם) לקבלת קישור אימות.
        </p>
        <button 
            onClick={handleResend}
            disabled={sent}
            className="px-3 py-1 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-400/50 disabled:cursor-wait text-white font-semibold rounded-md transition-colors whitespace-nowrap"
        >
            {sent ? 'אימייל נשלח!' : 'שלח שוב אימייל'}
        </button>
        {error && <p className="text-red-500 text-xs">{error}</p>}
      </div>
    </div>
  );
}
