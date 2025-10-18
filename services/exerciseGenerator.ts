import { Point, Question, QuestionType, Difficulty, SUBJECTS } from '../types.ts';

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


function generateMidpointVisualQuestion(difficulty: Difficulty['id']): Question {
    let range = 10;
    if (difficulty === 'easy') range = 6;
    if (difficulty === 'hard') range = 12;

    const pointA = { x: getRandomInt(-range, range), y: getRandomInt(-range, range) };
    const pointB = { x: getRandomInt(-range, range), y: getRandomInt(-range, range) };
    // Ensure integer midpoint
    if ((pointA.x + pointB.x) % 2 !== 0) pointB.x = Math.min(range, Math.max(-range, pointB.x + 1));
    if ((pointA.y + pointB.y) % 2 !== 0) pointB.y = Math.min(range, Math.max(-range, pointB.y + 1));


    const midpoint = {
        x: (pointA.x + pointB.x) / 2,
        y: (pointA.y + pointB.y) / 2,
    };

    return {
        type: 'FIND_MIDPOINT_VISUAL',
        question: `זהו את נקודת האמצע M של הקטע AB באמצעות לחיצה על מיקומה בגרף.`,
        points: { A: pointA, B: pointB },
        solution: midpoint,
        explanation: `x_M = (x_A + x_B)/2 = (${pointA.x}+${pointB.x})/2 = ${midpoint.x}. y_M = (y_A + y_B)/2 = (${pointA.y}+${pointB.y})/2 = ${midpoint.y}.`,
        difficulty,
    };
}

function generateMidpointTextQuestion(difficulty: Difficulty['id'], isMCQ: boolean): Question {
    let range = 10;
    if (difficulty === 'easy') range = 5;
    if (difficulty === 'hard') range = 20;

    const createPoint = () => ({
        x: getRandomInt(-range, range),
        y: getRandomInt(-range, range),
    });

    const isEndpointQuestion = (difficulty === 'hard' && Math.random() > 0.4) || (difficulty === 'medium' && Math.random() > 0.6);
    
    if (isEndpointQuestion) {
        const pointA = createPoint();
        const midpoint = createPoint();
        const pointB = {
            x: 2 * midpoint.x - pointA.x,
            y: 2 * midpoint.y - pointA.y,
        };

        let options: Point[] | undefined = undefined;
        if (isMCQ) {
            const distractors: Point[] = [];
            const solutionKey = `${pointB.x},${pointB.y}`;
            const used = new Set<string>([solutionKey]);
            const add = (p:Point) => { if(!used.has(`${p.x},${p.y}`)) { distractors.push(p); used.add(`${p.x},${p.y}`); }};
            
            add({ x: 2 * midpoint.x + pointA.x, y: 2 * midpoint.y + pointA.y }); // common mistake
            add({ x: midpoint.x, y:pointB.y});
            add({ x: pointB.x, y:midpoint.y});

            while(distractors.length < 3) {
                 add({ x: pointB.x + getRandomInt(-3,3), y: pointB.y + getRandomInt(-3,3)});
            }
            options = shuffleArray([pointB, ...distractors]);
        }

        return {
            type: isMCQ ? 'FIND_ENDPOINT_MCQ' : 'FIND_ENDPOINT',
            question: `נתונה הנקודה A(${pointA.x}, ${pointA.y}). הנקודה M(${midpoint.x}, ${midpoint.y}) היא אמצע הקטע AB. מצאו את שיעורי הנקודה B.`,
            points: { A: pointA, M: midpoint },
            solution: pointB,
            explanation: `x_B = 2*x_M - x_A = 2*${midpoint.x} - ${pointA.x} = ${pointB.x}. y_B = 2*y_M - y_A = 2*${midpoint.y} - ${pointA.y} = ${pointB.y}.`,
            difficulty,
            options,
        };

    } else { // FIND_MIDPOINT
        const pointA = createPoint();
        const pointB = createPoint();
        // Ensure integer midpoint
        if ((pointA.x + pointB.x) % 2 !== 0) pointB.x = Math.min(range, Math.max(-range, pointB.x + 1));
        if ((pointA.y + pointB.y) % 2 !== 0) pointB.y = Math.min(range, Math.max(-range, pointB.y + 1));


        const midpoint = {
            x: (pointA.x + pointB.x) / 2,
            y: (pointA.y + pointB.y) / 2,
        };
        
        let options: Point[] | undefined = undefined;
        if (isMCQ) {
            const distractors: Point[] = [];
            const solutionKey = `${midpoint.x},${midpoint.y}`;
            const used = new Set<string>([solutionKey]);
            const add = (p:Point) => { if(!used.has(`${p.x},${p.y}`)) { distractors.push(p); used.add(`${p.x},${p.y}`); }};

            add({ x: midpoint.y, y: midpoint.x }); // Swapped
            add({ x: -midpoint.x, y: midpoint.y });
            add({ x: midpoint.x, y: -midpoint.y });

            while(distractors.length < 3) {
                 add({ x: midpoint.x + getRandomInt(-2,2), y: midpoint.y + getRandomInt(-2,2)});
            }
            options = shuffleArray([midpoint, ...distractors]);
        }


        return {
            type: isMCQ ? 'FIND_MIDPOINT_MCQ' : 'FIND_MIDPOINT',
            question: `מצאו את שיעורי נקודת האמצע M של הקטע AB, כאשר A(${pointA.x}, ${pointA.y}) ו-B(${pointB.x}, ${pointB.y}).`,
            points: { A: pointA, B: pointB },
            solution: midpoint,
            explanation: `x_M = (x_A + x_B)/2 = (${pointA.x}+${pointB.x})/2 = ${midpoint.x}. y_M = (y_A + y_B)/2 = (${pointA.y}+${pointB.y})/2 = ${midpoint.y}.`,
            difficulty,
            options,
        };
    }
}


