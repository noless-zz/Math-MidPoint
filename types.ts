import { GoogleGenAI } from "@google/genai";

export enum View {
  Dashboard = 'Dashboard',
  Learn = 'Learn',
  Practice = 'Practice',
  Leaderboard = 'Leaderboard',
}

export interface Subject {
  id: string;
  name: string;
  enabled: boolean;
  practice: boolean;
  category: string;
}

export const SUBJECTS: Record<string, Subject> = {
  COORDINATE_SYSTEM: { id: 'coordinate_system', name: 'מערכת צירים', enabled: true, practice: true, category: 'גיאומטריה אנליטית' },
  STRAIGHT_LINE: { id: 'straight_line', name: 'הקו הישר', enabled: true, practice: true, category: 'גיאומטריה אנליטית' },
  LINE_INTERSECTION: { id: 'line_intersection', name: 'חיתוך בין ישרים', enabled: true, practice: true, category: 'גיאומטריה אנליטית' },
  PERPENDICULAR_LINES: { id: 'perpendicular_lines', name: 'ישרים מאונכים', enabled: true, practice: true, category: 'גיאומטריה אנליטית' },
  DISTANCE: { id: 'distance', name: 'מרחק בין נקודות', enabled: true, practice: true, category: 'גיאומטריה אנליטית' },
  MIDPOINT: { id: 'midpoint', name: 'אמצע קטע', enabled: true, practice: true, category: 'גיאומטריה אנליטית' },
  SIMILARITY: { id: 'similarity', name: 'דמיון משולשים (ז.ז)', enabled: true, practice: true, category: 'גיאומטריה' },
  TRIANGLE_PROPERTIES: { id: 'triangle_properties', name: 'תכונות משולש', enabled: true, practice: false, category: 'גיאומטריה אנליטית' },
  AREA_CALC: { id: 'area_calc', name: 'חישוב שטח משולש', enabled: true, practice: false, category: 'גיאומטריה אנליטית' },
  EQUATIONS_NUMERIC_DENOMINATOR: { id: 'equation_numeric_denominator', name: 'משוואות עם מכנה מספרי', enabled: true, practice: true, category: 'אלגברה' },
  QUADRATIC_EQUATIONS: { id: 'quadratic_equations', name: 'משוואות ריבועיות', enabled: true, practice: true, category: 'אלגברה' },
  EQUATIONS_WITH_VARIABLE_DENOMINATOR: { id: 'equation_variable_denominator', name: 'משוואות עם נעלם במכנה', enabled: true, practice: true, category: 'אלגברה' },
  AVERAGE_CHANGE_RATE: { id: 'avg_change_rate', name: 'קצב שינוי ממוצע', enabled: true, practice: true, category: 'חשבון דיפרנציאלי' },
  DERIVATIVES: { id: 'derivatives', name: 'נגזרות פולינומים', enabled: true, practice: true, category: 'חשבון דיפרנציאלי' },
  TANGENT: { id: 'tangent', name: 'משיק לפונקציה', enabled: true, practice: true, category: 'חשבון דיפרנציאלי' },
};


export interface Difficulty {
    id: 'easy' | 'medium' | 'hard';
    name: string;
    multiplier: number;
}

export const DIFFICULTY_LEVELS: Record<string, Difficulty> = {
    EASY: { id: 'easy', name: 'קל', multiplier: 1 },
    MEDIUM: { id: 'medium', name: 'בינוני', multiplier: 1.5 },
    HARD: { id: 'hard', name: 'קשה', multiplier: 2 },
};

export interface Point {
  x: number;
  y: number;
}

export type QuestionType = 
  'FIND_MIDPOINT' | 'FIND_ENDPOINT' | 
  'FIND_MIDPOINT_VISUAL' | 'FIND_MIDPOINT_MCQ' | 
  'FIND_ENDPOINT_MCQ' | 'IDENTIFY_COORDINATES' |
  'CALCULATE_AREA' | 'CALCULATE_SLOPE' | 
  'CALCULATE_DISTANCE' | 'FIND_PERPENDICULAR_SLOPE' |
  'FIND_INTERSECTION_POINT' | 'SOLVE_EQUATION_VARIABLE_DENOMINATOR' |
  'SOLVE_EQUATION_NUMERIC_DENOMINATOR' | 'SOLVE_QUADRATIC_EQUATION' |
  'CALCULATE_DERIVATIVE' | 'FIND_TANGENT_EQUATION' |
  'IDENTIFY_QUADRANT' | 'FIND_LINE_EQUATION' |
  'CALCULATE_SIMILARITY_RATIO' | 'FIND_MISSING_SIDE_SIMILARITY' |
  'CALCULATE_AVG_RATE';

export interface LineEquation {
    m: number;
    b: number;
    text: string;
}

export interface EquationFraction {
    type: 'fraction';
    numerator: string;
    denominator: string;
}
export interface EquationOperator {
    type: 'operator';
    value: string; // '+', '-', '='
}
export interface EquationTerm {
    type: 'term';
    value: string;
}

export type EquationPart = EquationFraction | EquationOperator | EquationTerm;

export interface EquationSolution {
  value: number[] | null; // null for "no solution"
  domain: number[]; // e.g., if x != 2 and x != -3, domain will be [2, -3]
}

export interface LineEquationSolution {
    m: number;
    b: number;
}

export interface Question {
  type: QuestionType;
  question: string;
  points?: { A?: Point; B?: Point; C?: Point; M?: Point };
  lines?: LineEquation[];
  equationParts?: EquationPart[];
  solution: Point | number | EquationSolution | LineEquationSolution | string;
  explanation: string; 
  detailedExplanation: string[]; 
  difficulty: Difficulty['id'];
  options?: (Point | number | string)[];
  subjectId: string;
}

export type AiInstance = GoogleGenAI;