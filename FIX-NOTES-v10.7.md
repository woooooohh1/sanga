# FIX NOTES v10.7

## Dashboard spacing
- Restored equal-height dashboard cards (`align-items: stretch`).
- Fixed the right-side card overflow/margin mismatch by using `minmax(0, ...)` grid tracks and `min-width: 0` on cards/content/table wrappers.
- The right edge now respects the same admin-content padding as the rest of the dashboard.

## Pagination
- Added numbered pagination to dashboard recent courses and recent inquiries (5 rows/page).
- Added numbered pagination to Courses, Notices, Jobs, History, and Inquiries management lists (8 rows/page).
- Added previous/next controls, active page state, total count, and current/total page summary.
- Course search/filter resets pagination to page 1.
- Pagination is responsive and wraps cleanly on mobile.

## Demo data
- Bumped demo storage key to `sanga_admin_demo_v2` so the expanded sample dataset appears immediately.
- Expanded course, inquiry, notice, job, and history sample records so pagination can be tested without manually adding data.
