# Hardcoded demo data cleanup

This build keeps Supabase database rows intact.

Removed from source code:
- static course cards in unemployed/worker/general pages
- static job rows
- static notice rows
- static academy history nodes
- legacy course-details.js mock dataset
- legacy data.js mock object

All corresponding UI sections now render from Supabase only.

Do NOT delete database course rows just to remove demo cards from HTML.
