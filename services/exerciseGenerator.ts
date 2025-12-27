import { Point, Question, QuestionType, Difficulty, SUBJECTS, LineEquation, EquationPart, EquationSolution, LineEquationSolution } from '../types.ts';

// Helper function to generate a random integer between min and max (inclusive)
function getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper to shuffle an array
function shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Helper to format denominator strings like 'x + 5' or 'x - 3', handling the case where the constant is 0.
function formatDenominator(term: string, constant: number): string {
    if (constant === 0) {
        return term;
    }
    const sign = constant > 0 ? '+' : '-';
    return `${term} ${sign} ${Math.abs(constant)}`;
}

// Helper to format numbers nicely for display, removing trailing .00
function formatNumber(n: number): string {
    if (isNaN(n)) return "0";
    return parseFloat(n.toFixed(2)).toString();
}

// Helper to format y = mx + b equations nicely
function formatLineEquation(m: number, b: number): string {
    let mPart = '';
    if (m !== 0) {
        if (m === 1) mPart = 'x';
        else if (m === -1) mPart = '-x';
        else mPart = `${formatNumber(m)}x`;
    }

    if (b === 0) {
        return `y = ${mPart || '0'}`;
    }

    const bSign = b > 0 ? '+' : '-';
    const bAbs = formatNumber(Math.abs(b));
    
    if (m === 0) {
        return `y = ${formatNumber(b)}`;
    }
    
    return `y = ${mPart} ${bSign} ${bAbs}`;
}

// --- ALGEBRAIC TECHNIQUE ---

function generateQuadraticEquationQuestion(difficulty: Difficulty['id']): Omit<Question, 'subjectId'> {
    let a = 1, b = 0, c = 0, x1 = 0, x2 = 0;
    
    if (difficulty === 'easy') {
        x1 = getRandomInt(-5, 5);
        x2 = getRandomInt(-5, 5);
        a = 1;
        b = -(x1 + x2);
        c = x1 * x2;
    } else if (difficulty === 'medium') {
        x1 = getRandomInt(-8, 8);
        x2 = getRandomInt(-8, 8);
        a = getRandomInt(1, 3);
        b = -a * (x1 + x2);
        c = a * (x1 * x2);
    } else {
        // Complex coefficients or non-integer roots
        a = getRandomInt(1, 4);
        b = getRandomInt(-10, 10);
        c = getRandomInt(-15, 15);
        const disc = b * b - 4 * a * c;
        if (disc < 0) return generateQuadraticEquationQuestion(difficulty); // Retry
    }

    const disc = b * b - 4 * a * c;
    const sol1 = (-b + Math.sqrt(disc)) / (2 * a);
    const sol2 = (-b - Math.sqrt(disc)) / (2 * a);
    const solutions = Array.from(new Set([sol1, sol2])).sort((a,b) => a - b);

    const eqStr = `${a !== 1 ? (a === -1 ? '-' : a) : ''}x² ${b > 0 ? '+' : (b < 0 ? '-' : '')} ${Math.abs(b) !== 0 ? (Math.abs(b) === 1 ? 'x' : Math.abs(b) + 'x') : ''} ${c > 0 ? '+' : (c < 0 ? '-' : '')} ${Math.abs(c) !== 0 ? Math.abs(c) : ''} = 0`;

    return {
        type: 'SOLVE_QUADRATIC_EQUATION',
        question: `פתרו את המשוואה הריבועית: ${eqStr}`,
        solution: { value: solutions, domain: [] },
        explanation: `השתמשו בנוסחת השורשים: x1,2 = [-b ± √(b² - 4ac)] / 2a`,
        detailedExplanation: [
            `נזהה את המקדמים: a = ${a}, b = ${b}, c = ${c}`,
            `נחשב את הדיסקרימיננטה (הביטוי מתחת לשורש): Δ = ${b}² - 4 * ${a} * ${c} = ${disc}`,
            `נציב בנוסחה: x = (-${b} ± √${disc}) / (2 * ${a})`,
            `הפתרונות הם: ${solutions.map(s => formatNumber(s)).join(' ו- ')}`
        ],
        difficulty
    };
}

