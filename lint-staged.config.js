export default {
  '*.{js,jsx,ts,tsx}': ['eslint --max-warnings=0 --no-warn-ignored --fix', 'prettier --write'],
  '*.{json,md,css,scss,html}': ['prettier --write'],
};
