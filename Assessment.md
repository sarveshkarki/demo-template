# APAX Technical Assessment — Frontend Submission

This submission covers the **Frontend assessment only (Task A + Task B)**

I have not made changes to the Backend or Blockchain sections. Where the frontend work depends on something that is currently missing or needs a backend change, I have called that out below.

## One dependency added: TanStack Query

I added `@tanstack/react-query` as the only new dependency.

The existing project already uses Zustand for client-side state, so I kept that for things such as the current user/session and the existing mocked portfolio data. For API data, I used TanStack Query instead of adding more loading/error state to the Zustand store.

This is mainly useful for the API calls because it gives us loading, error, retry and caching behavior without having to implement all of that manually.

The login request now uses `useMutation`, and I also added a `useHoldingsQuery()` hook as the starting point for Task B. The holdings hook is not connected to the dashboard yet because the backend does not currently have a `GET /api/holdings` endpoint.

---

# Task A — Real Login Flow

## What changed

### `web/lib/auth-store.ts`

Added a separate Zustand store for authentication.

It stores:

- `token`
- `user`
- `isAuthenticated`

The store uses Zustand's `persist` middleware to keep the session in `localStorage`.

I kept this separate from the existing `useAPAXStore` because authentication/session state is different from the mocked portfolio and vault state already in the application.

There is also a small storage guard because this is a Next.js application and `localStorage` is not available during server rendering.

### `web/app/providers.tsx` and `web/app/layout.tsx`

Added a `QueryClientProvider` at the application root so TanStack Query can be used throughout the app.

### `web/lib/services/base.api.ts`

Updated the API helper to support generic responses through `ApiResponse<T>`.

It now:

- Reads the stored JWT when available.
- Sends it as `Authorization: Bearer <token>`.
- Handles fetch/JSON errors in one place.
- Supports requests to different API paths.

I also separated the underlying `apiFetch()` function from `baseAPI()`. Existing `/user` API calls can continue using `baseAPI()`, while endpoints such as `/api/holdings` can use `apiFetch()` directly.

### `web/lib/services/login.api.ts`

Added proper TypeScript types for the login response.

The response matches the backend structure:

```text
{
  success,
  user,
  token
}
```

I also added a `toAuthUser()` mapper so the rest of the frontend doesn't need to work directly with the full MongoDB user object.

### `web/app/login/page.tsx`

Replaced the previous mocked/commented login handler with the actual API call.

The main changes are:

- Login now uses TanStack Query's `useMutation`.
- `isPending` controls the existing loading spinner.
- On successful login, the JWT and user are saved using `setAuth()`.
- The user is redirected to `/dashboard`.
- Fixed the existing `/dashbaord` typo.
- Login errors are shown in an inline error message instead of using `alert()`.

The API helper already converts failed requests into a `{ success: false, message }` response, so the mutation does not need another try/catch just to handle normal API errors.

### `web/app/dashboard/page.tsx`

Added a client-side authentication check.

If there is no authenticated session, the user is redirected back to `/login`.

The check waits until the component has mounted because the session is stored in `localStorage`, which is not available during SSR.

### `web/components/app-sidebar.tsx`

The user information in the sidebar was previously hardcoded as:

- `John Doe`
- `client@apax.institutional`

It now uses the authenticated user's information.

The sign-out button also now clears the session and redirects to `/login`.

### `web/components/views/dashboard-view.tsx`

Updated the welcome message so it also uses the authenticated user rather than the hardcoded user information.

---

## Flagged: Cookie vs Bearer Token

There is currently a mismatch between how the backend creates the token and how the frontend can use it.

`src/utils/sendToken.ts` sends the JWT in two places:

1. As an `httpOnly` cookie.
2. As `token` in the JSON response.

The frontend cannot read the `httpOnly` cookie using JavaScript, so the frontend currently uses the token returned in the JSON response and sends it as:

```text
Authorization: Bearer <token>
```

However, the current backend authentication middleware in:

```text
src/middlewares/user_actions/auth.ts
```

only checks `req.cookies.token` and does not check the `Authorization` header.

So the frontend and backend are currently using different authentication mechanisms.

This needs to be fixed on the backend.

### Recommended approach

I would keep the `httpOnly` cookie and also allow the backend middleware to accept a Bearer token.

That gives the application two useful options while keeping the cookie protected from direct JavaScript access.

The alternative would be to remove the `httpOnly` approach and rely entirely on a frontend-readable cookie, but I would prefer not to do that because of the security trade-off.

---

## Flagged: `User.getJWTToken()` is not implemented