function generateNumericDenominatorEquation(difficulty: Difficulty['id']): Omit<Question, 'subjectId'> {
    const x_sol = getRandomInt(-10, 10);
    const den1 = [2, 3, 4, 5, 6, 8, 10][getRandomInt(0, 6)];
    const den2 = [2, 3, 4, 5, 6, 8, 10][getRandomInt(0, 6)];
    
    // (x+a)/den1 + (x+b)/den2 = c
    const a = getRandomInt(-10, 10);
    const b = getRandomInt(-10, 10);
    const c_val = (x_sol + a) / den1 + (x_sol + b) / den2;
    
    // To keep it clean, let's adjust c to be an integer if possible or a simple fraction
    const c_num = (x_sol + a) * den2 + (x_sol + b) * den1;
    const common_den = den1 * den2;
    
    const eqParts: EquationPart[] = [
        { type: 'fraction', numerator: `x ${a >= 0 ? '+' : '-'} ${Math.abs(a)}`, denominator: den1.toString() },
        { type: 'operator', value: '+' },
        { type: 'fraction', numerator: `x ${b >= 0 ? '+' : '-'} ${Math.abs(b)}`, denominator: den2.toString() },
        { type: 'operator', value: '=' },
        { type: 'fraction', numerator: c_num.toString(), denominator: common_den.toString() }
    ];

    return {
        type: 'SOLVE_EQUATION_NUMERIC_DENOMINATOR',
        question: `מצאו את ערכו של x:`,
        equationParts: eqParts,
        solution: { value: [x_sol], domain: [] },
        explanation: `מצאו מכנה משותף לכל השברים וכפלו את המשוואה בו.`,
        detailedExplanation: [
            `המכנה המשותף הוא ${common_den}.`,
            `נכפול את כל המשוואה ב-${common_den}:`,
            `${den2}(x ${a >= 0 ? '+' : '-'} ${Math.abs(a)}) + ${den1}(x ${b >= 0 ? '+' : '-'} ${Math.abs(b)}) = ${c_num}`,
            `נפתח סוגריים: ${den2}x ${den2 * a >= 0 ? '+' : '-'} ${Math.abs(den2 * a)} + ${den1}x ${den1 * b >= 0 ? '+' : '-'} ${Math.abs(den1 * b)} = ${c_num}`,
            `נכנס איברים דומים: ${den1 + den2}x = ${c_num - (den2 * a) - (den1 * b)}`,
            `הפתרון הוא: x = ${x_sol}`
        ],
        difficulty
    };
}

// --- CALCULUS ---

function generateDerivativeQuestion(difficulty: Difficulty['id']): Omit<Question, 'subjectId'> {
    const n = getRandomInt(2, 4);
    const a = getRandomInt(1, 6) * (Math.random() > 0.5 ? 1 : -1);
    const b = getRandomInt(1, 10) * (Math.random() > 0.5 ? 1 : -1);
    const c = getRandomInt(-20, 20);

    const funcStr = `f(x) = ${a !== 1 ? (a === -1 ? '-' : a) : ''}x${n > 1 ? `^${n}` : ''} ${b > 0 ? '+' : '-'} ${Math.abs(b)}x ${c > 0 ? '+' : (c < 0 ? '-' : '')} ${Math.abs(c) || ''}`;
    
    // Derivative: f'(x) = a*n*x^(n-1) + b
    const derA = a * n;
    const derB = b;
    const derStr = `${derA}x${n-1 > 1 ? `^${n-1}` : ''} ${derB > 0 ? '+' : '-'} ${Math.abs(derB)}`;

    return {
        type: 'CALCULATE_DERIVATIVE',
        question: `נתונה הפונקציה ${funcStr}. מצאו את הנגזרת f'(x).`,
        solution: derStr,
        explanation: `השתמשו בכלל הגזירה: (ax^n)' = a * n * x^(n-1).`,
        detailedExplanation: [
            `האיבר הראשון: (${a}x^${n})' = ${a} * ${n} * x^(${n}-1) = ${derA}x^${n-1}`,
            `האיבר השני: (${b}x)' = ${b}`,
            `האיבר השלישי: הקבוע (${c}) נעלם בגזירה.`,
            `הנגזרת הסופית היא: f'(x) = ${derStr}`
        ],
        difficulty,
        options: shuffleArray([
            derStr,
            `${a}x^${n-1} + ${b}`,
            `${derA}x^${n} + ${derB}`,
            `${a*n}x^${n-1}`
        ])
    };
}

