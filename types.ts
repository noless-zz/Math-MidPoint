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
  TRIANGLE_PROPERTIES: { id: 'triangle_properties', name: 'תכונות משולש', enabled: true, practice: false, category: 'גיאומטריה אנליטית' },
  AREA_CALC: { id: 'area_calc', name: 'חישוב שטח משולש', enabled: true, practice: false, category: 'גיאומטריה אנליטית' },
  EQUATIONS_WITH_VARIABLE_DENOMINATOR: { id: 'equations_with_variable_denominator', name: 'משוואות עם נעלם במכנה', enabled: true, practice: false, category: 'אלגברה' },
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
  'FIND_INTERSECTION_POINT';

export interface LineEquation {
    m: number;
    b: number;
    text: string;
}

export interface Question {
  type: QuestionType;
  question: string;
  points?: { A?: Point; B?: Point; C?: Point; M?: Point };
  lines?: LineEquation[];
  solution: Point | number;
  explanation: string;
  difficulty: Difficulty['id'];
  options?: (Point | number)[];
}

// This type can be expanded to include other AI models if needed
export type AiInstance = GoogleGenAI;