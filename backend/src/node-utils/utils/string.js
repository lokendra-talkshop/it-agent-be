export const capitalizeStrings = (s) =>
  s
    .trim()
    .split(' ')
    .map((w) => w.trim())
    .map((w) => {
      if (w.length) {
        return w[0].toUpperCase() + w.substring(1);
      }
      return '';
    })
    .filter((w) => w.length > 0)
    .join(' ');

export const toOrdinal = (n) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

export const extractLeagueName = (input) => {
  const regex = /league = '([^']*)'/;
  const match = input.match(regex);
  const league = match ? match[1] : null;
  console.log(league);
  return league;
};