`src/models/userModel.ts` defines:

```text
getJWTToken(): string
```

on the `IUser` interface, but the method is not currently implemented on the schema.

`src/utils/sendToken.ts` calls:

```text
user.getJWTToken()
```

which means the backend login flow will currently fail at runtime.

This belongs to the Backend assessment, so I have not changed it here.

Because of this, the frontend login flow cannot currently be tested end-to-end against the repository's actual backend until `getJWTToken()` and the MongoDB setup are completed.

I tested the frontend separately with a small local stand-in login endpoint to verify the frontend flow.

---

## Not implemented

I did not add a redirect from `/login` to `/dashboard` when an already-authenticated user visits the login page.

This is a small improvement but is not required for the assessment, so I left it out to keep the changes focused.

---

# Task B — Dashboard API Integration

The main target for Task B is the Dashboard view:

```text
components/views/dashboard-view.tsx
```

This includes:

- `PortfolioOverview`
- `AssetAllocationChart`

The Proof of Reserve view's **Live Security Feed** is also part of the planned API integration.

At the moment, these views use data from `useAPAXStore`, which is populated with mock data.

I have set up the API/service layer and query hook needed to move this data to the backend once the relevant endpoints are available.

## Approach

I did not want to rewrite the existing dashboard components just to change where the data comes from.

The existing components already know how to display:

```text
userHoldings
auditLogs
```

So the idea is to keep those components mostly unchanged and change where the data is populated.

The flow becomes:

```text
Backend API
    ↓
API service
    ↓
TanStack Query
    ↓
Zustand store
    ↓
Existing dashboard components
```

This keeps the current UI structure intact while allowing the source of the data to change from mock data to real API data.

---

## Holdings API

### `web/lib/services/holdings.api.ts`

Added the API service for the planned:

```text
GET /api/holdings
```

The response has its own backend-facing type:

```text
HoldingsResponseData {
  gold: number;
  silver: number;
  platinum: number;
  updatedAt: string;
}
```

This is intentionally separate from the existing `UserHolding` type used by the UI.

A mapper such as `toUserHolding()` can then convert the API response into the format the existing dashboard expects.

This keeps backend changes isolated to the API/service layer instead of spreading backend-specific fields throughout the UI.

### `web/lib/hooks/use-holdings.ts`

Added `useHoldingsQuery()` using TanStack Query's `useQuery`.

It provides:

- `data`
- `isPending`
- `isError`
- `error`
- `refetch`

The hook is not connected to the dashboard yet because the backend endpoint does not currently exist.

The file contains the intended integration approach for when the endpoint becomes available.

---

## Activity API

The same pattern can be used for:

```text
GET /api/activity
```

The service would return the backend activity data and map it into the existing `auditLogs` format used by the Proof of Reserve view.

I have not added the actual service yet because there is currently no backend endpoint to connect to.

---

## Loading, empty and error states

The dashboard should not silently show incorrect or empty data while an API request is running.

For holdings, the intended behaviour is:

### Loading

Show skeleton placeholders in the portfolio cards.

### Error

Show a small error message and a retry button.

TanStack Query already provides `refetch()` for this.

### Empty

If the API returns zero holdings, show:

```text
No holdings yet
```

instead of displaying several `$0.00` values without any explanation.

The same approach can be used for the activity list:

- Skeleton rows while loading.
- `No recent activity yet` when there is no activity.
- An error message with retry when the request fails.

---

## Keeping the TypeScript types separate

I kept the API response types separate from the existing UI types.

For example, the backend might return values in a format that does not exactly match what the dashboard needs.

The API layer can handle that conversion in one place:

```text
Backend response
      ↓
API type
      ↓
Mapper
      ↓
UI type
```

---

Testing the login flow without the APAX backend

Since the backend login endpoint was not working correctly, I added a small temporary mock server in:

mock-login-server.js

This is only intended for testing the frontend login flow and does not change the actual frontend authentication implementation.

To run it, open a separate terminal from the project root and run:

node mock-login-server.js

It starts a local server on:

http://localhost:4000

The mock server implements the same:

POST /user/login

endpoint expected by the frontend.

For a successful login, use:

Email: test@apax.com
Password: password123

The mock server returns a response containing a test JWT and user object, which allows the frontend flow to be tested:

Login
↓
API request
↓
Loading state
↓
Successful response
↓
JWT + user stored
↓
Redirect to /dashboard

I also tested the failed-login case using incorrect credentials to verify that the inline error message is displayed.

The mock server is a separate development/testing file and is not intended to be used as part of the actual application backend.
