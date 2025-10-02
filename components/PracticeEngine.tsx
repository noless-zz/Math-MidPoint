import React, { useState, useEffect, useCallback } from 'react';
import { generateQuestion } from '../services/exerciseGenerator';
import type { Question, Point, User } from '../types';
import { AnswerFormat as AF, QuestionType as QT } from '../types';
import CoordinatePlane from './CoordinatePlane';

interface PracticeEngineProps {
  user: User;
  updateUser: (scoreToAdd: number, exercisesToAdd: number) => void;
}

type AnswerState = 'initial' | 'correct' | 'incorrect';

// --- Helper Functions and Components ---

const FormattedPoint: React.FC<{ point: Point }> = ({ point }) => (
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

const PointSpan: React.FC<{ name: string, point: Point }> = ({ name, point }) => (
    <span className={`${pointColors[name as keyof typeof pointColors]} font-bold`}>
        {name}<FormattedPoint point={point} />
    </span>
);

const QuestionTextView: React.FC<{ question: Question }> = ({ question }) => {
    const { A, B, M } = question.points;
    if (question.type === QT.FindMidpoint) {
      return <span>נתונות הנקודות <PointSpan name="A" point={A} /> ו-<PointSpan name="B" point={B!} />. מהי נקודת האמצע M של הקטע AB?</span>;
    } else {
      return <span>נתונה הנקודה <PointSpan name="A" point={A} /> ונקודת האמצע <PointSpan name="M" point={M!} /> של קטע. מצא את נקודת הקצה השנייה B.</span>;
    }
};

const EndpointFormula: React.FC<{ variable: string, numM: number, numA: number, colorM: string, colorA: string }> = ({ variable, numM, numA, colorM, colorA }) => {
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

const FractionFormula: React.FC<{ variable: string, num1: number, num2: number, color1: string, color2: string }> = ({ variable, num1, num2, color1, color2 }) => {
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

const FormulaDisplay: React.FC<{ question: Question }> = ({ question }) => {
    const { type, points } = question;
    const { A, B, M } = points;
    
    return (
        <div className="flex flex-col md:flex-row justify-center items-stretch gap-8 my-6">
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
        </div>
    );
};

// --- Main Component ---

export default function PracticeEngine({ updateUser }: PracticeEngineProps): React.ReactElement {
  const [question, setQuestion] = useState<Question | null>(null);
  const [userAnswerPoint, setUserAnswerPoint] = useState<Point | null>(null); // For all formats
  const [userAnswerX, setUserAnswerX] = useState(''); // For Text Input X
  const [userAnswerY, setUserAnswerY] = useState(''); // For Text Input Y
  const [answerState, setAnswerState] = useState<AnswerState>('initial');
  const [showFeedback, setShowFeedback] = useState<boolean>(false);
  
  const loadNewQuestion = useCallback(() => {
    setQuestion(generateQuestion());
    setUserAnswerPoint(null);
    setUserAnswerX('');
    setUserAnswerY('');
    setAnswerState('initial');
    setShowFeedback(false);
  }, []);

  useEffect(() => {
    loadNewQuestion();
  }, [loadNewQuestion]);

  const handleAnswerSubmit = () => {
    if (!question) return;

    let finalAnswerPoint = userAnswerPoint;
    if (question.answerFormat === AF.TextInput) {
        const x = parseFloat(userAnswerX);
        const y = parseFloat(userAnswerY);
        if (!isNaN(x) && !isNaN(y)) {
           finalAnswerPoint = { x, y };
        } else {
           finalAnswerPoint = null; // Invalid input
        }
    }
    
    setUserAnswerPoint(finalAnswerPoint);

    const isCorrect = finalAnswerPoint !== null && 
                      finalAnswerPoint.x === question.answer.x && 
                      finalAnswerPoint.y === question.answer.y;
    
    setAnswerState(isCorrect ? 'correct' : 'incorrect');
    setShowFeedback(true);
    updateUser(isCorrect ? 10 : 0, 1);
  };
  
  const renderAnswerInput = () => {
    if (!question) return null;
    const isCorrectAnswer = (opt: Point) => opt.x === question.answer.x && opt.y === question.answer.y;
    const isSelectedAnswer = (opt: Point) => userAnswerPoint && opt.x === userAnswerPoint.x && opt.y === userAnswerPoint.y;

    switch(question.answerFormat) {
        case AF.MultipleChoice:
            return (
                <div className="grid grid-cols-2 gap-4 mt-6">
                    {question.options?.map((opt, i) => (
                        <button 
                            key={i} 
                            onClick={() => setUserAnswerPoint(opt)}
                            disabled={showFeedback}
                            className={`p-4 rounded-lg text-xl transition-all duration-200 border-2
                                ${isSelectedAnswer(opt) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-indigo-500'}
                                ${showFeedback && isCorrectAnswer(opt) ? '!bg-green-500 !border-green-500 text-white' : ''}
                                ${showFeedback && isSelectedAnswer(opt) && !isCorrectAnswer(opt) ? '!bg-red-500 !border-red-500 text-white' : ''}
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
        case AF.TextInput:
             return (
                 <div className="flex flex-col md:flex-row justify-center items-start gap-8 mt-6">
                    {/* X Coordinate Input */}
                    <div className={`p-4 rounded-lg border-2 w-full md:w-auto flex flex-col items-center ${coordColors.X.border} ${coordColors.X.bg}`}>
                        <div className="h-16 flex items-center justify-center">
                           <FormulaDisplay question={{...question, type: question.type}} />
                        </div>
                        <div className="flex justify-center items-center gap-2 mt-2" dir="ltr">
                            <label htmlFor="x-input" className={`font-bold text-xl ${coordColors.X.text}`}>X =</label>
                            <input
                                id="x-input"
                                type="number"
                                value={userAnswerX}
                                onChange={(e) => setUserAnswerX(e.target.value)}
                                disabled={showFeedback}
                                className={`w-28 text-center text-lg p-2 border-2 rounded-md bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 transition ${coordColors.X.focus}`}
                                aria-label="Coordinate X"
                            />
                        </div>
                    </div>

                    {/* Y Coordinate Input */}
                    <div className={`p-4 rounded-lg border-2 w-full md:w-auto flex flex-col items-center ${coordColors.Y.border} ${coordColors.Y.bg}`}>
                        <div className="h-16 flex items-center justify-center">
                            <FormulaDisplay question={{...question, type: question.type}} />
                        </div>
                        <div className="flex justify-center items-center gap-2 mt-2" dir="ltr">
                            <label htmlFor="y-input" className={`font-bold text-xl ${coordColors.Y.text}`}>Y =</label>
                            <input
                                id="y-input"
                                type="number"
                                value={userAnswerY}
                                onChange={(e) => setUserAnswerY(e.target.value)}
                                disabled={showFeedback}
                                className={`w-28 text-center text-lg p-2 border-2 rounded-md bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 transition ${coordColors.Y.focus}`}
                                aria-label="Coordinate Y"
                            />
                        </div>
                    </div>
                </div>
            );
        case AF.Graphical:
            return <CoordinatePlane 
                pointsToDraw={question.points}
                onPointSelect={(p) => setUserAnswerPoint(p)}
                interactive={!showFeedback}
                answerPoint={userAnswerPoint}
                correctAnswer={question.answer}
                showCorrectAnswer={showFeedback}
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
      <h2 className="text-2xl font-medium text-gray-800 dark:text-gray-100 mb-2 text-center leading-relaxed">
        <QuestionTextView question={question} />
      </h2>
      
      {question.answerFormat !== AF.Graphical && <FormulaDisplay question={question} />}
      
      <div>{renderAnswerInput()}</div>

      <div className="mt-8 text-center">
        {!showFeedback ? (
          <button onClick={handleAnswerSubmit} disabled={isSubmitDisabled} className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white font-bold py-3 px-12 rounded-lg text-lg transition-all transform hover:scale-105">
            בדיקה
          </button>
        ) : (
          <div className="flex flex-col items-center gap-4">
             <div className={`p-4 rounded-lg w-full text-white font-bold text-lg ${answerState === 'correct' ? 'bg-green-500' : 'bg-red-500'}`}>
                {answerState === 'correct' ? 'כל הכבוד! תשובה נכונה!' : <>טעות. התשובה הנכונה היא <FormattedPoint point={question.answer} /></>}
            </div>
            
            {question.answerFormat !== AF.Graphical && (
                <div className="w-full mt-4">
                    <CoordinatePlane
                        pointsToDraw={question.points}
                        interactive={false}
                        onPointSelect={() => {}}
                        answerPoint={userAnswerPoint}
                        correctAnswer={question.answer}
                        showCorrectAnswer={true}
                    />
                </div>
            )}

            <button onClick={loadNewQuestion} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-12 rounded-lg text-lg transition-transform transform hover:scale-105">
              שאלה הבאה
            </button>
          </div>
        )}
      </div>
    </div>
  );
}