import { QuestionType, AnswerFormat } from '../types.ts';
import { QuestionType as QT, AnswerFormat as AF, DIFFICULTY_LEVELS } from '../types.ts';

const getRandomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const getRandomPoint = (gridRange) => {
  return {
    x: getRandomInt(-gridRange, gridRange),
    y: getRandomInt(-gridRange, gridRange),
  };
};

const isPointInRange = (p, gridRange) => 
    Math.abs(p.x) <= gridRange && Math.abs(p.y) <= gridRange;


const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

export function generateQuestion({ subjects, difficulty }) {
  // For now, only Midpoint questions are implemented.
  
  let gridRange;
  let findEndpointChance;

  switch (difficulty.id) {
    case DIFFICULTY_LEVELS.EASY.id:
      gridRange = 5;
      findEndpointChance = 0.2; // Mostly find midpoint
      break;
    case DIFFICULTY_LEVELS.HARD.id:
      gridRange = 20;
      findEndpointChance = 0.6; // More find endpoint
      break;
    case DIFFICULTY_LEVELS.MEDIUM.id:
    default:
      gridRange = 10;
      findEndpointChance = 0.4;
      break;
  }

  const questionType = Math.random() < findEndpointChance ? QT.FindEndpoint : QT.FindMidpoint;
  const answerFormat = [AF.MultipleChoice, AF.Graphical, AF.TextInput][getRandomInt(0,2)];

  let A, B, M;
  let question;

  if (questionType === QT.FindMidpoint) {
    let isValid = false;
    A = {x:0, y:0}; // Initial dummy value
    B = {x:0, y:0}; // Initial dummy value

    while(!isValid) {
        A = getRandomPoint(gridRange);
        B = getRandomPoint(gridRange);
        // Ensure midpoint has integer coordinates and points are not identical
        if ((A.x + B.x) % 2 === 0 && (A.y + B.y) % 2 === 0 && (A.x !== B.x || A.y !== B.y)) {
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
        A = getRandomPoint(gridRange);
        M = getRandomPoint(gridRange);
        B = {
          x: 2 * M.x - A.x,
          y: 2 * M.y - A.y,
        };
        if (isPointInRange(B, gridRange) && (A.x !== M.x || A.y !== M.y)) {
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