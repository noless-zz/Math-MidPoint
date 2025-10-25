import React, { useState, useCallback, useEffect } from 'react';
import { Question, Point, SUBJECTS, DIFFICULTY_LEVELS, Difficulty, QuestionType, LineEquation, EquationPart, EquationSolution, LineEquationSolution } from '../types.ts';
import { generateQuestion } from '../services/exerciseGenerator.ts';
import CoordinatePlane from './CoordinatePlane.tsx';
import { design } from '../constants/design_system.ts';
import { StarIcon } from './icons.tsx';
import { GoogleGenAI } from '@google/genai';

// --- HELPER & VISUAL COMPONENTS ---

const ColoredText: React.FC<{ text: string }> = ({ text }) => {
    const parts = text.split(/([A-Z]\(-?\d+,\s*-?\d+\)|[A-Z]\?)/g);
    if (parts.length <= 1) {
        return <span dir="rtl">{text}</span>
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
                return <span key={index}>{part}</span>;
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
                return <SimpleFraction key={index} numerator={<span>{part.numerator}</span>} denominator={<span>{part.denominator}</span>} />;
            }
            if (part.type === 'operator') {
                return <span key={index} className="mx-1 font-bold">{part.value}</span>;
            }
            if (part.type === 'term') {
                return <span key={index}>{part.value}</span>;
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

// --- NEW EXPLANATION RENDERER ---
const ExplanationStepDisplay: React.FC<{ step: string, index: number }> = ({ step, index }) => {
    const parts = step.split(/:(.*)/s); // Split on the first colon
    const textPart = parts.length > 1 ? parts[0].trim() + ':' : step;
    const contentPart = parts.length > 1 ? parts[1].trim() : null;

    // Heuristic to check if the content is a mathematical expression to be highlighted
    const isMathContent = contentPart && (
        contentPart.includes('x') || 
        contentPart.includes('=') || 
        contentPart.includes('≠') || 
        contentPart.includes('(') || 
        contentPart.includes(')') ||
        contentPart.includes('²')
    );


    return (
        <div className="flex items-start gap-x-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            {/* Step Number */}
            <div className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold text-md mt-1">
                {index + 1}
            </div>
            {/* Content */}
            <div className="flex-grow">
                <p className="font-semibold text-gray-800 dark:text-gray-200">{textPart}</p>
                {contentPart && (
                     isMathContent ? (
                        <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900/50 border-l-4 border-purple-500 rounded-md">
                            <p dir="ltr" className="text-center text-lg">{contentPart}</p>
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
        <div className="space-y-3">
            {steps.map((step, index) => (
                <ExplanationStepDisplay key={index} step={step} index={index} />
            ))}
        </div>
    </div>
);

// --- PRACTICE-SPECIFIC INPUT & DISPLAY COMPONENTS ---

const inputBaseStyle = "block w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/20 border border-gray-300 dark:border-gray-600 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-lg transition-colors";

const SolutionInput: React.FC<{ values: string[], onChange: (vals: string[]) => void }> = ({ values, onChange }) => {
    const handleValueChange = (index: number, newValue: string) => {
        const newValues = [...values];
        newValues[index] = newValue;
        onChange(newValues);
    };

    const addInput = () => {
        onChange([...values, '']);
    };

    const removeInput = (index: number) => {
        if (values.length > 1) {
            onChange(values.filter((_, i) => i !== index));
        }
    };
    
    return (
        <div className="mt-4 space-y-3">
            <label className="font-bold text-gray-800 dark:text-gray-200">פתרון (x)</label>
            {values.map((value, index) => (
                <div key={index} className="flex items-center gap-2">
                    <span className="font-mono text-xl text-gray-500 dark:text-gray-400">x =</span>
                    <input 
                        type="number"
                        step="any"
                        value={value}
                        onChange={(e) => handleValueChange(index, e.target.value)}
                        className={`${inputBaseStyle} flex-grow text-center`}
                        dir="ltr"
                    />
                    <button 
                        onClick={() => removeInput(index)}
                        className={`p-2 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors ${values.length <= 1 ? 'opacity-0 cursor-default' : ''}`}
                        title="הסר פתרון"
                        disabled={values.length <= 1}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </div>
            ))}
             <button
                onClick={addInput}
                className={`w-full text-sm mt-2 font-semibold text-gray-700 dark:text-gray-300 bg-gray-200/50 dark:bg-gray-700/50 py-2.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors`}
            >
                + הוסף פתרון
            </button>
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
    <div className="flex flex-col sm:flex-row-reverse gap-4 mt-4" dir="rtl">
        <div className="flex-1">
            <label htmlFor="m-input" className={`${design.pointColors.X.text} font-bold`}>שיפוע (m)</label>
            <input id="m-input" type="number" step="any" value={value.m ?? ''} onChange={(e) => onChange({ ...value, m: e.target.value === '' ? undefined : parseFloat(e.target.value) })} className={`${inputBaseStyle} text-center mt-1`} dir="ltr" />
        </div>
        <div className="flex-1">
            <label htmlFor="b-input" className={`${design.pointColors.Y.text} font-bold`}>נקודת חיתוך (b)</label>
            <input id="b-input" type="number" step="any" value={value.b ?? ''} onChange={(e) => onChange({ ...value, b: e.target.value === '' ? undefined : parseFloat(e.target.value) })} className={`${inputBaseStyle} text-center mt-1`} dir="ltr" />
        </div>
    </div>
);

const NumberInput: React.FC<{ value: string, onChange: (n: string) => void, label?: string }> = ({ value, onChange, label = 'תשובה' }) => (
     <div className="mt-4">
        <label htmlFor="num-input" className={`font-bold`}>{label}</label>
        <input id="num-input" type="number" step="any" value={value ?? ''} onChange={(e) => onChange(e.target.value)} className={`${inputBaseStyle} text-center mt-1`} dir="ltr" />
    </div>
);

const DomainInput: React.FC<{ values: string[], onChange: (vals: string[]) => void }> = ({ values, onChange }) => {
    const handleValueChange = (index: number, newValue: string) => {
        const newValues = [...values];
        newValues[index] = newValue;
        onChange(newValues);
    };

    const addInput = () => {
        onChange([...values, '']);
    };

    const removeInput = (index: number) => {
        if (values.length >= 1) { // Allow removing even the last one
            onChange(values.filter((_, i) => i !== index));
        }
    };
    
    return (
        <div className="mt-6 space-y-3">
            <label className="font-bold text-gray-800 dark:text-gray-200">תחום הגדרה (ערכים ש-x אינו שווה להם)</label>
            {values.map((value, index) => (
                <div key={index} className="flex items-center gap-2">
                    <span className="font-mono text-xl text-gray-500 dark:text-gray-400">x &ne;</span>
                    <input 
                        type="number"
                        step="any"
                        value={value}
                        onChange={(e) => handleValueChange(index, e.target.value)}
                        className={`${inputBaseStyle} flex-grow text-center`}
                        dir="ltr"
                    />
                    <button 
                        onClick={() => removeInput(index)}
                        className={`p-2 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors`}
                        title="הסר תחום"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </div>
            ))}
             <button
                onClick={addInput}
                className={`w-full text-sm mt-2 font-semibold text-gray-700 dark:text-gray-300 bg-gray-200/50 dark:bg-gray-700/50 py-2.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors`}
            >
                + הוסף תחום
            </button>
        </div>
    )
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
      <p className={`${design.colors.text.muted.light} dark:${design.colors.text.muted.dark} text-center mb-6`}>בחר/י נושא אחד או יותר ורמת קושי כדי להתחיל.</p>
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

const PracticeSession = ({ config, updateUser, onBack }) => {
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [userAnswer, setUserAnswer] = useState<Partial<Point> | string | Partial<LineEquationSolution> | null>(null);
    const [equationSolutions, setEquationSolutions] = useState<string[]>(['']);
    const [userDomain, setUserDomain] = useState<string[]>(['']);
    const [feedback, setFeedback] = useState<{ isCorrect: boolean; detailedExplanation: string[]; earnedScore: number } | null>(null);
    const [attempts, setAttempts] = useState(0);
    const [potentialScore, setPotentialScore] = useState(0);
    const [selectedMcq, setSelectedMcq] = useState<number | string | null>(null);
    const [revealedSteps, setRevealedSteps] = useState<string[]>([]);
    
    const isPoint = (val: any): val is Point => typeof val === 'object' && val !== null && 'x' in val && 'y' in val;
    const isPointAnswer = (val: any): val is {x: any, y: any} => typeof val === 'object' && val !== null && 'x' in val && 'y' in val;
    const isEquationSolution = (sol: any): sol is EquationSolution =>  typeof sol === 'object' && sol !== null && 'value' in sol && 'domain' in sol;
    const isLineEquationSolution = (sol: any): sol is LineEquationSolution => typeof sol === 'object' && sol !== null && 'm' in sol && 'b' in sol;
    const isLineEqSolutionAnswer = (val: any): val is {m: any, b: any} => typeof val === 'object' && val !== null && 'm' in val && 'b' in val;


    const setupNewQuestion = useCallback((question: Question) => {
        setCurrentQuestion(question);
        setFeedback(null);
        setAttempts(0);
        setSelectedMcq(null);
        setRevealedSteps([]);

        // Reset answers based on new question type
        if (isEquationSolution(question.solution)) {
            setEquationSolutions(['']);
            setUserDomain(question.difficulty === 'hard' ? [''] : []);
            setUserAnswer(null);
        } else if (isLineEquationSolution(question.solution)) {
            setUserAnswer({ m: undefined, b: undefined });
            setEquationSolutions(['']);
            setUserDomain([]);
        } else {
             setUserAnswer(null);
             setEquationSolutions(['']);
             setUserDomain([]);
        }

        const difficulty = DIFFICULTY_LEVELS[question.difficulty.toUpperCase()];
        const baseScore = Math.round(10 * difficulty.multiplier);
        setPotentialScore(baseScore);
    }, []);
    
    useEffect(() => {
        if(config) {
            setupNewQuestion(generateQuestion(config));
        }
    }, [config, setupNewQuestion]);

    const checkAnswer = () => {
        if (!currentQuestion) return;
        
        let isCorrect = false;
        const { solution } = currentQuestion;

        if (isLineEquationSolution(solution)) {
            if (isLineEqSolutionAnswer(userAnswer) && typeof userAnswer.m === 'number' && typeof userAnswer.b === 'number') {
                if (Math.abs(userAnswer.m - solution.m) < 0.01 && Math.abs(userAnswer.b - solution.b) < 0.01) {
                    isCorrect = true;
                }
            }
        } else if (isEquationSolution(solution)) {
            const userDomainNumbers = userDomain.filter(d => d.trim() !== '').map(d => parseFloat(d)).sort((a, b) => a - b);
            const solutionDomain = [...solution.domain].sort((a,b)=>a-b);
            
            const domainCorrect = currentQuestion.difficulty !== 'hard' || (userDomainNumbers.length === solutionDomain.length && userDomainNumbers.every((val, index) => Math.abs(val - solutionDomain[index]) < 0.01));

            const userValues = equationSolutions
                .map(val => val.trim())
                .filter(val => val !== '')
                .map(val => parseFloat(val))
                .filter(val => !isNaN(val))
                .sort((a, b) => a - b);

            const solutionValues = solution.value === null ? [] : [...solution.value].sort((a,b)=>a-b);
            
            let valueCorrect = false;

            if (solution.value === null) {
                valueCorrect = userValues.length === 0;
            } else if (currentQuestion.difficulty === 'hard') {
                // For hard, we need an exact match of all solutions
                if (userValues.length === solutionValues.length) {
                     valueCorrect = userValues.every((val, index) => Math.abs(val - solutionValues[index]) < 0.015);
                }
            } else {
                // For easy/medium, user enters one solution, check if it's one of the correct ones.
                if (userValues.length === 1) {
                    valueCorrect = solution.value.some(v => Math.abs(userValues[0] - v) < 0.015);
                }
            }
            
            isCorrect = valueCorrect && domainCorrect;

        } else if (isPoint(solution)) {
            if (isPointAnswer(userAnswer) && typeof userAnswer.x === 'number' && typeof userAnswer.y === 'number') {
               if (Math.abs(userAnswer.x - solution.x) < 0.01 && Math.abs(userAnswer.y - solution.y) < 0.01) {
                  isCorrect = true;
               }
            }
        } else if (typeof solution === 'number') {
            const ua = typeof userAnswer === 'string' ? parseFloat(userAnswer) : userAnswer as number;
            if (typeof ua === 'number' && !isNaN(ua) && Math.abs(ua - solution) < 0.01) {
                isCorrect = true;
            }
        } else if (typeof solution === 'string') {
             if (userAnswer === solution) {
                isCorrect = true;
             }
        }
        
        const newAttempts = attempts + 1;

        if (isCorrect) {
            setFeedback({ isCorrect: true, detailedExplanation: [currentQuestion.explanation, ...currentQuestion.detailedExplanation], earnedScore: potentialScore });
            updateUser(potentialScore, 1, currentQuestion.subjectId);
            setRevealedSteps([]);
        } else { // Incorrect
            setAttempts(newAttempts);
            const allSteps = [currentQuestion.explanation, ...currentQuestion.detailedExplanation];
            const maxHints = allSteps.length;
            
            setPotentialScore(prev => Math.round(prev * 0.75));

            if (newAttempts >= 3 || revealedSteps.length >= maxHints - 1) {
                 setFeedback({ isCorrect: false, detailedExplanation: allSteps, earnedScore: 0 });
                 setRevealedSteps([]);
            } else {
                setRevealedSteps(allSteps.slice(0, revealedSteps.length + 1));
            }
        }
    };
    
    const nextQuestion = () => {
        setupNewQuestion(generateQuestion(config));
    };
    
    const handleMcqSelect = (option: Point | number | string, index: number) => {
      setUserAnswer(isPoint(option) ? option : String(option));
      setSelectedMcq(typeof option === 'string' ? option : index);
    };

    const getSubjectNameFromType = (type: QuestionType): string => {
        if (type === 'SOLVE_EQUATION_VARIABLE_DENOMINATOR') {
            return SUBJECTS.EQUATIONS_WITH_VARIABLE_DENOMINATOR.name;
        }
        const subjectEntry = Object.values(SUBJECTS).find(s => type.toLowerCase().includes(s.id.split('_')[0]));
        return subjectEntry ? subjectEntry.name : 'שאלה כללית';
    };
    
    const renderRevealedHints = () => {
        if (revealedSteps.length === 0 || feedback) return null;

        return (
            <div className="mt-6 p-6 rounded-xl bg-yellow-100 dark:bg-yellow-900/50">
                <ExplanationRenderer steps={revealedSteps} title="רמזים:" />
            </div>
        );
    };

    const formatSolution = (solution: Question['solution']) => {
        if (isLineEquationSolution(solution)) {
            const bSign = solution.b >= 0 ? '+' : '-';
            const bAbs = Math.abs(solution.b).toFixed(2).replace(/\.00$/, '');
            const mStr = solution.m.toFixed(2).replace(/\.00$/, '');
            return `y = ${mStr}x ${bSign} ${bAbs}`;
        }
        if (isEquationSolution(solution)) {
            const valStr = solution.value === null 
                ? 'אין פתרון' 
                : solution.value.map(v => `x = ${v.toFixed(2).replace(/\.0+$/,'').replace(/\.$/,'')}`).join(' או ');
            const domainStr = solution.domain.length > 0 ? `תחום הגדרה: x ≠ ${solution.domain.join(', x ≠ ')}` : '';
            return `${valStr}${domainStr ? `, ${domainStr}` : ''}`;
        }
        if (isPoint(solution)) return <ColoredPointDisplay point={solution} />;
        if (typeof solution === 'number') return solution.toFixed(2).replace(/\.00$/, '');
        return String(solution);
    };
    
    // --- RENDER LOGIC ---

    if (!currentQuestion) {
        return <div className="text-center p-10 font-bold">טוען שאלה...</div>
    }

    const isMcq = currentQuestion.type.includes('MCQ') || currentQuestion.type === 'IDENTIFY_QUADRANT';
    const isVisual = currentQuestion.type.includes('VISUAL');
    const solutionIsEquation = isEquationSolution(currentQuestion.solution);
    const solutionIsPoint = isPoint(currentQuestion.solution);
    const solutionIsLineEq = isLineEquationSolution(currentQuestion.solution);
    
    const renderAnswerArea = () => {
        if (isVisual) {
            return userAnswer ? <p className="text-center font-semibold mb-2" dir="rtl">הבחירה שלך: <ColoredPointDisplay point={userAnswer as Point} /></p> : null;
        }
        if (isMcq) {
            return (
                <div className="grid grid-cols-2 gap-4 my-2">
                    {currentQuestion.options?.map((option, i) => (
                        <button key={i} onClick={() => handleMcqSelect(option, i)} className={`${design.practice.mcqButton} ${selectedMcq === (typeof option === 'string' ? option : i) ? `ring-2 ${design.pointColors.M.text.replace('text-', 'ring-')}` : ''}`}>
                            {isPoint(option) ? <ColoredPointDisplay point={option} /> : <span className="font-bold text-lg">{option}</span>}
                        </button>
                    ))}
                </div>
            );
        }
        if (solutionIsLineEq) {
            return <LineEquationInput value={userAnswer as Partial<LineEquationSolution> || {}} onChange={setUserAnswer} />;
        }
        if (solutionIsEquation) {
            if (currentQuestion.difficulty === 'hard') {
                return (
                    <>
                        <SolutionInput values={equationSolutions} onChange={setEquationSolutions} />
                        <DomainInput values={userDomain} onChange={setUserDomain} />
                    </>
                );
            }
            return (
                <>
                    <NumberInput value={equationSolutions[0] || ''} onChange={(val) => setEquationSolutions([val])} label="פתרון (x)" />
                </>
            );
        }
        if (solutionIsPoint) {
            return <PointInput value={userAnswer as Partial<Point> || {}} onChange={setUserAnswer} />;
        }
        return <NumberInput value={userAnswer as string || ''} onChange={(val) => setUserAnswer(val)} />;
    };
    
    const isAnswerEmpty = () => {
        if(solutionIsEquation) {
            return !equationSolutions || equationSolutions.length === 0 || equationSolutions.every(s => s.trim() === '');
        }
         if (solutionIsLineEq) {
            const ans = userAnswer as Partial<LineEquationSolution>;
            return ans.m === undefined || ans.b === undefined;
        }
        return userAnswer === null;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-4">
             <div className="flex justify-between items-center px-2">
                 <button onClick={onBack} className="text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-600">
                    חזרה להגדרות
                </button>
                <div className="text-sm font-semibold text-blue-800 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/40 px-4 py-2 rounded-full">
                    ניסיונות שנותרו: <span className="font-black">{3 - attempts}</span>
                </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700/50">
                <div className="flex flex-col text-right">
                    <h3 className="text-base font-semibold text-gray-600 dark:text-gray-400">{getSubjectNameFromType(currentQuestion.type)}:</h3>
                    
                    <div className="my-4 p-6 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <div className="text-xl md:text-2xl font-bold my-2 text-gray-800 dark:text-gray-100">
                           <ColoredText text={currentQuestion.question} />
                        </div>
                        {currentQuestion.equationParts && <EquationDisplay parts={currentQuestion.equationParts} />}
                    </div>
                       
                    {!feedback ? (
                        <>
                            {renderAnswerArea()}
                            {renderRevealedHints()}
                            <button onClick={checkAnswer} disabled={isAnswerEmpty()} className={`w-full mt-8 py-3 px-4 rounded-lg font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-gray-400 disabled:cursor-not-allowed`}>
                                בדוק/י תשובה
                            </button>
                        </>
                    ) : (
                        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-right">
                           <h3 className="text-2xl font-bold mb-2">{feedback.isCorrect ? 'כל הכבוד!' : 'תשובה שגויה'}</h3>
                           
                           {!feedback.isCorrect && (
                                <p className="mb-6 text-lg">
                                    התשובה הנכונה היא: <span className="font-bold">{formatSolution(currentQuestion.solution)}</span>
                                </p>
                            )}

                            <div className="mt-2">
                               <ExplanationRenderer 
                                    steps={feedback.detailedExplanation} 
                                    title="דרך הפתרון:"
                                />
                            </div>

                           {feedback.isCorrect && feedback.earnedScore > 0 && (
                               <div className="flex items-center justify-center gap-2 font-bold bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 p-3 rounded-lg mt-6">
                                   <StarIcon className={`h-6 w-6 text-yellow-500`} />
                                   <span>+{feedback.earnedScore} נקודות</span>
                               </div>
                           )}
                           <button onClick={nextQuestion} className={`w-full mt-6 ${design.components.button.base} ${feedback.isCorrect ? `bg-green-500 hover:bg-green-600` : `bg-blue-500 hover:bg-blue-600`} text-white`}>
                               השאלה הבאה
                           </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


export default function PracticeEngine({ updateUser }: { updateUser: (s: number, e: number, subjectId: string) => void }) {
    const [config, setConfig] = useState<{ subjects: string[]; difficulty: Difficulty['id'] } | null>(null);

    if (!config) {
        return <PracticeConfig onStart={setConfig} />;
    }
    
    return <PracticeSession config={config} updateUser={updateUser} onBack={() => setConfig(null)} />;
}