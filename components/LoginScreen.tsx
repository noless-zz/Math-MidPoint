import React, { useState } from 'react';
import { LogoIcon } from './icons.tsx';

export default function LoginScreen({ onLogin }) {
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onLogin(name.trim());
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8 text-center">
        <div className="flex justify-center mb-6">
            <LogoIcon className="h-20 w-20 text-indigo-500" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            ברוכים הבאים ל-Midpoint Master
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
            אפליקציית הלימוד והתרגול למציאת נקודת אמצע קטע.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="הקלד את שמך..."
            className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border-2 border-transparent focus:border-indigo-500 focus:ring-0 rounded-lg text-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 outline-none transition duration-300"
            aria-label="שם משתמש"
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white font-bold text-lg py-3 px-4 rounded-lg transition duration-300 transform hover:scale-105"
          >
            התחל ללמוד
          </button>
        </form>
      </div>
    </div>
  );
}