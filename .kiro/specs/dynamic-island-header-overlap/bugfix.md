# Bugfix Requirements Document

## Introduction

On iPhones with the Dynamic Island (iPhone 14 Pro and later), the iOS status bar and Dynamic Island overlap the app header content. The header uses a fixed 64px height with `padding-top: env(safe-area-inset-top)`, which compresses header content into an unusable sliver when the safe area inset is large (~59px). Additionally, the scroll-hide behavior does not account for the expanded header height, causing incomplete hide/show transitions.

The fix should implement a YouTube-style scroll behavior: when the user scrolls down, the header hides completely to create an immersive full-screen experience; when the user scrolls up, the header reappears smoothly. This must work correctly with the Dynamic Island safe area — the header must translate by its full height (safe-area-inset-top + 64px content area) to fully exit the viewport on hide, and must respect the safe area inset when visible so content never overlaps with the Dynamic Island.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the app is viewed on an iPhone with a Dynamic Island (safe-area-inset-top ≈ 59px) in Safari or standalone PWA mode THEN the system renders the header with a fixed 64px total height, causing the safe-area padding to compress the header content into approximately 5px of vertical space

1.2 WHEN the app is running in standalone PWA mode on a notched iPhone THEN the system displays the header content (navigation toggle, search trigger, user menu) overlapping with or hidden behind the iOS status bar and Dynamic Island

1.3 WHEN the user scrolls down on a Dynamic Island iPhone THEN the system uses a translateY displacement of -68px which does not account for the additional safe-area height, causing the header to remain partially visible instead of hiding completely for a full-screen experience

1.4 WHEN the user scrolls up after scrolling down on a Dynamic Island iPhone THEN the system does not smoothly reveal the header at the correct position, causing the header to reappear with content still overlapping the Dynamic Island area

### Expected Behavior (Correct)

2.1 WHEN the app is viewed on an iPhone with a Dynamic Island (safe-area-inset-top ≈ 59px) in Safari or standalone PWA mode THEN the system SHALL expand the header's total height to be the safe-area-inset-top plus 64px (content area), so that the header content is fully visible below the system UI

2.2 WHEN the app is running in standalone PWA mode on a notched iPhone THEN the system SHALL render all header content (navigation toggle, search trigger, user menu) entirely below the Dynamic Island and status bar, with no overlap or clipping

2.3 WHEN the user scrolls down on a Dynamic Island iPhone THEN the system SHALL translate the header upward by its full visible height (safe-area-inset-top + 64px content area) so that it completely exits the viewport, creating an immersive full-screen experience similar to the YouTube mobile app

2.4 WHEN the user scrolls up (at any scroll position) on a Dynamic Island iPhone THEN the system SHALL smoothly reveal the header by translating it back to its original position (top: 0) with the safe-area-inset-top padding intact, ensuring header content appears below the Dynamic Island without overlap

2.5 WHEN the header transitions between visible and hidden states on a Dynamic Island iPhone THEN the system SHALL animate the transition smoothly using CSS transform (translateY) so the hide/show feels fluid and responsive to scroll direction changes

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the app is viewed on a device without a notch or Dynamic Island (safe-area-inset-top = 0) THEN the system SHALL CONTINUE TO render the header at 64px height with no extra top padding

3.2 WHEN the app is viewed on desktop (md breakpoint and above) THEN the system SHALL CONTINUE TO render the header as a sticky element without fixed positioning, safe-area adjustments, or scroll-hide behavior

3.3 WHEN the header animates between visible and hidden states on non-notched mobile devices THEN the system SHALL CONTINUE TO use the existing -68px translateY displacement for the hide animation (since the total header height remains 64px + border on those devices)

3.4 WHEN the app is viewed on older notched iPhones (iPhone X through iPhone 14, safe-area-inset-top ≈ 47px) THEN the system SHALL expand the header height correctly for those devices and use the appropriate translateY value (safe-area-inset-top + 64px) for the scroll-hide animation

3.5 WHEN the app is viewed on Android devices THEN the system SHALL CONTINUE TO render the header at 64px height with no safe-area adjustments, since Android browsers do not render in edge-to-edge mode

3.6 WHEN the user is at the top of the page (scroll position = 0) THEN the system SHALL CONTINUE TO display the header in its fully visible state regardless of device type
