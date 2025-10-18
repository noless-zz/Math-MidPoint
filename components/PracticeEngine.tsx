import React, { useState, useCallback } from 'react';
import { Question, Point, SUBJECTS, DIFFICULTY_LEVELS, Difficulty, QuestionType } from '../types.ts';
import { generateQuestion } from '../services/exerciseGenerator.ts';
import CoordinatePlane from './CoordinatePlane.tsx';
import { design } from '../constants/design_system.ts';
import { StarIcon } from './icons.tsx';

interface PracticeEngineProps {
  updateUser: (scoreToAdd: number, exercisesToAdd: number) => void;
}

// Sub-components
const PointInput: React.FC<{ value: Partial<Point>; onChange: (point: Partial<Point>) => void }> = ({ value, onChange }) => {
    const handleCoordChange = (coord: 'x' | 'y') => (e: React.ChangeEvent<HTMLInputElement>) => {
        const strValue = e.target.value;
        const numValue = strValue === '' || strValue === '-' ? strValue : parseFloat(strValue);
        onChange({ ...value, [coord]: numValue });
    };

    return (
        <div className="flex items-center gap-2 justify-center my-4">
            <span className="text-2xl font-semibold">(</span>
            <input
                type="number"
                step="any"
                value={value.x ?? ''}
                onChange={handleCoordChange('x')}
                className={`${design.components.input.base} w-24 text-center text-lg`}
                placeholder="x"
                aria-label="x coordinate"
            />
            <span className="text-2xl font-semibold">,</span>
            <input
                type="number"
                step="any"
                value={value.y ?? ''}
                onChange={handleCoordChange('y')}
                className={`${design.components.input.base} w-24 text-center text-lg`}
                placeholder="y"
                aria-label="y coordinate"
            />
            <span className="text-2xl font-semibold">)</span>
        </div>
    );
};

