<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:autoparts-pro-codex-docs -->

## AutoParts Pro App Scope

App: `garage_dashboard`
Role: Garage dashboard

### Responsibility

Garage partner dashboard for bookings, services, schedule, reviews, settings, and garage login.

### Important Folders and Files

- app/(dashboard)/bookings, services, schedule, reviews, settings
- app/login
- `components/app-header.tsx, components/app-sidebar.tsx, components/vehicle-form.tsx`
- `lib/garage-page-data.ts, lib/routes.ts, lib/vehicles.ts`

### Connected Apps and Services

- auto_parts_admin/backend APIs through ADMIN_API_BASE_URL, BACKEND_URL, or NEXT_PUBLIC_ADMIN_API_BASE_URL
- Firebase-first login, then backend user-auth routes with required `Garage` role and garage-scoped HttpOnly cookies
- May connect to user bookings, service catalog, and admin garage management once wired

### Rules for Working Here

- Read the project root `AGENTS.md` and `docs/` files before cross-app work.
- Keep changes inside `garage_dashboard` unless the task explicitly requires another app.
- Do not change API contracts, Prisma schema, auth cookies/JWTs, Firebase config, route base paths, or shared env behavior without listing affected apps first.
- Do not mix public website, admin, user, supplier, garage, and fleet business logic unless existing imports or APIs already connect them.
- Preserve existing Next.js version guidance and local architecture rules.

### What Not to Touch Unless Explicitly Required

- Other app folders.
- Package manager files and lockfiles.
- `.env` files and secrets.
- Generated folders such as `.next` and `node_modules`.
- Backend/API or Prisma code outside this app's scope.

### Check After Changes

- Bookings, services, schedule, reviews, settings, and login pages render
- Firebase login succeeds when configured, and auth cookies are set/cleared through backend login/logout/refresh routes
- Backend URL points to the admin API server, not the garage frontend
- Do not mix fleet or supplier logic into garage workflows
- Run the commands documented in this app README when relevant.
- Update project root `docs/AI_HANDOFF.md` after major changes.

<!-- END:autoparts-pro-codex-docs -->
