# DineFlow Frontend

DineFlow is a Next.js + TypeScript restaurant ordering and management frontend for RAD coursework. It connects to the Express API, uses JWT authentication, protected routes, Redux Toolkit slices, responsive TailwindCSS UI, Socket.IO-ready updates, and Recharts analytics.

## Tech Stack

- Next.js, React, TypeScript
- TailwindCSS, shadcn-style UI components, lucide-react
- Axios with JWT interceptor and refresh flow
- Redux Toolkit: `authSlice`, `menuSlice`, `cartSlice`, `orderSlice`, `inventorySlice`
- Recharts, Socket.IO client

## Setup

```bash
npm install
npm run dev
```

Frontend: `http://localhost:3000`

Copy `.env.example` to `.env.local`:

```env
NEXT_PUBLIC_DINEFLOW_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

Backend secrets such as `MONGO_URI`, `JWT_SECRET`, and `JWT_REFRESH_SECRET` belong only in the backend project.

## Main Routes

- `/menu` - customer menu using backend menu data
- `/checkout` - protected customer checkout that creates MongoDB orders
- `/tracking` and `/tracking/[orderId]` - protected customer order tracking
- `/profile` - protected customer profile
- `/kitchen` - kitchen/admin order board
- `/admin` and `/admin/analytics` - admin dashboard with real analytics
- `/login` and `/register` - JWT authentication

## Backend Connection

The Axios client uses `NEXT_PUBLIC_API_URL` and sends:

```http
Authorization: Bearer <token>
```

It calls `POST /auth/refresh` once after an expired access token and clears the session if refresh fails.

## Demo Users

- Admin: `admin@dineflow.local` / `Admin12345`
- Kitchen: `kitchen@dineflow.local` / `Kitchen12345`
- Customer: `customer@dineflow.local` / `Customer12345`

## Deployment

Vercel:
- Build command: `npm run build`
- Output: Next.js default
- Env vars:
  - `NEXT_PUBLIC_API_URL=https://your-backend/api/v1`
  - `NEXT_PUBLIC_SOCKET_URL=https://your-backend`
  - `NEXT_PUBLIC_DINEFLOW_URL=https://your-vercel-app`

Backend: deploy the `server` project to Render or Railway.
Database: use MongoDB Atlas and set `MONGO_URI` in the backend only.

## Screenshots

Add screenshots for the menu, checkout, order tracking, kitchen board, and admin analytics dashboard here before submission.

## Deployed URLs

- Frontend: `https://your-frontend-url`
- Backend API: `https://your-backend-url/api/v1`
