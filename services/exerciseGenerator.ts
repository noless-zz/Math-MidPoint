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


// --- EQUATIONS WITH VARIABLE DENOMINATOR ---
function generateEquationsWithVariableDenominatorQuestion(difficulty: Difficulty['id']): Omit<Question, 'subjectId'> {
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
        solution = { value: [x_sol], domain: [-d/c] };
        explanation = `כדי לבטל את המכנה, יש לכפול את שני האגפים ב-${denStr}.`;
        detailedExplanation = [
            `תחום הגדרה: המכנה לא יכול להיות אפס, לכן x ≠ ${(-d/c).toFixed(2)}.`,
            `כופלים את שני האגפים במכנה: ${numStr} = ${e}(${denStr})`,
            `פותחים סוגריים: ${numStr} = ${e*c}x ${e*d >= 0 ? '+' : '-'} ${Math.abs(e*d)}`,
            `מעבירים איברים עם x לאגף אחד ומספרים לאגף השני: ${a - e*c}x = ${e*d - b}`,
            `מחלקים במקדם של x ומקבלים את הפתרון: x = ${x_sol}`,
            `בדיקה: הפתרון תקין ונמצא בתחום ההגדרה.`,
        ];
        equationParts = [ { type: 'fraction', numerator: numStr, denominator: denStr }, { type: 'operator', value: '=' }, { type: 'term', value: e.toString() } ];
    };

    // Template 3: x/a = b/(x+c) -> leads to quadratic (Hard)
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

        const denStr = formatDenominator('x', c);
        const domain = [-c];
        let valid_solutions = [x1, x2].filter(s => !domain.includes(s));
        
        solution = { value: valid_solutions.length > 0 ? valid_solutions : null, domain: Array.from(new Set(domain)) };
        explanation = `יש לבצע כפל בהצלבה כדי לקבל משוואה ריבועית.`;
        
        const solutionString = valid_solutions.length > 0 ? `הפתרונות התקינים הם: x = ${valid_solutions.join(' או x = ')}` : 'אין פתרונות תקינים.';

        detailedExplanation = [
            `תחום הגדרה: x ≠ ${-c}`,
            `מבצעים כפל בהצלבה: x(${denStr}) = ${a*b}`,
            `פותחים סוגריים ומסדרים למשוואה ריבועית: x² ${c >= 0 ? '+' : '-'} ${Math.abs(c)}x - ${a*b} = 0`,
            `הפתרונות למשוואה הריבועית הם: x = ${x1} או x = ${x2}`,
            `בודקים את הפתרונות מול תחום ההגדרה: ${[x1,x2].filter(s => domain.includes(s)).map(s => `הפתרון x=${s} נפסל.`).join(' ')}`,
            solutionString
        ];
        equationParts = [ { type: 'fraction', numerator: 'x', denominator: a.toString() }, { type: 'operator', value: '=' }, { type: 'fraction', numerator: b.toString(), denominator: denStr } ];
    };
    
    // Template 4: a/(x+b) + c/(x+d) = e (Hard)
    const template4 = () => {
        const x_sol = getRandomInt(-8, 8);
        let b, d;
        do { b = getRandomInt(-8, 8); } while (x_sol + b === 0);
        do { d = getRandomInt(-8, 8); } while (x_sol + d === 0 || b === d);

        const a_val = getRandomInt(1, 5);
        const c_val = getRandomInt(1, 5);
        const e = a_val + c_val; // simplified for nicer numbers
        
        const a = a_val * (x_sol + b);
        const c = c_val * (x_sol + d);

        const den1Str = formatDenominator('x', b);
        const den2Str = formatDenominator('x', d);
        solution = { value: [x_sol], domain: [-b, -d].sort((a,b)=>a-b) };
        explanation = `יש למצוא מכנה משותף, לכפול בו את כל המשוואה ולפתור.`;
        const domainString = `x ≠ ${solution.domain[0]} וגם x ≠ ${solution.domain[1]}`;
        detailedExplanation = [
            `תחום ההגדרה הוא: ${domainString}`,
            `המכנה המשותף הוא: (${den1Str})(${den2Str})`,
            `כופלים את המשוואה במכנה המשותף ומקבלים: ${a}(${den2Str}) + ${c}(${den1Str}) = ${e}(${den1Str})(${den2Str})`,
            `לאחר פתיחת סוגריים וכינוס איברים, הפתרון שמתקבל הוא: x = ${x_sol}`,
            `בדיקה: הפתרון תקין ונמצא בתחום ההגדרה.`
        ];
        equationParts = [
             { type: 'fraction', numerator: a.toString(), denominator: den1Str },
             { type: 'operator', value: '+' },
             { type: 'fraction', numerator: c.toString(), denominator: den2Str },
             { type: 'operator', value: '=' },
             { type: 'term', value: e.toString() }
        ];
    };
    
     // Template 5: Cross-multiplication like a/(x+b) = c/(x+d) (Medium)
    const template5 = () => {
        const x_sol = getRandomInt(-8, 8);
        let b = getRandomInt(-8, 8);
        if (x_sol + b === 0) b++;
        let d = getRandomInt(-8, 8);
        if (x_sol + d === 0) d++;
        if (b === d) d++;
        
        const c = getRandomInt(1, 5) * (Math.random() > 0.5 ? 1 : -1);
        const a_float = c * (x_sol + b) / (x_sol + d);
        
        if (Math.abs(a_float) > 20 || a_float % 1 !== 0 || a_float === 0) { // retry if 'a' is not a nice number
            return template2();
        }
        const a = a_float;

        const den1Str = formatDenominator('x', b);
        const den2Str = formatDenominator('x', d);
        solution = { value: [x_sol], domain: [-b, -d].sort() };
        explanation = `כדי לפתור, יש לבצע כפל בהצלבה כדי להיפטר מהמכנים.`;
        detailedExplanation = [
            `תחום הגדרה: x ≠ ${-b} וגם x ≠ ${-d}.`,
            `מבצעים כפל בהצלבה: ${a}(${den2Str}) = ${c}(${den1Str})`,
            `פותחים סוגריים: ${a}x ${a*d >= 0 ? '+' : '-'} ${Math.abs(a*d)} = ${c}x ${c*b >= 0 ? '+' : '-'} ${Math.abs(c*b)}`,
            `מעבירים אגפים: ${a - c}x = ${c*b - a*d}`,
            `מחלקים במקדם של x ומקבלים את הפתרון: x = ${x_sol}`,
            `בדיקה: הפתרון תקין ונמצא בתחום ההגדרה.`
        ];
        equationParts = [
            { type: 'fraction', numerator: a.toString(), denominator: den1Str },
            { type: 'operator', value: '=' },
            { type: 'fraction', numerator: c.toString(), denominator: den2Str }
        ];
    };

    // Template 6: a/(x-b) + c/(b-x) = d (Medium)
    const template6 = () => {
        const x_sol = getRandomInt(-10, 10);
        let b = getRandomInt(-10, 10);
        if (x_sol - b === 0) b++;

        const d = getRandomInt(1, 5) * (Math.random() > 0.5 ? 1 : -1);
        const a_minus_c = d * (x_sol - b);
        const a = a_minus_c + getRandomInt(1,10);
        const c = a - a_minus_c;

        const den1Str = formatDenominator('x', -b);
        const den2Str = `${b} - x`;

        solution = { value: [x_sol], domain: [b] };
        explanation = `שים לב שניתן להפוך את המכנה השני ולהחליף את הסימן שלפני השבר.`;
        detailedExplanation = [
            `תחום הגדרה: x ≠ ${b}.`,
            `שים לב שהמכנה השני הוא הנגדי של הראשון: ${den2Str} = -(${den1Str}).`,
            `לכן ניתן לרשום את המשוואה מחדש: ${a}/(${den1Str}) - ${c}/(${den1Str}) = ${d}`,
            `מאחדים שברים: (${a-c})/(${den1Str}) = ${d}`,
            `כופלים במכנה: ${a_minus_c} = ${d}(${den1Str})`,
            `פותרים ומקבלים: x = ${x_sol}`,
            `בדיקה: הפתרון תקין ונמצא בתחום ההגדרה.`
        ];
        equationParts = [
            { type: 'fraction', numerator: a.toString(), denominator: den1Str },
            { type: 'operator', value: '+' },
            { type: 'fraction', numerator: c.toString(), denominator: den2Str },
            { type: 'operator', value: '=' },
            { type: 'term', value: d.toString() }
        ];
    };
    
    // Template 7: x + a/(x-b) = c (Hard, extraneous solution)
    const template7 = () => {
        const x1 = getRandomInt(-6, 6); // valid solution
        const x2 = getRandomInt(-6, 6); // extraneous solution
        if (x1 === x2) return template4(); // Fallback if solutions are the same

        const b = x2; // Denominator is (x-b), so x=b is forbidden.
        const c = getRandomInt(-5, 5);

        // From x + a/(x-b) = c => x(x-b) + a = c(x-b) => x^2 -bx + a = cx - cb
        // x^2 - (b+c)x + (a+cb) = 0
        // We want roots to be x1 and x2.
        // Sum of roots: x1+x2 = b+c
        // Product of roots: x1*x2 = a+cb
        const new_c = x1 + x2 - b;
        const a = x1*x2 - new_c*b;

        if (a === 0 || b === 0) return template4(); // fallback if params are zero
        
        const denStr = formatDenominator('x', -b);

        solution = { value: [x1], domain: [b] };
        explanation = `לאחר פישוט המשוואה מתקבלת משוואה ריבועית, יש לבדוק את הפתרונות מול תחום ההגדרה.`;
        detailedExplanation = [
            `תחום הגדרה: x ≠ ${b}.`,
            `כופלים את כל המשוואה במכנה (${denStr}): x(${denStr}) + ${a} = ${new_c}(${denStr})`,
            `פותחים סוגריים ומסדרים למשוואה ריבועית: x² - (${b+new_c})x + (${a + new_c*b}) = 0`,
            `הפתרונות למשוואה הריבועית הם: x = ${x1} או x = ${x2}`,
            `בודקים את הפתרונות מול תחום ההגדרה: הפתרון x=${x2} נפסל.`,
            `הפתרון היחיד התקין הוא: x = ${x1}`
        ];
        equationParts = [
            { type: 'term', value: 'x' },
            { type: 'operator', value: '+' },
            { type: 'fraction', numerator: a.toString(), denominator: denStr },
            { type: 'operator', value: '=' },
            { type: 'term', value: new_c.toString() }
        ];
    };
    
    // Template 8: Quadratic in 1/(x-b) (Hard)
    const template8 = () => {
        let b = getRandomInt(-7, 7);
        // a*u^2 + c*u = d_val
        const u1_num = getRandomInt(1, 4) * (Math.random() > 0.5 ? 1 : -1);
        const u1_den = getRandomInt(1, 2);
        const u1 = u1_num / u1_den;
        
        let u2_num, u2_den, u2;
        do {
            u2_num = getRandomInt(1, 4) * (Math.random() > 0.5 ? 1 : -1);
            u2_den = getRandomInt(1, 2);
            u2 = u2_num / u2_den;
        } while (u1 === u2);

        // Equation is (u-u1)(u-u2)=0 => u^2 - (u1+u2)u + u1*u2 = 0
        const a = 1;
        const c_float = -(u1 + u2);
        const d_val_float = -(u1 * u2);

        // Let's make c integer if possible
        const c = Math.round(c_float);
        const d_val = Math.round(d_val_float);

        if (Math.abs(c_float-c) > 0.01 || Math.abs(d_val_float - d_val) > 0.01) {
            return template7(); // retry if coefficients are not nice
        }
        
        const x1 = 1/u1 + b;
        const x2 = 1/u2 + b;

        const domain = [b];
        const valid_solutions = [x1, x2].filter(s => !domain.includes(s) && Math.abs(s) < 100);

        if (valid_solutions.length === 0) {
            return template7(); // fallback
        }
        
        solution = { value: valid_solutions, domain };
        
        const den = formatDenominator('x', -b);
        const explanation = `זוהי משוואה ריבועית עבור הביטוי 1/(${den}).`;

        const finalSolutionsString = `הפתרונות התקינים הם: ${valid_solutions.map(s => `x = ${s.toFixed(2).replace(/\.0+$/,'').replace(/\.$/,'')}`).join(' או ')}.`;

        detailedExplanation = [
            `תחום הגדרה: x ≠ ${b}.`,
            `אם נסמן u = 1/(${den}), נקבל את המשוואה הריבועית: ${a !== 1 ? a: ''}u² ${c >= 0 ? '+' : '-'} ${Math.abs(c)}u ${d_val > 0 ? '-' : '+'} ${Math.abs(d_val)} = 0`,
            `פתרונות המשוואה הריבועית עבור u הם: u = ${u1} או u = ${u2}`,
            `נחזור ל-x. עבור u = ${u1}, נקבל: 1/(${den}) = ${u1}, והפתרון הוא: x = ${x1.toFixed(2).replace(/\.0+$/,'').replace(/\.$/,'')}`,
            `עבור u = ${u2}, נקבל: 1/(${den}) = ${u2}, והפתרון הוא: x = ${x2.toFixed(2).replace(/\.0+$/,'').replace(/\.$/,'')}`,
            finalSolutionsString
        ];

        const c_term = c > 0 ? '+' : '-';
        const abs_c = Math.abs(c);
        
        equationParts = [
            { type: 'fraction', numerator: a.toString(), denominator: `(${den})²` },
            { type: 'operator', value: c_term },
            { type: 'fraction', numerator: abs_c.toString(), denominator: den },
            { type: 'operator', value: '=' },
            { type: 'term', value: d_val.toString() }
        ];
        if (c < 0) { // Switch operator and term for c
            equationParts = [
                { type: 'fraction', numerator: a.toString(), denominator: `(${den})²` },
                { type: 'operator', value: '-' },
                { type: 'fraction', numerator: abs_c.toString(), denominator: den },
                { type: 'operator', value: '=' },
                { type: 'term', value: d_val.toString() }
            ];
        }

    };


    if (difficulty === 'easy') {
        template1();
    } else if (difficulty === 'medium') {
        const rand = Math.random();
        if (rand < 0.33) template2();
        else if (rand < 0.66) template5();
        else template6();
    } else { // hard
        const rand = Math.random();
        if (rand < 0.25) template3();
        else if (rand < 0.5) template4();
        else if (rand < 0.75) template7();
        else template8();
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

function generateMidpointQuestion(difficulty: Difficulty['id']): Omit<Question, 'subjectId'> {
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

function generateSlopeQuestion(difficulty: Difficulty['id']): Omit<Question, 'subjectId'> {
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

function generateDistanceQuestion(difficulty: Difficulty['id']): Omit<Question, 'subjectId'> {
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

function generatePerpendicularSlopeQuestion(difficulty: Difficulty['id']): Omit<Question, 'subjectId'> {
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

function generateIntersectionQuestion(difficulty: Difficulty['id']): Omit<Question, 'subjectId'> {
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

function generateLineEquationQuestion(difficulty: Difficulty['id']): Omit<Question, 'subjectId'> {
    let p1: Point, p2: Point, m: number, b: number;
    let range = 8;
    if (difficulty === 'medium') range = 12;
    if (difficulty === 'hard') range = 15;

    do {
        p1 = { x: getRandomInt(-range, range), y: getRandomInt(-range, range) };
        p2 = { x: getRandomInt(-range, range), y: getRandomInt(-range, range) };
        
    } while (p1.x === p2.x || (p1.x === p2.x && p1.y === p2.y));

    m = (p2.y - p1.y) / (p2.x - p1.x);
    b = p1.y - m * p1.x;

    if (difficulty !== 'hard') {
        if (m % 1 !== 0 || b % 1 !== 0) {
            const new_m = getRandomInt(-4, 4);
            const new_b = getRandomInt(-10, 10);
            
            p1.x = getRandomInt(-range, range);
            p1.y = new_m * p1.x + new_b;
            
            do {
                p2.x = getRandomInt(-range, range);
            } while (p2.x === p1.x);
            p2.y = new_m * p2.x + new_b;
            
            m = new_m;
            b = new_b;
        }
    }

    return {
        type: 'FIND_LINE_EQUATION',
        question: `מצא/י את משוואת הישר (y = mx + b) העובר דרך הנקודות A(${p1.x}, ${p1.y}) ו-B(${p2.x}, ${p2.y}).`,
        points: { A: p1, B: p2 },
        solution: { m, b },
        explanation: `ראשית, יש למצוא את השיפוע (m), ולאחר מכן להציב אותו ואחת הנקודות בנוסחת הישר כדי למצוא את b.`,
        detailedExplanation: [
            `נחשב את השיפוע: m = (${p2.y} - ${p1.y}) / (${p2.x} - ${p1.x}) = ${p2.y - p1.y} / ${p2.x - p1.x} = ${m.toFixed(2)}`,
            `נציב את השיפוע ואת נקודה A במשוואת הישר y = mx + b: ${p1.y} = (${m.toFixed(2)}) * ${p1.x} + b`,
            `נפתור עבור b: ${p1.y} = ${(m * p1.x).toFixed(2)} + b  =>  b = ${b.toFixed(2)}`,
            `משוואת הישר היא: y = ${m.toFixed(2)}x + ${b.toFixed(2)}`
        ],
        difficulty,
    };
}

function generateQuadrantQuestion(difficulty: Difficulty['id']): Omit<Question, 'subjectId'> {
    let range = 10;
    if (difficulty === 'hard') range = 20;

    let x = getRandomInt(-range, range);
    let y = getRandomInt(-range, range);

    if (difficulty === 'easy' && (x === 0 || y === 0)) {
        x = x === 0 ? getRandomInt(1, range) * (Math.random() > 0.5 ? 1 : -1) : x;
        y = y === 0 ? getRandomInt(1, range) * (Math.random() > 0.5 ? 1 : -1) : y;
    }

    let solution: string;
    const options: string[] = ['רביע ראשון', 'רביע שני', 'רביע שלישי', 'רביע רביעי', 'על ציר ה-X', 'על ציר ה-Y'];

    if (x > 0 && y > 0) solution = options[0];
    else if (x < 0 && y > 0) solution = options[1];
    else if (x < 0 && y < 0) solution = options[2];
    else if (x > 0 && y < 0) solution = options[3];
    else if (y === 0 && x !== 0) solution = options[4];
    else if (x === 0 && y !== 0) solution = options[5];
    else { 
        x = getRandomInt(1, range);
        y = getRandomInt(1, range);
        solution = options[0];
    }
    
    let finalOptions : string[];
    if (difficulty === 'easy') {
        finalOptions = shuffleArray(options.slice(0, 4));
    } else {
        const distractors = options.filter(o => o !== solution);
        finalOptions = shuffleArray([solution, ...shuffleArray(distractors).slice(0, 3)]);
    }
    
    return {
        type: 'IDENTIFY_QUADRANT',
        question: `באיזה רביע או על איזה ציר נמצאת הנקודה A(${x}, ${y})?`,
        points: { A: { x, y } },
        solution: solution,
        explanation: `רביע ראשון (x>0, y>0), שני (x<0, y>0), שלישי (x<0, y<0), רביעי (x>0, y<0).`,
        detailedExplanation: [
            `שיעור ה-x של הנקודה הוא ${x}, שהוא מספר ${x > 0 ? 'חיובי' : (x < 0 ? 'שלילי' : 'אפס')}.`,
            `שיעור ה-y של הנקודה הוא ${y}, שהוא מספר ${y > 0 ? 'חיובי' : (y < 0 ? 'שלילי' : 'אפס')}.`,
            `לפיכך, הנקודה נמצאת ב: ${solution}.`
        ],
        difficulty,
        options: finalOptions,
    };
}

// --- EXISTING GENERATORS (UNCHANGED) ---
function generateAreaQuestion(difficulty: Difficulty['id']): Omit<Question, 'subjectId'> {
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

function generateIdentifyCoordinatesQuestion(difficulty: Difficulty['id']): Omit<Question, 'subjectId'> {
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


// --- ROUTER GENERATORS ---
function generateCoordinateSystemQuestion(difficulty: Difficulty['id']): Omit<Question, 'subjectId'> {
    if (difficulty === 'easy' || Math.random() < 0.5) {
        return generateIdentifyCoordinatesQuestion(difficulty);
    }
    return generateQuadrantQuestion(difficulty);
}

function generateStraightLineQuestion(difficulty: Difficulty['id']): Omit<Question, 'subjectId'> {
    if (Math.random() < 0.5) {
        return generateSlopeQuestion(difficulty);
    }
    return generateLineEquationQuestion(difficulty);
}


// --- MAIN GENERATOR ---
const generators: Record<string, (difficulty: Difficulty['id']) => Omit<Question, 'subjectId'>> = {
    [SUBJECTS.MIDPOINT.id]: generateMidpointQuestion,
    [SUBJECTS.AREA_CALC.id]: generateAreaQuestion,
    [SUBJECTS.COORDINATE_SYSTEM.id]: generateCoordinateSystemQuestion,
    [SUBJECTS.STRAIGHT_LINE.id]: generateStraightLineQuestion,
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
    const question = generator(config.difficulty) as Question;
    question.subjectId = randomSubjectId;
    return question;
}