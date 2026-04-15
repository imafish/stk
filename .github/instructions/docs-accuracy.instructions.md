---
description: "Use when editing documentation files in doc/**/*.md. Keep docs synchronized with implemented code and remove obsolete or inaccurate statements."
name: "Documentation Accuracy Rules"
applyTo: "doc/**/*.md"
---

# Documentation Accuracy Rules

When editing files that match `doc/**/*.md`, follow these rules:

- Reflect current implementation only:
  - Verify claims against the real code before writing.
  - Prefer concrete, verifiable behavior over aspirational wording.
- Remove stale content:
  - Delete outdated steps, deprecated APIs, old file paths, and removed features.
  - Do not leave contradictory notes after code changes.
- Keep docs and code in lockstep:
  - If code behavior changed, update the related sections in docs in the same task.
  - If a feature is planned but not implemented, clearly label it as planned.
- Accuracy over completeness:
  - It is better to omit uncertain details than to keep potentially incorrect text.
- Commands and paths must be runnable/real:
  - Ensure command examples match actual scripts and project structure.
  - Update references when filenames, folders, or entry points change.
- Testing and setup sections must be current:
  - Keep install/build/test instructions aligned with package scripts and toolchain.

Before finalizing a docs edit:

1. Cross-check changed statements against source code and config files.
2. Remove any line that cannot be validated quickly.
3. Confirm examples match current repository layout.
