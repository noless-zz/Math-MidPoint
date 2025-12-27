import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Question, Point, SUBJECTS, DIFFICULTY_LEVELS, Difficulty, QuestionType, LineEquation, EquationPart, EquationSolution, LineEquationSolution } from '../types.ts';
import { generateQuestion } from '../services/exerciseGenerator.ts';
import CoordinatePlane from './CoordinatePlane.tsx';
import { design } from '../constants/design_system.ts';
import { StarIcon } from './icons.tsx';

// --- HELPER & VISUAL COMPONENTS ---

/**
 * Renders text with math formatting, specifically turning x^n or numbers^n into superscripts.
 * It stops at the first non-alphanumeric character (like space, +, -, etc.)
 */
const MathRenderer: React.FC<{ text: string; className?: string }> = ({ text, className = "" }) => {
    // Regex matches '^' followed by one or more alphanumeric characters
    // Using a capture group so split includes the matched parts
    const parts = text.split(/(\^[a-zA-Z0-9]+)/g);
    return (
        <span className={className}>
            {parts.map((part, i) => {
                if (part.startsWith('^')) {
                    return <sup key={i} className="text-[0.75em] font-bold ml-0.5 leading-none">{part.substring(1)}</sup>;
                }
                return <span key={i}>{part}</span>;
            })}
        </span>
    );
};

const ColoredText: React.FC<{ text: string }> = ({ text }) => {
    const parts = text.split(/([A-Z]\(-?\d+,\s*-?\d+\)|[A-Z]\?)/g);
    if (parts.length <= 1) {
        return <MathRenderer text={text} />;
    }
    return (
        <span dir="rtl">
            {parts.map((part, index) => {
                const match = part.match(/([A-Z])(\(-?\d+,\s*-?\d+\)|\?)/);
                if (match) {
                    const pointName = match[1] as 'A' | 'B' | 'M';
                    const colorClass = design.pointColors[pointName]?.text || design.colors.text.light;
                    const coordinates = match[2];
                    return (
                        <span key={index} className={`font-bold ${colorClass}`}>
                            {pointName}
                            <span dir="ltr" className="inline-block">{coordinates}</span>
                        </span>
                    );
                }
                return <MathRenderer key={index} text={part} />;
            })}
        </span>
    );
};

const SimpleFraction: React.FC<{ numerator: React.ReactNode; denominator: React.ReactNode }> = ({ numerator, denominator }) => (
    <div className="inline-flex flex-col items-center align-middle mx-1 text-lg">
        <span className="px-1">{numerator}</span>
        <hr className="w-full border-t-2 border-current my-1" />
        <span className="px-1">{denominator}</span>
    </div>
);

const EquationDisplay: React.FC<{ parts: EquationPart[] }> = ({ parts }) => (
    <div dir="ltr" className="flex items-center justify-center gap-x-3 text-2xl font-mono my-4 p-4 rounded-lg flex-wrap">
        {parts.map((part, index) => {
            if (part.type === 'fraction') {
                return <SimpleFraction key={index} numerator={<MathRenderer text={part.numerator} />} denominator={<MathRenderer text={part.denominator} />} />;
            }
            if (part.type === 'operator') {
                return <span key={index} className="mx-1 font-bold">{part.value}</span>;
            }
            if (part.type === 'term') {
                return <MathRenderer key={index} text={part.value} />;
            }
            return null;
        })}
    </div>
);

const ColoredPointDisplay: React.FC<{ point: Point }> = ({ point }) => (
    <span dir="ltr" className="inline-block font-bold">
        (<span className={design.pointColors.X.text}>{point.x}</span>, <span className={design.pointColors.Y.text}>{point.y}</span>)
    </span>
);

