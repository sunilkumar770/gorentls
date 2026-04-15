# GoRentals Frontend — Remaining Sprint

## Context
Backend is production-hardened and 8/8 acceptance tests pass. The frontend is a Next.js app
at `gorentals-frontend/`. The backend runs at `http://localhost:8080/api`.

## Completed
- Backend: all bugs fixed, pushed to `sunilkumar770/gorentls`
- Frontend: `auth.ts` admin login URL fixed (`/auth/admin-login`)
- Axios interceptor: already injects `gr_token` from localStorage on every request

## Remaining Work (ordered by priority)

### TASK 1 — Verify admin dashboard tabs render live data (critical path)
The admin dashboard is at `/admin`. Verify each of the 5 tabs wires to the correct API:
- Overview tab → `GET /admin/dashboard/stats`
- Users tab → `GET /admin/users`
- Listings tab → `GET /admin/listings`
- Bookings tab → `GET /admin/bookings`
- Owners tab → `GET /admin/owners`

Check `src/app/(protected)/admin/` — if the tab components exist but make no API calls, wire them
to `adminService` from `src/services/admin.ts`.

### TASK 2 — Notification bell badge (unread count)
The backend exposes `GET /api/notifications/unread-count` returning `{ unreadCount: number }`.
- Find the Navbar component in `src/components/`
- Add a polling hook (every 30 seconds) that calls this endpoint when a user token exists
- Display the count as a badge on the bell icon

### TASK 3 — Fix comment in auth.ts
Line 65 still says `"/auth/admin/login"` in a JSDoc comment — update to `/auth/admin-login`
to stay in sync with the actual code.