function generateTangentQuestion(difficulty: Difficulty['id']): Omit<Question, 'subjectId'> {
    const a = getRandomInt(1, 3);
    const b = getRandomInt(-4, 4);
    const c = getRandomInt(-5, 5);
    const x0 = getRandomInt(-3, 3);
    
    // f(x) = ax^2 + bx + c
    const y0 = a * x0 * x0 + b * x0 + c;
    // f'(x) = 2ax + b
    const slope = 2 * a * x0 + b;
    // Tangent: y - y0 = slope(x - x0) => y = slope*x + (y0 - slope*x0)
    const intercept = y0 - slope * x0;

    const funcStr = `f(x) = ${a === 1 ? '' : a}x² ${b > 0 ? '+' : (b < 0 ? '-' : '')} ${Math.abs(b) || ''}x ${c > 0 ? '+' : (c < 0 ? '-' : '')} ${Math.abs(c) || ''}`;

    return {
        type: 'FIND_TANGENT_EQUATION',
        question: `מצאו את משוואת המשיק לפונקציה ${funcStr} בנקודה שבה x = ${x0}.`,
        solution: { m: slope, b: intercept },
        explanation: `1. מצאו את f'(x). 2. הציבו x כדי למצוא את השיפוע. 3. מצאו את f(x) כדי למצוא את נקודת ההשקה. 4. השתמשו בנוסחת הישר.`,
        detailedExplanation: [
            `הנגזרת היא: f'(x) = ${2*a}x ${b >= 0 ? '+' : '-'} ${Math.abs(b)}`,
            `השיפוע במקודה x=${x0} הוא: m = f'(${x0}) = ${slope}`,
            `ערך הפונקציה בנקודה: y = f(${x0}) = ${y0}`,
            `נקודת ההשקה היא (${x0}, ${y0})`,
            `משוואת המשיק: y - ${y0} = ${slope}(x - ${x0})`,
            `לאחר פישוט: ${formatLineEquation(slope, intercept)}`
        ],
        difficulty
    };
}

