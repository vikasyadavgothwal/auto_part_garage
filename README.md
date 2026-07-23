This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3003/dashboard](http://localhost:3003/dashboard) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

<!-- BEGIN:autoparts-pro-codex-docs -->

## AutoParts Pro App Notes

### App Purpose

Garage partner dashboard for bookings, services, schedule, reviews, settings, and garage login.

### Important Folders

- app/(dashboard)/bookings, services, schedule, reviews, settings
- app/login
- `components/app-header.tsx, components/app-sidebar.tsx, components/vehicle-form.tsx`
- `lib/garage-page-data.ts, lib/routes.ts, lib/vehicles.ts`

### Environment Variables

Detected or documented variables:

- `ADMIN_API_BASE_URL`
- `BACKEND_URL`
- `NEXT_PUBLIC_ADMIN_API_BASE_URL`
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_VAPID_KEY`
- `USER_ACCESS_COOKIE_NAME`
- `USER_REFRESH_COOKIE_NAME`
- `NEXT_PUBLIC_BASE_PATH`
- `GARAGE_EMAIL_VERIFICATION_WEBHOOK_URL` configured on the admin/backend app
- `GARAGE_SMS_OTP_WEBHOOK_URL` configured on the admin/backend app

Firebase push notifications require `NEXT_PUBLIC_FIREBASE_VAPID_KEY` plus the
Firebase web config. The dashboard registers the browser token only after login
and browser notification permission.

### Run, Build, and Test Commands

Install:

```bash
pnpm install
```

Detected scripts:

- `pnpm dev`
- `pnpm build`
- `pnpm start`
- `pnpm lint`

Runtime note: dev/start use port 3003.

### Connected Apps and Services

- auto_parts_admin/backend APIs through ADMIN_API_BASE_URL, BACKEND_URL, or NEXT_PUBLIC_ADMIN_API_BASE_URL
- Firebase-first login, then backend user-auth routes with required `Garage` role and garage-scoped HttpOnly cookies
- May connect to user bookings, service catalog, and admin garage management once wired

### Common Checks Before Deployment

- Bookings, services, schedule, reviews, settings, and login pages render
- Firebase login succeeds when configured, and auth cookies are set/cleared through backend login/logout/refresh routes
- Backend URL points to the admin API server, not the garage frontend
- Do not mix fleet or supplier logic into garage workflows
- Run lint/build for this app before deployment.
- Re-check affected API, auth, database, and env contracts in connected apps.

<!-- END:autoparts-pro-codex-docs -->
