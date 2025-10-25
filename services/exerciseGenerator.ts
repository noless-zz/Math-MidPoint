import { Point, Question, QuestionType, Difficulty, SUBJECTS, LineEquation, EquationPart } from '../types.ts';

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

// Helper function to find the greatest common divisor
function gcd(a: number, b: number): number {
    return b === 0 ? a : gcd(b, a % b);
}

// --- EQUATIONS WITH VARIABLE DENOMINATOR ---
function generateEquationsWithVariableDenominatorQuestion(difficulty: Difficulty['id']): Question {
    let questionText: string;
    let solution: number;
    let explanation: string;
    let detailedExplanation: string[];
    let equationParts: EquationPart[];

    if (difficulty === 'easy') {
        // Form: a / (x + b) = c
        const x = getRandomInt(-10, 10);
        let b = getRandomInt(-10, 10);
        if (x + b === 0) b++;
        let c = getRandomInt(1, 5) * (Math.random() > 0.5 ? 1 : -1);
        if (c === 0) c = 1;
        const a = c * (x + b);
        
        const denominator = b === 0 ? 'x' : `x ${b > 0 ? '+' : '-'} ${Math.abs(b)}`;
        questionText = `פתור את המשוואה:`;
        solution = x;
        explanation = `כדי לפתור, יש לכפול את שני אגפי המשוואה במכנה המשותף (${denominator}).`;
        detailedExplanation = [
            `תחום הגדרה: המכנה לא יכול להיות אפס, לכן ${denominator} ≠ 0, כלומר x ≠ ${-b}.`,
            `כופלים את שני אגפי המשוואה במכנה (${denominator}) כדי לבטל את השבר.`,
            `${a} = ${c}(${denominator})`,
            `פותחים סוגריים: ${a} = ${c}x ${c*b >= 0 ? '+' : '-'} ${Math.abs(c*b)}`,
            `מעבירים אגפים כדי לבודד את x: ${a - (c*b)} = ${c}x`,
            `מחלקים במקדם של x: x = ${solution}`,
            `התשובה תקינה ונמצאת בתחום ההגדרה.`,
        ];
        
        equationParts = [
            { type: 'fraction', numerator: a.toString(), denominator: denominator },
            { type: 'operator', value: '=' },
            { type: 'number', value: c }
        ];

    } else if (difficulty === 'medium') {
        // Form: (ax+b)/(cx+d) = e/f
        const x = getRandomInt(-10, 10);
        const a = getRandomInt(1, 5);
        const b = getRandomInt(-10, 10);
        const c = getRandomInt(1, 5);
        const d = getRandomInt(-10, 10);

        if (a * d === b * c || c * x + d === 0) {
            return generateEquationsWithVariableDenominatorQuestion(difficulty);
        }
        
        const num = a * x + b;
        const den = c * x + d;
        
        const commonDivisor = gcd(Math.abs(num), Math.abs(den));
        const e = num / commonDivisor;
        const f = den / commonDivisor;

        const numStr = `${a}x ${b >= 0 ? '+' : '-'} ${Math.abs(b)}`;
        const denStr = `${c}x ${d >= 0 ? '+' : '-'} ${Math.abs(d)}`;

        questionText = `פתור את המשוואה:`;
        solution = x;
        explanation = `כדי להיפטר מהשברים, יש לבצע כפל בהצלבה.`;
        detailedExplanation = [
            `תחום הגדרה: המכנה לא יכול להיות אפס, לכן ${denStr} ≠ 0, כלומר x ≠ ${-d/c}.`,
            `מבצעים כפל בהצלבה: ${f}(${numStr}) = ${e}(${denStr})`,
            `פותחים סוגריים בשני האגפים: ${f*a}x ${f*b >= 0 ? '+' : '-'} ${Math.abs(f*b)} = ${e*c}x ${e*d >= 0 ? '+' : '-'} ${Math.abs(e*d)}`,
            `מעבירים איברים עם x לאגף שמאל ומספרים לאגף ימין: ${f*a - e*c}x = ${e*d - f*b}`,
            `פותרים ומקבלים: x = ${solution}.`,
            `התשובה תקינה ונמצאת בתחום ההגדרה.`,
        ];
        
        equationParts = [
            { type: 'fraction', numerator: numStr, denominator: denStr },
            { type: 'operator', value: '=' },
            { type: 'fraction', numerator: e.toString(), denominator: f.toString() }
        ];

    } else { // hard
        let x, a, b, c, d;
        let attempts = 0;
        do {
            x = getRandomInt(-10, 10);
            a = getRandomInt(1, 8);
            c = getRandomInt(1, 8); 
            b = getRandomInt(-10, 10);
            
            if (a === c) { d = NaN; continue; }

            const numeratorForD = c * b - x * (a - c);
            if (numeratorForD % a !== 0) { d = NaN; continue; }
            d = numeratorForD / a;
            
            if (attempts++ > 50) return generateEquationsWithVariableDenominatorQuestion('medium');

        } while ( isNaN(d) || !Number.isInteger(d) || b === d || x + b === 0 || x + d === 0 );
        
        questionText = `פתור את המשוואה:`;
        solution = x;
        
        const den1 = b === 0 ? 'x' : `x ${b > 0 ? '+' : '-'} ${Math.abs(b)}`;
        const den2 = d === 0 ? 'x' : `x ${d > 0 ? '+' : '-'} ${Math.abs(d)}`;

        explanation = `תחילה, יש להעביר את אחד השברים אגף כדי להשוות בין שני השברים.`;
        detailedExplanation = [
            `תחום הגדרה: המכנים לא יכולים להיות אפס, לכן x ≠ ${-b} וגם x ≠ ${-d}.`,
            `מעבירים את השבר השני לאגף ימין: ${a}/(${den1}) = ${c}/(${den2})`,
            `כופלים בהצלבה: ${a}(${den2}) = ${c}(${den1})`,
            `פותחים סוגריים: ${a}x ${a*d >=0 ? '+':'-'} ${Math.abs(a*d)} = ${c}x ${c*b >=0 ? '+':'-'} ${Math.abs(c*b)}`,
            `מעבירים אגפים: ${a-c}x = ${c*b - a*d}`,
            `פותרים ומקבלים: x = ${solution}.`,
            `התשובה תקינה ונמצאת בתחום ההגדרה.`,
        ];

        equationParts = [
            { type: 'fraction', numerator: a.toString(), denominator: den1 },
            { type: 'operator', value: '-' },
            { type: 'fraction', numerator: c.toString(), denominator: den2 },
            { type: 'operator', value: '=' },
            { type: 'number', value: 0 }
        ];
    }

    return {
        type: 'SOLVE_EQUATION_VARIABLE_DENOMINATOR',
        question: questionText,
        equationParts,
        solution: solution,
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
            `שיעור ה-X של נקודת האמצע הוא ממוצע שיעורי ה-X של הקצוות:`,
            `x_M = (x_A + x_B) / 2 = (${pointA.x} + ${pointB.x}) / 2 = ${midpoint.x}`,
            `שיעור ה-Y של נקודת האמצע הוא ממוצע שיעורי ה-Y של הקצוות:`,
            `y_M = (y_A + y_B) / 2 = (${pointA.y} + ${pointB.y}) / 2 = ${midpoint.y}`,
            `לכן, נקודת האמצע היא (${midpoint.x}, ${midpoint.y}).`
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
                `מציאת שיעור x של נקודת הקצה B:`,
                `x_B = 2*x_M - x_A = 2 * ${midpoint.x} - (${pointA.x}) = ${pointB.x}`,
                `מציאת שיעור y של נקודת הקצה B:`,
                `y_B = 2*y_M - y_A = 2 * ${midpoint.y} - (${pointA.y}) = ${pointB.y}`,
                `שיעורי הנקודה B הם (${pointB.x}, ${pointB.y}).`
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
                `מציאת שיעור x של נקודת האמצע M:`,
                `x_M = (x_A + x_B) / 2 = (${pointA.x} + ${pointB.x}) / 2 = ${midpoint.x}`,
                `מציאת שיעור y של נקודת האמצע M:`,
                `y_M = (y_A + y_B) / 2 = (${pointA.y} + ${pointB.y}) / 2 = ${midpoint.y}`,
                `שיעורי הנקודה M הם (${midpoint.x}, ${midpoint.y}).`
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
            `מציבים את שיעורי הנקודות בנוסחת השיפוע:`,
            `m = (${p2.y} - ${p1.y}) / (${p2.x} - ${p1.x})`,
            `מחשבים את ההפרש במונה ובמכנה:`,
            `m = ${p2.y - p1.y} / ${p2.x - p1.x}`,
            `השיפוע הוא ${slope}.`
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
           `מציבים את שיעורי הנקודות בנוסחת המרחק:`,
           `d = √
- ((${p2.x}) - (${p1.x}))² + ((${p2.y}) - (${p1.y}))² )`,
           `מחשבים את ההפרשים: d = √
- (${dx})² + (${dy})² )`,
           `מעלים בריבוע: d = √
- (${dx**2} + ${dy**2})`,
           `מחברים ומוציאים שורש: d = √
- (${dx**2 + dy**2}) = ${distance}`,
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
            `לכן, m2 = -1 / m1.`,
            `m2 = -1 / ${m1.toFixed(2)} = ${solution.toFixed(2)}.`,
            `השיפוע המאונך הוא ${solution.toFixed(2)}.`
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
            `משווים את שתי המשוואות: ${line1.text} = ${line2.text}.`,
            `מעבירים את האיברים עם x לאגף אחד ואת המספרים לאגף השני:`,
            `${line1.m - line2.m}x = ${line2.b - line1.b}`,
            `פותרים ומקבלים: x = ${intersection.x}.`,
            `מציבים את ערך ה-x באחת המשוואות כדי למצוא את y:`,
            `y = ${line1.m} * (${intersection.x}) + ${line1.b} = ${intersection.y}`,
            `נקודת החיתוך היא (${intersection.x}, ${intersection.y}).`
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
        explanation: `שטח המשולש הוא ${area}.`,
        detailedExplanation: [`התשובה היא ${area}. ניתן לחשב באמצעות נוסחת שטח משולש על פי קואורדינטות או על ידי חישוב אורך צלע וגובה.`],
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
        detailedExplanation: [`כדי למצוא את שיעורי הנקודה, מורידים אנכים לצירים.`, `האנך לציר ה-x פוגע בערך ${solution.x}.`, `האנך לציר ה-y פוגע בערך ${solution.y}.`, `לכן, שיעורי הנקודה הם (${solution.x},${solution.y}).`], 
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