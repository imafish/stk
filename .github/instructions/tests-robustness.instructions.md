---
description: "Use when writing or updating tests. Enforce robust edge-case coverage, clear mock boundaries, no real external requests, and alignment with current logic and implemented features."
name: "Test Robustness And Mocking Policy"
applyTo: "**/*.test.ts, **/*.test.js, **/*.spec.ts, **/*.spec.js, tests/**"
---

# Test Robustness And Mocking Policy

When writing or updating tests, follow these rules.

## Coverage requirements

- Cover happy path plus failure path for each behavior under test.
- Include edge cases:
  - Empty input, null/undefined input, malformed input.
  - Boundary values (min/max, zero, one, off-by-one, large values).
  - Timeout/retry/error branches where applicable.
- Assert meaningful outcomes, not only that code was called.
- Keep tests deterministic and isolated:
  - No hidden dependency on test execution order.
  - No shared mutable state across tests.

## Keep tests aligned with current logic

- Tests must reflect the current implementation and feature set.
- If logic changes, update existing tests in the same change.
- Remove tests for removed behavior; do not keep obsolete assertions.
- Prefer testing public behavior and observable effects over internal implementation details.

## Mocking policy: what to mock

Mock external boundaries and nondeterministic dependencies:

- Network and HTTP clients (`fetch`, axios, SDK clients, API wrappers).
- Browser/platform APIs (`chrome.*`, storage, tabs, runtime messaging).
- File system, OS, process environment, time/date, random values.
- Third-party services and side-effectful integrations (email, payment, analytics).

## Mocking policy: what not to do

- Never make real network requests in unit tests.
- Never call live third-party services or production endpoints.
- Never depend on real credentials, real user data, or local machine state.
- Do not over-mock the unit under test itself.
- Do not assert only on mock call counts when user-visible behavior can be asserted.

## Test design checklist

- Arrange/Act/Assert structure is clear.
- Each test has a single primary intent and descriptive name.
- Failure messages are actionable.
- Fixtures are minimal and purpose-driven.
- Integration tests validate wiring between modules; unit tests validate local logic.

## Before finalizing

1. Run test suite and ensure all updated tests pass.
2. Verify no test performs real I/O or real HTTP calls.
3. Confirm edge-case scenarios are explicitly covered for changed code paths.
4. Remove or rewrite stale tests that no longer match current behavior.
