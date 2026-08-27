# Phase 2 Admin Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the studio-staff admin web app — a Vite + React SPA talking to the Phase 1 API — covering class/instructor/room/spot management, roster + manual check-in, reporting, announcements, and studio settings.

**Architecture:** npm-workspaces monorepo. The Phase 1 backend moves to `apps/api`. Two shared packages: `packages/ui` (Tailwind design-token preset + primitives) and `packages/api-client` (typed fetch client, JWT store with refresh-retry, TanStack Query hooks). `apps/admin` composes them. State: TanStack Query for server state, React context for the auth session, URL for filters. Routing: React Router. Components: shadcn/ui (Radix) themed to the MiliClub token palette.

**Tech Stack:** Vite 5, React 18, TypeScript 5, Tailwind CSS 3, shadcn/ui, React Router 6, TanStack Query 5, Vitest + React Testing Library, Playwright (one smoke test).

**Spec:** `docs/superpowers/specs/2026-08-27-phase2-frontend-design.md`

## Global Constraints

- Node 20+. npm workspaces (no pnpm/yarn) — matches the existing repo.
- The backend keeps its stack exactly (NestJS 11, CJS, Jest, TypeORM 0.3.31); only its directory changes to `apps/api`.
- Design tokens are the single source of truth for colour/spacing/type — components never hard-code hex values. Palette + fonts per the spec's "Shared: design tokens" table.
- No shadows anywhere; separation via `line` borders + whitespace.
- Every list/detail screen handles loading, empty, and error states explicitly.
- Money/credits, notifications, and the member app are out of scope for this plan.
- Frontend tests target the API client's refresh/retry + invalidation logic and the non-trivial interactive components (roster actions, recurrence editor, spot-map editor) plus one Playwright smoke path — not every presentational component.
- Commit after every task. Conventional-commit style (`feat:`, `chore:`, `test:`).

---

## Task 1: Monorepo restructure + backend CORS + list-members endpoint

**Files:**
- Move: everything currently at repo root that belongs to the backend → `apps/api/` (`src/`, `test/`, `package.json`, `package-lock.json`, `tsconfig*.json`, `nest-cli.json`, `.prettierrc`, `docker-compose.yml`, `.env`, `.env.example`, `README.md` → `apps/api/README.md`)
- Create: root `package.json` (workspace root), root `.gitignore` additions, root `README.md`
- Create: `apps/api/src/users/dto/list-users.dto.ts`
- Modify: `apps/api/src/main.ts` (CORS), `apps/api/src/users/users.service.ts`, `apps/api/src/users/users.controller.ts`
- Test: `apps/api/src/users/users.service.spec.ts` (extend)

**Interfaces:**
- Produces: `GET /users?role=&q=&page=&pageSize=` → `{ data: UserPublic[]; total: number }` where `UserPublic = { id, email, fullName, phone, role, healthWaiverSignedAt, createdAt }` (no `passwordHash`). Staff/admin only. Consumed by the roster "add booking" and any member-search UI.
- Produces: CORS enabled for origins in `CORS_ORIGINS` (comma-separated, default `http://localhost:5173,http://localhost:5174`).

- [ ] **Step 1: Create the target directory and move the backend**

```bash
mkdir -p apps
git mv src test package.json package-lock.json tsconfig.json tsconfig.build.json nest-cli.json .prettierrc docker-compose.yml .env.example apps/api/
git mv README.md apps/api/README.md
mv .env apps/api/.env 2>/dev/null || true
```

`docs/` and `.git/` stay at the root. Verify `git status` shows renames, not deletes+adds.

- [ ] **Step 2: Fix `apps/api` paths that assumed repo root**

