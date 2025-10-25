import { Point, Question, QuestionType, Difficulty, SUBJECTS, LineEquation, EquationPart, EquationSolution } from '../types.ts';

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

// --- EQUATIONS WITH VARIABLE DENOMINATOR ---
function generateEquationsWithVariableDenominatorQuestion(difficulty: Difficulty['id']): Question {
    const questionText = `פתור את המשוואה:`;
    let solution: number | EquationSolution;
    let explanation: string;
    let detailedExplanation: string[];
    let equationParts: EquationPart[];

    // Template 1: a / (x+b) = c (Easy)
    const template1 = () => {
        const x_sol = getRandomInt(-10, 10);
        let b = getRandomInt(-10, 10);
        if (x_sol + b === 0) b++;
        let c = getRandomInt(1, 5) * (Math.random() > 0.5 ? 1 : -1);
        if (c === 0) c = 1;
        const a = c * (x_sol + b);
        
        const denominator = b === 0 ? 'x' : `x ${b > 0 ? '+' : '-'} ${Math.abs(b)}`;
        solution = x_sol;
        explanation = `כופלים את שני אגפי המשוואה במכנה (${denominator}) כדי לבטל את השבר.`;
        detailedExplanation = [
            `תחום הגדרה: המכנה לא יכול להיות אפס, לכן ${denominator} ≠ 0, כלומר x ≠ ${-b}.`,
            `כופלים את שני אגפי המשוואה במכנה: ${a} = ${c}(${denominator})`,
            `פותחים סוגריים: ${a} = ${c}x ${c*b >= 0 ? '+' : '-'} ${Math.abs(c*b)}`,
            `מעבירים אגפים כדי לבודד את x: ${a - (c*b)} = ${c}x`,
            `מחלקים במקדם של x: x = ${solution}`,
            `הפתרון תקין ונמצא בתחום ההגדרה.`
        ];
        equationParts = [ { type: 'fraction', numerator: a.toString(), denominator }, { type: 'operator', value: '=' }, { type: 'number', value: c } ];
    };

    // Template 2: (ax+b)/(cx+d) = e (Medium)
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
        solution = x_sol;
        explanation = `כדי לבטל את המכנה, כופלים את שני האגפים ב-${denStr}.`;
        detailedExplanation = [
            `תחום הגדרה: המכנה לא יכול להיות אפס, לכן ${denStr} ≠ 0, כלומר x ≠ ${(-d/c).toFixed(2)}.`,
            `כופלים את שני האגפים במכנה: ${numStr} = ${e}(${denStr})`,
            `פותחים סוגריים: ${numStr} = ${e*c}x ${e*d >= 0 ? '+' : '-'} ${Math.abs(e*d)}`,
            `מעבירים איברים עם x לאגף אחד ומספרים לאגף השני: ${a - e*c}x = ${e*d - b}`,
            `מחלקים במקדם של x: x = ${solution}`,
            `הפתרון תקין ונמצא בתחום ההגדרה.`,
        ];
        equationParts = [ { type: 'fraction', numerator: numStr, denominator: denStr }, { type: 'operator', value: '=' }, { type: 'number', value: e } ];
    };

    // Template 3: x/a = b/(x+c) -> leads to quadratic (Medium/Hard)
    const template3 = () => {
        const x1 = getRandomInt(-5, 5);
        let x2;
        do {
            x2 = getRandomInt(-5, 5);
        } while (x1 === x2);

        // (x-x1)(x-x2) = 0 => x^2 - (x1+x2)x + x1*x2 = 0
        const c = -(x1 + x2);
        const a_times_b = -x1 * x2;
        let a = [1, 2, 3, 4].sort(() => .5 - Math.random())[0];
        if (a_times_b % a !== 0) a = 1;
        const b = a_times_b / a;

        // Equation: x(x+c) = ab => x^2 + cx = ab => x^2 + cx - ab = 0
        // Our case: x/a = b/(x-c)
        const x_sol = Math.random() > 0.5 ? x1 : x2;
        let domain_val = c;
        if (x_sol === domain_val) { // solution is extraneous, pick the other one
            solution = (x1 === domain_val) ? x2 : x1;
        } else {
            solution = x_sol;
        }

        const denStr = `x ${c > 0 ? '+' : '-'} ${Math.abs(c)}`;
        explanation = `מבצעים כפל בהצלבה כדי לקבל משוואה ריבועית.`;
        detailedExplanation = [
            `תחום הגדרה: x ≠ ${-c}.`,
            `כפל בהצלבה נותן: x(${denStr}) = ${a*b}`,
            `פותחים סוגריים: x² ${c >= 0 ? '+' : '-'} ${Math.abs(c)}x = ${a*b}`,
            `מעבירים הכל לאגף אחד: x² ${c >= 0 ? '+' : '-'} ${Math.abs(c)}x ${-a*b >= 0 ? '+' : '-'} ${Math.abs(-a*b)} = 0`,
            `הפתרונות למשוואה הריבועית הם ${x1} ו-${x2}.`,
            `הפתרון ${-c} נפסל בגלל תחום ההגדרה, לכן הפתרון היחיד הוא x = ${solution}.`
        ];
        equationParts = [ { type: 'fraction', numerator: 'x', denominator: a.toString() }, { type: 'operator', value: '=' }, { type: 'fraction', numerator: b.toString(), denominator: denStr } ];

        if (difficulty === 'hard') {
            const domain = [-c];
            let valid_solution: number | null = null;
            if (x1 !== -c) valid_solution = x1;
            if (x2 !== -c && valid_solution === null) valid_solution = x2;
            if (x1 !== -c && x2 !== -c && x1 !== x2) { // both valid, too complex
                return template2(); // fallback to simpler hard
            }
            if (x1 === -c && x2 === -c) valid_solution = null; // No solution
            
            solution = { value: valid_solution, domain: Array.from(new Set(domain)) };
            detailedExplanation.pop();
            detailedExplanation.push(`הפתרון ${valid_solution === null ? 'היחיד' : ''} ${-c} נפסל על ידי תחום ההגדרה. ${valid_solution !== null ? `לכן הפתרון הוא x = ${valid_solution}` : 'לכן למשוואה אין פתרון.'}`);
        }
    };
    
    // Template 4: a/(x+b) + c/(x+d) = e (Hard)
    const template4 = () => {
        const x_sol = getRandomInt(-8, 8);
        let b, d;
        do { b = getRandomInt(-8, 8); } while (x_sol + b === 0);
        do { d = getRandomInt(-8, 8); } while (x_sol + d === 0 || b === d);

        const a = getRandomInt(1, 5) * (x_sol + b);
        const c = getRandomInt(1, 5) * (x_sol + d);
        const e = (a / (x_sol + b)) + (c / (x_sol + d));

        const den1Str = `x ${b > 0 ? '+' : '-'} ${Math.abs(b)}`;
        const den2Str = `x ${d > 0 ? '+' : '-'} ${Math.abs(d)}`;
        solution = { value: x_sol, domain: [-b, -d].sort((a,b)=>a-b) };
        explanation = `יש למצוא מכנה משותף, לכפול בו את כל המשוואה ולפתור.`;
        detailedExplanation = [
            `תחום ההגדרה הוא: x ≠ ${-b} וגם x ≠ ${-d}.`,
            `המכנה המשותף הוא (${den1Str})(${den2Str}).`,
            `כופלים את המשוואה במכנה המשותף ומקבלים: ${a}(${den2Str}) + ${c}(${den1Str}) = ${e}(${den1Str})(${den2Str})`,
            `לאחר פתיחת סוגריים וכינוס איברים, הפתרון שמתקבל הוא x = ${x_sol}.`,
            `הפתרון תקין ונמצא בתחום ההגדרה.`
        ];
        equationParts = [
             { type: 'fraction', numerator: a.toString(), denominator: den1Str },
             { type: 'operator', value: '+' },
             { type: 'fraction', numerator: c.toString(), denominator: den2Str },
             { type: 'operator', value: '=' },
             { type: 'number', value: e }
        ];
    };

    if (difficulty === 'easy') {
        template1();
    } else if (difficulty === 'medium') {
        if (Math.random() > 0.5) {
            template2();
        } else {
            template3();
        }
    } else { // hard
        const rand = Math.random();
        if (rand < 0.5) {
            template3();
        } else {
            template4();
        }
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
function generateMidpointVisualQuestion(difficulty: Difficulty['id']): Question {
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

function generateMidpointTextQuestion(difficulty: Difficulty['id'], isMCQ: boolean): Question {
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
            const solutionKey = `${pointB.x},${pointB.y}`;
            const used = new Set<string>([solutionKey]);
            const add = (p:Point) => { if(!used.has(`${p.x},${p.y}`)) { distractors.push(p); used.add(`${p.x},${p.y}`); }};
            add({ x: 2 * midpoint.x + pointA.x, y: 2 * midpoint.y + pointA.y });
            add({ x: midpoint.x, y:pointB.y});
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
            const solutionKey = `${midpoint.x},${midpoint.y}`;
            const used = new Set<string>([solutionKey]);
            const add = (p:Point) => { if(!used.has(`${p.x},${p.y}`)) { distractors.push(p); used.add(`${p.x},${p.y}`); }};
            add({ x: midpoint.y, y: midpoint.x });
            add({ x: -midpoint.x, y: midpoint.y });
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

function generateMidpointQuestion(difficulty: Difficulty['id']): Question {
    const rand = Math.random();
    if (difficulty === 'easy') {
        if (rand < 0.5) return generateMidpointVisualQuestion(difficulty);
        return generateMidpointTextQuestion(difficulty, true);
    }
    if (difficulty === 'medium') {
        if (rand < 0.25) return generateMidpointVisualQuestion(difficulty);
        if (rand < 0.75) return generateMidpointTextQuestion(difficulty, true);
        return generateMidpointTextQuestion(difficulty, false);
    }
    // Hard
    if (rand < 0.3) return generateMidpointTextQuestion(difficulty, true);
    return generateMidpointTextQuestion(difficulty, false);
}


// --- NEW QUESTION GENERATORS ---

function generateSlopeQuestion(difficulty: Difficulty['id']): Question {
    let range = 10;
    if (difficulty === 'easy') range = 5;
    if (difficulty === 'hard') range = 15;

    const p1 = { x: getRandomInt(-range, range), y: getRandomInt(-range, range) };
    let p2: Point;
    let slope: number;

    do {
        p2 = { x: getRandomInt(-range, range), y: getRandomInt(-range, range) };
    } while (p1.x === p2.x); // Avoid vertical lines with undefined slope

    if (difficulty === 'easy' && (p2.y - p1.y) % (p2.x - p1.x) !== 0) {
        p2.y = p1.y + getRandomInt(-3, 3) * (p2.x - p1.x);
    }

    slope = (p2.y - p1.y) / (p2.x - p1.x);

    return {
        type: 'CALCULATE_SLOPE',
        question: `מהו השיפוע (m) של הקו הישר העובר דרך הנקודות A(${p1.x}, ${p1.y}) ו-B(${p2.x}, ${p2.y})?`,
        points: { A: p1, B: p2 },
        solution: slope,
        explanation: `יש להשתמש בנוסחה למציאת שיפוע: m = (y2 - y1) / (x2 - x1).`,
        detailedExplanation: [
            `נציב את שיעורי הנקודות בנוסחת השיפוע: m = (${p2.y} - ${p1.y}) / (${p2.x} - ${p1.x})`,
            `נחשב את ההפרש במונה ובמכנה: m = ${p2.y - p1.y} / ${p2.x - p1.x}`,
            `השיפוע הוא: ${slope.toFixed(2)}`
        ],
        difficulty,
    };
}

function generateDistanceQuestion(difficulty: Difficulty['id']): Question {
    let range = 10;
    if (difficulty === 'easy') range = 6;
    if (difficulty === 'hard') range = 15;

    let p1: Point, p2: Point, distance: number;

    do {
        p1 = { x: getRandomInt(-range, range), y: getRandomInt(-range, range) };
        p2 = { x: getRandomInt(-range, range), y: getRandomInt(-range, range) };
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        distance = Math.sqrt(dx*dx + dy*dy);
    } while (difficulty !== 'hard' && distance % 1 !== 0);

    const dx = p2.x-p1.x;
    const dy = p2.y-p1.y;

    return {
        type: 'CALCULATE_DISTANCE',
        question: `מהו המרחק (d) בין הנקודות A(${p1.x}, ${p1.y}) ו-B(${p2.x}, ${p2.y})?`,
        points: { A: p1, B: p2 },
        solution: distance,
        explanation: `יש להשתמש בנוסחת המרחק: d = √((x2-x1)² + (y2-y1)²).`,
        detailedExplanation: [
           `נציב את שיעורי הנקודות בנוסחת המרחק: d = √
- ((${p2.x}) - (${p1.x}))² + ((${p2.y}) - (${p1.y}))² )`,
           `מחשבים את ההפרשים: d = √
- (${dx})² + (${dy})² )`,
           `מעלים בריבוע: d = √
- (${dx**2} + ${dy**2})`,
           `המרחק הוא: d = √
- (${dx**2 + dy**2}) = ${distance.toFixed(2)}`,
        ],
        difficulty,
    };
}

function generatePerpendicularSlopeQuestion(difficulty: Difficulty['id']): Question {
    let m1: number;
    let questionText: string;

    if (difficulty === 'easy') {
        m1 = getRandomInt(-5, 5);
        while (m1 === 0) m1 = getRandomInt(-5, 5);
        questionText = `נתון ישר ששיפועו הוא ${m1}. מהו שיפוע הישר המאונך לו?`;
    } else {
        const num = getRandomInt(-9, 9);
        const den = getRandomInt(-9, 9);
        if (num === 0 || den === 0) return generatePerpendicularSlopeQuestion(difficulty);
        m1 = num / den;
        const b = getRandomInt(-10, 10);
        questionText = `מהו שיפוע הישר המאונך לישר ${num}x ${b >= 0 ? '+' : '-'} ${Math.abs(b)}y = ${getRandomInt(1, 20)}?`;
        if (difficulty === 'medium' || Math.random() > 0.5) {
             questionText = `מהו שיפוע הישר המאונך לישר y = ${m1.toFixed(2)}x ${b >= 0 ? '+' : '-'} ${Math.abs(b)}?`;
        }
    }
    
    const solution = -1 / m1;

    return {
        type: 'FIND_PERPENDICULAR_SLOPE',
        question: questionText,
        solution: solution,
        explanation: `שיפוע של ישר מאונך הוא הופכי ונגדי לשיפוע המקורי (m2 = -1/m1).`,
        detailedExplanation: [
            `השיפוע של הישר הנתון הוא m1 = ${m1.toFixed(2)}.`,
            `השיפוע של הישר המאונך, m2, מקיים: m1 * m2 = -1.`,
            `לכן, יש לחשב: m2 = -1 / ${m1.toFixed(2)}`,
            `השיפוע המאונך הוא: ${solution.toFixed(2)}.`
        ],
        difficulty,
    };
}

function generateIntersectionQuestion(difficulty: Difficulty['id']): Question {
    let line1: LineEquation, line2: LineEquation;
    let intersection: Point;

    do {
        const m1 = getRandomInt(-5, 5);
        const b1 = getRandomInt(-10, 10);
        let m2 = getRandomInt(-5, 5);
        const b2 = getRandomInt(-10, 10);
        
        while(m1 === m2) m2 = getRandomInt(-5, 5);

        const x = (b2 - b1) / (m1 - m2);
        const y = m1 * x + b1;
        intersection = { x, y };
        
        line1 = { m: m1, b: b1, text: `y = ${m1}x ${b1 >= 0 ? '+' : '-'} ${Math.abs(b1)}` };
        line2 = { m: m2, b: b2, text: `y = ${m2}x ${b2 >= 0 ? '+' : '-'} ${Math.abs(b2)}` };

    } while (difficulty !== 'hard' && (intersection.x % 1 !== 0 || intersection.y % 1 !== 0));


    return {
        type: 'FIND_INTERSECTION_POINT',
        question: `מצא/י את נקודת החיתוך של שני הישרים הבאים: ${line1.text} ו- ${line2.text}.`,
        lines: [line1, line2],
        solution: intersection,
        explanation: `כדי למצוא את נקודת החיתוך, יש להשוות בין שתי משוואות הישרים.`,
        detailedExplanation: [
            `משווים את שתי המשוואות: ${line1.m}x ${line1.b >= 0 ? '+' : '-'} ${Math.abs(line1.b)} = ${line2.m}x ${line2.b >= 0 ? '+' : '-'} ${Math.abs(line2.b)}`,
            `מעבירים את האיברים עם x לאגף אחד ואת המספרים לאגף השני: ${line1.m - line2.m}x = ${line2.b - line1.b}`,
            `פותרים ומקבלים: x = ${intersection.x.toFixed(2)}`,
            `מציבים את ערך ה-x באחת המשוואות כדי למצוא את y: y = ${line1.m} * (${intersection.x.toFixed(2)}) + ${line1.b} = ${intersection.y.toFixed(2)}`,
            `נקודת החיתוך היא: (${intersection.x.toFixed(2)}, ${intersection.y.toFixed(2)}).`
        ],
        difficulty,
    };
}


// --- EXISTING GENERATORS (UNCHANGED) ---
function generateAreaQuestion(difficulty: Difficulty['id']): Question {
    let range = 10;
    if (difficulty === 'easy') range = 5;
    if (difficulty === 'hard') range = 15;
    let p1: Point, p2: Point, p3: Point, area: number;
    const calculateArea = (p1: Point, p2: Point, p3: Point) => 0.5 * Math.abs(p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y));
    if (difficulty === 'easy') {
        p1 = { x: getRandomInt(-range, range), y: getRandomInt(-range, range) };
        if (Math.random() > 0.5) { p2 = { x: getRandomInt(-range, range), y: p1.y }; p3 = { x: getRandomInt(-range, range), y: getRandomInt(-range, range) };
        } else { p2 = { x: p1.x, y: getRandomInt(-range, range) }; p3 = { x: getRandomInt(-range, range), y: getRandomInt(-range, range) }; }
    } else {
        do { p1 = { x: getRandomInt(-range, range), y: getRandomInt(-range, range) }; p2 = { x: getRandomInt(-range, range), y: getRandomInt(-range, range) }; p3 = { x: getRandomInt(-range, range), y: getRandomInt(-range, range) }; area = calculateArea(p1, p2, p3);
        } while (area === 0 || area % 1 !== 0);
    }
    area = calculateArea(p1, p2, p3);
    return {
        type: 'CALCULATE_AREA',
        question: `במערכת הצירים נתון משולש ABC שקודקודיו הם A(${p1.x},${p1.y}), B(${p2.x},${p2.y}) ו-C(${p3.x},${p3.y}). חשבו את שטח המשולש.`,
        points: { A: p1, B: p2, C: p3 },
        solution: area, 
        explanation: `ניתן לחשב את השטח באמצעות נוסחת שטח משולש על פי קואורדינטות או על ידי חישוב אורך צלע וגובה.`,
        detailedExplanation: [`התשובה היא ${area}.`],
        difficulty,
    };
}

function generateCoordinateSystemQuestion(difficulty: Difficulty['id']): Question {
    let range = 12, numPoints = 1;
    if (difficulty === 'easy') { range = 8; numPoints = getRandomInt(1, 2); }
    if (difficulty === 'medium') { range = 10; numPoints = getRandomInt(2, 3); }
    if (difficulty === 'hard') { range = 15; numPoints = 3; }
    const points: { [key: string]: Point } = {}; const pointNames: string[] = []; const usedCoords = new Set<string>();
    for (let i = 0; i < numPoints; i++) {
        const pointName = String.fromCharCode(65 + i); let p: Point;
        do { p = { x: getRandomInt(-range, range), y: getRandomInt(-range, range) }; } while (usedCoords.has(`${p.x},${p.y}`));
        usedCoords.add(`${p.x},${p.y}`); points[pointName] = p; pointNames.push(pointName);
    }
    const targetPointName = pointNames[Math.floor(Math.random() * pointNames.length)];
    const solution = points[targetPointName];
    return {
        type: 'IDENTIFY_COORDINATES',
        question: `מהם שיעורי הנקודה ${targetPointName} המוצגת על מערכת הצירים?`,
        points: points as { A: Point; B?: Point; C?: Point; },
        solution, 
        explanation: `שיעור ה-x נקבע על פי המיקום האופקי, ושיעור ה-y על פי המיקום האנכי.`,
        detailedExplanation: [`כדי למצוא את שיעורי הנקודה, מורידים אנכים לצירים. האנך לציר ה-x פוגע בערך ${solution.x}, והאנך לציר ה-y פוגע בערך ${solution.y}.`, `לכן, שיעורי הנקודה הם (${solution.x},${solution.y}).`], 
        difficulty,
    };
}

// --- MAIN GENERATOR ---
const generators = {
    [SUBJECTS.MIDPOINT.id]: generateMidpointQuestion,
    [SUBJECTS.AREA_CALC.id]: generateAreaQuestion,
    [SUBJECTS.COORDINATE_SYSTEM.id]: generateCoordinateSystemQuestion,
    [SUBJECTS.STRAIGHT_LINE.id]: generateSlopeQuestion,
    [SUBJECTS.DISTANCE.id]: generateDistanceQuestion,
    [SUBJECTS.PERPENDICULAR_LINES.id]: generatePerpendicularSlopeQuestion,
    [SUBJECTS.LINE_INTERSECTION.id]: generateIntersectionQuestion,
    [SUBJECTS.EQUATIONS_WITH_VARIABLE_DENOMINATOR.id]: generateEquationsWithVariableDenominatorQuestion,
    [SUBJECTS.TRIANGLE_PROPERTIES.id]: (diff) => generateMidpointTextQuestion(diff, false), // Re-uses midpoint logic for now
};

export function generateQuestion(config: { subjects: string[]; difficulty: Difficulty['id'] }): Question {
    const availableGenerators = config.subjects.filter(id => generators[id]);
    const randomSubjectId = availableGenerators[Math.floor(Math.random() * availableGenerators.length)];
    const generator = generators[randomSubjectId];
    return generator(config.difficulty);
}