# Gate 1 Evidence: Server-Side RBAC Rejection

**Date:** 2026-09-20  
**Feature:** F2 Admin Panel RBAC  
**PR:** #4

---

## 1. Server-Side Guards Documentation

### Guard Layer 1: Next.js Middleware

**File:** `middleware.ts` (root level)

**How it works:**
- Runs on Edge Runtime before any page/API route
- Intercepts ALL `/admin/*` requests via matcher config
- Validates JWT session cookie server-side using `jose` library
- Checks `role` claim in JWT payload
- **Rejection behavior:**
  - No token → 302 redirect to `/login?redirect=/admin`
  - Invalid token → 302 redirect to `/login?redirect=/admin`
  - Valid token but role ≠ 'ADMIN' → 302 redirect to `/403`

**Code location:** Lines 10-35 in `middleware.ts`

```typescript
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('session')?.value;

    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const verified = await jwtVerify(token, JWT_SECRET);
      const payload = verified.payload;

      if (payload.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/403', request.url));
      }

      return NextResponse.next();
    } catch {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
```

**Server-side proof:**
- Uses `jwtVerify` from `jose` - cryptographic verification
- Runs before React components load
- No client JavaScript needed for rejection
- Edge Runtime = pre-rendering protection

---

### Guard Layer 2: Server Component Layout

**File:** `app/admin/layout.tsx`

**How it works:**
- React Server Component (RSC) - executes server-side only
- Calls `getSession()` which reads cookies via `next/headers` (server-only API)
- Validates session and checks role
- **Rejection behavior:**
  - No session → `redirect('/login?redirect=/admin')` (HTTP 307)
  - Valid session but role ≠ 'ADMIN' → `redirect('/403')` (HTTP 307)

**Code location:** Lines 16-26 in `app/admin/layout.tsx`

```typescript
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/login?redirect=/admin');
  }

  if (session.role !== 'ADMIN') {
    redirect('/403');
  }
  // ... render admin UI
}
```

**Server-side proof:**
- `getSession()` uses `cookies()` from `next/headers` (server-only)
- `redirect()` from `next/navigation` - server-side navigation
- Layout never renders client-side for unauthorized users
- Children components never mount if guard fails

---

## 2. Live Server Tests

### Test Environment Setup

**Database seeded with:**
- `admin@demo.local` (role: ADMIN)
- `dealer@demo.local` (role: DEALER)
- `user@demo.local` (role: USER)

**All accounts use password:** `admin123`

---

### Test 1: No Authentication (No Session Cookie)

**Request:**
```bash
curl -i http://localhost:3000/admin
```

**Expected:** 307 Redirect to `/login`

**Actual Result:**
```
HTTP/1.1 307 Temporary Redirect
location: /login?redirect=%2Fadmin
Date: Sun, 20 Sep 2026 14:28:09 GMT
Connection: keep-alive
Keep-Alive: timeout=5
Transfer-Encoding: chunked

/login?redirect=%2Fadmin
```

**✅ PASS:** Unauthenticated request rejected server-side with redirect

---

### Test 2: DEALER Role (Non-ADMIN)

**Step 1 - Login as dealer:**
```bash
curl -i -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dealer@demo.local","password":"admin123"}' \
  -c cookies-dealer.txt
```

**Response:**
```
HTTP/1.1 200 OK
vary: rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch
content-type: application/json
set-cookie: session=eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJhOTFmZWUxMy1jZTU2LTRkMTgtYjgwZS04NmExOTdlNDExZjciLCJlbWFpbCI6ImRlYWxlckBkZW1vLmxvY2FsIiwicm9sZSI6IkRFQUxFUiIsImlhdCI6MTc4OTkxNDQ5NSwiZXhwIjoxNzkwNTE5Mjk1fQ.KIHECJtrGF1_N6RN6MSYaE4UTOgSi13YztPygs8ZzQc; Path=/; Expires=Sun, 27 Sep 2026 14:28:15 GMT; Max-Age=604800; HttpOnly; SameSite=lax
Date: Sun, 20 Sep 2026 14:28:15 GMT

{"user":{"id":"a91fee13-ce56-4d18-b80e-86a197e411f7","email":"dealer@demo.local","name":"Bayii Kullanıcı","role":"DEALER"}}
```

