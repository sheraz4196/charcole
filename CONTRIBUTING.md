# Contributing to Charcole

First of all — thank you. Charcole exists because developers like you care enough to improve it.

This guide covers everything you need to know before making your first contribution. Read it once and you'll have no surprises.

---

## Table of Contents

- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Branch Naming](#branch-naming)
- [Commit Messages](#commit-messages)
- [Code Style](#code-style)
- [Running Tests](#running-tests)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [What Happens After You Submit](#what-happens-after-you-submit)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

---

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm (comes with Node.js)
- Git

### Setup

```bash
# 1. Fork the repository on GitHub
# Go to https://github.com/sheraz4196/charcole and click Fork

# 2. Clone your fork
git clone https://github.com/YOUR-USERNAME/charcole.git
cd charcole

# 3. Install dependencies (this also sets up Husky hooks automatically)
npm install

# 4. Verify everything works
npm run test:run
```

After `npm install`, Husky hooks are active on your local repo. Your commits and pushes will be automatically validated.

---

## Project Structure

```
charcole/
├── bin/
│   ├── index.js          ← CLI entry point — the prompts and generation logic
│   └── lib/
│       ├── templateHandler.js
│       └── pkgManager.js
├── template/
│   ├── js/               ← JavaScript scaffolding template
│   └── ts/               ← TypeScript scaffolding template
├── packages/
│   ├── swagger/          ← @charcoles/swagger standalone npm package
│   └── payments/         ← @charcoles/payments standalone npm package
├── CONTRIBUTING.md       ← you are here
├── CHANGELOG.md          ← version history
└── package.json
```

**Important rules for contributors:**

- Changes to `bin/` affect the CLI experience for all users — test thoroughly
- Changes to `template/` affect every project generated after your change — test by generating a real project
- Changes to `packages/` are for the standalone npm packages — run that package's tests specifically
- Never add files directly to `template/` that don't belong in a generated project — the template is copied verbatim

---

## Branch Naming

Every branch must follow this naming convention. Husky will reject commits on branches that don't match.

### Format

```
type/short-description
```

Use hyphens, not underscores or spaces. Keep it short and descriptive.

### Allowed types

| Type        | When to use                                |
| ----------- | ------------------------------------------ |
| `feat/`     | You're adding a new feature                |
| `fix/`      | You're fixing a bug                        |
| `chore/`    | Maintenance: deps, config, cleanup         |
| `docs/`     | Documentation only changes                 |
| `test/`     | Adding or fixing tests                     |
| `refactor/` | Code restructuring, no behavior change     |
| `hotfix/`   | Urgent fix for a critical production issue |
| `release/`  | Version bump and release preparation       |
| `perf/`     | Performance improvements                   |
| `ci/`       | Changes to GitHub Actions workflows        |
| `build/`    | Build tooling changes                      |

### Reserved branches

| Branch    | Purpose                                              |
| --------- | ---------------------------------------------------- |
| `main`    | Production-ready code only. Never commit directly.   |
| `develop` | Integration branch (if used). PRs target this first. |

### Examples

```bash
# Good branch names
git checkout -b feat/add-database-module
git checkout -b fix/cli-windows-path-bug
git checkout -b chore/bump-stripe-v15
git checkout -b docs/improve-payments-guide
git checkout -b test/add-webhook-edge-cases
git checkout -b refactor/simplify-adapter-factory

# Bad branch names (these will be rejected)
git checkout -b my-branch          ← no type prefix
git checkout -b Feature/payments   ← type is capitalized
git checkout -b fix_the_bug        ← uses underscore not hyphen
git checkout -b update             ← no type, too vague
git checkout -b sheraz/payments    ← name-based, not type-based
```

### How to rename a branch if you got it wrong

```bash
# Rename your current branch
git branch -m feat/correct-name

# Or rename a specific branch
git branch -m old-name feat/correct-name
```

---

## Commit Messages

Charcole uses [Conventional Commits](https://www.conventionalcommits.org/). commitlint enforces this automatically — if your message doesn't match, the commit is rejected with a clear error explaining what's wrong.

### Format

```
type(scope): subject

body (optional)

footer (optional)
```

### Types

| Type       | When to use                                    |
| ---------- | ---------------------------------------------- |
| `feat`     | New feature added                              |
| `fix`      | Bug fixed                                      |
| `docs`     | Documentation only                             |
| `chore`    | Maintenance, deps, config — no production code |
| `test`     | Tests added or fixed                           |
| `refactor` | Code restructured, no behavior change          |
| `perf`     | Performance improved                           |
| `ci`       | CI/CD pipeline changes                         |
| `build`    | Build system changes                           |
| `revert`   | Reverts a previous commit                      |

### Scopes (optional but encouraged)

Scopes tell reviewers which part of the project changed:

| Scope      | Area                             |
| ---------- | -------------------------------- |
| `cli`      | `bin/index.js` or `bin/lib/`     |
| `template` | `template/js/` or `template/ts/` |
| `payments` | `packages/payments/`             |
| `swagger`  | `packages/swagger/`              |
| `auth`     | Auth module                      |
| `deps`     | Dependency updates               |
| `ci`       | GitHub Actions workflows         |
| `docs`     | Documentation files              |
| `tests`    | Test files                       |
| `release`  | Version bump and release prep    |

### Rules

- **Type is required** — you cannot commit without one
- **Type must be lowercase** — `feat` not `Feat` or `FEAT`
- **Subject must be lowercase** — `fix: resolve the bug` not `fix: Resolve the bug`
- **Subject must not end with a period** — `fix: resolve bug` not `fix: resolve bug.`
- **Subject must be at least 10 characters** — `fix: wip` is rejected
- **Subject must be at most 72 characters**
- **If you provide a scope, it must be lowercase** — `feat(cli)` not `feat(CLI)`

### Good commit messages

```
feat(payments): add lemonsqueezy adapter for regional payment support
fix(cli): resolve template copy failure on windows path separators
docs: add variantid requirement to lemonsqueezy provider guide
chore(deps): bump stripe from v14.1.0 to v14.2.0
test(payments): add webhook signature verification edge cases
refactor(template): simplify conditional route loading with early return
ci: add weekly maintenance workflow for automated dependency updates
perf(payments): cache adapter instance on first initialization
revert: revert "feat(payments): add currency conversion"
```

### Bad commit messages (and why they fail)

```
Fixed the bug              ← no type prefix
Feat: add payments         ← type is capitalized
feat: fix                  ← subject too short (less than 10 chars)
feat: Added the payment module.  ← capitalized subject, ends with period
WIP                        ← not a valid type, too short
update stuff               ← no type, vague
```

### Writing a good commit body (optional but valued)

When your change is non-obvious, add a body explaining **why** — not what (the diff shows what):

```
fix(cli): resolve template copy failure on windows path separators

On Windows, path.join() uses backslashes which caused the existsSync
check to fail when comparing against forward-slash template paths.
Replaced string concatenation with path.join() throughout templateHandler.

Closes #47
```

### Breaking changes

If your change breaks the public API, add `BREAKING CHANGE:` in the footer:

```
feat(payments): change setupPayments() options shape

BREAKING CHANGE: The `apiKey` option has been renamed to `lemonSqueezyApiKey`
to be consistent with the Stripe option naming convention. Update your
setupPayments() call to use the new option name.
```

---

## Code Style

Charcole has a consistent code style across all files. Match it exactly.

### JavaScript template files (`template/js/`, `bin/`, `packages/*/`)

- **No semicolons** at the end of lines
- **2 space indentation**
- **Single quotes** for strings
- **ES modules** — `import`/`export`, never `require()`/`module.exports`
- **`async/await`** — never `.then()` or `.catch()` chains
- **Arrow functions** for callbacks, regular functions for named exports
- **No `console.log`** in source files — use the `logger` utility from `src/utils/logger.js`

### TypeScript template files (`template/ts/`, `packages/payments/src/index.d.ts`)

- **Semicolons** at end of statements (opposite of JS)
- **2 space indentation**
- **Single quotes**
- **No `any`** — use `unknown` and narrow it, or define a proper type
- **Explicit return types** on exported functions
- **`readonly`** on interface properties where mutation isn't intended

### Naming conventions

| Thing            | Convention                  | Example               |
| ---------------- | --------------------------- | --------------------- |
| Variables        | camelCase                   | `paymentResult`       |
| Functions        | camelCase                   | `createPayment`       |
| Classes          | PascalCase                  | `StripeAdapter`       |
| Interfaces/Types | PascalCase                  | `PaymentAdapter`      |
| Constants        | UPPER_CASE                  | `PAYMENT_PROVIDER`    |
| Files            | kebab-case or dot.separated | `payments.service.js` |

### Import order

Group imports in this order, separated by a blank line:

```js
// 1. Node.js built-ins
import { createHmac } from "crypto";
import { existsSync } from "fs";

// 2. External packages
import Stripe from "stripe";
import { z } from "zod";

// 3. Internal config and utils
import { env } from "../../config/env.js";
import { logger } from "../../utils/logger.js";

// 4. Relative imports (same module)
import { PaymentAdapter } from "./PaymentAdapter.js";
```

**All internal imports must include `.js` extension** — this is required for ES modules:

```js
import { getAdapter } from './payments.adapter.js'   ✅
import { getAdapter } from './payments.adapter'       ❌
```

---

## Running Tests

```bash
# Run all root-level tests
npm run test:run

# Run @charcoles/payments tests
cd packages/payments && npm run test:run

# Run @charcoles/swagger tests
cd packages/swagger && npm run test:run

# Run tests in watch mode during development
npm run test
```

**Tests must pass before you push.** The `pre-push` hook enforces this automatically.

If you add a feature or fix a bug, add a test for it. PRs without tests for new behavior will be asked to add them before merging.

---

## Submitting a Pull Request

### Before you open the PR

```bash
# Make sure you're up to date with main
git fetch origin
git rebase origin/main

# Run all tests one more time
npm run test:run
cd packages/payments && npm run test:run && cd ../..
cd packages/swagger && npm run test:run && cd ../..

# Push your branch
git push origin feat/your-feature-name
```

### PR title format

PR titles follow the same Conventional Commits format as commit messages. The PR title becomes the squash merge commit message.

```
feat(payments): add database persistence for webhook events
fix(cli): handle missing .env.example on windows
docs: add migration guide for v2.x to v3.x upgrade
```

This is enforced by the `pr-title.yml` GitHub Actions workflow. PRs with non-conforming titles will fail the check.

### PR description template

When you open a PR, fill this out:

```markdown
## What this PR does

[One paragraph. What changed and why.]

## How to test it

[Steps to verify this works. Curl commands, CLI commands, whatever is appropriate.]

## Checklist

- [ ] Tests added or updated
- [ ] Passes `npm run test:run` locally
- [ ] Commit messages follow conventional commits format
- [ ] Branch name follows naming conventions
- [ ] No `console.log` left in source files
- [ ] If template files changed — tested by generating a real project
```

### What makes a good PR

- **One thing per PR** — don't combine a bug fix with a new feature and a refactor
- **Small is better** — a 50-line PR gets reviewed faster than a 500-line PR
- **Tests are included** — not "will add tests in a follow-up"
- **Description explains the why** — the diff shows the what, the description explains why

---

## What Happens After You Submit

1. GitHub Actions runs CI automatically — tests, type check, smoke test
2. If CI fails, fix it before requesting review
3. `@sheraz4196` will review the PR — usually within a few days
4. You may receive change requests — address them with new commits on the same branch
5. Once approved, it gets squash-merged into `main`
6. Your contribution appears in the next CHANGELOG entry

---

## Reporting Bugs

Open a GitHub issue at [github.com/sheraz4196/charcole/issues](https://github.com/sheraz4196/charcole/issues).

Include:

- **Node.js version** — `node --version`
- **npm version** — `npm --version`
- **Operating system**
- **What you did** — the exact command you ran
- **What you expected** — what should have happened
- **What actually happened** — the full error output

The more detail you include, the faster it gets fixed.

---

## Suggesting Features

Open a GitHub issue with the title format:

```
feat: [your feature idea in one line]
```

Explain:

- What problem you're trying to solve
- How you'd expect it to work from a user perspective
- Any alternatives you've considered

Feature requests are welcomed. No idea is too small to mention.

---

## Questions?

If something in this guide is confusing, or you're stuck on your contribution — open an issue or start a discussion on GitHub. There are no dumb questions.

Thank you for contributing to Charcole. 🖤

---

_Full documentation at [charcole.site](https://www.charcole.site/)_
