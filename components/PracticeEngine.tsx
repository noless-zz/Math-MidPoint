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

function pointToString(p: Point): string {
    return `(${p.x}, ${p.y})`;
}

function stringToPoint(s: string): Point | null {
    const match = s.match(/^\s*\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\)\s*$/);
    if (!match) return null;
    return { x: parseFloat(match[1]), y: parseFloat(match[2]) };
}

const FormulaDisplay: React.FC<{ question: Question }> = ({ question }) => {
    const { type, points } = question;
    const { A, B, M } = points;
    
    let xFormula = '';
    let yFormula = '';

    if (type === QT.FindMidpoint && B) {
        xFormula = `Xm = (${A.x} + ${B.x}) / 2`;
        yFormula = `Ym = (${A.y} + ${B.y}) / 2`;
    } else if (type === QT.FindEndpoint && M) {
        xFormula = `Xb = 2 * ${M.x} - ${A.x}`;
        yFormula = `Yb = 2 * ${M.y} - ${A.y}`;
    }

    return (
        <div className="my-4 p-4 bg-gray-100 dark:bg-gray-700/50 rounded-lg space-y-2">
            <p className="text-lg font-mono text-center text-gray-800 dark:text-gray-100 break-words">{xFormula}</p>
            <p className="text-lg font-mono text-center text-gray-800 dark:text-gray-100 break-words">{yFormula}</p>
        </div>
    )
}


// Fix: Replaced JSX.Element with React.ReactElement to resolve "Cannot find namespace 'JSX'" error.
export default function PracticeEngine({ updateUser }: PracticeEngineProps): React.ReactElement {
  const [question, setQuestion] = useState<Question | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>(''); // For MC and Graphical
  const [userAnswerX, setUserAnswerX] = useState(''); // For Text Input X
  const [userAnswerY, setUserAnswerY] = useState(''); // For Text Input Y
  const [answerState, setAnswerState] = useState<AnswerState>('initial');
  const [showFeedback, setShowFeedback] = useState<boolean>(false);

  const loadNewQuestion = useCallback(() => {
    setQuestion(generateQuestion());
    setUserAnswer('');
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

    let isCorrect = false;
    if (question.answerFormat === AF.TextInput) {
        const x = parseInt(userAnswerX, 10);
        const y = parseInt(userAnswerY, 10);
        isCorrect = !isNaN(x) && !isNaN(y) && x === question.answer.x && y === question.answer.y;
    } else if (question.answerFormat === AF.Graphical) {
        const parsedAnswer = stringToPoint(userAnswer);
        isCorrect = parsedAnswer !== null && parsedAnswer.x === question.answer.x && parsedAnswer.y === question.answer.y;
    } else { // Multiple Choice
        isCorrect = userAnswer === pointToString(question.answer);
    }

    setAnswerState(isCorrect ? 'correct' : 'incorrect');
    setShowFeedback(true);
    updateUser(isCorrect ? 10 : 0, 1);
  };

  const getQuestionText = (): string => {
    if (!question) return '';
    const { A, B, M } = question.points;
    if (question.type === QT.FindMidpoint) {
      return `נתונות הנקודות A${pointToString(A)} ו-B${pointToString(B!)}. מהי נקודת האמצע M של הקטע AB?`;
    } else {
      return `נתונה הנקודה A${pointToString(A)} ונקודת האמצע M${pointToString(M!)} של קטע. מצא את נקודת הקצה השנייה B.`;
    }
  };
  
  const renderAnswerInput = () => {
    if (!question) return null;
    switch(question.answerFormat) {
        case AF.MultipleChoice:
            return (
                <div className="grid grid-cols-2 gap-4 mt-6">
                    {question.options?.map((opt, i) => (
                        <button 
                            key={i} 
                            onClick={() => setUserAnswer(pointToString(opt))}
                            disabled={showFeedback}
                            className={`p-4 rounded-lg text-xl font-mono transition-all duration-200 border-2
                                ${userAnswer === pointToString(opt) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-indigo-500'}
                                ${showFeedback && pointToString(opt) === pointToString(question.answer) ? '!bg-green-500 !border-green-500 text-white' : ''}
                                ${showFeedback && userAnswer === pointToString(opt) && userAnswer !== pointToString(question.answer) ? '!bg-red-500 !border-red-500 text-white' : ''}
                            `}
                        >{pointToString(opt)}</button>
                    ))}
                </div>
            );
        case AF.TextInput:
            return (
                 <div className="flex justify-center items-center gap-8 mt-6" dir="ltr">
                    <div className="flex items-center gap-2">
                        <label htmlFor="x-input" className="font-bold text-xl text-gray-700 dark:text-gray-300">X =</label>
                        <input
                            id="x-input"
                            type="number"
                            value={userAnswerX}
                            onChange={(e) => setUserAnswerX(e.target.value)}
                            disabled={showFeedback}
                            className="w-28 text-center text-lg p-2 border-2 rounded-md bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500 transition"
                            aria-label="Coordinate X"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <label htmlFor="y-input" className="font-bold text-xl text-gray-700 dark:text-gray-300">Y =</label>
                        <input
                            id="y-input"
                            type="number"
                            value={userAnswerY}
                            onChange={(e) => setUserAnswerY(e.target.value)}
                            disabled={showFeedback}
                            className="w-28 text-center text-lg p-2 border-2 rounded-md bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500 transition"
                            aria-label="Coordinate Y"
                        />
                    </div>
                </div>
            );
        case AF.Graphical:
            return <CoordinatePlane 
                pointsToDraw={question.points}
                onPointSelect={(p) => setUserAnswer(pointToString(p))}
                interactive={!showFeedback}
                answerPoint={stringToPoint(userAnswer)}
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
    : !userAnswer;

  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2 text-center">{getQuestionText()}</h2>
      
      {(question.answerFormat === AF.MultipleChoice || question.answerFormat === AF.TextInput) && <FormulaDisplay question={question} />}
      
      <div>{renderAnswerInput()}</div>

      <div className="mt-8 text-center">
        {!showFeedback ? (
          <button onClick={handleAnswerSubmit} disabled={isSubmitDisabled} className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white font-bold py-3 px-12 rounded-lg text-lg transition-all transform hover:scale-105">
            בדיקה
          </button>
        ) : (
          <div className="flex flex-col items-center gap-4">
             <div className={`p-4 rounded-lg w-full text-white font-bold text-lg ${answerState === 'correct' ? 'bg-green-500' : 'bg-red-500'}`}>
                {answerState === 'correct' ? 'כל הכבוד! תשובה נכונה!' : `טעות. התשובה הנכונה היא ${pointToString(question.answer)}`}
            </div>
            <button onClick={loadNewQuestion} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-12 rounded-lg text-lg transition-transform transform hover:scale-105">
              שאלה הבאה
            </button>
          </div>
        )}
      </div>
    </div>
  );
}