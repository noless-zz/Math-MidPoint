import { View } from '../types.ts';

// --- CORE DESIGN TOKENS ---

const colors = {
  primary: {
    light: 'indigo-500',
    DEFAULT: 'indigo-600',
    dark: 'indigo-700',
  },
  background: {
    light: 'gray-100',
    dark: 'gray-900',
  },
  surface: {
    light: 'white',
    dark: 'gray-800',
  },
  text: {
    light: 'gray-900',
    dark: 'gray-100',
    muted: {
      light: 'gray-600',
      dark: 'gray-400',
    },
    onPrimary: 'white',
    onPrimaryMuted: 'gray-300',
  },
  accent: {
    blue: 'blue-500',
    teal: 'teal-500',
    purple: 'purple-500',
    yellow: 'yellow-500',
    green: 'green-500',
    orange: 'orange-500',
    pink: 'pink-500',
    red: 'red-500',
  },
  feedback: {
    success: {
      bg: 'green-100 dark:bg-green-900/50',
      text: 'green-800 dark:text-green-200',
    },
    error: {
      bg: 'red-100 dark:bg-red-900/50',
      text: 'red-800 dark:text-red-200',
      border: 'border-red-400',
    },
    warning: {
       bg: 'yellow-50 dark:bg-yellow-900/50',
       text: 'yellow-800 dark:text-yellow-200',
       border: 'border-yellow-400',
    }
  },
};

const typography = {
  fontFamily: 'font-sans',
  baseText: `text-base ${colors.text.light} dark:${colors.text.dark}`,
  pageTitle: 'text-4xl font-bold text-center mb-8',
  sectionTitle: 'text-2xl sm:text-3xl font-bold mb-4',
  cardTitle: 'text-xl font-bold',
};

const layout = {
  mainContainer: 'p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto',
  card: 'bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-lg',
  standard: 'max-w-4xl mx-auto',
  leaderboard: 'max-w-2xl mx-auto',
};

const effects = {
  shadow: 'shadow-lg',
  shadowMd: 'shadow-md',
  shadowXl: 'shadow-xl',
  transition: 'transition-all',
  transformHover: 'transform hover:scale-105',
};

const components = {
  button: {
    base: 'py-3 px-4 rounded-lg font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
    primary: `text-white bg-${colors.primary.DEFAULT} hover:bg-${colors.primary.dark} focus:ring-${colors.primary.DEFAULT}`,
    secondary: `bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 focus:ring-gray-500`,
    disabled: 'disabled:bg-gray-400 disabled:cursor-not-allowed',
  },
  input: {
    base: 'block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm',
  },
};

// Point Colors for Exercises
const pointColors = {
  A: { text: `text-${colors.accent.blue}`, fill: `fill-${colors.accent.blue}` },
  B: { text: `text-${colors.accent.orange}`, fill: `fill-${colors.accent.orange}` },
  C: { text: `text-${colors.accent.green}`, fill: `fill-${colors.accent.green}` },
  M: { text: `text-${colors.accent.pink}`, fill: `fill-${colors.accent.pink}` },
  X: { text: `text-teal-600 dark:text-teal-400`, border: `border-teal-400`, bg: `bg-teal-50 dark:bg-teal-900/50`},
  Y: { text: `text-purple-600 dark:text-purple-400`, border: `border-purple-400`, bg: `bg-purple-50 dark:bg-purple-900/50`},
};


// --- EXPORTED DESIGN OBJECT ---

export const design = {
  colors,
  typography,
  layout,
  effects,
  components,
  pointColors,
  
  // Specific Component Styles
  header: {
    background: `bg-${colors.primary.DEFAULT} dark:bg-gray-800 ${effects.shadowMd}`,
    navButton: (currentView: View, buttonView: View) => `px-3 py-2 rounded-md text-sm font-medium ${effects.transition} ${
        currentView === buttonView
        ? `bg-${colors.primary.dark} ${colors.text.onPrimary}`
        : `${colors.text.onPrimaryMuted} hover:bg-${colors.primary.light} hover:${colors.text.onPrimary}`
    }`,
     mobileNavButton: (currentView: View, buttonView: View) => `flex flex-col items-center justify-center p-2 rounded-md w-1/4 text-xs font-medium ${effects.transition} ${
        currentView === buttonView
        ? `bg-indigo-800 ${colors.text.onPrimary}`
        : `${colors.text.onPrimaryMuted} hover:bg-${colors.primary.light} hover:${colors.text.onPrimary}`
    }`,
  },

  practice: {
    baseCard: `${layout.card} p-6`,
    attemptsCounter: 'text-lg font-bold text-indigo-500',
    visualFormulaBox: {
      base: 'flex-1 p-4 border-2 rounded-lg space-y-3',
      x: `${pointColors.X.border} ${pointColors.X.bg}`,
      y: `${pointColors.Y.border} ${pointColors.Y.bg}`,
      xText: `${pointColors.X.text.replace('text-', 'text-').replace('-600', '-800').replace('-400', '-200')} font-bold text-center`,
      yText: `${pointColors.Y.text.replace('text-', 'text-').replace('-600', '-800').replace('-400', '-200')} font-bold text-center`,
    },
    mcqButton: `p-4 rounded-lg ${effects.transition} bg-gray-100 dark:bg-gray-700 hover:bg-indigo-100 dark:hover:bg-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-70`,
    feedbackCard: (isCorrect: boolean) => `p-6 rounded-2xl ${effects.shadow} ${isCorrect ? colors.feedback.success.bg : colors.feedback.error.bg}`,
  },
  
  learn: {
      subjectSelector: {
        base: `p-6 rounded-lg ${effects.shadowMd} text-center ${effects.transition} ${effects.transformHover}`,
        enabled: `bg-white dark:bg-gray-800 cursor-pointer hover:${effects.shadowXl}`,
        disabled: 'bg-gray-200 dark:bg-gray-700 opacity-60 cursor-not-allowed',
      },
      contentPage: `${layout.card} max-w-4xl mx-auto`,
      section: 'space-y-4 text-gray-700 dark:text-gray-300 leading-relaxed',
      example: 'bg-gray-50 dark:bg-gray-900/50 p-6 rounded-lg border-r-4 border-teal-500',
      formula: 'bg-indigo-50 dark:bg-indigo-900/50 border-r-4 border-indigo-500 p-6 rounded-lg',
      importantNote: `p-4 ${colors.feedback.warning.bg} border-r-4 ${colors.feedback.warning.border} rounded-lg ${colors.feedback.warning.text}`
  },
  
  auth: {
      card: `w-full max-w-md ${layout.card.replace('p-6 sm:p-8', 'p-8').replace('-2xl', '').replace('-lg', '-xl')}`,
      errorBox: `${colors.feedback.error.bg} border ${colors.feedback.error.border} text-red-700 px-4 py-3 rounded-lg relative mb-6`,
  },
  
  leaderboard: {
      row: (isCurrentUser: boolean) => `flex items-center p-4 rounded-lg ${effects.transition} ${isCurrentUser ? 'bg-indigo-100 dark:bg-indigo-900/50 border-2 border-indigo-500' : 'bg-white dark:bg-gray-800'}`
  }
};
