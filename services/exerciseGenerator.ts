
import { Point, Question, QuestionType, Difficulty, SUBJECTS, LineEquation, EquationPart, EquationSolution, LineEquationSolution } from '../types.ts';

function getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function formatNumber(n: number): string {
    if (isNaN(n)) return "0";
    return parseFloat(n.toFixed(2)).toString();
}

function formatLineEquation(m: number, b: number): string {
    let mPart = '';
    if (m !== 0) {
        if (m === 1) mPart = 'x';
        else if (m === -1) mPart = '-x';
        else mPart = `${formatNumber(m)}x`;
    }
    if (b === 0) return `y = ${mPart || '0'}`;
    const bSign = b > 0 ? '+' : '-';
    const bAbs = formatNumber(Math.abs(b));
    if (m === 0) return `y = ${formatNumber(b)}`;
    return `y = ${mPart} ${bSign} ${bAbs}`;
}

// --- NEW GENERATORS ---

function generateSimilarityQuestion(difficulty: Difficulty['id']): Omit<Question, 'subjectId'> {
    const k = [1.5, 2, 2.5, 3][getRandomInt(0, 3)];
    const sideA = getRandomInt(3, 10);
    const sideB = sideA * k;

    return {
        type: 'FIND_MISSING_SIDE_SIMILARITY',
        question: `נתונים שני משולשים דומים ΔABC ~ ΔDEF. יחס הדמיון הוא k = ${k}. אם אורך הצלע AB הוא ${sideA} ס"מ, מהו אורך הצלע המתאימה DE?`,
        solution: sideB,
        explanation: `במשולשים דומים, היחס בין צלעות מתאימות שווה ליחס הדמיון: AB / DE = k.`,
        detailedExplanation: [
            `נציב את הנתונים בנוסחה: ${sideA} / DE = ${k}`,
            `נבודד את DE: DE = ${sideA} * ${k}`,
            `התוצאה היא: ${sideB} ס"מ.`
        ],
        difficulty
    };
}

function generateAvgRateQuestion(difficulty: Difficulty['id']): Omit<Question, 'subjectId'> {
    const x1 = getRandomInt(-5, 2);
    const x2 = x1 + getRandomInt(2, 4);
    // f(x) = x^2
    const y1 = x1 * x1;
    const y2 = x2 * x2;
    const slope = (y2 - y1) / (x2 - x1);

    return {
        type: 'CALCULATE_AVG_RATE',
        question: `מצאו את קצב השינוי הממוצע של הפונקציה f(x) = x² בין הנקודות x = ${x1} ל- x = ${x2}.`,
        solution: slope,
        explanation: `קצב שינוי ממוצע מחושב לפי שיפוע המיתר: [f(x2) - f(x1)] / [x2 - x1].`,
        detailedExplanation: [
            `נחשב את ערכי הפונקציה: f(${x1}) = ${y1}, f(${x2}) = ${y2}`,
            `נציב בנוסחת השיפוע: (${y2} - ${y1}) / (${x2} - ${x1})`,
            `החישוב: ${y2 - y1} / ${x2 - x1} = ${slope}`,
            `קצב השינוי הממוצע הוא ${slope}.`
        ],
        difficulty
    };
}

// --- EXISTING GENERATORS ---

function generateQuadraticEquationQuestion(difficulty: Difficulty['id']): Omit<Question, 'subjectId'> {
    let a = 1, b = 0, c = 0, x1 = 0, x2 = 0;
    x1 = getRandomInt(-5, 5);
    x2 = getRandomInt(-5, 5);
    a = 1; b = -(x1 + x2); c = x1 * x2;
    const disc = b * b - 4 * a * c;
    const solutions = Array.from(new Set([x1, x2])).sort((a,b) => a - b);
    const eqStr = `x² ${b > 0 ? '+' : (b < 0 ? '-' : '')} ${Math.abs(b) !== 0 ? (Math.abs(b) === 1 ? 'x' : Math.abs(b) + 'x') : ''} ${c > 0 ? '+' : (c < 0 ? '-' : '')} ${Math.abs(c) !== 0 ? Math.abs(c) : ''} = 0`;
    return {
        type: 'SOLVE_QUADRATIC_EQUATION',
        question: `פתרו את המשוואה: ${eqStr}`,
        solution: { value: solutions, domain: [] },
        explanation: `השתמשו בנוסחת השורשים.`,
        detailedExplanation: [`השורשים הם: ${solutions.join(', ')}`],
        difficulty
    };
}

