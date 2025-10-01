
import React from 'react';

const FormulaBox: React.FC<{ title: string; formula: string; explanation: string }> = ({ title, formula, explanation }) => (
    <div className="bg-indigo-50 dark:bg-indigo-900/50 border-r-4 border-indigo-500 p-6 rounded-lg">
        <h3 className="text-xl font-semibold text-indigo-800 dark:text-indigo-200">{title}</h3>
        <div className="text-2xl font-mono my-4 p-4 bg-white dark:bg-gray-800 rounded-md text-center text-gray-800 dark:text-gray-100 shadow-inner">
            {formula}
        </div>
        <p className="text-indigo-700 dark:text-indigo-300">{explanation}</p>
    </div>
);

// Fix: Replaced JSX.Element with React.ReactElement to resolve "Cannot find namespace 'JSX'" error.
export default function LearnSection(): React.ReactElement {
  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg max-w-4xl mx-auto">
      <h2 className="text-4xl font-bold text-center mb-4 text-gray-900 dark:text-white">אמצע של קטע</h2>
      <p className="text-lg text-gray-600 dark:text-gray-300 text-center mb-10">
        בואו נלמד על הקשר בין שיעורי שתי נקודות המהוות קצות קטע, לבין שיעורי נקודת האמצע שלו.
      </p>

      <div className="mb-12">
        <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">הנוסחה</h3>
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          כאשר נתון קטע AB שקצותיו הן הנקודות <span>A(x₁, y₁)</span> ו-<span>B(x₂, y₂)</span>,
          ונקודה M היא אמצע הקטע AB, אז מתקיים:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormulaBox 
                title="שיעור ה-X של נקודת האמצע"
                formula="Xm = (x₁ + x₂) / 2"
                explanation="שיעור ה-X של נקודת האמצע הוא הממוצע של שיעורי ה-X של נקודות הקצה."
            />
            <FormulaBox 
                title="שיעור ה-Y של נקודת האמצע"
                formula="Ym = (y₁ + y₂) / 2"
                explanation="שיעור ה-Y של נקודת האמצע הוא הממוצע של שיעורי ה-Y של נקודות הקצה."
            />
        </div>
      </div>

      <div className="text-center p-6 bg-gray-100 dark:bg-gray-700 rounded-lg">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">במילים אחרות...</h3>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          כדי למצוא את נקודת האמצע, פשוט מחשבים את הממוצע של קואורדינטות ה-X ואת הממוצע של קואורדינטות ה-Y בנפרד.
        </p>
      </div>

       <div className="mt-12">
            <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">דוגמה ויזואלית</h3>
            <div className="flex justify-center p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                 <svg viewBox="0 0 200 150" className="w-full max-w-md">
                    {/* Grid lines */}
                    <path d="M 10 10 H 190 M 10 75 H 190 M 10 140 H 190" stroke="#e2e8f0" strokeWidth="0.5" />
                    <path d="M 10 10 V 140 M 100 10 V 140 M 190 10 V 140" stroke="#e2e8f0" strokeWidth="0.5" />
                    {/* Axes */}
                    <path d="M 10 75 H 190" stroke="currentColor" strokeWidth="1" />
                    <path d="M 100 10 V 140" stroke="currentColor" strokeWidth="1" />
                    <text x="195" y="78" fill="currentColor" fontSize="8">x</text>
                    <text x="97" y="8" fill="currentColor" fontSize="8">y</text>
                    
                    {/* Line AB */}
                    <line x1="30" y1="120" x2="170" y2="30" stroke="#4f46e5" strokeWidth="2" />
                    
                    {/* Point A */}
                    <circle cx="30" cy="120" r="3" fill="#34d399" />
                    <text x="20" y="135" fill="currentColor" fontSize="10">A(x₁, y₁)</text>
                    
                    {/* Point B */}
                    <circle cx="170" cy="30" r="3" fill="#fb923c" />
                    <text x="165" y="25" fill="currentColor" fontSize="10">B(x₂, y₂)</text>

                    {/* Point M */}
                    <circle cx="100" cy="75" r="4" fill="#f43f5e" />
                    <text x="105" y="85" fill="currentColor" fontSize="10" fontWeight="bold">M(Xm, Ym)</text>
                </svg>
            </div>
        </div>
    </div>
  );
}