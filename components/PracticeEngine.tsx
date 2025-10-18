import React, { useState, useCallback, useEffect } from 'react';
import { Question, Point, SUBJECTS, DIFFICULTY_LEVELS, Difficulty, QuestionType, LineEquation } from '../types.ts';
import { generateQuestion } from '../services/exerciseGenerator.ts';
import CoordinatePlane from './CoordinatePlane.tsx';
import { design } from '../constants/design_system.ts';
import { StarIcon } from './icons.tsx';
import { GoogleGenAI } from '@google/genai';

// --- HELPER & VISUAL COMPONENTS (MOVED OUTSIDE) ---

const ColoredText: React.FC<{ text: string }> = ({ text }) => {
    const parts = text.split(/([A-Z]\(-?\d+,\s*-?\d+\)|[A-Z]\?)/g);
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

const FormulaWithSigns: React.FC<{ values: (string | number)[] }> = ({ values }) => {
    const [val1, val2] = values.map(Number);
    const op = val2 < 0 ? '-' : '+';
    const finalVal2 = Math.abs(val2);
    // Special case for start of expression to avoid `- -5`
    if (val1 === 0 && op === '-') {
        return <span dir="ltr" className="font-mono">-{finalVal2}</span>
    }
    if (val1 === 0 && op === '+') {
        return <span dir="ltr" className="font-mono">{finalVal2}</span>
    }
    return (
        <span dir="ltr" className="font-mono">
            {val1} <span className="mx-1">{op}</span> {finalVal2}
        </span>
    );
};

const ColoredPointDisplay: React.FC<{ point: Point }> = ({ point }) => (
    <span dir="ltr" className="inline-block font-bold">
        (<span className={design.pointColors.X.text}>{point.x}</span>, <span className={design.pointColors.Y.text}>{point.y}</span>)
    </span>
);

// --- GENERIC HINT COMPONENTS ---

const GeneralFormulaHint: React.FC<{ type: QuestionType }> = ({ type }) => {
    let formula;
    switch (type) {
        case 'FIND_ENDPOINT':
        case 'FIND_ENDPOINT_MCQ':
             formula = (
                <div className="flex flex-col md:flex-row items-center justify-center font-bold text-lg md:text-xl gap-x-6 gap-y-2">
                    <span><span className={design.pointColors.B.text}>x<sub>B</sub></span> = 2 &middot; <span className={design.pointColors.M.text}>x<sub>M</sub></span> - <span className={design.pointColors.A.text}>x<sub>A</sub></span></span>
                    <span><span className={design.pointColors.B.text}>y<sub>B</sub></span> = 2 &middot; <span className={design.pointColors.M.text}>y<sub>M</sub></span> - <span className={design.pointColors.A.text}>y<sub>A</sub></span></span>
                </div>
            );
            break;
        case 'FIND_MIDPOINT':
        case 'FIND_MIDPOINT_MCQ':
        case 'FIND_MIDPOINT_VISUAL':
            formula = (
                <div className="flex flex-col md:flex-row items-center justify-center font-bold text-lg md:text-xl gap-x-6 gap-y-2">
                    <span><span className={design.pointColors.M.text}>x<sub>M</sub></span> = <SimpleFraction numerator={<><span className={design.pointColors.A.text}>x<sub>A</sub></span> + <span className={design.pointColors.B.text}>x<sub>B</sub></span></>} denominator={2} /></span>
                    <span><span className={design.pointColors.M.text}>y<sub>M</sub></span> = <SimpleFraction numerator={<><span className={design.pointColors.A.text}>y<sub>A</sub></span> + <span className={design.pointColors.B.text}>y<sub>B</sub></span></>} denominator={2} /></span>
                </div>
            );
            break;
        case 'CALCULATE_SLOPE':
            formula = <span><span className="font-bold">m</span> = <SimpleFraction numerator={<><span className={design.pointColors.B.text}>y<sub>B</sub></span> - <span className={design.pointColors.A.text}>y<sub>A</sub></span></>} denominator={<><span className={design.pointColors.B.text}>x<sub>B</sub></span> - <span className={design.pointColors.A.text}>x<sub>A</sub></span></>} /></span>;
            break;
        case 'CALCULATE_DISTANCE':
            formula = <span className="text-sm md:text-base">d = &radic;[ (<span className={design.pointColors.B.text}>x<sub>B</sub></span> - <span className={design.pointColors.A.text}>x<sub>A</sub></span>)<sup>2</sup> + (<span className={design.pointColors.B.text}>y<sub>B</sub></span> - <span className={design.pointColors.A.text}>y<sub>A</sub></span>)<sup>2</sup> ]</span>;
            break;
        case 'FIND_PERPENDICULAR_SLOPE':
            formula = <span>m<sub>1</sub> &middot; m<sub>2</sub> = -1</span>;
            break;
        default:
            return null;
    }

    return (
        <div className={`mt-4 p-4 rounded-lg text-center ${design.learn.formula}`}>
             <div dir="ltr" className="font-bold text-lg md:text-xl">
                {formula}
            </div>
        </div>
    );
};

const DetailedFormulaHint: React.FC<{ question: Question }> = ({ question }) => {
    const { A, B, M } = question.points || {};
    const type = question.type;

    if (type.includes('MIDPOINT') || type.includes('ENDPOINT')) {
        return <VisualFormulaDisplay question={question} type={type.includes('ENDPOINT') ? 'endpoint' : 'midpoint'} />;
    }
    
    let xCalc, yCalc;

    switch (type) {
        case 'CALCULATE_SLOPE':
            if (A && B) {
                 xCalc = (
                    <div className="text-center font-mono text-lg">
                        <span className="font-bold">m</span> = <SimpleFraction numerator={<FormulaWithSigns values={[B.y, -A.y]} />} denominator={<FormulaWithSigns values={[B.x, -A.x]} />} />
                    </div>
                 );
            }
            break;
        case 'CALCULATE_DISTANCE':
             if (A && B) {
                 xCalc = (
                    <div className="text-center font-mono text-sm md:text-base" dir="ltr">
                        d = &radic;[ ({B.x} - {A.x})<sup>2</sup> + ({B.y} - {A.y})<sup>2</sup> ]
                    </div>
                 );
            }
            break;
         case 'FIND_PERPENDICULAR_SLOPE':
             if (typeof question.solution === 'number') {
                const m1 = -1 / question.solution;
                xCalc = (
                    <div className="text-center font-mono text-lg" dir="ltr">
                        m<sub>2</sub> = -1 / ({m1.toFixed(2)})
                    </div>
                )
             }
            break;
        // Other cases can be added here
        default:
            return null;
    }
    
     return (
         <div className="flex flex-col sm:flex-row-reverse gap-4 mt-4" dir="rtl">
            <div className={`${design.practice.visualFormulaBox.base} ${design.practice.visualFormulaBox.x} w-full`}>
                <h4 className={design.practice.visualFormulaBox.xText}>הצבה בנוסחה</h4>
                {xCalc}
            </div>
        </div>
    );
};

// --- PRACTICE-SPECIFIC INPUT & DISPLAY COMPONENTS ---

const VisualFormulaDisplay: React.FC<{ question: Question, type: 'midpoint' | 'endpoint' }> = ({ question, type }) => {
    const { A, B, M } = question.points || {};
    let xCalc, yCalc;

    if (type === 'endpoint' && A && M) {
        xCalc = <span dir="ltr"><span className={design.pointColors.B.text}>X<sub>B</sub></span> = 2 &middot; {M.x} - ({A.x})</span>;
        yCalc = <span dir="ltr"><span className={design.pointColors.B.text}>Y<sub>B</sub></span> = 2 &middot; {M.y} - ({A.y})</span>;
    } else if (type === 'midpoint' && A && B) {
        xCalc = <span dir="ltr"><span className={design.pointColors.M.text}>X<sub>M</sub></span> = <SimpleFraction numerator={<FormulaWithSigns values={[A.x, B.x]} />} denominator={2} /></span>;
        yCalc = <span dir="ltr"><span className={design.pointColors.M.text}>Y<sub>M</sub></span> = <SimpleFraction numerator={<FormulaWithSigns values={[A.y, B.y]} />} denominator={2} /></span>;
    }

    return (
         <div className="flex flex-col sm:flex-row-reverse gap-4 mt-4" dir="rtl">
            <div className={`${design.practice.visualFormulaBox.base} ${design.practice.visualFormulaBox.x}`}>
                <h4 className={design.practice.visualFormulaBox.xText}>חישוב שיעור X</h4>
                <div className="text-center font-mono text-lg">{xCalc}</div>
            </div>
            <div className={`${design.practice.visualFormulaBox.base} ${design.practice.visualFormulaBox.y}`}>
                <h4 className={design.practice.visualFormulaBox.yText}>חישוב שיעור Y</h4>
                 <div className="text-center font-mono text-lg">{yCalc}</div>
            </div>
        </div>
    );
};

const PointInput: React.FC<{ value: Partial<Point>, onChange: (p: Partial<Point>) => void }> = ({ value, onChange }) => (
    <div className="flex flex-col sm:flex-row-reverse gap-4 mt-4" dir="rtl">
        <div className="flex-1">
            <label htmlFor="x-input" className={`${design.pointColors.X.text} font-bold`}>ערך X</label>
            <input id="x-input" type="number" value={value.x ?? ''} onChange={(e) => onChange({ ...value, x: e.target.value === '' ? undefined : parseFloat(e.target.value) })} className={`${design.components.input.base} !text-lg text-center mt-1`} dir="ltr" />
        </div>
        <div className="flex-1">
            <label htmlFor="y-input" className={`${design.pointColors.Y.text} font-bold`}>ערך Y</label>
            <input id="y-input" type="number" value={value.y ?? ''} onChange={(e) => onChange({ ...value, y: e.target.value === '' ? undefined : parseFloat(e.target.value) })} className={`${design.components.input.base} !text-lg text-center mt-1`} dir="ltr" />
        </div>
    </div>
);

const NumberInput: React.FC<{ value: number | string, onChange: (n: string) => void }> = ({ value, onChange }) => (
     <div className="mt-4">
        <label htmlFor="num-input" className={`font-bold`}>תשובה</label>
        <input id="num-input" type="number" step="any" value={value ?? ''} onChange={(e) => onChange(e.target.value)} className={`${design.components.input.base} !text-lg text-center mt-1`} dir="ltr" />
    </div>
);


const PracticeConfig: React.FC<{ onStart: (config: { subjects: string[]; difficulty: Difficulty['id'] }) => void }> = ({ onStart }) => {
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['midpoint']);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty['id']>('easy');

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

  const practiceSubjects = Object.values(SUBJECTS).filter(s => s.practice);

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
    const [userAnswer, setUserAnswer] = useState<Partial<Point> | number | string | null>(null);
    const [feedback, setFeedback] = useState<{ isCorrect: boolean; explanation: string; earnedScore: number } | null>(null);
    const [attempts, setAttempts] = useState(0);
    const [hintLevel, setHintLevel] = useState(0); // 0: none, 1: formula, 2: full
    const [potentialScore, setPotentialScore] = useState(0);
    const [selectedMcq, setSelectedMcq] = useState<number | null>(null);
    const [aiExplanation, setAiExplanation] = useState<{ text: string; image?: string } | null>(null);
    const [isAiLoading, setIsAiLoading] = useState(false);

    const setupNewQuestion = useCallback((question: Question) => {
        setCurrentQuestion(question);
        setFeedback(null);
        setUserAnswer(null);
        setAttempts(0);
        setSelectedMcq(null);
        setAiExplanation(null);

        const difficulty = DIFFICULTY_LEVELS[question.difficulty.toUpperCase()];
        const baseScore = Math.round(10 * difficulty.multiplier);
        setPotentialScore(baseScore);

        if (question.difficulty === 'easy') setHintLevel(2);
        else if (question.difficulty === 'medium') setHintLevel(1);
        else setHintLevel(0);
    }, []);
    
    useEffect(() => {
        if(config) {
            setupNewQuestion(generateQuestion(config));
        }
    }, [config, setupNewQuestion]);


    const isPoint = (val: any): val is Point => typeof val === 'object' && val !== null && 'x' in val && 'y' in val;
    const isPointAnswer = (val: any): val is {x: any, y: any} => typeof val === 'object' && val !== null && 'x' in val && 'y' in val;

    const checkAnswer = () => {
        if (!currentQuestion || userAnswer === null || userAnswer === undefined) return;
        
        let isCorrect = false;
        const { solution } = currentQuestion;

        if (isPoint(solution)) {
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
        }
        
        const newAttempts = attempts + 1;

        if (isCorrect) {
            setFeedback({ isCorrect: true, explanation: currentQuestion.explanation, earnedScore: potentialScore });
            updateUser(potentialScore, 1);
        } else { // Incorrect
            setAttempts(newAttempts);
            
            let newHintLevel = hintLevel;
            const difficulty = currentQuestion.difficulty;

            if (difficulty === 'hard') {
                if (newAttempts === 1) newHintLevel = 1;
                if (newAttempts === 2) newHintLevel = 2;
            }
            if (difficulty === 'medium') {
                if (newAttempts === 1) newHintLevel = 2;
            }
            setHintLevel(newHintLevel);
            
            const baseScore = Math.round(10 * DIFFICULTY_LEVELS[difficulty.toUpperCase()].multiplier);
            let newPotentialScore = potentialScore;

            if (difficulty === 'hard') {
                if (newHintLevel === 2) newPotentialScore = Math.round(baseScore * 0.5);
                else if (newHintLevel === 1) newPotentialScore = Math.round(baseScore * 0.75);
            } else if (difficulty === 'medium') {
                if (newHintLevel === 2) newPotentialScore = 10;
            } else { // easy
                newPotentialScore = Math.max(5, baseScore - 3 * newAttempts);
            }
            setPotentialScore(newPotentialScore);

            if (newAttempts >= 3) {
                 setFeedback({ isCorrect: false, explanation: currentQuestion.explanation, earnedScore: 0 });
            }
        }
    };
    
    const nextQuestion = () => {
        setupNewQuestion(generateQuestion(config));
    };
    
    const handleMcqSelect = (option: Point | number, index: number) => {
      setUserAnswer(option);
      setSelectedMcq(index);
    };

    const getSubjectNameFromType = (type: QuestionType): string => {
        const subjectEntry = Object.values(SUBJECTS).find(s => type.toLowerCase().includes(s.id.split('_')[0]));
        return subjectEntry ? subjectEntry.name : 'שאלה כללית';
    };
    
    const renderHint = () => {
        if (!currentQuestion || hintLevel === 0) return null;
        if (hintLevel === 1) return <GeneralFormulaHint type={currentQuestion.type} />;
        if (hintLevel === 2) return <DetailedFormulaHint question={currentQuestion} />;
        return null;
    };
    
    // --- RENDER LOGIC ---

    if (!currentQuestion) {
        return <div className="text-center p-10 font-bold">טוען שאלה...</div>
    }

    const isMcq = currentQuestion.type.includes('MCQ');
    const isVisual = currentQuestion.type.includes('VISUAL');
    const solutionIsPoint = isPoint(currentQuestion.solution);
    
    const renderAnswerArea = () => {
        if (isVisual) {
            return userAnswer ? <p className="text-center font-semibold mb-2" dir="rtl">הבחירה שלך: <ColoredPointDisplay point={userAnswer as Point} /></p> : null;
        }
        if (isMcq) {
            return (
                <div className="grid grid-cols-2 gap-4 my-2">
                    {currentQuestion.options?.map((option, i) => (
                        <button key={i} onClick={() => handleMcqSelect(option, i)} className={`${design.practice.mcqButton} ${selectedMcq === i ? `ring-2 ${design.pointColors.M.text.replace('text-', 'ring-')}` : ''}`}>
                            {isPoint(option) ? <ColoredPointDisplay point={option} /> : <span className="font-bold text-lg">{option}</span>}
                        </button>
                    ))}
                </div>
            );
        }
        if (solutionIsPoint) {
            return <PointInput value={userAnswer as Partial<Point> || {}} onChange={setUserAnswer} />;
        }
        return <NumberInput value={userAnswer as string || ''} onChange={(val) => setUserAnswer(val)} />;
    };
    
    return (
        <div className="max-w-5xl mx-auto space-y-4">
             <div className="flex justify-between items-center">
                 <button onClick={onBack} className={`${design.components.button.base.replace('py-3', 'py-2')} ${design.components.button.secondary} !font-bold`}>
                    &larr; חזרה להגדרות
                </button>
                <div className={`${design.practice.attemptsCounter} bg-indigo-100 dark:bg-indigo-900/50 px-4 py-1 rounded-full`}>
                    ניסיונות שנותרו: <span className="text-2xl">{3 - attempts}</span>
                </div>
            </div>
            
            <div className={design.layout.card}>
                 <div className={`grid gap-8 ${currentQuestion.points || currentQuestion.lines ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
                    {(currentQuestion.points || currentQuestion.lines) && (
                        <CoordinatePlane
                            points={currentQuestion.points}
                            lines={currentQuestion.lines?.map(l => ({ p1: {x: -20, y: l.m * -20 + l.b }, p2: {x: 20, y: l.m * 20 + l.b }, color: 'stroke-blue-500'}))}
                            onClick={isVisual && !feedback ? (p) => setUserAnswer(p) : undefined}
                            userAnswer={isPoint(userAnswer) ? userAnswer as Point : undefined}
                            solution={feedback && isPoint(currentQuestion.solution) ? currentQuestion.solution as Point : undefined}
                        />
                    )}
                    <div className="flex flex-col justify-center text-right">
                       <p className={`${design.colors.text.muted.light} dark:${design.colors.text.muted.dark} text-sm font-bold uppercase`}>{getSubjectNameFromType(currentQuestion.type)}</p>
                       <div className="text-xl md:text-2xl font-semibold my-4 text-gray-800 dark:text-gray-100">
                           <ColoredText text={currentQuestion.question} />
                       </div>
                       
                        {!feedback ? (
                            <>
                                {renderAnswerArea()}
                                {renderHint()}
                                <button onClick={checkAnswer} disabled={userAnswer === null} className={`w-full mt-6 ${design.components.button.base} ${design.components.button.primary} ${design.components.button.disabled}`}>
                                    בדוק/י תשובה
                                </button>
                            </>
                        ) : (
                           <div className={design.practice.feedbackCard(feedback.isCorrect)}>
                               <h3 className="text-2xl font-bold mb-2">{feedback.isCorrect ? 'כל הכבוד!' : 'תשובה שגויה'}</h3>
                               {!feedback.isCorrect && <p>התשובה הנכונה היא {isPoint(currentQuestion.solution) ? <ColoredPointDisplay point={currentQuestion.solution} /> : currentQuestion.solution}</p>}
                               <p className="mb-4">{feedback.explanation}</p>
                               {feedback.isCorrect && feedback.earnedScore > 0 && (
                                   <div className="flex items-center justify-center gap-2 font-bold bg-yellow-200/50 dark:bg-yellow-800/50 p-2 rounded-lg">
                                       <StarIcon className={`h-6 w-6 text-${design.colors.accent.yellow}`} />
                                       <span>+{feedback.earnedScore} נקודות</span>
                                   </div>
                               )}
                               <button onClick={nextQuestion} className={`w-full mt-4 ${design.components.button.base} ${feedback.isCorrect ? `bg-${design.colors.accent.green}` : `bg-${design.colors.accent.red}`} hover:opacity-90 text-white`}>
                                   השאלה הבאה
                               </button>
                           </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};


export default function PracticeEngine({ updateUser }: { updateUser: (s: number, e: number) => void }) {
    const [config, setConfig] = useState<{ subjects: string[]; difficulty: Difficulty['id'] } | null>(null);

    if (!config) {
        return <PracticeConfig onStart={setConfig} />;
    }
    
    return <PracticeSession config={config} updateUser={updateUser} onBack={() => setConfig(null)} />;
}