`apps/api/.gitignore` — create it (the root `.gitignore` no longer covers the subdir):
```
node_modules/
dist/
coverage/
.env
*.log
*.tsbuildinfo
```
`apps/api/package.json` `seed` script and `data-source.ts` globs are already relative to the package dir — no change. Confirm `apps/api/tsconfig.json` has no `../` paths (it doesn't).

- [ ] **Step 3: Write the root `package.json`**

```json
{
  "name": "pilates-reservation-platform",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "api": "npm --workspace apps/api run start:dev",
    "admin": "npm --workspace apps/admin run dev",
    "test": "npm --workspaces --if-present run test"
  }
}
```

- [ ] **Step 4: Reinstall from the root and verify the API is unbroken**

```bash
rm -rf apps/api/node_modules node_modules
npm install
cd apps/api && npm test && cd ../..
```

Expected: `npm install` links the workspace; `apps/api` unit tests still 51 passing.

- [ ] **Step 5: Write the failing test for member listing**

Append to `apps/api/src/users/users.service.spec.ts`:
```ts
it('lists members with a search filter and total count', async () => {
  const qb = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[{ id: 'u1' }], 1]),
  };
  (repoMock as any).createQueryBuilder = jest.fn(() => qb);
  const result = await service.list({ role: 'member', q: 'ann', page: 1, pageSize: 20 });
  expect(result).toEqual({ data: [{ id: 'u1' }], total: 1 });
  expect(qb.andWhere).toHaveBeenCalled();
});
```

- [ ] **Step 6: Implement `UsersService.list` + DTO**

`apps/api/src/users/dto/list-users.dto.ts`:
```ts
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ListUsersDto {
  @IsOptional() @IsIn(['member', 'staff', 'admin']) role?: string;
  @IsOptional() @IsString() q?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize?: number;
}
```

Add to `UsersService`:
```ts
async list(dto: ListUsersDto): Promise<{ data: User[]; total: number }> {
  const page = dto.page ?? 1;
  const pageSize = dto.pageSize ?? 20;
  const qb = this.usersRepo.createQueryBuilder('u').orderBy('u.full_name', 'ASC');
  if (dto.role) qb.andWhere('u.role = :role', { role: dto.role });
  if (dto.q) qb.andWhere('(u.full_name ILIKE :q OR u.email ILIKE :q)', { q: `%${dto.q}%` });
  qb.skip((page - 1) * pageSize).take(pageSize);
  const [data, total] = await qb.getManyAndCount();
  return { data, total };
}
```

- [ ] **Step 7: Add the controller route**

In `apps/api/src/users/users.controller.ts`, add (guarded staff/admin):
```ts
@UseGuards(RolesGuard)
@Roles(Role.STAFF, Role.ADMIN)
@Get()
list(@Query() dto: ListUsersDto) {
  return this.usersService.list(dto).then((r) => ({
    data: r.data.map(({ passwordHash, ...u }) => { void passwordHash; return u; }),
    total: r.total,
  }));
}
```
(Import `RolesGuard`, `Roles`, `Role`, `Query`, `ListUsersDto`. The controller already has `@UseGuards(JwtAuthGuard)` at class level.)

- [ ] **Step 8: Enable CORS in `apps/api/src/main.ts`**

```ts
const origins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173,http://localhost:5174').split(',');
app.enableCors({ origin: origins, credentials: true });
```
Add `CORS_ORIGINS=http://localhost:5173,http://localhost:5174` to `apps/api/.env.example`.

- [ ] **Step 9: Run API tests + a manual check**

```bash
cd apps/api
npm test
DATABASE_URL=postgres://<you>@localhost:5432/pilates_test npm run test:e2e
```
Expected: unit 52 passing (51 + new), e2e 12 passing.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "chore: restructure into npm workspaces monorepo; add CORS + GET /users"
```

---

## Task 2: `packages/ui` — Tailwind preset, tokens, fonts, primitives

**Files:**
- Create: `packages/ui/package.json`, `packages/ui/tsconfig.json`
- Create: `packages/ui/src/tailwind-preset.ts`
- Create: `packages/ui/src/tokens.css` (CSS variables + font-face import)
- Create: `packages/ui/src/index.ts`
- Create: `packages/ui/src/cn.ts` (clsx + tailwind-merge helper)

**Interfaces:**
- Produces: `import preset from '@pilates/ui/tailwind-preset'` — a Tailwind `Config['presets'][number]` defining `colors.{bg,surface,ink,muted,primary,accent,line,danger}`, `fontFamily.sans = ['DM Sans', ...]`, `borderRadius.{sm:6px,md:12px,lg:28px}`, and `boxShadow.none` only.
- Produces: `@pilates/ui/tokens.css` — imports DM Sans from Google Fonts, sets `:root` CSS vars, base `body { background: var(--bg); color: var(--ink); font-family }`.
- Produces: `cn(...classes)` from `@pilates/ui`.

- [ ] **Step 1: Write `packages/ui/package.json`**

```json
{
  "name": "@pilates/ui",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./tailwind-preset": "./src/tailwind-preset.ts",
    "./tokens.css": "./src/tokens.css"
  },
  "dependencies": { "clsx": "^2.1.1", "tailwind-merge": "^2.5.4" }
}
```

- [ ] **Step 2: Write `packages/ui/src/tailwind-preset.ts`**

```ts
import type { Config } from 'tailwindcss';