const ExplanationStepDisplay: React.FC<{ step: string, index: number }> = ({ step, index }) => {
    const parts = step.split(/:(.*)/s);
    const textPart = parts.length > 1 ? parts[0].trim() + ':' : step;
    const contentPart = parts.length > 1 ? parts[1].trim() : null;

    const isMathContent = contentPart && (
        contentPart.includes('x') || 
        contentPart.includes('=') || 
        contentPart.includes('≠') || 
        contentPart.includes('(') || 
        contentPart.includes(')') ||
        contentPart.includes('²') ||
        contentPart.includes('^') ||
        /^\s*[-.m\d]/.test(contentPart)
    );

    return (
        <div className="flex items-start gap-x-4 p-4">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold text-md mt-1">
                {index + 1}
            </div>
            <div className="flex-grow">
                <p className="font-semibold text-gray-800 dark:text-gray-200">{textPart}</p>
                {contentPart && (
                     isMathContent ? (
                        <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
                            <div dir="ltr" className="text-center text-lg font-mono">
                                <MathRenderer text={contentPart} />
                            </div>
                        </div>
                     ) : (
                        <p className="mt-1 text-gray-700 dark:text-gray-300">{contentPart}</p>
                     )
                )}
            </div>
        </div>
    );
};

const ExplanationRenderer: React.FC<{ steps: string[], title: string }> = ({ steps, title }) => (
    <div className="mt-6">
        <h4 className="font-bold text-xl mb-4 text-right">{title}</h4>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
            {steps.map((step, index) => (
                <ExplanationStepDisplay key={index} step={step} index={index} />
            ))}
        </div>
    </div>
);

const inputBaseStyle = "block w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/20 border border-gray-300 dark:border-gray-600 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-lg transition-colors";

const MultiSolutionInput: React.FC<{ values: string[], onChange: (vals: string[]) => void }> = ({ values, onChange }) => {
    const handleValueChange = (index: number, newValue: string) => {
        const newValues = [...values];
        newValues[index] = newValue;
        onChange(newValues);
    };
    return (
        <div className="mt-4 space-y-3">
            <label className="font-bold text-gray-800 dark:text-gray-200">פתרון (x)</label>
            {values.map((value, index) => (
                <div key={index} className="flex items-center gap-2">
                    <span className="font-mono text-xl text-gray-500 dark:text-gray-400">x{values.length > 1 ? index+1 : ''} =</span>
                    <input 
                        type="number"
                        step="any"
                        value={value}
                        onChange={(e) => handleValueChange(index, e.target.value)}
                        className={`${inputBaseStyle} flex-grow text-center`}
                        dir="ltr"
                    />
                </div>
            ))}
             {values.length < 2 && (
                <button onClick={() => onChange([...values, ''])} className="w-full text-sm mt-2 font-semibold text-gray-700 dark:text-gray-300 bg-gray-200/50 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                    + הוסף פתרון נוסף
                </button>
             )}
        </div>
    )
};

const PointInput: React.FC<{ value: Partial<Point>, onChange: (p: Partial<Point>) => void }> = ({ value, onChange }) => (
    <div className="flex flex-col sm:flex-row-reverse gap-4 mt-4" dir="rtl">
        <div className="flex-1">
            <label htmlFor="x-input" className={`${design.pointColors.X.text} font-bold`}>ערך X</label>
            <input id="x-input" type="number" value={value.x ?? ''} onChange={(e) => onChange({ ...value, x: e.target.value === '' ? undefined : parseFloat(e.target.value) })} className={`${inputBaseStyle} text-center mt-1`} dir="ltr" />
        </div>
        <div className="flex-1">
            <label htmlFor="y-input" className={`${design.pointColors.Y.text} font-bold`}>ערך Y</label>
            <input id="y-input" type="number" value={value.y ?? ''} onChange={(e) => onChange({ ...value, y: e.target.value === '' ? undefined : parseFloat(e.target.value) })} className={`${inputBaseStyle} text-center mt-1`} dir="ltr" />
        </div>
    </div>
);

