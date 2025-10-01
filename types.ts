
export interface Point {
  x: number;
  y: number;
}

export interface User {
  name: string;
  score: number;
  completedExercises: number;
}

export enum QuestionType {
  FindMidpoint = 'FIND_MIDPOINT',
  FindEndpoint = 'FIND_ENDPOINT',
}

export enum AnswerFormat {
  MultipleChoice = 'MULTIPLE_CHOICE',
  Graphical = 'GRAPHICAL',
  TextInput = 'TEXT_INPUT',
}

export interface Question {
  type: QuestionType;
  points: {
    A: Point;
    B?: Point;
    M?: Point;
  };
  answer: Point;
  answerFormat: AnswerFormat;
  options?: Point[];
}

export enum View {
    Dashboard = 'DASHBOARD',
    Learn = 'LEARN',
    Practice = 'PRACTICE',
    Leaderboard = 'LEADERBOARD'
}
