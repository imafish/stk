---
description: When changing the source code, also add tests, including UTs and integration tests to ensure code quality and reliability. This will help catch bugs early and ensure that the code works as intended.
applyTo: '**/*.ts, **/*.js' # when provided, instructions will automatically be added to the request context when the pattern matches an attached file
---

<!-- Tip: Use /create-instructions in chat to generate content with agent assistance -->

When making changes to the source code, also add tests, including unit tests (UTs) and integration tests, to ensure code quality and reliability. This will help catch bugs early and ensure that the code works as intended.
Also checks existing tests for relevance and update them accordingly. This ensures that the tests remain effective and provide accurate feedback on the code's functionality.
Also runs the tests to make sure they pass.
The tests should cover corner cases and edge cases to ensure that the code is robust and can handle unexpected inputs or scenarios. This will help improve the overall quality of the code and reduce the likelihood of bugs in production.
