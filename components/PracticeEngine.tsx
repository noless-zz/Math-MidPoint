import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { generateQuestion } from '../services/exerciseGenerator.ts';
import { Question, Point, SUBJECTS, DIFFICULTY_LEVELS, Difficulty } from '../types.ts';
import MathInput from './MathInput.tsx';
import CoordinatePlane from './CoordinatePlane.tsx';
import { design } from '../constants/design_system.ts';

// --- HELPER COMPONENTS for COLOR EMPHASIS ---
const ColoredText = ({ text }) => {
    const parts = text.split(/([ABCM]\(-?\d+,\s*-?\d+\))/g);
    return (
        <>
            {parts.map((part, index) => {
                const match = part.match(/([ABCM])/);
                if (match) {
                    const pointLetter = match[1];
                    return <span key={index} dir="ltr" className={`inline-block font-bold ${design.pointColors[pointLetter]?.text}`}>{part}</span>;
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


const RenderFormulaPart = ({ value, isFirst = false }) => {
    const isNegative = value < 0;
    if (isFirst) {
        return <>{value}</>;
    }
    if (isNegative) {
        return <><span className="mx-1">-</span> {Math.abs(value)}</>;
    }
    return <><span className="mx-1">+</span> {value}</>;
};

const VisualFormulaDisplay = ({ question }) => {
    const { type, points } = question;

    const getFormulaForEndpoint = (coord: 'x' | 'y') => {
      const isX = coord === 'x';
      const M = isX ? points.M.x : points.M.y;
      const A = isX ? points.A.x : points.A.y;
      
      return (
        <p dir="ltr" className="font-mono text-lg text-center flex items-center justify-center">
          <span>{isX ? 'X' : 'Y'}<sub>b</sub> = (2 &times; <span className={design.pointColors.M.text}>{M}</span>)</span>
          <span className={design.pointColors.A.text}><RenderFormulaPart value={-A} /></span>
        </p>
      );
    };

    const getFormulaForMidpoint = (coord: 'x' | 'y') => {
        const isX = coord === 'x';
        const A = isX ? points.A.x : points.A.y;
        const B = isX ? points.B.x : points.B.y;
         return (
            <div dir="ltr" className="flex items-center justify-center gap-1 font-mono text-lg text-center">
              <span>{isX ? 'X' : 'Y'}<sub>m</sub> =</span>
              <div className="inline-flex flex-col items-center">
                <span className="flex items-center">
                    <span className={design.pointColors.A.text}><RenderFormulaPart value={A} isFirst={true}/></span>
                    <span className={design.pointColors.B.text}><RenderFormulaPart value={B} /></span>
                </span>
                <hr className="w-full border-t border-current my-1" />
                <span>2</span>
              </div>
            </div>
          );
    };

    const formulaRenderer = type.includes('ENDPOINT') ? getFormulaForEndpoint : getFormulaForMidpoint;

    return (
         <div className="flex flex-col sm:flex-row gap-4">
             <div className={`${design.practice.visualFormulaBox.base} ${design.practice.visualFormulaBox.x}`}>
                <h4 className={design.practice.visualFormulaBox.xText}>חישוב שיעור X</h4>
                <div className="min-h-[40px] flex items-center justify-center">
                   {formulaRenderer('x')}
                </div>
            </div>
            <div className={`${design.practice.visualFormulaBox.base} ${design.practice.visualFormulaBox.y}`}>
                <h4 className={design.practice.visualFormulaBox.yText}>חישוב שיעור Y</h4>
                 <div className="min-h-[40px] flex items-center justify-center">
                   {formulaRenderer('y')}
                </div>
            </div>
        </div>
    );
};


const CalculationInput = ({ question, userAnswer, onChange, disabled, hintLevel }) => {
  const handleInputChange = (coord: 'x' | 'y', value: string) => {
    if (/^-?\d*$/.test(value)) {
      onChange({ ...userAnswer, [coord]: value });
    }
  };
  
  return (
    <div>
        {hintLevel === 2 && <VisualFormulaDisplay question={question} />}
        <div className={`flex flex-col sm:flex-row gap-4 ${hintLevel === 2 ? 'mt-4' : ''}`}>
            <div className="flex-1 flex items-center justify-center gap-2 p-2 bg-teal-50/50 dark:bg-teal-900/20 rounded-md">
                <label htmlFor="x_input" className={`font-bold text-lg ${design.pointColors.X.text.replace('-600', '-800').replace('-400', '-200')}`}>X =</label>
                <input
                    id="x_input"
                    dir="ltr"
                    type="text"
                    value={userAnswer.x}
                    onChange={(e) => handleInputChange('x', e.target.value)}
                    disabled={disabled}
                    className={`w-24 h-12 text-center rounded-lg text-xl font-mono focus:ring-2 focus:outline-none ${design.components.input.base} focus:ring-teal-500`}
                />
            </div>
            <div className="flex-1 flex items-center justify-center gap-2 p-2 bg-purple-50/50 dark:bg-purple-900/20 rounded-md">
                <label htmlFor="y_input" className={`font-bold text-lg ${design.pointColors.Y.text.replace('-600', '-800').replace('-400', '-200')}`}>Y =</label>
                <input
                    id="y_input"
                    dir="ltr"
                    type="text"
                    value={userAnswer.y}
                    onChange={(e) => handleInputChange('y', e.target.value)}
                    disabled={disabled}
                    className={`w-24 h-12 text-center rounded-lg text-xl font-mono focus:ring-2 focus:outline-none ${design.components.input.base} focus:ring-purple-500`}
                />
            </div>
        </div>
    </div>
  );
};


// --- PRACTICE SESSION COMPONENT ---
const PracticeSession = ({ config, updateUser, onEndSession }) => {
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [userAnswer, setUserAnswer] = useState<string | Point | number | { x: string; y: string }>('');
    const [attemptsLeft, setAttemptsLeft] = useState(3);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [hintLevel, setHintLevel] = useState(0); // 0: no hint, 1: formula, 2: filled formula
    const [geminiExplanation, setGeminiExplanation] = useState<{text: string, image: string | null} | null>(null);
    const [geminiLoading, setGeminiLoading] = useState(false);
    const [score, setScore] = useState(0);
    const [potentialPoints, setPotentialPoints] = useState(0);
    
    const difficulty = DIFFICULTY_LEVELS[Object.keys(DIFFICULTY_LEVELS).find(key => DIFFICULTY_LEVELS[key].id === config.difficulty)];

    const loadNewQuestion = useCallback(() => {
        const question = generateQuestion(config);
        setCurrentQuestion(question);
        
        if (question.type === 'FIND_MIDPOINT' || question.type === 'FIND_ENDPOINT') {
          setUserAnswer({ x: '', y: '' });
        } else {
          setUserAnswer('');
        }
        
        setAttemptsLeft(3);
        setIsCorrect(null);
        setGeminiExplanation(null);
        
        if (question.difficulty === 'easy' && question.type.includes('MIDPOINT')) {
            setHintLevel(2); 
        } else if (question.difficulty === 'medium' && question.type.includes('MIDPOINT')) {
            setHintLevel(1); 
        } else {
            setHintLevel(0);
        }

        const basePoints = 10;
        setPotentialPoints(basePoints * difficulty.multiplier);
    }, [config, difficulty]);

    useEffect(() => {
        loadNewQuestion();
    }, [loadNewQuestion]);

    const handleGetGeminiExplanation = async () => {
        if (!currentQuestion) return;
        setGeminiLoading(true);
        setGeminiExplanation(null);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const model = "gemini-2.5-flash";
            const jsonSchema = {
                type: Type.OBJECT,
                properties: {
                    explanation: {
                        type: Type.STRING,
                        description: "A step-by-step explanation of the solution. Use clean, simple, and mathematically precise text only. Do NOT use markdown like '*' or '_'. Address the student directly."
                    },
                    image_prompt: {
                        type: Type.STRING,
                        description: "Optional. A prompt for a text-to-image model to generate a helpful visual aid. Act as an expert mathematician and graphic designer. The prompt should create a clear, simple graph on a coordinate plane, plotting the exact points from the question and visually showing the solution path with formulas and calculations. Ensure the graph is mathematically correct."
                    }
                }
            };
            
            let problemContext = `The student needs to solve: "${currentQuestion.question}".`;
            if (currentQuestion.type === 'IDENTIFY_COORDINATES') {
                const pointName = Object.keys(currentQuestion.points).find(key => {
                    const p = currentQuestion.points[key];
                    const s = currentQuestion.solution as Point;
                    return p.x === s.x && p.y === s.y;
                });
                problemContext = `The student needs to identify the coordinates of point ${pointName} from the provided graph. The graph shows the point at (${(currentQuestion.solution as Point).x}, ${(currentQuestion.solution as Point).y}).`;
            }

            const response = await ai.models.generateContent({
                model,
                contents: `Explain the solution for this math problem for a 10th-grade student.
                ${problemContext}
                The correct answer is ${JSON.stringify(currentQuestion.solution)}.
                My incorrect answer was ${JSON.stringify(userAnswer)}.
                Provide a step-by-step explanation and an optional prompt for a helpful image.`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: jsonSchema,
                },
            });
            
            const result = JSON.parse(response.text);
            let imageUrl = null;
            if (result.image_prompt) {
                const imageResponse = await ai.models.generateContent({
                    model: 'gemini-2.5-flash-image',
                    contents: { parts: [{ text: result.image_prompt }] },
                    config: { responseModalities: ['IMAGE'] },
                });

                if (imageResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data) {
                    const base64ImageBytes = imageResponse.candidates[0].content.parts[0].inlineData.data;
                    imageUrl = `data:image/png;base64,${base64ImageBytes}`;
                }
            }
            setGeminiExplanation({ text: result.explanation, image: imageUrl });

        } catch (error) {
            console.error("Error fetching Gemini explanation:", error);
            setGeminiExplanation({ text: "מצטערים, ארעה שגיאה בקבלת ההסבר.", image: null });
        } finally {
            setGeminiLoading(false);
        }
    };

    const handleSubmit = () => {
        if (!currentQuestion || isCorrect !== null) return;

        let isAnswerCorrect = false;
        const solution = currentQuestion.solution;

        switch(currentQuestion.type) {
            case 'CALCULATE_AREA':
                 const numAnswer = parseFloat(userAnswer as string);
                 isAnswerCorrect = !isNaN(numAnswer) && numAnswer === solution;
                 break;
            case 'FIND_MIDPOINT_VISUAL':
            case 'FIND_MIDPOINT_MCQ':
            case 'FIND_ENDPOINT_MCQ':
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
                isAnswerCorrect = !isNaN(userX) && !isNaN(userY) && userX === sol.x && userY === sol.y;
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

            const isMidpointQuestion = currentQuestion.type.includes('MIDPOINT') || currentQuestion.type.includes('ENDPOINT');
            const isAreaQuestion = currentQuestion.type === 'CALCULATE_AREA';

            if (isMidpointQuestion) {
                if (difficulty.id === 'medium' && attemptsLeft === 3) { // After 1st mistake on medium
                    setHintLevel(2); 
                    setPotentialPoints(DIFFICULTY_LEVELS.EASY.multiplier * 10);
                }
                if (difficulty.id === 'hard') {
                    if (attemptsLeft === 3) { // After 1st mistake on hard
                        setHintLevel(1); 
                        setPotentialPoints(prev => prev - 5);
                    } else if (attemptsLeft === 2) { // After 2nd mistake on hard
                        setHintLevel(2); 
                        setPotentialPoints(prev => prev - 5);
                    }
                }
            }
             if (isAreaQuestion && difficulty.id === 'medium' && attemptsLeft === 3) {
                 setHintLevel(1);
             }

            if (newAttemptsLeft === 0) {
                setIsCorrect(false);
                 if (currentQuestion.type === 'FIND_MIDPOINT_VISUAL') {
                    setUserAnswer(currentQuestion.solution as Point);
                }
            }
        }
    };

    if (!currentQuestion) {
        return <div className="text-center p-10"><p className="text-xl font-semibold">טוען תרגיל...</p></div>;
    }

    const isFeedbackState = isCorrect !== null;
    const solution = currentQuestion.solution;
    const solutionText = typeof solution === 'object' ? `(${solution.x},${solution.y})` : solution;
    
    const isVisualInput = currentQuestion.type === 'FIND_MIDPOINT_VISUAL';
    const isMCQInput = currentQuestion.type === 'FIND_MIDPOINT_MCQ' || currentQuestion.type === 'FIND_ENDPOINT_MCQ';
    const isCalculationInput = currentQuestion.type === 'FIND_MIDPOINT' || currentQuestion.type === 'FIND_ENDPOINT';
    const isTextInput = currentQuestion.type === 'IDENTIFY_COORDINATES';
    const isAreaInput = currentQuestion.type === 'CALCULATE_AREA';
    
    const h2TitleKey = currentQuestion.type.includes('MIDPOINT') || currentQuestion.type.includes('ENDPOINT') 
        ? 'MIDPOINT' 
        : currentQuestion.type.split('_').pop();

    const subjectTitle = SUBJECTS[Object.keys(SUBJECTS).find(s => s.includes(h2TitleKey))]?.name || 'תרגול';

    let isSubmitDisabled = isFeedbackState || userAnswer === '';
     if (isCalculationInput) {
      const ua = userAnswer as { x: string, y: string };
      isSubmitDisabled = isSubmitDisabled || ua.x === '' || ua.y === '';
    }

    const isMidpointQuestion = currentQuestion.type.includes('MIDPOINT') || currentQuestion.type.includes('ENDPOINT');
    const isEndpointQuestion = currentQuestion.type.includes('ENDPOINT');

    return (
      <div className="space-y-6">
        <div className={design.practice.baseCard}>
            <div className="flex justify-between items-center mb-4">
                <h2 className={design.typography.sectionTitle}>{subjectTitle}</h2>
                <div className="text-right">
                    <div className={design.practice.attemptsCounter}>ניקוד: {score}</div>
                    <div className={`${design.colors.text.muted.light} dark:${design.colors.text.muted.dark} text-lg font-bold`}>נשארו {attemptsLeft} נסיונות</div>
                </div>
            </div>
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-6 text-right">
                <ColoredText text={currentQuestion.question} />
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <CoordinatePlane
                    points={currentQuestion.points}
                    triangle={isAreaInput ? [currentQuestion.points.A, currentQuestion.points.B, currentQuestion.points.C] : undefined}
                    onClick={isVisualInput && !isFeedbackState ? (point) => setUserAnswer(point) : undefined}
                    userAnswer={isVisualInput ? userAnswer as Point : undefined}
                    solution={isCorrect === false && !isAreaInput && !isCalculationInput ? currentQuestion.solution as Point : undefined}
                />
                <div className="space-y-4">
                    {isVisualInput && userAnswer && !isFeedbackState && (
                        <p className="text-center font-semibold text-gray-700 dark:text-gray-300">
                            הבחירה שלך: <span dir="ltr">{`(${(userAnswer as Point).x}, ${(userAnswer as Point).y})`}</span>
                        </p>
                    )}
                    {isMCQInput && (
                        <div className="space-y-4">
                            {hintLevel === 2 && <VisualFormulaDisplay question={currentQuestion} />}
                            <div className="grid grid-cols-2 gap-3">
                                {currentQuestion.options?.map((option, index) => (
                                    <button key={index} onClick={() => { if(!isFeedbackState) { setUserAnswer(option); } }} disabled={isFeedbackState}
                                        className={`${design.practice.mcqButton} ${userAnswer === option ? 'ring-2 ring-indigo-500' : ''}`}>
                                        <ColoredPointDisplay point={option} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {isCalculationInput && <CalculationInput question={currentQuestion} userAnswer={userAnswer as {x: string, y: string}} onChange={setUserAnswer} disabled={isFeedbackState} hintLevel={hintLevel} />}
                    
                    {isTextInput && <MathInput value={userAnswer as string} onChange={(val) => setUserAnswer(val)} disabled={isFeedbackState} />}

                    {isAreaInput && <input
                            type="number" step="any" value={userAnswer as string} onChange={(e) => setUserAnswer(e.target.value)}
                            disabled={isFeedbackState} placeholder="הכנס/י את השטח"
                            className={`w-full h-14 text-center rounded-lg text-2xl font-mono focus:ring-2 focus:outline-none ${design.components.input.base} focus:ring-indigo-500`}
                    />}

                    <button onClick={handleSubmit} disabled={isSubmitDisabled} className={`w-full ${design.components.button.base} ${design.components.button.primary} ${design.components.button.disabled}`}>{isFeedbackState ? 'התשובה נבדקה' : 'בדוק/י תשובה'}</button>
                    
                    {isCorrect === null && isMidpointQuestion && hintLevel === 1 && (
                        isEndpointQuestion ? <EndpointFormulaHint /> : <GeneralFormulaHint />
                    )}
                    
                    {isCorrect === null && isMidpointQuestion && hintLevel === 2 && !isMCQInput && !isCalculationInput && (
                        <VisualFormulaDisplay question={currentQuestion} />
                    )}
                    
                    {isCorrect === null && isAreaInput && hintLevel === 1 &&
                        <div className={`p-3 ${design.colors.feedback.warning.bg} border-r-4 ${design.colors.feedback.warning.border} text-sm`}>
                            <p className="font-bold">רמז:</p>
                            <p>Area = (base * height) / 2</p>
                        </div>
                    }
                </div>
            </div>
        </div>
        {isFeedbackState && (
            <div className={design.practice.feedbackCard(isCorrect)}>
                <h3 className={`text-2xl font-bold ${isCorrect ? design.colors.feedback.success.text : design.colors.feedback.error.text}`}>
                    {isCorrect ? `כל הכבוד! +${potentialPoints} נקודות` : 'אופס, זו לא התשובה הנכונה.'}
                </h3>
                {!isCorrect && (
                    <div className={`mt-4 ${design.colors.feedback.error.text}`}>
                        <p>התשובה הנכונה: <span dir="ltr" className="font-mono font-bold">{solutionText}</span></p>
                        <button onClick={handleGetGeminiExplanation} disabled={geminiLoading} className={`mt-2 text-sm text-${design.colors.primary.DEFAULT} dark:text-indigo-400 hover:underline disabled:opacity-50`}>
                            {geminiLoading ? 'חושב...' : 'הסבר עם Gemini'}
                        </button>
                    </div>
                )}
                {geminiExplanation && (
                    <div className={`mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg`}>
                        <p className="whitespace-pre-wrap">{geminiExplanation.text}</p>
                        {geminiExplanation.image && <img src={geminiExplanation.image} alt="Visual explanation" className="mt-4 rounded-md w-full max-w-sm mx-auto" />}
                    </div>
                )}
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

    const handleSubjectToggle = (subjectId: string) => {
        setSelectedSubjects(prev =>
            prev.includes(subjectId)
                ? prev.filter(id => id !== subjectId)
                : [...prev, subjectId]
        );
    };

    const handleStartSession = () => {
        if (selectedSubjects.length > 0) {
            setSessionConfig({
                subjects: selectedSubjects,
                difficulty: selectedDifficulty,
            });
        }
    };

    if (!sessionConfig) {
        return (
            <div className={`${design.layout.card} max-w-2xl mx-auto space-y-8`}>
                <div>
                    <h2 className="text-3xl font-bold text-center mb-2">הגדרות תרגול</h2>
                    <p className={`text-center ${design.colors.text.muted.light} dark:${design.colors.text.muted.dark}`}>בחר/י נושאים ורמת קושי כדי להתחיל</p>
                </div>

                <div className="space-y-4">
                    <h3 className="text-xl font-semibold">נושאים</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {Object.values(SUBJECTS).map(subject => (
                           subject.practice ? (
                             <label key={subject.id} className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-colors ${selectedSubjects.includes(subject.id) ? 'bg-indigo-50 border-indigo-500 dark:bg-indigo-900/50' : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'}`}>
                                <input
                                    type="checkbox"
                                    checked={selectedSubjects.includes(subject.id)}
                                    onChange={() => handleSubjectToggle(subject.id)}
                                    className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="mr-3 font-medium text-gray-800 dark:text-gray-200">{subject.name}</span>
                            </label>
                           ) : (
                             <div key={subject.id} className="flex items-center p-4 rounded-lg border-2 bg-gray-100 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600/50 opacity-60">
                                <input type="checkbox" disabled className="h-5 w-5 rounded border-gray-300"/>
                                <span className="mr-3 font-medium text-gray-500 dark:text-gray-400">{subject.name}</span>
                                 <span className="text-xs bg-yellow-400 text-gray-800 font-semibold px-2 py-0.5 rounded-full mr-auto">בקרוב</span>
                             </div>
                           )
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-xl font-semibold">רמת קושי</h3>
                    <div className="flex justify-between gap-4">
                        {Object.values(DIFFICULTY_LEVELS).map(level => (
                             <label key={level.id} className={`flex-1 text-center p-4 rounded-lg border-2 cursor-pointer transition-colors ${selectedDifficulty === level.id ? 'bg-indigo-50 border-indigo-500 dark:bg-indigo-900/50' : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'}`}>
                                <input
                                    type="radio"
                                    name="difficulty"
                                    value={level.id}
                                    checked={selectedDifficulty === level.id}
                                    onChange={() => setSelectedDifficulty(level.id)}
                                    className="sr-only"
                                />
                                <span className="font-bold text-gray-800 dark:text-gray-200">{level.name}</span>
                                <span className="block text-sm text-gray-500 dark:text-gray-400">x{level.multiplier} נקודות</span>
                            </label>
                        ))}
                    </div>
                </div>

                <button
                    onClick={handleStartSession}
                    disabled={selectedSubjects.length === 0}
                    className={`w-full ${design.components.button.base} ${design.components.button.primary} ${design.components.button.disabled}`}
                >
                    התחל תרגול
                </button>
            </div>
        );
    }

    return <PracticeSession config={sessionConfig} updateUser={updateUser} onEndSession={() => setSessionConfig(null)} />;
}