const LineEquationInput: React.FC<{ value: Partial<LineEquationSolution>, onChange: (p: Partial<LineEquationSolution>) => void }> = ({ value, onChange }) => (
    <div className="flex items-center justify-center gap-3 mt-6 p-4 bg-gray-50 dark:bg-gray-800/40 rounded-xl" dir="ltr">
        <span className="text-2xl font-mono font-bold text-gray-700 dark:text-gray-300">y =</span>
        <div className="flex flex-col items-center">
            <input 
                type="number" 
                step="any" 
                placeholder="m"
                value={value.m ?? ''} 
                onChange={(e) => onChange({ ...value, m: e.target.value === '' ? undefined : parseFloat(e.target.value) })} 
                className="w-24 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-center text-xl font-mono focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
            />
            <span className="text-[10px] text-gray-400 mt-1 uppercase">שיפוע</span>
        </div>
        <span className="text-2xl font-mono font-bold text-gray-700 dark:text-gray-300">x +</span>
        <div className="flex flex-col items-center">
            <input 
                type="number" 
                step="any" 
                placeholder="b"
                value={value.b ?? ''} 
                onChange={(e) => onChange({ ...value, b: e.target.value === '' ? undefined : parseFloat(e.target.value) })} 
                className="w-24 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-center text-xl font-mono focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
            />
             <span className="text-[10px] text-gray-400 mt-1 uppercase">חיתוך y</span>
        </div>
    </div>
);