const preset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        bg: '#f1e7d8',
        surface: '#faf5ec',
        ink: '#1b1b1b',
        muted: '#777068',
        primary: { DEFAULT: '#513823', fg: '#f8f3ea' },
        accent: '#66715b',
        line: '#e0d5c3',
        danger: '#8c4a3b',
      },
      fontFamily: { sans: ['"DM Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      borderRadius: { sm: '6px', md: '12px', lg: '28px' },
      letterSpacing: { tightpx: '-0.02em', eyebrow: '0.14em' },
      maxWidth: { prose: '72ch' },
    },
  },
};
export default preset;
```

- [ ] **Step 3: Write `packages/ui/src/tokens.css`**

```css
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');

:root {
  --bg: #f1e7d8;
  --surface: #faf5ec;
  --ink: #1b1b1b;
  --muted: #777068;
  --primary: #513823;
  --primary-fg: #f8f3ea;
  --accent: #66715b;
  --line: #e0d5c3;
  --danger: #8c4a3b;
}

body {
  background: var(--bg);
  color: var(--ink);
  font-family: 'DM Sans', ui-sans-serif, system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}
h1, h2, h3 { font-weight: 300; letter-spacing: -0.02em; }
.eyebrow { text-transform: uppercase; letter-spacing: 0.14em; font-size: 0.75rem; color: var(--muted); }
```

- [ ] **Step 4: Write `cn.ts` and `index.ts`**

`src/cn.ts`:
```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
```
`src/index.ts`: `export { cn } from './cn';`

- [ ] **Step 5: Write `packages/ui/tsconfig.json`** (`extends` a shared base; strict, `jsx: react-jsx`, `moduleResolution: bundler`).

- [ ] **Step 6: Install and typecheck**

```bash
npm install
npm --workspace @pilates/ui exec tsc --noEmit
```

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat(ui): tailwind preset, design tokens, cn helper"
```

---

## Task 3: `packages/api-client` — typed client, JWT store, refresh-retry, query hooks

**Files:**
- Create: `packages/api-client/package.json`, `tsconfig.json`, `vitest.config.ts`
- Create: `packages/api-client/src/types.ts` (DTO/entity types mirroring the API)
- Create: `packages/api-client/src/http.ts` (fetch wrapper + token store + refresh-retry)
- Create: `packages/api-client/src/client.ts` (endpoint methods)
- Create: `packages/api-client/src/queries.ts` (TanStack Query hooks + `queryKeys`)
- Create: `packages/api-client/src/index.ts`
- Test: `packages/api-client/src/http.test.ts`

