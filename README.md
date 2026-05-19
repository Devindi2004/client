# DineFlow

DineFlow is an AI-powered smart restaurant ordering and management frontend built with Next.js App Router, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Zustand, Axios, Recharts, Socket.IO client, Sonner, and PayHere-ready checkout utilities.

## Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

For production checks:

```bash
npm run lint
npm run build
```

## Environment

Copy `.env.example` to `.env.local` and fill in real values.

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
NEXT_PUBLIC_DINEFLOW_URL=http://localhost:3000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=replace-with-a-long-random-secret
JWT_REFRESH_SECRET=replace-with-another-long-random-secret
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM="DineFlow <noreply@dineflow.com>"
```

No payment secrets should be exposed in the frontend. PayHere production signing must happen on the backend.

## Frontend Routes

- `/` - premium DineFlow landing page
- `/menu?table=5&restaurant=rest123` - QR-aware customer menu
- `/checkout` - cart checkout with customer details and mock payment
- `/tracking` - customer order tracking list
- `/tracking/[orderId]` - order status detail
- `/profile` - customer profile and loyalty preview
- `/kitchen` - kitchen order board with Socket.IO-ready structure
- `/admin` - admin overview
- `/admin/analytics` - full analytics dashboard with Recharts
- `/login` and `/register` - auth pages
- `/check-email` and `/verify-email` - email verification flow

## Backend Endpoints Expected

The frontend gracefully falls back to mock data when backend routes are unavailable.

- `GET /api/menu`
- `GET /api/orders`
- `POST /api/orders`
- `PATCH /api/orders/:id`
- `GET /api/analytics?range=7d`
- `GET /api/inventory/alerts`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/auth/verify-email?token=...`
- `POST /api/auth/resend-verification`

## Architecture Notes

- Cart state lives in `hooks/use-cart.ts` using Zustand persistence.
- API clients and fallback services live in `lib/api.ts` and `lib/services/*`.
- Mock customer and kitchen orders live in `lib/data/orders.ts`.
- ER-diagram Mongoose models live in `lib/models/*`.
- The customer menu UI is preserved and extended only for QR table detection and checkout routing.
- Realtime kitchen/customer updates are prepared through Socket.IO client wiring and can be connected by setting `NEXT_PUBLIC_SOCKET_URL`.
