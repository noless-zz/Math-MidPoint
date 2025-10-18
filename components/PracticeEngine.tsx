import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { generateQuestion } from '../services/exerciseGenerator.ts';
import { Question, Point, SUBJECTS, DIFFICULTY_LEVELS, Difficulty, LineEquation } from '../types.ts';
import MathInput from './MathInput.tsx';
import CoordinatePlane from './CoordinatePlane.tsx';
import { design } from '../constants/design_system.ts';

// --- HELPER & HINT COMPONENTS ---
const ColoredText = ({ text }) => {
    if (!text) return null;
    const parts = text.split(/([ABCM]\(-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?\)|y\s*=\s*-?\d+(\.\d+)?x\s*[\+\-]\s*\d+(\.\d+)?)/g);
    return (
        <>
            {parts.map((part, index) => {
                const isPoint = /([ABCM])\(/.test(part);
                const isEquation = /y\s*=/.test(part);
                if (isPoint) {
                    const pointLetter = part.match(/([ABCM])/)[1];
                    return <span key={index} dir="ltr" className={`inline-block font-bold ${design.pointColors[pointLetter]?.text}`}>{part}</span>;
                }
                if (isEquation) {
                    return <span key={index} dir="ltr" className="inline-block font-mono text-indigo-500">{part}</span>
                }
                return part;
            })}
        </>
    );
};

const ColoredPointDisplay = ({ point }) => (
    <span dir="ltr" className="font-mono text-lg">
        (<span className={`font-bold ${design.pointColors.X.text}`}>{point.x}</span>, <span className={`font-bold ${design.pointColors.Y.text}`}>{point.y}</span>)
    </span>
);

const GeneralFormulaHint = () => (
    <div className={`p-3 ${design.colors.feedback.warning.bg} border-r-4 ${design.colors.feedback.warning.border} rounded-md`}>
        <p className={`font-bold ${design.colors.feedback.warning.text} mb-2 text-center`}>רמז: נוסחת אמצע קטע</p>
        <div dir="ltr" className="font-mono text-center text-sm sm:text-base flex flex-col sm:flex-row justify-center items-center gap-4">
            <div className="flex items-center gap-1">
                <span className={`font-bold ${design.pointColors.M.text}`}>X<sub>M</sub></span> =
                <div className="inline-flex flex-col items-center">
                    <span><span className={`font-bold ${design.pointColors.A.text}`}>X<sub>A</sub></span> + <span className={`font-bold ${design.pointColors.B.text}`}>X<sub>B</sub></span></span>
                    <hr className="w-full border-t border-current my-1" />
                    <span>2</span>
                </div>
            </div>
            <div className="flex items-center gap-1">
                <span className={`font-bold ${design.pointColors.M.text}`}>Y<sub>M</sub></span> =
                <div className="inline-flex flex-col items-center">
                    <span><span className={`font-bold ${design.pointColors.A.text}`}>Y<sub>A</sub></span> + <span className={`font-bold ${design.pointColors.B.text}`}>Y<sub>B</sub></span></span>
                    <hr className="w-full border-t border-current my-1" />
                    <span>2</span>
                </div>
            </div>
        </div>
    </div>
);

const EndpointFormulaHint = () => (
    <div className={`p-3 ${design.colors.feedback.warning.bg} border-r-4 ${design.colors.feedback.warning.border} rounded-md`}>
        <p className={`font-bold ${design.colors.feedback.warning.text} mb-2 text-center`}>רמז: נוסחה למציאת נקודת קצה</p>
        <div dir="ltr" className="font-mono text-center text-sm sm:text-base flex flex-col sm:flex-row justify-center items-center gap-4">
            <div className="flex items-center gap-1">
                <span className={`font-bold ${design.pointColors.B.text}`}>X<sub>B</sub></span> = 2 &times; <span className={`font-bold ${design.pointColors.M.text}`}>X<sub>M</sub></span> - <span className={`font-bold ${design.pointColors.A.text}`}>X<sub>A</sub></span>
            </div>
            <div className="flex items-center gap-1">
                <span className={`font-bold ${design.pointColors.B.text}`}>Y<sub>B</sub></span> = 2 &times; <span className={`font-bold ${design.pointColors.M.text}`}>Y<sub>M</sub></span> - <span className={`font-bold ${design.pointColors.A.text}`}>Y<sub>A</sub></span>
            </div>
        </div>
    </div>
);

// Fix: Removed unused `points` and `question` props to resolve type error.
const GenericFormulaHint = ({ title, formula }) => (
     <div className={`p-3 ${design.colors.feedback.warning.bg} border-r-4 ${design.colors.feedback.warning.border} rounded-md`}>
        <p className={`font-bold ${design.colors.feedback.warning.text} mb-2 text-center`}>רמז: {title}</p>
        <div dir="ltr" className="font-mono text-center text-lg flex items-center justify-center gap-4">
           {formula}
        </div>
    </div>
);


const RenderFormulaPart = ({ value, isFirst = false }) => {
    const isNegative = value < 0;
    if (isFirst) { return <>{value}</>; }
    if (isNegative) { return <><span className="mx-1">-</span> {Math.abs(value)}</>; }
    return <><span className="mx-1">+</span> {value}</>;
};

const VisualFormulaDisplay = ({ question }) => {
    const { type, points } = question;
    const getFormulaForEndpoint = (coord: 'x' | 'y') => {
      const isX = coord === 'x';
      const M = isX ? points.M.x : points.M.y;
      const A = isX ? points.A.x : points.A.y;
      return (<p dir="ltr" className="font-mono text-lg text-center flex items-center justify-center"><span>{isX ? 'X' : 'Y'}<sub>b</sub> = (2 &times; <span className={design.pointColors.M.text}>{M}</span>)</span><span className={design.pointColors.A.text}><RenderFormulaPart value={-A} /></span></p>);
    };
    const getFormulaForMidpoint = (coord: 'x' | 'y') => {
        const isX = coord === 'x'; const A = isX ? points.A.x : points.A.y; const B = isX ? points.B.x : points.B.y;
         return (<div dir="ltr" className="flex items-center justify-center gap-1 font-mono text-lg text-center"><span>{isX ? 'X' : 'Y'}<sub>m</sub> =</span><div className="inline-flex flex-col items-center"><span className="flex items-center"><span className={design.pointColors.A.text}><RenderFormulaPart value={A} isFirst={true}/></span><span className={design.pointColors.B.text}><RenderFormulaPart value={B} /></span></span><hr className="w-full border-t border-current my-1" /><span>2</span></div></div>);
    };
    const formulaRenderer = type.includes('ENDPOINT') ? getFormulaForEndpoint : getFormulaForMidpoint;
    return (<div className="flex flex-col sm:flex-row-reverse gap-4"><div className={`${design.practice.visualFormulaBox.base} ${design.practice.visualFormulaBox.x}`}><h4 className={design.practice.visualFormulaBox.xText}>חישוב שיעור X</h4><div className="min-h-[40px] flex items-center justify-center">{formulaRenderer('x')}</div></div><div className={`${design.practice.visualFormulaBox.base} ${design.practice.visualFormulaBox.y}`}><h4 className={design.practice.visualFormulaBox.yText}>חישוב שיעור Y</h4><div className="min-h-[40px] flex items-center justify-center">{formulaRenderer('y')}</div></div></div>);
};

const CalculationInput = ({ question, userAnswer, onChange, disabled, hintLevel }) => {
  const handleInputChange = (coord: 'x' | 'y', value: string) => { if (/^-?\d*\.?\d*$/.test(value)) { onChange({ ...userAnswer, [coord]: value }); } };
  return (<div>{hintLevel === 2 && <VisualFormulaDisplay question={question} />}<div className={`flex flex-col sm:flex-row-reverse gap-4 ${hintLevel === 2 ? 'mt-4' : ''}`}><div className="flex-1 flex items-center justify-center gap-2 p-2 bg-teal-50/50 dark:bg-teal-900/20 rounded-md"><label htmlFor="x_input" className={`font-bold text-lg ${design.pointColors.X.text.replace('-600', '-800').replace('-400', '-200')}`}>X =</label><input id="x_input" dir="ltr" type="text" value={userAnswer.x} onChange={(e) => handleInputChange('x', e.target.value)} disabled={disabled} className={`w-24 h-12 text-center rounded-lg text-xl font-mono focus:ring-2 focus:outline-none ${design.components.input.base} focus:ring-teal-500`}/></div><div className="flex-1 flex items-center justify-center gap-2 p-2 bg-purple-50/50 dark:bg-purple-900/20 rounded-md"><label htmlFor="y_input" className={`font-bold text-lg ${design.pointColors.Y.text.replace('-600', '-800').replace('-400', '-200')}`}>Y =</label><input id="y_input" dir="ltr" type="text" value={userAnswer.y} onChange={(e) => handleInputChange('y', e.target.value)} disabled={disabled} className={`w-24 h-12 text-center rounded-lg text-xl font-mono focus:ring-2 focus:outline-none ${design.components.input.base} focus:ring-purple-500`}/></div></div></div>);
};

const SlopeFormulaHint = ({ question }) => {
    const { A, B } = question.points;
    return (
        <div className={`p-3 mb-4 ${design.colors.feedback.warning.bg} border-r-4 ${design.colors.feedback.warning.border} rounded-md`}>
            <p className={`font-bold ${design.colors.feedback.warning.text} mb-2 text-center`}>רמז: חישוב שיפוע</p>
            <div dir="ltr" className="font-mono text-center text-lg flex items-center justify-center gap-1">
                <span>m =</span>
                <div className="inline-flex flex-col items-center">
                    <span>
                        <span className={design.pointColors.B.text}>{B.y}</span> - (<span className={design.pointColors.A.text}>{A.y}</span>)
                    </span>
                    <hr className="w-full border-t border-current my-1" />
                    <span>
                        <span className={design.pointColors.B.text}>{B.x}</span> - (<span className={design.pointColors.A.text}>{A.x}</span>)
                    </span>
                </div>
            </div>
        </div>
    );
};

const DistanceFormulaHint = ({ question }) => {
    const { A, B } = question.points;
    return (
        <div className={`p-3 mb-4 ${design.colors.feedback.warning.bg} border-r-4 ${design.colors.feedback.warning.border} rounded-md`}>
            <p className={`font-bold ${design.colors.feedback.warning.text} mb-2 text-center`}>רמז: חישוב מרחק</p>
            <div dir="ltr" className="font-mono text-center text-lg flex items-center justify-center gap-1">
                d = &radic;[ (<span className={design.pointColors.B.text}>{B.x}</span> - <span className={design.pointColors.A.text}>{A.x}</span>)² + (<span className={design.pointColors.B.text}>{B.y}</span> - <span className={design.pointColors.A.text}>{A.y}</span>)² ]
            </div>
        </div>
    );
};

const PerpendicularSlopeFormulaHint = ({ question }) => {
    const m1 = -1 / (question.solution as number);
    return (
         <div className={`p-3 mb-4 ${design.colors.feedback.warning.bg} border-r-4 ${design.colors.feedback.warning.border} rounded-md`}>
            <p className={`font-bold ${design.colors.feedback.warning.text} mb-2 text-center`}>רמז: חישוב שיפוע מאונך</p>
            <div dir="ltr" className="font-mono text-center text-lg flex items-center justify-center gap-1">
                m₂ = -1 / m₁ = -1 / ({m1.toFixed(2).replace(/\.00$/, '')})
            </div>
        </div>
    );
};

const DetailedFormulaHint = ({ question }) => {
    switch (question.type) {
        case 'CALCULATE_SLOPE':
            return <SlopeFormulaHint question={question} />;
        case 'CALCULATE_DISTANCE':
            return <DistanceFormulaHint question={question} />;
        case 'FIND_PERPENDICULAR_SLOPE':
            return <PerpendicularSlopeFormulaHint question={question} />;
        default:
            return null;
    }
};

// --- PRACTICE SESSION COMPONENT ---
const PracticeSession = ({ config, updateUser, onEndSession }) => {
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [userAnswer, setUserAnswer] = useState<string | Point | number | { x: string; y: string }>('');
    const [attemptsLeft, setAttemptsLeft] = useState(3);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [hintLevel, setHintLevel] = useState(0);
    const [geminiExplanation, setGeminiExplanation] = useState<{text: string, image: string | null} | null>(null);
    const [geminiLoading, setGeminiLoading] = useState(false);
    const [score, setScore] = useState(0);
    const [potentialPoints, setPotentialPoints] = useState(0);
    
    const difficulty = DIFFICULTY_LEVELS[Object.keys(DIFFICULTY_LEVELS).find(key => DIFFICULTY_LEVELS[key].id === config.difficulty)];

    const loadNewQuestion = useCallback(() => {
        const question = generateQuestion(config);
        setCurrentQuestion(question);
        
        if (['FIND_MIDPOINT', 'FIND_ENDPOINT', 'FIND_INTERSECTION_POINT'].includes(question.type)) {
          setUserAnswer({ x: '', y: '' });
        } else {
          setUserAnswer('');
        }
        
        setAttemptsLeft(3);
        setIsCorrect(null);
        setGeminiExplanation(null);
        
        if (question.difficulty === 'easy') { setHintLevel(2); }
        else if (question.difficulty === 'medium') { setHintLevel(1); }
        else { setHintLevel(0); }

        setPotentialPoints(10 * difficulty.multiplier);
    }, [config, difficulty]);

    useEffect(() => { loadNewQuestion(); }, [loadNewQuestion]);

    const handleGetGeminiExplanation = async () => { /* ... (implementation unchanged) ... */ };

    const handleSubmit = () => {
        if (!currentQuestion || isCorrect !== null) return;
        let isAnswerCorrect = false;
        const solution = currentQuestion.solution;
        const checkFloatEquality = (a, b) => Math.abs(a - b) < 0.01;

        switch(currentQuestion.type) {
            case 'CALCULATE_AREA':
            case 'CALCULATE_SLOPE':
            case 'CALCULATE_DISTANCE':
            case 'FIND_PERPENDICULAR_SLOPE':
                 const numAnswer = parseFloat(userAnswer as string);
                 isAnswerCorrect = !isNaN(numAnswer) && checkFloatEquality(numAnswer, solution as number);
                 break;
            case 'FIND_MIDPOINT_VISUAL':
            case 'FIND_MIDPOINT_MCQ':
            case 'FIND_ENDPOINT_MCQ':
            case 'FIND_INTERSECTION_POINT':
                 const userAnswerPoint = userAnswer as Point;
                 const solutionPoint = solution as Point;
                 isAnswerCorrect = userAnswerPoint.x === solutionPoint.x && userAnswerPoint.y === solutionPoint.y;
                 break;
            case 'IDENTIFY_COORDINATES':
                 const pointAnswerStr = (userAnswer as string).replace(/\s/g, '');
                 const solutionPointForStr = solution as Point;
                 const solutionStr = `(${solutionPointForStr.x},${solutionPointForStr.y})`;
                 isAnswerCorrect = pointAnswerStr === solutionStr;
                 break;
            case 'FIND_MIDPOINT':
            case 'FIND_ENDPOINT':
                const ua = userAnswer as { x: string; y: string };
                const sol = solution as Point;
                const userX = parseFloat(ua.x);
                const userY = parseFloat(ua.y);
                isAnswerCorrect = !isNaN(userX) && !isNaN(userY) && checkFloatEquality(userX, sol.x) && checkFloatEquality(userY, sol.y);
                break;
        }

        if (isAnswerCorrect) {
            const pointsToAdd = potentialPoints;
            setScore(prev => prev + pointsToAdd);
            updateUser(pointsToAdd, 1);
            setIsCorrect(true);
        } else {
            const newAttemptsLeft = attemptsLeft - 1;
            setAttemptsLeft(newAttemptsLeft);
            if (difficulty.id === 'medium' && attemptsLeft === 3) {
                setHintLevel(2); 
                setPotentialPoints(DIFFICULTY_LEVELS.EASY.multiplier * 10);
            }
            if (difficulty.id === 'hard') {
                if (attemptsLeft === 3) { setHintLevel(1); setPotentialPoints(prev => prev - 5); }
                else if (attemptsLeft === 2) { setHintLevel(2); setPotentialPoints(prev => prev - 5); }
            }
            if (newAttemptsLeft === 0) { setIsCorrect(false); }
        }
    };

    if (!currentQuestion) { return <div className="text-center p-10"><p className="text-xl font-semibold">טוען תרגיל...</p></div>; }

    const isFeedbackState = isCorrect !== null;
    const solution = currentQuestion.solution;
    const solutionText = typeof solution === 'object' ? `(${solution.x},${solution.y})` : (typeof solution === 'number' ? solution.toFixed(2).replace(/\.00$/, '') : solution);
    
    const isVisualInput = currentQuestion.type === 'FIND_MIDPOINT_VISUAL';
    const isMCQInput = currentQuestion.type.includes('MCQ');
    const isCalculationInput = ['FIND_MIDPOINT', 'FIND_ENDPOINT', 'FIND_INTERSECTION_POINT'].includes(currentQuestion.type);
    const isTextInput = currentQuestion.type === 'IDENTIFY_COORDINATES';
    const isSingleNumberInput = ['CALCULATE_AREA', 'CALCULATE_SLOPE', 'CALCULATE_DISTANCE', 'FIND_PERPENDICULAR_SLOPE'].includes(currentQuestion.type);
    
    const subjectId = Object.keys(SUBJECTS).find(key => key.toLowerCase().includes(currentQuestion.type.split('_')[1]?.toLowerCase())) || 'PRACTICE';
    const subjectTitle = Object.values(SUBJECTS).find(s => s.id.startsWith(subjectId.toLowerCase().split('_')[0]))?.name || 'תרגול';

    let isSubmitDisabled = isFeedbackState || userAnswer === '';
    if (isCalculationInput) { const ua = userAnswer as { x: string, y: string }; isSubmitDisabled = isSubmitDisabled || ua.x === '' || ua.y === ''; }

    const getGeneralHint = () => {
        if (isCorrect !== null || hintLevel === 0 || hintLevel === 2) return null; // Level 2 hints are shown elsewhere
        let title = '', formula = null;
        switch(currentQuestion.type) {
            case 'FIND_MIDPOINT': case 'FIND_MIDPOINT_MCQ': return <GeneralFormulaHint />;
            case 'FIND_ENDPOINT': case 'FIND_ENDPOINT_MCQ': return <EndpointFormulaHint />;
            case 'CALCULATE_SLOPE': title = 'נוסחת שיפוע'; formula = <>m = (y₂ - y₁) / (x₂ - x₁)</>; break;
            case 'CALCULATE_DISTANCE': title = 'נוסחת מרחק'; formula = <>d = &radic;[(x₂-x₁)² + (y₂-y₁)²]</>; break;
            case 'FIND_PERPENDICULAR_SLOPE': title = 'תנאי ניצבות'; formula = <>m₁ &middot; m₂ = -1</>; break;
            default: return null;
        }
        return <GenericFormulaHint title={title} formula={formula} />;
    };

    const getLinesForPlane = () => {
        if (!currentQuestion?.lines) return [];
        // Fix: Removed unused `yRange` property to resolve error.
        const { xRange, center } = { xRange: 15, center: { x: 0, y: 0 }}; // Use a default range for now
        return currentQuestion.lines.map((line, i) => {
            const x1 = center.x - xRange;
            const y1 = line.m * x1 + line.b;
            const x2 = center.x + xRange;
            const y2 = line.m * x2 + line.b;
            return { p1: { x: x1, y: y1 }, p2: { x: x2, y: y2 }, color: i === 0 ? 'stroke-blue-500' : 'stroke-red-500' };
        });
    };

    return (
      <div className="space-y-6">
        <div className={design.practice.baseCard}>
            <div className="flex justify-between items-center mb-4"><h2 className={design.typography.sectionTitle}>{subjectTitle}</h2><div className="text-right"><div className={design.practice.attemptsCounter}>ניקוד: {score}</div><div className={`${design.colors.text.muted.light} dark:${design.colors.text.muted.dark} text-lg font-bold`}>נשארו {attemptsLeft} נסיונות</div></div></div>
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-6 text-right"><ColoredText text={currentQuestion.question} /></p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <CoordinatePlane points={currentQuestion.points} lines={getLinesForPlane()} triangle={currentQuestion.type === 'CALCULATE_AREA' ? [currentQuestion.points.A, currentQuestion.points.B, currentQuestion.points.C] : undefined} onClick={isVisualInput && !isFeedbackState ? (point) => setUserAnswer(point) : undefined} userAnswer={isVisualInput ? userAnswer as Point : undefined} solution={isCorrect === false && typeof currentQuestion.solution === 'object' ? currentQuestion.solution as Point : undefined} />
                <div className="space-y-4">
                    {isVisualInput && userAnswer && !isFeedbackState && (<p className="text-center font-semibold text-gray-700 dark:text-gray-300">הבחירה שלך: <span dir="ltr">{`(${(userAnswer as Point).x}, ${(userAnswer as Point).y})`}</span></p>)}
                    {isMCQInput && (<div className="space-y-4">{hintLevel === 2 && <VisualFormulaDisplay question={currentQuestion} />}<div className="grid grid-cols-2 gap-3">{currentQuestion.options?.map((option, index) => (<button key={index} onClick={() => { if(!isFeedbackState) { setUserAnswer(option); } }} disabled={isFeedbackState} className={`${design.practice.mcqButton} ${userAnswer === option ? 'ring-2 ring-indigo-500' : ''}`}><ColoredPointDisplay point={option as Point} /></button>))}</div></div>)}
                    {isCalculationInput && <CalculationInput question={currentQuestion} userAnswer={userAnswer as {x: string, y: string}} onChange={setUserAnswer} disabled={isFeedbackState} hintLevel={hintLevel} />}
                    
                    { (isSingleNumberInput || isTextInput) && hintLevel === 2 && <DetailedFormulaHint question={currentQuestion} /> }

                    {isTextInput && <MathInput value={userAnswer as string} onChange={(val) => setUserAnswer(val)} disabled={isFeedbackState} />}
                    {isSingleNumberInput && <input type="number" step="any" value={userAnswer as string} onChange={(e) => setUserAnswer(e.target.value)} disabled={isFeedbackState} placeholder="הכנס/י את התשובה" className={`w-full h-14 text-center rounded-lg text-2xl font-mono focus:ring-2 focus:outline-none ${design.components.input.base} focus:ring-indigo-500`} />}
                    
                    <button onClick={handleSubmit} disabled={isSubmitDisabled} className={`w-full ${design.components.button.base} ${design.components.button.primary} ${design.components.button.disabled}`}>{isFeedbackState ? 'התשובה נבדקה' : 'בדוק/י תשובה'}</button>
                    {getGeneralHint()}
                </div>
            </div>
        </div>
        {isFeedbackState && (
            <div className={design.practice.feedbackCard(isCorrect)}>
                <h3 className={`text-2xl font-bold ${isCorrect ? design.colors.feedback.success.text : design.colors.feedback.error.text}`}>{isCorrect ? `כל הכבוד! +${potentialPoints} נקודות` : 'אופס, זו לא התשובה הנכונה.'}</h3>
                {!isCorrect && (<div className={`mt-4 ${design.colors.feedback.error.text}`}><p>התשובה הנכונה: <span dir="ltr" className="font-mono font-bold">{solutionText}</span></p><button onClick={handleGetGeminiExplanation} disabled={geminiLoading} className={`mt-2 text-sm text-${design.colors.primary.DEFAULT} dark:text-indigo-400 hover:underline disabled:opacity-50`}>{geminiLoading ? 'חושב...' : 'הסבר עם Gemini'}</button></div>)}
                {geminiExplanation && (<div className={`mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg`}><p className="whitespace-pre-wrap">{geminiExplanation.text}</p>{geminiExplanation.image && <img src={geminiExplanation.image} alt="Visual explanation" className="mt-4 rounded-md w-full max-w-sm mx-auto" />}</div>)}
                <button onClick={loadNewQuestion} className={`mt-6 ${design.components.button.base} bg-gray-700 hover:bg-gray-600 text-white`}>תרגיל הבא</button>
            </div>
        )}
         <button onClick={onEndSession} className={`w-full max-w-xs mx-auto ${design.components.button.base} ${design.components.button.secondary}`}>חזרה לבחירת תרגול</button>
      </div>
    );
};

// --- SETUP COMPONENT ---
export default function PracticeEngine({ updateUser }) {
    const [sessionConfig, setSessionConfig] = useState<{ subjects: string[]; difficulty: Difficulty['id'] } | null>(null);
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([SUBJECTS.MIDPOINT.id]);
    const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty['id']>(DIFFICULTY_LEVELS.EASY.id);
    const handleSubjectToggle = (subjectId: string) => { setSelectedSubjects(prev => prev.includes(subjectId) ? prev.filter(id => id !== subjectId) : [...prev, subjectId]); };
    const handleStartSession = () => { if (selectedSubjects.length > 0) { setSessionConfig({ subjects: selectedSubjects, difficulty: selectedDifficulty }); } };
    if (!sessionConfig) { return (<div className={`${design.layout.card} max-w-2xl mx-auto space-y-8`}><div><h2 className="text-3xl font-bold text-center mb-2">הגדרות תרגול</h2><p className={`text-center ${design.colors.text.muted.light} dark:${design.colors.text.muted.dark}`}>בחר/י נושאים ורמת קושי כדי להתחיל</p></div><div className="space-y-4"><h3 className="text-xl font-semibold">נושאים</h3><div className="grid grid-cols-2 gap-4">{Object.values(SUBJECTS).map(subject => (subject.practice ? (<label key={subject.id} className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-colors ${selectedSubjects.includes(subject.id) ? 'bg-indigo-50 border-indigo-500 dark:bg-indigo-900/50' : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'}`}><input type="checkbox" checked={selectedSubjects.includes(subject.id)} onChange={() => handleSubjectToggle(subject.id)} className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"/><span className="mr-3 font-medium text-gray-800 dark:text-gray-200">{subject.name}</span></label>) : (<div key={subject.id} className="flex items-center p-4 rounded-lg border-2 bg-gray-100 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600/50 opacity-60"><input type="checkbox" disabled className="h-5 w-5 rounded border-gray-300"/><span className="mr-3 font-medium text-gray-500 dark:text-gray-400">{subject.name}</span><span className="text-xs bg-yellow-400 text-gray-800 font-semibold px-2 py-0.5 rounded-full mr-auto">בקרוב</span></div>)))}</div></div><div className="space-y-4"><h3 className="text-xl font-semibold">רמת קושי</h3><div className="flex justify-between gap-4">{Object.values(DIFFICULTY_LEVELS).map(level => (<label key={level.id} className={`flex-1 text-center p-4 rounded-lg border-2 cursor-pointer transition-colors ${selectedDifficulty === level.id ? 'bg-indigo-50 border-indigo-500 dark:bg-indigo-900/50' : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'}`}><input type="radio" name="difficulty" value={level.id} checked={selectedDifficulty === level.id} onChange={() => setSelectedDifficulty(level.id)} className="sr-only"/><span className="font-bold text-gray-800 dark:text-gray-200">{level.name}</span><span className="block text-sm text-gray-500 dark:text-gray-400">x{level.multiplier} נקודות</span></label>))}</div></div><button onClick={handleStartSession} disabled={selectedSubjects.length === 0} className={`w-full ${design.components.button.base} ${design.components.button.primary} ${design.components.button.disabled}`}>התחל תרגול</button></div>); }
    return <PracticeSession config={sessionConfig} updateUser={updateUser} onEndSession={() => setSessionConfig(null)} />;
}