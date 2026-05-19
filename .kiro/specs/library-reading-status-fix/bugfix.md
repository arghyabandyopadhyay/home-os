# Bugfix Requirements Document

## Introduction

When a user changes a book's status to "reading" in the Library module, the book moves from the full-featured `BookCard` grid (used for "To Read" and "Finished" sections) into the "Currently Reading" section which renders a simplified inline list item. This simplified layout omits the progress slider, the "Read Preview" link, and the "Open Reader" link — effectively locking the user out of key interactions for any book they are actively reading.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a book's status is set to "reading" THEN the system renders it in the "Currently Reading" section using a simplified list layout that does not include a progress range slider, so the user cannot change reading progress

1.2 WHEN a book's status is "reading" AND the book has a `preview_url` THEN the system does not render the "Read Preview" link, so the user cannot trigger read preview

1.3 WHEN a book's status is "reading" AND the book has a `file_path` THEN the system does not render the "Open Reader" link, so the user cannot open the reader

### Expected Behavior (Correct)

2.1 WHEN a book's status is set to "reading" THEN the system SHALL provide a progress range slider (or equivalent interactive control) allowing the user to change reading progress

2.2 WHEN a book's status is "reading" AND the book has a `preview_url` THEN the system SHALL render a "Read Preview" link that opens the preview URL

2.3 WHEN a book's status is "reading" AND the book has a `file_path` THEN the system SHALL render an "Open Reader" link that navigates to `/reader/{book.id}`

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a book's status is "to_read" THEN the system SHALL CONTINUE TO render it in the "To Read" section using the full BookCard layout with progress slider, preview link, and reader link

3.2 WHEN a book's status is "finished" THEN the system SHALL CONTINUE TO render it in the "Finished" section using the full BookCard layout with progress slider, preview link, and reader link

3.3 WHEN a book's status is "reading" THEN the system SHALL CONTINUE TO display the book's title, author, cover image, and current progress percentage

3.4 WHEN the user changes a book's status from "reading" to another status THEN the system SHALL CONTINUE TO move the book to the appropriate section and render it with full interactivity