function generateNumericDenominatorEquation(difficulty: Difficulty['id']): Omit<Question, 'subjectId'> {
    const x_sol = getRandomInt(-10, 10);
    const den1 = 2, den2 = 3;
    const a = getRandomInt(1, 5), b = getRandomInt(1, 5);
    const c_num = (x_sol + a) * den2 + (x_sol + b) * den1;
    const common_den = 6;
    return {
        type: 'SOLVE_EQUATION_NUMERIC_DENOMINATOR',
        question: `פתרו את המשוואה:`,
        equationParts: [
            { type: 'fraction', numerator: `x + ${a}`, denominator: '2' },
            { type: 'operator', value: '+' },
            { type: 'fraction', numerator: `x + ${b}`, denominator: '3' },
            { type: 'operator', value: '=' },
            { type: 'fraction', numerator: c_num.toString(), denominator: '6' }
        ],
        solution: { value: [x_sol], domain: [] },
        explanation: `מכנה משותף.`,
        detailedExplanation: [`הפתרון הוא x = ${x_sol}`],
        difficulty
    };
}

function generateDerivativeQuestion(difficulty: Difficulty['id']): Omit<Question, 'subjectId'> {
    const n = getRandomInt(2, 4);
    const a = getRandomInt(1, 6);
    const funcStr = `f(x) = ${a}x^${n}`;
    const derStr = `${a*n}x^${n-1}`;
    return {
        type: 'CALCULATE_DERIVATIVE',
        question: `מצאו את הנגזרת של ${funcStr}:`,
        solution: derStr,
        explanation: `חוק החזקה.`,
        detailedExplanation: [`f'(x) = ${derStr}`],
        difficulty
    };
}

function generateTangentQuestion(difficulty: Difficulty['id']): Omit<Question, 'subjectId'> {
    const x0 = getRandomInt(-2, 2);
    const slope = 2 * x0; // for x^2
    const intercept = (x0*x0) - slope * x0;
    return {
        type: 'FIND_TANGENT_EQUATION',
        question: `מצאו את משוואת המשיק ל- f(x)=x² בנקודה שבה x=${x0}.`,
        solution: { m: slope, b: intercept },
        explanation: `גוזרים ומציבים.`,
        detailedExplanation: [`המשוואה: ${formatLineEquation(slope, intercept)}`],
        difficulty
    };
}

function generateMidpointQuestion(difficulty: Difficulty['id']): Omit<Question, 'subjectId'> {
    const p1 = { x: getRandomInt(-5, 5), y: getRandomInt(-5, 5) };
    const p2 = { x: getRandomInt(-5, 5), y: getRandomInt(-5, 5) };
    const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    return {
        type: 'FIND_MIDPOINT',
        question: `מצאו אמצע קטע בין A(${p1.x},${p1.y}) ל-B(${p2.x},${p2.y})`,
        solution: mid,
        explanation: `ממוצע שיעורים.`,
        detailedExplanation: [`האמצע הוא (${mid.x}, ${mid.y})`],
        difficulty
    };
}

function generateSlopeQuestion(difficulty: Difficulty['id']): Omit<Question, 'subjectId'> {
    const p1 = { x: 0, y: 0 }, p2 = { x: 2, y: 4 };
    return {
        type: 'CALCULATE_SLOPE',
        question: `מהו השיפוע בין (0,0) ל-(2,4)?`,
        solution: 2,
        explanation: `דלתא y חלקי דלתא x.`,
        detailedExplanation: [`השיפוע הוא 2.`],
        difficulty
    };
}