// --- EQUATIONS WITH VARIABLE DENOMINATOR ---
function generateEquationsWithVariableDenominatorQuestion(difficulty: Difficulty['id']): Omit<Question, 'subjectId'> {
    const questionText = `פתור את המשוואה:`;
    let solution: number | EquationSolution;
    let explanation: string;
    let detailedExplanation: string[];
    let equationParts: EquationPart[];

    const template1 = () => {
        const x_sol = getRandomInt(-10, 10);
        let b = getRandomInt(-10, 10);
        if (x_sol + b === 0) b++;
        let c = getRandomInt(1, 5) * (Math.random() > 0.5 ? 1 : -1);
        if (c === 0) c = 1;
        const a = c * (x_sol + b);
        
        const denominator = b === 0 ? 'x' : `x ${b > 0 ? '+' : '-'} ${Math.abs(b)}`;
        solution = { value: [x_sol], domain: [-b]};
        explanation = `כדי לפתור, יש לבודד את הנעלם x.`;
        detailedExplanation = [
            `תחום הגדרה: המכנה לא יכול להיות אפס, לכן x ≠ ${-b}.`,
            `כופלים את שני אגפי המשוואה במכנה (${denominator}): ${a} = ${c}(${denominator})`,
            `פותחים סוגריים: ${a} = ${c}x ${c*b >= 0 ? '+' : '-'} ${Math.abs(c*b)}`,
            `מעבירים אגפים כדי לבודד את x: ${a - (c*b)} = ${c}x`,
            `מחלקים במקדם של x ומקבלים את הפתרון: x = ${x_sol}`,
            `בדיקה: הפתרון תקין ונמצא בתחום ההגדרה.`
        ];
        equationParts = [ { type: 'fraction', numerator: a.toString(), denominator }, { type: 'operator', value: '=' }, { type: 'term', value: c.toString() } ];
    };

    const template2 = () => {
        const x_sol = getRandomInt(-6, 6);
        const c = getRandomInt(1, 4) * (Math.random() > 0.5 ? 1 : -1);
        let d = getRandomInt(-8, 8);
        if (c * x_sol + d === 0) d++;
        const den_val = c * x_sol + d;
        const e = getRandomInt(1,5) * (Math.random() > 0.5 ? 1 : -1);
        const num_val = den_val * e;
        const a = c * e + (getRandomInt(0, 1) ? 1 : -1) * getRandomInt(1,3);
        const b = num_val - a * x_sol;
        const numStr = `${a}x ${b >= 0 ? '+' : '-'} ${Math.abs(b)}`;
        const denStr = `${c}x ${d >= 0 ? '+' : '-'} ${Math.abs(d)}`;
        solution = { value: [x_sol], domain: [-d/c] };
        explanation = `כדי לבטל את המכנה, יש לכפול את שני האגפים ב-${denStr}.`;
        detailedExplanation = [
            `תחום הגדרה: המכנה לא יכול להיות אפס, לכן x ≠ ${formatNumber(-d/c)}.`,
            `כופלים את שני האגפים במכנה: ${numStr} = ${e}(${denStr})`,
            `פותחים סוגריים: ${numStr} = ${e*c}x ${e*d >= 0 ? '+' : '-'} ${Math.abs(e*d)}`,
            `מעבירים איברים עם x לאגף אחד ומספרים לאגף השני: ${a - e*c}x = ${e*d - b}`,
            `מחלקים במקדם של x ומקבלים את הפתרון: x = ${x_sol}`,
            `בדיקה: הפתרון תקין ונמצא בתחום ההגדרה.`,
        ];
        equationParts = [ { type: 'fraction', numerator: numStr, denominator: denStr }, { type: 'operator', value: '=' }, { type: 'term', value: e.toString() } ];
    };

    if (difficulty === 'easy') {
        template1();
    } else {
        template2();
    }

    return {
        type: 'SOLVE_EQUATION_VARIABLE_DENOMINATOR',
        question: questionText,
        equationParts,
        solution,
        explanation,
        detailedExplanation,
        difficulty,
    };
}


// --- MIDPOINT QUESTIONS ---
function generateMidpointVisualQuestion(difficulty: Difficulty['id']): Omit<Question, 'subjectId'> {
    let range = 10;
    if (difficulty === 'easy') range = 6;
    if (difficulty === 'hard') range = 12;

    const pointA = { x: getRandomInt(-range, range), y: getRandomInt(-range, range) };
    const pointB = { x: getRandomInt(-range, range), y: getRandomInt(-range, range) };
    if ((pointA.x + pointB.x) % 2 !== 0) pointB.x = Math.min(range, Math.max(-range, pointB.x + 1));
    if ((pointA.y + pointB.y) % 2 !== 0) pointB.y = Math.min(range, Math.max(-range, pointB.y + 1));

    const midpoint = { x: (pointA.x + pointB.x) / 2, y: (pointA.y + pointB.y) / 2 };

    return {
        type: 'FIND_MIDPOINT_VISUAL',
        question: `זהו את נקודת האמצע M של הקטע AB באמצעות לחיצה על מיקומה בגרף.`,
        points: { A: pointA, B: pointB },
        solution: midpoint,
        explanation: `כדי למצוא את שיעורי נקודת האמצע, יש להשתמש בנוסחת אמצע קטע.`,
        detailedExplanation: [
            `נציב את שיעורי ה-X בנוסחה: x_M = (${pointA.x} + ${pointB.x}) / 2`,
            `נחשב את שיעור ה-X: x_M = ${midpoint.x}`,
            `נציב את שיעורי ה-Y בנוסחה: y_M = (${pointA.y} + ${pointB.y}) / 2`,
            `נחשב את שיעור ה-Y: y_M = ${midpoint.y}`,
            `התשובה הסופית היא: (${midpoint.x}, ${midpoint.y}).`
        ],
        difficulty,
    };
}

