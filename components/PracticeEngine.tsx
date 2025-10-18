import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { generateQuestion } from '../services/exerciseGenerator.ts';
import { AnswerFormat as AF, QuestionType as QT, SUBJECTS, DIFFICULTY_LEVELS } from '../types.ts';
import CoordinatePlane from './CoordinatePlane.tsx';

// --- AI Service ---
const API_KEY = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: API_KEY });

// --- Helper Functions and Components ---

const FormattedPoint = ({ point }) => (
    <span dir="ltr" className="font-mono">({point.x}, {point.y})</span>
);

const pointColors = {
    A: 'text-blue-600 dark:text-blue-400',
    B: 'text-orange-500 dark:text-orange-400',
    M: 'text-pink-500 dark:text-pink-400',
};

const coordColors = {
    X: {
        text: 'text-teal-600 dark:text-teal-400',
        border: 'border-teal-500',
        focus: 'focus:border-teal-500 focus:ring-teal-500',
        bg: 'bg-teal-50 dark:bg-teal-900/50',
    },
    Y: {
        text: 'text-purple-600 dark:text-purple-400',
        border: 'border-purple-500',
        focus: 'focus:border-purple-500 focus:ring-purple-500',
        bg: 'bg-purple-50 dark:bg-purple-900/50',
    }
};

const PointSpan = ({ name, point }) => (
    <span className={`${pointColors[name]} font-bold`}>
        {name}<FormattedPoint point={point} />
    </span>
);

const QuestionTextView = ({ question }) => {
    const { A, B, M } = question.points;
    if (question.type === QT.FindMidpoint) {
      return <span>נתונות הנקודות <PointSpan name="A" point={A} /> ו-<PointSpan name="B" point={B} />. מהי נקודת האמצע M של הקטע AB?</span>;
    } else {
      return <span>נתונה הנקודה <PointSpan name="A" point={A} /> ונקודת האמצע <PointSpan name="M" point={M} /> של קטע. מצא את נקודת הקצה השנייה B.</span>;
    }
};

const EndpointFormula = ({ variable, numM, numA, colorM, colorA }) => {
    const operator = numA < 0 ? '+' : '-';
    const displayNumA = Math.abs(numA);
    return (
        <div dir="ltr" className="flex items-center justify-center gap-2 text-xl font-medium text-gray-800 dark:text-gray-100">
            <span>{variable.charAt(0)}<sub>{variable.charAt(1)}</sub> =</span>
            <div className="flex items-center gap-1.5">
                <span>(2</span>
                <span className="mx-1">×</span>
                <span className={`${colorM} font-bold`}>{numM}</span>
                <span>)</span>
                <span className="mx-1">{operator}</span>
                <span className={`${colorA} font-bold`}>{displayNumA}</span>
            </div>
        </div>
    );
};

const FractionFormula = ({ variable, num1, num2, color1, color2 }) => {
    const operator = num2 < 0 ? '-' : '+';
    const displayNum2 = Math.abs(num2);
    return (
        <div dir="ltr" className="flex items-center justify-center gap-2 text-xl font-medium text-gray-800 dark:text-gray-100">
            <span>{variable.charAt(0)}<sub>{variable.charAt(1)}</sub> =</span>
            <div className="inline-flex flex-col items-center">
                <span className="flex items-center gap-1.5 px-2">
                    <span className={`${color1} font-bold`}>{num1}</span>
                    <span>{operator}</span>
                    <span className={`${color2} font-bold`}>{displayNum2}</span>
                </span>
                <hr className="w-full border-t-2 border-gray-700 dark:border-gray-200" />
                <span className="pt-0.5">2</span>
            </div>
        </div>
    );
};

