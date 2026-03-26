# Repository Guidelines

## Project Structure & Module Organization
- `plotline.js` holds the primary source code. Keep related helpers in this file unless the project grows.
- No dedicated `tests/` or `assets/` directories are present yet; introduce them if you add tests or static files.

## Build, Test, and Development Commands
- There are currently no build or test scripts in this repository. If you add tooling, document it here with examples, e.g.:
  - `node plotline.js` — run the main script locally.
  - `npm test` — run the test suite (once added).

## Coding Style & Naming Conventions
- Use consistent 2-space indentation in JavaScript files.
- Prefer `camelCase` for variables and functions, `PascalCase` for classes, and `UPPER_SNAKE_CASE` for constants.
- Keep file names lower-case with hyphens if new modules are added (e.g., `data-loader.js`).
- If you introduce a formatter or linter (e.g., ESLint/Prettier), run it before committing and document the config here.

## Testing Guidelines
- No testing framework is configured. If you add one (e.g., Jest, Mocha), include:
  - Test location (e.g., `tests/` or `__tests__/`).
  - Naming pattern (e.g., `*.test.js`).
  - How to run it (e.g., `npm test`).

## Commit & Pull Request Guidelines
- Commit message conventions are not established. Use clear, imperative messages such as `Add input validation` or `Fix plot parsing`.
- Pull requests should include:
  - A short summary of changes.
  - Any relevant context or linked issues.
  - Example output or screenshots if behavior changes.

## Configuration & Security Notes
- Avoid committing secrets or local environment files. If configuration becomes necessary, prefer a documented `.env.example`.
- Keep runtime assumptions explicit (Node.js version, required environment variables) as the project evolves.