**JWT Payload (decoded):**
```json
{
  "userId": "a91fee13-ce56-4d18-b80e-86a197e411f7",
  "email": "dealer@demo.local",
  "role": "DEALER",
  "iat": 1789914495,
  "exp": 1790519295
}
```

**Step 2 - Attempt to access /admin with DEALER session:**
```bash
curl -i http://localhost:3000/admin -b cookies-dealer.txt
```

**Expected:** 307 Redirect to `/403`

**Actual Result:**
```
HTTP/1.1 307 Temporary Redirect
location: /403
Date: Sun, 20 Sep 2026 14:28:20 GMT
Connection: keep-alive
Keep-Alive: timeout=5
Transfer-Encoding: chunked

/403
```

**✅ PASS:** DEALER session rejected server-side, redirected to 403

**Step 3 - Attempt to access /admin/pricerules with DEALER session:**
```bash
curl -i http://localhost:3000/admin/pricerules -b cookies-dealer.txt
```

**Actual Result:**
```
HTTP/1.1 307 Temporary Redirect
location: /403
Date: Sun, 20 Sep 2026 14:28:25 GMT
Connection: keep-alive
Keep-Alive: timeout=5
Transfer-Encoding: chunked

/403
```

**✅ PASS:** Admin sub-route also rejected for DEALER

---

### Test 3: USER Role (Non-ADMIN)

**Step 1 - Login as user:**
```bash
curl -i -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@demo.local","password":"admin123"}' \
  -c cookies-user.txt
```

**Response:**
```
HTTP/1.1 200 OK
vary: rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch
content-type: application/json
set-cookie: session=eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiI2OWJhOTEyOS1mMWQxLTQzMzQtOTZlMi05NTNjMWNhNWRlNWYiLCJlbWFpbCI6InVzZXJAZGVtby5sb2NhbCIsInJvbGUiOiJVU0VSIiwiaWF0IjoxNzg5OTE0NTA5LCJleHAiOjE3OTA1MTkzMDl9.wexc22eGw4nQkr2MfqFxfb0dl8UIvlhTAcpJVq_uGBg; Path=/; Expires=Sun, 27 Sep 2026 14:28:29 GMT; Max-Age=604800; HttpOnly; SameSite=lax
Date: Sun, 20 Sep 2026 14:28:29 GMT

{"user":{"id":"69ba9129-f1d1-4334-96e2-953c1ca5de5f","email":"user@demo.local","name":"Normal Kullanıcı","role":"USER"}}
```

**JWT Payload (decoded):**
```json
{
  "userId": "69ba9129-f1d1-4334-96e2-953c1ca5de5f",
  "email": "user@demo.local",
  "role": "USER",
  "iat": 1789914509,
  "exp": 1790519309
}
```

**Step 2 - Attempt to access /admin with USER session:**
```bash
curl -i http://localhost:3000/admin -b cookies-user.txt
```

**Actual Result:**
```
HTTP/1.1 307 Temporary Redirect
location: /403
Date: Sun, 20 Sep 2026 14:28:34 GMT
Connection: keep-alive
Keep-Alive: timeout=5
Transfer-Encoding: chunked

/403
```

**✅ PASS:** USER session rejected server-side, redirected to 403

---

### Test 4: ADMIN Role (Authorized)

**Step 1 - Login as admin:**
```bash
curl -i -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.local","password":"admin123"}' \
  -c cookies-admin.txt
```

**Response:**
```
HTTP/1.1 200 OK
vary: rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch
content-type: application/json
set-cookie: session=eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiI3MjAzODM4ZC0wZDBjLTQxMjAtYjE5ZS0zZWMyMTU1NTMzOWEiLCJlbWFpbCI6ImFkbWluQGRlbW8ubG9jYWwiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3ODk5MTQ1MTgsImV4cCI6MTc5MDUxOTMxOH0.jKc2787RpK9y723O-_UF8dW5VeHZkOYIxhViRseREjQ; Path=/; Expires=Sun, 27 Sep 2026 14:28:38 GMT; Max-Age=604800; HttpOnly; SameSite=lax
Date: Sun, 20 Sep 2026 14:28:38 GMT

{"user":{"id":"7203838d-0d0c-4120-b19e-3ec21555339a","email":"admin@demo.local","name":"Admin Kullanıcı","role":"ADMIN"}}
```

