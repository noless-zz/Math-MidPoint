import React, { useState, useMemo } from 'react';
import { userList } from '../users.tsx';
import { LogoIcon } from './icons.tsx';
import { design } from '../constants/design_system.ts';

const HEBREW_ALPHABET = 'אבגדהוזחטיכלמנסעפצקרשת'.split('');

const getFamilyNameInitial = (fullName: string): string => {
    // The name format is "LastName FirstName", so the family name is the first word.
    return fullName.trim()[0] || '';
};

export default function LoginScreen({ onLogin, onLoginAsGuest }: { onLogin: (username: string) => void; onLoginAsGuest: () => void; }) {
    const [selectedLetter, setSelectedLetter] = useState<string | null>(null);

    const filteredUsers = useMemo(() => {
        if (!selectedLetter) return [];
        return userList
            .filter(user => getFamilyNameInitial(user) === selectedLetter)
            .sort((a, b) => a.localeCompare(b, 'he'));
    }, [selectedLetter]);
    
    const handleLetterClick = (letter: string) => {
        setSelectedLetter(letter);
    };

    const handleBackToLetters = () => {
        setSelectedLetter(null);
    };

    return (
        <div className={`min-h-screen flex flex-col items-center justify-center bg-${design.colors.background.light} dark:bg-${design.colors.background.dark} p-4`}>
            <div className={`${design.auth.card} w-full max-w-2xl`}>
                <div className="text-center mb-8">
                    <LogoIcon className="h-16 w-16 text-indigo-500 mx-auto mb-4" />
                    <h1 className={`text-3xl font-bold ${design.colors.text.light} dark:${design.colors.text.dark}`}>
                        מרכז תירגול - כיתה י'
                    </h1>
                     <p className={`${design.colors.text.muted.light} dark:${design.colors.text.muted.dark} mt-2`}>
                        {selectedLetter ? `בחירת שם שהמשפחה שלו מתחילה באות '${selectedLetter}'` : 'נא לבחור את האות הראשונה של שם המשפחה'}
                    </p>
                </div>

                {!selectedLetter ? (
                    <div className="flex flex-wrap justify-center gap-2" dir="rtl">
                        {HEBREW_ALPHABET.map(letter => (
                            <button
                                key={letter}
                                onClick={() => handleLetterClick(letter)}
                                className={`w-12 h-12 rounded-lg font-bold text-xl ${design.components.button.secondary} ${design.effects.transition} hover:ring-2 hover:ring-indigo-400`}
                            >
                                {letter}
                            </button>
                        ))}
                    </div>
                ) : (
                    <div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
                           {filteredUsers.length > 0 ? filteredUsers.map(user => (
                                <button
                                    key={user}
                                    onClick={() => onLogin(user)}
                                    className={`p-3 text-center rounded-lg font-semibold ${design.components.button.secondary} ${design.effects.transition} hover:bg-indigo-500 hover:text-white`}
                                >
                                    {user}
                                </button>
                            )) : <p className="col-span-full text-center text-gray-500">לא נמצאו תלמידים</p>}
                        </div>
                        <button
                            onClick={handleBackToLetters}
                             className={`w-full ${design.components.button.base} bg-gray-500 hover:bg-gray-600 text-white mt-4`}
                        >
                            חזרה לבחירת אות
                        </button>
                    </div>
                )}

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-gray-300 dark:border-gray-700" />
                    </div>
                    <div className="relative flex justify-center">
                        <span className={`px-2 bg-white dark:bg-gray-800 text-sm text-gray-500 dark:text-gray-400`}>או</span>
                    </div>
                </div>

                <button
                    onClick={onLoginAsGuest}
                    className={`w-full ${design.components.button.base} bg-gray-600 hover:bg-gray-700 text-white`}
                >
                    התחבר/י כאורח/ת
                </button>
            </div>
        </div>
    );
}