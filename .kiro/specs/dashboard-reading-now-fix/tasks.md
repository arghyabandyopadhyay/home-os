# Implementation Plan

## Overview

Fix the dashboard's `getTodayData()` function in `lib/dashboard.ts` to use `created_at` instead of the non-existent `updated_at` column when ordering the reading books query. This causes the Supabase query to fail silently and return an empty array, making the "Reading Now" card always show empty even when the user has books with status "reading".

## Tasks

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Reading Books Query Uses Non-Existent Column
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Scope the property to the concrete failing case — the `getTodayData()` books query uses `"updated_at"` for ordering, which does not exist on the `books` table, causing Supabase to return empty results
  - Create test file at `__tests__/dashboard-reading-now-fix/bug-condition.property.test.ts`
  - Mock the Supabase client to intercept query builder calls on the `books` table
  - Use fast-check to generate arbitrary book records with status "reading" and arbitrary `created_at` timestamps
  - Assert that `getTodayData()` returns up to 3 books with status "reading" ordered by `created_at` descending
  - Assert that the query builder's `.order()` is called with `"created_at"` (not `"updated_at"`)
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists because the query uses `"updated_at"` which causes Supabase to return empty results)
  - Document counterexamples found (e.g., "getTodayData() returns empty readingBooks array despite books with status 'reading' existing")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 2.1_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Non-Books Dashboard Queries Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Create test file at `__tests__/dashboard-reading-now-fix/preservation.property.test.ts`
  - Observe behavior on UNFIXED code for non-buggy inputs (queries that do NOT involve the books table ordering):
    - Observe: focus tasks query orders by `due_date` and returns correct results
    - Observe: pinned notes query orders by `updated_at` (notes table has this column) and returns correct results
    - Observe: favorite contacts query orders by `updated_at` (contacts table has this column) and returns correct results
    - Observe: all count queries (open tasks, notes, contacts) return correct counts
  - Use fast-check to generate arbitrary sets of tasks (with various `due_date` values), notes (with `updated_at` timestamps), and contacts (with `updated_at` timestamps and `favorite: true`)
  - Write property: for all generated non-books data, `getTodayData()` returns the correct focus tasks ordered by `due_date`, pinned notes, and favorite contacts — these queries are unaffected by the books ordering bug
  - Write property: count queries for open tasks, notes, and contacts return correct counts regardless of books query state
  - Mock Supabase client to return generated data for tasks, notes, and contacts queries
  - Verify tests PASS on UNFIXED code (confirms baseline behavior to preserve)
  - **EXPECTED OUTCOME**: Tests PASS (non-books queries work correctly on unfixed code)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 3. Fix for dashboard "Reading Now" card not displaying books

  - [x] 3.1 Implement the fix
    - Open `lib/dashboard.ts` and locate the `getTodayData()` function
    - Find the reading books query line with `.order("updated_at", { ascending: false })`
    - Change `"updated_at"` to `"created_at"` in the `.order()` call
    - This aligns with the pattern already used in `lib/books.ts` `getBooks()` function
    - No other changes needed — the reading count query does not use ordering
    - _Bug_Condition: isBugCondition(input) where input.table = "books" AND input.orderColumn = "updated_at" AND "updated_at" NOT IN tableColumns("books")_
    - _Expected_Behavior: readingBooks.length = min(3, booksWithStatusReading.length) AND readingBooks IS ORDERED BY created_at DESC_
    - _Preservation: Tasks query (due_date ordering), Notes query (updated_at ordering), Contacts query (updated_at ordering), all count queries unchanged_
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 3.3, 3.4_

  - [x] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Reading Books Query Returns Results
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior (books returned ordered by `created_at` descending)
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1: `npx vitest --run __tests__/dashboard-reading-now-fix/bug-condition.property.test.ts`
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed — query now uses `created_at`)
    - _Requirements: 2.1, 2.2_

  - [x] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Non-Books Dashboard Queries Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2: `npx vitest --run __tests__/dashboard-reading-now-fix/preservation.property.test.ts`
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions to tasks, notes, contacts queries)
    - Confirm all tests still pass after fix (no regressions)

- [x] 4. Checkpoint - Ensure all tests pass
  - Run full test suite: `npx vitest --run __tests__/dashboard-reading-now-fix/`
  - Verify both bug condition and preservation tests pass
  - Ensure no other existing tests are broken: `npm run test`
  - Verify no TypeScript errors: `npx tsc --noEmit`
  - Ask the user if questions arise

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1", "2"] },
    { "id": 1, "tasks": ["3.1"] },
    { "id": 2, "tasks": ["3.2", "3.3"] },
    { "id": 3, "tasks": ["4"] }
  ]
}
```

## Notes

- Tests use `fast-check` for property-based testing with Vitest as the test runner
- The fix is a single-character change in `lib/dashboard.ts` — replacing `"updated_at"` with `"created_at"` in the `.order()` call
- Exploration test (task 1) is expected to FAIL on unfixed code — this confirms the bug exists
- Preservation test (task 2) is expected to PASS on unfixed code — this captures baseline behavior for non-books queries
- The `books` table only has `created_at` (no `updated_at`), while `notes` and `contacts` tables have both columns
