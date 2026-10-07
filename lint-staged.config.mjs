const config = {
  "src/**/*.{js,jsx,ts,tsx}": [() => "pnpm lint", () => "pnpm typecheck"],
  "*.{js,jsx,ts,tsx,json,md,mjs,css}": "prettier --write",
};

export default config;
