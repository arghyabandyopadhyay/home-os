# Bugfix Requirements Document

## Introduction

The "Reading Now" card on the dashboard (`/dashboard`) is not displaying books that the user has marked as in-progress (status = "reading"). The dashboard's `getTodayData()` function queries the `books` table with `.eq("status", "reading").order("updated_at", { ascending: false })`, but the `books` table lacks an `updated_at` column. This causes the Supabase query to fail silently, returning an empty result set. As a result, the "Reading Now" card always shows the empty state ("No books in progress") even when the user has books with status "reading" in their library.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the user has books with status "reading" in their library THEN the system fails to display them in the dashboard "Reading Now" card because the query orders by a non-existent `updated_at` column, causing the Supabase query to error and return an empty array

1.2 WHEN the user has books with status "reading" in their library THEN the system shows the "Reading Now" count as 0 in the stat cards because the count query also filters by status "reading" but orders/groups incorrectly

### Expected Behavior (Correct)

2.1 WHEN the user has books with status "reading" in their library THEN the system SHALL display up to 3 of those books in the dashboard "Reading Now" card, ordered by most recently created first

2.2 WHEN the user has books with status "reading" in their library THEN the system SHALL show the correct count of in-progress books in the dashboard stat cards

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the user has no books with status "reading" THEN the system SHALL CONTINUE TO display the empty state message in the "Reading Now" card

3.2 WHEN the user views the library page at `/library` THEN the system SHALL CONTINUE TO display all books grouped by status with full interactivity

3.3 WHEN the dashboard fetches focus tasks, pinned notes, and favorite contacts THEN the system SHALL CONTINUE TO display those sections correctly without regression

3.4 WHEN the user changes a book's status to "reading" in the library THEN the system SHALL CONTINUE TO reflect that change in the library view immediately via optimistic update