function generateMidpointTextQuestion(difficulty: Difficulty['id'], isMCQ: boolean): Omit<Question, 'subjectId'> {
    let range = 10;
    if (difficulty === 'easy') range = 5;
    if (difficulty === 'hard') range = 20;
    const createPoint = () => ({ x: getRandomInt(-range, range), y: getRandomInt(-range, range) });

    const isEndpointQuestion = (difficulty === 'hard' && Math.random() > 0.4) || (difficulty === 'medium' && Math.random() > 0.6);
    
    if (isEndpointQuestion) {
        const pointA = createPoint();
        const midpoint = createPoint();
        const pointB = { x: 2 * midpoint.x - pointA.x, y: 2 * midpoint.y - pointA.y };
        let options: Point[] | undefined = undefined;
        if (isMCQ) {
            const distractors: Point[] = [];
            const used = new Set<string>([`${pointB.x},${pointB.y}`]);
            const add = (p:Point) => { if(!used.has(`${p.x},${p.y}`)) { distractors.push(p); used.add(`${p.x},${p.y}`); }};
            while(distractors.length < 3) { add({ x: pointB.x + getRandomInt(-3,3), y: pointB.y + getRandomInt(-3,3)}); }
            options = shuffleArray([pointB, ...distractors]);
        }
        return {
            type: isMCQ ? 'FIND_ENDPOINT_MCQ' : 'FIND_ENDPOINT',
            question: `נתונה הנקודה A(${pointA.x}, ${pointA.y}). הנקודה M(${midpoint.x}, ${midpoint.y}) היא אמצע הקטע AB. מצאו את שיעורי הנקודה B.`,
            points: { A: pointA, M: midpoint }, solution: pointB,
            explanation: `יש להשתמש בנוסחה למציאת נקודת קצה: x_B = 2*x_M - x_A.`,
            detailedExplanation: [
                `נציב את שיעורי ה-X בנוסחה למציאת נקודת קצה: x_B = 2 * ${midpoint.x} - (${pointA.x})`,
                `נחשב את שיעור ה-X של נקודה B: x_B = ${pointB.x}`,
                `נציב את שיעורי ה-Y בנוסחה: y_B = 2 * ${midpoint.y} - (${pointA.y})`,
                `נחשב את שיעור ה-Y של נקודה B: y_B = ${pointB.y}`,
                `שיעורי הנקודה B הם: (${pointB.x}, ${pointB.y}).`
            ],
            difficulty, options,
        };
    } else { // FIND_MIDPOINT
        const pointA = createPoint();
        const pointB = createPoint();
        if ((pointA.x + pointB.x) % 2 !== 0) pointB.x = Math.min(range, Math.max(-range, pointB.x + 1));
        if ((pointA.y + pointB.y) % 2 !== 0) pointB.y = Math.min(range, Math.max(-range, pointB.y + 1));
        const midpoint = { x: (pointA.x + pointB.x) / 2, y: (pointA.y + pointB.y) / 2 };
        let options: Point[] | undefined = undefined;
        if (isMCQ) {
            const distractors: Point[] = [];
            const used = new Set<string>([`${midpoint.x},${midpoint.y}`]);
            const add = (p:Point) => { if(!used.has(`${p.x},${p.y}`)) { distractors.push(p); used.add(`${p.x},${p.y}`); }};
            while(distractors.length < 3) { add({ x: midpoint.x + getRandomInt(-2,2), y: midpoint.y + getRandomInt(-2,2)}); }
            options = shuffleArray([midpoint, ...distractors]);
        }
        return {
            type: isMCQ ? 'FIND_MIDPOINT_MCQ' : 'FIND_MIDPOINT',
            question: `מצאו את שיעורי נקודת האמצע M של הקטע AB, כאשר A(${pointA.x}, ${pointA.y}) ו-B(${pointB.x}, ${pointB.y}).`,
            points: { A: pointA, B: pointB }, solution: midpoint,
            explanation: `יש להשתמש בנוסחת אמצע קטע: x_M = (x_A + x_B) / 2.`,
            detailedExplanation: [
                `נציב את שיעורי ה-X בנוסחה: x_M = (${pointA.x} + ${pointB.x}) / 2`,
                `נחשב את שיעור ה-X: x_M = ${midpoint.x}`,
                `נציב את שיעורי ה-Y בנוסחה: y_M = (${pointA.y} + ${pointB.y}) / 2`,
                `נחשב את שיעור ה-Y: y_M = ${midpoint.y}`,
                `התשובה הסופית היא: (${midpoint.x}, ${midpoint.y}).`
            ],
            difficulty, options,
        };
    }
}

