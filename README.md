# Real-Time Collaborative Task Board

A production-grade Kanban board with real-time collaboration, drag-and-drop, and conflict resolution.

![Board Preview](https://img.shields.io/badge/Stack-Next.js%20%2B%20Express%20%2B%20Socket.IO-blue)

## Features

- **Real-time sync** — Changes propagate instantly to all connected users via WebSocket
- **Drag-and-drop** — Move tasks between To Do, In Progress, and Done columns
- **Inline editing** — Click any task to edit title/description in-place
- **Conflict resolution** — Optimistic concurrency control prevents data loss
- **Presence indicators** — See who's editing what (colored borders + lock icons)
- **Offline mode** — Queue actions while disconnected, replay on reconnect
- **Fractional indexing** — O(1) reordering without shifting other rows

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript |
| State | Zustand |
| Drag & Drop | @hello-pangea/dnd |
| Backend | Express, Socket.IO |
| Database | PostgreSQL (hosted on Render) |
| ORM | Prisma 5 |
| Validation | Zod |

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database (or a Render instance)

### Backend

```bash
cd server
npm install
cp .env.example .env  # Configure DATABASE_URL
npx prisma db push
npm run dev
```

### Frontend

```bash
cd client
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

> **⚠️ Cold Start Warning:** If using Render's free tier, the first request may take 30-60 seconds while the service spins up. Subsequent requests are instant.

## Project Structure

```
├── server/                 # Express + Socket.IO backend
│   ├── prisma/
│   │   └── schema.prisma   # Task model with version + orderKey
│   └── src/
│       ├── index.ts         # Server entry point
│       ├── lib/fractional.ts    # Fractional indexing algorithm
│       ├── services/TaskService.ts  # Business logic + OCC
│       ├── socket/SocketHandler.ts  # WebSocket event handlers
│       ├── routes/taskRoutes.ts     # REST endpoints
│       └── validation/schemas.ts    # Zod schemas
│
├── client/                 # Next.js frontend
│   └── src/
│       ├── app/             # Next.js App Router pages
│       ├── components/      # Board, TaskCard, CreateTaskModal
│       ├── store/           # Zustand state management
│       ├── lib/             # Socket client, fractional indexing
│       └── types/           # TypeScript interfaces
│
├── DESIGN.md               # Architecture decisions
└── README.md               # This file
```

## Environment Variables

### Server (`server/.env`)
```
DATABASE_URL=postgresql://user:pass@host:5432/dbname
PORT=3001
```

### Client (`client/.env.local`)
```
NEXT_PUBLIC_SERVER_URL=http://localhost:3001
```

## Architecture

See [DESIGN.md](./DESIGN.md) for details on:
- Fractional indexing for O(1) reordering
- Optimistic concurrency control
- Socket.IO event protocol
- Presence & locking system
- Offline replay queue

## License

MIT
