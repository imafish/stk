# Contributor Guide

Thanks for contributing to STK.

This guide explains expected workflow, coding standards, and test requirements.

## Development Workflow

1. Create a feature branch.
2. Implement your change in `src/`.
3. Add/update tests in `tests/unit` and `tests/integration` as needed.
4. Run build and tests.
5. Open a pull request with clear summary and scope.

## Setup

```bash
npm install
npm run build
```

Load the extension from `dist/` in `chrome://extensions` for manual validation.

## Required Checks Before PR

Run:

```bash
npm test
npm run build
```

When change affects cross-module flows, also run:

```bash
npm run test:integration
```

## Coding Conventions

- Keep shared message/storage constants centralized in `src/common/*`.
- Prefer explicit TypeScript types for message payloads and settings objects.
- Keep background/content/popup boundaries clear.
- Inject content scripts on demand through `chrome.scripting`.

## Testing Expectations

- Add tests for every behavior change.
- Cover happy paths and failure/edge paths.
- Avoid real network calls in unit tests; mock external boundaries.
- Keep tests aligned with current logic; remove stale assertions.

See instruction files:

- `.github/instructions/tests.instructions.md`
- `.github/instructions/tests-robustness.instructions.md`

## Documentation Expectations

When behavior changes, update docs in the same PR:

- `README.md`
- `docs/*.md` files impacted by your change

Keep docs accurate to current code and remove obsolete instructions.

## Suggested PR Template Content

Include:

- What changed
- Why it changed
- Tests added/updated
- Manual validation steps
- Any known limitations

## Areas to Improve

Current code is functional and packaged, with room for enhancement in:

- richer integration test coverage for full capture-to-download/send paths
- site-specific extraction quality tuning
- improved option validation and user-facing diagnostics
