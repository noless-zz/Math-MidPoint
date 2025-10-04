import { QuestionType, AnswerFormat } from '../types.js';
import { QuestionType as QT, AnswerFormat as AF } from '../types.js';

const GRID_RANGE = 10;

const getRandomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const getRandomPoint = () => {
  return {
    x: getRandomInt(-GRID_RANGE, GRID_RANGE),
    y: getRandomInt(-GRID_RANGE, GRID_RANGE),
  };
};

const isPointInRange = (p) => 
    Math.abs(p.x) <= GRID_RANGE && Math.abs(p.y) <= GRID_RANGE;


const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

export function generateQuestion() {
  const questionType = Math.random() < 0.7 ? QT.FindMidpoint : QT.FindEndpoint;
  const answerFormat = [AF.MultipleChoice, AF.Graphical, AF.TextInput][getRandomInt(0,2)];

  let A, B, M;
  let question;

  if (questionType === QT.FindMidpoint) {
    let isValid = false;
    A = {x:0, y:0}; // Initial dummy value
    B = {x:0, y:0}; // Initial dummy value

    while(!isValid) {
        A = getRandomPoint();
        B = getRandomPoint();
        // Ensure midpoint has integer coordinates
        if ((A.x + B.x) % 2 === 0 && (A.y + B.y) % 2 === 0) {
            isValid = true;
        }
    }
    
    M = {
      x: (A.x + B.x) / 2,
      y: (A.y + B.y) / 2,
    };
    
    question = {
        type: QT.FindMidpoint,
        points: { A, B },
        answer: M,
        answerFormat,
    };

  } else { // FindEndpoint
    let isValid = false;
    A = {x:0, y:0}; // Initial dummy value
    B = {x:0, y:0}; // Initial dummy value
    M = {x:0, y:0}; // Initial dummy value

    while(!isValid) {
        A = getRandomPoint();
        M = getRandomPoint();
        B = {
          x: 2 * M.x - A.x,
          y: 2 * M.y - A.y,
        };
        if (isPointInRange(B)) {
            isValid = true;
        }
    }
    
    question = {
        type: QT.FindEndpoint,
        points: { A, M },
        answer: B,
        answerFormat,
    }
  }

  if (answerFormat === AF.MultipleChoice) {
    const options = [question.answer];
    while (options.length < 4) {
      const wrongAnswer = {
        x: question.answer.x + getRandomInt(-3, 3),
        y: question.answer.y + getRandomInt(-3, 3),
      };
      // Avoid duplicates and the correct answer
      if (!options.some(opt => opt.x === wrongAnswer.x && opt.y === wrongAnswer.y)) {
        options.push(wrongAnswer);
      }
    }
    question.options = shuffleArray(options);
  }

  return question;
}