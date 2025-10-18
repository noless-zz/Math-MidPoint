/**
 * @typedef {Object} Point
 * @property {number} x
 * @property {number} y
 */

/**
 * @typedef {Object} User
 * @property {string} uid
 * @property {string | null} email
 * @property {string} username
 * @property {number} score
 * @property {number} completedExercises
 * @property {boolean} [isGuest]
 * @property {boolean} [emailVerified]
 */

export const QuestionType = {
  FindMidpoint: 'FIND_MIDPOINT',
  FindEndpoint: 'FIND_ENDPOINT',
};

export const AnswerFormat = {
  MultipleChoice: 'MULTIPLE_CHOICE',
  Graphical: 'GRAPHICAL',
  TextInput: 'TEXT_INPUT',
};

export const SUBJECTS = {
  MIDPOINT: { id: 'MIDPOINT', name: 'אמצע קטע', enabled: true },
  DISTANCE: { id: 'DISTANCE', name: 'מרחק בין שתי נקודות', enabled: false },
  LINE_EQUATION: { id: 'LINE_EQUATION', name: 'משוואת הקו הישר', enabled: false },
  INTERSECTION: { id: 'INTERSECTION', name: 'נקודות חיתוך', enabled: false },
  PARALLEL_PERPENDICULAR: { id: 'PARALLEL_PERPENDICULAR', name: 'ישרים מקבילים ומאונכים', enabled: false },
  TRIANGLE_PROPERTIES: { id: 'TRIANGLE_PROPERTIES', name: 'תכונות משולש (תיכון, גובה וכו\')', enabled: false },
};

export const DIFFICULTY_LEVELS = {
  EASY: { id: 'EASY', name: 'קל', multiplier: 1 },
  MEDIUM: { id: 'MEDIUM', name: 'בינוני', multiplier: 1.5 },
  HARD: { id: 'HARD', name: 'קשה', multiplier: 2 },
};


/**
 * @typedef {Object} Question
 * @property {QuestionType} type
 * @property {{ A: Point; B?: Point; M?: Point; }} points
 * @property {Point} answer
 * @property {AnswerFormat} answerFormat
 * @property {Point[]} [options]
 */

export const View = {
    Dashboard: 'DASHBOARD',
    Learn: 'LEARN',
    Practice: 'PRACTICE',
    Leaderboard: 'LEADERBOARD'
};