const FormulaDisplay = ({ question }) => {
    const { type, points } = question;
    const { A, B, M } = points;
    
    return (
        <div className="flex flex-col md:flex-row justify-center items-stretch gap-8 my-6">
             {/* Y Coordinate Formula */}
            <div className={`p-4 rounded-lg border-2 w-full flex-1 flex flex-col items-center ${coordColors.Y.border} ${coordColors.Y.bg}`}>
                 <h3 className={`font-bold text-lg mb-2 ${coordColors.Y.text}`}>חישוב שיעור Y</h3>
                <div className="h-16 flex-grow flex items-center justify-center">
                    {type === QT.FindMidpoint && B && (
                        <FractionFormula variable="Ym" num1={A.y} num2={B.y} color1={pointColors.A} color2={pointColors.B} />
                    )}
                    {type === QT.FindEndpoint && M && (
                        <EndpointFormula variable="Yb" numM={M.y} numA={A.y} colorM={pointColors.M} colorA={pointColors.A} />
                    )}
                </div>
            </div>
            {/* X Coordinate Formula */}
             <div className={`p-4 rounded-lg border-2 w-full flex-1 flex flex-col items-center ${coordColors.X.border} ${coordColors.X.bg}`}>
                <h3 className={`font-bold text-lg mb-2 ${coordColors.X.text}`}>חישוב שיעור X</h3>
                <div className="h-16 flex-grow flex items-center justify-center">
                    {type === QT.FindMidpoint && B && (
                        <FractionFormula variable="Xm" num1={A.x} num2={B.x} color1={pointColors.A} color2={pointColors.B} />
                    )}
                    {type === QT.FindEndpoint && M && (
                         <EndpointFormula variable="Xb" numM={M.x} numA={A.x} colorM={pointColors.M} colorA={pointColors.A} />
                    )}
                </div>
            </div>
        </div>
    );
};

const MAX_ATTEMPTS = 3;

