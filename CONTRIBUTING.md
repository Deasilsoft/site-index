# Contributing

This document explains how to contribute to `site-index`.

By participating, you agree to follow the [Code of Conduct](CODE-OF-CONDUCT.md).

## Workflow

Use a simple flow: **Issue → PR to `main`**.

1. Open or discuss an issue before non-trivial changes.
2. Create a focused branch or fork.
3. Open a PR to `main` and link the issue.

Small fixes do not require an issue. Discuss larger changes before
implementation.

## Local setup and checks

Requirements:

- Node.js >= 22

Run the same checks as CI, in this order:

```bash
npm ci
npm run format:check
npm run lint
npm run typecheck
npm run knip
npm test
npm run build
```

If you experience dependency install issues:

```bash
npm run clean:install
```

Do not commit generated dependency changes unless they are intentional.

## Code expectations

- Prefer minimal, intentional solutions over broad refactors.
- Keep behavior deterministic and file-based.
- Keep package and domain boundaries explicit.
- Keep package READMEs accurate when package behavior or public APIs change.
- Use clear names, small functions, and explicit interfaces.
- Remove meaningful duplication without over-generalizing.
- Add abstractions only when they solve recurring problems.
- Add or update tests for behavior changes, including key edge cases.
- Keep tests readable and focused on outcomes.

## Commit style

Use concise, conventional commit-style messages where practical:

```text
feat: add Vite serve plugin
fix: preserve runtime snapshot on rebuild failure
docs: add contributing guide
```

## Pull requests

GitHub auto-loads the PR checklist from `.github/pull_request_template.md`.
Complete that template when opening or updating a PR.

PRs should be focused, include relevant tests, and avoid unrelated formatting or
refactors unless explicitly discussed.

## Security and sensitive reports

Report vulnerabilities, private data exposure, or other security-sensitive
issues according to the [Security Policy](SECURITY.md).

## Review focus

Maintainers review for correctness, simplicity, test quality, and alignment with
project expectations.
