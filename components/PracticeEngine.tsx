import React, { useState, useCallback, useEffect } from 'react';
import { Question, Point, SUBJECTS, DIFFICULTY_LEVELS, Difficulty, QuestionType, LineEquation, EquationPart, EquationSolution, LineEquationSolution } from '../types.ts';
import { generateQuestion } from '../services/exerciseGenerator.ts';
import CoordinatePlane from './CoordinatePlane.tsx';
import { design } from '../constants/design_system.ts';
import { StarIcon } from './icons.tsx';

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
                            <p dir="ltr" className="text-center text-lg font-mono">{contentPart}</p>
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

const TextAnswerInput: React.FC<{ value: string, onChange: (v: string) => void, label?: string }> = ({ value, onChange, label = 'תשובה' }) => (
    <div className="mt-4">
        <label className="font-bold">{label}</label>
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className={`${inputBaseStyle} text-center mt-1`} dir="ltr" placeholder="למשל: 3x^2 + 4" />
    </div>
);

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

const PracticeSession = ({ config, updateUser, onBack }) => {
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
            const normalize = (s: string) => s.replace(/\s+/g, '').toLowerCase();
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
        if (currentQuestion.type.includes('MCQ') || currentQuestion.type === 'IDENTIFY_QUADRANT') {
            return (
                <div className="grid grid-cols-2 gap-4 mt-4">
                    {currentQuestion.options?.map((opt, i) => (
                        <button key={i} onClick={() => { setSelectedMcq(i); setUserAnswer(opt); }} className={`${design.practice.mcqButton} ${selectedMcq === i ? 'ring-2 ring-indigo-500' : ''}`}>
                            {/* FIX: opt can be a Point object, which cannot be rendered directly as a ReactNode. We use ColoredPointDisplay if it's a Point. */}
                            {typeof opt === 'object' && opt !== null && 'x' in opt ? (
                                <ColoredPointDisplay point={opt as Point} />
                            ) : (
                                String(opt)
                            )}
                        </button>
                    ))}
                </div>
            );
        }
        if (currentQuestion.type === 'SOLVE_QUADRATIC_EQUATION' || currentQuestion.type.includes('EQUATION')) {
            return <MultiSolutionInput values={multiAnswers} onChange={setMultiAnswers} />;
        }
        if (currentQuestion.type.includes('POINT')) {
            return <PointInput value={userAnswer || {}} onChange={setUserAnswer} />;
        }
        if (currentQuestion.type.includes('LINE') || currentQuestion.type === 'FIND_TANGENT_EQUATION') {
            return <LineEquationInput value={userAnswer || {}} onChange={setUserAnswer} />;
        }
        if (currentQuestion.type === 'CALCULATE_DERIVATIVE') {
            return <TextAnswerInput value={userAnswer || ''} onChange={setUserAnswer} label="הנגזרת f'(x)" />;
        }
        return <TextAnswerInput value={userAnswer || ''} onChange={setUserAnswer} />;
    };

    return (
        <div className="max-w-3xl mx-auto">
            <div className="flex justify-between mb-4">
                <button onClick={onBack} className="text-indigo-600 font-bold">חזרה</button>
                <div className="flex items-center gap-2">
                    <StarIcon className="h-5 w-5 text-yellow-500" />
                    <span>{potentialScore} נק'</span>
                </div>
            </div>
            
            <div className={design.layout.card}>
                <h3 className="text-xl font-bold mb-4">{currentQuestion.question}</h3>
                {currentQuestion.equationParts && <EquationDisplay parts={currentQuestion.equationParts} />}
                
                {currentQuestion.points && (
                    <div className="mb-6">
                        <CoordinatePlane points={currentQuestion.points} />
                    </div>
                )}

                {!feedback ? (
                    <>
                        {renderAnswerInput()}
                        <button onClick={checkAnswer} className={`w-full mt-6 ${design.components.button.base} ${design.components.button.primary}`}>
                            בדוק תשובה
                        </button>
                    </>
                ) : (
                    <div className={`mt-6 p-6 rounded-xl ${feedback.isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
                        <h4 className="text-xl font-bold mb-2">{feedback.isCorrect ? 'כל הכבוד!' : 'אופס...'}</h4>
                        <ExplanationRenderer steps={feedback.detailedExplanation} title="דרך הפתרון:" />
                        <button onClick={() => setupNewQuestion(generateQuestion(config))} className={`w-full mt-6 ${design.components.button.base} ${design.components.button.primary}`}>
                            השאלה הבאה
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default function PracticeEngine({ updateUser }: { updateUser: (s: number, e: number, subjectId: string) => void }) {
    const [config, setConfig] = useState<{ subjects: string[]; difficulty: Difficulty['id'] } | null>(null);
    if (!config) return <PracticeConfig onStart={setConfig} />;
    return <PracticeSession config={config} updateUser={updateUser} onBack={() => setConfig(null)} />;
}
