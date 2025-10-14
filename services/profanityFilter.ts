const hebrewBadWords = [
  'זונה', 'שרמוטה', 'בן זונה', 'קוקסינל', 'מניאק', 'דפוק', 'מטומטם',
  'אידיוט', 'זין', 'כוס', 'זיין', 'לזיין', 'יבן', 'חרה', 'קקה', 'פיפי'
];

const englishBadWords = [
  'fuck', 'shit', 'bitch', 'cunt', 'asshole', 'dick', 'pussy',
  'bastard', 'damn', 'hell'
];

const allBadWords = [...hebrewBadWords, ...englishBadWords];

/**
 * Checks if a given username contains any profane words.
 * The check is case-insensitive.
 * @param {string} username The username to check.
 * @returns {boolean} True if the username is profane, false otherwise.
 */
export function isProfane(username) {
  if (!username) return false;
  
  const lowerCaseUsername = username.toLowerCase();

  return allBadWords.some(word => lowerCaseUsername.includes(word));
}
