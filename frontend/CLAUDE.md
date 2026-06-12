# Frontend notes

- All authenticated API calls must go through `apiFetch(path, options)` from
  `src/api/client.ts`, not raw `fetch`. It attaches `Authorization: Bearer
  <token>` and, on a 401 response, clears the token and redirects to /login.
  `getToken`/`setToken`/`clearToken` are the single source of truth for the
  JWT in localStorage (key `hr_portal_token`).
- New protected routes go under the `<RequireAuth>` route in `src/App.tsx`
  (redirects to /login if no token is present).