**JWT Payload (decoded):**
```json
{
  "userId": "7203838d-0d0c-4120-b19e-3ec21555339a",
  "email": "admin@demo.local",
  "role": "ADMIN",
  "iat": 1789914518,
  "exp": 1790519318
}
```

**Step 2 - Access /admin with ADMIN session:**
```bash
curl -I http://localhost:3000/admin -b cookies-admin.txt
```

**Actual Result:**
```
HTTP/1.1 200 OK
Vary: rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch, Accept-Encoding
link: </_next/static/css/app/layout.css?v=1789914529764>; rel=preload; as="style"
Cache-Control: no-store, must-revalidate
X-Powered-By: Next.js
Content-Type: text/html; charset=utf-8
Date: Sun, 20 Sep 2026 14:28:49 GMT
Connection: keep-alive
Keep-Alive: timeout=5
```

**✅ PASS:** ADMIN session accepted, page rendered (200 OK with HTML content)

---

## 3. Evidence Summary

### Server-Side Rejection Proof

| Test Case | Session | Route | HTTP Status | Result |
|-----------|---------|-------|-------------|--------|
| No auth | None | `/admin` | **307 → /login** | ✅ Rejected |
| DEALER | Valid (DEALER) | `/admin` | **307 → /403** | ✅ Rejected |
| DEALER | Valid (DEALER) | `/admin/pricerules` | **307 → /403** | ✅ Rejected |
| USER | Valid (USER) | `/admin` | **307 → /403** | ✅ Rejected |
| ADMIN | Valid (ADMIN) | `/admin` | **200 OK** | ✅ Allowed |

### Key Evidence Points

1. ✅ **Middleware exists:** `middleware.ts` with Edge Runtime JWT validation
2. ✅ **Server guard exists:** `app/admin/layout.tsx` with RSC session validation
3. ✅ **HTTP-level rejection:** 307 redirects (not client-side navigation)
4. ✅ **Role enforcement:** DEALER and USER both blocked with same 403 redirect
5. ✅ **No client JS needed:** Rejection happens before any React hydration
6. ✅ **HttpOnly cookies:** Session token not accessible to client JavaScript
7. ✅ **Double-layer protection:** Middleware + Layout guard (defense in depth)

---

## 4. Frontend Catalog Coefficient Format

**Confirmed:** Frontend will consume catalog coefficient as **string** format.

**Examples:**
- `"1.10"` (not `1.1` or `1.10` as number)
- `"1.05"` (not `1.05` as number)
- `"2.50"` (not `2.5` or `2.50` as number)

**Rationale:**
- Matches money/coefficient contract formatting
- Prevents floating-point precision issues
- Consistent with financial data handling
- Allows exact decimal representation

**Implementation note:** When catalog GET endpoints are implemented by PE team, Frontend will parse these as strings and display/use them without converting to JavaScript numbers for calculations that require precision.

---

## Appendix: Test Execution Logs

The tests above were executed against a running Next.js dev server with the following setup:

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Run Prisma migration
npx prisma migrate dev --name add-role-enum

# Terminal 3: Seed test users
npx tsx scripts/seed-admin.ts

# Terminal 4: Execute curl tests
# (commands shown in test sections above)
```

All tests completed successfully with expected HTTP status codes and redirect behaviors.

---

## Conclusion

**Gate 1 Requirements: ✅ MET**

1. ✅ Middleware + Server layout guards documented
2. ✅ Live HTTP tests prove server-side rejection (307 redirects)
3. ✅ Evidence captured with status codes
4. ✅ Catalog coefficient string format confirmed

The RBAC implementation correctly rejects non-ADMIN users at the HTTP layer before any client-side code executes.