function generateMidpointQuestion(difficulty: Difficulty['id']): Omit<Question, 'subjectId'> {
    const rand = Math.random();
    if (difficulty === 'easy') {
        if (rand < 0.5) return generateMidpointVisualQuestion(difficulty);
        return generateMidpointTextQuestion(difficulty, true);
    }
    return generateMidpointTextQuestion(difficulty, false);
}

function generateSlopeQuestion(difficulty: Difficulty['id']): Omit<Question, 'subjectId'> {
    let range = 10;
    const p1 = { x: getRandomInt(-range, range), y: getRandomInt(-range, range) };
    let p2: Point;
    do { p2 = { x: getRandomInt(-range, range), y: getRandomInt(-range, range) }; } while (p1.x === p2.x);
    const slope = (p2.y - p1.y) / (p2.x - p1.x);
    return {
        type: 'CALCULATE_SLOPE',
        question: `מהו השיפוע (m) של הקו הישר העובר דרך הנקודות A(${p1.x}, ${p1.y}) ו-B(${p2.x}, ${p2.y})?`,
        points: { A: p1, B: p2 }, solution: slope,
        explanation: `m = (y2 - y1) / (x2 - x1).`,
        detailedExplanation: [`השיפוע הוא: ${formatNumber(slope)}`],
        difficulty,
    };
}

function generateDistanceQuestion(difficulty: Difficulty['id']): Omit<Question, 'subjectId'> {
    let range = 10;
    const p1 = { x: getRandomInt(-range, range), y: getRandomInt(-range, range) };
    const p2 = { x: getRandomInt(-range, range), y: getRandomInt(-range, range) };
    const distance = Math.sqrt((p2.x-p1.x)**2 + (p2.y-p1.y)**2);
    return {
        type: 'CALCULATE_DISTANCE',
        question: `מהו המרחק בין הנקודות A(${p1.x}, ${p1.y}) ו-B(${p2.x}, ${p2.y})?`,
        points: { A: p1, B: p2 }, solution: distance,
        explanation: `d = √((x2-x1)² + (y2-y1)²).`,
        detailedExplanation: [`המרחק הוא: ${formatNumber(distance)}`],
        difficulty,
    };
}

function generatePerpendicularSlopeQuestion(difficulty: Difficulty['id']): Omit<Question, 'subjectId'> {
    let m1 = getRandomInt(-5, 5);
    while (m1 === 0) m1 = getRandomInt(-5, 5);
    const solution = -1 / m1;
    return {
        type: 'FIND_PERPENDICULAR_SLOPE',
        question: `נתון ישר ששיפועו הוא ${m1}. מהו שיפוע הישר המאונך לו?`,
        solution: solution,
        explanation: `m1 * m2 = -1.`,
        detailedExplanation: [`השיפוע המאונך הוא: ${formatNumber(solution)}.`],
        difficulty,
    };
}

function generateIntersectionQuestion(difficulty: Difficulty['id']): Omit<Question, 'subjectId'> {
    const m1 = getRandomInt(-5, 5);
    const b1 = getRandomInt(-10, 10);
    let m2 = getRandomInt(-5, 5);
    while(m1 === m2) m2 = getRandomInt(-5, 5);
    const b2 = getRandomInt(-10, 10);
    const x = (b2 - b1) / (m1 - m2);
    const y = m1 * x + b1;
    return {
        type: 'FIND_INTERSECTION_POINT',
        question: `מצאו את נקודת החיתוך של הישרים y=${m1}x+${b1} ו- y=${m2}x+${b2}.`,
        solution: { x, y },
        explanation: `השוו בין שתי המשוואות.`,
        detailedExplanation: [`נקודת החיתוך היא (${formatNumber(x)}, ${formatNumber(y)}).`],
        difficulty,
    };
}