const NumberInput: React.FC<{ value: number | string; onChange: (val: string) => void }> = ({ value, onChange }) => (
    <input
        type="number"
        step="any"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${design.components.input.base} w-40 text-center text-lg my-4 mx-auto block`}
        placeholder="תשובה"
    />
);

const PracticeConfig: React.FC<{ onStart: (config: { subjects: string[], difficulty: Difficulty['id'] }) => void }> = ({ onStart }) => {
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>(Object.values(SUBJECTS).filter(s => s.practice).map(s => s.id));
    const [difficulty, setDifficulty] = useState<Difficulty['id']>('easy');

    const handleSubjectToggle = (subjectId: string) => {
        setSelectedSubjects(prev =>
            prev.includes(subjectId)
                ? prev.filter(id => id !== subjectId)
                : [...prev, subjectId]
        );
    };

    const handleStart = () => {
        if (selectedSubjects.length > 0) {
            onStart({ subjects: selectedSubjects, difficulty });
        }
    };
    
    const practiceSubjects = Object.values(SUBJECTS).filter(s => s.practice);

    return (
        <div className={`${design.layout.card} max-w-2xl mx-auto`}>
            <h2 className={design.typography.sectionTitle}>הגדרות תרגול</h2>
            
            <div className="mb-8">
                <h3 className="font-bold text-lg mb-3">נושאים לתרגול</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {practiceSubjects.map(subject => (
                        <button
                            key={subject.id}
                            onClick={() => handleSubjectToggle(subject.id)}
                            className={`p-3 rounded-lg text-center font-semibold ${design.effects.transition} ${selectedSubjects.includes(subject.id) ? `bg-${design.colors.primary.DEFAULT} text-white` : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                        >
                            {subject.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mb-8">
                <h3 className="font-bold text-lg mb-3">רמת קושי</h3>
                <div className="flex justify-center gap-4">
                    {Object.values(DIFFICULTY_LEVELS).map(level => (
                        <button
                            key={level.id}
                            onClick={() => setDifficulty(level.id)}
                            className={`px-6 py-2 rounded-full font-bold ${design.effects.transition} ${difficulty === level.id ? `bg-${design.colors.accent.teal} text-white` : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                        >
                            {level.name}
                        </button>
                    ))}
                </div>
            </div>

            <button
                onClick={handleStart}
                disabled={selectedSubjects.length === 0}
                className={`w-full ${design.components.button.base} ${design.components.button.primary} ${design.components.button.disabled}`}
            >
                {selectedSubjects.length > 0 ? 'התחל תרגול' : 'בחר/י נושא אחד לפחות'}
            </button>
        </div>
    );
};


export default function PracticeEngine({ updateUser }: PracticeEngineProps) {
    const [config, setConfig] = useState<{ subjects: string[]; difficulty: Difficulty['id'] } | null>(null);
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [userAnswer, setUserAnswer] = useState<Partial<Point> | number | string | null>(null);
    const [feedback, setFeedback] = useState<{ isCorrect: boolean; explanation: string, earnedScore: number } | null>(null);
    const [attempts, setAttempts] = useState(0);

    const startPractice = useCallback((practiceConfig: { subjects: string[], difficulty: Difficulty['id'] }) => {
        setConfig(practiceConfig);
        setCurrentQuestion(generateQuestion(practiceConfig));
        setFeedback(null);
        setUserAnswer(null);
        setAttempts(0);
    }, []);

    const nextQuestion = useCallback(() => {
        if (!config) return;
        setCurrentQuestion(generateQuestion(config));
        setFeedback(null);
        setUserAnswer(null);
        setAttempts(0);
    }, [config]);

    const isPointAnswer = (answer: any): answer is Point => {
        return typeof answer === 'object' && answer !== null && 'x' in answer && 'y' in answer;
    };

    const checkAnswer = () => {
        if (!currentQuestion || userAnswer === null) return;
        
        let isCorrect = false;
        const { solution } = currentQuestion;

        if (isPointAnswer(solution)) {
            if (isPointAnswer(userAnswer) && userAnswer.x === solution.x && userAnswer.y === solution.y) {
                isCorrect = true;
            }
        } else if (typeof solution === 'number') {
            const userAnswerNum = typeof userAnswer === 'string' ? parseFloat(userAnswer) : userAnswer as number;
            if (typeof userAnswerNum === 'number' && !isNaN(userAnswerNum) && Math.abs(userAnswerNum - solution) < 0.01) {
                isCorrect = true;
            }
        }

        const earnedScore = isCorrect && attempts === 0 
            ? Math.round(10 * (DIFFICULTY_LEVELS[currentQuestion.difficulty.toUpperCase()]?.multiplier || 1)) 
            : 0;

        setFeedback({ isCorrect, explanation: currentQuestion.explanation, earnedScore });

        if (isCorrect) {
            updateUser(earnedScore, 1);
        } else {
            setAttempts(prev => prev + 1);
        }
    };
    
    const getSubjectNameFromType = (type: QuestionType): string => {
        if (type.includes('MIDPOINT') || type.includes('ENDPOINT')) return SUBJECTS.MIDPOINT.name;
        if (type === 'IDENTIFY_COORDINATES') return SUBJECTS.COORDINATE_SYSTEM.name;
        if (type === 'CALCULATE_AREA') return SUBJECTS.AREA_CALC.name;
        if (type === 'CALCULATE_SLOPE') return SUBJECTS.STRAIGHT_LINE.name;
        if (type === 'CALCULATE_DISTANCE') return SUBJECTS.DISTANCE.name;
        if (type === 'FIND_PERPENDICULAR_SLOPE') return SUBJECTS.PERPENDICULAR_LINES.name;
        if (type === 'FIND_INTERSECTION_POINT') return SUBJECTS.LINE_INTERSECTION.name;
        return 'שאלה כללית';
    };

    const renderAnswerInput = () => {
        if (!currentQuestion) return null;
        switch (currentQuestion.type) {
            case 'FIND_MIDPOINT_VISUAL':
            case 'IDENTIFY_COORDINATES':
                return <p className="text-center text-lg text-gray-600 dark:text-gray-400">לחץ/י על המיקום הנכון בגרף.</p>;

            case 'FIND_MIDPOINT_MCQ':
            case 'FIND_ENDPOINT_MCQ':
                return (
                    <div className="grid grid-cols-2 gap-4 my-4">
                        {currentQuestion.options?.map((option, i) => (
                           <button key={i} onClick={() => setUserAnswer(option as Point)} className={`${design.practice.mcqButton} ${JSON.stringify(userAnswer) === JSON.stringify(option) ? `!bg-indigo-200 dark:!bg-indigo-800 ring-2 ring-indigo-500` : ''}`}>
                               {isPointAnswer(option) ? `(${option.x}, ${option.y})` : option}
                           </button>
                        ))}
                    </div>
                );
            
            case 'FIND_MIDPOINT':
            case 'FIND_ENDPOINT':
            case 'FIND_INTERSECTION_POINT':
                 return <PointInput value={userAnswer as Partial<Point> || {}} onChange={setUserAnswer} />;

            case 'CALCULATE_SLOPE':
            case 'CALCULATE_DISTANCE':
            case 'FIND_PERPENDICULAR_SLOPE':
            case 'CALCULATE_AREA':
                return <NumberInput value={userAnswer as string || ''} onChange={(val) => setUserAnswer(val)} />;
            default:
                return <p>סוג שאלה לא נתמך עדיין.</p>;
        }
    };

    if (!config || !currentQuestion) {
        return <PracticeConfig onStart={startPractice} />;
    }

    const hasVisual = currentQuestion.points || currentQuestion.lines;

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className={`${design.layout.card}`}>
                <div className={`grid gap-8 ${hasVisual ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
                    {hasVisual && (
                        <CoordinatePlane
                            points={currentQuestion.points}
                            triangle={currentQuestion.type === 'CALCULATE_AREA' && currentQuestion.points?.A && currentQuestion.points?.B && currentQuestion.points?.C ? [currentQuestion.points.A, currentQuestion.points.B, currentQuestion.points.C] : undefined}
                            onClick={['FIND_MIDPOINT_VISUAL', 'IDENTIFY_COORDINATES'].includes(currentQuestion.type) && !feedback ? (p) => setUserAnswer(p) : undefined}
                            userAnswer={isPointAnswer(userAnswer) ? userAnswer : undefined}
                            solution={feedback && isPointAnswer(currentQuestion.solution) ? currentQuestion.solution : undefined}
                        />
                    )}
                    <div className="flex flex-col justify-center text-right">
                        <p className={`${design.colors.text.muted.light} dark:${design.colors.text.muted.dark} text-sm font-bold uppercase`}>{getSubjectNameFromType(currentQuestion.type)}</p>
                        <h2 className="text-xl md:text-2xl font-semibold my-4 text-gray-800 dark:text-gray-100">{currentQuestion.question}</h2>
                        
                        {!feedback ? (
                            <>
                                {renderAnswerInput()}
                                <button onClick={checkAnswer} className={`w-full mt-4 ${design.components.button.base} ${design.components.button.primary}`}>
                                    בדיקת תשובה
                                </button>
                            </>
                        ) : (
                           <div className={design.practice.feedbackCard(feedback.isCorrect)}>
                               <h3 className="text-2xl font-bold mb-2">{feedback.isCorrect ? 'כל הכבוד!' : 'תשובה שגויה'}</h3>
                               <p className="mb-4">{feedback.explanation}</p>
                               {feedback.isCorrect && feedback.earnedScore > 0 && (
                                   <div className="flex items-center justify-center gap-2 font-bold bg-yellow-200/50 dark:bg-yellow-800/50 p-2 rounded-lg">
                                       <StarIcon className={`h-6 w-6 text-${design.colors.accent.yellow}`} />
                                       <span>+{feedback.earnedScore} נקודות</span>
                                   </div>
                               )}
                               <button onClick={nextQuestion} className={`w-full mt-4 ${design.components.button.base} ${feedback.isCorrect ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white`}>
                                   השאלה הבאה
                               </button>
                           </div>
                        )}
                    </div>
                </div>
            </div>
             <button onClick={() => setConfig(null)} className={`mx-auto block ${design.components.button.base.replace('py-3', 'py-2')} ${design.components.button.secondary}`}>
                חזרה להגדרות
            </button>
        </div>
    );
}
