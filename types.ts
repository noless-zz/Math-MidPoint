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