// --- Practice Session Component ---
const PracticeSession = ({ config, updateUser, onExit }) => {
  const [question, setQuestion] = useState(null);
  const [userAnswerPoint, setUserAnswerPoint] = useState(null);
  const [userAnswerX, setUserAnswerX] = useState('');
  const [userAnswerY, setUserAnswerY] = useState('');
  const [answerState, setAnswerState] = useState('initial'); // initial, correct, incorrect_try, incorrect_final
  const [attempts, setAttempts] = useState(0);
  const [pointsForQuestion, setPointsForQuestion] = useState(0);
  const [geminiExplanation, setGeminiExplanation] = useState('');
  const [geminiImageUrl, setGeminiImageUrl] = useState('');
  const [isGeminiLoading, setIsGeminiLoading] = useState(false);

  const difficulty = useMemo(() => DIFFICULTY_LEVELS[config.difficulty], [config.difficulty]);

  const loadNewQuestion = useCallback(() => {
    const newQuestion = generateQuestion({ subjects: config.subjects, difficulty });
    setQuestion(newQuestion);
    setUserAnswerPoint(null);
    setUserAnswerX('');
    setUserAnswerY('');
    setAnswerState('initial');
    setAttempts(0);
    setPointsForQuestion(10 * difficulty.multiplier);
    setGeminiExplanation('');
    setGeminiImageUrl('');
    setIsGeminiLoading(false);
  }, [config, difficulty]);

  useEffect(() => {
    loadNewQuestion();
  }, [loadNewQuestion]);

  const handleAnswerSubmit = () => {
    if (!question) return;

    let finalAnswerPoint = userAnswerPoint;
    if (question.answerFormat === AF.TextInput) {
        const x = parseFloat(userAnswerX);
        const y = parseFloat(userAnswerY);
        finalAnswerPoint = (!isNaN(x) && !isNaN(y)) ? { x, y } : null;
    }
    
    setUserAnswerPoint(finalAnswerPoint);

    const isCorrect = finalAnswerPoint !== null && 
                      finalAnswerPoint.x === question.answer.x && 
                      finalAnswerPoint.y === question.answer.y;
    
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    
    if (isCorrect) {
      setAnswerState('correct');
      updateUser(pointsForQuestion, 1);
    } else {
      let newPoints = pointsForQuestion;
      if (difficulty.id === DIFFICULTY_LEVELS.MEDIUM.id && newAttempts === 1) {
          newPoints = 10 * DIFFICULTY_LEVELS.EASY.multiplier;
      } else if (difficulty.id === DIFFICULTY_LEVELS.HARD.id) {
          newPoints = Math.max(0, pointsForQuestion - 5);
      }
      setPointsForQuestion(newPoints);
      
      if (newAttempts < MAX_ATTEMPTS) {
        setAnswerState('incorrect_try');
      } else {
        setAnswerState('incorrect_final');
        updateUser(0, 1);
      }
    }
  };

  const handleGeminiExplain = async () => {
    if (!question) return;
    setIsGeminiLoading(true);
    setGeminiExplanation('');
    setGeminiImageUrl('');
    
    const questionText = question.type === QT.FindMidpoint
      ? `נתונות הנקודות A(${question.points.A.x}, ${question.points.A.y}) ו-B(${question.points.B.x}, ${question.points.B.y}). מהי נקודת האמצע M של הקטע AB?`
      : `נתונה הנקודה A(${question.points.A.x}, ${question.points.A.y}) ונקודת האמצע M(${question.points.M.x}, ${question.points.M.y}) של קטע. מצא את נקודת הקצה השנייה B.`;

    const prompt = `
      You are a helpful math tutor for 10th-grade students, speaking Hebrew.
      Your task is to explain how to solve a given math problem about finding the midpoint or endpoint of a line segment on a 2D coordinate plane.

      The user has failed to solve this problem:
      Question: "${questionText}"
      Correct Answer: "(${question.answer.x}, ${question.answer.y})"

      Please provide your response as a JSON object with two fields: "explanation" and "imagePrompt".

      1.  **explanation**: A step-by-step explanation in Hebrew on how to solve the problem.
          - The explanation must be clean, simple, and mathematically precise, as if written by a teacher for a student.
          - It must be in **plain text only**.
          - Do **NOT** use any markdown (like **, *, #, _) or special formatting characters (like $, ', ").
          - Use simple line breaks for readability. Avoid complex formatting.

      2.  **imagePrompt**: A decision on whether a visual aid is needed.
          - If a graph would help, create a detailed, descriptive prompt in ENGLISH for an AI image generator.
          - When creating the prompt, act as an **expert mathematician and graphic designer**.
          - The generated image must be **mathematically correct**. Ensure all points are plotted accurately on the Cartesian plane according to their coordinates.
          - The formulas and calculations displayed on the image must be correct and directly correspond to the problem's numbers.
          - If a graph is not necessary, return an empty string ("").

      Example for a helpful 'imagePrompt':
      "A clean, mathematically accurate 2D Cartesian coordinate plane. Plot and label point A at (${question.points.A.x}, ${question.points.A.y}) and point B at (${question.points.B?.x || 'X'}, ${question.points.B?.y || 'Y'}). Draw a dashed line between A and B. Plot and label the midpoint M at (${question.answer.x}, ${question.answer.y}). To the side of the graph, clearly write the correct formulas and calculations: M_x = (x_A + x_B)/2 = (${question.points.A.x} + ${question.points.B?.x || 'X'})/2 = ${question.answer.x} and M_y = (y_A + y_B)/2 = (${question.points.A.y} + ${question.points.B?.y || 'Y'})/2 = ${question.answer.y}. The entire image should be clear, easy to read, and mathematically precise."
    `;
    
    try {
        const textResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: "application/json" },
        });
        
        let result = null;
        try {
            // Attempt to handle cases where the model might return a non-JSON string with JSON embedded
            const jsonStringMatch = textResponse.text.match(/\{[\s\S]*\}/);
            if (jsonStringMatch) {
                result = JSON.parse(jsonStringMatch[0]);
            } else {
                throw new Error("No JSON found in response");
            }
        } catch (parseError) {
            console.warn("Failed to parse Gemini response as JSON. Treating as plain text.", parseError, "Response was:", textResponse.text);
            setGeminiExplanation(textResponse.text);
        }

        if (result) {
            setGeminiExplanation(result.explanation);
            if (result.imagePrompt) {
                console.log('Generating image with prompt:', result.imagePrompt);
                const imageResponse = await ai.models.generateContent({
                    model: 'gemini-2.5-flash-image',
                    contents: { parts: [{ text: result.imagePrompt }] },
                    config: {
                        responseModalities: [Modality.IMAGE],
                    },
                });

                const imagePart = imageResponse.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
                if (imagePart?.inlineData) {
                    const base64ImageBytes = imagePart.inlineData.data;
                    const imageUrl = `data:image/png;base64,${base64ImageBytes}`;
                    setGeminiImageUrl(imageUrl);
                }
            }
        }
    } catch (error) {
      console.error("Gemini API error:", error);
      setGeminiExplanation("מצטערים, חלה שגיאה בקבלת ההסבר. נסו לרענן או לבדוק את חיבור האינטרנט.");
    } finally {
      setIsGeminiLoading(false);
    }
  };

  const showHint = (difficulty.id === 'EASY') || (difficulty.id === 'MEDIUM' && attempts > 0);
  const isInputDisabled = answerState === 'correct' || answerState === 'incorrect_final';
  
  const renderAnswerInput = () => {
    if (!question) return null;
    const isCorrectAnswer = (opt) => opt.x === question.answer.x && opt.y === question.answer.y;
    const isSelectedAnswer = (opt) => userAnswerPoint && opt.x === userAnswerPoint.x && opt.y === userAnswerPoint.y;

    switch(question.answerFormat) {
        case AF.MultipleChoice:
            return (
                <div className="grid grid-cols-2 gap-4 mt-6">
                    {question.options?.map((opt, i) => (
                        <button 
                            key={i} 
                            onClick={() => setUserAnswerPoint(opt)}
                            disabled={isInputDisabled}
                            className={`p-4 rounded-lg text-xl transition-all duration-200 border-2
                                ${isSelectedAnswer(opt) && answerState !== 'incorrect_final' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-indigo-500'}
                                ${answerState === 'incorrect_final' && isCorrectAnswer(opt) ? '!bg-green-500 !border-green-500 text-white' : ''}
                                ${answerState === 'incorrect_final' && isSelectedAnswer(opt) && !isCorrectAnswer(opt) ? '!bg-red-500 !border-red-500 text-white' : ''}
                                ${answerState === 'correct' && isSelectedAnswer(opt) ? '!bg-green-500 !border-green-500 text-white' : ''}
                            `}
                        >
                            <span className="inline-flex items-center gap-1" dir="ltr">
                                (<b className={`${coordColors.X.text}`}>{opt.x}</b>
                                , 
                                <b className={`${coordColors.Y.text}`}>{opt.y}</b>)
                            </span>
                        </button>
                    ))}
                </div>
            );
        case AF.TextInput: {
             return (
                 <div className="flex flex-col md:flex-row justify-center items-start gap-8 mt-6">
                    {/* Y Coordinate Input */}
                    <div className={`p-4 rounded-lg border-2 w-full md:w-auto flex flex-col items-center ${coordColors.Y.border} ${coordColors.Y.bg}`}>
                         <h3 className={`font-bold text-lg mb-2 ${coordColors.Y.text}`}>שיעור Y</h3>
                        <div className="flex justify-center items-center gap-2 mt-2" dir="ltr">
                            <label htmlFor="y-input" className={`font-bold text-xl ${coordColors.Y.text}`}>Y =</label>
                            <input
                                id="y-input"
                                type="number"
                                value={userAnswerY}
                                onChange={(e) => setUserAnswerY(e.target.value)}
                                disabled={isInputDisabled}
                                className={`w-28 text-center text-lg p-2 border-2 rounded-md bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 transition ${coordColors.Y.focus}`}
                                aria-label="Coordinate Y"
                            />
                        </div>
                    </div>

                    {/* X Coordinate Input */}
                    <div className={`p-4 rounded-lg border-2 w-full md:w-auto flex flex-col items-center ${coordColors.X.border} ${coordColors.X.bg}`}>
                         <h3 className={`font-bold text-lg mb-2 ${coordColors.X.text}`}>שיעור X</h3>
                        <div className="flex justify-center items-center gap-2 mt-2" dir="ltr">
                            <label htmlFor="x-input" className={`font-bold text-xl ${coordColors.X.text}`}>X =</label>
                            <input
                                id="x-input"
                                type="number"
                                value={userAnswerX}
                                onChange={(e) => setUserAnswerX(e.target.value)}
                                disabled={isInputDisabled}
                                className={`w-28 text-center text-lg p-2 border-2 rounded-md bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 transition ${coordColors.X.focus}`}
                                aria-label="Coordinate X"
                            />
                        </div>
                    </div>
                </div>
            );
        }
        case AF.Graphical:
            return <CoordinatePlane 
                pointsToDraw={question.points}
                onPointSelect={(p) => setUserAnswerPoint(p)}
                interactive={!isInputDisabled}
                answerPoint={userAnswerPoint}
                correctAnswer={question.answer}
                showCorrectAnswer={answerState === 'correct' || answerState === 'incorrect_final'}
            />;
    }
  };

  if (!question) {
    return <div className="text-center p-10">טוען שאלה...</div>;
  }
  
  const isSubmitDisabled = question.answerFormat === AF.TextInput 
    ? userAnswerX.trim() === '' || userAnswerY.trim() === '' 
    : !userAnswerPoint;

  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg">
      <div className="flex justify-between items-center mb-2">
        <button onClick={onExit} className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">
            &larr; שנה הגדרות
        </button>
        <span className="text-sm font-semibold bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 px-3 py-1 rounded-full">
            רמת קושי: {difficulty.name}
        </span>
      </div>
      <h2 className="text-2xl font-medium text-gray-800 dark:text-gray-100 mb-2 text-center leading-relaxed">
        <QuestionTextView question={question} />
      </h2>
      
      {showHint && (
        <div className="my-4">
          <h3 className="text-center font-bold text-indigo-600 dark:text-indigo-400 mb-2">רמז: הנוסחה</h3>
          <FormulaDisplay question={question} />
        </div>
      )}
      
      <div>{renderAnswerInput()}</div>

      <div className="mt-8 text-center min-h-[150px]">
        {answerState === 'initial' || answerState === 'incorrect_try' ? (
          <>
            {answerState === 'incorrect_try' && (
              <div className="mb-4 p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 font-semibold">
                תשובה לא נכונה. נותרו לך {MAX_ATTEMPTS - attempts} נסיונות.
              </div>
            )}
            <button 
              onClick={handleAnswerSubmit} 
              disabled={isSubmitDisabled} 
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white font-bold py-3 px-12 rounded-lg text-lg transition-all transform hover:scale-105"
            >
              {attempts > 0 ? 'נסה/י שוב' : 'בדיקה'}
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-4">
            {answerState === 'correct' ? (
              <div className="p-4 rounded-lg w-full text-white font-bold text-lg bg-green-500">
                כל הכבוד! +{pointsForQuestion} נקודות!
              </div>
            ) : (
              <div className="p-4 rounded-lg w-full text-white font-bold text-lg bg-red-500">
                טעות. התשובה הנכונה היא <FormattedPoint point={question.answer} />
              </div>
            )}
            
            {answerState === 'incorrect_final' && question.answerFormat !== AF.Graphical && (
                <div className="w-full mt-4">
                    <CoordinatePlane
                        pointsToDraw={question.points} interactive={false} onPointSelect={() => {}}
                        answerPoint={userAnswerPoint} correctAnswer={question.answer} showCorrectAnswer={true}
                    />
                </div>
            )}
            
            <div className="flex flex-wrap justify-center gap-4">
                <button onClick={loadNewQuestion} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-12 rounded-lg text-lg transition-transform transform hover:scale-105">
                  שאלה הבאה
                </button>
                {answerState === 'incorrect_final' && (
                  <button onClick={handleGeminiExplain} disabled={isGeminiLoading} className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 px-8 rounded-lg text-lg transition-transform transform hover:scale-105">
                    {isGeminiLoading ? 'טוען הסבר...' : 'הסבר עם Gemini'}
                  </button>
                )}
            </div>

            {geminiExplanation && (
              <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-900 rounded-lg text-right w-full">
                <h3 className="font-bold text-lg mb-2 text-gray-800 dark:text-gray-100">הסבר מ-Gemini:</h3>
                {geminiImageUrl && (
                  <div className="my-4 border dark:border-gray-700 rounded-lg overflow-hidden shadow-sm">
                    <img src={geminiImageUrl} alt="Visual explanation of the math problem" className="w-full h-auto" />
                  </div>
                )}
                <div className="whitespace-pre-wrap leading-relaxed text-gray-700 dark:text-gray-200">
                    {geminiExplanation}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};


// --- Practice Setup Component ---
const PracticeSetup = ({ onStart }) => {
    const [selectedSubjects, setSelectedSubjects] = useState([SUBJECTS.MIDPOINT.id]);
    const [selectedDifficulty, setSelectedDifficulty] = useState(DIFFICULTY_LEVELS.EASY.id);

    const handleSubjectToggle = (subjectId) => {
        setSelectedSubjects(prev => 
            prev.includes(subjectId)
                ? prev.filter(id => id !== subjectId)
                : [...prev, subjectId]
        );
    };
    
    return (
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg">
            <h2 className="text-3xl font-bold text-center mb-2 text-gray-900 dark:text-white">הגדרות תרגול</h2>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-8">בחר/י את הנושאים ורמת הקושי כדי להתחיל.</p>
            
            <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">נושאים לתרגול</h3>
                <div className="space-y-3">
                    {Object.values(SUBJECTS).map(subject => (
                        <label 
                            key={subject.id}
                            className={`flex items-center p-4 rounded-lg border-2 transition-colors ${
                                selectedSubjects.includes(subject.id) ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/50' : 'border-gray-300 dark:border-gray-600'
                            } ${subject.enabled ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                        >
                            <input
                                type="checkbox"
                                checked={selectedSubjects.includes(subject.id)}
                                onChange={() => handleSubjectToggle(subject.id)}
                                disabled={!subject.enabled}
                                className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="mr-3 font-medium text-gray-900 dark:text-gray-100">{subject.name}</span>
                             {!subject.enabled && (
                                <span className="mr-auto text-xs font-semibold bg-yellow-400 text-gray-800 px-2 py-0.5 rounded-full">
                                    בקרוב!
                                </span>
                            )}
                        </label>
                    ))}
                </div>
            </div>

            <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">רמת קושי</h3>
                <div className="flex flex-col sm:flex-row rounded-lg overflow-hidden border-2 border-gray-300 dark:border-gray-600">
                    {Object.values(DIFFICULTY_LEVELS).map(level => (
                        <button
                            key={level.id}
                            onClick={() => setSelectedDifficulty(level.id)}
                            className={`flex-1 p-3 text-center font-bold transition-colors ${
                                selectedDifficulty === level.id 
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                        >
                            {level.name}
                        </button>
                    ))}
                </div>
            </div>

            <button 
                onClick={() => onStart({ subjects: selectedSubjects, difficulty: selectedDifficulty })}
                disabled={selectedSubjects.length === 0}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white font-bold py-4 px-12 rounded-lg text-xl transition-all transform hover:scale-105"
            >
                התחל תרגול!
            </button>
        </div>
    );
}

// --- Main Component ---
export default function PracticeEngine({ updateUser }) {
  const [practiceConfig, setPracticeConfig] = useState(null);
  
  if (!practiceConfig) {
    return <PracticeSetup onStart={setPracticeConfig} />;
  }
  
  return <PracticeSession config={practiceConfig} updateUser={updateUser} onExit={() => setPracticeConfig(null)} />;
}