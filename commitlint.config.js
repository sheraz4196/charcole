module.exports = {
  extends: ["@commitlint/config-conventional"],

  rules: {
    // ─── Type rules ──────────────────────────────────────────────────────────

    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "docs",
        "chore",
        "test",
        "refactor",
        "perf",
        "ci",
        "build",
        "revert",
      ],
    ],

    "type-case": [2, "always", "lower-case"],
    "type-empty": [2, "never"],

    // ─── Scope rules ─────────────────────────────────────────────────────────

    "scope-case": [2, "always", "lower-case"],
    "scope-enum": [
      1,
      "always",
      [
        "cli",
        "template",
        "payments",
        "swagger",
        "auth",
        "deps",
        "config",
        "ci",
        "docs",
        "tests",
        "release",
      ],
    ],

    // ─── Subject (the description after the colon) ───────────────────────────

    "subject-empty": [2, "never"],
    "subject-full-stop": [2, "never", "."],
    "subject-case": [2, "always", "lower-case"],
    "subject-min-length": [2, "always", 10],
    "subject-max-length": [2, "always", 72],

    // ─── Header (full first line) ────────────────────────────────────────────

    "header-max-length": [2, "always", 100],

    // ─── Body ──────────────────────────────────────────────────────────────

    "body-max-line-length": [2, "always", 100],

    // ─── Footer ──────────────────────────────────────────────────────────────

    "footer-max-line-length": [2, "always", 100],
  },

  helpUrl:
    "https://www.charcole.site/ — see CONTRIBUTING.md for commit format guide",
};

// Commit message format reference:
//
// type(scope): subject
//
// body (optional, explain WHY not WHAT)
//
// footer (optional, e.g. "Closes #42" or "BREAKING CHANGE: ...")