**Interfaces:**
- Produces: `createHttp({ baseUrl })` → `{ get, post, patch, del, setAccessToken, getAccessToken, onLogout }`. On a `401` (except from `/auth/*`) it POSTs `/auth/refresh` with the stored access token once, updates tokens, retries the original request once; a second `401` clears tokens and calls the `onLogout` callback.
- Produces: `createClient(http)` → namespaced methods: `auth.login/register/refresh`, `users.list`, `instructors.list/get/create/update/remove`, `rooms.*`, `spots.listForRoom/create/update/remove`, `classTemplates.*`, `classInstances.list(filters)/get/create/update/cancel/generate`, `bookings.book/cancel/acceptOffer/mine/forClass`, `attendance.checkIn/markNoShow`, `reports.bookingsPerClass/attendanceRate/noShowRate`, `announcements.list/create/remove`, `settings.get/update`, `me.get/signWaiver`.
- Produces: `queryKeys` object + hooks `useInstructors()`, `useClassInstances(filters)`, `useBookingsForClass(id)`, `useReports(range)`, etc., and mutation hooks that invalidate the matching keys. Consumed by every `apps/admin` screen.
- Produces: `types.ts` — `Role`, `BookingStatus`, `ClassType`, `IntensityLevel`, `Instructor`, `Room`, `RoomSpot`, `ClassTemplate`, `ClassInstance`, `Booking`, `Announcement`, `StudioSettings`, `UserPublic`, `Paginated<T>`.

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "@pilates/api-client",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": { ".": "./src/index.ts" },
  "scripts": { "test": "vitest run" },
  "peerDependencies": { "react": "^18", "@tanstack/react-query": "^5" },
  "devDependencies": { "vitest": "^2.1.8", "@tanstack/react-query": "^5.59.0", "react": "^18.3.1" }
}
```

- [ ] **Step 2: Write `src/types.ts`** — plain interfaces mirroring the API entities (fields per `apps/api/src/**/entities/*.entity.ts`). Enums as string-literal unions.

- [ ] **Step 3: Write the failing test `src/http.test.ts`**

```ts
import { describe, it, expect, vi } from 'vitest';
import { createHttp } from './http';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

describe('createHttp refresh-retry', () => {
  it('refreshes once on 401 then retries the original request', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ message: 'unauthorized' }, 401)) // original
      .mockResolvedValueOnce(jsonResponse({ accessToken: 'new', refreshToken: 'r2' })) // refresh
      .mockResolvedValueOnce(jsonResponse({ ok: true })); // retry
    vi.stubGlobal('fetch', fetchMock);

    const http = createHttp({ baseUrl: 'http://x', storage: new Map() as any });
    http.setAccessToken('old');
    const result = await http.get('/instructors');

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(http.getAccessToken()).toBe('new');
  });

  it('logs out after a second 401', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({}, 401))
      .mockResolvedValueOnce(jsonResponse({ accessToken: 'new', refreshToken: 'r2' }))
      .mockResolvedValueOnce(jsonResponse({}, 401));
    vi.stubGlobal('fetch', fetchMock);
    const onLogout = vi.fn();
    const http = createHttp({ baseUrl: 'http://x', storage: new Map() as any, onLogout });
    http.setAccessToken('old');

    await expect(http.get('/instructors')).rejects.toThrow();
    expect(onLogout).toHaveBeenCalledOnce();
    expect(http.getAccessToken()).toBeNull();
  });
});
```

- [ ] **Step 4: Run it — verify it fails** (`npm --workspace @pilates/api-client test` → module not found).

- [ ] **Step 5: Implement `src/http.ts`**

A `storage` abstraction (`{ getItem, setItem, removeItem }`, defaulting to `localStorage`, injectable for tests) holds the refresh token; the access token is an in-memory variable. `request()` builds headers, calls `fetch`, and on non-`/auth/` `401` runs the refresh-retry described in the Interfaces block. Throws an `ApiError` (with `status` and parsed `body`) on other non-2xx.

- [ ] **Step 6: Run the test — verify it passes.**

- [ ] **Step 7: Implement `src/client.ts`** — thin per-endpoint methods over `http`. Each returns typed data.

- [ ] **Step 8: Implement `src/queries.ts`** — `queryKeys` factory, `QueryClientProvider`-agnostic hooks, mutation hooks calling `queryClient.invalidateQueries` on the affected keys (e.g. `bookings.book` invalidates `queryKeys.classInstances` and `queryKeys.bookingsForClass(id)`).

- [ ] **Step 9: `src/index.ts`** re-exports `createHttp`, `createClient`, `types`, `queries`.

- [ ] **Step 10: Typecheck + test + commit**

```bash
npm --workspace @pilates/api-client exec tsc --noEmit
npm --workspace @pilates/api-client test
git add -A && git commit -m "feat(api-client): typed client, JWT refresh-retry, query hooks"
```

---

## Task 4: `apps/admin` scaffold — Vite, Tailwind, shadcn, router, auth, shell

**Files:**
- Create: `apps/admin/` via `npm create vite@latest apps/admin -- --template react-ts`
- Modify: `apps/admin/package.json` (deps, scripts), `apps/admin/vite.config.ts` (port 5173, path alias `@`)
- Create: `apps/admin/tailwind.config.ts` (uses `@pilates/ui` preset), `apps/admin/postcss.config.js`
- Create: `apps/admin/src/index.css` (import `@pilates/ui/tokens.css` + Tailwind layers)
- Create: `apps/admin/src/lib/api.ts` (instantiate `createHttp`/`createClient` from `VITE_API_URL`)
- Create: `apps/admin/src/auth/AuthProvider.tsx`, `apps/admin/src/auth/useAuth.ts`, `apps/admin/src/auth/RequireStaff.tsx`
- Create: `apps/admin/src/routes.tsx`, `apps/admin/src/main.tsx` (QueryClientProvider + RouterProvider)
- Create: `apps/admin/src/components/AppShell.tsx`, `apps/admin/src/components/ui/*` (shadcn: button, input, card, table, dialog, select, badge, tabs, sonner)
- Create: `apps/admin/src/pages/LoginPage.tsx`
- Test: `apps/admin/src/auth/AuthProvider.test.tsx`

**Interfaces:**
- Consumes: `@pilates/api-client` (`createClient`, hooks), `@pilates/ui` (`cn`, preset, tokens).
- Produces: `useAuth()` → `{ user, login(email,pw), logout, isLoading }`; `<RequireStaff>` redirects to `/login` when unauthenticated and shows "Not authorized" when the user's role is `member`. `<AppShell>` with nav items gated by role (`Settings` admin-only). Every later task adds routes under `<RequireStaff><AppShell/></RequireStaff>`.

- [ ] **Step 1: Scaffold + install**

```bash
npm create vite@latest apps/admin -- --template react-ts
npm install
npm --workspace apps/admin install -D tailwindcss@^3 postcss autoprefixer @types/node vitest @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react
npm --workspace apps/admin install react-router-dom @tanstack/react-query @pilates/ui @pilates/api-client lucide-react sonner date-fns
```

- [ ] **Step 2: Tailwind wiring**

`apps/admin/tailwind.config.ts`:
```ts
import type { Config } from 'tailwindcss';
import preset from '@pilates/ui/tailwind-preset';
export default {
  presets: [preset as Config],
  content: ['./index.html', './src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
} satisfies Config;
```
`apps/admin/src/index.css`:
```css
@import '@pilates/ui/tokens.css';
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 3: `vite.config.ts`** — `plugins: [react()]`, `server.port: 5173`, `resolve.alias { '@': '/src' }`, `test: { environment: 'jsdom', setupFiles: './src/test-setup.ts', globals: true }`.

- [ ] **Step 4: `src/lib/api.ts`**

```ts
import { createHttp, createClient } from '@pilates/api-client';
export const http = createHttp({ baseUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:3000' });
export const api = createClient(http);
```
`apps/admin/.env.example`: `VITE_API_URL=http://localhost:3000`.

- [ ] **Step 5: shadcn/ui** — `npx shadcn@latest init` (choose "Vite", CSS variables yes), then `npx shadcn@latest add button input card table dialog select badge tabs sonner dropdown-menu label textarea`. Edit the generated `src/index.css` `@layer base` `:root` block so the shadcn semantic vars map to our tokens (`--background: 41 46% 90%` etc. — HSL of `#f1e7d8`; `--primary` → `#513823`; `--radius: 12px`).

- [ ] **Step 6: Write the failing auth test**

`apps/admin/src/auth/AuthProvider.test.tsx`:
```tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { AuthProvider } from './AuthProvider';
import { useAuth } from './useAuth';

vi.mock('@/lib/api', () => ({
  api: {
    auth: { login: vi.fn().mockResolvedValue({ accessToken: 'a', refreshToken: 'r' }) },
    me: { get: vi.fn().mockResolvedValue({ id: 'u1', role: 'admin', fullName: 'A', email: 'a@b.c' }) },
  },
  http: { setAccessToken: vi.fn(), getAccessToken: () => null, onLogout: vi.fn() },
}));

function Probe() {
  const { user, login } = useAuth();
  return <button onClick={() => login('a@b.c', 'pw')}>{user ? user.role : 'anon'}</button>;
}

it('exposes the user after login', async () => {
  render(<AuthProvider><Probe /></AuthProvider>);
  await userEvent.click(screen.getByRole('button'));
  await waitFor(() => expect(screen.getByRole('button')).toHaveTextContent('admin'));
});
```

- [ ] **Step 7: Implement `AuthProvider` / `useAuth` / `RequireStaff`** — on mount, if `http.getAccessToken()` or a stored refresh token exists, call `api.me.get()` to hydrate; `login()` calls `api.auth.login`, sets tokens, fetches `me`; `logout()` clears tokens + user. `RequireStaff` uses `useAuth` + `<Navigate>`.

- [ ] **Step 8: Implement `AppShell` + `LoginPage` + `routes.tsx` + `main.tsx`.** Shell: `bg`-coloured page, `surface` left nav card with `line` border, nav links (`lucide-react` icons), user chip + logout bottom-left. Login: centered `surface` card, DM Sans, `eyebrow` label, error text in `danger`.

- [ ] **Step 9: Run tests + dev server smoke**

```bash
npm --workspace apps/admin test
npm --workspace apps/admin run dev  # visit :5173, log in with admin@studio.test / password123
```
Expected: auth test passes; login works against the running API (`cd apps/api && npm run start:dev` in another shell) and lands on an empty shell.

- [ ] **Step 10: Commit**

```bash
git add -A && git commit -m "feat(admin): scaffold — vite, tailwind, shadcn, auth, app shell"
```

---

## Task 5: Instructors + Rooms + Spot-map management

**Files:**
- Create: `apps/admin/src/pages/InstructorsPage.tsx`, `apps/admin/src/pages/RoomsPage.tsx`
- Create: `apps/admin/src/components/InstructorFormDialog.tsx`, `apps/admin/src/components/RoomFormDialog.tsx`, `apps/admin/src/components/SpotMapEditor.tsx`
- Create: `apps/admin/src/components/DataTable.tsx` (thin wrapper over the shadcn table with loading/empty/error slots), `apps/admin/src/components/ConfirmDialog.tsx`
- Modify: `apps/admin/src/routes.tsx`
- Test: `apps/admin/src/components/SpotMapEditor.test.tsx`

**Interfaces:**
- Consumes: `api.instructors.*`, `api.rooms.*`, `api.spots.*`; query hooks `useInstructors`, `useRooms`, `useRoomSpots(roomId)`.
- Produces: `DataTable<T>` (`{ columns, rows, isLoading, error, empty }`), `ConfirmDialog` (`{ title, body, confirmLabel, onConfirm }`) — reused by every later CRUD screen.

- [ ] **Step 1: `DataTable` + `ConfirmDialog`** — presentational; `DataTable` renders a skeleton row set while `isLoading`, an `error` message in `danger`, or the `empty` node when `rows.length === 0`.

- [ ] **Step 2: `InstructorsPage`** — `DataTable` (name, bio preview, has-photo); "New instructor" opens `InstructorFormDialog` (name, bio textarea, photoUrl); row actions Edit / Delete (Delete → `ConfirmDialog`). Mutations via the api-client hooks (they invalidate `queryKeys.instructors`); `sonner` toast on success/error.

- [ ] **Step 3: `RoomsPage`** — `DataTable` (name, notes, "assigned spots" badge, spot count); `RoomFormDialog` (name, notes, `hasAssignedSpots` switch). Selecting a room opens `SpotMapEditor` in a side panel / dialog.

- [ ] **Step 4: Write the failing `SpotMapEditor` test**

```tsx
// renders existing spots, adds a row, calls api.spots.create with the label
```
Mock `@/lib/api`; assert that typing a label + clicking "Add spot" calls `api.spots.create` with `{ roomId, label, ... }`, and that toggling "bookable" on a row calls `api.spots.update`.

- [ ] **Step 5: Implement `SpotMapEditor`** — a list of spots (label, position group select, order number, bookable toggle, remove), an "Add spot" row, and a simple visual preview grid grouped by `positionGroup` ordered by `sortOrder`. All edits are immediate mutations with optimistic UI + toast.

- [ ] **Step 6: Wire routes `/instructors`, `/rooms`; add nav items. Run tests + manual check against the API.**

- [ ] **Step 7: Commit** — `feat(admin): instructors, rooms, and spot-map management`.

---

## Task 6: Class templates, instances, and generation

**Files:**
- Create: `apps/admin/src/pages/ClassesPage.tsx` (Tabs: Templates | Instances)
- Create: `apps/admin/src/components/ClassTemplateFormDialog.tsx`, `apps/admin/src/components/RecurrenceEditor.tsx`, `apps/admin/src/components/ClassInstanceFormDialog.tsx`, `apps/admin/src/components/GenerateInstancesDialog.tsx`
- Modify: `apps/admin/src/routes.tsx`
- Test: `apps/admin/src/components/RecurrenceEditor.test.tsx`

**Interfaces:**
- Consumes: `api.classTemplates.*`, `api.classInstances.*`, `useInstructors`, `useRooms`.
- Produces: `RecurrenceEditor` (`value: { daysOfWeek: number[]; startTime: string; startDate: string; endDate: string }`, `onChange`) — a 7 weekday toggle row + time + two date inputs; emits the exact JSON shape the API's `RecurrenceRuleDto` expects. Consumed only here but isolated for testing.

- [ ] **Step 1: Write the failing `RecurrenceEditor` test** — clicking "Tue" and "Thu", setting time `18:00`, dates → `onChange` last call equals `{ daysOfWeek: [2,4], startTime: '18:00', startDate: '...', endDate: '...' }`. Also: selecting no weekday shows a validation hint and does not emit.

- [ ] **Step 2: Implement `RecurrenceEditor`.**

- [ ] **Step 3: `ClassTemplateFormDialog`** — name, type select, instructor select, room select, duration, intensity select, capacity, `<RecurrenceEditor>`, active toggle. Create/edit via hooks.

- [ ] **Step 4: Templates tab** — `DataTable` (name, type, instructor, room, capacity, recurrence summary e.g. "Mon/Wed 18:00", active badge). Actions: Edit, Deactivate (`ConfirmDialog`), **Generate instances** → `GenerateInstancesDialog` (through-date picker → `api.classInstances.generate`; toast "N classes created").

- [ ] **Step 5: `ClassInstanceFormDialog`** — for one-off create and single-instance edit: instructor/room/capacity overrides, `substitute` toggle, `bookableFrom` datetime, start time. Guardrail: capacity field shows current `bookedCount` and blocks submit below it (mirrors the API 400).

- [ ] **Step 6: Instances tab** — date-range filter (default: next 14 days), `DataTable` (start time, name, instructor, room, `booked/capacity`, waitlist count, status). Actions: Edit, Cancel class (`ConfirmDialog`, warns that booked members are affected). Row click → `/schedule/:id` (Task 7).

- [ ] **Step 7: Route `/classes`, nav item. Tests + manual check. Commit** — `feat(admin): class templates, instances, recurrence generation`.

---

## Task 7: Schedule week view + Class detail / Roster + attendance + add-booking

**Files:**
- Create: `apps/admin/src/pages/SchedulePage.tsx`, `apps/admin/src/pages/ClassDetailPage.tsx`
- Create: `apps/admin/src/components/WeekGrid.tsx`, `apps/admin/src/components/RosterTable.tsx`, `apps/admin/src/components/AddBookingDialog.tsx`, `apps/admin/src/components/MemberSearchCombobox.tsx`
- Modify: `apps/admin/src/routes.tsx` (make `/schedule` the index route)
- Test: `apps/admin/src/components/RosterTable.test.tsx`

**Interfaces:**
- Consumes: `api.classInstances.list({ from, to, instructorId, roomId })`, `api.bookings.forClass(id)`, `api.bookings.book`, `api.bookings.cancel`, `api.attendance.checkIn/markNoShow`, `api.users.list({ role: 'member', q })`, `api.spots.listForRoom`.
- Produces: `RosterTable` (`{ bookings, room, onCheckIn, onNoShow, onCancel, isMutating }`) — splits rows into Booked / Waitlisted / Resolved sections, shows spot label, attendee (member name or `guestName` + "guest" tag), status badge, and per-row action buttons disabled while mutating.

- [ ] **Step 1: `SchedulePage` + `WeekGrid`** — week navigator (prev/this/next), instructor + room `<Select>` filters (persisted in URL search params), 7 day columns, class cards (`surface`, `line` border, time in `eyebrow`, name, instructor, `booked/capacity` with a thin fill bar, waitlist count if any, `danger` tint if cancelled). Card click → `/schedule/:id`.

- [ ] **Step 2: Write the failing `RosterTable` test** — given a booked booking and a waitlisted one, renders two sections; clicking "Check in" on the booked row calls `onCheckIn(bookingId)`; a `no_show` booking appears under Resolved with no action buttons.

- [ ] **Step 3: Implement `RosterTable`.**

- [ ] **Step 4: `ClassDetailPage`** — class header (editable via the Task 6 dialog), capacity/waitlist summary, `<RosterTable>` wired to the attendance + cancel mutation hooks (toasts; the cancel toast surfaces `wasLateCancellation`). "Add booking" button → `AddBookingDialog`.

- [ ] **Step 5: `MemberSearchCombobox` + `AddBookingDialog`** — debounced member search (`api.users.list`), optional spot `<Select>` (only shown when `room.hasAssignedSpots`, options from `api.spots.listForRoom` minus taken), submit → `api.bookings.book({ classInstanceId, spotId })` on behalf of the chosen member. Surface API errors (waiver not signed, spot taken, class full → waitlisted) inline.

- [ ] **Step 6: Make `/schedule` the index route; keep `/schedule/:id`. Nav "Schedule" active by default. Tests + manual check. Commit** — `feat(admin): schedule week view, roster, check-in, manual booking`.

---

## Task 8: Reports dashboard

**Files:**
- Create: `apps/admin/src/pages/ReportsPage.tsx`
- Create: `apps/admin/src/components/StatCard.tsx`, `apps/admin/src/components/DateRangePicker.tsx`
- Modify: `apps/admin/src/routes.tsx`
- Test: `apps/admin/src/pages/ReportsPage.test.tsx`

**Interfaces:**
- Consumes: `api.reports.attendanceRate(range)`, `api.reports.noShowRate(range)`, `api.reports.bookingsPerClass(range)`.
- Produces: `StatCard` (`{ label, value, sublabel }`), `DateRangePicker` (`{ from, to, onChange }`, presets: last 7/30 days, this month).

- [ ] **Step 1: Write the failing `ReportsPage` test** — mock the three report calls; assert the attendance-rate card renders `"80%"` from `{ attended: 8, totalResolved: 10, rate: 0.8 }`, and the bookings-per-class table renders one row per class with a booked/capacity bar.

- [ ] **Step 2: Implement `StatCard`, `DateRangePicker`, `ReportsPage`** — three `StatCard`s (attendance rate %, no-show rate %, total resolved bookings), then a `DataTable` of bookings-per-class (name, start, `booked/capacity` bar, waitlist, attended, no-show), sortable by start / fill. Rates formatted as whole-number percentages; "no data yet" empty state.

- [ ] **Step 3: Route `/reports`, nav item. Test + manual check. Commit** — `feat(admin): reports dashboard`.

---

## Task 9: Announcements + Settings + Playwright smoke + README

**Files:**
- Create: `apps/admin/src/pages/AnnouncementsPage.tsx`, `apps/admin/src/pages/SettingsPage.tsx`
- Create: `apps/admin/src/components/AnnouncementFormDialog.tsx`
- Create: `apps/admin/e2e/smoke.spec.ts`, `apps/admin/playwright.config.ts`
- Create: `apps/admin/README.md`
- Modify: `apps/admin/src/routes.tsx`, `apps/admin/package.json` (playwright dep + `e2e` script)
- Test: the Playwright smoke test is the test for this task.

**Interfaces:**
- Consumes: `api.announcements.list/create/remove`, `api.settings.get/update`.
- Produces: nothing consumed downstream (final admin task).

- [ ] **Step 1: `AnnouncementsPage`** — `DataTable` (title, created date, author), "New announcement" → `AnnouncementFormDialog` (title, body textarea), row Delete (`ConfirmDialog`).

- [ ] **Step 2: `SettingsPage` (admin-only route via `<RequireStaff role="admin">` variant)** — a `surface` form card: cancellation window hours, waitlist auto-promote cutoff hours, offer TTL minutes, max seats per booking — number inputs with helper text; Save → `api.settings.update`; toast.

- [ ] **Step 3: Add `Settings` nav item, admin-only (hidden for `staff`). Wire `/announcements`, `/settings` routes.**

- [ ] **Step 4: Playwright config + smoke test**

```bash
npm --workspace apps/admin install -D @playwright/test
npx --workspace apps/admin playwright install chromium
```
`apps/admin/e2e/smoke.spec.ts`: start from `/login`, sign in as `admin@studio.test / password123` (against a locally-running API + seeded DB), assert the schedule week view renders, open the first class card, assert the roster table appears. `playwright.config.ts` `webServer` boots `npm run dev` on 5173.

- [ ] **Step 5: Run the smoke test**

```bash
cd apps/api && npm run seed && npm run start:dev &   # terminal 1
npm --workspace apps/admin run e2e                     # terminal 2
```
Expected: PASS.

- [ ] **Step 6: Write `apps/admin/README.md`** — prereqs, `VITE_API_URL`, `npm --workspace apps/admin run dev`, test commands, the fact that it needs `apps/api` running + seeded, and the seed logins.

- [ ] **Step 7: Commit** — `feat(admin): announcements, settings, playwright smoke, README`.

---

## Self-review notes

- **Spec coverage:** screens 1–10 → Tasks 4 (login/shell), 5 (instructors/rooms/spots), 6 (classes), 7 (schedule/roster/check-in/add-booking), 8 (reports), 9 (announcements/settings). Backend changes → Task 1. Design tokens → Task 2. API client → Task 3. ✓
- **Member app** is intentionally a separate plan (`2026-08-27-phase2-member.md`), written after this one is signed off.
- **Type consistency:** `api.*` method names in Tasks 5–9 all match the `createClient` namespaces defined in Task 3's Interfaces block. `RecurrenceEditor`'s emitted shape matches `apps/api`'s `RecurrenceRuleDto`.
- **Deferred vs done:** no credit/notification UI anywhere; `SettingsPage` covers only the four fields that exist on `studio_settings`.
