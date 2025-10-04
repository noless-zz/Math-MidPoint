import React from 'react';

// Fix: Replaced JSX.Element with React.ReactElement to resolve "Cannot find namespace 'JSX'" error.
export default function MathInput({ value, onChange, disabled }) {
    
    const handleKeyPress = (key) => {
        if (disabled) return;
        if (key === 'del') {
            onChange(value.slice(0, -1));
        } else {
            onChange(value + key);
        }
    };
    
    const keys = [
        '7', '8', '9', '(',
        '4', '5', '6', ')',
        '1', '2', '3', ',',
        '0', '-', 'del'
    ];

    return (
        <div className="w-full max-w-sm mx-auto">
            <div className="w-full h-14 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-4 text-2xl font-mono text-gray-900 dark:text-gray-100">
                {value || <span className="text-gray-400 dark:text-gray-500">(x, y)</span>}
            </div>
            <div className="grid grid-cols-4 gap-2">
                {keys.map(key => (
                    <button
                        key={key}
                        onClick={() => handleKeyPress(key)}
                        disabled={disabled}
                        className={`py-4 rounded-lg font-bold text-xl transition-colors
                            ${key === 'del' ? 'bg-red-500 hover:bg-red-600 col-span-2' : 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500'}
                            disabled:opacity-50 disabled:cursor-not-allowed text-gray-800 dark:text-gray-100`}
                    >
                        {key === 'del' ? 'מחק' : key}
                    </button>
                ))}
            </div>
        </div>
    );
}