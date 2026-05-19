# Dashboard "Reading Now" Bugfix Design

## Overview

The dashboard's `getTodayData()` function in `lib/dashboard.ts` queries the `books` table with `.order("updated_at", { ascending: false })`, but the `books` table does not have an `updated_at` column (only `created_at`). This causes the Supabase query to fail silently, returning an empty array. As a result, the "Reading Now" card on the dashboard always shows empty even when the user has books with status "reading". The fix is to change the ordering column from `updated_at` to `created_at`.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug — when the dashboard queries the `books` table using the non-existent `updated_at` column for ordering
- **Property (P)**: The desired behavior — books with status "reading" should be returned ordered by `created_at` descending
- **Preservation**: Existing behavior that must remain unchanged — all other dashboard queries (tasks, notes, contacts) and the reading count query
- **getTodayData()**: The function in `lib/dashboard.ts` that fetches all dashboard data including reading books, focus tasks, pinned notes, and favorite contacts
- **readingRes**: The Supabase query result for books with status "reading", currently broken due to ordering by a non-existent column

## Bug Details

### Bug Condition

The bug manifests when the dashboard's `getTodayData()` function executes the reading books query. The query uses `.order("updated_at", { ascending: false })` on the `books` table, but this table only has a `created_at` timestamp column. Supabase silently fails and returns an empty result set.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type SupabaseQuery
  OUTPUT: boolean
  
  RETURN input.table = "books"
         AND input.orderColumn = "updated_at"
         AND "updated_at" NOT IN tableColumns("books")
END FUNCTION
```

### Examples

- User has 3 books with status "reading" → "Reading Now" card shows empty (expected: shows 3 books ordered by most recently created)
- User adds a new book and sets status to "reading" → "Reading Now" card still shows empty (expected: shows the new book)
- User has 5 books with status "reading" → "Reading Now" card shows empty (expected: shows 3 most recently created books)
- User has 0 books with status "reading" → "Reading Now" card shows empty state (this is correct behavior, unchanged)

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- The reading count query (`.select("id", { count: "exact", head: true }).eq("status", "reading")`) must continue to return the correct count
- Focus tasks query ordering by `due_date` must remain unchanged
- Favorite contacts query ordering by `updated_at` must remain unchanged (contacts table HAS `updated_at`)
- Pinned notes and recent notes queries must remain unchanged
- The `getBooks()` function in `lib/books.ts` (which correctly uses `created_at`) must remain unchanged
- Dashboard stat cards for open tasks, notes, and contacts must continue working

**Scope:**
All queries in `getTodayData()` that do NOT reference the `books` table ordering should be completely unaffected by this fix. This includes:
- Tasks queries (ordering by `due_date` and `created_at`)
- Notes queries (ordering by `updated_at` — notes table has this column)
- Contacts queries (ordering by `updated_at` — contacts table has this column)
- All count queries (they don't use ordering)

## Hypothesized Root Cause

Based on the bug description and code analysis, the root cause is:

1. **Incorrect Column Reference**: The `books` query in `getTodayData()` uses `.order("updated_at", { ascending: false })` but the `books` table schema only has `created_at`. The developer likely copied the pattern from the contacts or notes query (which do have `updated_at`) without verifying the books table schema.

2. **Silent Failure**: Supabase's PostgREST layer does not throw a client-side error when ordering by a non-existent column. Instead, it returns an empty result set, making the bug non-obvious during development.

3. **No Type Safety on Column Names**: The Supabase client's `.order()` method accepts a string column name. While TypeScript types exist in `types/database.ts`, the query builder may not enforce column existence at compile time for the order clause, allowing the typo to pass undetected.

## Correctness Properties

Property 1: Bug Condition - Reading Books Query Returns Results

_For any_ dashboard query where the user has books with status "reading" in the database, the fixed `getTodayData()` function SHALL return those books (up to 3) ordered by `created_at` descending, rather than returning an empty array.

**Validates: Requirements 2.1, 2.2**

Property 2: Preservation - Non-Books Queries Unchanged

_For any_ dashboard query that does not involve the books table ordering (tasks, notes, contacts, count queries), the fixed `getTodayData()` function SHALL produce the same results as the original function, preserving all existing functionality for non-books data fetching.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `lib/dashboard.ts`

**Function**: `getTodayData()`

**Specific Changes**:
1. **Change ordering column**: Replace `.order("updated_at", { ascending: false })` with `.order("created_at", { ascending: false })` on line 63 (the reading books query)
   - Before: `.order("updated_at", { ascending: false })`
   - After: `.order("created_at", { ascending: false })`

2. **Verify no other books queries use `updated_at`**: The reading count query does not use ordering, so it is unaffected. No other changes needed.

3. **Consistency with `lib/books.ts`**: The `getBooks()` function in `lib/books.ts` already correctly uses `.order("created_at", { ascending: false })`. This fix aligns the dashboard query with the established pattern.

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that mock the Supabase client and verify the query builder is called with the correct column name. Run these tests on the UNFIXED code to observe failures.

**Test Cases**:
1. **Order Column Test**: Assert that the books query uses `created_at` for ordering (will fail on unfixed code because it uses `updated_at`)
2. **Non-Empty Result Test**: Mock Supabase to return books when queried with `created_at` ordering, assert `readingBooks` is non-empty (will fail on unfixed code)
3. **Limit Test**: Assert that at most 3 books are returned (will fail on unfixed code since query returns empty)

**Expected Counterexamples**:
- The query builder is called with `"updated_at"` instead of `"created_at"`
- Possible causes: copy-paste error from contacts/notes query pattern

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := getTodayData_fixed(input)
  ASSERT result.readingBooks.length = min(3, booksWithStatusReading.length)
  ASSERT result.readingBooks IS ORDERED BY created_at DESC
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT getTodayData_original(input).focusTasks = getTodayData_fixed(input).focusTasks
  ASSERT getTodayData_original(input).pinnedNotes = getTodayData_fixed(input).pinnedNotes
  ASSERT getTodayData_original(input).favoriteContacts = getTodayData_fixed(input).favoriteContacts
  ASSERT getTodayData_original(input).counts = getTodayData_fixed(input).counts
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for non-books queries, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Tasks Query Preservation**: Verify focus tasks query continues to use `due_date` ordering and returns correct results
2. **Notes Query Preservation**: Verify pinned/recent notes queries continue to work correctly
3. **Contacts Query Preservation**: Verify favorite contacts query continues to use `updated_at` ordering
4. **Count Queries Preservation**: Verify all count queries return correct values

### Unit Tests

- Test that the books query in `getTodayData()` uses `created_at` for ordering
- Test that books with status "reading" are returned when they exist
- Test that at most 3 books are returned (limit enforcement)
- Test that books are ordered by `created_at` descending
- Test that the empty state still works when no books have status "reading"

### Property-Based Tests

- Generate random sets of books with various statuses and verify that only "reading" books appear in `readingBooks`, ordered by `created_at` descending, limited to 3
- Generate random dashboard states and verify that non-books queries produce identical results before and after the fix
- Test that the reading count always matches the actual number of books with status "reading"

### Integration Tests

- Test full dashboard data fetch with books in "reading" status present in the database
- Test that the "Reading Now" card renders book data when `readingBooks` is non-empty
- Test that changing a book's status to "reading" causes it to appear in the dashboard on next load
