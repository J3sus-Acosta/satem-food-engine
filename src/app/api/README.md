// API Routes live under app/api/ following Next.js App Router conventions.
// Each sub-folder represents an endpoint group (e.g., /api/orders, /api/products).
// Route Handler files must be named route.ts
//
// Convention:
// app/api/<resource>/route.ts → collection endpoints (GET list, POST create)
// app/api/<resource>/[id]/route.ts → single resource (GET, PUT, PATCH, DELETE)
//
// IMPORTANT: route.ts and page.tsx cannot coexist at the same route segment.
// Always place API routes under app/api/ to avoid conflicts.