function generateMidpointQuestion(difficulty: Difficulty['id']): Question {
    const rand = Math.random();

    if (difficulty === 'easy') {
        if (rand < 0.5) return generateMidpointVisualQuestion(difficulty);
        return generateMidpointTextQuestion(difficulty, true); // MCQ
    }
    if (difficulty === 'medium') {
        if (rand < 0.25) return generateMidpointVisualQuestion(difficulty);
        if (rand < 0.75) return generateMidpointTextQuestion(difficulty, true); // MCQ
        return generateMidpointTextQuestion(difficulty, false); // Calculation
    }
    // Hard
    if (rand < 0.3) return generateMidpointTextQuestion(difficulty, true); // Complex MCQ
    return generateMidpointTextQuestion(difficulty, false); // Mostly calculation, higher chance of endpoint
}

function generateAreaQuestion(difficulty: Difficulty['id']): Question {
    let range = 10;
    if (difficulty === 'easy') range = 5;
    if (difficulty === 'hard') range = 15;

    let p1: Point, p2: Point, p3: Point, area: number;

    // Shoelace formula for area
    const calculateArea = (p1: Point, p2: Point, p3: Point) => 
        0.5 * Math.abs(p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y));

    if (difficulty === 'easy') {
        // Create a triangle with a horizontal or vertical base
        p1 = { x: getRandomInt(-range, range), y: getRandomInt(-range, range) };
        if (Math.random() > 0.5) { // Horizontal base
            p2 = { x: getRandomInt(-range, range), y: p1.y };
            p3 = { x: getRandomInt(-range, range), y: getRandomInt(-range, range) };
        } else { // Vertical base
            p2 = { x: p1.x, y: getRandomInt(-range, range) };
            p3 = { x: getRandomInt(-range, range), y: getRandomInt(-range, range) };
        }
    } else {
        // Create a rotated triangle, ensuring a non-zero, integer area
        do {
            p1 = { x: getRandomInt(-range, range), y: getRandomInt(-range, range) };
            p2 = { x: getRandomInt(-range, range), y: getRandomInt(-range, range) };
            p3 = { x: getRandomInt(-range, range), y: getRandomInt(-range, range) };
            area = calculateArea(p1, p2, p3);
        } while (area === 0 || area % 1 !== 0);
    }
    
    area = calculateArea(p1, p2, p3);

    return {
        type: 'CALCULATE_AREA',
        question: `במערכת הצירים נתון משולש ABC שקודקודיו הם A(${p1.x},${p1.y}), B(${p2.x},${p2.y}) ו-C(${p3.x},${p3.y}). חשבו את שטח המשולש.`,
        points: { A: p1, B: p2, C: p3 },
        solution: area,
        explanation: `ניתן לחשב את שטח המשולש באמצעות נוסחת השרוכים (Shoelace formula) או על ידי חישוב אורך בסיס וגובה. התשובה היא ${area}.`,
        difficulty,
    };
}

function generateCoordinateSystemQuestion(difficulty: Difficulty['id']): Question {
    let range = 12;
    let numPoints = 1;
    if (difficulty === 'easy') {
        range = 8;
        numPoints = getRandomInt(1, 2);
    }
    if (difficulty === 'medium') {
        range = 10;
        // FIX: Capped max points to 3 to align with the Question type definition, which only allows points A, B, C.
        numPoints = getRandomInt(2, 3);
    }
    if (difficulty === 'hard') {
        range = 15;
        // FIX: Capped max points to 3 to align with the Question type definition.
        numPoints = 3;
    }

    const points: { [key: string]: Point } = {};
    const pointNames: string[] = [];
    const usedCoords = new Set<string>();

    for (let i = 0; i < numPoints; i++) {
        const pointName = String.fromCharCode(65 + i); // A, B, C...
        let p: Point;
        do {
            p = { x: getRandomInt(-range, range), y: getRandomInt(-range, range) };
        } while (usedCoords.has(`${p.x},${p.y}`));
        
        usedCoords.add(`${p.x},${p.y}`);
        points[pointName] = p;
        pointNames.push(pointName);
    }

    const targetPointName = pointNames[Math.floor(Math.random() * pointNames.length)];
    const solution = points[targetPointName];

    return {
        type: 'IDENTIFY_COORDINATES',
        question: `מהם שיעורי הנקודה ${targetPointName} המוצגת על מערכת הצירים?`,
        // FIX: The `points` object is cast to the expected type. The generator logic ensures
        // 'A' is always present and no points beyond 'C' are created, conforming to the Question interface.
        points: points as { A: Point; B?: Point; C?: Point; },
        solution,
        explanation: `כדי למצוא את שיעורי הנקודה ${targetPointName}, יש להסתכל על מיקומה ביחס לצירים. שיעור ה-x הוא המרחק האופקי מהראשית, ושיעור ה-y הוא המרחק האנכי. במקרה זה, הנקודה היא (${solution.x},${solution.y}).`,
        difficulty,
    };
}


const generators = {
    [SUBJECTS.MIDPOINT.id]: generateMidpointQuestion,
    [SUBJECTS.AREA_CALC.id]: generateAreaQuestion,
    [SUBJECTS.COORDINATE_SYSTEM.id]: generateCoordinateSystemQuestion,
};

export function generateQuestion(config: { subjects: string[]; difficulty: Difficulty['id'] }): Question {
    const availableGenerators = config.subjects.filter(id => generators[id]);
    const randomSubjectId = availableGenerators[Math.floor(Math.random() * availableGenerators.length)];
    const generator = generators[randomSubjectId];
    return generator(config.difficulty);
}