function generateLineEquationQuestion(difficulty: Difficulty['id']): Omit<Question, 'subjectId'> {
    const p1 = { x: getRandomInt(-5, 5), y: getRandomInt(-5, 5) };
    let p2: Point;
    do { p2 = { x: getRandomInt(-5, 5), y: getRandomInt(-5, 5) }; } while (p1.x === p2.x);
    const m = (p2.y - p1.y) / (p2.x - p1.x);
    const b = p1.y - m * p1.x;
    return {
        type: 'FIND_LINE_EQUATION',
        question: `מצאו את משוואת הישר העובר דרך הנקודות A(${p1.x}, ${p1.y}) ו-B(${p2.x}, ${p2.y}).`,
        solution: { m, b },
        explanation: `מצאו שיפוע m ואז את b.`,
        detailedExplanation: [`המשוואה היא: ${formatLineEquation(m, b)}`],
        difficulty,
    };
}

function generateQuadrantQuestion(difficulty: Difficulty['id']): Omit<Question, 'subjectId'> {
    const x = getRandomInt(-10, 10);
    const y = getRandomInt(-10, 10);
    let solution = 'רביע ראשון';
    if (x < 0 && y > 0) solution = 'רביע שני';
    if (x < 0 && y < 0) solution = 'רביע שלישי';
    if (x > 0 && y < 0) solution = 'רביע רביעי';
    return {
        type: 'IDENTIFY_QUADRANT',
        question: `באיזה רביע נמצאת הנקודה A(${x}, ${y})?`,
        solution: solution,
        explanation: `בדקו את הסימנים של x ו-y.`,
        detailedExplanation: [`הנקודה נמצאת ב: ${solution}.`],
        difficulty,
        options: shuffleArray(['רביע ראשון', 'רביע שני', 'רביע שלישי', 'רביע רביעי'])
    };
}

function generateIdentifyCoordinatesQuestion(difficulty: Difficulty['id']): Omit<Question, 'subjectId'> {
    const p = { x: getRandomInt(-8, 8), y: getRandomInt(-8, 8) };
    return {
        type: 'IDENTIFY_COORDINATES',
        question: `מהם שיעורי הנקודה המוצגת על מערכת הצירים?`,
        points: { A: p }, solution: p,
        explanation: `בדקו את המיקום בצירים.`,
        detailedExplanation: [`שיעורי הנקודה הם (${p.x},${p.y}).`],
        difficulty,
    };
}

const generators: Record<string, (difficulty: Difficulty['id']) => Omit<Question, 'subjectId'>> = {
    [SUBJECTS.MIDPOINT.id]: generateMidpointQuestion,
    [SUBJECTS.COORDINATE_SYSTEM.id]: (diff) => Math.random() > 0.5 ? generateIdentifyCoordinatesQuestion(diff) : generateQuadrantQuestion(diff),
    [SUBJECTS.STRAIGHT_LINE.id]: (diff) => Math.random() > 0.5 ? generateSlopeQuestion(diff) : generateLineEquationQuestion(diff),
    [SUBJECTS.DISTANCE.id]: generateDistanceQuestion,
    [SUBJECTS.PERPENDICULAR_LINES.id]: generatePerpendicularSlopeQuestion,
    [SUBJECTS.LINE_INTERSECTION.id]: generateIntersectionQuestion,
    [SUBJECTS.EQUATIONS_WITH_VARIABLE_DENOMINATOR.id]: generateEquationsWithVariableDenominatorQuestion,
    [SUBJECTS.EQUATIONS_NUMERIC_DENOMINATOR.id]: generateNumericDenominatorEquation,
    [SUBJECTS.QUADRATIC_EQUATIONS.id]: generateQuadraticEquationQuestion,
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