const TextAnswerInput: React.FC<{ value: string, onChange: (v: string) => void, label?: string }> = ({ value, onChange, label = 'תשובה' }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [cursorPos, setCursorPos] = useState(0);

    // Determines if the cursor is currently "inside" a superscript (after a ^ and before a space)
    const isInsideExponent = useCallback(() => {
        const slice = value.slice(0, cursorPos);
        const lastCaret = slice.lastIndexOf('^');
        if (lastCaret === -1) return false;
        const sinceCaret = slice.slice(lastCaret + 1);
        return !sinceCaret.includes(' ');
    }, [value, cursorPos]);

    const toggleSuperscript = () => {
        if (!inputRef.current) return;
        const start = inputRef.current.selectionStart || 0;
        const end = inputRef.current.selectionEnd || 0;
        
        let newValue: string;
        let newPos: number;

        if (isInsideExponent()) {
            // "Exit" superscript mode by adding a space
            newValue = value.slice(0, start) + ' ' + value.slice(end);
            newPos = start + 1;
        } else {
            // "Enter" superscript mode by adding ^
            newValue = value.slice(0, start) + '^' + value.slice(end);
            newPos = start + 1;
        }

        onChange(newValue);
        setCursorPos(newPos);
        
        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
                inputRef.current.setSelectionRange(newPos, newPos);
            }
        }, 0);
    };

    const handleInputClick = () => {
        if (inputRef.current) setCursorPos(inputRef.current.selectionStart || 0);
    };

    const handleKeyUp = () => {
        if (inputRef.current) setCursorPos(inputRef.current.selectionStart || 0);
    };

    const isInSupMode = isInsideExponent();

    return (
        <div className="mt-4">
            <label className="font-bold flex justify-between items-center mb-2">
                <span>{label}</span>
                <button 
                    onClick={toggleSuperscript} 
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all border-2 ${isInSupMode ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-indigo-50 hover:border-indigo-300'}`}
                    title={isInSupMode ? "חזור לכתב רגיל (רווח)" : "עבור לכתב עילי (^)"}
                >
                    <span className="text-xs uppercase tracking-tighter">חזקה</span>
                    <span className="text-lg leading-none">xⁿ</span>
                </button>
            </label>
            <div className="relative">
                <input 
                    ref={inputRef}
                    type="text" 
                    value={value} 
                    onChange={(e) => {
                        onChange(e.target.value);
                        setCursorPos(e.target.selectionStart || 0);
                    }} 
                    onClick={handleInputClick}
                    onKeyUp={handleKeyUp}
                    className={`${inputBaseStyle} text-center font-mono`} 
                    dir="ltr" 
                    placeholder="הקלידו תשובה..." 
                />
                
                {value.length > 0 && (
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-center">
                        <span className="text-xs text-gray-400 block mb-1 uppercase tracking-widest font-bold">תצוגה מקדימה</span>
                        <div className="text-2xl font-mono text-gray-700 dark:text-gray-200 overflow-x-auto whitespace-nowrap py-1">
                            <MathRenderer text={value} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const PracticeConfig: React.FC<{ onStart: (config: { subjects: string[]; difficulty: Difficulty['id'] }) => void }> = ({ onStart }) => {
  const practiceSubjects = Object.values(SUBJECTS).filter(s => s.practice);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(practiceSubjects.map(subject => subject.id));
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty['id']>('medium');

  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubjects(prev =>
      prev.includes(subjectId)
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSubjects.length > 0) {
      onStart({ subjects: selectedSubjects, difficulty: selectedDifficulty });
    }
  };

  return (
    <div className={design.layout.card}>
      <h2 className={design.typography.sectionTitle}>הגדרות תרגול</h2>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <h3 className="text-xl font-bold mb-4 text-right">נושאים לתרגול</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {practiceSubjects.map(subject => (
              <label key={subject.id} className={`flex items-center p-3 rounded-lg cursor-pointer transition-all border-2 ${selectedSubjects.includes(subject.id) ? `border-indigo-500 bg-indigo-50 dark:bg-indigo-900/50` : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                <input type="checkbox" checked={selectedSubjects.includes(subject.id)} onChange={() => handleSubjectChange(subject.id)} className="h-5 w-5 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300" />
                <span className="mr-3 font-medium text-gray-800 dark:text-gray-200">{subject.name}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-xl font-bold mb-4 text-right">רמת קושי</h3>
          <div className="grid grid-cols-3 gap-4">
            {Object.values(DIFFICULTY_LEVELS).map(level => (
              <label key={level.id} className={`text-center p-4 rounded-lg cursor-pointer transition-all border-2 ${selectedDifficulty === level.id ? `border-indigo-500 bg-indigo-50 dark:bg-indigo-900/50` : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                <input type="radio" name="difficulty" value={level.id} checked={selectedDifficulty === level.id} onChange={() => setSelectedDifficulty(level.id)} className="sr-only" />
                <span className="font-bold text-lg text-gray-800 dark:text-gray-200">{level.name}</span>
              </label>
            ))}
          </div>
        </div>
        <button type="submit" disabled={selectedSubjects.length === 0} className={`w-full ${design.components.button.base} ${design.components.button.primary} ${design.components.button.disabled}`}>
          התחל תרגול
        </button>
      </form>
    </div>
  );
};

// --- NEW COMPONENT FOR DEBUGGING ---
const CheatSheet: React.FC<{ solution: any }> = ({ solution }) => {
    const renderSolution = () => {
        if (typeof solution === 'string') return <MathRenderer text={solution} />;
        if (typeof solution === 'number') return solution.toFixed(2);
        if (typeof solution === 'object' && solution !== null) {
            if ('value' in solution) return `ערכים: ${solution.value.map(v => v.toFixed(2)).join(', ')}`;
            if ('x' in solution) return `נקודה: (${solution.x.toFixed(2)}, ${solution.y.toFixed(2)})`;
            if ('m' in solution) return <span dir="ltr">קו: y = {solution.m.toFixed(2)}x + {solution.b.toFixed(2)}</span>;
        }
        return JSON.stringify(solution);
    };

    return (
        <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 border-dashed rounded-lg">
            <p className="text-yellow-700 dark:text-yellow-300 font-bold mb-1">מוד בדיקה (לסנר נועם בלבד):</p>
            <div className="font-mono text-lg" dir="ltr">{renderSolution()}</div>
        </div>
    );
};

const PracticeSession = ({ config, user, updateUser, onBack }) => {
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [userAnswer, setUserAnswer] = useState<any>(null);
    const [multiAnswers, setMultiAnswers] = useState<string[]>(['']);
    const [feedback, setFeedback] = useState<{ isCorrect: boolean; detailedExplanation: string[]; earnedScore: number } | null>(null);
    const [attempts, setAttempts] = useState(0);
    const [potentialScore, setPotentialScore] = useState(0);
    const [selectedMcq, setSelectedMcq] = useState<number | string | null>(null);

    const setupNewQuestion = useCallback((question: Question) => {
        setCurrentQuestion(question);
        setFeedback(null);
        setAttempts(0);
        setSelectedMcq(null);
        setMultiAnswers(['']);
        setUserAnswer(null);
        
        const difficulty = DIFFICULTY_LEVELS[question.difficulty.toUpperCase()] || DIFFICULTY_LEVELS.MEDIUM;
        setPotentialScore(Math.round(10 * difficulty.multiplier));
    }, []);
    
    useEffect(() => {
        if(config) { setupNewQuestion(generateQuestion(config)); }
    }, [config, setupNewQuestion]);

    const checkAnswer = () => {
        if (!currentQuestion) return;
        let isCorrect = false;
        const { solution } = currentQuestion;

        if (typeof solution === 'object' && solution !== null && 'value' in solution) {
            // Equation solution (single or multiple values)
            const userValues = multiAnswers.map(v => parseFloat(v)).filter(v => !isNaN(v)).sort((a,b)=>a-b);
            const solValues = [...(solution.value || [])].sort((a,b)=>a-b);
            if (userValues.length === solValues.length) {
                isCorrect = userValues.every((v, i) => Math.abs(v - solValues[i]) < 0.02);
            }
        } else if (typeof solution === 'object' && solution !== null && 'x' in solution) {
            // Point solution
            if (userAnswer && 'x' in userAnswer) {
                isCorrect = Math.abs(userAnswer.x - solution.x) < 0.01 && Math.abs(userAnswer.y - solution.y) < 0.01;
            }
        } else if (typeof solution === 'object' && solution !== null && 'm' in solution) {
            // Line solution
            if (userAnswer && 'm' in userAnswer) {
                isCorrect = Math.abs(userAnswer.m - solution.m) < 0.01 && Math.abs(userAnswer.b - solution.b) < 0.01;
            }
        } else if (typeof solution === 'number') {
            const val = parseFloat(userAnswer);
            isCorrect = !isNaN(val) && Math.abs(val - solution) < 0.01;
        } else if (typeof solution === 'string') {
            // Normalize spaces for text comparison
            // Normalize exponents: convert Unicode ² and ³ to ^2 and ^3 for comparison
            const normalize = (s: string) => s.replace(/\s+/g, '').replace(/²/g, '^2').replace(/³/g, '^3').toLowerCase();
            isCorrect = normalize(userAnswer || '') === normalize(solution);
        }

        if (isCorrect) {
            setFeedback({ isCorrect: true, detailedExplanation: currentQuestion.detailedExplanation, earnedScore: potentialScore });
            updateUser(potentialScore, 1, currentQuestion.subjectId);
        } else {
            setAttempts(prev => prev + 1);
            setPotentialScore(prev => Math.round(prev * 0.7));
            if (attempts >= 2) {
                setFeedback({ isCorrect: false, detailedExplanation: currentQuestion.detailedExplanation, earnedScore: 0 });
            }
        }
    };

    if (!currentQuestion) {
        return (
            <div className="max-w-3xl mx-auto flex flex-col items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4"></div>
                <p className="text-xl font-semibold text-gray-600 dark:text-gray-400">מכין שאלה עבורך...</p>
            </div>
        );
    }

    const renderAnswerInput = () => {
        if (!currentQuestion) return null;

        // 1. MCQ or Quadrant questions
        if (currentQuestion.type.includes('MCQ') || currentQuestion.type === 'IDENTIFY_QUADRANT') {
            return (
                <div className="grid grid-cols-2 gap-4 mt-4">
                    {currentQuestion.options?.map((opt, i) => (
                        <button key={i} onClick={() => { setSelectedMcq(i); setUserAnswer(opt); }} className={`${design.practice.mcqButton} ${selectedMcq === i ? 'ring-2 ring-indigo-500' : ''}`}>
                            {typeof opt === 'object' && opt !== null && 'x' in opt ? (
                                <ColoredPointDisplay point={opt as Point} />
                            ) : (
                                <MathRenderer text={String(opt)} />
                            )}
                        </button>
                    ))}
                </div>
            );
        }

        // 2. Line equation specific (must come before generic EQUATION check)
        if (currentQuestion.type === 'FIND_LINE_EQUATION' || currentQuestion.type === 'FIND_TANGENT_EQUATION') {
            return <LineEquationInput value={userAnswer || {}} onChange={setUserAnswer} />;
        }

        // 3. General Algebraic Equations (Solving for x)
        if (currentQuestion.type === 'SOLVE_QUADRATIC_EQUATION' || currentQuestion.type.includes('EQUATION')) {
            return <MultiSolutionInput values={multiAnswers} onChange={setMultiAnswers} />;
        }

        // 4. Coordinate points
        if (currentQuestion.type.includes('POINT')) {
            return <PointInput value={userAnswer || {}} onChange={setUserAnswer} />;
        }

        // 5. Calculus derivatives (Text based)
        if (currentQuestion.type === 'CALCULATE_DERIVATIVE') {
            return <TextAnswerInput value={userAnswer || ''} onChange={setUserAnswer} label="הנגזרת f'(x)" />;
        }

        // 6. Generic text/numeric input
        return <TextAnswerInput value={userAnswer || ''} onChange={setUserAnswer} />;
    };

    const showCheatSheet = user?.username === 'לסנר נועם';
    const currentSubject = Object.values(SUBJECTS).find(s => s.id === currentQuestion.subjectId);

    return (
        <div className="max-w-3xl mx-auto pb-20">
            <div className="flex justify-between mb-4">
                <button onClick={onBack} className="text-indigo-600 font-bold hover:underline">חזרה להגדרות</button>
                <div className="flex items-center gap-2">
                    <StarIcon className="h-5 w-5 text-yellow-500" />
                    <span className="font-bold">{potentialScore} נק'</span>
                </div>
            </div>
            
            <div className={design.layout.card}>
                {currentSubject && (
                    <div className="mb-6 flex items-center justify-between border-b pb-4">
                        <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-md font-bold uppercase tracking-wider">{currentSubject.category}</span>
                        <h4 className="text-sm font-medium text-gray-400">נושא: {currentSubject.name}</h4>
                    </div>
                )}

                <h3 className="text-xl font-bold mb-6 text-gray-800 dark:text-gray-100 leading-tight">
                    <ColoredText text={currentQuestion.question} />
                </h3>

                {currentQuestion.equationParts && <EquationDisplay parts={currentQuestion.equationParts} />}
                
                {currentQuestion.points && (
                    <div className="mb-8 overflow-hidden rounded-2xl">
                        <CoordinatePlane points={currentQuestion.points} />
                    </div>
                )}

                {!feedback ? (
                    <div className="space-y-6">
                        {renderAnswerInput()}
                        <button onClick={checkAnswer} className={`w-full ${design.components.button.base} ${design.components.button.primary} shadow-indigo-200 dark:shadow-none shadow-lg mt-8`}>
                            בדוק תשובה
                        </button>
                    </div>
                ) : (
                    <div className={`mt-6 p-6 rounded-xl ${feedback.isCorrect ? 'bg-green-50 dark:bg-green-900/20 border border-green-200' : 'bg-red-50 dark:bg-red-900/20 border border-red-200'}`}>
                        <h4 className={`text-2xl font-bold mb-2 ${feedback.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                            {feedback.isCorrect ? 'כל הכבוד! הצלחת' : 'לא בדיוק... כדאי לעבור על ההסבר'}
                        </h4>
                        <ExplanationRenderer steps={feedback.detailedExplanation} title="דרך הפתרון המלאה:" />
                        <button onClick={() => setupNewQuestion(generateQuestion(config))} className={`w-full mt-8 ${design.components.button.base} ${design.components.button.primary}`}>
                            לשאלה הבאה
                        </button>
                    </div>
                )}
            </div>

            {showCheatSheet && !feedback && (
                <CheatSheet solution={currentQuestion.solution} />
            )}
        </div>
    );
};

export default function PracticeEngine({ user, updateUser }: { user: any, updateUser: (s: number, e: number, subjectId: string) => void }) {
    const [config, setConfig] = useState<{ subjects: string[]; difficulty: Difficulty['id'] } | null>(null);
    if (!config) return <PracticeConfig onStart={setConfig} />;
    return <PracticeSession config={config} user={user} updateUser={updateUser} onBack={() => setConfig(null)} />;
}