// --- GENERATORS RECORD ---

const generators: Record<string, (difficulty: Difficulty['id']) => Omit<Question, 'subjectId'>> = {
    [SUBJECTS.MIDPOINT.id]: generateMidpointQuestion,
    [SUBJECTS.COORDINATE_SYSTEM.id]: (diff) => ({ 
        type: 'IDENTIFY_QUADRANT', 
        question: 'באיזה רביע נמצאת הנקודה (2,3)?', 
        solution: 'רביע ראשון', 
        options: ['רביע ראשון', 'רביע שני', 'רביע שלישי', 'רביע רביעי'], 
        difficulty: diff, 
        explanation: 'זיהוי רביע לפי סימני x ו-y.',
        detailedExplanation: ['שני הערכים חיוביים, לכן הנקודה נמצאת ברביע הראשון.'] 
    }),
    [SUBJECTS.STRAIGHT_LINE.id]: generateSlopeQuestion,
    [SUBJECTS.DISTANCE.id]: (diff) => ({ 
        type: 'CALCULATE_DISTANCE', 
        question: 'מרחק בין (0,0) ל-(3,4)?', 
        solution: 5, 
        difficulty: diff, 
        explanation: 'שימוש בנוסחת המרחק בין שתי נקודות.',
        detailedExplanation: ['פיתגורס: 3^2 + 4^2 = 5^2'] 
    }),
    [SUBJECTS.PERPENDICULAR_LINES.id]: (diff) => ({ 
        type: 'FIND_PERPENDICULAR_SLOPE', 
        question: 'שיפוע מאונך ל-2?', 
        solution: -0.5, 
        difficulty: diff, 
        explanation: 'השיפוע המאונך הוא ההופכי והנגדי.',
        detailedExplanation: ['הופכי ונגדי ל-2 הוא -0.5'] 
    }),
    [SUBJECTS.LINE_INTERSECTION.id]: (diff) => ({ 
        type: 'FIND_INTERSECTION_POINT', 
        question: 'חיתוך y=x ו-y=-x+2?', 
        solution: { x: 1, y: 1 }, 
        difficulty: diff, 
        explanation: 'מציאת נקודת החיתוך על ידי השוואת הישרים.',
        detailedExplanation: ['x = -x+2 => 2x=2 => x=1'] 
    }),
    [SUBJECTS.EQUATIONS_WITH_VARIABLE_DENOMINATOR.id]: (diff) => ({ 
        type: 'SOLVE_EQUATION_VARIABLE_DENOMINATOR', 
        question: '10/x = 2', 
        solution: { value: [5], domain: [0] }, 
        difficulty: diff, 
        explanation: 'פתרון משוואה עם נעלם במכנה.',
        detailedExplanation: ['10 = 2x => x=5'] 
    }),
    [SUBJECTS.EQUATIONS_NUMERIC_DENOMINATOR.id]: generateNumericDenominatorEquation,
    [SUBJECTS.QUADRATIC_EQUATIONS.id]: generateQuadraticEquationQuestion,
    [SUBJECTS.SIMILARITY.id]: generateSimilarityQuestion,
    [SUBJECTS.AVERAGE_CHANGE_RATE.id]: generateAvgRateQuestion,
    [SUBJECTS.DERIVATIVES.id]: generateDerivativeQuestion,
    [SUBJECTS.TANGENT.id]: generateTangentQuestion,
};

export function generateQuestion(config: { subjects: string[]; difficulty: Difficulty['id'] }): Question {
    const availableGenerators = config.subjects.filter(id => generators[id]);
    const randomSubjectId = availableGenerators[Math.floor(Math.random() * availableGenerators.length)];
    const generator = generators[randomSubjectId];
    const question = generator(config.difficulty) as Question;
    question.subjectId = randomSubjectId;
    return question;
}
